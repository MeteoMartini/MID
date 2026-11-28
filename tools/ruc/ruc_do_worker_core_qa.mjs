/**
 * MID RUC: offline SQLite Durable-Object SQL-API CORE, never a production
 * Worker or endpoint. QA methods only; no Cloudflare credentials/network.
 * Uses sql.exec() + transactionSync() contracts from Cloudflare.
 */
const RUN=/^20\d\d-\d\d-\d\dT\d\d:00$/;
const HEX=/^[a-f0-9]{64}$/, SHA40=/^[a-f0-9]{40}$/;
const KEY=/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,80}$/;
const MAX_SEGMENT=4_000_000,MAX_RUN_BYTES=780_000_000; // +15% reserve < 900MB
const MAX_OBJECTS=50,MAX_RANGE=4_000_000,MAX_FIELDS=12,MAX_CHUNKS=25000;
function check(ok,why){if(!ok)throw Error("DO QA BLOCKED: "+why);}
export async function sha256(b){
  const d=await crypto.subtle.digest("SHA-256",b instanceof Uint8Array?b:new Uint8Array(b));
  return Array.from(new Uint8Array(d),v=>v.toString(16).padStart(2,"0")).join("");
}
function rows(sql,s,...p){return sql.exec(s,...p).toArray();}
export function validateManifest(m){
  check(m?.schema==="mid.ruc.do-offline-manifest.v1","unknown manifest");
  check(typeof m.run==="string" && RUN.test(m.run) && !Number.isNaN(Date.parse(m.run+":00Z")) &&
    new Date(m.run+":00Z").toISOString().slice(0,16)===m.run,"invalid UTC");
  check(SHA40.test(m.sourceSha||"") && HEX.test(m.sourceProofSha256||""),"unverified source lineage");
  check(m.horizonHours===27 && m.timeCount===28 && m.epsMemberCount===20 && m.nativeEpsIncluded===true,
    "native 27h/EPS20 incomplete");
  check(Number.isSafeInteger(m.pointCount)&&m.pointCount>0&&m.pointCount<=542040,"invalid native grid");
  check(Array.isArray(m.objects)&&m.objects.length>=3&&m.objects.length<=MAX_OBJECTS,"unbounded objects");
  let total=0,chunks=0;const used=new Set();
  for(const o of m.objects){
    check(KEY.test(o.key||"")&&!used.has(o.key),"unsafe/duplicate key");
    used.add(o.key);
    check(HEX.test(o.sha256||"")&&Number.isSafeInteger(o.bytes)&&o.bytes>0,"unknown file size/digest");
    check(Array.isArray(o.segments)&&o.segments.length>0&&o.segments.length<=500,"bad segments");
    let length=0;
    for(const sg of o.segments){
      check(Number.isSafeInteger(sg.bytes)&&sg.bytes>0&&sg.bytes<=MAX_SEGMENT&&HEX.test(sg.sha256||""),
        "bad segment bytes/hash");length+=sg.bytes;
    }
    check(length===o.bytes,"segment inventory incomplete");
    check(Array.isArray(o.chunks)&&o.chunks.length>0&&o.chunks.length<=MAX_CHUNKS,"missing chunk index");
    let encoded=0,decoded=0;
    for(const ch of o.chunks){
      check(ch.offset===encoded&&Number.isSafeInteger(ch.bytes)&&ch.bytes>0&&ch.bytes<=MAX_RANGE &&
        Number.isSafeInteger(ch.rawBytes)&&ch.rawBytes>0&&ch.rawBytes<=MAX_RANGE &&
        HEX.test(ch.sha256||"")&&HEX.test(ch.rawSha256||""),"bad native chunk geometry/SHA");
      encoded+=ch.bytes;decoded+=ch.rawBytes;
    }
    check(encoded===o.bytes && Number.isSafeInteger(o.recordBytes)&&o.recordBytes>0 &&
      decoded===o.recordBytes*m.pointCount,"bad native point record geometry");
    total+=o.bytes;chunks+=o.chunks.length;
  }
  for(const key of ["deterministic.bin.zlib","eps-summary.bin.zlib","eps-members.bin.zlib"])
    check(used.has(key),"mandatory source/EPS file absent");
  check(total>0&&total<=MAX_RUN_BYTES&&chunks<=MAX_CHUNKS,"per-run 780MB safety cap");
  return total;
}
export class RucRunCoreQa{
  constructor(ctx){
    check(ctx?.storage?.sql?.exec && ctx?.storage?.transactionSync,"SQL/transaction interface required");
    this.ctx=ctx;this.sql=ctx.storage.sql;
    this.sql.exec("CREATE TABLE IF NOT EXISTS run_state(id INTEGER PRIMARY KEY CHECK(id=1),run TEXT NOT NULL,manifest TEXT NOT NULL,bytes_written INTEGER NOT NULL,sealed INTEGER NOT NULL,receipt TEXT)");
    this.sql.exec("CREATE TABLE IF NOT EXISTS segments(name TEXT NOT NULL,part INTEGER NOT NULL,payload BLOB NOT NULL,PRIMARY KEY(name,part)) WITHOUT ROWID");
  }
  state(){return rows(this.sql,"SELECT run,manifest,bytes_written,sealed,receipt FROM run_state WHERE id=1")[0]||null;}
  beginQa(m){
    validateManifest(m);
    return this.ctx.storage.transactionSync(()=>{
      check(!this.state(),"run object already assigned");
      this.sql.exec("INSERT INTO run_state VALUES(1,?,?,0,0,NULL)",m.run,JSON.stringify(m));
      return {run:m.run,qaOnly:true,activationAuthorized:false};
    });
  }
  async putSegmentQa(name,index,bytes){
    const initial=this.state();check(initial&&!initial.sealed,"run not stageable");
    const manifest=JSON.parse(initial.manifest),obj=manifest.objects.find(x=>x.key===name);
    check(obj&&Number.isSafeInteger(index)&&index>=0&&index<obj.segments.length,"unlisted segment");
    const part=obj.segments[index];
    check(bytes instanceof Uint8Array&&bytes.length===part.bytes&&bytes.length<=MAX_SEGMENT,"wrong segment size");
    check(await sha256(bytes)===part.sha256,"segment SHA mismatch");
    return this.ctx.storage.transactionSync(()=>{
      const now=this.state();check(now&&!now.sealed,"run sealed mid-write");
      check(rows(this.sql,"SELECT length(payload) AS n FROM segments WHERE name=? AND part=?",name,index).length===0,
        "segment cannot overwrite");
      check(now.bytes_written+bytes.length<=MAX_RUN_BYTES,"run exceeds 780MB cap");
      this.sql.exec("INSERT INTO segments VALUES(?,?,?)",name,index,bytes);
      this.sql.exec("UPDATE run_state SET bytes_written=bytes_written+? WHERE id=1",bytes.length);
      return {name,index,bytes:bytes.length,qaOnly:true};
    });
  }
  async sealQa(){
    const s=this.state();check(s&&!s.sealed,"not staging");
    const m=JSON.parse(s.manifest),size=validateManifest(m);
    check(s.bytes_written===size,"incomplete staged bytes");
    const actual=rows(this.sql,"SELECT name,part,length(payload) AS bytes FROM segments");
    check(actual.length===m.objects.reduce((n,x)=>n+x.segments.length,0),"missing segment");
    for(const o of m.objects)for(let i=0;i<o.segments.length;i++){
      const item=actual.find(x=>x.name===o.key&&x.part===i);
      check(item?.bytes===o.segments[i].bytes,"altered/missing segment");
      // Size parity is NOT content parity: re-read every stored SQL BLOB
      // against the signed segment SHA before advancing seal/pointer.
      const stored=rows(this.sql,"SELECT payload AS data FROM segments WHERE name=? AND part=?",o.key,i)[0]?.data;
      check(stored?.byteLength===o.segments[i].bytes,"sealed SQL segment missing/changed");
      check(await sha256(stored)===o.segments[i].sha256,"sealed segment SHA mismatch");
    }
    const digest=await sha256(new TextEncoder().encode(JSON.stringify(m)));
    return this.ctx.storage.transactionSync(()=>{
      const now=this.state();check(now&&!now.sealed&&now.bytes_written===size,"stale seal");
      this.sql.exec("UPDATE run_state SET sealed=1,receipt=? WHERE id=1",digest);
      return {run:m.run,sourceSha:m.sourceSha,proof:digest,qaOnly:true,productionApproved:false};
    });
  }
  getSealReceiptQa(){
    const s=this.state();if(!s?.sealed)return null;
    const m=JSON.parse(s.manifest);
    return {run:m.run,sourceSha:m.sourceSha,proof:s.receipt,qaOnly:true,productionApproved:false};
  }
  readRangeQa(key,offset,length){
    const s=this.state();check(s?.sealed===1,"unsealed run");
    const m=JSON.parse(s.manifest),obj=m.objects.find(x=>x.key===key);
    check(obj&&Number.isSafeInteger(offset)&&offset>=0&&Number.isSafeInteger(length)&&
      length>0&&length<=MAX_RANGE&&offset+length<=obj.bytes,"invalid SQL byte range");
    let position=offset,remain=length,parts=[];
    while(remain>0){
      let begin=0,idx=-1,skip=0;
      for(let i=0;i<obj.segments.length;i++){
        const sg=obj.segments[i];
        if(position>=begin&&position<begin+sg.bytes){idx=i;skip=position-begin;break;}
        begin+=sg.bytes;
      }
      check(idx>=0,"unindexed SQL segment");
      const take=Math.min(obj.segments[idx].bytes-skip,remain);
      const record=rows(this.sql,"SELECT substr(payload,?,?) AS data FROM segments WHERE name=? AND part=?",
        skip+1,take,key,idx)[0];
      check(record?.data?.byteLength===take,"missing/truncated SQL BLOB range");
      parts.push(new Uint8Array(record.data));position+=take;remain-=take;
    }
    const output=new Uint8Array(length);let done=0;
    for(const p of parts){output.set(p,done);done+=p.length;}
    return output;
  }
  async readCellsQa(cell,fields=["deterministic.bin.zlib","eps-summary.bin.zlib","eps-members.bin.zlib"]){
    const s=this.state();check(s?.sealed===1,"run not sealed");
    const m=JSON.parse(s.manifest);
    check(Number.isSafeInteger(cell)&&cell>=0&&cell<m.pointCount,"invalid cell");
    check(Array.isArray(fields)&&fields.length>=1&&fields.length<=MAX_FIELDS&&
      new Set(fields).size===fields.length,"invalid product batch");
    const out={run:m.run,sourceSha:m.sourceSha,cell,products:{},qaOnly:true,productionApproved:false};
    for(const key of fields){
      const file=m.objects.find(x=>x.key===key);check(file,"unlisted product");
      const position=cell*file.recordBytes;let rawOffset=0,found=null;
      for(const ch of file.chunks){
        if(position>=rawOffset&&position+file.recordBytes<=rawOffset+ch.rawBytes){
          found={ch,start:position-rawOffset};break;
        }
        rawOffset+=ch.rawBytes;
      }
      check(found,"native record crosses chunk boundary");
      const compressed=this.readRangeQa(key,found.ch.offset,found.ch.bytes);
      check(await sha256(compressed)===found.ch.sha256,"compressed chunk SHA mismatch");
      const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate"));
      const original=new Uint8Array(await new Response(stream).arrayBuffer());
      check(original.length===found.ch.rawBytes&&await sha256(original)===found.ch.rawSha256,
        "decoded chunk SHA mismatch");
      out.products[key]=Array.from(original.slice(found.start,found.start+file.recordBytes));
    }
    return out;
  }
}
export class RucCoordinatorCoreQa{
  constructor(ctx,env){
    check(ctx?.storage?.transactionSync&&ctx?.storage?.sql?.exec,"atomic SQL interface required");
    this.ctx=ctx;this.sql=ctx.storage.sql;this.env=env;
    this.sql.exec("CREATE TABLE IF NOT EXISTS pointer(id INTEGER PRIMARY KEY CHECK(id=1),generation INTEGER NOT NULL,run TEXT NOT NULL,proof TEXT NOT NULL)");
  }
  activeQa(){return rows(this.sql,"SELECT generation,run,proof FROM pointer WHERE id=1")[0]||{generation:0,run:null,proof:null};}
  async promoteQa(run,generation,claimedProof){
    check(typeof run==="string"&&RUN.test(run)&&HEX.test(claimedProof||""),"invalid promotion");
    check(Number.isSafeInteger(generation)&&generation>=0,"invalid generation");
    check(this.env?.RUNS?.get&&this.env?.RUNS?.idFromName,"no actual remote run reader");
    const source=this.env.RUNS.get(this.env.RUNS.idFromName(run));
    const verified=await source.getSealReceiptQa();
    check(verified?.qaOnly===true&&verified.productionApproved===false&&verified.run===run &&
      verified.proof===claimedProof&&SHA40.test(verified.sourceSha||""),"receipt not verified by source DO");
    return this.ctx.storage.transactionSync(()=>{
      const now=this.activeQa();check(now.generation===generation,"stale pointer writer");
      check(!now.run||run>now.run,"nonmonotonic run");
      if(now.generation===0)this.sql.exec("INSERT INTO pointer VALUES(1,1,?,?)",run,claimedProof);
      else this.sql.exec("UPDATE pointer SET generation=?,run=?,proof=? WHERE id=1",now.generation+1,run,claimedProof);
      return {...this.activeQa(),qaOnly:true,productionApproved:false};
    });
  }
}