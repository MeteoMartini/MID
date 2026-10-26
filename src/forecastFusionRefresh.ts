/** Foreground-only retry loop. A skipped/failed initial request must not strand fusion. */
export function createForecastFusionRefresh<T>(options:{
 load:(signal:AbortSignal)=>Promise<T|null>;
 apply:(value:T)=>void;
 available:()=>boolean;
 setTimer:(callback:()=>void,delay:number)=>number;
 clearTimer:(id:number)=>void;
}){
 let stopped=false,timer:number|undefined,controller:AbortController|undefined,failures=0;
 const clear=()=>{if(timer!==undefined)options.clearTimer(timer);timer=undefined};
 const schedule=(delay:number)=>{clear();if(!stopped&&options.available())timer=options.setTimer(()=>{timer=undefined;void run()},delay)};
 const run=async()=>{
  if(stopped||controller||!options.available())return;
  const request=new AbortController();controller=request;
  let success=false;
  try{const value=await options.load(request.signal);if(!stopped&&!request.signal.aborted&&value!==null){options.apply(value);success=true}}
  catch{/* Retry transient failures without discarding the last successful forecast. */}
  finally{
   if(controller===request)controller=undefined;
   if(!stopped){failures=success?0:failures+1;schedule(success?300000:[5000,15000,60000][failures-1]??300000)}
  }
 };
 return{
  resume(delay=140){if(!stopped&&!controller)schedule(delay)},
  pause(){clear()},
  stop(){stopped=true;clear();controller?.abort()},
 };
}
