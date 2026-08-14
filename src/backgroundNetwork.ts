export const FOREGROUND_NETWORK_READY_EVENT='mid:foreground-network-ready';
export const FOREGROUND_NETWORK_BUSY_EVENT='mid:foreground-network-busy';

const DEFAULT_QUIET_MS=45_000;
const POLL_MS=750;

let foregroundBusy=true;
let foregroundReadyAt=0;
let tail:Promise<void>=Promise.resolve();
const inFlight=new Map<string,Promise<unknown>>();

function abortError(signal?:AbortSignal){const reason=signal?.reason;return reason instanceof Error?reason:new DOMException('Abgebrochen','AbortError')}
function visibleAndOnline(){if(typeof document!=='undefined'&&document.visibilityState==='hidden')return false;if(typeof navigator!=='undefined'&&navigator.onLine===false)return false;return true}
function emit(name:string){if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(name,{detail:backgroundNetworkStatus()}))}

export function markForegroundNetworkBusy(){foregroundBusy=true;foregroundReadyAt=0;emit(FOREGROUND_NETWORK_BUSY_EVENT)}
export function markForegroundNetworkReady(){foregroundBusy=false;foregroundReadyAt=Date.now();emit(FOREGROUND_NETWORK_READY_EVENT)}
export function backgroundNetworkStatus(){return{foregroundBusy,foregroundReadyAt,queued:inFlight.size}}

async function waitForQuiet(signal?:AbortSignal,quietMs=DEFAULT_QUIET_MS){
 for(;;){
  if(signal?.aborted)throw abortError(signal);
  const ready=!foregroundBusy&&foregroundReadyAt>0&&Date.now()-foregroundReadyAt>=quietMs&&visibleAndOnline();
  if(ready)return;
  await new Promise<void>((resolve,reject)=>{let settled=false;const finish=(fn:()=>void)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',onAbort);fn()},timer=setTimeout(()=>finish(resolve),POLL_MS),onAbort=()=>{clearTimeout(timer);finish(()=>reject(abortError(signal)))};signal?.addEventListener('abort',onAbort,{once:true})});
 }
}

export function runBackgroundNetworkTask<T>(key:string,task:()=>Promise<T>,options:{signal?:AbortSignal;quietMs?:number;dedupe?:boolean}={}):Promise<T>{
 const normalized=String(key||'background').trim()||'background',dedupe=options.dedupe!==false,existing=inFlight.get(normalized);
 if(dedupe&&existing)return existing as Promise<T>;
 const run=tail.catch(()=>undefined).then(async()=>{await waitForQuiet(options.signal,options.quietMs??DEFAULT_QUIET_MS);if(options.signal?.aborted)throw abortError(options.signal);return task()});
 tail=run.then(()=>undefined,()=>undefined);
 if(dedupe)inFlight.set(normalized,run);
 return run.finally(()=>{if(dedupe&&inFlight.get(normalized)===run)inFlight.delete(normalized)}) as Promise<T>;
}
