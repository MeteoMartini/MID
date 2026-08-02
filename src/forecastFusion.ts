import {fetchWorkerJson} from './workerClient';
import {reconcileForecastPrecipitation} from './precipitation';
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

/**
 * Bindet den aktuell angezeigten Temperaturwert an die nächstgelegene
 * Stundenposition. Dadurch kann eine frische Stations-/Current-Beobachtung
 * nicht außerhalb der sichtbaren Tages- und Stundenprognose liegen.
 */
export function reconcileCurrentTemperatureObservation(hours:Hour[],temperature:number,observedAt=Date.now()){
 if(!hours.length||!Number.isFinite(temperature)||!Number.isFinite(observedAt))return hours;
 let bestIndex=-1,bestDistance=Number.POSITIVE_INFINITY;
 hours.forEach((hour,index)=>{const distance=Math.abs(Number(hour.epoch)-observedAt);if(Number.isFinite(hour.epoch)&&distance<bestDistance){bestDistance=distance;bestIndex=index}});
 if(bestIndex<0||bestDistance>90*60000)return hours;
 const current=hours[bestIndex];if(Math.abs(current.temperature-temperature)<.05)return hours;
 const result=[...hours];result[bestIndex]={...current,temperature};return result;
}
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
  const precipitationSignal=reconcileForecastPrecipitation({precipitation:Math.max(0,precipitation),probability:Number.isFinite(probability)?clamp(probability,0,100):day.probability,code:day.code});
  changed=true;
  return{...day,max,min,precipitation:precipitationSignal.precipitation,probability:precipitationSignal.probability,code:precipitationSignal.code,wind:Number.isFinite(wind)?Math.max(0,wind):day.wind,gust:Number.isFinite(gust)?Math.max(Number.isFinite(wind)?wind:day.wind,gust):day.gust,sunshineDuration:Number.isFinite(sunshineDuration)?clamp(sunshineDuration,0,86400):day.sunshineDuration};
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

function precipitationWeatherCode(code:number){const value=Math.round(Number(code));return[51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(value)}
function drySkyCode(hour:Hour){
 const code=Math.round(Number(hour.code));if([45,48].includes(code))return code;
 const cloud=Number(hour.cloud);if(!Number.isFinite(cloud))return hour.isDay?2:1;
 if(cloud<=15)return 0;if(cloud<=45)return 1;if(cloud<=80)return 2;return 3;
}

const DAY_HOURLY_PRECIPITATION_MIN_MM=.1;
const DAY_HOURLY_PRECIPITATION_DEFICIT_MIN_MM=.05;
const DAY_HOURLY_PROBABILITY_SUPPORT_MIN=20;
const DAY_HOURLY_FULL_COVERAGE_MIN_HOURS=18;

function inferredPrecipitationCode(hour:Hour){
 const code=Math.round(Number(hour.code));if(precipitationWeatherCode(code))return code;
 const convective=Math.max(0,Number(hour.showers)||0)>=.01||Math.max(0,Number(hour.cape)||0)>=250;
 if(Number(hour.temperature)<=.5)return convective?85:71;
 return convective?80:61;
}

function distributeDailyPrecipitationDeficit(hours:Hour[],day:Day){
 const total=Math.max(0,Number(day.precipitation)||0),existing=hours.reduce((sum,hour)=>sum+Math.max(0,Number(hour.precipitation)||0),0),deficit=total-existing,maxProbability=Math.max(0,...hours.map(hour=>clamp(Number(hour.probability)||0,0,100)));
 if(total<DAY_HOURLY_PRECIPITATION_MIN_MM||deficit<DAY_HOURLY_PRECIPITATION_DEFICIT_MIN_MM||maxProbability<DAY_HOURLY_PROBABILITY_SUPPORT_MIN)return hours;
 // Ein nasser Wettercode darf die Stunde priorisieren, aber niemals allein
 // eine Tagesmenge in eine Stunde mit 0–5 % Wahrscheinlichkeit verschieben.
 const supportThreshold=Math.max(15,maxProbability*.45),ranked=hours.map((hour,index)=>({hour,index,probability:clamp(Number(hour.probability)||0,0,100),wet:precipitationWeatherCode(hour.code)})).filter(item=>item.probability>=supportThreshold).sort((a,b)=>(b.wet?18:0)+b.probability-((a.wet?18:0)+a.probability));
 if(!ranked.length)return hours;
 const count=Math.min(ranked.length,6,Math.max(1,Math.ceil(deficit/.1))),selected=ranked.slice(0,count),weightTotal=selected.reduce((sum,item)=>sum+Math.pow(Math.max(1,item.probability-10)+(item.wet?12:0),1.25),0);let remaining=deficit;
 const additions=new Map<number,number>();
 selected.forEach((item,position)=>{const share=position===selected.length-1?remaining:deficit*Math.pow(Math.max(1,item.probability-10)+(item.wet?12:0),1.25)/Math.max(.001,weightTotal),addition=Math.max(0,Math.min(remaining,share));additions.set(item.index,addition);remaining=Math.max(0,remaining-addition)});
 return hours.map((hour,index)=>{const addition=additions.get(index)||0;if(addition<.001)return hour;const target=Math.max(0,hour.precipitation)+addition,parts=precipitationParts(hour,target),code=inferredPrecipitationCode(hour),phase=[80,81,82].includes(code)&&parts.showers<.001?{...parts,rain:0,showers:target}:parts,signal=reconcileForecastPrecipitation({...phase,probability:hour.probability,code,cloud:hour.cloud});return{...hour,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code}});
}

/**
 * Tagesmengen und Stundenkurve stammen bei Best Match, Mehrquellenfusion und
 * lokalem Wetterzwilling teilweise aus unterschiedlichen Aggregationen. Ist
 * ein künftiger Tag vollständig stündlich abgedeckt, zeigt eine belastbare
 * Stundenwahrscheinlichkeit aber keine Menge, wird ausschließlich die bislang
 * nicht zugeordnete Tagesmenge auf die wahrscheinlichsten Stunden verteilt.
 * So bleibt die Tagesmenge erhalten, ohne im Detaildiagramm unsichtbar zu sein.
 */
function reconcileForecastHourPrecipitation(hour:Hour){
 const signal=reconcileForecastPrecipitation({...hour,cloud:hour.cloud});
 if(signal.precipitation===hour.precipitation&&signal.rain===hour.rain&&signal.showers===hour.showers&&signal.snowfall===hour.snowfall&&signal.probability===hour.probability&&signal.code===hour.code)return hour;
 return{...hour,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code};
}

export function reconcileForecastHoursWithDays(hours:Hour[],days:Day[]){
 if(hours.length===0)return hours;
 // Letzte gemeinsame Forecast-Stufe: Auch Signale, die nach dem ursprünglichen
 // API-Mapping durch Fusion, Wetterzwilling oder Nowcast entstanden sind,
 // werden hier nochmals einheitlich geprüft.
 const normalized=hours.map(reconcileForecastHourPrecipitation),normalizedChanged=normalized.some((hour,index)=>hour!==hours[index]);
 if(days.length===0)return normalizedChanged?normalized:hours;
 const now=Date.now(),daysByDate=new Map(days.map(day=>[day.date,day])),hoursByDate=new Map<string,{rows:{hour:Hour;index:number}[];allFuture:boolean}>();
 normalized.forEach((hour,index)=>{const date=hour.time.slice(0,10),bucket=hoursByDate.get(date)??{rows:[],allFuture:true};bucket.rows.push({hour,index});bucket.allFuture=bucket.allFuture&&hour.epoch>now;hoursByDate.set(date,bucket)});
 let result=normalized,changed=normalizedChanged;
 for(const[date,bucket]of hoursByDate){const day=daysByDate.get(date);if(!day||!bucket.allFuture||bucket.rows.length<DAY_HOURLY_FULL_COVERAGE_MIN_HOURS)continue;const adjusted=distributeDailyPrecipitationDeficit(bucket.rows.map(item=>item.hour),day);if(adjusted.every((hour,index)=>hour===bucket.rows[index].hour))continue;if(result===normalized)result=[...normalized];adjusted.forEach((hour,index)=>{result[bucket.rows[index].index]=hour});changed=true}
 return changed?result:hours;
}

function dryAdjustedHour(hour:Hour,probability:number,precipitation:number){
 const dry=probability<=12&&precipitation<=.05,parts=precipitationParts(hour,dry?0:precipitation),code=dry&&precipitationWeatherCode(hour.code)?drySkyCode(hour):hour.code,signal=reconcileForecastPrecipitation({...parts,probability,code,cloud:hour.cloud});
 return{...hour,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code};
}

export function applyForecastFusionHours(hours:Hour[],baseDays:Day[],fusedDays:Day[],fusion?:ForecastFusionResult|null){
 if(hours.length===0)return hours;
 const dayAdjustment=baseDays!==fusedDays,mosmixHours=Array.isArray(fusion?.hours)?fusion.hours:[],mosmixQuality=clamp(Number(fusion?.mosmix?.quality)||0,0,1),mosmixUsable=Boolean(fusion?.active&&fusion?.mosmix?.available&&fusion?.mosmix?.applied&&mosmixHours.length&&mosmixQuality>=.42),baseByDate=new Map(baseDays.map(day=>[day.date,day])),fusedByDate=new Map(fusedDays.map(day=>[day.date,day]));let changed=false;
 const now=Date.now(),result=hours.map(hour=>{
  if(hour.epoch<now-3600000)return hour;
  const date=hour.time.slice(0,10),base=baseByDate.get(date),fused=fusedByDate.get(date);let next=hour;
  if(dayAdjustment&&base&&fused&&base!==fused){
   const baseCenter=(base.max+base.min)/2,fusedCenter=(fused.max+fused.min)/2,baseRange=Math.max(2,base.max-base.min),rangeScale=clamp((fused.max-fused.min)/baseRange,.78,1.24),temperature=fusedCenter+(hour.temperature-baseCenter)*rangeScale,temperatureDelta=temperature-hour.temperature,dryDay=fused.precipitation<=.1&&fused.probability<=10,precipScale=dryDay?0:base.precipitation>=.12?clamp(fused.precipitation/base.precipitation,.35,2.6):1,precipitation=hour.precipitation*precipScale,probabilityShift=clamp(fused.probability-base.probability,-25,25),probabilityFactor=hour.probability>=40?1:.65,probability=dryDay?Math.min(hour.probability,Math.max(fused.probability,hour.probability*.28)):clamp(hour.probability+probabilityShift*probabilityFactor,0,100),windScale=base.wind>=2?clamp(fused.wind/base.wind,.72,1.38):1,gustScale=base.gust>=3?clamp(fused.gust/base.gust,.72,1.38):1;
   next={...dryAdjustedHour(hour,probability,precipitation),temperature,apparent:hour.apparent+temperatureDelta,wind:Math.max(0,hour.wind*windScale),gust:Math.max(Math.max(0,hour.wind*windScale),hour.gust*gustScale)};changed=true;
  }
  if(!mosmixUsable)return next;
  const mosmix=nearestFusionHour(mosmixHours,hour.epoch);if(!mosmix)return next;
  const leadHours=(hour.epoch-now)/3600000;if(leadHours<-.5||leadHours>240)return next;
  const leadStrength=leadHours<=6?.18:leadHours<=48?.38:leadHours<=120?.3:.18,temperatureStrength=leadStrength*mosmixQuality,temperature=blendToward(next.temperature,mosmix.temperature,temperatureStrength,3),temperatureDelta=temperature-next.temperature,humidity=blendToward(next.humidity,mosmix.humidity,leadStrength*mosmixQuality*.55,18),dewPoint=blendToward(next.dewPoint,mosmix.dewPoint,leadStrength*mosmixQuality*.7,4),pressure=blendToward(next.pressure,mosmix.pressure,leadStrength*mosmixQuality*.35,5),wind=Math.max(0,blendToward(next.wind,mosmix.wind,leadStrength*mosmixQuality*.58,7)),gust=Math.max(wind,blendToward(next.gust,mosmix.gust,leadStrength*mosmixQuality*.58,10)),mosmixDry=Number(mosmix.probability)<=5&&Number(mosmix.precipitation)<=.03,dailyDry=Boolean(fused&&fused.precipitation<=.1&&fused.probability<=10),dryConsensus=leadHours<=12&&mosmixDry&&dailyDry,probabilityStrength=Math.max(leadStrength*mosmixQuality*.68,dryConsensus?.76*mosmixQuality:0),probability=clamp(blendToward(next.probability,mosmix.probability,probabilityStrength,30),0,100),precipStrength=Math.max((leadHours<=6?.06:leadHours<=48?.18:.22)*mosmixQuality,dryConsensus?.82*mosmixQuality:0),precipitation=Math.max(0,blendToward(next.precipitation,mosmix.precipitation,precipStrength,Math.max(1.5,next.precipitation*1.2))),dryResult=dryAdjustedHour(next,probability,precipitation);
  changed=true;return{...dryResult,temperature,apparent:next.apparent+temperatureDelta,humidity,dewPoint,pressure,wind,gust};
 });
 return changed?result:hours;
}

export type DryRadarNowcastProbabilityBlend={probability:number;radarWeight:number;radarProbability:number};
export function dryRadarNowcastProbability(modelProbability:number,radar:RadarNowcast|null|undefined,leadMinutes=0):DryRadarNowcastProbabilityBlend|null{
 if(!radar||radar.source==='model'||radar.coverage===false)return null;
 const radarProbability=clamp(Number(radar.radarProbability)||0,0,100),hasArrival=Number.isFinite(radar.arrivalMinutes),arrival=hasArrival?Math.max(0,Number(radar.arrivalMinutes)):Number.POSITIVE_INFINITY,rate=Math.max(0,Number(radar.currentRate)||Number(radar.peakRate)||0),dryHorizon=radar.quality==='high'?180:radar.quality==='medium'?135:90,dryThreshold=radar.quality==='high'?12:radar.quality==='medium'?8:4,drySignal=radarProbability<=dryThreshold&&rate<=.08&&(!hasArrival||arrival>dryHorizon),minutes=Math.max(0,Number(leadMinutes)||0);
 if(!drySignal||minutes>dryHorizon)return null;
 const leadFactor=clamp(1-minutes/240,.35,1),radarWeight=(radar.quality==='high'?.94:radar.quality==='medium'?.82:.58)*leadFactor,probability=clamp((Number(modelProbability)||0)*(1-radarWeight)+radarProbability*radarWeight,0,100);
 return{probability,radarWeight,radarProbability};
}

export function applyOperationalNowcastHours(hours:Hour[],radar:RadarNowcast|null|undefined){
 if(!radar||radar.source==='model'||radar.coverage===false||hours.length===0)return hours;
 const now=Date.now(),quality=radar.quality==='high'?.68:radar.quality==='medium'?.48:.28,radarProbability=clamp(Number(radar.radarProbability)||0,0,100),hasArrival=Number.isFinite(radar.arrivalMinutes),arrival=hasArrival?Math.max(0,Number(radar.arrivalMinutes)):Number.POSITIVE_INFINITY,end=hasArrival?Math.max(arrival+30,Number.isFinite(radar.endMinutes)?Number(radar.endMinutes):arrival+120):Number.NEGATIVE_INFINITY,rate=Math.max(0,Number(radar.currentRate)||Number(radar.peakRate)||0);let changed=false;
 const result=hours.map(hour=>{
  const minutes=(hour.epoch-now)/60000;if(minutes<-30||minutes>210)return hour;
  const leadFactor=clamp(1-Math.max(0,minutes)/240,.35,1),dryBlend=dryRadarNowcastProbability(hour.probability,radar,Math.max(0,minutes));
  if(dryBlend){
   const dryAuthority=dryBlend.radarWeight,probability=dryBlend.probability,precipitation=hour.precipitation<=.6?hour.precipitation*(1-dryAuthority):hour.precipitation,adjusted=dryAdjustedHour(hour,probability,precipitation<.04?0:precipitation);
   if(adjusted.code===hour.code&&Math.abs(adjusted.probability-hour.probability)<.1&&Math.abs(adjusted.precipitation-hour.precipitation)<.01)return hour;
   changed=true;return adjusted;
  }
  const inWindow=hasArrival&&minutes+30>=arrival&&minutes-30<=end,blend=quality*leadFactor;let probability=hour.probability,precipitation=hour.precipitation;
  if(inWindow){probability=clamp(hour.probability*(1-blend)+radarProbability*blend,0,100);if(rate>.02)precipitation=Math.max(hour.precipitation,rate*Math.max(.18,.55*leadFactor)*blend)}
  else if(radar.quality==='high'&&radarProbability<=12&&minutes<=120)probability=clamp(hour.probability*(1-.28*leadFactor),0,100);
  if(Math.abs(probability-hour.probability)<.1&&Math.abs(precipitation-hour.precipitation)<.01)return hour;
  changed=true;return dryAdjustedHour(hour,probability,precipitation);
 });
 return changed?result:hours;
}

export function reconcileForecastDaysWithHours(days:Day[],hours:Hour[]){
 if(days.length===0||hours.length===0)return days;
 const now=Date.now(),futureHours=hours.filter(hour=>hour.epoch>=now-30*60000),nearTermDates=new Set(futureHours.filter(hour=>hour.epoch<=now+6*3600000).map(hour=>hour.time.slice(0,10))),hoursByDate=new Map<string,Hour[]>();
 for(const hour of futureHours){const date=hour.time.slice(0,10),bucket=hoursByDate.get(date);if(bucket)bucket.push(hour);else hoursByDate.set(date,[hour])}
 let changed=false;const result=days.map(day=>{
  const relevant=hoursByDate.get(day.date);if(!relevant?.length)return day;
  const temperatures=relevant.map(hour=>Number(hour.temperature)).filter(Number.isFinite),hourlyMax=temperatures.length?Math.max(...temperatures):Number.NaN,hourlyMin=temperatures.length?Math.min(...temperatures):Number.NaN,max=Number.isFinite(hourlyMax)?Math.max(day.max,hourlyMax):day.max,min=Number.isFinite(hourlyMin)?Math.min(day.min,hourlyMin):day.min,hourlyPrecipitation=relevant.reduce((sum,hour)=>sum+Math.max(0,Number(hour.precipitation)||0),0),hourlyProbability=Math.max(0,...relevant.map(hour=>clamp(Number(hour.probability)||0,0,100))),nearTerm=nearTermDates.has(day.date),dayPrecipitation=Math.max(0,Number(day.precipitation)||0),dayProbability=clamp(Number(day.probability)||0,0,100);
  // Im unmittelbaren Nowcast sind die final radarbereinigten Stunden maßgeblich und dürfen einen älteren Tageswert auch absenken.
  // Bei mindestens 18 vorhandenen künftigen Stunden ist der Kalendertag vollständig genug abgedeckt: Nach der optionalen
  // Tagesmengenverteilung müssen Tageskopf und sichtbare Stunden exakt dieselbe Menge sowie dasselbe Wahrscheinlichkeitsmaximum zeigen.
  // Nur bei unvollständiger Stundenabdeckung bleibt der unabhängige Tageswert als Obergrenze erhalten.
  const completeCoverage=relevant.length>=DAY_HOURLY_FULL_COVERAGE_MIN_HOURS,precipitation=nearTerm||completeCoverage?hourlyPrecipitation:Math.max(dayPrecipitation,hourlyPrecipitation),probability=nearTerm||completeCoverage?hourlyProbability:Math.max(dayProbability,hourlyProbability),signal=reconcileForecastPrecipitation({precipitation,probability,code:day.code});
  if(Math.abs(max-day.max)<.05&&Math.abs(min-day.min)<.05&&Math.abs(signal.precipitation-dayPrecipitation)<.01&&Math.abs(signal.probability-dayProbability)<.5&&signal.code===day.code)return day;
  changed=true;return{...day,max,min,precipitation:signal.precipitation,probability:signal.probability,code:signal.code};
 });
 return changed?result:days;
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
 return`MID Mehrquellen${fusion.mosmix?.applied?' + MOSMIX':''} · ${confidence} % Modellkonsistenz`;
}
