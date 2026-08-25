import {pruneStorageEntries,touchMapEntry,writeBoundedMapEntry,writeBoundedStorage} from './cachePolicy';
import {guardedOpenMeteoFetch} from './openMeteoGuard';
export type TravelPreference='balanced'|'dry'|'warm'|'cold'|'sunny'|'snow'|'calm';

export type TravelClimateDay={
 key:string;
 maxMean:number;
 minMean:number;
 meanMean:number;
 maxP25:number;
 maxP75:number;
 minP25:number;
 minP75:number;
 precipitationMean:number;
 wetProbability:number;
 sunshineMeanHours:number;
 daylightMeanHours:number;
 windMaxMean:number;
 snowfallMean:number;
 snowDepthMean?:number;
 snowCoverProbability?:number;
 cloudMean:number;
 weatherCode:number;
 years:number;
};

export type TravelClimateDataset={
 createdAt:number;
 latitude:number;
 longitude:number;
 elevation?:number;
 timezone:string;
 source:string;
 referencePeriod:string;
 days:Record<string,TravelClimateDay>;
 snowDepthIncluded:boolean;
 snowDepthWarning?:string;
};

export type TravelDatePoint=TravelClimateDay&{date:string};

export type TravelSummary={
 start:string;
 end:string;
 days:number;
 avgMax:number;
 avgMin:number;
 avgMean:number;
 avgMaxP25:number;
 avgMaxP75:number;
 precipitationTotal:number;
 wetDaysExpected:number;
 sunshineTotal:number;
 sunshinePerDay:number;
 daylightPerDay:number;
 windMaxMean:number;
 snowfallTotal:number;
 snowDepthMean?:number;
 snowCoverDaysExpected?:number;
 cloudMean:number;
};

export type TravelConstraints={
 minAvgMax?:number;
 maxAvgMax?:number;
 maxWetDays?:number;
 minSunHoursPerDay?:number;
 /** Canonical MID wind unit: knots. */
 maxWindKt?:number;
 /** Legacy compatibility for pre-v0.9.65.2 callers. */
 maxWindKmh?:number;
 maxWindLabel?:string;
 minSnowDepthCm?:number;
};

export type TravelWindowResult={
 start:string;
 end:string;
 points:TravelDatePoint[];
 summary:TravelSummary;
 score:number;
 meetsAll:boolean;
 unmet:string[];
};

type HistoricalDailyPayload={
 latitude?:number;
 longitude?:number;
 elevation?:number;
 timezone?:string;
 daily?:Record<string,(string|number|null)[]>;
 error?:boolean;
 reason?:string;
};

type HistoricalHourlyPayload={
 latitude?:number;
 longitude?:number;
 timezone?:string;
 hourly?:Record<string,(string|number|null)[]>;
 error?:boolean;
 reason?:string;
};

export type TravelWaterClimatology={
 temperature:number;
 gridDistanceKm:number;
 referencePeriod:string;
 days:number;
 source:string;
};

type TravelWaterPeriodCache={
 createdAt:number;
 latitude:number;
 longitude:number;
 available:boolean;
 gridDistanceKm:number;
 temperature:number|null;
 days:number;
 sampleYears:number;
};

type Bucket={
 max:number[];
 min:number[];
 mean:number[];
 precipitation:number[];
 wet:number;
 sunshine:number[];
 daylight:number[];
 wind:number[];
 snowfall:number[];
 cloud:number[];
 codes:Map<number,number>;
};

const BASE_CACHE_PREFIX='mid:travel-climate:1991-2020:v3:';
const SNOW_CACHE_PREFIX='mid:travel-snow-depth:1991-2020:v3:';
const WATER_CACHE_PREFIX='mid:travel-water-climate:1991-2020:v3:';
const CACHE_MAX_AGE=3*365*86400000;
const CLIMATE_GRID_DEGREES=.1;
const WATER_GRID_DEGREES=.1;
const WATER_REFERENCE_YEARS=[1991,1995,1999,2003,2007,2011,2015,2020] as const;
const WATER_MIN_REFERENCE_YEARS=4;
const COASTAL_WATER_MAX_DISTANCE_KM=45;
const MARINE_ARCHIVE_ENDPOINT='https://marine-api.open-meteo.com/v1/marine';
const CLIMATE_ELEVATION_STEP=250;
const DAILY_VARIABLES=['weather_code','temperature_2m_max','temperature_2m_min','precipitation_sum','sunshine_duration','daylight_duration','wind_speed_10m_max','snowfall_sum'].join(',');
const memoryCache=new Map<string,unknown>();
const inFlightRequests=new Map<string,Promise<unknown>>();
const TRAVEL_MEMORY_CACHE_LIMIT=32;
const TRAVEL_STORAGE_CACHE_LIMIT=24;
const TRAVEL_CACHE_PREFIXES=[BASE_CACHE_PREFIX,SNOW_CACHE_PREFIX,WATER_CACHE_PREFIX];
let storagePruned=false;

function rounded(value:number,step:number){return Math.round(value/step)*step}
function normalizedClimateLocation(location:{latitude:number;longitude:number;elevation?:number}){return{latitude:rounded(location.latitude,CLIMATE_GRID_DEGREES),longitude:rounded(location.longitude,CLIMATE_GRID_DEGREES),elevation:Number.isFinite(location.elevation)?rounded(Number(location.elevation),CLIMATE_ELEVATION_STEP):undefined}}
function normalizedWaterLocation(location:{latitude:number;longitude:number}){return{latitude:rounded(location.latitude,WATER_GRID_DEGREES),longitude:rounded(location.longitude,WATER_GRID_DEGREES)}}
function haversineKm(lat1:number,lon1:number,lat2:number,lon2:number){const r=6371,toRad=(value:number)=>value*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(a))}
function cacheKey(prefix:string,latitude:number,longitude:number,elevation?:number){return`${prefix}${latitude.toFixed(1)}:${longitude.toFixed(1)}:${Math.round(Number(elevation??0))}`}
function prepareStorage(){if(storagePruned||typeof localStorage==='undefined')return;storagePruned=true;try{pruneStorageEntries(localStorage,TRAVEL_CACHE_PREFIXES,TRAVEL_STORAGE_CACHE_LIMIT,CACHE_MAX_AGE)}catch{}}
function readCache<T>(key:string):T|null{prepareStorage();const memory=touchMapEntry(memoryCache,key) as ({createdAt?:number}&T)|undefined;if(memory&&Number.isFinite(memory.createdAt)&&Date.now()-Number(memory.createdAt)<=CACHE_MAX_AGE)return memory;if(memory)memoryCache.delete(key);try{const raw=localStorage.getItem(key);if(!raw)return null;const parsed=JSON.parse(raw) as {createdAt?:number}&T;if(!Number.isFinite(parsed.createdAt)||Date.now()-Number(parsed.createdAt)>CACHE_MAX_AGE){localStorage.removeItem(key);return null}writeBoundedMapEntry(memoryCache,key,parsed,TRAVEL_MEMORY_CACHE_LIMIT);return parsed}catch{return null}}
function writeCache(key:string,value:unknown){writeBoundedMapEntry(memoryCache,key,value,TRAVEL_MEMORY_CACHE_LIMIT);try{writeBoundedStorage(localStorage,key,value,TRAVEL_CACHE_PREFIXES,TRAVEL_STORAGE_CACHE_LIMIT,CACHE_MAX_AGE)}catch{}}
async function sharedRequest<T>(key:string,load:()=>Promise<T>):Promise<T>{const active=touchMapEntry(inFlightRequests,key) as Promise<T>|undefined;if(active)return active;const request=load().finally(()=>inFlightRequests.delete(key));writeBoundedMapEntry(inFlightRequests,key,request,TRAVEL_MEMORY_CACHE_LIMIT);return request}
async function waitForShared<T>(promise:Promise<T>,signal?:AbortSignal):Promise<T>{if(!signal)return promise;if(signal.aborted)throw abortError();return new Promise<T>((resolve,reject)=>{const abort=()=>reject(abortError());signal.addEventListener('abort',abort,{once:true});promise.then(value=>{signal.removeEventListener('abort',abort);resolve(value)},error=>{signal.removeEventListener('abort',abort);reject(error)})})}
function numberAt(values:unknown[],index:number){const raw=values[index];if(raw===null||raw===undefined||raw==='')return Number.NaN;const value=Number(raw);return Number.isFinite(value)?value:Number.NaN}
function mean(values:number[]){const finite=values.filter(Number.isFinite);return finite.length?finite.reduce((sum,value)=>sum+value,0)/finite.length:Number.NaN}
function quantile(values:number[],q:number){const finite=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!finite.length)return Number.NaN;const position=(finite.length-1)*q,lower=Math.floor(position),upper=Math.ceil(position);return lower===upper?finite[lower]:finite[lower]+(finite[upper]-finite[lower])*(position-lower)}
function mode(codes:Map<number,number>){let best=3,count=-1;for(const[code,next]of codes)if(next>count){best=code;count=next}return best}
function dateKey(value:string){return String(value).slice(5,10)}
function emptyBucket():Bucket{return{max:[],min:[],mean:[],precipitation:[],wet:0,sunshine:[],daylight:[],wind:[],snowfall:[],cloud:[],codes:new Map()}}
function addFinite(array:number[],value:number){if(Number.isFinite(value))array.push(value)}
function abortError(){return new DOMException('Abgebrochen','AbortError')}
async function fetchJson<T>(url:string):Promise<T>{const response=await guardedOpenMeteoFetch(url,{cache:'force-cache',headers:{Accept:'application/json'}},{priority:'normal'});const payload=await response.json().catch(()=>({}));if(!response.ok||(payload as {error?:boolean}).error)throw new Error(String((payload as {reason?:string}).reason||`Open-Meteo HTTP ${response.status}`));return payload as T}

const REQUIRED_DAILY_FIELDS=['weather_code','temperature_2m_max','temperature_2m_min','precipitation_sum','sunshine_duration','daylight_duration','wind_speed_10m_max','snowfall_sum'] as const;
function finiteShare(values:unknown[],count:number){if(!count)return 0;let finite=0;for(let index=0;index<count;index++){const raw=values[index];if(raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw)))finite++}return finite/count}
function assertTravelHistoricalPayload(payload:HistoricalDailyPayload){
 const daily=payload.daily??{},times=(daily.time??[]) as unknown[],count=times.length;if(count<9000)throw new Error('Die historische Klimareihe ist unvollständig. Bitte später erneut versuchen.');
 for(const field of REQUIRED_DAILY_FIELDS){const values=(daily[field]??[]) as unknown[];if(values.length<count*.95||finiteShare(values,count)<.9)throw new Error(`Historische Klimadaten unvollständig (${field}).`)}
 const sunshine=(daily.sunshine_duration??[]) as unknown[],daylight=(daily.daylight_duration??[]) as unknown[],wind=(daily.wind_speed_10m_max??[]) as unknown[];
 const hasDaylight=daylight.some(value=>Number(value)>6*3600),hasSunshine=sunshine.some(value=>Number(value)>0),hasWind=wind.some(value=>Number(value)>.05);
 if(hasDaylight&&!hasSunshine)throw new Error('Historische Sonnenscheindauer ist für diese Quelle unplausibel (durchgehend 0 h).');
 if(!hasWind)throw new Error('Historische Windreihe ist für diese Quelle unplausibel (durchgehend 0).');
}

export function aggregateTravelClimate(payload:HistoricalDailyPayload):TravelClimateDataset{
 const daily=payload.daily??{},times=(daily.time??[]) as string[],buckets=new Map<string,Bucket>();
 for(let index=0;index<times.length;index++){
  const key=dateKey(times[index]),bucket=buckets.get(key)??emptyBucket();
  const max=numberAt(daily.temperature_2m_max??[],index),min=numberAt(daily.temperature_2m_min??[],index),precipitation=numberAt(daily.precipitation_sum??[],index),sunshine=numberAt(daily.sunshine_duration??[],index),daylight=numberAt(daily.daylight_duration??[],index),wind=numberAt(daily.wind_speed_10m_max??[],index),snowfall=numberAt(daily.snowfall_sum??[],index),code=Math.round(numberAt(daily.weather_code??[],index)),meanValue=Number.isFinite(max)&&Number.isFinite(min)?(max+min)/2:Number.NaN,cloudProxy=Number.isFinite(sunshine)&&Number.isFinite(daylight)&&daylight>0?Math.max(0,Math.min(100,100*(1-sunshine/daylight))):Number.NaN;
  addFinite(bucket.max,max);addFinite(bucket.min,min);addFinite(bucket.mean,meanValue);addFinite(bucket.precipitation,precipitation);addFinite(bucket.sunshine,sunshine/3600);addFinite(bucket.daylight,daylight/3600);addFinite(bucket.wind,wind);addFinite(bucket.snowfall,snowfall);addFinite(bucket.cloud,cloudProxy);
  if(Number.isFinite(precipitation)&&precipitation>=1)bucket.wet++;
  if(Number.isFinite(code))bucket.codes.set(code,(bucket.codes.get(code)??0)+1);
  buckets.set(key,bucket);
 }
 const days:Record<string,TravelClimateDay>={};
 for(const[key,bucket]of buckets){
  const years=Math.max(bucket.max.length,bucket.min.length,bucket.precipitation.length);
  if(years<20)continue;
  days[key]={key,maxMean:mean(bucket.max),minMean:mean(bucket.min),meanMean:mean(bucket.mean),maxP25:quantile(bucket.max,.25),maxP75:quantile(bucket.max,.75),minP25:quantile(bucket.min,.25),minP75:quantile(bucket.min,.75),precipitationMean:mean(bucket.precipitation),wetProbability:years?bucket.wet/years*100:0,sunshineMeanHours:mean(bucket.sunshine),daylightMeanHours:mean(bucket.daylight),windMaxMean:mean(bucket.wind),snowfallMean:mean(bucket.snowfall),cloudMean:mean(bucket.cloud),weatherCode:mode(bucket.codes),years};
 }
 return{createdAt:Date.now(),latitude:Number(payload.latitude),longitude:Number(payload.longitude),elevation:Number.isFinite(Number(payload.elevation))?Number(payload.elevation):undefined,timezone:String(payload.timezone||'auto'),source:'Open-Meteo ERA5-Seamless · ERA5-Land + ERA5',referencePeriod:'1991–2020',days,snowDepthIncluded:false};
}

function aggregateSnowDepth(payload:HistoricalHourlyPayload){
 const hourly=payload.hourly??{},times=(hourly.time??[]) as string[],values=(hourly.snow_depth??[]) as (number|null)[],dailyMax=new Map<string,number>();
 for(let index=0;index<times.length;index++){
  const raw=values[index];if(raw===null||raw===undefined)continue;const value=Number(raw);if(!Number.isFinite(value))continue;const date=String(times[index]).slice(0,10),centimetres=Math.max(0,value*100),current=dailyMax.get(date);if(current===undefined||centimetres>current)dailyMax.set(date,centimetres);
 }
 const buckets=new Map<string,number[]>();for(const[date,value]of dailyMax){const key=dateKey(date),rows=buckets.get(key)??[];rows.push(value);buckets.set(key,rows)}
 const result:Record<string,{mean:number;probability:number;years:number}>={};for(const[key,valuesForDay]of buckets){const finite=valuesForDay.filter(Number.isFinite);if(finite.length<15)continue;result[key]={mean:mean(finite),probability:finite.filter(value=>value>=1).length/finite.length*100,years:finite.length}}
 return result;
}

export async function fetchTravelClimatology(location:{latitude:number;longitude:number;elevation?:number},includeSnowDepth:boolean,signal?:AbortSignal):Promise<TravelClimateDataset>{
 const climateLocation=normalizedClimateLocation(location),baseKey=cacheKey(BASE_CACHE_PREFIX,climateLocation.latitude,climateLocation.longitude,climateLocation.elevation);let dataset=readCache<TravelClimateDataset>(baseKey);
 if(!dataset){
  const request=sharedRequest<TravelClimateDataset>(baseKey,async()=>{const cached=readCache<TravelClimateDataset>(baseKey);if(cached)return cached;const params=new URLSearchParams({latitude:String(climateLocation.latitude),longitude:String(climateLocation.longitude),start_date:'1991-01-01',end_date:'2020-12-31',daily:DAILY_VARIABLES,timezone:'auto',models:'era5_seamless',cell_selection:'land',temperature_unit:'celsius',precipitation_unit:'mm',wind_speed_unit:'kn'});if(Number.isFinite(climateLocation.elevation))params.set('elevation',String(climateLocation.elevation));const payload=await fetchJson<HistoricalDailyPayload>(`https://archive-api.open-meteo.com/v1/archive?${params}`);assertTravelHistoricalPayload(payload);const result=aggregateTravelClimate(payload);writeCache(baseKey,result);return result});
  dataset=await waitForShared(request,signal);
 }
 if(!includeSnowDepth)return dataset;
 const snowKey=cacheKey(SNOW_CACHE_PREFIX,climateLocation.latitude,climateLocation.longitude,climateLocation.elevation),cachedSnow=readCache<{createdAt:number;values:Record<string,{mean:number;probability:number;years:number}>}>(snowKey);let snow=cachedSnow?.values;
 if(!snow){
  try{
   const request=sharedRequest<{createdAt:number;values:Record<string,{mean:number;probability:number;years:number}>}>(snowKey,async()=>{const cached=readCache<{createdAt:number;values:Record<string,{mean:number;probability:number;years:number}>}>(snowKey);if(cached)return cached;const params=new URLSearchParams({latitude:String(climateLocation.latitude),longitude:String(climateLocation.longitude),start_date:'1991-01-01',end_date:'2020-12-31',hourly:'snow_depth',timezone:'auto',models:'era5_land',cell_selection:'land',precipitation_unit:'mm'});if(Number.isFinite(climateLocation.elevation))params.set('elevation',String(climateLocation.elevation));const value={createdAt:Date.now(),values:aggregateSnowDepth(await fetchJson<HistoricalHourlyPayload>(`https://archive-api.open-meteo.com/v1/archive?${params}`))};writeCache(snowKey,value);return value});snow=(await waitForShared(request,signal)).values;
  }catch(error){if(signal?.aborted)throw abortError();return{...dataset,snowDepthIncluded:false,snowDepthWarning:error instanceof Error?`Historische Schneehöhe nicht verfügbar: ${error.message}`:'Historische Schneehöhe nicht verfügbar.'}}
 }
 const days={...dataset.days};for(const[key,value]of Object.entries(snow)){const day=days[key];if(day)days[key]={...day,snowDepthMean:value.mean,snowCoverProbability:value.probability,years:Math.min(day.years,value.years)}}
 return{...dataset,days,snowDepthIncluded:true,snowDepthWarning:undefined};
}

function validDateParts(value:string){const match=String(value).match(/^\d{4}-(\d{2})-(\d{2})$/);return match?{month:Number(match[1]),day:Number(match[2]),monthDay:`${match[1]}-${match[2]}`}:null}
function leapYear(year:number){return year%4===0&&(year%100!==0||year%400===0)}
function referenceDate(year:number,monthDay:string){const [monthRaw,dayRaw]=monthDay.split('-'),month=Number(monthRaw),day=Number(dayRaw),safeDay=month===2&&day===29&&!leapYear(year)?28:day;return`${year}-${String(month).padStart(2,'0')}-${String(safeDay).padStart(2,'0')}`}
function travelWaterPeriodSignature(start:string,end:string){const a=validDateParts(start),b=validDateParts(end);return a&&b?`${a.monthDay}_${b.monthDay}`:`${start}_${end}`}
function periodCrossesYear(start:string,end:string){const a=validDateParts(start),b=validDateParts(end);return Boolean(a&&b&&a.monthDay>b.monthDay)}
function waterPayloadPeriodMean(payload:HistoricalHourlyPayload){const hourly=payload.hourly??{},times=(hourly.time??[]) as string[],rawValues=(hourly.sea_surface_temperature??[]) as (string|number|null)[],daily=new Map<string,{sum:number;count:number}>();for(let index=0;index<times.length;index++){const raw=rawValues[index];if(raw===null||raw===undefined||raw==='')continue;const value=Number(raw);if(!Number.isFinite(value))continue;const date=String(times[index]).slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date))continue;const bucket=daily.get(date)??{sum:0,count:0};bucket.sum+=value;bucket.count++;daily.set(date,bucket)}const means=[...daily.values()].filter(bucket=>bucket.count>0).map(bucket=>bucket.sum/bucket.count).filter(Number.isFinite);return means.length?{mean:mean(means),days:means.length}:null}
async function loadTravelWaterPeriod(location:{latitude:number;longitude:number},start:string,end:string,signal?:AbortSignal):Promise<TravelWaterPeriodCache>{
 const normalized=normalizedWaterLocation(location),signature=travelWaterPeriodSignature(start,end),key=`${cacheKey(WATER_CACHE_PREFIX,normalized.latitude,normalized.longitude)}:${signature}`,cached=readCache<TravelWaterPeriodCache>(key);if(cached)return cached;
 const request=sharedRequest<TravelWaterPeriodCache>(key,async()=>{const existing=readCache<TravelWaterPeriodCache>(key);if(existing)return existing;const startParts=validDateParts(start),endParts=validDateParts(end);if(!startParts||!endParts)return{createdAt:Date.now(),latitude:normalized.latitude,longitude:normalized.longitude,available:false,gridDistanceKm:Number.POSITIVE_INFINITY,temperature:null,days:0,sampleYears:0};
  const crosses=periodCrossesYear(start,end),base={latitude:String(normalized.latitude),longitude:String(normalized.longitude),hourly:'sea_surface_temperature',timezone:'GMT',models:'era5_ocean',cell_selection:'sea'},loadYear=async(year:number)=>{const startDate=referenceDate(year,startParts.monthDay),endDate=referenceDate(year+(crosses?1:0),endParts.monthDay),params=new URLSearchParams({...base,start_date:startDate,end_date:endDate}),payload=await fetchJson<HistoricalHourlyPayload>(`${MARINE_ARCHIVE_ENDPOINT}?${params}`),period=waterPayloadPeriodMean(payload),gridLat=Number(payload.latitude),gridLon=Number(payload.longitude),gridDistanceKm=Number.isFinite(gridLat)&&Number.isFinite(gridLon)?haversineKm(location.latitude,location.longitude,gridLat,gridLon):Number.POSITIVE_INFINITY;return period&&Number.isFinite(gridDistanceKm)&&gridDistanceKm<=COASTAL_WATER_MAX_DISTANCE_KM?{...period,gridLat,gridLon,gridDistanceKm,year}:null},first=await loadYear(WATER_REFERENCE_YEARS[0]);
  if(!first){const unavailable={createdAt:Date.now(),latitude:normalized.latitude,longitude:normalized.longitude,available:false,gridDistanceKm:Number.POSITIVE_INFINITY,temperature:null,days:dateRange(start,end).length,sampleYears:0} satisfies TravelWaterPeriodCache;writeCache(key,unavailable);return unavailable}
  const settled=await Promise.allSettled(WATER_REFERENCE_YEARS.slice(1).map(loadYear)),rows=[first,...settled.flatMap(result=>result.status==='fulfilled'&&result.value?[result.value]:[])];
  if(rows.length<WATER_MIN_REFERENCE_YEARS){const unavailable={createdAt:Date.now(),latitude:normalized.latitude,longitude:normalized.longitude,available:false,gridDistanceKm:rows.length?Math.min(...rows.map(row=>row.gridDistanceKm)):Number.POSITIVE_INFINITY,temperature:null,days:dateRange(start,end).length,sampleYears:rows.length} satisfies TravelWaterPeriodCache;writeCache(key,unavailable);return unavailable}
  const gridDistanceKm=Math.min(...rows.map(row=>row.gridDistanceKm)),temperature=mean(rows.map(row=>row.mean)),value={createdAt:Date.now(),latitude:rows[0].gridLat,longitude:rows[0].gridLon,available:Number.isFinite(temperature),gridDistanceKm,temperature:Number.isFinite(temperature)?temperature:null,days:dateRange(start,end).length,sampleYears:rows.length} satisfies TravelWaterPeriodCache;writeCache(key,value);return value});
 return waitForShared(request,signal);
}

export async function fetchTravelWaterClimatology(location:{latitude:number;longitude:number},start:string,end:string,signal?:AbortSignal):Promise<TravelWaterClimatology|null>{
 const result=await loadTravelWaterPeriod(location,start,end,signal);if(!result.available||result.temperature===null)return null;return{temperature:result.temperature,gridDistanceKm:result.gridDistanceKm,referencePeriod:`1991–2020 · ${result.sampleYears} Referenzjahre`,days:result.days,source:'Open-Meteo Marine API · ERA5-Ocean · historische SST-Klimastichprobe'};
}

function parseIsoDate(value:string){const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12)):new Date(Number.NaN)}
function isoDate(date:Date){return date.toISOString().slice(0,10)}
export function addDays(value:string,days:number){const date=parseIsoDate(value);if(!Number.isFinite(date.getTime()))return value;date.setUTCDate(date.getUTCDate()+days);return isoDate(date)}
export function daysBetween(start:string,end:string){const a=parseIsoDate(start),b=parseIsoDate(end);if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime()))return Number.NaN;return Math.round((b.getTime()-a.getTime())/86400000)}
export function dateRange(start:string,end:string){const span=daysBetween(start,end);if(!Number.isFinite(span)||span<0||span>366)return[];return Array.from({length:span+1},(_,index)=>addDays(start,index))}
function interpolatedLeapDay(dataset:TravelClimateDataset):TravelClimateDay|undefined{const before=dataset.days['02-28'],after=dataset.days['03-01'];if(!before||!after)return undefined;const mix=(a:number|undefined,b:number|undefined)=>Number.isFinite(a)&&Number.isFinite(b)?(Number(a)+Number(b))/2:undefined;return{...before,key:'02-29',maxMean:mix(before.maxMean,after.maxMean)??before.maxMean,minMean:mix(before.minMean,after.minMean)??before.minMean,meanMean:mix(before.meanMean,after.meanMean)??before.meanMean,maxP25:mix(before.maxP25,after.maxP25)??before.maxP25,maxP75:mix(before.maxP75,after.maxP75)??before.maxP75,minP25:mix(before.minP25,after.minP25)??before.minP25,minP75:mix(before.minP75,after.minP75)??before.minP75,precipitationMean:mix(before.precipitationMean,after.precipitationMean)??before.precipitationMean,wetProbability:mix(before.wetProbability,after.wetProbability)??before.wetProbability,sunshineMeanHours:mix(before.sunshineMeanHours,after.sunshineMeanHours)??before.sunshineMeanHours,daylightMeanHours:mix(before.daylightMeanHours,after.daylightMeanHours)??before.daylightMeanHours,windMaxMean:mix(before.windMaxMean,after.windMaxMean)??before.windMaxMean,snowfallMean:mix(before.snowfallMean,after.snowfallMean)??before.snowfallMean,snowDepthMean:mix(before.snowDepthMean,after.snowDepthMean),snowCoverProbability:mix(before.snowCoverProbability,after.snowCoverProbability),cloudMean:mix(before.cloudMean,after.cloudMean)??before.cloudMean,weatherCode:before.weatherCode,years:Math.min(before.years,after.years)};}
export function travelClimateForDate(dataset:TravelClimateDataset,date:string):TravelDatePoint|undefined{const key=dateKey(date),value=dataset.days[key]??(key==='02-29'?interpolatedLeapDay(dataset):undefined);return value?{...value,date}:undefined}
export function travelPeriod(dataset:TravelClimateDataset,start:string,end:string){return dateRange(start,end).map(date=>travelClimateForDate(dataset,date)).filter((value):value is TravelDatePoint=>Boolean(value))}

export function summarizeTravelPeriod(points:TravelDatePoint[]):TravelSummary{
 const first=points[0]?.date??'',last=points[points.length-1]?.date??'',count=Math.max(1,points.length),sum=(key:keyof TravelClimateDay)=>points.reduce((total,point)=>{const value=Number(point[key]);return total+(Number.isFinite(value)?value:0)},0),meanOptional=(key:keyof TravelClimateDay)=>{const values=points.map(point=>Number(point[key])).filter(Number.isFinite);return values.length?values.reduce((total,value)=>total+value,0)/values.length:undefined};
 return{start:first,end:last,days:points.length,avgMax:sum('maxMean')/count,avgMin:sum('minMean')/count,avgMean:sum('meanMean')/count,avgMaxP25:sum('maxP25')/count,avgMaxP75:sum('maxP75')/count,precipitationTotal:sum('precipitationMean'),wetDaysExpected:sum('wetProbability')/100,sunshineTotal:sum('sunshineMeanHours'),sunshinePerDay:sum('sunshineMeanHours')/count,daylightPerDay:sum('daylightMeanHours')/count,windMaxMean:sum('windMaxMean')/count,snowfallTotal:sum('snowfallMean'),snowDepthMean:meanOptional('snowDepthMean'),snowCoverDaysExpected:points.some(point=>Number.isFinite(point.snowCoverProbability))?sum('snowCoverProbability')/100:undefined,cloudMean:sum('cloudMean')/count};
}

function scoreSummary(summary:TravelSummary,preference:TravelPreference){
 switch(preference){
  case'dry':return-summary.precipitationTotal-summary.wetDaysExpected*4+summary.sunshinePerDay*.6;
  case'warm':return summary.avgMax*4+summary.sunshinePerDay-summary.wetDaysExpected;
  case'cold':return-summary.avgMax*4+(summary.snowDepthMean??0)*1.5+summary.snowfallTotal;
  case'sunny':return summary.sunshinePerDay*10-summary.cloudMean*.12-summary.wetDaysExpected*1.5;
  case'snow':return(summary.snowDepthMean??0)*4+(summary.snowCoverDaysExpected??0)*2+summary.snowfallTotal*1.5-summary.avgMax;
  case'calm':return-summary.windMaxMean*1.852*3-summary.wetDaysExpected+summary.sunshinePerDay*.25;
  default:return-Math.abs(summary.avgMax-24)*2-summary.wetDaysExpected*3+summary.sunshinePerDay*5-summary.windMaxMean*1.852*.3;
 }
}

function constraintResult(summary:TravelSummary,constraints:TravelConstraints){
 const unmet:string[]=[];
 if(Number.isFinite(constraints.minAvgMax)&&summary.avgMax<Number(constraints.minAvgMax))unmet.push(`Ø Höchsttemperatur unter ${constraints.minAvgMax} °C`);
 if(Number.isFinite(constraints.maxAvgMax)&&summary.avgMax>Number(constraints.maxAvgMax))unmet.push(`Ø Höchsttemperatur über ${constraints.maxAvgMax} °C`);
 if(Number.isFinite(constraints.maxWetDays)&&summary.wetDaysExpected>Number(constraints.maxWetDays))unmet.push(`mehr als ${constraints.maxWetDays} erwartete Regentage`);
 if(Number.isFinite(constraints.minSunHoursPerDay)&&summary.sunshinePerDay<Number(constraints.minSunHoursPerDay))unmet.push(`weniger als ${constraints.minSunHoursPerDay} Sonnenstunden pro Tag`);
 const maxWindKt=Number.isFinite(constraints.maxWindKt)?Number(constraints.maxWindKt):Number.isFinite(constraints.maxWindKmh)?Number(constraints.maxWindKmh)/1.852:Number.NaN;
 if(Number.isFinite(maxWindKt)&&summary.windMaxMean>maxWindKt)unmet.push(`Ø Windmaximum über ${constraints.maxWindLabel||`${Math.round(maxWindKt)} kt`}`);
 if(Number.isFinite(constraints.minSnowDepthCm)&&(!Number.isFinite(summary.snowDepthMean)||Number(summary.snowDepthMean)<Number(constraints.minSnowDepthCm)))unmet.push(`mittlere Schneehöhe unter ${constraints.minSnowDepthCm} cm`);
 return unmet;
}

export function bestTravelWindows(dataset:TravelClimateDataset,searchStart:string,searchEnd:string,tripDays:number,preference:TravelPreference,constraints:TravelConstraints={},limit=3):TravelWindowResult[]{
 const allDates=dateRange(searchStart,searchEnd),length=Math.max(2,Math.min(42,Math.round(tripDays)));if(allDates.length<length)return[];
 const candidates:TravelWindowResult[]=[];
 for(let startIndex=0;startIndex<=allDates.length-length;startIndex++){
  const start=allDates[startIndex],end=allDates[startIndex+length-1],points=travelPeriod(dataset,start,end);if(points.length!==length)continue;const summary=summarizeTravelPeriod(points),unmet=constraintResult(summary,constraints);candidates.push({start,end,points,summary,score:scoreSummary(summary,preference)-unmet.length*1000,meetsAll:unmet.length===0,unmet});
 }
 candidates.sort((a,b)=>Number(b.meetsAll)-Number(a.meetsAll)||b.score-a.score||a.start.localeCompare(b.start));
 const selected:TravelWindowResult[]=[],minimumGap=Math.max(2,Math.floor(length/3));
 for(const candidate of candidates){if(selected.some(existing=>Math.abs(daysBetween(existing.start,candidate.start))<minimumGap))continue;selected.push(candidate);if(selected.length>=limit)break}
 return selected;
}

export function travelNarrative(summary:TravelSummary,preference:TravelPreference,snowDepthIncluded:boolean){
 const thermal=summary.avgMax>=30?'sehr warm bis heiß':summary.avgMax>=25?'warm':summary.avgMax>=20?'mild bis warm':summary.avgMax>=15?'mild':summary.avgMax>=10?'kühl':'kalt',wetShare=summary.days?summary.wetDaysExpected/summary.days:0,moisture=wetShare<=.03&&summary.precipitationTotal<.2?'trocken':wetShare<=.2?'überwiegend trocken':wetShare<=.4?'eher trocken':wetShare<=.6?'wechselhaft':'häufig niederschlagsanfällig',sun=summary.sunshinePerDay>=8?'sehr sonnig':summary.sunshinePerDay>=5?'sonnig':summary.sunshinePerDay>=3?'mit mäßigem Sonnenschein':'eher sonnenarm',wind=summary.windMaxMean>=40/1.852?'oft windig':summary.windMaxMean>=25/1.852?'zeitweise windig':'meist mäßig windig';
 const roundedWetDays=Math.round(summary.wetDaysExpected),parts=[`Klimatologisch ist der Zeitraum ${thermal}, ${moisture} und ${sun}.`,`${wind[0].toUpperCase()}${wind.slice(1)}; erwartet werden im Mittel rund ${roundedWetDays} Niederschlagstage.`];
 if(preference==='snow')parts.push(snowDepthIncluded&&Number.isFinite(summary.snowDepthMean)?`Die mittlere modellierte Schneehöhe liegt bei rund ${Math.round(Number(summary.snowDepthMean))} cm.`:`Die Schneebewertung stützt sich ersatzweise auf den historischen Schneefall.`);
 return parts.join(' ');
}
