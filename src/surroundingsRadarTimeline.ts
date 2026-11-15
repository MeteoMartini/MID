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
/** A future step is NOWCAST, never an old radar frame or observational satellite. */
export function radarOriginalForStep(catalog:CompositeProductTimes|undefined,now:number,step:number,inDwdArea=true):SurroundingsRadarOriginal|undefined{
 if(!catalog||!inDwdArea)return undefined;
 const target=surroundingsRadarTarget(now,step);
 if(!Number.isFinite(target))return undefined;
 const future=step>0;
 const time=nearestVerifiedOriginal(future?catalog.dwdRadarNowcast:catalog.dwdRadar,target,now,future);
 return time===undefined?undefined:{time,kind:future?'Nowcast':'Beobachtung'};
}
