/* MID read-only Pages admission of a SHA-bound full 27h/EPS20 and Fast 0..6h pair.
 * A successful spot readback is NOT a full-site attestation, writer authority,
 * production activation or real client SLO. No R2/Pages mutation exists here.
 */
import {validatePointer} from './ruc_fast_cas.mjs';
import {readPagedFastPointShadow} from './ruc_fast_paged_point_shadow.mjs';

const BASE = 'https://midwx.app/ruc/';
const RUN = /^20\d\d-\d\d-\d\dT\d\d:00$/;
function must(ok,msg) { if (!ok) throw new Error(msg); }
function dateOf(run) {
  must(typeof run==='string'&&RUN.test(run),'noncanonical full original UTC run');
  const v=Date.parse(run+'Z');
  must(Number.isFinite(v)&&new Date(v).toISOString().slice(0,16)===run,'invalid full original UTC calendar');
  return v;
}
async function hex(bytes) {
  must(bytes instanceof Uint8Array&&bytes.length>0&&bytes.length<=8_000_000,'unbounded or absent original bytes');
  must(globalThis.crypto?.subtle,'cryptographic SHA-256 unavailable');
  const hash=await globalThis.crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
function limitOf(path) {
  if(path==='latest.json')return 8_000_000;
  if(path==='fast/paged-shadow.json')return 3_000_000;
  must(/^fast\/pages\/\d{8}T\d{4}\/(lookup|deterministic|rapid-5m|rapid-15m)\/\d{4}\.bin$/.test(path),
       'untrusted or nonimmutable Fast Pages path');
  return 512*168;
}
/* Canonical public site only; no user URL, redirects, credentials or caching.
 * The body is consumed in bounded chunks, not an unchecked arrayBuffer().
 */
export async function fetchCanonicalPublicRucBytes(path,fetchImpl=globalThis.fetch) {
  const maximum=limitOf(path);
  must(typeof fetchImpl==='function','public Pages fetch unavailable');
  const url=new URL(path,BASE);
  must(url.origin==='https://midwx.app'&&url.pathname==='/ruc/'+path,'public Pages origin/path drift');
  const response=await fetchImpl(url.toString(),{
    method:'GET',redirect:'error',cache:'no-store',
    credentials:'omit',signal:AbortSignal.timeout(12_000),
    headers:{'Accept':'application/json, application/octet-stream;q=0.9'}
  });
  must(response?.status===200&&response.ok===true&&response.url===url.toString(),
       'untrusted/redirected public Pages HTTP result');
  const reported=response.headers?.get('content-length');
  if(reported!==null&&reported!==undefined){
    must(/^\d+$/.test(reported)&&Number(reported)>0&&Number(reported)<=maximum,
         'overbudget original public Pages Content-Length');
  }
  must(typeof response.body?.getReader==='function','missing bounded public Pages response body');
  const chunks=[];let total=0;
  const reader=response.body.getReader();
  try {
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      must(value instanceof Uint8Array,'invalid public Pages byte stream');
      total+=value.byteLength;
      must(total<=maximum,'overbudget public Pages body');
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  must(total>0,'empty public Pages body is not NoData');
  const bytes=new Uint8Array(total);
  let cursor=0;
  for(const part of chunks){bytes.set(part,cursor);cursor+=part.length;}
  return bytes;
}
function parseOriginal(bytes) {
  let row;
  try {row=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch(error){throw new Error('invalid original public RUC JSON', {cause:error});}
  must(row&&row.schema==='mid.dwd.ruc.grid.v2'&&row.storageProfile==='pages-lossless-v1',
       'public full RUC schema/storage profile mismatch');
  must(row.pointCount===542040,'native full RUC point count mismatch');
  const run=dateOf(row.run);
  const axis=Array.from({length:28},(_,i)=>new Date(run+i*3600_000).toISOString().slice(0,16));
  must(JSON.stringify(row.deterministic?.times)===JSON.stringify(axis),
       'missing native full 0..27h valid-time axis');
  must(row.eps?.memberCount===20&&JSON.stringify(row.eps?.times)===JSON.stringify(axis),
       'full 27h EPS20 original temporal integrity mismatch');
  must(row.epsSummary&&typeof row.epsSummary==='object','canonical EPS summary omitted');
  return row;
}
/* Exactly one real physical public point is proven (manifest + four chunks),
 * not all 542040 native cells, not all 4300 Fast chunks, not a real app adoption.
 * The pointer must be authenticated by the protected release channel first.
 */
export async function verifyPublicFastShadowReadback(pointer,read,gridIndex) {
  validatePointer(pointer);
  must(pointer.mode==='shadow','active pointers cannot bootstrap their own public admission');
  must(typeof read==='function'&&Number.isInteger(gridIndex)&&gridIndex>=0&&gridIndex<964*596,
       'invalid trusted public readback settings');
  const seen=[];
  const exact=async path=>{
    const cap=limitOf(path);
    const bytes=await read(path);
    must(bytes instanceof Uint8Array&&bytes.length>0&&bytes.length<=cap,
         'untrusted/missing public Pages bytes '+path);
    seen.push(path);
    return bytes;
  };
  const original=await exact('latest.json');
  must(await hex(original)===pointer.primaryManifestSha256,
       'public full RUC pointer SHA does not match protected offline original');
  const full=parseOriginal(original);
  must(full.run===pointer.primaryRun,'live original 27h run changed under Fast pointer');
  const manifest=await exact('fast/paged-shadow.json');
  must(await hex(manifest)===pointer.fastManifestSha256,
       'public Fast manifest SHA does not match approved original');
  const cell=await readPagedFastPointShadow(
    manifest,pointer.fastManifestSha256,async key=>exact(key),gridIndex
  );
  must(cell.available===true,'public sample point unavailable, cannot assert positive readback');
  must(cell.modelRunUtc.slice(0,16)===pointer.fastRun,'public native Fast run changed');
  must(cell.productionAuthorized===false&&cell.consumerAdoptionVerified===false&&cell.epsAvailable===false,
       'public readback is falsely claiming Fast production or EPS');
  // Re-read both entrypoints after chunks to detect mid-readoverwritten
  // mutable pointers. This is only a race guard for this sample: it does NOT
  // amount to a global Pages/R2 transaction or 4300-chunk publication proof.
  const fullAgain=await exact('latest.json');
  must(await hex(fullAgain)===pointer.primaryManifestSha256,
       'public full pointer changed during native Fast readback');
  const fastAgain=await exact('fast/paged-shadow.json');
  must(await hex(fastAgain)===pointer.fastManifestSha256,
       'public Fast manifest changed during native Fast readback');
  must(seen.length===8&&new Set(seen).size===6,
       'public spot readback incomplete; expected 2 entrypoints twice plus 4 chunks');
  return Object.freeze({
    schema:'mid.ruc.fast-public-shadow-spot-readback.v1',
    primaryRunUtc:pointer.primaryRun,fastRunUtc:pointer.fastRun,
    primaryManifestSha256:pointer.primaryManifestSha256,
    fastManifestSha256:pointer.fastManifestSha256,
    offlineSiteSha256NotPubliclyVerified:pointer.siteSha256,
    publicFilesReadbackShaVerified:6,nativeBinaryChunksVerified:4,
    sampledGridIndex:gridIndex,modelHourCount:cell.hours.length,
    fiveMinuteTerms:cell.rapid5Minutes.length,fifteenMinuteTerms:cell.rapid15Minutes.length,
    epsOriginalMetadataMembers:full.eps.memberCount,
    shaBoundMetadataAndSampleVerified:true,
    actualPublicHttpReadback:false,
    allPublicPagesObjectsVerified:false,
    globalCasVerified:false,productionAuthorized:false,
    realClientAdoptionVerified:false,sixtyMinuteP95Verified:false
  });
}

/* Only this wrapper uses the fixed HTTPS origin fetcher. No caller-supplied
 * resolver can silently convert a local mock to an "HTTP readback" assertion.
 * A successful run is still a spot check, not global release authority.
 */
export async function verifyCanonicalPublicFastShadowHttp(pointer,gridIndex){
  const report=await verifyPublicFastShadowReadback(
    pointer,path=>fetchCanonicalPublicRucBytes(path),gridIndex
  );
  return Object.freeze({...report,actualPublicHttpReadback:true});
}
