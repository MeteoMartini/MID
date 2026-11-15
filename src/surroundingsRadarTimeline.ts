import type {CompositeProductTimes,ProductTime} from './CompositeData';
import {SURROUNDINGS_QUARTER_HOUR_MS} from './surroundingsQuarterHour';

export const SURROUNDINGS_RADAR_MIN_STEP=-3;
export const SURROUNDINGS_RADAR_MAX_STEP=8;
const TOLERANCE_MS=7.5*60_000;
export type SurroundingsRadarOriginal={time:number;kind:'Beobachtung'|'Nowcast'};

export function sourceOriginalTimes(values:ProductTime[]|undefined):number[]{
 return [...new Set((values??[]).map(value=>typeof value==='number'?value*(value<1e12?1000:1):Date.parse(value)).filter(Number.isFinite))].sort((a,b)=>a-b);
}
/** This is a UTC wall-clock-relative request target: actual original source stamps are separately resolved. No manufactured 15-minute source validity. */
export function surroundingsRadarTarget(now:number,step:number):number{
 if(!Number.isFinite(now)||!Number.isInteger(step)||step<SURROUNDINGS_RADAR_MIN_STEP||step>SURROUNDINGS_RADAR_MAX_STEP)return NaN;
 return now+step*SURROUNDINGS_QUARTER_HOUR_MS;
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
 const time=nearestVerifiedOriginal(future?catalog.dwdRadarNowcast:catalog.dwdRadar,target,now,future);
 return time===undefined?undefined:{time,kind:future?'Nowcast':'Beobachtung'};
}
