/**
 * RainViewer free Weather Maps API: historical observations only since 2026-01-01.
 * Never convert the legacy optional `radar.nowcast` payload to a forecast.
 * Original source times are preserved; missing observations remain missing.
 * https://www.rainviewer.com/api/transition-faq.html
 */
export type RainViewerObservation={time:number;path:string};
export function rainViewerPastObservations(
 payload:{radar?:{past?:RainViewerObservation[];nowcast?:RainViewerObservation[]}}|null|undefined,
 nowSeconds:number,
):RainViewerObservation[]{
 if(!Number.isFinite(nowSeconds))return [];
 const earliest=nowSeconds-140*60,latest=nowSeconds;
 const frames=Array.isArray(payload?.radar?.past)?payload.radar.past:[];
 return [...new Map(frames.filter(frame=>
  Number.isSafeInteger(frame?.time)&&frame.time>=earliest&&frame.time<=latest&&
  typeof frame.path==='string'&&frame.path.startsWith('/')&&!frame.path.startsWith('//'),
 ).sort((a,b)=>a.time-b.time).map(frame=>[frame.time,frame] as const)).values()];
}

export const RAINVIEWER_REFRESH_INTERVAL_MS=300_000;
export const RAINVIEWER_RESUME_FRESHNESS_MS=120_000;
export type RainViewerRefreshOptions<T>={
 fetch:(signal:AbortSignal)=>Promise<T>;
 onData:(data:T)=>void;
 onError?:(error:unknown)=>void;
 visible:()=>boolean;
 subscribe:(listener:()=>void)=>(()=>void);
 now:()=>number;
 setTimer:(callback:()=>void,delayMs:number)=>number;
 clearTimer:(timer:number)=>void;
};

/** One active request and at most one foreground timer. No background polling.
 * A hidden/aborted response can never publish after the location or owner changes.
 * Resuming within 120 s of a successful fetch does not defeat the worker cache.
 * This scheduler does not validate radar coverage, intensity or future forecasts.
 */
export function createRainViewerFallbackLifecycle<T>(options:RainViewerRefreshOptions<T>){
 let started=false,disposed=false;
 let timer:number|null=null;
 let pending:AbortController|null=null;
 let lastAttemptAt:number|null=null,lastSuccessAt:number|null=null;
 let interrupted=false,generation=0;
 let unsubscribe=()=>{};
 const cancelTimer=()=>{if(timer!==null){options.clearTimer(timer);timer=null}};
 const schedule=(delayMs:number)=>{
  cancelTimer();
  if(!started||disposed||!options.visible())return;
  timer=options.setTimer(()=>{timer=null;poll()},Math.max(1,Math.ceil(delayMs)));
 };
 const poll=()=>{
  if(!started||disposed||!options.visible()||pending!==null)return;
  const current=options.now();
  if(!Number.isFinite(current))return;
  const sinceAttempt=lastAttemptAt===null?Infinity:Math.max(0,current-lastAttemptAt);
  const sinceSuccess=lastSuccessAt===null?Infinity:Math.max(0,current-lastSuccessAt);
  if(sinceSuccess<RAINVIEWER_RESUME_FRESHNESS_MS){
   schedule(Math.max(RAINVIEWER_RESUME_FRESHNESS_MS-sinceSuccess,RAINVIEWER_REFRESH_INTERVAL_MS-sinceAttempt));return;
  }
  const minGap=interrupted?10_000:RAINVIEWER_RESUME_FRESHNESS_MS;
  if(sinceAttempt<minGap){schedule(minGap-sinceAttempt);return;}
  interrupted=false;
  const controller=new AbortController(),currentGeneration=++generation;
  pending=controller;lastAttemptAt=current;
  cancelTimer();
  void Promise.resolve().then(()=>options.fetch(controller.signal)).then(data=>{
   if(disposed||!started||pending!==controller||controller.signal.aborted||
      generation!==currentGeneration||!options.visible())return;
   options.onData(data);
   lastSuccessAt=options.now();
  }).catch(error=>{
   if(!disposed&&started&&pending===controller&&!controller.signal.aborted&&
      generation===currentGeneration&&options.visible())options.onError?.(error);
  }).finally(()=>{
   if(pending!==controller)return;
   pending=null;
   if(!disposed&&started&&options.visible())schedule(RAINVIEWER_REFRESH_INTERVAL_MS-(options.now()-current));
  });
 };
 const visibilityChanged=()=>{
  if(!started||disposed)return;
  if(!options.visible()){
   cancelTimer();
   if(pending){pending.abort();pending=null;generation++;interrupted=true;}
   return;
  }
  if(pending===null)poll();
 };
 return {
  start(){if(started||disposed)return;started=true;unsubscribe=options.subscribe(visibilityChanged);visibilityChanged();},
  visibilityChanged,
  dispose(){if(disposed)return;disposed=true;started=false;cancelTimer();
   if(pending){pending.abort();pending=null;generation++;}unsubscribe();},
 };
}
