import {MID_VERSION} from './version';

export type WorkerPurpose='general'|'metar'|'alerts'|'radar'|'meteogram';
type WorkerPayload={error?:string};
type WorkerFetchOptions={purpose?:WorkerPurpose;signal?:AbortSignal;timeoutMs?:number;cache?:RequestCache};

const LAST_GOOD_KEY='mid:worker:lastGood';
const LAST_GOOD_MAX_AGE=7*24*60*60*1000;

function storageGet(key:string){try{return localStorage.getItem(key)||''}catch{return''}}
function splitUrls(value:unknown){return String(value||'').split(/[\s,;]+/).map(item=>item.trim()).filter(Boolean)}
function normaliseBase(value:string){try{return new URL(value,typeof location==='undefined'?'https://mid.invalid/':location.href).toString()}catch{return''}}
function uniqueUrls(values:string[]){const seen=new Set<string>(),result:string[]=[];for(const raw of values){const value=normaliseBase(raw);if(!value||seen.has(value))continue;seen.add(value);result.push(value)}return result}
function recentLastGood(){
 try{
  const parsed=JSON.parse(storageGet(LAST_GOOD_KEY)) as {url?:string;at?:number};
  return parsed.url&&Number(parsed.at)>Date.now()-LAST_GOOD_MAX_AGE?parsed.url:'';
 }catch{return''}
}
function rememberLastGood(url:string){try{localStorage.setItem(LAST_GOOD_KEY,JSON.stringify({url,at:Date.now()}))}catch{}}
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
  recentLastGood(),
  String(env.VITE_WORKER_SAME_ORIGIN_PATH||''),
  purposeSpecificEnv(purpose,env),
  String(env.VITE_METAR_PROXY_URL||''),
  ...splitUrls(env.VITE_WORKER_FALLBACK_URLS),
  purposeSpecificStorage(purpose),
  storageGet('metarProxyUrl'),
  ...splitUrls(storageGet('midWorkerFallbackUrls')||storageGet('workerFallbackUrls'))
 ]);
}

export function configuredWorkerBase(purpose:WorkerPurpose='general'){return workerBaseCandidates(purpose)[0]||''}

export function buildWorkerUrl(base:string,mode:string,params:Record<string,string|number|undefined>={}){
 const url=new URL(base,typeof location==='undefined'?'https://mid.invalid/':location.href);
 if(mode)url.searchParams.set('mode',mode);
 for(const[key,value]of Object.entries(params))if(value!==undefined&&value!=='')url.searchParams.set(key,String(value));
 url.searchParams.set('_mid',MID_VERSION);
 return url;
}

function abortReason(signal?:AbortSignal){
 if(signal?.reason instanceof Error)return signal.reason;
 return new DOMException('Vorgang abgebrochen.','AbortError');
}
function requestController(parent:AbortSignal|undefined,timeoutMs:number){
 const controller=new AbortController(),abort=()=>controller.abort(parent?.reason),timer=globalThis.setTimeout(()=>controller.abort(new DOMException('Worker-Zeitüberschreitung.','TimeoutError')),timeoutMs);
 if(parent?.aborted)abort();else parent?.addEventListener('abort',abort,{once:true});
 return{signal:controller.signal,cleanup:()=>{globalThis.clearTimeout(timer);parent?.removeEventListener('abort',abort)}};
}
function errorText(error:unknown){
 if(error instanceof DOMException&&error.name==='TimeoutError')return'Zeitüberschreitung';
 if(error instanceof Error)return error.message;
 return String(error||'unbekannter Fehler');
}

export async function fetchWorkerJson<T extends WorkerPayload>(mode:string,params:Record<string,string|number|undefined>={},options:WorkerFetchOptions={}):Promise<T>{
 const purpose=options.purpose??'general',candidates=workerBaseCandidates(purpose);
 if(!candidates.length)throw new Error(`Cloudflare Worker v${MID_VERSION} ist nicht konfiguriert.`);
 const failures:string[]=[];
 for(const base of candidates){
  if(options.signal?.aborted)throw abortReason(options.signal);
  const request=requestController(options.signal,options.timeoutMs??9000);
  try{
   const response=await fetch(buildWorkerUrl(base,mode,params).toString(),{signal:request.signal,cache:options.cache??'no-store',headers:{Accept:'application/json'}});
   const data=await response.json().catch(()=>({})) as T;
   if(!response.ok||data.error)throw new Error(data.error||`HTTP ${response.status}`);
   rememberLastGood(base);
   return data;
  }catch(error){
   if(options.signal?.aborted)throw abortReason(options.signal);
   failures.push(`${new URL(base).host}: ${errorText(error)}`);
  }finally{request.cleanup()}
 }
 const detail=failures.slice(-2).join(' · ');
 throw new Error(`Workerzugriff über ${candidates.length} Endpunkt${candidates.length===1?'':'e'} fehlgeschlagen${detail?`: ${detail}`:''}. Browser-, DNS- oder Netzwerkblockade möglich.`);
}
