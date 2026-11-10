/** Local workerd signed-ingestion evidence. Ed25519 PRIVATE key lives in this Node process only. */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {deflateSync} from "node:zlib";
import {Miniflare} from "miniflare";
import {sha256} from "./ruc_do_worker_core_qa.mjs";
import {signedManifestMessage} from "./ruc_do_attestation_qa.mjs";

function base64(b){return Buffer.from(b).toString("base64");}
const run="2026-11-09T14:00";
const signer=await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
const stranger=await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
const publicKey=base64(await crypto.subtle.exportKey("raw",signer.publicKey));
const entry=fileURLToPath(new URL("./ruc_do_workerd_signed_entry_qa.mjs",import.meta.url));
const mf=new Miniflare({
  modules:true,scriptPath:entry,compatibilityDate:"2026-07-30",
  bindings:{
    MID_DO_SIGNED_QA_LOCAL_ONLY:"MID-DO-SIGNED-LOCAL-QA-ONLY",
    TRUSTED_QA_ED25519_PUBLIC_KEY:publicKey,
  },
  durableObjects:{
    RUNS:{className:"RucAttestedRunQa",useSQLite:true},
    COORD:{className:"RucAttestedCoordinatorQa",useSQLite:true},
  },
});
function raw(n,seed){
  const a=new Uint8Array(n);
  for(let i=0;i<n;i+=2){
    let v=(i/2+seed)%65535;
    if(i===0)v=0;
    if(i===2)v=65535;
    a[i]=v&255;a[i+1]=v>>8;
  }
  return a;
}
async function makeDataset(modelRun=run){
  const products=[],files=[],segments=[];
  for(const [key,recordBytes,seed] of [
    ["deterministic.bin.zlib",56,7],
    ["eps-summary.bin.zlib",56,17],
    ["eps-members.bin.zlib",1120,37],
  ]){
    const original=raw(recordBytes*16,seed);
    const blocks=[],chunks=[];let pos=0;
    for(let cell=0;cell<16;cell++){
      const bytes=original.slice(cell*recordBytes,(cell+1)*recordBytes);
      const zipped=new Uint8Array(deflateSync(bytes,{level:6}));
      chunks.push({offset:pos,bytes:zipped.length,rawBytes:bytes.length,
        sha256:await sha256(zipped),rawSha256:await sha256(bytes)});
      blocks.push(zipped);pos+=zipped.length;
    }
    const compressed=new Uint8Array(pos);
    for(let i=0,offset=0;i<blocks.length;i++){
      compressed.set(blocks[i],offset);offset+=blocks[i].length;
    }
    files.push({key,recordBytes,bytes:pos,sha256:await sha256(compressed),
      chunks,segments:[{bytes:pos,sha256:await sha256(compressed)}]});
    segments.push({name:key,index:0,data:base64(compressed)});
    products.push({key,recordBytes,original});
  }
  return {
    manifest:{schema:"mid.ruc.do-offline-manifest.v1",run:modelRun,
      sourceSha:"c".repeat(40),sourceProofSha256:"b".repeat(64),
      horizonHours:27,timeCount:28,epsMemberCount:20,
      nativeEpsIncluded:true,pointCount:16,objects:files},
    segments,products,
  };
}

const pinnedReceipt=JSON.parse(await readFile(process.env.MID_RUC_PINNED_PROOF_RECEIPT,"utf8"));
assert.equal(pinnedReceipt.schema,"mid.ruc.do.original-proof-bridge-qa.v1");
assert.equal(pinnedReceipt.historicalProofMetadataPinnedAndCheckedNow,true);
assert.equal(pinnedReceipt.sourceChecksRecomputedFromOriginalBytesNow,false);
assert.equal(pinnedReceipt.dwdOfficialSignatureVerified,false);
assert.equal(pinnedReceipt.productionApproved,false);
assert.equal(pinnedReceipt.activationAuthorized,false);
function bindHistoricalMetadataOnly(manifest){
  manifest.sourceSha=pinnedReceipt.originalProducerSha;
  manifest.sourceProofSha256=pinnedReceipt.originalSourceArtifactSha256;
  manifest.historicalProofArchiveSha256=pinnedReceipt.proofArchiveSha256;
  manifest.historicalOriginalPayloadNotInWorkerdQa=true;
}
async function sign(manifest,key=signer.privateKey){
  assert.equal(manifest.sourceSha,pinnedReceipt.originalProducerSha,"untrusted producer SHA claim");
  assert.equal(manifest.sourceProofSha256,pinnedReceipt.originalSourceArtifactSha256,"untrusted source artifact claim");
  assert.equal(manifest.historicalProofArchiveSha256,pinnedReceipt.proofArchiveSha256,"wrong pinned original proof");
  assert.equal(manifest.historicalOriginalPayloadNotInWorkerdQa,true);
  const bytes=new TextEncoder().encode(await signedManifestMessage(manifest));
  return base64(await crypto.subtle.sign({name:"Ed25519"},key,bytes));
}
async function post(packet){
  const res=await mf.dispatchFetch("http://localhost/qa/ingest",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify(packet),
  });
  return {status:res.status,result:await res.json()};
}
try{
  const initial=await mf.dispatchFetch("http://localhost/qa/status");
  assert.equal((await initial.json()).active.generation,0);
  const fixture=await makeDataset();
  await assert.rejects(sign(fixture.manifest),/untrusted producer SHA claim/);
  bindHistoricalMetadataOnly(fixture.manifest);
  const authenticQaSig=await sign(fixture.manifest);
  const absent=await post({...fixture,signature:null});
  assert.equal(absent.status,422,"unverified manifest accepted");
  const forged=await post({...fixture,signature:await sign(fixture.manifest,stranger.privateKey)});
  assert.equal(forged.status,422,"unknown signer accepted");
  const mutated=structuredClone(fixture.manifest);
  mutated.sourceProofSha256="f".repeat(64);
  const changed=await post({manifest:mutated,segments:fixture.segments,signature:authenticQaSig});
  assert.equal(changed.status,422,"modified signed manifest accepted");
  const stillZero=await mf.dispatchFetch("http://localhost/qa/status");
  assert.equal((await stillZero.json()).active.generation,0,"failed signatures advanced pointer");
  const good=await post({manifest:fixture.manifest,segments:fixture.segments,signature:authenticQaSig});
  if(good.status!==200)throw Error("Signed real-workerd ingress: "+JSON.stringify(good));
  assert.equal(good.result.active.generation,1);
  assert.equal(good.result.productionApproved,false);
  const response=await mf.dispatchFetch("http://localhost/qa/cell?cell=7");
  assert.equal(response.status,200);
  const point=await response.json();
  for(const p of fixture.products)
    assert.deepEqual(point.products[p.key],Array.from(p.original.slice(7*p.recordBytes,8*p.recordBytes)),
      "native zero/NoData/EPS20 byte parity "+p.key);
  const replay=await post({manifest:fixture.manifest,segments:fixture.segments,signature:authenticQaSig});
  assert.equal(replay.status,422,"sealed run overwritten");
  const later=await makeDataset("2026-11-09T15:00");
  bindHistoricalMetadataOnly(later.manifest);
  const laterSig=await sign(later.manifest);
  const poisoned=structuredClone(later.segments);
  const poisonedBuffer=Buffer.from(poisoned[0].data,"base64");
  poisonedBuffer[0]^=1;
  poisoned[0].data=base64(poisonedBuffer);
  const tamper=await post({manifest:later.manifest,segments:poisoned,signature:laterSig});
  assert.equal(tamper.status,422,"signed manifest accepted corrupted compressed bytes");
  const after=await mf.dispatchFetch("http://localhost/qa/status");
  assert.equal((await after.json()).active.generation,1,"broken newer run displaced last-good");
  const old=await mf.dispatchFetch("http://localhost/qa/cell?cell=7");
  assert.equal(old.status,200);
  assert.equal((await old.json()).run,run);
  const result={schema:"mid.ruc.do.local-ed25519-admission.v1",
    workerdLocal:true,realEd25519:true,privateKeyInsideWorker:false,
    invalidSignatureRejected:true,untrustedSignerRejected:true,alteredManifestRejected:true,
    correctManifestAdmitted:true,missingDataAsZero:false,allPointBytesExact:true,
    immutableReplayRejected:true,corruptedNextRunRejected:true,lastGoodKept:true,
    sourceSynthetic:true,originalDwdIssuerVerified:false,
    originalProofMetadataPinnedInCi:true,originalDwdBytesNotSignedHere:true,
    productionApproved:false,activationAuthorized:false,cloudflareAccountTouched:false};
  console.log(JSON.stringify(result));
}finally{await mf.dispose();}
