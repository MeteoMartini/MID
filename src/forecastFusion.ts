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
 wind:number;
 gust:number;
 direction?:number;
};
export type ForecastWeatherBundleHour={
 time:string;
 epoch:number;
 precipitation:number;
 rain:number;
 showers:number;
 snowfall:number;
 probability:number;
 code:number;
 cloud:number;
 lowCloud?:number;
 humidity?:number;
 cape?:number;
 liftedIndex?:number;
 convectiveInhibition?:number;
 sunshineDuration?:number;
 isDay?:boolean;
 sourceId:string;
 sourceLabel:string;
 sourceFamily:string;
 sourceRole?:'best-match'|'repair';
 repairReason?:string;
 originalSourceId?:string;
 originalSourceLabel?:string;
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
 rain?:number;
 showers?:number;
 snowfall?:number;
 precipitationHours?:number;
 probability:number;
 wind:number;
 gust:number;
 sunshineDuration:number;
 code?:number;
 weatherSourceId?:string;
 weatherSourceLabel?:string;
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
 weatherHours?:ForecastWeatherBundleHour[];
 mosmix?:ForecastFusionMosmix;
 diagnostics?:{bestMatchPreferred?:boolean;repairedHours?:number;repairSources?:string[];multiModelSuffixes?:boolean;modelSuffixes?:Record<string,string[]>};
 error?:string;
 cached?:boolean;
};

const CACHE_PREFIX='mid:forecast-fusion:v6:';
const FRESH_MS=35*60*1000;
const STALE_MS=8*60*60*1000;

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
function dateKeyInTimezone(epoch:number,timezone:string){
 try{
  const parts=new Intl.DateTimeFormat('en',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(epoch)),values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  if(values.year&&values.month&&values.day)return`${values.year}-${values.month}-${values.day}`;
 }catch{}
 return new Date(epoch).toISOString().slice(0,10);
}

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
  const fusedCode=Number.isFinite(Number(fused.code))?Math.round(Number(fused.code)):day.code,leadHours=(Date.parse(`${day.date}T12:00:00Z`)-Date.now())/3600000,precipitationSignal=reconcileForecastPrecipitation({precipitation:Math.max(0,precipitation),rain:Number.isFinite(Number(fused.rain))?Math.max(0,Number(fused.rain)):day.rain,showers:Number.isFinite(Number(fused.showers))?Math.max(0,Number(fused.showers)):day.showers,snowfall:Number.isFinite(Number(fused.snowfall))?Math.max(0,Number(fused.snowfall)):day.snowfall,probability:Number.isFinite(probability)?clamp(probability,0,100):day.probability,code:fusedCode,leadHours});
  changed=true;
  return{...day,max,min,precipitation:precipitationSignal.precipitation,rain:precipitationSignal.rain,showers:precipitationSignal.showers,snowfall:precipitationSignal.snowfall,precipitationHours:Number.isFinite(Number(fused.precipitationHours))?Math.max(0,Number(fused.precipitationHours)):day.precipitationHours,probability:precipitationSignal.probability,code:precipitationSignal.code,wind:Number.isFinite(wind)?Math.max(0,wind):day.wind,gust:Number.isFinite(gust)?Math.max(Number.isFinite(wind)?wind:day.wind,gust):day.gust,sunshineDuration:Number.isFinite(sunshineDuration)?clamp(sunshineDuration,0,86400):day.sunshineDuration,weatherSourceId:fused.weatherSourceId??day.weatherSourceId,weatherSourceLabel:fused.weatherSourceLabel??day.weatherSourceLabel};
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

function nearestFusionHour<T extends {epoch:number}>(hours:T[],epoch:number){let best:T|undefined,distance=Infinity;for(const hour of hours){const delta=Math.abs(Number(hour.epoch)-epoch);if(delta<distance){best=hour;distance=delta}}return distance<=35*60000?best:undefined}
function blendToward(base:number,target:unknown,strength:number,cap:number){const value=Number(target);if(!Number.isFinite(value)||strength<=0)return base;return base+clamp(value-base,-cap,cap)*strength}
function relativeHumidityFromTemperatureDewPoint(temperature:number,dewPoint:number){
 if(!Number.isFinite(temperature)||!Number.isFinite(dewPoint))return Number.NaN;
 const vapor=Math.exp((17.625*dewPoint)/(243.04+dewPoint)),saturation=Math.exp((17.625*temperature)/(243.04+temperature));
 return clamp(100*vapor/Math.max(.0001,saturation),0,100);
}

function precipitationWeatherCode(code:number){const value=Math.round(Number(code));return[51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(value)}
function drySkyCode(hour:Hour){
 const code=Math.round(Number(hour.code));if([45,48].includes(code))return code;
 const cloud=Number(hour.cloud);if(!Number.isFinite(cloud))return hour.isDay?2:1;
 if(cloud<=15)return 0;if(cloud<=45)return 1;if(cloud<=80)return 2;return 3;
}

const DAY_HOURLY_FULL_COVERAGE_MIN_HOURS=18;

/**
 * Eine Tagesaggregation darf keine bislang nicht vorhandene Niederschlagsstunde
 * erfinden. Für vollständig vorhandene Stundenreihen wird deshalb ausschließlich
 * aus den finalen kohärenten Stunden in den Tageskopf aggregiert – nie umgekehrt.
 */
function reconcileForecastHourPrecipitation(hour:Hour){
 const signal=reconcileForecastPrecipitation({...hour,cloud:hour.cloud,lowCloud:hour.lowCloud,humidity:hour.humidity,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration:hour.sunshineDuration,isDay:hour.isDay,leadHours:(hour.epoch-Date.now())/3600000});
 if(signal.precipitation===hour.precipitation&&signal.rain===hour.rain&&signal.showers===hour.showers&&signal.snowfall===hour.snowfall&&signal.probability===hour.probability&&signal.code===hour.code)return hour;
 return{...hour,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code};
}

export function reconcileForecastHoursWithDays(hours:Hour[],_days:Day[]){
 if(hours.length===0)return hours;
 // Letzte gemeinsame Forecast-Stufe: Auch Signale, die nach dem ursprünglichen
 // API-Mapping durch Modellbündel, Wetterzwilling oder Nowcast entstanden sind,
 // werden nochmals mit Horizont, Bewölkung und Niederschlagsart abgeglichen.
 const normalized=hours.map(reconcileForecastHourPrecipitation);
 return normalized.some((hour,index)=>hour!==hours[index])?normalized:hours;
}

function dryAdjustedHour(hour:Hour,probability:number,precipitation:number){
 const dry=probability<=12&&precipitation<=.05,parts=precipitationParts(hour,dry?0:precipitation),code=dry&&precipitationWeatherCode(hour.code)?drySkyCode(hour):hour.code,signal=reconcileForecastPrecipitation({...parts,probability,code,cloud:hour.cloud,lowCloud:hour.lowCloud,humidity:hour.humidity,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration:hour.sunshineDuration,isDay:hour.isDay,leadHours:(hour.epoch-Date.now())/3600000});
 return{...hour,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code};
}

export function applyForecastFusionHours(hours:Hour[],baseDays:Day[],fusedDays:Day[],fusion?:ForecastFusionResult|null){
 if(hours.length===0)return hours;
 const dayAdjustment=baseDays!==fusedDays,mosmixHours=Array.isArray(fusion?.hours)?fusion.hours:[],weatherHours=Array.isArray(fusion?.weatherHours)?fusion.weatherHours:[],mosmixQuality=clamp(Number(fusion?.mosmix?.quality)||0,0,1),mosmixUsable=Boolean(fusion?.active&&fusion?.mosmix?.available&&fusion?.mosmix?.applied&&mosmixHours.length&&mosmixQuality>=.42),baseByDate=new Map(baseDays.map(day=>[day.date,day])),fusedByDate=new Map(fusedDays.map(day=>[day.date,day]));let changed=false;
 const now=Date.now(),result=hours.map(hour=>{
  if(hour.epoch<now-3600000)return hour;
  const date=hour.time.slice(0,10),base=baseByDate.get(date),fused=fusedByDate.get(date);let next=hour;
  const weather=nearestFusionHour(weatherHours,hour.epoch);
  if(weather){
   const signal=reconcileForecastPrecipitation({precipitation:weather.precipitation,rain:weather.rain,showers:weather.showers,snowfall:weather.snowfall,probability:weather.probability,code:weather.code,cloud:weather.cloud,lowCloud:weather.lowCloud,humidity:Number.isFinite(weather.humidity)?Number(weather.humidity):hour.humidity,cape:weather.cape,liftedIndex:Number.isFinite(weather.liftedIndex)?Number(weather.liftedIndex):hour.liftedIndex,convectiveInhibition:Number.isFinite(weather.convectiveInhibition)?Number(weather.convectiveInhibition):hour.convectiveInhibition,sunshineDuration:weather.sunshineDuration,isDay:hour.isDay,leadHours:(hour.epoch-now)/3600000});
   const repaired=weather.sourceRole==='repair'||weather.sourceId!=='best_match';
   next={...next,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code,cloud:Number.isFinite(weather.cloud)?weather.cloud:next.cloud,lowCloud:Number.isFinite(weather.lowCloud)?Number(weather.lowCloud):next.lowCloud,cape:Number.isFinite(weather.cape)?Number(weather.cape):next.cape,sunshineDuration:Number.isFinite(weather.sunshineDuration)?Number(weather.sunshineDuration):next.sunshineDuration,weatherSourceId:weather.sourceId,weatherSourceLabel:weather.sourceLabel,weatherBundleKind:repaired?'coherent-model':'best-match'};changed=true;
  }
  if(dayAdjustment&&base&&fused&&base!==fused){
   // Temperatur und Wind dürfen aus eigenen, intern konsistenten Parameterbündeln
   // nachkorrigiert werden. Der Wetter-/Niederschlagszustand bleibt vollständig
   // beim ausgewählten kohärenten Stundenmodell.
   const baseCenter=(base.max+base.min)/2,fusedCenter=(fused.max+fused.min)/2,baseRange=Math.max(2,base.max-base.min),rangeScale=clamp((fused.max-fused.min)/baseRange,.78,1.24),temperature=fusedCenter+(next.temperature-baseCenter)*rangeScale,temperatureDelta=temperature-next.temperature,windScale=base.wind>=2?clamp(fused.wind/base.wind,.72,1.38):1,gustScale=base.gust>=3?clamp(fused.gust/base.gust,.72,1.38):1;
   next={...next,temperature,apparent:next.apparent+temperatureDelta,wind:Math.max(0,next.wind*windScale),gust:Math.max(Math.max(0,next.wind*windScale),next.gust*gustScale)};changed=true;
  }
  if(!mosmixUsable)return next;
  const mosmix=nearestFusionHour(mosmixHours,hour.epoch);if(!mosmix)return next;
  const leadHours=(hour.epoch-now)/3600000;if(leadHours<-.5||leadHours>168)return next;
  const leadStrength=leadHours<=6?.18:leadHours<=48?.38:leadHours<=120?.3:.16,temperatureStrength=leadStrength*mosmixQuality,temperature=blendToward(next.temperature,mosmix.temperature,temperatureStrength,3),temperatureDelta=temperature-next.temperature,rawDewPoint=blendToward(next.dewPoint,mosmix.dewPoint,leadStrength*mosmixQuality*.7,4),dewPoint=Math.min(temperature,rawDewPoint),derivedHumidity=relativeHumidityFromTemperatureDewPoint(temperature,dewPoint),humidity=Number.isFinite(derivedHumidity)?derivedHumidity:blendToward(next.humidity,mosmix.humidity,leadStrength*mosmixQuality*.55,18),pressure=blendToward(next.pressure,mosmix.pressure,leadStrength*mosmixQuality*.35,5),wind=Math.max(0,blendToward(next.wind,mosmix.wind,leadStrength*mosmixQuality*.58,7)),gust=Math.max(wind,blendToward(next.gust,mosmix.gust,leadStrength*mosmixQuality*.58,10));
  changed=true;return{...next,temperature,apparent:next.apparent+temperatureDelta,humidity,dewPoint,pressure,wind,gust};
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


function dailyWeatherCodeFromHours(hours:Hour[]){
 const wet=hours.filter(hour=>precipitationWeatherCode(hour.code)&&(hour.precipitation>=.01||hour.rain>=.01||hour.showers>=.01||hour.snowfall>=.01));
 if(wet.length){
  const severity=(code:number)=>[99,96,97,95,86,85,82,84,81,83,80,75,73,71,69,68,67,66,65,63,61,57,56,55,53,51].indexOf(Math.round(code));
  return[...wet].sort((a,b)=>{const sa=severity(a.code),sb=severity(b.code);if(sa!==sb)return(sa<0?999:sa)-(sb<0?999:sb);return(b.probability+b.precipitation*8)-(a.probability+a.precipitation*8)})[0].code;
 }
 const daylight=hours.filter(hour=>hour.isDay),sample=daylight.length?daylight:hours,clouds=sample.map(hour=>Number(hour.cloud)).filter(Number.isFinite),meanCloud=clouds.length?clouds.reduce((sum,value)=>sum+value,0)/clouds.length:Number.NaN;
 if(!Number.isFinite(meanCloud))return 3;if(meanCloud<=15)return 0;if(meanCloud<=45)return 1;if(meanCloud<=80)return 2;return 3;
}

export function reconcileForecastDaysWithHours(days:Day[],hours:Hour[]){
 if(days.length===0||hours.length===0)return days;
 const now=Date.now(),timezone=hours.find(hour=>hour.timezone)?.timezone||'UTC',today=dateKeyInTimezone(now,timezone),hoursByDate=new Map<string,Hour[]>();
 for(const hour of hours){const date=hour.time.slice(0,10),bucket=hoursByDate.get(date);if(bucket)bucket.push(hour);else hoursByDate.set(date,[hour])}
 const daylightSeconds=(day:Day)=>{const sunrise=Date.parse(String(day.sunrise||'')),sunset=Date.parse(String(day.sunset||''));return Number.isFinite(sunrise)&&Number.isFinite(sunset)&&sunset>sunrise?Math.min(86400,(sunset-sunrise)/1000):86400};
 let changed=false;const result=days.map(day=>{
  const relevant=hoursByDate.get(day.date);if(!relevant?.length)return day;
  const isCurrentDay=day.date===today,futureRelevant=relevant.filter(hour=>hour.epoch>=now-30*60000),nearTerm=isCurrentDay&&futureRelevant.some(hour=>hour.epoch<=now+6*3600000),precipitationHours=nearTerm?futureRelevant:relevant,temperatures=relevant.map(hour=>Number(hour.temperature)).filter(Number.isFinite),hourlyMax=temperatures.length?Math.max(...temperatures):Number.NaN,hourlyMin=temperatures.length?Math.min(...temperatures):Number.NaN,max=Number.isFinite(hourlyMax)?Math.max(day.max,hourlyMax):day.max,min=Number.isFinite(hourlyMin)?Math.min(day.min,hourlyMin):day.min,completeCoverage=relevant.length>=DAY_HOURLY_FULL_COVERAGE_MIN_HOURS,hourlyPrecipitation=precipitationHours.reduce((sum,hour)=>sum+Math.max(0,Number(hour.precipitation)||0),0),hourlyProbability=Math.max(0,...precipitationHours.map(hour=>clamp(Number(hour.probability)||0,0,100))),dayPrecipitation=Math.max(0,Number(day.precipitation)||0),dayProbability=clamp(Number(day.probability)||0,0,100),precipitation=nearTerm||completeCoverage?hourlyPrecipitation:Math.max(dayPrecipitation,hourlyPrecipitation),probability=nearTerm||completeCoverage?hourlyProbability:Math.max(dayProbability,hourlyProbability),hourlyCode=nearTerm||completeCoverage?dailyWeatherCodeFromHours(precipitationHours):day.code,sunshineValues=relevant.map(hour=>Number(hour.sunshineDuration)).filter(Number.isFinite),sunshineCoverage=sunshineValues.length/Math.max(1,relevant.length),hourlySunshine=sunshineValues.reduce((sum,value)=>sum+clamp(value,0,3600),0),baseSunshine=clamp(Number(day.sunshineDuration)||0,0,daylightSeconds(day));
  // Best Match liefert die vollständige Tagesaggregation und bleibt deshalb für reine
  // Best-Match-Tage maßgeblich. Der aktuelle Tag darf insbesondere niemals aus nur
  // noch verbleibenden Zukunftsstunden neu summiert werden. Erst wenn mindestens eine
  // Stunde wegen eines widersprüchlichen Best-Match-Bündels vollständig durch ein
  // anderes kohärentes Modell ersetzt wurde, wird ein vollständig abgedeckter
  // Zukunftstag aus genau diesen finalen Stunden neu aggregiert.
  const hourlyRain=precipitationHours.reduce((sum,hour)=>sum+Math.max(0,Number(hour.rain)||0),0),hourlyShowers=precipitationHours.reduce((sum,hour)=>sum+Math.max(0,Number(hour.showers)||0),0),hourlySnowfall=precipitationHours.reduce((sum,hour)=>sum+Math.max(0,Number(hour.snowfall)||0),0),rain=nearTerm||completeCoverage?hourlyRain:Math.max(Math.max(0,Number(day.rain)||0),hourlyRain),showers=nearTerm||completeCoverage?hourlyShowers:Math.max(Math.max(0,Number(day.showers)||0),hourlyShowers),snowfall=nearTerm||completeCoverage?hourlySnowfall:Math.max(Math.max(0,Number(day.snowfall)||0),hourlySnowfall),repairedSunshineBundle=relevant.some(hour=>hour.weatherBundleKind==='coherent-model'),sunshineDuration=isCurrentDay?baseSunshine:completeCoverage&&sunshineCoverage>=.9&&repairedSunshineBundle?clamp(hourlySunshine,0,daylightSeconds(day)):baseSunshine,signal=reconcileForecastPrecipitation({precipitation,rain,showers,snowfall,probability,code:hourlyCode,leadHours:(Date.parse(`${day.date}T12:00:00Z`)-now)/3600000});
  if(Math.abs(max-day.max)<.05&&Math.abs(min-day.min)<.05&&Math.abs(signal.precipitation-dayPrecipitation)<.01&&Math.abs(signal.probability-dayProbability)<.5&&signal.code===day.code&&Math.abs(sunshineDuration-day.sunshineDuration)<1)return day;
  changed=true;return{...day,max,min,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code,sunshineDuration,weatherSourceId:relevant.find(hour=>hour.weatherSourceId)?.weatherSourceId??day.weatherSourceId,weatherSourceLabel:relevant.find(hour=>hour.weatherSourceLabel)?.weatherSourceLabel??day.weatherSourceLabel};
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
 const applied=fusion.days.filter(day=>day.applied),confidence=applied.length?Math.round(applied.reduce((sum,day)=>sum+day.confidence,0)/applied.length):0,repaired=Math.max(0,Number(fusion.diagnostics?.repairedHours)||0),repairLabel=repaired?` · ${repaired} h plausibilitätsrepariert`:' · ohne Bündelersatz';
 return`Best Match geprüft${fusion.mosmix?.applied?' + MOSMIX lokal':''}${repairLabel}${confidence?` · ${confidence} % Modellvergleich`:''}`;
}
