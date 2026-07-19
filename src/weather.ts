export type WindUnit='kn'|'kmh'|'ms'|'mph';
export type Location={id:number;name:string;latitude:number;longitude:number;elevation?:number;timezone?:string;country?:string;country_code?:string;admin1?:string;postcodes?:string[];autolocated?:boolean};
export type Weather={latitude:number;longitude:number;elevation:number;timezone:string;current:Record<string,number|string>;hourly:Record<string,(number|string|null)[]>;daily:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>};
export type Hour={time:string;temperature:number;apparent:number;humidity:number;dewPoint:number;precipitation:number;rain:number;showers:number;snowfall:number;probability:number;code:number;wind:number;gust:number;direction:number;cloud:number;uvIndex:number;isDay:boolean};
export type Minute15={time:string;precipitation:number;rain:number;showers:number;snowfall:number;probability:number;code:number};
export type Day={date:string;code:number;max:number;min:number;precipitation:number;probability:number;wind:number;gust:number;direction:number;uvMax:number};
export type EnsembleDay={date:string;maxMean:number;maxLow:number;maxHigh:number;minMean:number;minLow:number;minHigh:number;precipitationMean:number;precipitationLow:number;precipitationHigh:number;precipitationProbability:number;modelCount:number;memberCount:number};
export type Station={name:string;provider?:string;stationId?:string;distance?:number;height?:number;timestamp?:string;temperature?:number;humidity?:number;dewPoint?:number;pressure?:number;windSpeed?:number;windDirection?:number;windGust?:number;windUnit?:'kt'|'kmh';cloudCover?:number;precipitation?:number};

type EnsembleModel={id:string;label:string;resolutionKm:number;updateHours:number;maxDays:number;bbox?:[number,number,number,number]};
const ensembleModels:EnsembleModel[]=[
 {id:'icon_seamless',label:'DWD ICON EPS Seamless',resolutionKm:8,updateHours:3,maxDays:7.5,bbox:[-25,30,45,72]},
 {id:'icon_global',label:'DWD ICON EPS Global',resolutionKm:26,updateHours:12,maxDays:7.5},
 {id:'icon_eu',label:'DWD ICON EPS EU',resolutionKm:13,updateHours:6,maxDays:5,bbox:[-25,30,45,72]},
 {id:'icon_d2',label:'DWD ICON EPS D2',resolutionKm:2,updateHours:3,maxDays:2,bbox:[-6,43,26,58]},
 {id:'gfs_seamless',label:'NOAA GFS Ensemble Seamless',resolutionKm:32,updateHours:6,maxDays:35},
 {id:'gfs025',label:'NOAA GFS Ensemble 0.25°',resolutionKm:25,updateHours:6,maxDays:10},
 {id:'gfs05',label:'NOAA GFS Ensemble 0.5°',resolutionKm:50,updateHours:6,maxDays:35},
 {id:'aigefs025',label:'NOAA AIGEFS 0.25°',resolutionKm:25,updateHours:6,maxDays:16},
 {id:'ecmwf_ifs025',label:'ECMWF IFS Ensemble',resolutionKm:25,updateHours:6,maxDays:15},
 {id:'ecmwf_aifs025',label:'ECMWF AIFS Ensemble',resolutionKm:25,updateHours:6,maxDays:15},
 {id:'gem_global',label:'GEM Global Ensemble',resolutionKm:25,updateHours:12,maxDays:16},
 {id:'bom_access_global',label:'BOM ACCESS Global Ensemble',resolutionKm:40,updateHours:6,maxDays:10},
 {id:'ukmo_global',label:'UKMO Global Ensemble',resolutionKm:20,updateHours:6,maxDays:8},
 {id:'ukmo_uk',label:'UKMO UK Ensemble',resolutionKm:2,updateHours:1,maxDays:5,bbox:[-12,48,4,62]},
 {id:'meteoswiss_icon_ch1',label:'MeteoSwiss ICON CH1',resolutionKm:1,updateHours:3,maxDays:1.4,bbox:[3,43,18,50]},
 {id:'meteoswiss_icon_ch2',label:'MeteoSwiss ICON CH2',resolutionKm:2,updateHours:6,maxDays:.5,bbox:[3,43,18,50]},
 {id:'google_weathernext2_ensemble',label:'Google WeatherNext 2',resolutionKm:25,updateHours:12,maxDays:15}
];
const meanModelIds=[
 'dwd_icon_eps_ensemble_mean_seamless','dwd_icon_eps_ensemble_mean_global','dwd_icon_eps_ensemble_mean_eu','dwd_icon_eps_ensemble_mean_d2',
 'gfs_seamless_ensemble_mean','gfs025_ensemble_mean','gfs05_ensemble_mean','ecmwf_ifs025_ensemble_mean','ecmwf_aifs025_ensemble_mean',
 'gem_global_ensemble_mean','bom_access_global_ensemble_mean','ukmo_global_ensemble_mean','ukmo_uk_ensemble_mean','meteoswiss_icon_ch1_ensemble_mean','meteoswiss_icon_ch2_ensemble_mean'
];
function modelApplies(m:EnsembleModel,lat:number,lon:number){if(!m.bbox)return true;const[minLon,minLat,maxLon,maxLat]=m.bbox;return lon>=minLon&&lon<=maxLon&&lat>=minLat&&lat<=maxLat}

async function j<T>(url:string,signal?:AbortSignal):Promise<T>{const r=await fetch(url,{signal,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}
export async function searchLocations(q:string,signal?:AbortSignal){const p=new URLSearchParams({name:q,count:'8',language:'de',format:'json'});return (await j<{results?:Location[]}>(`https://geocoding-api.open-meteo.com/v1/search?${p}`,signal)).results??[]}
export async function reverseLocation(lat:number,lon:number,elevation?:number,signal?:AbortSignal):Promise<Location>{const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),localityLanguage:'de'});try{const d=await j<any>(`https://api.bigdatacloud.net/data/reverse-geocode-client?${p}`,signal);const name=d.locality||d.city||d.principalSubdivision||d.countryName||`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;return{id:Date.now(),name,latitude:lat,longitude:lon,elevation,country:d.countryName,country_code:String(d.countryCode||'').toUpperCase()||undefined,admin1:d.principalSubdivision,postcodes:d.postcode?[String(d.postcode)]:undefined,autolocated:true}}catch{return{id:Date.now(),name:`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,latitude:lat,longitude:lon,elevation,autolocated:true}}}
export async function forecast(lat:number,lon:number,signal?:AbortSignal){const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',forecast_days:'14',forecast_minutely_15:'24',past_minutely_15:'4',models:'best_match',wind_speed_unit:'kn',current:['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','is_day','precipitation','weather_code','cloud_cover','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m'].join(','),minutely_15:['precipitation_probability','precipitation','rain','showers','snowfall','weather_code'].join(','),hourly:['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','precipitation_probability','precipitation','rain','showers','snowfall','weather_code','cloud_cover','wind_speed_10m','wind_direction_10m','wind_gusts_10m','uv_index','is_day'].join(','),daily:['weather_code','temperature_2m_max','temperature_2m_min','sunrise','sunset','precipitation_sum','precipitation_probability_max','wind_speed_10m_max','wind_gusts_10m_max','wind_direction_10m_dominant','uv_index_max'].join(',')});return j<Weather>(`https://api.open-meteo.com/v1/forecast?${p}`,signal)}
export async function airQuality(lat:number,lon:number,signal?:AbortSignal){const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',current:['european_aqi','pm10','pm2_5','nitrogen_dioxide','ozone','uv_index'].join(',')});return j<{current?:Record<string,number|string>}>(`https://air-quality-api.open-meteo.com/v1/air-quality?${p}`,signal)}

function haversine(lat1:number,lon1:number,lat2:number,lon2:number){const r=6371000,toRad=(x:number)=>x*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(a))}
async function brightSkyStation(lat:number,lon:number,elevation?:number,signal?:AbortSignal):Promise<Station|null>{try{const p=new URLSearchParams({lat:String(lat),lon:String(lon),max_dist:'75000'});const d=await j<any>(`https://api.brightsky.dev/current_weather?${p}`,signal);const w=d.weather,sources=(d.sources??[]) as any[];if(!w||!sources.length)return null;const num=(v:any)=>v===null||v===undefined||v===''?undefined:(Number.isFinite(Number(v))?Number(v):undefined);const scored=[...sources].sort((a:any,b:any)=>{const distA=num(a.distance)??999999,distB=num(b.distance)??999999;const hA=Math.abs((num(a.height)??0)-Number(elevation??0)),hB=Math.abs((num(b.height)??0)-Number(elevation??0));return(distA+hA*12)-(distB+hB*12)});const byId=sources.find((x:any)=>x.id===w.source_id),s=byId??scored[0];return{name:s.station_name||'DWD/WMO-Station',provider:'Bright Sky / DWD-WMO',stationId:s.wmo_station_id||s.id,distance:num(s.distance),height:num(s.height),timestamp:w.timestamp,temperature:num(w.temperature),humidity:num(w.relative_humidity),dewPoint:num(w.dew_point),pressure:num(w.pressure_msl),windSpeed:num(w.wind_speed),windDirection:num(w.wind_direction),windGust:num(w.wind_gust_speed),windUnit:'kmh',cloudCover:num(w.cloud_cover),precipitation:num(w.precipitation)}}catch{return null}}
function parseMetarRows(d:any){return(Array.isArray(d)?d:d?.data??d?.metars??d?.features?.map((f:any)=>({...f.properties,lat:f.geometry?.coordinates?.[1],lon:f.geometry?.coordinates?.[0]}))??[]) as any[]}
function metarToStation(rows:any[],lat:number,lon:number,elevation?:number):Station|null{const candidates=rows.map(r=>{const rlat=Number(r.lat??r.latitude),rlon=Number(r.lon??r.longitude);if(!Number.isFinite(rlat)||!Number.isFinite(rlon))return null;const distance=haversine(lat,lon,rlat,rlon),height=Number(r.elev??r.elevation??r.elevation_m);const heightPenalty=Number.isFinite(height)&&Number.isFinite(elevation)?Math.abs(height-Number(elevation))*12:0;const ageMs=Date.now()-new Date(r.reportTime??r.obsTime??r.timestamp??0).getTime();const agePenalty=Number.isFinite(ageMs)&&ageMs>0?Math.min(150000,ageMs/36):0;return{r,distance,score:distance+heightPenalty+agePenalty,height}}).filter(Boolean).sort((a:any,b:any)=>a.score-b.score);const c:any=candidates[0];if(!c)return null;const r=c.r,num=(v:any)=>v===null||v===undefined||v===''?undefined:(Number.isFinite(Number(v))?Number(v):undefined);const temperature=num(r.temp??r.temperature),dewPoint=num(r.dewp??r.dewPoint),rawPressure=num(r.altim??r.pressureMsl??r.pressure),pressure=rawPressure!==undefined&&rawPressure<100?rawPressure*33.8639:rawPressure,humidity=num(r.relativeHumidity??r.humidity)??(temperature!==undefined&&dewPoint!==undefined?Math.min(100,100*Math.exp((17.625*dewPoint)/(243.04+dewPoint)-(17.625*temperature)/(243.04+temperature))):undefined);return{name:r.name||r.site||r.station||r.icaoId||'METAR/WMO-Station',provider:r.provider||'METAR / WMO',stationId:r.icaoId||r.wmoId||r.id,distance:c.distance,height:num(c.height),timestamp:r.reportTime||r.obsTime||r.timestamp,temperature,dewPoint,humidity,pressure,windSpeed:num(r.wspd??r.windSpeed),windDirection:num(r.wdir??r.windDirection),windGust:num(r.wgst??r.windGust),windUnit:'kt',cloudCover:num(r.cloudCover),precipitation:num(r.precipitation)}}
async function metarStation(lat:number,lon:number,elevation?:number,signal?:AbortSignal):Promise<Station|null>{const dLat=1.15,dLon=1.15/Math.max(.25,Math.cos(lat*Math.PI/180)),bbox=[lon-dLon,lat-dLat,lon+dLon,lat+dLat].map(x=>x.toFixed(3)).join(',');const configured=((import.meta as any).env?.VITE_METAR_PROXY_URL as string|undefined)||localStorage.getItem('metarProxyUrl')||'';const urls:string[]=[];if(configured){const u=new URL(configured);u.searchParams.set('lat',String(lat));u.searchParams.set('lon',String(lon));u.searchParams.set('radius_km','140');urls.push(u.toString())}urls.push(`https://aviationweather.gov/api/data/metar?format=json&hours=2&bbox=${encodeURIComponent(bbox)}`);for(const url of urls){try{const d=await j<any>(url,signal),s=metarToStation(parseMetarRows(d),lat,lon,elevation);if(s)return s}catch{}}return null}
export async function station(lat:number,lon:number,country?:string,elevation?:number,signal?:AbortSignal):Promise<Station|null>{const tasks=[metarStation(lat,lon,elevation,signal),brightSkyStation(lat,lon,elevation,signal)];const results=(await Promise.allSettled(tasks)).filter((x):x is PromiseFulfilledResult<Station|null>=>x.status==='fulfilled').map(x=>x.value).filter(Boolean) as Station[];if(!results.length)return null;return results.sort((a,b)=>{const da=a.distance??999999,db=b.distance??999999,ha=Math.abs((a.height??elevation??0)-(elevation??0)),hb=Math.abs((b.height??elevation??0)-(elevation??0));const aa=a.timestamp?Math.max(0,Date.now()-new Date(a.timestamp).getTime()):7200000,ab=b.timestamp?Math.max(0,Date.now()-new Date(b.timestamp).getTime()):7200000;return(da+ha*12+aa/36)-(db+hb*12+ab/36)})[0]}

function n(v:unknown,fallback=NaN){return v===null||v===undefined||v===''?fallback:Number(v)}

export function dayEffectiveUvMax(day:Day,hours:Hour[]){
 const vals=(hours??[]).map(x=>x.uvIndex).filter(v=>Number.isFinite(v));
 return vals.length?Math.max(...vals):(Number.isFinite(day.uvMax)?Number(day.uvMax):0);
}
export function mapHours(w:Weather):Hour[]{return (w.hourly.time as string[]).map((time,i)=>{const code=n(w.hourly.weather_code[i],3),cloud=n(w.hourly.cloud_cover[i],0),precipitation=n(w.hourly.precipitation[i],0),isDay=n(w.hourly.is_day[i],0)===1,uvIndex=n(w.hourly.uv_index[i],NaN);return{time,temperature:n(w.hourly.temperature_2m[i]),apparent:n(w.hourly.apparent_temperature[i]),humidity:n(w.hourly.relative_humidity_2m[i]),dewPoint:n(w.hourly.dew_point_2m[i]),precipitation,rain:n(w.hourly.rain[i],0),showers:n(w.hourly.showers[i],0),snowfall:n(w.hourly.snowfall[i],0),probability:n(w.hourly.precipitation_probability[i],0),code,wind:n(w.hourly.wind_speed_10m[i],0),gust:n(w.hourly.wind_gusts_10m[i],0),direction:n(w.hourly.wind_direction_10m[i],0),cloud,uvIndex:Number.isFinite(uvIndex)&&isDay?Number(uvIndex.toFixed(1)):0,isDay}}).filter(x=>Number.isFinite(x.temperature))}
export function mapMinutely15(w:Weather):Minute15[]{const m=w.minutely_15;if(!m?.time)return[];return (m.time as string[]).map((time,i)=>({time,precipitation:n(m.precipitation?.[i],0),rain:n(m.rain?.[i],0),showers:n(m.showers?.[i],0),snowfall:n(m.snowfall?.[i],0),probability:n(m.precipitation_probability?.[i],0),code:n(m.weather_code?.[i],0)}))}
export function mapDays(w:Weather):Day[]{return (w.daily.time as string[]).map((date,i)=>({date,code:n(w.daily.weather_code[i],3),max:n(w.daily.temperature_2m_max[i]),min:n(w.daily.temperature_2m_min[i]),precipitation:n(w.daily.precipitation_sum[i],0),probability:n(w.daily.precipitation_probability_max[i],0),wind:n(w.daily.wind_speed_10m_max[i],0),gust:n(w.daily.wind_gusts_10m_max[i],0),direction:n(w.daily.wind_direction_10m_dominant[i],0),uvMax:n(w.daily.uv_index_max[i],0)})).filter(d=>Number.isFinite(d.max)&&Number.isFinite(d.min)&&d.max>=d.min)}

export function cloudOktas(percent:number){return Math.max(0,Math.min(8,Math.round((Number.isFinite(percent)?percent:0)/12.5)))}
export function cloudOktasText(percent:number){
 const octas=cloudOktas(percent);
 const description=octas===0?'wolkenlos':octas<=2?'gering bewölkt':octas<=4?'aufgelockert bewölkt':octas<=7?'stark bewölkt':'bedeckt';
 return`${octas}/8 · ${description}`;
}
export type DayWeatherCharacter={code:number;label:string;secondary:string;cloudOktas:number;precipitationDominant:boolean};
function dayPart(hour:number){if(hour<5)return'nachts';if(hour<10)return'morgens';if(hour<13)return'mittags';if(hour<18)return'nachmittags';return'abends'}
function skyFromCloud(percent:number){
 const octas=cloudOktas(percent);
 if(octas<=1)return{code:0,label:'Klar'};
 if(octas<=3)return{code:1,label:'Überwiegend klar'};
 if(octas<=5)return{code:2,label:'Teilweise bewölkt'};
 if(octas<=7)return{code:3,label:'Stark bewölkt'};
 return{code:3,label:'Bedeckt'};
}
function precipCodeFamily(code:number){
 if([51,53,55,56,57].includes(code))return'drizzle';
 if([61,63,65,66,67,68,69].includes(code))return'rain';
 if([71,73,75,77].includes(code))return'snow';
 if([80,81,82,83,84,85,86].includes(code))return'showers';
 if([95,96,97,99].includes(code))return'thunder';
 return'none';
}
function representativePrecipCode(hours:Hour[]){
 type FamilyRow={score:number;hours:number;sum:number;snowSum:number;maxProbability:number;probabilitySum:number;probabilitySamples:number;first:number;last:number;codes:Map<number,number>};
 const families=new Map<string,FamilyRow>();
 for(const h of hours){
  let family=precipCodeFamily(h.code);
  const amount=Math.max(0,h.precipitation||0),snow=Math.max(0,h.snowfall||0),probability=Math.max(0,Math.min(100,h.probability||0));
  if(family==='none')family=h.showers>=.05?'showers':snow>=.05?'snow':h.rain>=.05||amount>=.05?'rain':'none';
  if(family==='none')continue;
  if(probability<20&&amount<.05&&snow<.05)continue;
  const hour=Number(h.time.slice(11,13));
  const dayWeight=h.isDay?1.12:.78;
  const probabilityWeight=.12+probability/100;
  const amountWeight=1+Math.min(2.2,amount*1.4+snow*.18);
  const severity=family==='thunder'?2.4:family==='snow'||family==='showers'?1.25:family==='rain'?1.05:.82;
  const score=dayWeight*probabilityWeight*amountWeight*severity;
  const fallbackCode=family==='showers'?81:family==='snow'?73:family==='rain'?63:53;
  const code=precipCodeFamily(h.code)!=='none'?h.code:fallbackCode;
  const row=families.get(family)??{score:0,hours:0,sum:0,snowSum:0,maxProbability:0,probabilitySum:0,probabilitySamples:0,first:hour,last:hour,codes:new Map<number,number>()};
  row.score+=score;
  if(probability>=30||amount>=.05||snow>=.05)row.hours+=1;
  row.sum+=amount;row.snowSum+=snow;row.maxProbability=Math.max(row.maxProbability,probability);
  row.probabilitySum+=probability;row.probabilitySamples+=1;
  row.first=Math.min(row.first,hour);row.last=Math.max(row.last,hour);
  row.codes.set(code,(row.codes.get(code)??0)+score);
  families.set(family,row);
 }
 const winner=[...families.entries()].sort((a,b)=>b[1].score-a[1].score)[0];
 if(!winner)return null;
 const[family,row]=winner;
 const code=[...row.codes.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]??(family==='showers'?81:family==='snow'?73:family==='rain'?63:53);
 return{family,code,...row,averageProbability:row.probabilitySum/Math.max(1,row.probabilitySamples)};
}
export function dayWeatherCharacter(day:Day,hours:Hour[]):DayWeatherCharacter{
 const relevant=hours.filter(h=>h.time.startsWith(day.date));
 if(!relevant.length)return{code:day.code,label:label(day.code),secondary:'',cloudOktas:0,precipitationDominant:precipCodeFamily(day.code)!=='none'};
 const cloudWeight=relevant.reduce((sum,h)=>sum+(h.isDay?1.18:.72),0);
 const weightedCloud=relevant.reduce((sum,h)=>sum+h.cloud*(h.isDay?1.18:.72),0)/Math.max(.1,cloudWeight);
 const sky=skyFromCloud(weightedCloud),candidate=representativePrecipCode(relevant);
 if(!candidate)return{...sky,secondary:'',cloudOktas:cloudOktas(weightedCloud),precipitationDominant:false};
 const severe=candidate.family==='thunder';
 const sustained=candidate.hours>=3&&candidate.averageProbability>=40;
 const quantitativelyRelevant=candidate.sum>=1||candidate.snowSum>=1;
 const dominant=severe?(candidate.maxProbability>=30||candidate.sum>=.2):sustained||quantitativelyRelevant;
 const period=candidate.first===candidate.last?dayPart(candidate.first):dayPart(candidate.first)===dayPart(candidate.last)?dayPart(candidate.first):`${dayPart(candidate.first)} bis ${dayPart(candidate.last)}`;
 const eventLabel=label(candidate.code);
 if(!dominant){
  const secondary=candidate.maxProbability>=25?`${period} ${eventLabel.toLowerCase()} möglich (${Math.round(candidate.maxProbability)} %)` : '';
  return{...sky,secondary,cloudOktas:cloudOktas(weightedCloud),precipitationDominant:false};
 }
 const prefix=candidate.hours<6&&!severe?'Zeitweise ':'';
 const secondary=`${period} · max. ${Math.round(candidate.maxProbability)} %`;
 return{code:candidate.code,label:`${prefix}${eventLabel}`,secondary,cloudOktas:cloudOktas(weightedCloud),precipitationDominant:true};
}
export function currentIndex(h:Hour[]){const now=Date.now();return h.reduce((b,x,i)=>{const d=Math.abs(new Date(x.time).getTime()-now);return d<b.d?{i,d}:b},{i:0,d:Infinity}).i}

function quantile(values:number[],p:number){const a=[...values].filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return NaN;const idx=(a.length-1)*p,lo=Math.floor(idx),hi=Math.ceil(idx),w=idx-lo;return hi===lo?a[lo]:a[lo]*(1-w)+a[hi]*w}
function weightedQuantile(values:{value:number;weight:number}[],p:number){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0).sort((x,y)=>x.value-y.value);const total=a.reduce((s,x)=>s+x.weight,0);if(!a.length||total<=0)return NaN;const target=total*p;let c=0;for(const x of a){c+=x.weight;if(c>=target)return x.value}return a[a.length-1].value}
function weightedMean(values:{value:number;weight:number}[]){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0),w=a.reduce((s,x)=>s+x.weight,0);return w?a.reduce((s,x)=>s+x.value*x.weight,0)/w:NaN}
function weightedProbability(values:{value:number;weight:number}[],threshold=.1){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0),w=a.reduce((s,x)=>s+x.weight,0);return w?100*a.filter(x=>x.value>=threshold).reduce((s,x)=>s+x.weight,0)/w:0}
function robustWeighted(values:{value:number;weight:number}[],absolute:number){if(values.length<5)return values;const med=weightedQuantile(values,.5),q1=weightedQuantile(values,.25),q3=weightedQuantile(values,.75),iqr=Math.max(.5,q3-q1),limit=Math.max(absolute,1.8*iqr);const filtered=values.filter(x=>Math.abs(x.value-med)<=limit);return filtered.length>=Math.max(4,Math.ceil(values.length*.55))?filtered:values}
type MemberDay={date:string;max:number;min:number;precipitation:number};
type ModelResult={model:EnsembleModel;members:Map<string,MemberDay[]>};
function parseModelMembers(w:Weather,model:EnsembleModel):ModelResult|null{const times=(w.hourly.time as string[])??[],keys=Object.keys(w.hourly),tempKeys=keys.filter(k=>/^temperature_2m(?:_member\d+)?$/.test(k)),precipKeys=keys.filter(k=>/^precipitation(?:_member\d+)?$/.test(k));if(!times.length||!tempKeys.length)return null;const suffix=(k:string)=>k.replace('temperature_2m',''),pBySuffix=new Map(precipKeys.map(k=>[k.replace('precipitation',''),k]));const members=new Map<string,MemberDay[]>();for(const tk of tempKeys){const s=suffix(tk),pk=pBySuffix.get(s),temps=w.hourly[tk]??[],rain=pk?w.hourly[pk]??[]:[];const daily=new Map<string,{t:number[];p:number[]}>();for(let i=0;i<times.length;i++){const date=String(times[i]).slice(0,10),tv=n(temps[i]),pv=n(rain[i]);if(!daily.has(date))daily.set(date,{t:[],p:[]});const d=daily.get(date)!;if(Number.isFinite(tv)&&tv>-65&&tv<65)d.t.push(tv);if(Number.isFinite(pv)&&pv>=0&&pv<150)d.p.push(pv)}const rows:MemberDay[]=[];daily.forEach((d,date)=>{if(d.t.length>=18){const max=Math.max(...d.t),min=Math.min(...d.t),precipitation=d.p.reduce((a,b)=>a+b,0);if(Number.isFinite(max)&&Number.isFinite(min)&&max>=min&&max-min<35)rows.push({date,max,min,precipitation})}});if(rows.length>=2)members.set(s||'_control',rows)}return members.size?{model,members}:null}
function modelDayWeight(model:EnsembleModel,lead:number,memberCount:number){if(lead+1>model.maxDays+.5)return 0;const resolution=Math.min(1.65,Math.max(.65,Math.sqrt(25/model.resolutionKm))),update=Math.min(1.25,Math.max(.82,Math.sqrt(6/model.updateHours))),regional=model.bbox?1.12:1,horizon=lead+1<=model.maxDays*.65?1:0.9;return resolution*update*regional*horizon/Math.max(1,memberCount)}
function aggregateMembers(results:ModelResult[]){const allDates=[...new Set(results.flatMap(r=>[...r.members.values()].flatMap(m=>m.map(x=>x.date))))].sort().slice(0,14),days:EnsembleDay[]=[];for(let lead=0;lead<allDates.length;lead++){const date=allDates[lead];let maxVals:{value:number;weight:number}[]=[],minVals:{value:number;weight:number}[]=[],rainVals:{value:number;weight:number}[]=[];const modelsUsed=new Set<string>();let memberCount=0;for(const r of results){const memberRows=[...r.members.values()].map(rows=>rows.find(x=>x.date===date)).filter(Boolean) as MemberDay[];if(!memberRows.length)continue;const medMax=quantile(memberRows.map(x=>x.max),.5),medMin=quantile(memberRows.map(x=>x.min),.5),filtered=memberRows.filter(x=>Math.abs(x.max-medMax)<=8&&Math.abs(x.min-medMin)<=8);const rows=filtered.length>=Math.max(3,Math.ceil(memberRows.length*.55))?filtered:memberRows;const weight=modelDayWeight(r.model,lead,rows.length);if(!rows.length||weight<=0)continue;modelsUsed.add(r.model.id);memberCount+=rows.length;for(const row of rows){maxVals.push({value:row.max,weight});minVals.push({value:row.min,weight});rainVals.push({value:row.precipitation,weight})}}maxVals=robustWeighted(maxVals,9);minVals=robustWeighted(minVals,9);rainVals=robustWeighted(rainVals,25);if(modelsUsed.size<2||memberCount<10||maxVals.length<6||minVals.length<6)continue;const maxLow=weightedQuantile(maxVals,.1),maxHigh=weightedQuantile(maxVals,.9),minLow=weightedQuantile(minVals,.1),minHigh=weightedQuantile(minVals,.9),precipitationLow=weightedQuantile(rainVals,.1),precipitationHigh=weightedQuantile(rainVals,.9);if(![maxLow,maxHigh,minLow,minHigh].every(Number.isFinite)||maxHigh<maxLow||minHigh<minLow)continue;days.push({date,maxMean:weightedMean(maxVals),maxLow,maxHigh,minMean:weightedMean(minVals),minLow,minHigh,precipitationMean:weightedMean(rainVals),precipitationLow:Number.isFinite(precipitationLow)?precipitationLow:0,precipitationHigh:Number.isFinite(precipitationHigh)?precipitationHigh:0,precipitationProbability:weightedProbability(rainVals,.1),modelCount:modelsUsed.size,memberCount})}return days}
function dailyMeanSeries(w:Weather){const out=new Map<string,MemberDay>(),times=(w.hourly.time as string[])??[],temps=w.hourly.temperature_2m??[],rain=w.hourly.precipitation??[],daily=new Map<string,{t:number[];p:number[]}>();for(let i=0;i<times.length;i++){const date=String(times[i]).slice(0,10),tv=n(temps[i]),pv=n(rain[i]);if(!daily.has(date))daily.set(date,{t:[],p:[]});const d=daily.get(date)!;if(Number.isFinite(tv)&&tv>-65&&tv<65)d.t.push(tv);if(Number.isFinite(pv)&&pv>=0&&pv<150)d.p.push(pv)}daily.forEach((d,date)=>{if(d.t.length>=18)out.set(date,{date,max:Math.max(...d.t),min:Math.min(...d.t),precipitation:d.p.reduce((a,b)=>a+b,0)})});return out}
async function meanFallback(lat:number,lon:number,signal?:AbortSignal){
 const settled=await Promise.allSettled(meanModelIds.map(async id=>{
  const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',forecast_days:'14',models:id,hourly:'temperature_2m,precipitation'});
  const w=await j<Weather>(`https://ensemble-api.open-meteo.com/v1/ensemble?${p}`,signal);
  return{id,series:dailyMeanSeries(w)};
 }));
 const ok=settled.filter(x=>x.status==='fulfilled').map(x=>(x as PromiseFulfilledResult<{id:string;series:Map<string,MemberDay>}>).value).filter(x=>x.series.size>=7);
 const dates=[...new Set(ok.flatMap(x=>[...x.series.keys()]))].sort().slice(0,14),days:EnsembleDay[]=[];
 for(const date of dates){
  const rows=ok.map(x=>x.series.get(date)).filter(Boolean) as MemberDay[];
  if(rows.length<2)continue;
  const max=rows.map(x=>x.max),min=rows.map(x=>x.min),rain=rows.map(x=>x.precipitation);
  days.push({date,maxMean:quantile(max,.5),maxLow:quantile(max,.1),maxHigh:quantile(max,.9),minMean:quantile(min,.5),minLow:quantile(min,.1),minHigh:quantile(min,.9),precipitationMean:quantile(rain,.5),precipitationLow:quantile(rain,.1),precipitationHigh:quantile(rain,.9),precipitationProbability:rain.length?100*rain.filter(v=>v>=.1).length/rain.length:0,modelCount:rows.length,memberCount:0});
 }
 return{days,models:ok.map(x=>x.id.replaceAll('_ensemble_mean','').replaceAll('_',' '))};
}
export async function ensembles(lat:number,lon:number,signal?:AbortSignal){
 const selected=ensembleModels.filter(m=>modelApplies(m,lat,lon));
 const settled=await Promise.allSettled(selected.map(async model=>{
  const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',forecast_days:'15',models:model.id,hourly:'temperature_2m,precipitation'});
  const w=await j<Weather>(`https://ensemble-api.open-meteo.com/v1/ensemble?${p}`,signal);
  return parseModelMembers(w,model);
 }));
 const results=settled.filter(x=>x.status==='fulfilled').map(x=>(x as PromiseFulfilledResult<ModelResult|null>).value).filter(Boolean) as ModelResult[];
 const days=aggregateMembers(results);
 if(days.length>=7)return{days:days.slice(0,14),models:results.map(x=>x.model.label)};
 const fallback=await meanFallback(lat,lon,signal);
 return fallback.days.length?fallback:{days,models:results.map(x=>x.model.label)};
}

export function label(c:number){const m:Record<number,string>={0:'Klar',1:'Überwiegend klar',2:'Teilweise bewölkt',3:'Bedeckt',45:'Nebel',48:'Reifnebel',51:'Leichter Sprühregen',53:'Sprühregen',55:'Starker Sprühregen',56:'Leichter gefrierender Sprühregen',57:'Starker gefrierender Sprühregen',61:'Leichter Regen',63:'Regen',65:'Starker Regen',66:'Leichter gefrierender Regen',67:'Starker gefrierender Regen',68:'Leichter Schneeregen',69:'Schneeregen',71:'Leichter Schneefall',73:'Schneefall',75:'Starker Schneefall',77:'Schneegriesel',80:'Leichte Regenschauer',81:'Regenschauer',82:'Starke Regenschauer',83:'Leichte Schneeregenschauer',84:'Schneeregenschauer',85:'Leichte Schneeschauer',86:'Starke Schneeschauer',95:'Gewitter',96:'Gewitter mit Hagel',97:'Starkes Gewitter',99:'Starkes Gewitter mit Hagel'};return m[c]??'Wechselhaft'}
export function icon(c:number,day=true){if(c===0)return day?'☀️':'🌙';if(c===1)return day?'🌤️':'🌙';if(c===2)return'⛅';if(c===3)return'☁️';if([45,48].includes(c))return'🌫️';if([51,53,55,56,57,80].includes(c))return'🌦️';if([61,63,65,66,67,81,82].includes(c))return'🌧️';if([68,69,71,73,75,77,83,84,85,86].includes(c))return'🌨️';if([95,96,97,99].includes(c))return'⛈️';return'🌤️'}
export function wind(v:number,u:WindUnit){if(u==='kmh')return`${Math.round(v*1.852)} km/h`;if(u==='ms')return`${(v*.514444).toFixed(1)} m/s`;if(u==='mph')return`${Math.round(v*1.15078)} mph`;return`${Math.round(v)} kt`}

export type HazardLevel='yellow'|'orange'|'red'|'purple';
export type HazardItem={level:HazardLevel;title:string;text:string;metric?:string};

function classifyHazard(value:number,thresholds:{yellow:number;orange?:number;red?:number;purple?:number},higher=true):HazardLevel|null{
 if(!Number.isFinite(value))return null;
 if(higher){
  if(thresholds.purple!==undefined&&value>=thresholds.purple)return'purple';
  if(thresholds.red!==undefined&&value>=thresholds.red)return'red';
  if(thresholds.orange!==undefined&&value>=thresholds.orange)return'orange';
  if(value>=thresholds.yellow)return'yellow';
  return null;
 }
 if(thresholds.purple!==undefined&&value<=thresholds.purple)return'purple';
 if(thresholds.red!==undefined&&value<=thresholds.red)return'red';
 if(thresholds.orange!==undefined&&value<=thresholds.orange)return'orange';
 if(value<=thresholds.yellow)return'yellow';
 return null;
}
function addHazard(items:HazardItem[],item:HazardItem|null){if(item)items.push(item)}
const levelOrder:{[k in HazardLevel]:number}={purple:4,red:3,orange:2,yellow:1};
const KMH_PER_KT=1.852;

function classifyWindGust(gustKt:number):HazardLevel|null{
 const kmh=gustKt*KMH_PER_KT;
 if(kmh>=103)return'purple';
 if(kmh>=89)return'red';
 if(kmh>=75)return'orange';
 if(kmh>=50)return'yellow';
 return null;
}
function classifyRain24(sumMm:number):HazardLevel|null{
 if(sumMm>=60)return'purple';
 if(sumMm>=40)return'red';
 if(sumMm>=25)return'orange';
 if(sumMm>=15)return'yellow';
 return null;
}
function classifySnow24(sumCm:number):HazardLevel|null{
 if(sumCm>=20)return'purple';
 if(sumCm>=10)return'red';
 if(sumCm>=5)return'orange';
 if(sumCm>=1)return'yellow';
 return null;
}
function classifyHeatStress(apparentC:number):HazardLevel|null{
 if(apparentC>=46)return'purple';
 if(apparentC>=41)return'red';
 if(apparentC>=38)return'orange';
 if(apparentC>=32)return'yellow';
 return null;
}
function classifyUvIndex(uv:number):HazardLevel|null{
 if(uv>=11)return'red';
 if(uv>=8)return'orange';
 if(uv>=6)return'yellow';
 return null;
}
function classifyThunder(codes:number[]):HazardLevel|null{
 if(codes.includes(99))return'red';
 if(codes.includes(96))return'orange';
 if(codes.includes(95))return'yellow';
 return null;
}

export function hazards(h:Hour[],currentUv?:number){
 const s=h.slice(currentIndex(h),currentIndex(h)+24);if(!s.length)return[] as HazardItem[];
 const max=Math.max(...s.map(x=>x.temperature)),felt=Math.max(...s.map(x=>x.apparent).filter(Number.isFinite)),heat=Math.max(max,felt),min=Math.min(...s.map(x=>x.temperature)),gust=Math.max(...s.map(x=>x.gust)),rain=s.reduce((a,b)=>a+Math.max(0,b.precipitation||0),0),snow=s.reduce((a,b)=>a+Math.max(0,b.snowfall||0),0),uv=Math.max(...s.map(x=>x.uvIndex||0),Number.isFinite(currentUv as number)?Number(currentUv):0),thunderCodes=s.map(x=>x.code);
 const a:HazardItem[]=[];
 const heatLevel=classifyHeatStress(heat);
 addHazard(a,heatLevel?{level:heatLevel,title:'Hitzebelastung',metric:`${Math.round(heat)} °C`,text:`Gefühlte Temperatur bis ${Math.round(heat)} °C, Lufttemperatur bis ${Math.round(max)} °C (Schwellen nach DWD/NWS-Hitzelogik).`}:null);
 const coldLevel=classifyHazard(min,{yellow:0,orange:-10,red:-20,purple:-30},false);
 addHazard(a,coldLevel?{level:coldLevel,title:'Frost / Glätte',metric:`${Math.round(min)} °C`,text:`Tiefstwerte um ${Math.round(min)} °C.`}:null);
 const gustLevel=classifyWindGust(gust);
 addHazard(a,gustLevel?{level:gustLevel,title:'Wind / Böen',metric:`${Math.round(gust)} kt`,text:`Maximale Böen bis ${Math.round(gust)} kt (${Math.round(gust*KMH_PER_KT)} km/h; DWD/Meteoalarm-Stufen).`}:null);
 const rainLevel=classifyRain24(rain);
 addHazard(a,rainLevel?{level:rainLevel,title:'Starkregen',metric:`${Math.round(rain)} mm`,text:`24-Stunden-Summe um ${Math.round(rain)} mm (DWD-/Meteoalarm-Schwellen).`}:null);
 const snowLevel=classifySnow24(snow);
 addHazard(a,snowLevel?{level:snowLevel,title:'Schnee',metric:`${Math.round(snow)} cm`,text:`24-Stunden-Neuschnee um ${Math.round(snow)} cm.`}:null);
 const uvLevel=classifyUvIndex(uv);
 addHazard(a,uvLevel?{level:uvLevel,title:'UV-Belastung',metric:`UV ${Math.round(uv)}`,text:`Maximaler UV-Index um ${Math.round(uv)} (WHO/DWD/NWS-Kategorien).`}:null);
 const thunderLevel=classifyThunder(thunderCodes);
 addHazard(a,thunderLevel?{level:thunderLevel,title:'Gewitter',metric:thunderLevel==='red'?'stark':thunderLevel==='orange'?'mit Hagel':'möglich',text:thunderLevel==='red'?'Signale für starke Gewitter in der Kurzfristvorhersage.':thunderLevel==='orange'?'Signale für Gewitter mit Hagel in der Kurzfristvorhersage.':'Gewittersignale in der Kurzfristvorhersage.'}:null);
 return a.sort((x,y)=>levelOrder[y.level]-levelOrder[x.level]);
}
