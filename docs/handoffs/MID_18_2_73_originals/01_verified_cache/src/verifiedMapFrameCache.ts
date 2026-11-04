/**
 * MID map warm-resume cache: only SHA-verified immutable RUC/native D2 files.
 * Every app opening MUST refetch /ruc/latest.json and validate the new manifest.
 * This cache is never a data source for model run, valid time or QC metadata.
 */
export const MID_MAP_CACHE_NAME = 'mid-verified-ruc-fields-v1';
export const MID_MAP_CACHE_TTL_MS = 20 * 60_000;
export const MID_MAP_CACHE_MAX_BYTES = 24 * 1024 * 1024;
const MAX_ITEM_BYTES = 12 * 1024 * 1024;
const MAX_ITEMS = 18;
const CACHE_SHA = 'mid_frame_sha256';
const TIMESTAMP_HEADER = 'x-mid-verified-cached-at';
const ram = new Map<string, {at:number;bytes:Uint8Array}>();

function isSha(s:string):boolean{return /^[0-9a-f]{64}$/.test(s)}
function safeFrameUrl(url:string):URL {
  const resolved = new URL(url, location.href);
  if (resolved.origin!==location.origin || resolved.search || resolved.hash ||
      !/^\/ruc\/runs\/[a-zA-Z0-9_-]+\/(?:model-fields|model-fields-native|ruc-model-fields|model-fields-ruc)\/[a-zA-Z0-9_/-]+\.(?:json|bin)$/.test(resolved.pathname) ||
      resolved.pathname.includes('..')) throw new Error('Untrusted map-frame origin or path');
  return resolved;
}
function keyFor(url:URL,sha:string):string{const copy=new URL(url.href);copy.searchParams.set(CACHE_SHA,sha);return copy.toString()}
async function checkBytes(bytes:ArrayBuffer,sha:string,length:number):Promise<boolean>{
  if(bytes.byteLength!==length||!globalThis.crypto?.subtle)return false;
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===sha;
}
async function cacheOrNull():Promise<Cache|null>{
 try{return typeof caches!=='undefined' ? await caches.open(MID_MAP_CACHE_NAME):null}catch{return null}
}
function copy(bytes:Uint8Array):ArrayBuffer {return new Uint8Array(bytes).buffer}
async function purge(cache:Cache):Promise<void>{
 const entries=await cache.keys();let total=0;const valid:{request:Request;at:number;size:number}[]=[];
 for(const req of entries){
  const response=await cache.match(req);
  const at=Number(response?.headers.get(TIMESTAMP_HEADER));
  const size=Number(response?.headers.get('content-length'));
  if(!response||!Number.isFinite(at)||at<=0||Date.now()-at> MID_MAP_CACHE_TTL_MS||
    !Number.isInteger(size)||size<1||size>MAX_ITEM_BYTES){await cache.delete(req);continue}
  total+=size;valid.push({request:req,at,size});
 }
 valid.sort((a,b)=>a.at-b.at);
 while(valid.length>MAX_ITEMS||total>MID_MAP_CACHE_MAX_BYTES){const old=valid.shift();if(!old)break;total-=old.size;await cache.delete(old.request)}
}
/** Read cached verified bytes or fetch, SHA-check and cache. No stale-if-error fallback. */
export async function fetchVerifiedMapFrameBytes(path:string,expectedSha256:string,expectedBytes:number,signal?:AbortSignal):Promise<ArrayBuffer>{
 const sha=String(expectedSha256||'').toLowerCase(),url=safeFrameUrl(path);
 if(!isSha(sha)||!Number.isInteger(expectedBytes)||expectedBytes<1||expectedBytes>MAX_ITEM_BYTES)throw new Error('Untrusted map-frame hash/size');
 if(signal?.aborted)throw signal.reason??new Error('Aborted');
 const key=keyFor(url,sha),existing=ram.get(key);
 if(existing&&Date.now()-existing.at<=MID_MAP_CACHE_TTL_MS&&existing.bytes.byteLength===expectedBytes){
   const cloned=copy(existing.bytes);
   if(await checkBytes(cloned,sha,expectedBytes)){if(signal?.aborted)throw signal.reason??new Error('Aborted');return cloned}
   ram.delete(key);
 }
 const store=await cacheOrNull();
 if(store){
  try{
   const response=await store.match(key),at=Number(response?.headers.get(TIMESTAMP_HEADER));
   if(response&&Number.isFinite(at)&&at>0&&Date.now()-at<=MID_MAP_CACHE_TTL_MS){
    const content=await response.arrayBuffer();
    if(await checkBytes(content,sha,expectedBytes)){
      ram.set(key,{at,bytes:new Uint8Array(content.slice(0))});
      if(signal?.aborted)throw signal.reason??new Error('Aborted');
      return content;
    }
   }
   if(response)await store.delete(key);
  }catch{/* Browsers can evict or deny CacheStorage. Network remains available. */}
 }
 if(signal?.aborted)throw signal.reason??new Error('Aborted');
 const response=await fetch(url.toString(),{signal,cache:'default',redirect:'error'});
 if(!response.ok)throw new Error('Verified map frame unavailable');
 const declared=response.headers.get('content-length');
 if(declared!==null&&(!/^\d+$/.test(declared)||Number(declared)!==expectedBytes))throw new Error('Map-frame transport length mismatch');
 const data=await response.arrayBuffer();
 if(!await checkBytes(data,sha,expectedBytes))throw new Error('Map-frame SHA mismatch');
 if(signal?.aborted)throw signal.reason??new Error('Aborted');
 const now=Date.now();ram.set(key,{at:now,bytes:new Uint8Array(data.slice(0))});
 while(ram.size>MAX_ITEMS)ram.delete(ram.keys().next().value!);
 if(store){
  try{await store.put(key,new Response(data.slice(0),{status:200,headers:{'content-length':String(expectedBytes),[TIMESTAMP_HEADER]:String(now)}}));await purge(store)}catch{/* Optional cache. No user settings/other caches are touched. */}
 }
 return data;
}
/** Invoked on explicit storage-cleanup, not on normal app startup. */
export async function clearVerifiedMapFrameCache():Promise<void>{ram.clear();try{await caches.delete(MID_MAP_CACHE_NAME)}catch{}}
