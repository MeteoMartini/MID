import {fetchWorkerJson} from './workerClient';
import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';

export type ForecastFusionTier=1|2|3|4;
export type ForecastFusionConfidence='high'|'medium'|'low';
export type ForecastFusionSource={
 id:string;
 label:string;
 family:string;
 tier:ForecastFusionTier;
 provider:string;
 successful:boolean;
 reason?:string;
};
export type ForecastFusionHour={
 time:string;
 epoch:number;
 temperature:number;
 dewPoint?:number;
 humidity?:number;
 pressure?:number;
 precipitation:number;
 probability:number;
 wind:number;
 gust:number;
 direction?:number;
 sunshineDuration?:number;
};
export type ForecastFusionMosmix={
 available:boolean;
 applied:boolean;
 quality:number;
 stationId?:string;
 stationName?:string;
 distanceKm?:number;
 stationElevation?:number;
 elevationDifferenceM?:number;
 coverageHours:number;
 coverageDays:number;
 source:string;
};
export type ForecastFusionDay={
 date:string;
 max:number;
 min:number;
 precipitation:number;
 probability:number;
 wind:number;
 gust:number;
 sunshineDuration:number;
 confidence:number;
 confidenceLabel:ForecastFusionConfidence;
 strength:number;
 families:number;
 applied:boolean;
 contributors:string[];
 mosmixApplied?:boolean;
};
export type ForecastFusionResult={
 schema:'mid.forecast-fusion.v1';
 version:number;
 generatedAt:string;
 active:boolean;
 summary:string;
 strategy:string;
 sources:ForecastFusionSource[];
 days:ForecastFusionDay[];
 modelDays?:ForecastFusionDay[];
 hours?:ForecastFusionHour[];
 mosmix?:ForecastFusionMosmix;
 error?:string;
 cached?:boolean;
};

const CACHE_PREFIX='mid:forecast-fusion:v2:';
const FRESH_MS=35*60*1000;
const STALE_MS=8*60*60*1000;

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
function cacheKey(lat:number,lon:number){return`${CACHE_PREFIX}${(Math.round(lat*20)/20).toFixed(2)}:${(Math.round(lon*20)/20).toFixed(2)}`}
function readCache(lat:number,lon:number,maxAge=STALE_MS){
 try{
  const parsed=JSON.parse(localStorage.getItem(cacheKey(lat,lon))||'null') as {at?:number;value?:ForecastFusionResult}|null;
  if(!parsed?.value||!Number.isFinite(parsed.at)||Date.now()-Number(parsed.at)>maxAge)return null;
  return{...parsed.value,cached:true} satisfies ForecastFusionResult;
 }catch{return null}
}
function writeCache(lat:number,lon:number,value:ForecastFusionResult){try{localStorage.setItem(cacheKey(lat,lon),JSON.stringify({at:Date.now(),value}))}catch{}}

export async function loadForecastFusion(lat:number,lon:number,country:string|undefined,elevation:number|undefined,signal?:AbortSignal):Promise<ForecastFusionResult|null>{
 const fresh=readCache(lat,lon,FRESH_MS);if(fresh)return fresh;
 try{
  const value=await fetchWorkerJson<ForecastFusionResult>('forecast-fusion',{lat,lon,country,elevation:Number.isFinite(elevation)?Math.round(Number(elevation)):undefined},{purpose:'general',signal,timeoutMs:24000,cache:'default',maxAgeMs:FRESH_MS,staleIfErrorMs:STALE_MS,cacheKey:`forecast-fusion:${cacheKey(lat,lon)}`});
  if(value.schema!=='mid.forecast-fusion.v1'||!Array.isArray(value.days)||Number(value.version)<1)throw new Error('Ungültige Mehrquellen-Prognose.');
  writeCache(lat,lon,value);return value;
 }catch(error){
  if(signal?.aborted)throw error;
  return readCache(lat,lon,STALE_MS);
 }
}

function applyForecastFusionDayRows(baseDays:Day[],rows:ForecastFusionDay[]|undefined,active:boolean){
 if(!active||!rows?.length)return baseDays;
 const byDate=new Map(rows.map(day=>[day.date,day]));let changed=false;
 const result=baseDays.map(day=>{
  const fused=byDate.get(day.date);if(!fused?.applied||fused.confidence<48)return day;
  const max=Number(fused.max),min=Number(fused.min),precipitation=Number(fused.precipitation),probability=Number(fused.probability),wind=Number(fused.wind),gust=Number(fused.gust),sunshineDuration=Number(fused.sunshineDuration);
  if(![max,min,precipitation].every(Number.isFinite)||max<min)return day;
  changed=true;
  return{...day,max,min,precipitation:Math.max(0,precipitation),probability:Number.isFinite(probability)?clamp(probability,0,100):day.probability,wind:Number.isFinite(wind)?Math.max(0,wind):day.wind,gust:Number.isFinite(gust)?Math.max(Number.isFinite(wind)?wind:day.wind,gust):day.gust,sunshineDuration:Number.isFinite(sunshineDuration)?clamp(sunshineDuration,0,86400):day.sunshineDuration};
 });
 return changed?result:baseDays;
}
export function applyForecastFusionDays(baseDays:Day[],fusion:ForecastFusionResult|null|undefined){return applyForecastFusionDayRows(baseDays,fusion?.days,Boolean(fusion?.active))}
export function applyForecastFusionModelDays(baseDays:Day[],fusion:ForecastFusionResult|null|undefined){return applyForecastFusionDayRows(baseDays,fusion?.modelDays,Boolean(fusion?.active))}

function precipitationParts(hour:Hour,target:number){
 const precipitation=Math.max(0,target),current=Math.max(0,hour.precipitation),sum=Math.max(0,hour.rain)+Math.max(0,hour.showers)+Math.max(0,hour.snowfall);
 if(sum>.001){const scale=precipitation/sum;return{precipitation,rain:Math.max(0,hour.rain*scale),showers:Math.max(0,hour.showers*scale),snowfall:Math.max(0,hour.snowfall*scale)}}
 if(precipitation<=current+.001)return{precipitation,rain:hour.rain,showers:hour.showers,snowfall:hour.snowfall};
 return hour.temperature<=1?{precipitation,rain:0,showers:0,snowfall:precipitation*.7}:{precipitation,rain:precipitation,showers:0,snowfall:0};
}

function nearestFusionHour(hours:ForecastFusionHour[],epoch:number){let best:ForecastFusionHour|undefined,distance=Infinity;for(const hour of hours){const delta=Math.abs(Number(hour.epoch)-epoch);if(delta<distance){best=hour;distance=delta}}return distance<=35*60000?best:undefined}
function blendToward(base:number,target:unknown,strength:number,cap:number){const value=Number(target);if(!Number.isFinite(value)||strength<=0)return base;return base+clamp(value-base,-cap,cap)*strength}

export function applyForecastFusionHours(hours:Hour[],baseDays:Day[],fusedDays:Day[],fusion?:ForecastFusionResult|null){
 if(hours.length===0)return hours;
 const dayAdjustment=baseDays!==fusedDays,mosmixHours=Array.isArray(fusion?.hours)?fusion.hours:[],mosmixQuality=clamp(Number(fusion?.mosmix?.quality)||0,0,1),mosmixUsable=Boolean(fusion?.active&&fusion?.mosmix?.available&&fusion?.mosmix?.applied&&mosmixHours.length&&mosmixQuality>=.42),baseByDate=new Map(baseDays.map(day=>[day.date,day])),fusedByDate=new Map(fusedDays.map(day=>[day.date,day]));let changed=false;
 const now=Date.now(),result=hours.map(hour=>{
  if(hour.epoch<now-3600000)return hour;
  const date=hour.time.slice(0,10),base=baseByDate.get(date),fused=fusedByDate.get(date);let next=hour;
  if(dayAdjustment&&base&&fused&&base!==fused){
   const baseCenter=(base.max+base.min)/2,fusedCenter=(fused.max+fused.min)/2,baseRange=Math.max(2,base.max-base.min),rangeScale=clamp((fused.max-fused.min)/baseRange,.78,1.24),temperature=fusedCenter+(hour.temperature-baseCenter)*rangeScale,temperatureDelta=temperature-hour.temperature,precipScale=base.precipitation>=.12?clamp(fused.precipitation/base.precipitation,.35,2.6):1,precipitation=hour.precipitation*precipScale,probabilityShift=clamp(fused.probability-base.probability,-25,25),probabilityFactor=hour.probability>=40?1:.65,windScale=base.wind>=2?clamp(fused.wind/base.wind,.72,1.38):1,gustScale=base.gust>=3?clamp(fused.gust/base.gust,.72,1.38):1,parts=precipitationParts(hour,precipitation);
   next={...hour,...parts,temperature,apparent:hour.apparent+temperatureDelta,probability:clamp(hour.probability+probabilityShift*probabilityFactor,0,100),wind:Math.max(0,hour.wind*windScale),gust:Math.max(Math.max(0,hour.wind*windScale),hour.gust*gustScale)};changed=true;
  }
  if(!mosmixUsable)return next;
  const mosmix=nearestFusionHour(mosmixHours,hour.epoch);if(!mosmix)return next;
  const leadHours=(hour.epoch-now)/3600000;if(leadHours<-.5||leadHours>240)return next;
  const leadStrength=leadHours<=6?.18:leadHours<=48?.38:leadHours<=120?.3:.18,temperatureStrength=leadStrength*mosmixQuality,temperature=blendToward(next.temperature,mosmix.temperature,temperatureStrength,3),temperatureDelta=temperature-next.temperature,humidity=blendToward(next.humidity,mosmix.humidity,leadStrength*mosmixQuality*.55,18),dewPoint=blendToward(next.dewPoint,mosmix.dewPoint,leadStrength*mosmixQuality*.7,4),pressure=blendToward(next.pressure,mosmix.pressure,leadStrength*mosmixQuality*.35,5),wind= Math.max(0,blendToward(next.wind,mosmix.wind,leadStrength*mosmixQuality*.58,7)),gust=Math.max(wind,blendToward(next.gust,mosmix.gust,leadStrength*mosmixQuality*.58,10)),probability=clamp(blendToward(next.probability,mosmix.probability,leadStrength*mosmixQuality*.68,22),0,100),precipStrength=(leadHours<=6?.06:leadHours<=48?.18:.22)*mosmixQuality,precipitation=Math.max(0,blendToward(next.precipitation,mosmix.precipitation,precipStrength,Math.max(1.5,next.precipitation*1.2))),parts=precipitationParts(next,precipitation);
  changed=true;return{...next,...parts,temperature,apparent:next.apparent+temperatureDelta,humidity,dewPoint,pressure,probability,wind,gust};
 });
 return changed?result:hours;
}

export function applyOperationalNowcastHours(hours:Hour[],radar:RadarNowcast|null|undefined){
 if(!radar||radar.source==='model'||radar.coverage===false||hours.length===0)return hours;
 const now=Date.now(),quality=radar.quality==='high'?.68:radar.quality==='medium'?.48:.28,radarProbability=clamp(Number(radar.radarProbability)||0,0,100),arrival=Math.max(0,Number.isFinite(radar.arrivalMinutes)?Number(radar.arrivalMinutes):0),end=Math.max(arrival+30,Number.isFinite(radar.endMinutes)?Number(radar.endMinutes):180),rate=Math.max(0,Number(radar.currentRate)||Number(radar.peakRate)||0);let changed=false;
 const result=hours.map(hour=>{
  const minutes=(hour.epoch-now)/60000;if(minutes<-30||minutes>210)return hour;
  const inWindow=minutes+30>=arrival&&minutes-30<=end,leadFactor=clamp(1-Math.max(0,minutes)/240,.35,1),blend=quality*leadFactor;
  let probability=hour.probability,precipitation=hour.precipitation;
  if(inWindow){probability=clamp(hour.probability*(1-blend)+radarProbability*blend,0,100);if(rate>.02)precipitation=Math.max(hour.precipitation,rate*Math.max(.18,.55*leadFactor)*blend)}
  else if(radar.quality==='high'&&radarProbability<=12&&minutes<=120)probability=clamp(hour.probability*(1-.28*leadFactor),0,100);
  if(Math.abs(probability-hour.probability)<.1&&Math.abs(precipitation-hour.precipitation)<.01)return hour;
  changed=true;return{...hour,...precipitationParts(hour,precipitation),probability};
 });
 return changed?result:hours;
}


export function applyConvectiveNowcastHours(hours:Hour[],thunder:ThunderstormNowcast|null|undefined){
 const cell=thunder?.nearest;if(!thunder?.available||!cell||cell.isApproaching===false||!Number.isFinite(cell.arrivalMinutes)||Number(cell.arrivalMinutes)>210)return hours;
 const now=Date.now(),arrival=Math.max(0,Number(cell.arrivalMinutes)),severity=clamp(Number(cell.severity)||0,0,10),lightning=Math.max(0,Number(cell.lightningRate)||0),baseSignal=clamp(28+severity*6+Math.min(25,lightning*1.8),35,92);let changed=false;
 const result=hours.map(hour=>{const minutes=(hour.epoch-now)/60000,distance=Math.abs(minutes-arrival);if(minutes<-30||distance>105)return hour;const leadFactor=clamp(1-distance/120,.18,1),capeSupport=clamp((Number(hour.cape)||0)/900,0,1),probability=clamp(Math.max(hour.probability,baseSignal*(.72+.28*capeSupport)*leadFactor),0,100),strong=probability>=58&&(severity>=4||lightning>=4),code=strong&&![95,96,99].includes(hour.code)?95:hour.code;if(Math.abs(probability-hour.probability)<.1&&code===hour.code)return hour;changed=true;return{...hour,probability,code}});
 return changed?result:hours;
}

export function forecastFusionLabel(fusion:ForecastFusionResult|null|undefined){
 if(!fusion?.active)return'';
 const applied=fusion.days.filter(day=>day.applied),confidence=applied.length?Math.round(applied.reduce((sum,day)=>sum+day.confidence,0)/applied.length):0;
 return`MID Mehrquellen${fusion.mosmix?.applied?' + MOSMIX':''} · ${confidence}% Konsens`;
}
