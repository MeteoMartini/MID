export type OpenMeteoPriority='foreground'|'normal'|'background';

type QueueItem={
 id:number;
 priority:OpenMeteoPriority;
 signal?:AbortSignal;
 resolve:(release:()=>void)=>void;
 reject:(reason:unknown)=>void;
};

const OPEN_METEO_SUFFIX='.open-meteo.com';
const COOLDOWN_STORAGE_KEY='mid:open-meteo-cooldown:v1';
const MAX_ACTIVE=2;
const START_GAP_MS=220;
const DEFAULT_429_COOLDOWN_MS=8_000;
const MAX_429_COOLDOWN_MS=90_000;
const PRIORITY_WEIGHT:Record<OpenMeteoPriority,number>={foreground:0,normal:1,background:2};

let queueId=0;
let active=0;
let nextStartAt=0;
function readPersistedCooldown(){try{const value=Number(localStorage.getItem(COOLDOWN_STORAGE_KEY));return Number.isFinite(value)&&value>Date.now()&&value-Date.now()<=10*60*1000?value:0}catch{return 0}}
function persistCooldown(){try{if(cooldownUntil>Date.now())localStorage.setItem(COOLDOWN_STORAGE_KEY,String(cooldownUntil));else localStorage.removeItem(COOLDOWN_STORAGE_KEY)}catch{}}
let cooldownUntil=readPersistedCooldown();
let pumpTimer:ReturnType<typeof setTimeout>|undefined;
const queue:QueueItem[]=[];
const jsonInflight=new Map<string,Promise<unknown>>();

export class OpenMeteoRateLimitError extends Error{
 readonly retryAt:number;
 constructor(retryAt:number,message='Wetterdienst vorübergehend ausgelastet. MID versucht die Aktualisierung automatisch erneut.'){
  super(message);this.name='OpenMeteoRateLimitError';this.retryAt=retryAt;
 }
}

export function isOpenMeteoUrl(value:string|URL){try{const host=(value instanceof URL?value:new URL(value)).hostname.toLowerCase();return host==='open-meteo.com'||host.endsWith(OPEN_METEO_SUFFIX)}catch{return false}}
export function isOpenMeteoRateLimitError(value:unknown):value is OpenMeteoRateLimitError{return value instanceof OpenMeteoRateLimitError||Boolean(value&&typeof value==='object'&&(value as {name?:string}).name==='OpenMeteoRateLimitError')}
export function openMeteoGuardStatus(){return{active,queued:queue.length,cooldownUntil,nextStartAt}}
export function openMeteoCooldownRetryAt(){return cooldownUntil>Date.now()?cooldownUntil:0}
export function openMeteoCooldownRemainingMs(){return Math.max(0,openMeteoCooldownRetryAt()-Date.now())}
export function registerOpenMeteoCooldown(retryAt:number){const next=Number(retryAt);if(Number.isFinite(next)&&next>Date.now())cooldownUntil=Math.max(cooldownUntil,next);else cooldownUntil=Math.max(cooldownUntil,Date.now()+60_000);persistCooldown();schedulePump();return cooldownUntil}

function abortError(signal?:AbortSignal){const reason=signal?.reason;return reason instanceof Error?reason:new DOMException('Abgebrochen','AbortError')}
function wait(ms:number,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(abortError(signal));return}let done=false;const finish=(callback:()=>void)=>{if(done)return;done=true;signal?.removeEventListener('abort',onAbort);callback()},timer=setTimeout(()=>finish(resolve),Math.max(0,ms)),onAbort=()=>{clearTimeout(timer);finish(()=>reject(abortError(signal)))};signal?.addEventListener('abort',onAbort,{once:true})})}
function retryAfterMs(response:Response){const value=String(response.headers.get('retry-after')||'').trim();if(!value)return 0;const seconds=Number(value);if(Number.isFinite(seconds))return Math.max(0,seconds*1000);const stamp=Date.parse(value);return Number.isFinite(stamp)?Math.max(0,stamp-Date.now()):0}
function setCooldown(response?:Response,attempt=0){const header=response?retryAfterMs(response):0,exponential=DEFAULT_429_COOLDOWN_MS*Math.max(1,attempt+1),delay=Math.min(MAX_429_COOLDOWN_MS,Math.max(DEFAULT_429_COOLDOWN_MS,header,exponential));cooldownUntil=Math.max(cooldownUntil,Date.now()+delay);persistCooldown();schedulePump();return cooldownUntil}
function schedulePump(delay=0){if(pumpTimer!==undefined)return;pumpTimer=setTimeout(()=>{pumpTimer=undefined;pump()},Math.max(0,delay))}
function removeQueued(item:QueueItem){const index=queue.indexOf(item);if(index>=0)queue.splice(index,1)}
function acquire(priority:OpenMeteoPriority,signal?:AbortSignal){return new Promise<()=>void>((resolve,reject)=>{if(signal?.aborted){reject(abortError(signal));return}const item:QueueItem={id:++queueId,priority,signal,resolve,reject},onAbort=()=>{removeQueued(item);reject(abortError(signal))};signal?.addEventListener('abort',onAbort,{once:true});const originalResolve=item.resolve;item.resolve=release=>{signal?.removeEventListener('abort',onAbort);originalResolve(release)};queue.push(item);pump()})}
function pump(){queue.sort((a,b)=>PRIORITY_WEIGHT[a.priority]-PRIORITY_WEIGHT[b.priority]||a.id-b.id);while(active<MAX_ACTIVE&&queue.length){const now=Date.now(),earliest=Math.max(nextStartAt,cooldownUntil);if(earliest>now){schedulePump(earliest-now+5);return}const item=queue.shift()!;if(item.signal?.aborted){item.reject(abortError(item.signal));continue}active++;nextStartAt=Date.now()+START_GAP_MS;let released=false;item.resolve(()=>{if(released)return;released=true;active=Math.max(0,active-1);pump()})}}

async function guardedFetchInternal(url:string,init:RequestInit,priority:OpenMeteoPriority,maxRetries:number){let attempt=0;const signal=init.signal??undefined;for(;;){if(signal?.aborted)throw abortError(signal);if(priority==='background'&&cooldownUntil>Date.now())throw new OpenMeteoRateLimitError(cooldownUntil);const release=await acquire(priority,signal);let response:Response;try{response=await fetch(url,{...init,cache:init.cache??'no-store',headers:{Accept:'application/json',...(init.headers??{})}})}catch(error){release();if(signal?.aborted)throw error;if(attempt>=maxRetries)throw error;attempt++;await wait(500*attempt,signal);continue}release();if(response.status===429){const retryAt=setCooldown(response,attempt);if(priority==='background'||attempt>=maxRetries)throw new OpenMeteoRateLimitError(retryAt);attempt++;await wait(Math.max(0,retryAt-Date.now()+20),signal);continue}if([500,502,503,504].includes(response.status)&&attempt<maxRetries){attempt++;await wait(500*attempt,signal);continue}return response}}

export async function guardedOpenMeteoFetch(url:string|URL,init:RequestInit={},options:{priority?:OpenMeteoPriority;maxRetries?:number}={}){const text=String(url);if(!isOpenMeteoUrl(text))return fetch(text,init);const priority=options.priority??'normal',maxRetries=options.maxRetries??(priority==='foreground'?1:priority==='normal'?1:0);return guardedFetchInternal(text,init,priority,maxRetries)}

export async function guardedOpenMeteoJson<T>(url:string|URL,init:RequestInit={},options:{priority?:OpenMeteoPriority;maxRetries?:number;dedupe?:boolean}={}):Promise<T>{const text=String(url),priority=options.priority??'normal',dedupe=options.dedupe!==false,key=`${priority}:${text}`;if(dedupe&&jsonInflight.has(key))return jsonInflight.get(key) as Promise<T>;const task=(async()=>{const response=await guardedOpenMeteoFetch(text,init,{priority,maxRetries:options.maxRetries});let payload:unknown;try{payload=await response.json()}catch{throw new Error(`Open-Meteo lieferte keine gültigen JSON-Daten (HTTP ${response.status}).`)}if(!response.ok){if(response.status===429)throw new OpenMeteoRateLimitError(setCooldown(response));const reason=payload&&typeof payload==='object'?String((payload as {reason?:unknown;error?:unknown}).reason||(payload as {error?:unknown}).error||''):'';throw new Error(reason||`Open-Meteo HTTP ${response.status}`)}if(payload&&typeof payload==='object'&&(payload as {error?:unknown}).error)throw new Error(String((payload as {reason?:unknown;error?:unknown}).reason||(payload as {error?:unknown}).error));return payload as T})();if(dedupe)jsonInflight.set(key,task);try{return await task}finally{if(dedupe&&jsonInflight.get(key)===task)jsonInflight.delete(key)}}
