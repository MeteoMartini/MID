/** Isolated read-only probe. Never consumes or changes production RUC metadata. */
import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';
import {CANARY_MANIFEST, CANARY_MANIFEST_SHA} from './lossless_canary_manifest.generated.mjs';
const RUC_CANARY_BASE='https://midwx.app/diagnostics/ruc-codec-v1/';
async function readRucCanaryResponse(response,limit){
 if(!response.ok||!response.body)throw Error('RUC canary: HTTP '+response.status);
 const reader=response.body.getReader(),parts=[];let count=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>limit)throw Error('RUC canary: response exceeds bound');parts.push(value)}}catch(error){await reader.cancel().catch(()=>{});throw error}finally{reader.releaseLock()}
 const bytes=new Uint8Array(count);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}return bytes;
}
async function rucCanarySha(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')}
/** base is supplied only by the diagnostic harness; Worker route always uses fixed origin. */
export async function runRucTransportCanary(base=RUC_CANARY_BASE){
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(new DOMException('RUC canary deadline','TimeoutError')),20000);
 const fetchCanary=async(key,limit)=>{const response=await fetch(new URL(key,base),{signal:abort.signal,cache:'no-store'});return {bytes:await readRucCanaryResponse(response,limit),headers:response.headers}};
 try{
  const index=await fetchCanary('index.json',8192);if(await rucCanarySha(index.bytes)!==CANARY_MANIFEST_SHA)throw Error('RUC canary: manifest SHA mismatch');
  const original=await fetchCanary(CANARY_MANIFEST.raw.key,CANARY_MANIFEST.raw.bytes);
  if(original.bytes.length!==CANARY_MANIFEST.raw.bytes||await rucCanarySha(original.bytes)!==CANARY_MANIFEST.raw.sha256)throw Error('RUC canary: original SHA/length mismatch');
  const expected=new Uint8Array(65536*2),words=new DataView(expected.buffer);for(let i=0;i<65536;i++)words.setUint16(i*2,i,true);
  const rows=[];
  for(const {key,manifest} of CANARY_MANIFEST.candidates){
   const start=performance.now(),fetched=await fetchCanary(key,manifest.encodedBytes),decoded=await decodeRucLosslessCandidate(manifest,fetched.bytes);
   if(decoded.length!==expected.length||decoded.some((value,i)=>value!==expected[i]))throw Error('RUC canary: byte equality mismatch');
   rows.push({codec:manifest.codec,receivedBytes:fetched.bytes.length,decodedBytes:decoded.length,contentEncoding:fetched.headers.get('content-encoding')||'identity',etag:fetched.headers.get('etag'),cacheControl:fetched.headers.get('cache-control'),verified:true,fetchAndDecodeMs:Math.round((performance.now()-start)*100)/100});
  }
  return {schema:CANARY_MANIFEST.schema,synthetic:true,productionEnabled:false,legacyRawSha256:CANARY_MANIFEST.raw.sha256,originalSha256:CANARY_MANIFEST.candidates[0].manifest.decodedSha256,int16Patterns:65536,missingSentinelPreserved:true,rawContentEncoding:original.headers.get('content-encoding')||'identity',candidates:rows};
 }finally{clearTimeout(timer)}
}
