import {fetchWorkerJson} from './workerClient';
import {reconcileForecastPrecipitation} from './precipitation';
import type {Day,Hour,RadarNowcast,RadarNowcastFrame,RadarNowcastInterval,ThunderstormNowcast} from './weather';

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
export type RadarBlendMode='direct'|'transition'|'proximity'|'dry';
export type RadarHitClass='site'|'nearby'|'dry';
export type RadarTargetBlend={
 amount:number;
 probability:number;
 radarRateMmh?:number;
 radarAmount?:number;
 radarWeight:number;
 probabilityWeight:number;
 mode:RadarBlendMode;
 hitClass:RadarHitClass;
 nearbyOnly?:boolean;
 nearestWetKm?:number;
 siteSupport?:number;
 frameCount?:number;
 siteFrameCount?:number;
 interrupted?:boolean;
 intervalStartAt?:string;
 intervalEndAt?:string;
};

type RadarTargetBlendInput={
 radar:RadarNowcast|null|undefined;
 targetEpoch:number;
 intervalMinutes:number;
 modelAmount:number;
 modelProbability:number;
 now?:number;
};

const DIRECT_RADAR_HORIZON_MINUTES=120;
const TRANSITION_RADAR_HORIZON_MINUTES=180;

function radarFinite(value:unknown,fallback=0){const numeric=Number(value);return Number.isFinite(numeric)?numeric:fallback}
function frameEpoch(frame:RadarNowcastFrame){return Date.parse(frame.time)}
function siteThreshold(radar:RadarNowcast){return Math.max(.02,radarFinite(radar.siteEchoThreshold,.05))}
function nearbyThreshold(radar:RadarNowcast){return Math.max(siteThreshold(radar),radarFinite(radar.nearbyEchoThreshold,Math.max(.08,siteThreshold(radar)*1.8)))}
function qualityBase(radar:RadarNowcast){return radar.quality==='high'?.92:radar.quality==='medium'?.76:.52}
function probabilityBase(radar:RadarNowcast){return radar.quality==='high'?.95:radar.quality==='medium'?.80:.58}
function rateCap(radar:RadarNowcast){
 let cap=radar.quality==='high'?160:radar.quality==='medium'?105:70;
 if(radar.rateApproximate)cap=Math.min(cap,90);
 if(radar.rateUncertain)cap=Math.min(cap,60);
 return cap;
}
function leadAmountFactor(minutes:number){
 if(minutes<=0)return 1;
 if(minutes<=60)return 1-.08*(minutes/60);
 if(minutes<=DIRECT_RADAR_HORIZON_MINUTES)return .92-.50*((minutes-60)/60);
 return 0;
}
function leadProbabilityFactor(minutes:number){
 if(minutes<=0)return 1;
 if(minutes<=60)return 1-.06*(minutes/60);
 if(minutes<=DIRECT_RADAR_HORIZON_MINUTES)return .94-.42*((minutes-60)/60);
 if(minutes<=TRANSITION_RADAR_HORIZON_MINUTES)return .32*(1-(minutes-DIRECT_RADAR_HORIZON_MINUTES)/60);
 return 0;
}
function rateProbability(rate:number,threshold:number,nearbyOnly:boolean){
 const scaled=threshold>0?rate/threshold:0,base=nearbyOnly?18:48,span=nearbyOnly?24:46;
 return clamp(base+Math.log1p(Math.max(0,scaled))*span,0,nearbyOnly?55:98);
}
function intervalBounds(targetEpoch:number,intervalMinutes:number){const half=Math.max(2.5,intervalMinutes/2)*60000;return{start:targetEpoch-half,end:targetEpoch+half}}
function radarFrames(radar:RadarNowcast){return(radar.nowcastSeries??[]).map(frame=>({...frame,epoch:frameEpoch(frame)})).filter(frame=>Number.isFinite(frame.epoch)).sort((a,b)=>a.epoch-b.epoch)}
function framesForInterval(radar:RadarNowcast,targetEpoch:number,intervalMinutes:number){const bounds=intervalBounds(targetEpoch,intervalMinutes),padding=2.6*60000;return radarFrames(radar).filter(frame=>frame.epoch>=bounds.start-padding&&frame.epoch<=bounds.end+padding)}
function radarFrameClass(frame:RadarNowcastFrame,radar:RadarNowcast):RadarHitClass{if(frame.hitClass)return frame.hitClass;const siteRate=Math.max(0,radarFinite(frame.rate)),nearbyRate=Math.max(siteRate,radarFinite(frame.nearbyRate));return siteRate>=siteThreshold(radar)?'site':nearbyRate>=nearbyThreshold(radar)?'nearby':'dry'}
function median(values:number[]){if(!values.length)return 5;const rows=[...values].sort((a,b)=>a-b),middle=Math.floor(rows.length/2);return rows.length%2?rows[middle]:(rows[middle-1]+rows[middle])/2}
function sampleMinutes(frames:Array<RadarNowcastFrame&{epoch:number}>){const differences=frames.slice(1).map((frame,index)=>(frame.epoch-frames[index].epoch)/60000).filter(value=>value>=2&&value<=15);return clamp(median(differences),2.5,10)}
function parseInterval(interval:RadarNowcastInterval):(RadarNowcastInterval&{start:number;end:number})|null{const start=Date.parse(interval.startAt),end=Date.parse(interval.endAt);return Number.isFinite(start)&&Number.isFinite(end)?{...interval,start,end}:null}
function overlappingSiteIntervals(radar:RadarNowcast,targetEpoch:number,intervalMinutes:number){const bounds=intervalBounds(targetEpoch,intervalMinutes);return(radar.siteIntervals??[]).map(parseInterval).filter((interval):interval is NonNullable<ReturnType<typeof parseInterval>>=>Boolean(interval&&interval.end>=bounds.start&&interval.start<=bounds.end))}
function intervalIso(targetEpoch:number,intervalMinutes:number){const bounds=intervalBounds(targetEpoch,intervalMinutes);return{startAt:new Date(bounds.start).toISOString(),endAt:new Date(bounds.end).toISOString()}}
function nearestWetDistance(frames:Array<RadarNowcastFrame&{epoch:number}>,radar:RadarNowcast){const distances=frames.map(frame=>Number(frame.nearestWetKm)).filter(Number.isFinite);const fallback=Number(radar.nearestWetKm);return distances.length?Math.min(...distances):Number.isFinite(fallback)?fallback:undefined}
function aggregateSiteFallback(radar:RadarNowcast,targetEpoch:number,intervalMinutes:number,now:number,threshold:number){
 if((radar.nowcastSeries?.length??0)>0||(radar.siteIntervals?.length??0)>0||radar.arrivalKind==='nearby'||radar.arrivalKind==='approximate')return null;
 const current=Math.max(0,radarFinite(radar.currentRate)),peak=Math.max(current,radarFinite(radar.peakRate)),nearest=Number(radar.nearestWetKm),summary=String(radar.summary||'').toLowerCase(),sitePlausible=(!Number.isFinite(nearest)||nearest<=1.5)&&!/(umfeld|entfernt|kein standorttreffer)/.test(summary);
 if(!sitePlausible||peak<threshold)return null;
 const arrival=Math.max(0,radarFinite(radar.arrivalMinutes,current>=threshold?0:Number.NaN)),endRaw=radarFinite(radar.endMinutes,Number.NaN);
 if(!Number.isFinite(arrival))return null;
 const end=Number.isFinite(endRaw)?Math.max(arrival,endRaw):Math.max(arrival+Math.max(5,intervalMinutes),current>=threshold?intervalMinutes:arrival+5);
 const bounds=intervalBounds(targetEpoch,intervalMinutes),wetStart=now+arrival*60000,wetEnd=now+end*60000,overlapMinutes=Math.max(0,(Math.min(bounds.end,wetEnd)-Math.max(bounds.start,wetStart))/60000);
 if(overlapMinutes<=0)return null;
 const representativeRate=current>=threshold&&arrival<=0?Math.max(current,peak*.72):peak;
 return{peak:representativeRate,amount:clamp(representativeRate,0,rateCap(radar))*Math.min(intervalMinutes,overlapMinutes)/60,support:clamp(overlapMinutes/Math.max(5,intervalMinutes),.2,1),frameCount:Math.max(1,Math.round(overlapMinutes/5))};
}

export function blendRadarAtTarget({radar,targetEpoch,intervalMinutes,modelAmount,modelProbability,now=Date.now()}:RadarTargetBlendInput):RadarTargetBlend|null{
 if(!radar||radar.source==='model'||radar.coverage===false)return null;
 const leadMinutes=(targetEpoch-now)/60000;
 if(leadMinutes<-30||leadMinutes>TRANSITION_RADAR_HORIZON_MINUTES)return null;
 const safeModelAmount=Math.max(0,radarFinite(modelAmount)),safeModelProbability=clamp(radarFinite(modelProbability),0,100),site=siteThreshold(radar),nearby=nearbyThreshold(radar),frames=framesForInterval(radar,targetEpoch,intervalMinutes),classes=frames.map(frame=>radarFrameClass(frame,radar)),siteFrames=frames.filter((_,index)=>classes[index]==='site'),nearbyFrames=frames.filter((_,index)=>classes[index]==='nearby'),dryFrames=frames.filter((_,index)=>classes[index]==='dry'),siteIntervals=overlappingSiteIntervals(radar,targetEpoch,intervalMinutes),iso=intervalIso(targetEpoch,intervalMinutes),lead=Math.max(0,leadMinutes),amountFactor=leadAmountFactor(lead),probabilityFactor=leadProbabilityFactor(lead),nearestWetKm=nearestWetDistance(frames,radar),interrupted=Boolean(radar.interrupted||(radar.siteIntervals?.length??0)>1);
 const frameStep=sampleMinutes(frames),expectedFrames=Math.max(1,Math.round(intervalMinutes/frameStep)),siteSupport=siteFrames.length?clamp(siteFrames.reduce((sum,frame)=>sum+clamp(radarFinite(frame.siteSupport,1),0,1),0)/expectedFrames,0,1):0;
 let directAmount=siteFrames.reduce((sum,frame)=>{const calibrated=Number(frame.amountMm);return sum+(Number.isFinite(calibrated)&&calibrated>=0?calibrated:clamp(radarFinite(frame.rate),0,rateCap(radar))*frameStep/60)},0),directPeak=siteFrames.reduce((maximum,frame)=>Math.max(maximum,radarFinite(frame.rate)),0),directFrameCount=siteFrames.length,directSupport=siteSupport;
 if(!directFrameCount&&siteIntervals.length){const intervalAmount=siteIntervals.reduce((sum,interval)=>sum+Math.max(0,radarFinite(interval.amountMm)),0),intervalPeak=siteIntervals.reduce((maximum,interval)=>Math.max(maximum,radarFinite(interval.peakRate)),0),intervalFrames=siteIntervals.reduce((sum,interval)=>sum+Math.max(0,radarFinite(interval.frameCount)),0);directAmount=Math.min(Math.max(intervalAmount,intervalPeak*Math.min(intervalMinutes,5)/60),intervalPeak*intervalMinutes/60);directPeak=intervalPeak;directFrameCount=intervalFrames||1;directSupport=Math.min(1,directFrameCount/expectedFrames)}
 if(!directFrameCount){const aggregate=aggregateSiteFallback(radar,targetEpoch,intervalMinutes,now,site);if(aggregate){directAmount=aggregate.amount;directPeak=aggregate.peak;directFrameCount=aggregate.frameCount;directSupport=aggregate.support}}
 if(directFrameCount&&directPeak>=site){
  const support=Math.max(directSupport,Math.min(1,directFrameCount/expectedFrames)),radarProbability=clamp(Math.max(rateProbability(directPeak,site,false),56+support*40,radarFinite(radar.radarProbability)*.72),0,98),uncertaintyFactor=radar.rateUncertain?.58:radar.rateApproximate?.76:1,amountWeight=clamp(qualityBase(radar)*amountFactor*uncertaintyFactor*(.72+.28*support),0,.95),probabilityWeight=clamp(probabilityBase(radar)*probabilityFactor*(.76+.24*support),0,.97);
  if(leadMinutes<=DIRECT_RADAR_HORIZON_MINUTES){const radarAmount=Math.max(0,directAmount),amount=safeModelAmount*(1-amountWeight)+radarAmount*amountWeight,probability=safeModelProbability*(1-probabilityWeight)+radarProbability*probabilityWeight;return{amount:Math.max(0,amount),probability:clamp(probability,0,100),radarRateMmh:clamp(directPeak,0,rateCap(radar)),radarAmount,radarWeight:amountWeight,probabilityWeight,mode:'direct',hitClass:'site',siteSupport:support,frameCount:frames.length,siteFrameCount:directFrameCount,nearestWetKm,interrupted,intervalStartAt:iso.startAt,intervalEndAt:iso.endAt}}
  if(probabilityWeight>0){const probability=safeModelProbability*(1-probabilityWeight)+radarProbability*probabilityWeight;return{amount:safeModelAmount,probability:clamp(probability,0,100),radarRateMmh:clamp(directPeak,0,rateCap(radar)),radarWeight:0,probabilityWeight,mode:'transition',hitClass:'site',siteSupport:support,frameCount:frames.length,siteFrameCount:directFrameCount,nearestWetKm,interrupted,intervalStartAt:iso.startAt,intervalEndAt:iso.endAt}}
 }
 if(nearbyFrames.length){const nearbyPeak=nearbyFrames.reduce((maximum,frame)=>Math.max(maximum,radarFinite(frame.nearbyRate)),0),localProbability=clamp(Math.min(55,Math.max(rateProbability(nearbyPeak,nearby,true),radarFinite(radar.radarProbability)*.55)),0,55),probabilityWeight=clamp(probabilityBase(radar)*probabilityFactor*.42,0,.48),probability=safeModelProbability*(1-probabilityWeight)+localProbability*probabilityWeight;return{amount:safeModelAmount,probability:clamp(probability,0,100),radarRateMmh:nearbyPeak,radarWeight:0,probabilityWeight,mode:'proximity',hitClass:'nearby',nearbyOnly:true,nearestWetKm,siteSupport:0,frameCount:frames.length,siteFrameCount:0,interrupted,intervalStartAt:iso.startAt,intervalEndAt:iso.endAt}}
 const exactDryCoverage=frames.length>0&&dryFrames.length===frames.length&&!siteIntervals.length;
 if(exactDryCoverage&&probabilityFactor>0){const localDryProbability=radar.quality==='high'?3:radar.quality==='medium'?7:13,dryWeight=clamp(probabilityBase(radar)*probabilityFactor*(frames.length>=Math.max(1,expectedFrames-1)?1:.72),0,.95),probability=safeModelProbability*(1-dryWeight)+localDryProbability*dryWeight,amount=leadMinutes<=DIRECT_RADAR_HORIZON_MINUTES&&safeModelAmount<=1?safeModelAmount*(1-dryWeight):safeModelAmount;return{amount:Math.max(0,amount),probability:clamp(probability,0,100),radarWeight:leadMinutes<=DIRECT_RADAR_HORIZON_MINUTES?dryWeight:0,probabilityWeight:dryWeight,mode:'dry',hitClass:'dry',nearestWetKm,siteSupport:0,frameCount:frames.length,siteFrameCount:0,interrupted,intervalStartAt:iso.startAt,intervalEndAt:iso.endAt}}
 return null;
}

export const RADAR_DIRECT_HORIZON_MINUTES=DIRECT_RADAR_HORIZON_MINUTES;
export const RADAR_TRANSITION_HORIZON_MINUTES=TRANSITION_RADAR_HORIZON_MINUTES;

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

type GroundLayerState='saturated'|'moist'|'normal'|'dry'|'very-dry';
function groundLayerState(hour:Hour){
 const humidityRaw=Number(hour.humidity),dewSpread=Number.isFinite(hour.temperature)&&Number.isFinite(hour.dewPoint)?Math.max(0,Number(hour.temperature)-Number(hour.dewPoint)):Number.NaN,humidity=Number.isFinite(humidityRaw)?clamp(humidityRaw,0,100):Number.isFinite(dewSpread)?relativeHumidityFromTemperatureDewPoint(Number(hour.temperature),Number(hour.dewPoint)):Number.NaN;
 if(Number.isFinite(humidity)&&humidity>=94||Number.isFinite(dewSpread)&&dewSpread<=.8)return{saturation:1,state:'saturated' as GroundLayerState,humidity,dewSpread};
 if(Number.isFinite(humidity)&&humidity>=84||Number.isFinite(dewSpread)&&dewSpread<=2.2)return{saturation:.92,state:'moist' as GroundLayerState,humidity,dewSpread};
 if(Number.isFinite(humidity)&&humidity>=72||Number.isFinite(dewSpread)&&dewSpread<=4.5)return{saturation:.82,state:'normal' as GroundLayerState,humidity,dewSpread};
 if(Number.isFinite(humidity)&&humidity>=60||Number.isFinite(dewSpread)&&dewSpread<=7)return{saturation:.7,state:'dry' as GroundLayerState,humidity,dewSpread};
 return{saturation:.58,state:'very-dry' as GroundLayerState,humidity,dewSpread};
}
function convectivePersistenceFactor(hour:Hour,blend:RadarTargetBlend,leadMinutes:number){
 const showers=Math.max(0,Number(hour.showers)||0),rain=Math.max(0,Number(hour.rain)||0),snowfall=Math.max(0,Number(hour.snowfall)||0),precipitation=Math.max(.01,Number(hour.precipitation)||showers+rain+snowfall),convectiveShare=showers/precipitation,cape=Math.max(0,Number(hour.cape)||0),siteSupport=clamp(Number(blend.siteSupport)||0,0,1);
 let factor=1;
 if((convectiveShare>=.35||cape>=250)&&leadMinutes>20)factor*=siteSupport>=.75?.96:siteSupport>=.5?.9:.82;
 if((convectiveShare>=.55||cape>=500)&&leadMinutes>55)factor*=siteSupport>=.6?.9:.8;
 if((blend.interrupted||siteSupport<.3)&&leadMinutes>25)factor*=.88;
 if(snowfall>.01||Number(hour.temperature)<=1)factor=Math.min(1,factor+.06);
 return clamp(factor,.72,1);
}
function refineOperationalRadarBlend(hour:Hour,radar:RadarNowcast,blend:RadarTargetBlend,leadMinutes:number){
 if(blend.mode==='dry')return blend;
 const layer=groundLayerState(hour),
  lowCloud=clamp(Number(hour.lowCloud)||0,0,100),
  cloud=clamp(Number(hour.cloud)||0,0,100),
  snowAware=Math.max(0,Number(hour.snowfall)||0)>.01||Number(hour.temperature)<=1,
  lowCloudBonus=lowCloud>=65?.05:cloud>=88?.03:0,
  evaporationGuard=layer.state==='very-dry'&&lowCloud<25&&cloud<60&&!snowAware ? .92 : 1,
  rateConfidenceGuard=radar.rateUncertain ? .92 : radar.rateApproximate ? .96 : 1,
  groundFactor=clamp(layer.saturation+lowCloudBonus,snowAware ? .62 : .55,1),
  persistenceFactor=convectivePersistenceFactor(hour,blend,leadMinutes),
  amountFactor=clamp(groundFactor*persistenceFactor*evaporationGuard*rateConfidenceGuard,snowAware ? .62 : .5,1),
  probabilityFactor=clamp(1-(1-amountFactor)*.42,.68,1);
 const baseAmount=Math.max(0,Number(hour.precipitation)||0)*(1-clamp(blend.radarWeight,0,1)),amountIncrement=blend.amount-baseAmount,amount=amountIncrement>0?baseAmount+amountIncrement*amountFactor:blend.amount;
 const baseProbability=clamp(Number(hour.probability)||0,0,100)*(1-clamp(blend.probabilityWeight,0,1)),probabilityIncrement=blend.probability-baseProbability,probability=probabilityIncrement>0?baseProbability+probabilityIncrement*probabilityFactor:blend.probability;
 return{...blend,amount:Math.max(0,amount),probability:clamp(probability,0,100)};
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
 const radarProbability=clamp(Number(radar.radarProbability)||0,0,100),hasArrival=Number.isFinite(radar.arrivalMinutes),arrival=hasArrival?Math.max(0,Number(radar.arrivalMinutes)):Number.POSITIVE_INFINITY,rate=Math.max(0,Number(radar.currentRate)||Number(radar.peakRate)||0),dryHorizon=radar.quality==='high'?180:radar.quality==='medium'?150:120,dryThreshold=radar.quality==='high'?12:radar.quality==='medium'?8:4,drySignal=radarProbability<=dryThreshold&&rate<=.08&&(!hasArrival||arrival>dryHorizon),minutes=Math.max(0,Number(leadMinutes)||0);
 if(!drySignal||minutes>dryHorizon)return null;
 const directFactor=minutes<=120?clamp(1-minutes/180,.33,1):clamp(1-(minutes-120)/Math.max(1,dryHorizon-120),0,.33),radarWeight=(radar.quality==='high'?.94:radar.quality==='medium'?.82:.58)*directFactor,probability=clamp((Number(modelProbability)||0)*(1-radarWeight)+radarProbability*radarWeight,0,100);
 return{probability,radarWeight,radarProbability};
}


export function applyOperationalNowcastHours(hours:Hour[],radar:RadarNowcast|null|undefined){
 if(!radar||radar.source==='model'||radar.coverage===false||hours.length===0)return hours;
 const now=Date.now();let changed=false;
 const result=hours.map(hour=>{
  const minutes=(hour.epoch-now)/60000;if(minutes<-30||minutes>RADAR_TRANSITION_HORIZON_MINUTES)return hour;
  const dryBlend=dryRadarNowcastProbability(hour.probability,radar,Math.max(0,minutes));
  if(dryBlend){
   const precipitation=minutes<=RADAR_DIRECT_HORIZON_MINUTES&&hour.precipitation<=.6?hour.precipitation*(1-dryBlend.radarWeight):hour.precipitation,adjusted=dryAdjustedHour(hour,dryBlend.probability,precipitation<.04?0:precipitation);
   if(adjusted.code===hour.code&&Math.abs(adjusted.probability-hour.probability)<.1&&Math.abs(adjusted.precipitation-hour.precipitation)<.01)return hour;
   changed=true;return adjusted;
  }
  const blend=blendRadarAtTarget({radar,targetEpoch:hour.epoch,intervalMinutes:60,modelAmount:hour.precipitation,modelProbability:hour.probability,now});
  if(!blend)return hour;
  const refinedBlend=refineOperationalRadarBlend(hour,radar,blend,Math.max(0,minutes));
  const adjusted=dryAdjustedHour(hour,refinedBlend.probability,refinedBlend.amount),next=refinedBlend.mode==='direct'?{...adjusted,weatherBundleKind:'nowcast' as const}:adjusted;
  if(next.code===hour.code&&Math.abs(next.probability-hour.probability)<.1&&Math.abs(next.precipitation-hour.precipitation)<.01)return hour;
  changed=true;return next;
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
  const isCurrentDay=day.date===today,futureRelevant=relevant.filter(hour=>hour.epoch>=now-30*60000),nearTerm=isCurrentDay&&futureRelevant.some(hour=>hour.epoch<=now+6*3600000),precipitationHours=nearTerm?futureRelevant:relevant,temperatures=relevant.map(hour=>Number(hour.temperature)).filter(Number.isFinite),hourlyMax=temperatures.length?Math.max(...temperatures):Number.NaN,hourlyMin=temperatures.length?Math.min(...temperatures):Number.NaN,max=Number.isFinite(hourlyMax)?Math.max(day.max,hourlyMax):day.max,min=Number.isFinite(hourlyMin)?Math.min(day.min,hourlyMin):day.min,completeCoverage=relevant.length>=DAY_HOURLY_FULL_COVERAGE_MIN_HOURS,hourlyPrecipitation=precipitationHours.reduce((sum,hour)=>sum+Math.max(0,Number(hour.precipitation)||0),0),hourlyProbability=Math.max(0,...precipitationHours.map(hour=>clamp(Number(hour.probability)||0,0,100))),dayPrecipitation=Math.max(0,Number(day.precipitation)||0),dayProbability=clamp(Number(day.probability)||0,0,100),precipitation=nearTerm||completeCoverage?hourlyPrecipitation:Math.max(dayPrecipitation,hourlyPrecipitation),probability=day.probabilitySource==='ensemble-members-dwd'?dayProbability:nearTerm||completeCoverage?hourlyProbability:Math.max(dayProbability,hourlyProbability),hourlyCode=nearTerm||completeCoverage?dailyWeatherCodeFromHours(precipitationHours):day.code,sunshineValues=relevant.map(hour=>Number(hour.sunshineDuration)).filter(Number.isFinite),sunshineCoverage=sunshineValues.length/Math.max(1,relevant.length),hourlySunshine=sunshineValues.reduce((sum,value)=>sum+clamp(value,0,3600),0),baseSunshine=clamp(Number(day.sunshineDuration)||0,0,daylightSeconds(day));
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

type ConvectiveSiteRelevance={relevant:boolean;approaching:boolean;arrival:number};
function convectiveCellSiteRelevance(cell:NonNullable<ThunderstormNowcast['nearest']>):ConvectiveSiteRelevance{
 const currentDistance=Number(cell.currentDistanceKm),forecastDistance=Number(cell.forecastDistanceKm),effectiveDistance=Number(cell.forecastEffectiveDistanceKm??cell.relevanceDistanceKm),arrival=Number(cell.arrivalMinutes),centerGetsCloser=Number.isFinite(currentDistance)&&Number.isFinite(forecastDistance)&&forecastDistance+2<currentDistance,arrivalRelevant=Number.isFinite(arrival)&&arrival>=0&&arrival<=120,approaching=Boolean(cell.isApproaching&&centerGetsCloser&&Number.isFinite(effectiveDistance)&&effectiveDistance<=35&&arrivalRelevant),movingAway=Boolean(!approaching&&Number.isFinite(currentDistance)&&currentDistance>15&&Number.isFinite(forecastDistance)&&forecastDistance>currentDistance+2),referencePlaces=Array.isArray(cell.affectedPlaces)?cell.affectedPlaces.filter(place=>place.isReferenceLocation):[],referenceDirect=referencePlaces.some(place=>place.status==='now'||place.status==='likely'||place.status==='possible'),referenceCorridor=referencePlaces.some(place=>place.status==='corridor')&&Number.isFinite(effectiveDistance)&&effectiveDistance<=20&&arrivalRelevant,nearNow=Number.isFinite(currentDistance)&&currentDistance<=25&&!movingAway,tooDistant=Number.isFinite(currentDistance)&&currentDistance>60&&!approaching&&!referenceDirect&&!referenceCorridor,relevant=Boolean(!movingAway&&!tooDistant&&(currentDistance<1||nearNow||approaching||referenceDirect||referenceCorridor));
 return{relevant,approaching,arrival};
}

export function applyConvectiveNowcastHours(hours:Hour[],thunder:ThunderstormNowcast|null|undefined){
 const cell=thunder?.nearest,relevance=cell?convectiveCellSiteRelevance(cell):null;if(!thunder?.available||!cell||!relevance?.approaching||!relevance.relevant||!Number.isFinite(relevance.arrival)||Number(relevance.arrival)>210)return hours;
 const now=Date.now(),arrival=Math.max(0,Number(relevance.arrival)),severity=clamp(Number(cell.severity)||0,0,10),lightning=Math.max(0,Number(cell.lightningRate)||0),baseSignal=clamp(28+severity*6+Math.min(25,lightning*1.8),35,92);let changed=false;
 const result=hours.map(hour=>{const minutes=(hour.epoch-now)/60000,distance=Math.abs(minutes-arrival);if(minutes<-30||distance>105)return hour;const leadFactor=clamp(1-distance/120,.18,1),capeSupport=clamp((Number(hour.cape)||0)/900,0,1),probability=clamp(Math.max(hour.probability,baseSignal*(.72+.28*capeSupport)*leadFactor),0,100),strong=probability>=58&&(severity>=4||lightning>=4),code=strong&&![95,96,99].includes(hour.code)?95:hour.code;if(Math.abs(probability-hour.probability)<.1&&code===hour.code)return hour;changed=true;return{...hour,probability,code}});
 return changed?result:hours;
}

export function forecastFusionLabel(fusion:ForecastFusionResult|null|undefined){
 if(!fusion?.active)return'';
 const applied=fusion.days.filter(day=>day.applied),confidence=applied.length?Math.round(applied.reduce((sum,day)=>sum+day.confidence,0)/applied.length):0,repaired=Math.max(0,Number(fusion.diagnostics?.repairedHours)||0),repairLabel=repaired?` · ${repaired} h plausibilitätsrepariert`:' · ohne Bündelersatz';
 return`Best Match geprüft${fusion.mosmix?.applied?' + MOSMIX lokal':''}${repairLabel}${confidence?` · ${Math.round(confidence)} % Modellvergleich`:''}`;
}
