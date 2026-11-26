import type {Map as MapLibreMap} from 'maplibre-gl';
import {planSurroundingsViewportRaster,type SurroundingsRasterPlan} from './surroundingsViewportRaster';

export type SurroundingsViewportObserverOptions={overscanPixels?:number;debounceMs?:number};
/** Read-only, coalesced map-camera observation. It does not issue WMS requests,
 * mutate the camera, replace weather values, or decide source coverage.
 * MapLibre resize can fire BOTH resize and moveend: debounce them as one read.
 */
export function observeSurroundingsViewportRaster(
 map:Pick<MapLibreMap,'getBounds'|'getContainer'|'on'|'off'>,
 onChange:(plan:SurroundingsRasterPlan|undefined)=>void,
 {overscanPixels=12,debounceMs=160}:SurroundingsViewportObserverOptions={}
):()=>void{
 if(!Number.isInteger(debounceMs)||debounceMs<0||debounceMs>2000)throw new RangeError('Invalid viewport debounce');
 let active=true;
 let pending:ReturnType<typeof setTimeout>|undefined;
 let previousIdentity:string|null=null;
 const read=()=>{
  if(!active)return;
  let plan:SurroundingsRasterPlan|undefined;
  try{
   const b=map.getBounds(),container=map.getContainer();
   plan=planSurroundingsViewportRaster({west:b.getWest(),south:b.getSouth(),east:b.getEast(),north:b.getNorth()},
    {width:container.clientWidth,height:container.clientHeight},overscanPixels);
  }catch{/* Map teardown, missing camera, or invalid bounds: fail closed. */}
  // An unavailable plan must actively revoke an earlier, now-invalid geometry.
  const identity=plan?`${plan.bbox}|${plan.width}|${plan.height}`:'no-raster-plan';
  if(identity===previousIdentity)return;
  previousIdentity=identity;
  onChange(plan);
 };
 const schedule=()=>{
  if(!active)return;
  if(pending!==undefined)clearTimeout(pending);
  pending=setTimeout(()=>{pending=undefined;read()},debounceMs);
 };
 map.on('moveend',schedule);
 map.on('resize',schedule);
 schedule(); // The child observer mounts after the parent's initial fitBounds effect.
 return()=>{
  if(!active)return;
  active=false;
  if(pending!==undefined)clearTimeout(pending);
  pending=undefined;
  map.off('moveend',schedule);
  map.off('resize',schedule);
 };
}