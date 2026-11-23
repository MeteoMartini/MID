/**
 * MID Audit 1.4: native UTC and completeness evidence for travel GEFS.
 * Open-Meteo hourly precipitation is the sum of the PRECEDING hour.
 * A missing hour is never interpreted as dry (0 mm); extremes remain intact.
 * Pure O(n), no network, timers or UI dependency.
 */
export type GefsDayEvidence={
 date:string;min:number;max:number;mean:number;precipitation:number|null;
 temperatureComplete:boolean;precipitationComplete:boolean;
 temperatureHours:number;precipitationHours:number;precipitationExtreme:boolean;
};
type RawHourly={time?:unknown;temperature_2m?:unknown;precipitation?:unknown};
type RawUnits={temperature_2m?:unknown;precipitation?:unknown};
const HOUR=3600000;
const UTC_HOUR=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):00(?::00)?Z?$/;
const UTC_DATE=/^\d{4}-\d{2}-\d{2}$/;
function parseHour(value:unknown):number|null{
 if(typeof value!=='string')return null;
 const m=UTC_HOUR.exec(value);if(!m)return null;
 const epoch=Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]);
 return Number.isFinite(epoch)&&new Date(epoch).toISOString().slice(0,16)===value.slice(0,16)?epoch:null;
}
function utcDay(epoch:number){return new Date(epoch).toISOString().slice(0,10)}
function parseDay(value:unknown):number|null{
 if(typeof value!=='string'||!UTC_DATE.test(value))return null;
 const epoch=Date.parse(value+'T00:00:00.000Z');
 return Number.isFinite(epoch)&&utcDay(epoch)===value?epoch:null;
}
function finiteNumber(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)}
export function consecutiveUtcWeek(days:readonly string[]):boolean{
 if(days.length!==7)return false;
 const start=parseDay(days[0]);
 return start!==null&&days.every((day,i)=>parseDay(day)===start+i*24*HOUR);
}
/** Original UTC samples must be complete and strictly ordered. Unit mismatch fails closed per parameter. */
export function aggregateGefsUtcDays(hourly:RawHourly|undefined,units:RawUnits|undefined,utcOffsetSeconds:unknown=0):GefsDayEvidence[]{
 const times=hourly?.time,temperatures=hourly?.temperature_2m,precip=hourly?.precipitation;
 if(!Array.isArray(times)||!Array.isArray(temperatures)||!Array.isArray(precip)||times.length!==temperatures.length||times.length!==precip.length||utcOffsetSeconds!==0)return[];
 const tempUnit=units?.temperature_2m,precipUnit=units?.precipitation;
 const tempUnitOk=tempUnit==='°C'||tempUnit==='°c'||tempUnit==='C';
 const precipUnitOk=precipUnit==='mm';
 type Bucket={temps:Map<number,number|null>;rain:Map<number,number|null>};
 const buckets=new Map<string,Bucket>();
 const get=(day:string):Bucket=>{let b=buckets.get(day);if(!b){b={temps:new Map(),rain:new Map()};buckets.set(day,b)}return b};
 let last=-Infinity;
 for(let i=0;i<times.length;i++){
  const epoch=parseHour(times[i]);if(epoch===null||epoch<=last)return[];
  last=epoch;
  const temp=temperatures[i];
  get(utcDay(epoch)).temps.set(epoch,finiteNumber(temp)&&temp>-100&&temp<80?temp:null);
  const rain=precip[i];
  // At 00:00 UTC the preceding-hour amount belongs to the previous UTC day.
  get(utcDay(epoch-1)).rain.set(epoch,finiteNumber(rain)&&rain>=0?rain:null);
 }
 return [...buckets].sort(([a],[b])=>a.localeCompare(b)).map(([date,b])=>{
  const start=parseDay(date)!;
  const temps:number[]=[],rain:number[]=[];
  for(let h=0;h<24;h++){const value=b.temps.get(start+h*HOUR);if(finiteNumber(value))temps.push(value)}
  for(let h=1;h<=24;h++){const value=b.rain.get(start+h*HOUR);if(finiteNumber(value))rain.push(value)}
  const temperatureComplete=tempUnitOk&&b.temps.size===24&&temps.length===24;
  const precipitationComplete=precipUnitOk&&b.rain.size===24&&rain.length===24;
  const precipitationExtreme=rain.some(value=>value>=200); // source-quality review, not clipping
  return{date,min:temperatureComplete?Math.min(...temps):NaN,max:temperatureComplete?Math.max(...temps):NaN,mean:temperatureComplete?temps.reduce((a,b)=>a+b,0)/24:NaN,
   precipitation:precipitationComplete?rain.reduce((sum,value)=>sum+value,0):null,
   temperatureComplete,precipitationComplete,temperatureHours:temps.length,precipitationHours:rain.length,precipitationExtreme};
 });
}


/** Source-native weekly MEAN fields may shift the matching daily climate MEAN;
 * 6h temperature extrema, weekly rain and daily wet probability are excluded. */
type Ec46DailySignal={tempMeanAnomaly?:unknown;windAnomalyKn?:unknown;cloudAnomalyPct?:unknown;snowDepthAnomalyCm?:unknown};
type Ec46DailyBase={meanMean?:unknown;maxMean?:unknown;minMean?:unknown;maxP25?:unknown;maxP75?:unknown;minP25?:unknown;minP75?:unknown;windMean?:unknown;cloudMean?:unknown;snowDepthMean?:unknown};
export function ec46DailyApplicability(signal:Ec46DailySignal,day:Ec46DailyBase){
 const temperature=finiteNumber(signal.tempMeanAnomaly)&&[day.meanMean,day.maxMean,day.minMean,day.maxP25,day.maxP75,day.minP25,day.minP75].every(finiteNumber);
 const wind=finiteNumber(signal.windAnomalyKn)&&finiteNumber(day.windMean);
 const cloud=finiteNumber(signal.cloudAnomalyPct)&&finiteNumber(day.cloudMean);
 const snowDepth=finiteNumber(signal.snowDepthAnomalyCm)&&finiteNumber(day.snowDepthMean);
 return{temperature,wind,cloud,snowDepth};
}
