/**
 * MID Audit 1.1: complete 7-day, source-native sub-seasonal windows only.
 * Climate anomalies and mm/week totals must never be based on partial days.
 * No I/O, React, network, sort or mutation. Missing data stays missing.
 */
export type SubseasonalWeekMetric =
 'temperature_max'|'temperature_min'|'precipitation'|'pressure'|'cloud'|'wind';
export type SubseasonalWeekAggregation='mean'|'sum';
const DAY=86_400_000;
/** Reject null, strings, booleans and nonfinite observations (including "0"). */
export function nativeSubseasonalNumber(value:unknown):number{
 return typeof value==='number'&&Number.isFinite(value)?value:Number.NaN;
}
function parseDateDay(date:unknown):number|null{
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 const n=Date.parse(date+'T00:00:00Z');
 return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===date?n:null;
}
export function hasConsecutiveSubseasonalDates(dates:readonly string[]):boolean{
 if(!dates.length)return false;
 let previous=-Infinity;
 for(const value of dates){
  const day=parseDateDay(value);
  if(day===null||previous!==-Infinity&&day-previous!==DAY)return false;
  previous=day;
 }
 return true;
}
/**
 * Aggregates exactly seven original daily cells. Values from any partial
 * week, missing day, invalid physical unit or absent source stay null.
 * Temperature may be negative. Rainfall is never clipped or extrapolated.
 */
export function hasCompleteSubseasonalWeek(dates:readonly string[]):boolean{
 return dates.length===7&&hasConsecutiveSubseasonalDates(dates);
}
export function aggregateCompleteSubseasonalWeek(
 values:readonly number[],
 startIndex:number,
 aggregate:SubseasonalWeekAggregation,
 metric:SubseasonalWeekMetric,
):number|null{
 if(!Number.isSafeInteger(startIndex)||startIndex<0||values.length<startIndex+7)return null;
 let sum=0;
 for(let i=startIndex;i<startIndex+7;i++){
  const value=values[i];
  if(typeof value!=='number'||!Number.isFinite(value))return null;
  if(metric==='precipitation'||metric==='wind'){
   if(value<0)return null;
  }else if(metric==='cloud'){
   if(value<0||value>100)return null;
  }else if(metric==='pressure'&&value<=0)return null;
  sum+=value;
  if(!Number.isFinite(sum))return null;
 }
 return aggregate==='sum'?sum:sum/7;
}
