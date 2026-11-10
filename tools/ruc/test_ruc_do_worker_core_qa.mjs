/** MID RUC Durable-Objects SQL API offline pilot: Node 22 REAL SQLite+BLOB+zlib, no Cloudflare. */
import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {deflateSync} from "node:zlib";
import {RucRunCoreQa,RucCoordinatorCoreQa,sha256} from "./ruc_do_worker_core_qa.mjs";
const dbs=[];
function makeSql(){
  const db=new DatabaseSync(":memory:");dbs.push(db);
  const sql={exec(query,...bind){
    const stmt=db.prepare(query);
    if(/^\s*(SELECT|PRAGMA|WITH)\b/i.test(query)){
      const a=stmt.all(...bind);return {toArray(){return a;}};
    }
    stmt.run(...bind);return {toArray(){return [];}};
  }};
  return {db,storage:{sql,transactionSync(fn){
    db.exec("BEGIN IMMEDIATE");
    try{const r=fn();db.exec("COMMIT");return r;}
    catch(e){db.exec("ROLLBACK");throw e;}
  }}};
}
function makeRaw(n,seed){
  const out=new Uint8Array(n);
  for(let i=0;i<n;i+=2){
    let v=(i/2+seed*101)%65535;
    if(i===0)v=0;if(i===2)v=65535;
    out[i]=v&255;out[i+1]=v>>8;
  }
  return out;
}
async function makeProduct(key,raw,pointCount,recordBytes){
  assert.equal(raw.byteLength,pointCount*recordBytes);
  const cellsPerBlock=Math.max(1,Math.floor(256/recordBytes));
  const chunks=[],blocks=[];let offset=0;
  for(let p=0;p<pointCount;p+=cellsPerBlock){
    const before=raw.slice(p*recordBytes,Math.min(pointCount,p+cellsPerBlock)*recordBytes);
    const zipped=new Uint8Array(deflateSync(before));
    chunks.push({offset,bytes:zipped.length,rawBytes:before.length,
      sha256:await sha256(zipped),rawSha256:await sha256(before)});
    blocks.push(zipped);offset+=zipped.length;
  }
  const file=new Uint8Array(offset);let pos=0;
  for(const bytes of blocks){file.set(bytes,pos);pos+=bytes.length;}
  const parts=[];
  // Intentionally small physical SQL segments for boundary-crossing tests.
  for(let o=0;o<file.length;o+=90){
    const data=file.slice(o,o+90);
    parts.push({bytes:data.length,sha256:await sha256(data),data});
  }
  return {key,raw,parts,desc:{
    key,recordBytes,bytes:file.length,sha256:await sha256(file),chunks,
    segments:parts.map(({bytes,sha256})=>({bytes,sha256}))
  }};
}
const BASE_RUN="2026-11-09T14:00",SOURCE_SHA="d".repeat(40),SOURCE_PROOF="e".repeat(64);
async function build(run=BASE_RUN){
  const pointCount=16;
  const products=[];
  for(const [key,data,recordBytes] of [
    ["deterministic.bin.zlib",makeRaw(pointCount*28*2,1),56],
    ["eps-summary.bin.zlib",makeRaw(pointCount*28*2,2),56],
    ["eps-members.bin.zlib",makeRaw(pointCount*28*20*2,3),1120]
  ])products.push(await makeProduct(key,data,pointCount,recordBytes));
  const manifest={schema:"mid.ruc.do-offline-manifest.v1",run,
    sourceSha:SOURCE_SHA,sourceProofSha256:SOURCE_PROOF,horizonHours:27,
    timeCount:28,epsMemberCount:20,nativeEpsIncluded:true,pointCount,
    objects:products.map(p=>p.desc)};
  const ctx=makeSql(),store=new RucRunCoreQa(ctx);
  return {ctx,store,manifest,products};
}
async function stage(s){
  s.store.beginQa(s.manifest);
  for(const p of s.products)for(let i=0;i<p.parts.length;i++)
    await s.store.putSegmentQa(p.key,i,p.parts[i].data);
  return s.store.sealQa();
}
const tests=[];
const test=(name,fn)=>tests.push([name,fn]);
test("real SQLite, 28h+20EPS, real zero and NoData sentinel byte-exact",async()=>{
  const s=await build();const receipt=await stage(s);
  assert.equal(receipt.qaOnly,true);
  for(const cell of [0,1,7,15]){
    const point=await s.store.readCellsQa(cell);
    for(const p of s.products)
      assert.deepEqual(point.products[p.key],Array.from(p.raw.slice(cell*p.desc.recordBytes,(cell+1)*p.desc.recordBytes)));
  }
  const eps=(await s.store.readCellsQa(0,["eps-members.bin.zlib"])).products["eps-members.bin.zlib"];
  assert.deepEqual(eps.slice(0,4),[0,0,255,255]);
});
test("incomplete EPS20 prevents seal and reads",async()=>{
  const s=await build();s.store.beginQa(s.manifest);
  await s.store.putSegmentQa(s.products[0].key,0,s.products[0].parts[0].data);
  await assert.rejects(s.store.sealQa(),/incomplete staged bytes/);
  await assert.rejects(s.store.readCellsQa(0),/not sealed/);
});
test("same-size poisoned bytes and duplicate SQL segment both denied",async()=>{
  const s=await build();s.store.beginQa(s.manifest);
  const data=s.products[0].parts[0].data,poison=data.slice();poison[0]^=1;
  await assert.rejects(s.store.putSegmentQa(s.products[0].key,0,poison),/segment SHA mismatch/);
  await s.store.putSegmentQa(s.products[0].key,0,data);
  await assert.rejects(s.store.putSegmentQa(s.products[0].key,0,data),/cannot overwrite/);
});
test("tampered post-seal compressed SQL BLOB denied by digest",async()=>{
  const s=await build();await stage(s);
  const name=s.products[0].key,prior=s.ctx.db.prepare("SELECT payload FROM segments WHERE name=? AND part=0").get(name).payload;
  const poison=prior.slice();poison[0]^=1;
  s.ctx.db.prepare("UPDATE segments SET payload=? WHERE name=? AND part=0").run(poison,name);
  await assert.rejects(s.store.readCellsQa(0,[name]),/compressed chunk SHA mismatch/);
});
test("coordinator confirms read-only sealed remote receipt and fences stale writers",async()=>{
  const ctx=makeSql(),runs=new Map(),ns={idFromName:r=>r,get:r=>runs.get(r)};
  const coord=new RucCoordinatorCoreQa(ctx,{RUNS:ns});
  const s=await build(),a=await stage(s);runs.set(a.run,s.store);
  await assert.rejects(coord.promoteQa(a.run,0,"f".repeat(64)),/receipt not verified/);
  assert.equal(coord.activeQa().generation,0);
  assert.equal((await coord.promoteQa(a.run,0,a.proof)).generation,1);
  await assert.rejects(coord.promoteQa(a.run,0,a.proof),/stale pointer writer/);
  const next=await build("2026-11-09T15:00"),b=await stage(next);
  runs.set(b.run,next.store);
  assert.equal((await coord.promoteQa(b.run,1,b.proof)).generation,2);
  await assert.rejects(coord.promoteQa(a.run,2,a.proof),/nonmonotonic run/);
  assert.equal(coord.activeQa().run,b.run);
});
test("simulated SQLITE_FULL rejects insert atomically; last-good unchanged",async()=>{
  const ctx=makeSql(),runs=new Map(),ns={idFromName:r=>r,get:r=>runs.get(r)};
  const coord=new RucCoordinatorCoreQa(ctx,{RUNS:ns});
  const s=await build(),a=await stage(s);runs.set(a.run,s.store);
  await coord.promoteQa(a.run,0,a.proof);
  const other=await build("2026-11-09T15:00");other.store.beginQa(other.manifest);
  const old=other.ctx.storage.sql.exec;
  other.ctx.storage.sql.exec=(query,...args)=>{
    if(query.startsWith("INSERT INTO segments"))throw Error("SQLITE_FULL");
    return old(query,...args);
  };
  await assert.rejects(other.store.putSegmentQa(other.products[0].key,0,other.products[0].parts[0].data),/SQLITE_FULL/);
  assert.equal(other.store.state().bytes_written,0);
  assert.equal(other.store.getSealReceiptQa(),null);
  assert.equal(coord.activeQa().run,a.run);
});
test("invalid EPS20, cell bounds, duplicate product requests denied",async()=>{
  const s=await build(),changed=structuredClone(s.manifest);
  changed.epsMemberCount=19;
  assert.throws(()=>s.store.beginQa(changed),/native 27h\/EPS20 incomplete/);
  await stage(s);
  for(const cell of [-1,16,1.5])await assert.rejects(s.store.readCellsQa(cell),/invalid cell/);
  await assert.rejects(s.store.readCellsQa(0,["eps-members.bin.zlib","eps-members.bin.zlib"]),/invalid product batch/);
  await assert.rejects(s.store.readCellsQa(0,["invented.bin.zlib"]),/unlisted product/);
});
test("one run object immutable after sealing; cannot accept second model run",async()=>{
  const s=await build();await stage(s);
  await assert.rejects(s.store.putSegmentQa(s.products[0].key,0,s.products[0].parts[0].data),/run not stageable/);
  const other=await build("2026-11-09T15:00");
  assert.throws(()=>s.store.beginQa(other.manifest),/run object already assigned/);
});
let passed=0;
try{
  for(const [name,fn] of tests){await fn();console.log("PASS",name);passed++;}
  console.log(JSON.stringify({schema:"mid.ruc.do-core-offline-qa.v1",tests:passed,passed:true,
    realSqlite:true,realBinaryCompression:true,realDwdSource:false,cloudflareRuntime:false,
    productionApproved:false,activationAuthorized:false}));
}finally{for(const db of dbs)db.close();}
