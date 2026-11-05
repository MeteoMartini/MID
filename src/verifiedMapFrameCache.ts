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
const pending = new Map<string, {controller:AbortController;promise:Promise<ArrayBuffer>;users:number}>();
let diskWrites:Promise<void>=Promise.resolve();
const fresh=(at:number)=>Number.isFinite(at)&&at>0&&Date.now()-at>=0&&Date.now()-at<=MID_MAP_CACHE_TTL_MS;
function remember(key:string,bytes:ArrayBuffer,at:number){
 ram.delete(key);ram.set(key,{at,bytes:new Uint8Array(bytes.slice(0))});let total=0;
 for(const [id,entry] of ram){if(!fresh(entry.at))ram.delete(id);else total+=entry.bytes.byteLength}
 while(ram.size>MAX_ITEMS||total>MID_MAP_CACHE_MAX_BYTES){const first=ram.entries().next().value;if(!first)break;total-=first[1].bytes.byteLength;ram.delete(first[0])}
}
async function boundedBytes(response:Response,size:number,signal?:AbortSignal){
 // Fetch may transparently decode HTTP Content-Encoding; Content-Length is
 // the wire length, not this stream's length. Bound and count actual body bytes.
 if(!response.body)throw new Error('Modellfeld unvollständig; Prüfsumme ungültig.');
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let count=0;
 try{while(true){if(signal?.aborted)throw signal.reason;const next=await reader.read();if(next.done)break;count+=next.value.byteLength;if(count>size)throw new Error('Modellfeld überschreitet die geprüfte Größe; Prüfsumme ungültig.');chunks.push(next.value)}}catch(error){await reader.cancel().catch(()=>undefined);throw error}finally{reader.releaseLock()}
 if(count!==size)throw new Error('Modellfeld unvollständig; Prüfsumme ungültig.');const bytes=new Uint8Array(count);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}return bytes.buffer;
}

function isSha(s:string):boolean{return /^[0-9a-f]{64}$/.test(s)}
function safeFrameUrl(url:string):URL {
  const resolved = new URL(url, location.href);
  if (resolved.origin!==location.origin || resolved.search || resolved.hash ||
      !/^\/ruc\/runs\/[a-zA-Z0-9_-]+\/(?:model-fields|model-fields-native|ruc-model-fields|synoptic-fields|ruc-synoptic-fields)\/[a-zA-Z0-9_/-]+\.(?:json|bin)$/.test(resolved.pathname) ||
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
  if(!response||!fresh(at)||
    !Number.isInteger(size)||size<1||size>MAX_ITEM_BYTES){await cache.delete(req);continue}
  total+=size;valid.push({request:req,at,size});
 }
 valid.sort((a,b)=>a.at-b.at);
 while(valid.length>MAX_ITEMS||total>MID_MAP_CACHE_MAX_BYTES){const old=valid.shift();if(!old)break;total-=old.size;if(!await cache.delete(old.request))throw new Error('Verified map CacheStorage eviction failed')}
}
/** Read cached verified bytes or fetch, SHA-check and cache. No stale-if-error fallback. */
async function readVerifiedMapFrameBytes(path:string,expectedSha256:string,expectedBytes:number,signal?:AbortSignal):Promise<ArrayBuffer>{
 const sha=String(expectedSha256||'').toLowerCase(),url=safeFrameUrl(path);
 if(!isSha(sha)||!Number.isInteger(expectedBytes)||expectedBytes<1||expectedBytes>MAX_ITEM_BYTES)throw new Error('Untrusted map-frame hash/size');
 if(signal?.aborted)throw signal.reason??new Error('Aborted');
 const key=keyFor(url,sha),existing=ram.get(key);
 if(existing&&fresh(existing.at)&&existing.bytes.byteLength===expectedBytes){
   const cloned=copy(existing.bytes);
   if(await checkBytes(cloned,sha,expectedBytes)){if(signal?.aborted)throw signal.reason??new Error('Aborted');return cloned}
   ram.delete(key);
 }
 const store=await cacheOrNull();
 if(store){
  try{
   const response=await store.match(key),at=Number(response?.headers.get(TIMESTAMP_HEADER));
   if(response&&fresh(at)){
    const content=await boundedBytes(response,expectedBytes,signal);
    if(await checkBytes(content,sha,expectedBytes)){
      remember(key,content,at);
      if(signal?.aborted)throw signal.reason??new Error('Aborted');
      return content;
    }
   }
   if(response)await store.delete(key);
  }catch{/* Browsers can evict or deny CacheStorage. Network remains available. */}
 }
 if(signal?.aborted)throw signal.reason??new Error('Aborted');
 const response=await fetch(url.toString(),{signal,cache:'default',redirect:'error'});
 if(!response.ok)throw new Error('Geprüftes Modellfeld nicht verfügbar.');
 // Fetch may transparently decode HTTP Content-Encoding; Content-Length is
 // the wire length, not this stream's length. Bound and count actual body bytes.
 const data=await boundedBytes(response,expectedBytes,signal);
 if(!await checkBytes(data,sha,expectedBytes))throw new Error('Modellfeld-Prüfsumme ungültig.');
 if(signal?.aborted)throw signal.reason??new Error('Aborted');
 const now=Date.now();remember(key,data,now);
 if(store){
  try{const task=diskWrites.then(async()=>{if(signal?.aborted)return;try{await store.put(key,new Response(data.slice(0),{status:200,headers:{'content-length':String(expectedBytes),[TIMESTAMP_HEADER]:String(now)}}));await purge(store)}catch{/* An incomplete eviction could leave the persistent 24 MiB budget exceeded. */try{await caches.delete(MID_MAP_CACHE_NAME)}catch{} }});diskWrites=task.catch(()=>undefined);await task}catch{/* Optional cache. No user settings/other caches are touched. */}
 }
 return data;
}
/** Shared immutable reads retain independent caller cancellation. The caller must first
 * admit a FRESH pointer/index; decoded model/run/time validation remains mandatory. */
export async function fetchVerifiedMapFrameBytes(path:string,sha:string,size:number,signal?:AbortSignal):Promise<ArrayBuffer>{
 const url=safeFrameUrl(path);
 if(!isSha(sha)||!Number.isInteger(size)||size<1||size>MAX_ITEM_BYTES)throw new Error('Untrusted map-frame hash/size');
 if(signal?.aborted)throw signal.reason??new DOMException('Aborted','AbortError');
 const key=keyFor(url,sha)+':'+size;let task=pending.get(key);
 if(task?.controller.signal.aborted){if(pending.get(key)===task)pending.delete(key);task=undefined}
 if(!task){
  if(pending.size>=MAX_ITEMS)throw new Error('Zu viele gleichzeitige Modellfeldabrufe.');
  const controller=new AbortController();task={controller,users:0,promise:readVerifiedMapFrameBytes(path,sha,size,controller.signal)};
  pending.set(key,task);const own=task;void task.promise.finally(()=>{if(pending.get(key)===own)pending.delete(key)}).catch(()=>undefined);
 }
 const current=task;current.users++;
 return new Promise<ArrayBuffer>((resolve,reject)=>{
  let done=false;
  const finish=()=>{if(done)return false;done=true;signal?.removeEventListener('abort',abort);current.users--;if(!current.users){if(pending.get(key)===current)pending.delete(key);current.controller.abort();}return true};
  const abort=()=>{if(finish())reject(signal?.reason??new DOMException('Aborted','AbortError'))};
  signal?.addEventListener('abort',abort,{once:true});
  current.promise.then(bytes=>{if(finish())resolve(bytes.slice(0))},error=>{if(finish())reject(error)});
  if(signal?.aborted)abort();
 });
}
/** Explicit cache cleanup never removes any user preference or pointer. */
export async function clearVerifiedMapFrameCache(){
 for(const entry of pending.values())entry.controller.abort();pending.clear();ram.clear();await diskWrites;try{await caches.delete(MID_MAP_CACHE_NAME)}catch{}
}
