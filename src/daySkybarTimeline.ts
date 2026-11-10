import {localIsoToEpoch} from './timeDisplay';
import {addForecastDays} from './forecastPeriods';
export type DaySkybarTimedSample={epoch?:number};
export type DaySkybarCalendarWindow={startEpoch:number;endEpoch:number};
const ONE_HOUR_MS=3_600_000;
// Source epochs: absent, blank and boolean values are unknown, never Unix 0.
export const daySkybarEpoch=(sample:DaySkybarTimedSample):number=>{const value=(sample as {epoch?:unknown}).epoch;return typeof value==='number'||(typeof value==='string'&&value.trim()!=='')?Number(value):NaN};

/** Calendar-day UTC bounds for the forecast location. Handles real 23/25-hour DST dates. */
export function daySkybarCalendarWindow(date:string,timeZone:string):DaySkybarCalendarWindow|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!timeZone)return null;
 try{new Intl.DateTimeFormat('en-US',{timeZone}).format(0)}catch{return null}
 const nextDate=addForecastDays(date,1);
 if(nextDate===date)return null;
 const startEpoch=localIsoToEpoch(`${date}T00:00`,timeZone),endEpoch=localIsoToEpoch(`${nextDate}T00:00`,timeZone);
 return Number.isFinite(startEpoch)&&Number.isFinite(endEpoch)&&endEpoch-startEpoch>=22*ONE_HOUR_MS&&endEpoch-startEpoch<=26*ONE_HOUR_MS?{startEpoch,endEpoch}:null;
}

/** Real filled-hour positions, with empty intervals left intentionally unknown. */
export function daySkybarHourEndPositions(samples:DaySkybarTimedSample[],window:DaySkybarCalendarWindow,left=1.5,right=1.5,width=100){
 const span=window.endEpoch-window.startEpoch,trackWidth=Math.max(0,width-left-right);
 return samples.map(sample=>{const epoch=daySkybarEpoch(sample);return Number.isFinite(epoch)&&epoch>=window.startEpoch&&epoch<window.endEpoch?left+clamp((Math.min(window.endEpoch,epoch+ONE_HOUR_MS)-window.startEpoch)/span,0,1)*trackWidth:NaN});
}

/** Missing coverage is not clear sky and never contributes zero precipitation. */
export function daySkybarUnavailableRanges(samples:DaySkybarTimedSample[],window:DaySkybarCalendarWindow){
 const intervals=samples.map(daySkybarEpoch).filter(Number.isFinite).map(epoch=>({start:Math.max(window.startEpoch,epoch),end:Math.min(window.endEpoch,epoch+ONE_HOUR_MS)})).filter(interval=>interval.end>interval.start).sort((a,b)=>a.start-b.start);
 const gaps:{start:number;end:number}[]=[],end=window.endEpoch;let cursor=window.startEpoch;
 for(const item of intervals){if(item.start>cursor)gaps.push({start:cursor,end:item.start});cursor=Math.max(cursor,item.end)}
 if(cursor<end)gaps.push({start:cursor,end});return gaps;
}


const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

/**
 * Positions local-calendar-day samples on their real elapsed-time axis.
 * This preserves 23 h and 25 h DST days and keeps repeated local clock
 * hours distinct when their epochs differ.
 */
export function daySkybarTimelinePositions(
  samples:DaySkybarTimedSample[],
  left=1.5,
  right=1.5,
  width=100,
  calendarWindow?:DaySkybarCalendarWindow|null,
){
  if(!samples.length)return[] as number[];
  const trackWidth=Math.max(0,width-left-right);
  const epochs=samples.map(daySkybarEpoch),known=epochs.filter(Number.isFinite);
  const strictlyIncreasing=known.every((epoch,index)=>index===0||epoch>known[index-1]);
  if(calendarWindow&&calendarWindow.endEpoch>calendarWindow.startEpoch){
    const span=calendarWindow.endEpoch-calendarWindow.startEpoch;
    return epochs.map(epoch=>strictlyIncreasing&&Number.isFinite(epoch)&&epoch>=calendarWindow.startEpoch&&epoch<calendarWindow.endEpoch?left+clamp((epoch-calendarWindow.startEpoch)/span,0,1)*trackWidth:NaN);
  }
  if(strictlyIncreasing&&known.length>1){
    const gaps=known.slice(1).map((epoch,index)=>epoch-known[index]).filter(gap=>gap>=15*60_000&&gap<=3*60*60_000).sort((a,b)=>a-b);
    const interval=gaps.length?gaps[Math.floor(gaps.length/2)]:60*60_000;
    const start=known[0],end=known.at(-1)!+interval,span=Math.max(1,end-start);
    return epochs.map(epoch=>Number.isFinite(epoch)?left+clamp((epoch-start)/span,0,1)*trackWidth:NaN);
  }
  return samples.map((_,index)=>Number.isFinite(epochs[index])?left+(index/Math.max(1,samples.length))*trackWidth:NaN);
}
