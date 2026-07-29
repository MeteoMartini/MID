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
 humidityMean:number;
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
 humidityMean:number;
};

export type TravelConstraints={
 minAvgMax?:number;
 maxAvgMax?:number;
 maxWetDays?:number;
 minSunHoursPerDay?:number;
 maxWindKmh?:number;
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
 hourly?:Record<string,(string|number|null)[]>;
 error?:boolean;
 reason?:string;
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
 humidity:number[];
 codes:Map<number,number>;
};

const BASE_CACHE_PREFIX='mid:travel-climate:1991-2020:v1:';
const SNOW_CACHE_PREFIX='mid:travel-snow-depth:1991-2020:v1:';
const CACHE_MAX_AGE=180*86400000;
const DAILY_VARIABLES=['weather_code','temperature_2m_mean','temperature_2m_max','temperature_2m_min','precipitation_sum','precipitation_hours','sunshine_duration','daylight_duration','wind_speed_10m_max','snowfall_sum','cloud_cover_mean','relative_humidity_2m_mean'].join(',');

function rounded(value:number,step:number){return Math.round(value/step)*step}
function cacheKey(prefix:string,latitude:number,longitude:number,elevation?:number){return`${prefix}${rounded(latitude,.05).toFixed(2)}:${rounded(longitude,.05).toFixed(2)}:${rounded(Number(elevation??0),100)}`}
function readCache<T>(key:string):T|null{try{const raw=localStorage.getItem(key);if(!raw)return null;const parsed=JSON.parse(raw) as {createdAt?:number}&T;if(!Number.isFinite(parsed.createdAt)||Date.now()-Number(parsed.createdAt)>CACHE_MAX_AGE)return null;return parsed}catch{return null}}
function writeCache(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function numberAt(values:unknown[],index:number){const value=Number(values[index]);return Number.isFinite(value)?value:Number.NaN}
function mean(values:number[]){const finite=values.filter(Number.isFinite);return finite.length?finite.reduce((sum,value)=>sum+value,0)/finite.length:Number.NaN}
function quantile(values:number[],q:number){const finite=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!finite.length)return Number.NaN;const position=(finite.length-1)*q,lower=Math.floor(position),upper=Math.ceil(position);return lower===upper?finite[lower]:finite[lower]+(finite[upper]-finite[lower])*(position-lower)}
function mode(codes:Map<number,number>){let best=3,count=-1;for(const[code,next]of codes)if(next>count){best=code;count=next}return best}
function dateKey(value:string){return String(value).slice(5,10)}
function emptyBucket():Bucket{return{max:[],min:[],mean:[],precipitation:[],wet:0,sunshine:[],daylight:[],wind:[],snowfall:[],cloud:[],humidity:[],codes:new Map()}}
function addFinite(array:number[],value:number){if(Number.isFinite(value))array.push(value)}
function abortError(){return new DOMException('Abgebrochen','AbortError')}
async function fetchJson<T>(url:string,signal?:AbortSignal):Promise<T>{const response=await fetch(url,{signal,cache:'force-cache',headers:{Accept:'application/json'}});const payload=await response.json().catch(()=>({}));if(!response.ok||(payload as {error?:boolean}).error)throw new Error(String((payload as {reason?:string}).reason||`Open-Meteo HTTP ${response.status}`));return payload as T}

export function aggregateTravelClimate(payload:HistoricalDailyPayload):TravelClimateDataset{
 const daily=payload.daily??{},times=(daily.time??[]) as string[],buckets=new Map<string,Bucket>();
 for(let index=0;index<times.length;index++){
  const key=dateKey(times[index]),bucket=buckets.get(key)??emptyBucket();
  const max=numberAt(daily.temperature_2m_max??[],index),min=numberAt(daily.temperature_2m_min??[],index),meanValue=numberAt(daily.temperature_2m_mean??[],index),precipitation=numberAt(daily.precipitation_sum??[],index),sunshine=numberAt(daily.sunshine_duration??[],index),daylight=numberAt(daily.daylight_duration??[],index),wind=numberAt(daily.wind_speed_10m_max??[],index),snowfall=numberAt(daily.snowfall_sum??[],index),cloud=numberAt(daily.cloud_cover_mean??[],index),humidity=numberAt(daily.relative_humidity_2m_mean??[],index),code=Math.round(numberAt(daily.weather_code??[],index));
  addFinite(bucket.max,max);addFinite(bucket.min,min);addFinite(bucket.mean,meanValue);addFinite(bucket.precipitation,precipitation);addFinite(bucket.sunshine,sunshine/3600);addFinite(bucket.daylight,daylight/3600);addFinite(bucket.wind,wind);addFinite(bucket.snowfall,snowfall);addFinite(bucket.cloud,cloud);addFinite(bucket.humidity,humidity);
  if(Number.isFinite(precipitation)&&precipitation>=1)bucket.wet++;
  if(Number.isFinite(code))bucket.codes.set(code,(bucket.codes.get(code)??0)+1);
  buckets.set(key,bucket);
 }
 const days:Record<string,TravelClimateDay>={};
 for(const[key,bucket]of buckets){
  const years=Math.max(bucket.max.length,bucket.min.length,bucket.precipitation.length);
  if(years<20)continue;
  days[key]={key,maxMean:mean(bucket.max),minMean:mean(bucket.min),meanMean:mean(bucket.mean),maxP25:quantile(bucket.max,.25),maxP75:quantile(bucket.max,.75),minP25:quantile(bucket.min,.25),minP75:quantile(bucket.min,.75),precipitationMean:mean(bucket.precipitation),wetProbability:years?bucket.wet/years*100:0,sunshineMeanHours:mean(bucket.sunshine),daylightMeanHours:mean(bucket.daylight),windMaxMean:mean(bucket.wind),snowfallMean:mean(bucket.snowfall),cloudMean:mean(bucket.cloud),humidityMean:mean(bucket.humidity),weatherCode:mode(bucket.codes),years};
 }
 return{createdAt:Date.now(),latitude:Number(payload.latitude),longitude:Number(payload.longitude),elevation:Number.isFinite(Number(payload.elevation))?Number(payload.elevation):undefined,timezone:String(payload.timezone||'auto'),source:'Open-Meteo ERA5-Land-Reanalyse',referencePeriod:'1991–2020',days,snowDepthIncluded:false};
}

function aggregateSnowDepth(payload:HistoricalHourlyPayload){
 const hourly=payload.hourly??{},times=(hourly.time??[]) as string[],values=(hourly.snow_depth??[]) as (number|null)[],dailyMax=new Map<string,number>();
 for(let index=0;index<times.length;index++){
  const value=Number(values[index]);if(!Number.isFinite(value))continue;const date=String(times[index]).slice(0,10),centimetres=Math.max(0,value*100),current=dailyMax.get(date);if(current===undefined||centimetres>current)dailyMax.set(date,centimetres);
 }
 const buckets=new Map<string,number[]>();for(const[date,value]of dailyMax){const key=dateKey(date),rows=buckets.get(key)??[];rows.push(value);buckets.set(key,rows)}
 const result:Record<string,{mean:number;probability:number;years:number}>={};for(const[key,valuesForDay]of buckets){const finite=valuesForDay.filter(Number.isFinite);if(finite.length<15)continue;result[key]={mean:mean(finite),probability:finite.filter(value=>value>=1).length/finite.length*100,years:finite.length}}
 return result;
}

export async function fetchTravelClimatology(location:{latitude:number;longitude:number;elevation?:number},includeSnowDepth:boolean,signal?:AbortSignal):Promise<TravelClimateDataset>{
 const baseKey=cacheKey(BASE_CACHE_PREFIX,location.latitude,location.longitude,location.elevation);let dataset=readCache<TravelClimateDataset>(baseKey);
 if(!dataset){
  const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),start_date:'1991-01-01',end_date:'2020-12-31',daily:DAILY_VARIABLES,timezone:'auto',models:'era5_land',cell_selection:'land',wind_speed_unit:'kmh'});if(Number.isFinite(location.elevation))params.set('elevation',String(location.elevation));
  dataset=aggregateTravelClimate(await fetchJson<HistoricalDailyPayload>(`https://archive-api.open-meteo.com/v1/archive?${params}`,signal));writeCache(baseKey,dataset);
 }
 if(!includeSnowDepth)return dataset;
 const snowKey=cacheKey(SNOW_CACHE_PREFIX,location.latitude,location.longitude,location.elevation),cachedSnow=readCache<{createdAt:number;values:Record<string,{mean:number;probability:number;years:number}>}>(snowKey);
 let snow=cachedSnow?.values;
 if(!snow){
  try{
   const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),start_date:'1991-01-01',end_date:'2020-12-31',hourly:'snow_depth',timezone:'auto',models:'era5_land',cell_selection:'land'});if(Number.isFinite(location.elevation))params.set('elevation',String(location.elevation));
   snow=aggregateSnowDepth(await fetchJson<HistoricalHourlyPayload>(`https://archive-api.open-meteo.com/v1/archive?${params}`,signal));writeCache(snowKey,{createdAt:Date.now(),values:snow});
  }catch(error){if(signal?.aborted)throw abortError();return{...dataset,snowDepthIncluded:false,snowDepthWarning:error instanceof Error?`Historische Schneehöhe nicht verfügbar: ${error.message}`:'Historische Schneehöhe nicht verfügbar.'}}
 }
 const days={...dataset.days};for(const[key,value]of Object.entries(snow)){const day=days[key];if(day)days[key]={...day,snowDepthMean:value.mean,snowCoverProbability:value.probability,years:Math.min(day.years,value.years)}}
 return{...dataset,days,snowDepthIncluded:true,snowDepthWarning:undefined};
}

function parseIsoDate(value:string){const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12)):new Date(Number.NaN)}
function isoDate(date:Date){return date.toISOString().slice(0,10)}
export function addDays(value:string,days:number){const date=parseIsoDate(value);if(!Number.isFinite(date.getTime()))return value;date.setUTCDate(date.getUTCDate()+days);return isoDate(date)}
export function daysBetween(start:string,end:string){const a=parseIsoDate(start),b=parseIsoDate(end);if(!Number.isFinite(a.getTime())||!Number.isFinite(b.getTime()))return Number.NaN;return Math.round((b.getTime()-a.getTime())/86400000)}
export function dateRange(start:string,end:string){const span=daysBetween(start,end);if(!Number.isFinite(span)||span<0||span>366)return[];return Array.from({length:span+1},(_,index)=>addDays(start,index))}
function interpolatedLeapDay(dataset:TravelClimateDataset):TravelClimateDay|undefined{const before=dataset.days['02-28'],after=dataset.days['03-01'];if(!before||!after)return undefined;const mix=(a:number|undefined,b:number|undefined)=>Number.isFinite(a)&&Number.isFinite(b)?(Number(a)+Number(b))/2:undefined;return{...before,key:'02-29',maxMean:mix(before.maxMean,after.maxMean)??before.maxMean,minMean:mix(before.minMean,after.minMean)??before.minMean,meanMean:mix(before.meanMean,after.meanMean)??before.meanMean,maxP25:mix(before.maxP25,after.maxP25)??before.maxP25,maxP75:mix(before.maxP75,after.maxP75)??before.maxP75,minP25:mix(before.minP25,after.minP25)??before.minP25,minP75:mix(before.minP75,after.minP75)??before.minP75,precipitationMean:mix(before.precipitationMean,after.precipitationMean)??before.precipitationMean,wetProbability:mix(before.wetProbability,after.wetProbability)??before.wetProbability,sunshineMeanHours:mix(before.sunshineMeanHours,after.sunshineMeanHours)??before.sunshineMeanHours,daylightMeanHours:mix(before.daylightMeanHours,after.daylightMeanHours)??before.daylightMeanHours,windMaxMean:mix(before.windMaxMean,after.windMaxMean)??before.windMaxMean,snowfallMean:mix(before.snowfallMean,after.snowfallMean)??before.snowfallMean,snowDepthMean:mix(before.snowDepthMean,after.snowDepthMean),snowCoverProbability:mix(before.snowCoverProbability,after.snowCoverProbability),cloudMean:mix(before.cloudMean,after.cloudMean)??before.cloudMean,humidityMean:mix(before.humidityMean,after.humidityMean)??before.humidityMean,weatherCode:before.weatherCode,years:Math.min(before.years,after.years)};}
export function travelClimateForDate(dataset:TravelClimateDataset,date:string):TravelDatePoint|undefined{const key=dateKey(date),value=dataset.days[key]??(key==='02-29'?interpolatedLeapDay(dataset):undefined);return value?{...value,date}:undefined}
export function travelPeriod(dataset:TravelClimateDataset,start:string,end:string){return dateRange(start,end).map(date=>travelClimateForDate(dataset,date)).filter((value):value is TravelDatePoint=>Boolean(value))}

export function summarizeTravelPeriod(points:TravelDatePoint[]):TravelSummary{
 const first=points[0]?.date??'',last=points[points.length-1]?.date??'',count=Math.max(1,points.length),sum=(key:keyof TravelClimateDay)=>points.reduce((total,point)=>{const value=Number(point[key]);return total+(Number.isFinite(value)?value:0)},0),meanOptional=(key:keyof TravelClimateDay)=>{const values=points.map(point=>Number(point[key])).filter(Number.isFinite);return values.length?values.reduce((total,value)=>total+value,0)/values.length:undefined};
 return{start:first,end:last,days:points.length,avgMax:sum('maxMean')/count,avgMin:sum('minMean')/count,avgMean:sum('meanMean')/count,avgMaxP25:sum('maxP25')/count,avgMaxP75:sum('maxP75')/count,precipitationTotal:sum('precipitationMean'),wetDaysExpected:sum('wetProbability')/100,sunshineTotal:sum('sunshineMeanHours'),sunshinePerDay:sum('sunshineMeanHours')/count,daylightPerDay:sum('daylightMeanHours')/count,windMaxMean:sum('windMaxMean')/count,snowfallTotal:sum('snowfallMean'),snowDepthMean:meanOptional('snowDepthMean'),snowCoverDaysExpected:points.some(point=>Number.isFinite(point.snowCoverProbability))?sum('snowCoverProbability')/100:undefined,cloudMean:sum('cloudMean')/count,humidityMean:sum('humidityMean')/count};
}

function scoreSummary(summary:TravelSummary,preference:TravelPreference){
 switch(preference){
  case'dry':return-summary.precipitationTotal-summary.wetDaysExpected*4+summary.sunshinePerDay*.6;
  case'warm':return summary.avgMax*4+summary.sunshinePerDay-summary.wetDaysExpected;
  case'cold':return-summary.avgMax*4+(summary.snowDepthMean??0)*1.5+summary.snowfallTotal;
  case'sunny':return summary.sunshinePerDay*10-summary.cloudMean*.12-summary.wetDaysExpected*1.5;
  case'snow':return(summary.snowDepthMean??0)*4+(summary.snowCoverDaysExpected??0)*2+summary.snowfallTotal*1.5-summary.avgMax;
  case'calm':return-summary.windMaxMean*3-summary.wetDaysExpected+summary.sunshinePerDay*.25;
  default:return-Math.abs(summary.avgMax-24)*2-summary.wetDaysExpected*3+summary.sunshinePerDay*5-summary.windMaxMean*.3;
 }
}

function constraintResult(summary:TravelSummary,constraints:TravelConstraints){
 const unmet:string[]=[];
 if(Number.isFinite(constraints.minAvgMax)&&summary.avgMax<Number(constraints.minAvgMax))unmet.push(`Ø Höchsttemperatur unter ${constraints.minAvgMax} °C`);
 if(Number.isFinite(constraints.maxAvgMax)&&summary.avgMax>Number(constraints.maxAvgMax))unmet.push(`Ø Höchsttemperatur über ${constraints.maxAvgMax} °C`);
 if(Number.isFinite(constraints.maxWetDays)&&summary.wetDaysExpected>Number(constraints.maxWetDays))unmet.push(`mehr als ${constraints.maxWetDays} erwartete Regentage`);
 if(Number.isFinite(constraints.minSunHoursPerDay)&&summary.sunshinePerDay<Number(constraints.minSunHoursPerDay))unmet.push(`weniger als ${constraints.minSunHoursPerDay} Sonnenstunden pro Tag`);
 if(Number.isFinite(constraints.maxWindKmh)&&summary.windMaxMean>Number(constraints.maxWindKmh))unmet.push(`Ø Windmaximum über ${constraints.maxWindKmh} km/h`);
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
 const thermal=summary.avgMax>=30?'sehr warm bis heiß':summary.avgMax>=25?'warm':summary.avgMax>=20?'mild bis warm':summary.avgMax>=15?'mild':summary.avgMax>=10?'kühl':'kalt',wetShare=summary.days?summary.wetDaysExpected/summary.days:0,moisture=wetShare<=.2?'überwiegend trocken':wetShare<=.4?'eher trocken':wetShare<=.6?'wechselhaft':'häufig niederschlagsanfällig',sun=summary.sunshinePerDay>=8?'sehr sonnig':summary.sunshinePerDay>=5?'sonnig':summary.sunshinePerDay>=3?'mit mäßigem Sonnenschein':'eher sonnenarm',wind=summary.windMaxMean>=40?'oft windig':summary.windMaxMean>=25?'zeitweise windig':'meist mäßig windig';
 const parts=[`Klimatologisch ist der Zeitraum ${thermal}, ${moisture} und ${sun}.`,`${wind[0].toUpperCase()}${wind.slice(1)}; erwartet werden im Mittel ${summary.wetDaysExpected.toFixed(1).replace('.',',')} Niederschlagstage.`];
 if(preference==='snow')parts.push(snowDepthIncluded&&Number.isFinite(summary.snowDepthMean)?`Die mittlere modellierte Schneehöhe liegt bei rund ${Math.round(Number(summary.snowDepthMean))} cm.`:`Die Schneebewertung stützt sich ersatzweise auf den historischen Schneefall.`);
 return parts.join(' ');
}
