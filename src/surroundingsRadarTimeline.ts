import type {CompositeProductTimes,ProductTime} from './CompositeData';
import {retainLoadedRadarStand} from './CompositeTimeline';

export const SURROUNDINGS_RADAR_MIN_STEP=-9;
export const SURROUNDINGS_RADAR_MAX_STEP=24;
export const SURROUNDINGS_RADAR_STEP_MS=5*60_000;
const RADAR_TOLERANCE_MS=SURROUNDINGS_RADAR_STEP_MS/2;
const TOLERANCE_MS=7.5*60_000; // Legacy nearest helper; satellite selection validates its own original cadence.
export type SurroundingsRadarOriginal={time:number;kind:'Beobachtung'|'Nowcast'};

export function sourceOriginalTimes(values:ProductTime[]|undefined):number[]{
 return [...new Set((values??[]).map(value=>typeof value==='number'?value*(value<1e12?1000:1):Date.parse(value)).filter(Number.isFinite))].sort((a,b)=>a-b);
}
/** UTC 5-minute selection grid. Original data remain bound to their unrounded source timestamps. */
export function surroundingsRadarTarget(now:number,step:number):number{
 if(!Number.isFinite(now)||!Number.isInteger(step)||step<SURROUNDINGS_RADAR_MIN_STEP||step>SURROUNDINGS_RADAR_MAX_STEP)return NaN;
 return Math.floor(now/SURROUNDINGS_RADAR_STEP_MS)*SURROUNDINGS_RADAR_STEP_MS+step*SURROUNDINGS_RADAR_STEP_MS;
}
export function nearestVerifiedOriginal(values:ProductTime[]|undefined,target:number,now:number,allowFuture=false):number|undefined{
 if(!Number.isFinite(target)||!Number.isFinite(now))return undefined;
 const frames=sourceOriginalTimes(values).filter(time=>
  (allowFuture?time>now+90_000:time<=now+90_000)&&
  Math.abs(time-target)<=TOLERANCE_MS
 );
 return frames.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||b-a)[0];
}
/** Match the fully resolved WMS URL (provider, layer, bbox, source time) as well
 * as original validity/phase. A frame cached for another location, timestamp
 * or observation/nowcast type must never appear while a new image loads.
 */
export function selectVerifiedSurroundingsRadarFrame(
 loaded:(SurroundingsRadarOriginal&{url:string})|undefined,
 requestedUrl:string,
 requested:SurroundingsRadarOriginal|undefined
):(SurroundingsRadarOriginal&{url:string})|undefined{
 if(!loaded||!requested||!requestedUrl||
  loaded.url!==requestedUrl||loaded.time!==requested.time||loaded.kind!==requested.kind)return undefined;
 return loaded;
}

/** OPERA raster is a genuine observation, not a time-interpolated forecast.
 * Match its entire location/bbox request identity on every render; even a
 * valid timestamp from a previous location must never flash under a new map.
 * The future tolerance is only for source-clock skew, not a nowcast.
 */
export type SurroundingsOperaOriginal={url:string;time:number;requestKey:string};
export function selectVerifiedSurroundingsOperaFrame<T extends SurroundingsOperaOriginal>(
 frame:T|undefined,requestKey:string,now:number
):T|undefined{
 if(!frame||!requestKey||frame.requestKey!==requestKey||
  !frame.url.startsWith('data:image/png;base64,')||!Number.isFinite(frame.time)||
  !Number.isFinite(now)||frame.time<now-45*60_000||frame.time>now+90_000)return undefined;
 return frame;
}

/** A future step is NOWCAST, never an old radar frame or observational satellite. */
export function radarOriginalForStep(catalog:CompositeProductTimes|undefined,now:number,step:number,inDwdArea=true):SurroundingsRadarOriginal|undefined{
 if(!catalog||!inDwdArea)return undefined;
 const target=surroundingsRadarTarget(now,step);
 if(!Number.isFinite(target))return undefined;
 const future=step>0;
 const candidates=sourceOriginalTimes(future?catalog.dwdRadarNowcast:catalog.dwdRadar).filter(time=>
  future?time>now+90_000&&Math.abs(time-target)<=RADAR_TOLERANCE_MS:
  time<=now+90_000&&(step===0?time>=now-10*60_000:Math.abs(time-target)<=RADAR_TOLERANCE_MS));
 const time=candidates.sort((a,b)=>step===0?b-a:Math.abs(a-target)-Math.abs(b-target)||b-a)[0];
 return time===undefined?undefined:{time,kind:future?'Nowcast':'Beobachtung'};
}

/** Only an already-presented DWD image with identical WMS geometry, layer and
 * observation/nowcast phase may bridge an adjacent requested source frame.
 * Its original time is never replaced by the selected cursor time.
 */
export function selectRetainedSurroundingsRadarFrame(
 loaded:(SurroundingsRadarOriginal&{url:string})|undefined,requestedUrl:string,
 requested:SurroundingsRadarOriginal|undefined,now:number,target:number
):(SurroundingsRadarOriginal&{url:string})|undefined{
 if(!loaded||!requested||!loaded.url||!requestedUrl||loaded.kind!==requested.kind||
    ![loaded.time,requested.time,now,target].every(Number.isFinite)||
    Math.abs(loaded.time-target)>15*60_000)return undefined;
 try{
  const previous=new URL(loaded.url),next=new URL(requestedUrl);
  if(previous.origin!==next.origin||previous.pathname!==next.pathname)return undefined;
  previous.searchParams.delete('time');next.searchParams.delete('time');
  previous.searchParams.sort();next.searchParams.sort();
  if(previous.search!==next.search)return undefined;
 }catch{return undefined}
 return retainLoadedRadarStand(loaded.time/1000,now/1000,target/1000)?loaded:undefined;
}
