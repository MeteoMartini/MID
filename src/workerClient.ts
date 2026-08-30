import {MID_VERSION} from './version';

export type WorkerPurpose='general'|'metar'|'alerts'|'radar'|'meteogram';
type WorkerPayload={error?:string};
type WorkerFetchOptions={purpose?:WorkerPurpose;signal?:AbortSignal;timeoutMs?:number;cache?:RequestCache;maxAgeMs?:number;staleIfErrorMs?:number;cacheKey?:string};

type WorkerCacheEntry={at:number;data:WorkerPayload};
type WorkerEndpointHealth={failures:number;blockedUntil:number};
const workerResponseCache=new Map<string,WorkerCacheEntry>();
const workerEndpointHealth=new Map<string,WorkerEndpointHealth>();
const WORKER_CACHE_LIMIT=36;
class WorkerRequestError extends Error{constructor(message:string,readonly status=0){super(message);this.name='WorkerRequestError'}}

const LAST_GOOD_KEY='mid:worker:lastGood';
const LAST_GOOD_MAX_AGE=36*60*60*1000;

function storageGet(key:string){try{return localStorage.getItem(key)||''}catch{return''}}
function splitUrls(value:unknown){return String(value||'').split(/[\s,;]+/).map(item=>item.trim()).filter(Boolean)}
function normaliseBase(value:string){if(!String(value||'').trim())return'';try{const url=new URL(value,typeof location==='undefined'?'https://mid.invalid/':location.href);if(!/^https?:$/.test(url.protocol))return'';return url.toString()}catch{return''}}
function uniqueUrls(values:string[]){const seen=new Set<string>(),result:string[]=[];for(const raw of values){const value=normaliseBase(raw);if(!value||seen.has(value))continue;seen.add(value);result.push(value)}return result}
function lastGoodKey(purpose:WorkerPurpose){return`${LAST_GOOD_KEY}:${purpose}`}
function recentLastGood(purpose:WorkerPurpose){
 try{
  const parsed=JSON.parse(storageGet(lastGoodKey(purpose))) as {url?:string;at?:number};
  return parsed.url&&Number(parsed.at)>Date.now()-LAST_GOOD_MAX_AGE?parsed.url:'';
 }catch{return''}
}
function rememberLastGood(purpose:WorkerPurpose,url:string){try{localStorage.setItem(lastGoodKey(purpose),JSON.stringify({url,at:Date.now()}))}catch{}}
function purposeSpecificEnv(purpose:WorkerPurpose,env:ImportMetaEnv){
 if(purpose==='alerts')return String(env.VITE_ALERT_PROXY_URL||'');
 if(purpose==='radar'||purpose==='meteogram')return String(env.VITE_RADAR_PROXY_URL||'');
 return String(env.VITE_METAR_PROXY_URL||'');
}
function purposeSpecificStorage(purpose:WorkerPurpose){
 if(purpose==='alerts')return storageGet('alertProxyUrl');
 if(purpose==='radar'||purpose==='meteogram')return storageGet('radarProxyUrl');
 return storageGet('metarProxyUrl');
}

export function workerBaseCandidates(purpose:WorkerPurpose='general'){
 const env=import.meta.env;
 return uniqueUrls([
  String(env.VITE_WORKER_SAME_ORIGIN_PATH||''),
  purposeSpecificEnv(purpose,env),
  String(env.VITE_METAR_PROXY_URL||''),
  ...splitUrls(env.VITE_WORKER_FALLBACK_URLS),
  purposeSpecificStorage(purpose),
  storageGet('metarProxyUrl'),
  ...splitUrls(storageGet('midWorkerFallbackUrls')||storageGet('workerFallbackUrls')),
  recentLastGood(purpose)
 ]);
}

export function configuredWorkerBase(purpose:WorkerPurpose='general'){return workerBaseCandidates(purpose)[0]||''}

export function buildWorkerUrl(base:string,mode:string,params:Record<string,string|number|undefined>={}){
 const url=new URL(base,typeof location==='undefined'?'https://mid.invalid/':location.href);
 if(mode)url.searchParams.set('mode',mode);
 for(const[key,value]of Object.entries(params))if(value!==undefined&&value!=='')url.searchParams.set(key,String(value));
 url.searchParams.set('_mid_version',MID_VERSION);
 return url;
}

function abortReason(signal?:AbortSignal){
 if(signal?.reason instanceof Error)return signal.reason;
 return new DOMException('Vorgang abgebrochen.','AbortError');
}
function requestController(parent:AbortSignal|undefined,timeoutMs:number){
 const controller=new AbortController(),abort=()=>controller.abort(parent?.reason),timer=globalThis.setTimeout(()=>controller.abort(new DOMException('Zeitüberschreitung beim MID-Datendienst.','TimeoutError')),timeoutMs);
 if(parent?.aborted)abort();else parent?.addEventListener('abort',abort,{once:true});
 return{signal:controller.signal,cleanup:()=>{globalThis.clearTimeout(timer);parent?.removeEventListener('abort',abort)}};
}
function errorText(error:unknown){
 if(error instanceof DOMException&&error.name==='TimeoutError')return'Zeitüberschreitung';
 if(error instanceof Error)return error.message;
 return String(error||'unbekannter Fehler');
}
function stableWorkerCacheKey(purpose:WorkerPurpose,mode:string,params:Record<string,string|number|undefined>,explicit?:string){
 if(explicit)return`${purpose}:${explicit}`;
 const values=Object.entries(params).filter(([,value])=>value!==undefined&&value!=='').sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&');
 return`${purpose}:${mode}?${values}`;
}
function cachedWorkerPayload<T extends WorkerPayload>(key:string,maxAgeMs:number){const cached=workerResponseCache.get(key);return cached&&Date.now()-cached.at<=maxAgeMs?cached.data as T:undefined}
function storeWorkerPayload(key:string,data:WorkerPayload){workerResponseCache.set(key,{at:Date.now(),data});if(workerResponseCache.size>WORKER_CACHE_LIMIT){const remove=[...workerResponseCache.entries()].sort((a,b)=>a[1].at-b[1].at).slice(0,workerResponseCache.size-WORKER_CACHE_LIMIT);for(const[item]of remove)workerResponseCache.delete(item)}}
function endpointHealthKey(purpose:WorkerPurpose,base:string){return`${purpose}:${base}`}
function endpointBlocked(purpose:WorkerPurpose,base:string){return Number(workerEndpointHealth.get(endpointHealthKey(purpose,base))?.blockedUntil||0)>Date.now()}
function endpointSuccess(purpose:WorkerPurpose,base:string){workerEndpointHealth.delete(endpointHealthKey(purpose,base))}
function endpointFailure(purpose:WorkerPurpose,base:string,error:unknown){const retryable=!(error instanceof WorkerRequestError)||error.status===0||error.status===408||error.status===429||error.status>=500;if(!retryable)return;const key=endpointHealthKey(purpose,base),previous=workerEndpointHealth.get(key),failures=(previous?.failures||0)+1,blockedUntil=failures>=4?Date.now()+120000:failures>=2?Date.now()+30000:0;workerEndpointHealth.set(key,{failures,blockedUntil})}
function staleWorkerPayload<T extends WorkerPayload>(key:string,staleIfErrorMs:number){const cached=workerResponseCache.get(key);return cached&&Date.now()-cached.at<=staleIfErrorMs?cached.data as T:undefined}

function parseWorkerPayload<T extends WorkerPayload>(response:Response,text:string):T{
 const contentType=String(response.headers.get('content-type')||'').toLowerCase(),trimmed=text.trim();
 if(!trimmed)throw new Error(`Leere Antwort des MID-Datendienstes (HTTP ${response.status})`);
 if(contentType.includes('text/html')||/^<!doctype html|^<html\b/i.test(trimmed))throw new Error('Der MID-Datendienst liefert ein unerwartetes Antwortformat');
 let data:unknown;
 try{data=JSON.parse(trimmed)}catch{throw new Error(`Antwort des MID-Datendienstes ist nicht gültig (HTTP ${response.status})`)}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Antwort des MID-Datendienstes hat ein ungültiges Format');
 return data as T;
}

export async function fetchWorkerJson<T extends WorkerPayload>(mode:string,params:Record<string,string|number|undefined>={},options:WorkerFetchOptions={}):Promise<T>{
 const purpose=options.purpose??'general',candidates=workerBaseCandidates(purpose),cacheKey=stableWorkerCacheKey(purpose,mode,params,options.cacheKey),maxAgeMs=Math.max(0,Number(options.maxAgeMs)||0),staleIfErrorMs=Math.max(maxAgeMs,Number(options.staleIfErrorMs)||0);
 if(maxAgeMs>0){const cached=cachedWorkerPayload<T>(cacheKey,maxAgeMs);if(cached)return cached}
 if(!candidates.length){const stale=staleIfErrorMs>0?staleWorkerPayload<T>(cacheKey,staleIfErrorMs):undefined;if(stale)return stale;throw new Error(`Der MID-Datendienst v${MID_VERSION} ist nicht konfiguriert.`)}
 const failures:string[]=[],available=candidates.filter(base=>!endpointBlocked(purpose,base)),attempts=available.length?available:[candidates[0]];
 for(const base of attempts){
  if(options.signal?.aborted)throw abortReason(options.signal);
  const request=requestController(options.signal,options.timeoutMs??9000);
  try{
   const response=await fetch(buildWorkerUrl(base,mode,params).toString(),{signal:request.signal,cache:options.cache??'no-store',headers:{Accept:'application/json','Cache-Control':options.cache==='default'?'max-age=0':'no-cache'}});
   const text=await response.text(),data=parseWorkerPayload<T>(response,text);
   if(!response.ok||data.error)throw new WorkerRequestError(data.error||`HTTP ${response.status}`,response.status);
   rememberLastGood(purpose,base);endpointSuccess(purpose,base);if(maxAgeMs>0||staleIfErrorMs>0)storeWorkerPayload(cacheKey,data);
   return data;
  }catch(error){
   if(options.signal?.aborted)throw abortReason(options.signal);
   endpointFailure(purpose,base,error);
   const host=(()=>{try{return new URL(base,typeof location==='undefined'?'https://mid.invalid/':location.href).host||base}catch{return base}})();
   failures.push(`${host}: ${errorText(error)}`);
  }finally{request.cleanup()}
 }
 const stale=staleIfErrorMs>0?staleWorkerPayload<T>(cacheKey,staleIfErrorMs):undefined;if(stale)return stale;
 const detail=failures.slice(-3).join(' · ');
 throw new Error(`Der MID-Datendienst ist über ${attempts.length} Verbindung${attempts.length===1?'':'en'} nicht erreichbar${detail?`: ${detail}`:''}. Bitte Netzwerk oder Inhaltsfilter prüfen.`);
}
