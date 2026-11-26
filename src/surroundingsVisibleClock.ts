/** Visibility-scoped clock for the compact MID surroundings map.
 * No network requests, animations, or weather-value changes. When a background
 * tab resumes, reconcile the local display time immediately to Date.now().
 * A single 30-second interval exists only while the document is visible.
 */
export function observeSurroundingsVisibleClock(
 documentLike:Pick<Document,'visibilityState'|'addEventListener'|'removeEventListener'>,
 onTick:(nowMs:number)=>void,
 intervalMs=30_000
):()=>void {
 if(!Number.isSafeInteger(intervalMs)||intervalMs<1000||intervalMs>60000)
  throw new RangeError('Invalid surroundings clock interval');
 let active=true;
 let interval:ReturnType<typeof setInterval>|undefined;
 const reconcile=()=>{
  if(!active)return;
  if(documentLike.visibilityState!=='visible'){
   if(interval!==undefined){clearInterval(interval);interval=undefined;}
   return;
  }
  if(interval!==undefined)return; // Do not double-tick or double-mount on duplicate events.
  onTick(Date.now());
  interval=setInterval(()=>{
   if(active&&documentLike.visibilityState==='visible')onTick(Date.now());
  },intervalMs);
 };
 documentLike.addEventListener('visibilitychange',reconcile);
 reconcile();
 return ()=>{
  if(!active)return;
  active=false;
  if(interval!==undefined){clearInterval(interval);interval=undefined;}
  documentLike.removeEventListener('visibilitychange',reconcile);
 };
}
