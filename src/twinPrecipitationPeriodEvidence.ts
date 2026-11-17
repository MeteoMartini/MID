/**
 * A daily accumulation is only usable when the source supplies authentic,
 * consecutive non-overlapping intervals spanning the EXACT local day in UTC.
 * Independently verify source, instrumentation, unit and observation QC first.
 * No missing interval is ever interpreted as 0 mm. No extreme is capped.
 */
export type TwinPrecipitationInterval = Readonly<{
 startMs:number;
 endMs:number;
 amountMm:number;
 sourceId:string;
}>;
export type TwinPrecipitationDayWindow = Readonly<{
 startMs:number;
 endMs:number;
 sourceId:string;
 maxIntervalMs?:number;
}>;
export type TwinDailyAccumulationEvidence =
 | Readonly<{status:'complete'; totalMm:number; expectedHours:number; intervals:number}>
 | Readonly<{status:'incomplete'|'invalid'; reason:string}>;

/** O(n), no sorting, allocations, I/O or mutation. Input intervals must be chronological. */
export function verifyTwinDailyAccumulation(
 window:TwinPrecipitationDayWindow,
 intervals:readonly TwinPrecipitationInterval[],
):TwinDailyAccumulationEvidence{
 const {startMs,endMs,sourceId,maxIntervalMs}=window;
 if(!Number.isSafeInteger(startMs)||!Number.isSafeInteger(endMs)||endMs<=startMs||
    !sourceId?.trim()||
    (maxIntervalMs!==undefined&&(!Number.isSafeInteger(maxIntervalMs)||maxIntervalMs<=0)))
  return {status:'invalid',reason:'invalid-day-window'};
 if(!intervals.length)return {status:'incomplete',reason:'no-observed-intervals'};
 let cursor=startMs,total=0;
 for(const interval of intervals){
  if(!Number.isSafeInteger(interval.startMs)||!Number.isSafeInteger(interval.endMs)||
     interval.endMs<=interval.startMs||interval.sourceId!==sourceId||
     typeof interval.amountMm!=='number'||!Number.isFinite(interval.amountMm)||interval.amountMm<0)
   return {status:'invalid',reason:'invalid-observation-or-provenance'};
  if(interval.startMs!==cursor)
   return {status:interval.startMs<cursor?'invalid':'incomplete',reason:interval.startMs<cursor?'overlapping-intervals':'missing-period'};
  if(interval.endMs>endMs||maxIntervalMs!==undefined&&interval.endMs-interval.startMs>maxIntervalMs)
   return {status:'invalid',reason:'outside-period-or-oversize-interval'};
  total+=interval.amountMm;
  if(!Number.isFinite(total))return {status:'invalid',reason:'nonfinite-total'};
  cursor=interval.endMs;
 }
 if(cursor!==endMs)return {status:'incomplete',reason:'missing-period'};
 return {status:'complete',totalMm:total,expectedHours:(endMs-startMs)/3600000,intervals:intervals.length};
}
