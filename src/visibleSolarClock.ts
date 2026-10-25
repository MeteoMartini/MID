import {solarDaylightWindowAt} from './astronomy';

type SolarLocation={latitude:number;longitude:number;elevation?:number;timezone?:string};

/** Only the foreground page needs a running solar-clock timeout.
 * Keep the original 30-second ceiling and 250-ms solar-boundary response.
 * Date.now is read anew after visibility/focus restoration, including DST days.
 */
export function startVisibleSolarClock(
 location:SolarLocation,
 tick:()=>void,
 now:()=>number=()=>Date.now(),
 daylightAt:typeof solarDaylightWindowAt=solarDaylightWindowAt
):()=>void{
 let timer=0,disposed=false;
 const cancel=()=>{if(timer){window.clearTimeout(timer);timer=0}};
 const schedule=()=>{
  cancel();
  if(disposed||document.visibilityState==='hidden')return;
  const epoch=now(),daylight=daylightAt(epoch,location);
  const boundaries=[daylight.sunrise?.getTime(),daylight.sunset?.getTime()]
   .filter((value):value is number=>Number.isFinite(value)&&Number(value)>epoch);
  const next=boundaries.length?Math.min(...boundaries):Number.NaN;
  const delay=Number.isFinite(next)?Math.max(250,Math.min(30000,next-epoch+250)):30000;
  timer=window.setTimeout(()=>{
   timer=0;
   if(disposed||document.visibilityState==='hidden')return;
   tick();
   schedule();
  },delay);
 };
 const visibility=()=>{if(document.visibilityState==='hidden'){cancel();return}tick();schedule()};
 const focus=()=>{if(document.visibilityState!=='hidden'){tick();schedule()}};
 schedule();
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('focus',focus);
 return()=>{disposed=true;cancel();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('focus',focus)};
}
