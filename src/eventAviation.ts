import {fetchWorkerJson,workerBaseCandidates} from './workerClient'
import {MID_VERSION as VERSION} from './version'
import {guardedOpenMeteoFetch} from './openMeteoGuard'

const LEVELS=[1000,925,850,700,500,300] as const
const HOURLY=[
 'visibility','wind_speed_10m','wind_gusts_10m','weather_code','cape','lifted_index','convective_inhibition','freezing_level_height','cloud_cover_low',
 ...LEVELS.flatMap(level=>[`temperature_${level}hPa`,`relative_humidity_${level}hPa`,`cloud_cover_${level}hPa`,`wind_speed_${level}hPa`,`wind_direction_${level}hPa`,`geopotential_height_${level}hPa`])
]

type HourlyRecord={time:(number|string)[];[key:string]:(number|string|null)[]}
type Raw={hourly?:HourlyRecord;timezone?:string;utc_offset_seconds?:number}
type Response={data:Raw;requestedModel?:string;modelLabel?:string;version?:string;error?:string}
export type EventFlightHazardLevel='none'|'watch'|'caution'
export type EventFlightHazardId='thunderstorm'|'icing'|'turbulence'|'cat'|'ceiling'|'visibility'|'wind'|'mountain-wave'|'freezing-rain'|'volcanic-ash'|'tropical-cyclone'|'dust-sand'|'radiological'|'llws'
export type EventFlightHazardItem={id:EventFlightHazardId;label:string;level:EventFlightHazardLevel;detail:string;source?:string;value?:number;unit?:'kt'|'m'|'ft'}
export type EventFlightSourceStatus={id:string;label:string;status:'used'|'available'|'unavailable'|'not-configured';detail?:string}
export type EventFlightHazardSummary={available:boolean;overall:EventFlightHazardLevel;items:EventFlightHazardItem[];freezingLevelMin:number|null;ceilingMinFt:number|null;visibilityMinM?:number|null;gustMaxKt?:number|null;source:string;sources?:EventFlightSourceStatus[];officialSignalCount?:number;note?:string}

type OfficialSignal={kind:EventFlightHazardId;label:string;level:Exclude<EventFlightHazardLevel,'none'>;detail:string;source:string;issuer?:string;validFrom?:string;validTo?:string;distanceKm?:number;value?:number;unit?:'kt'|'m'|'ft'}
type OfficialResponse={signals?:OfficialSignal[];sources?:EventFlightSourceStatus[];error?:string}
type ProfilePoint={pressure:number;height:number|null;temperature:number|null;humidity:number|null;cloud:number|null;windSpeed:number|null;windDirection:number|null}

const cache=new Map<string,{at:number;value:Response}>()
const officialCache=new Map<string,{at:number;value:OfficialResponse}>()
const TTL=15*60*1000
const OFFICIAL_TTL=10*60*1000
function finite(value:unknown):number|null{if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)?n:null}
function epoch(value:number|string){if(typeof value==='number')return Math.abs(value)<1e12?value*1000:value;const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:Number.NaN}
function valueAt(hourly:HourlyRecord,key:string,index:number){return finite(hourly[key]?.[index])}
function endpoint(lat:number,lon:number,elevation:number){const url=new URL('https://api.open-meteo.com/v1/forecast');url.searchParams.set('latitude',String(lat));url.searchParams.set('longitude',String(lon));url.searchParams.set('elevation',String(Math.round(elevation)));url.searchParams.set('hourly',HOURLY.join(','));url.searchParams.set('forecast_hours','168');url.searchParams.set('models','best_match');url.searchParams.set('timezone','GMT');url.searchParams.set('timeformat','unixtime');url.searchParams.set('wind_speed_unit','kn');url.searchParams.set('cell_selection','nearest');return url}
async function load(lat:number,lon:number,elevation:number,signal?:AbortSignal):Promise<Response>{
 const key=`${lat.toFixed(3)}:${lon.toFixed(3)}:${Math.round(elevation)}`,cached=cache.get(key)
 if(cached&&Date.now()-cached.at<=TTL)return cached.value
 if(workerBaseCandidates('meteogram').length){try{const value=await fetchWorkerJson<Response>('meteogram',{lat,lon,elevation:Math.round(elevation),model:'best_match'},{purpose:'meteogram',signal,timeoutMs:16000,maxAgeMs:TTL,staleIfErrorMs:3*60*60*1000,cacheKey:`event-flight:v2:${key}`});cache.set(key,{at:Date.now(),value});return value}catch(error){if(signal?.aborted)throw error}}
 const response=await guardedOpenMeteoFetch(endpoint(lat,lon,elevation).toString(),{signal},{priority:'background',maxRetries:0}),raw=await response.json().catch(()=>({}));if(!response.ok)throw new Error(raw?.error||raw?.reason||`Flugprofil HTTP ${response.status}`);const value:Response=raw?.data?raw:{data:raw,requestedModel:'best_match',modelLabel:'Best Match',version:VERSION};cache.set(key,{at:Date.now(),value});return value
}
async function loadOfficial(lat:number,lon:number,startEpoch:number,endEpoch:number,signal?:AbortSignal):Promise<OfficialResponse>{
 if(!workerBaseCandidates('meteogram').length)return{signals:[],sources:[{id:'official',label:'Amtliche Flugwetterquellen',status:'not-configured',detail:'Datenquelle derzeit nicht verfügbar'}]}
 const key=`${lat.toFixed(2)}:${lon.toFixed(2)}:${Math.round(startEpoch/3600000)}:${Math.round(endEpoch/3600000)}`,cached=officialCache.get(key)
 if(cached&&Date.now()-cached.at<=OFFICIAL_TTL)return cached.value
 try{const value=await fetchWorkerJson<OfficialResponse>('aviation-hazards',{lat,lon,start:new Date(startEpoch).toISOString(),end:new Date(endEpoch).toISOString()},{purpose:'meteogram',signal,timeoutMs:18000,maxAgeMs:OFFICIAL_TTL,staleIfErrorMs:60*60*1000,cacheKey:`event-aviation-official:${key}`});officialCache.set(key,{at:Date.now(),value});return value}catch(error){if(signal?.aborted)throw error;return{signals:[],sources:[{id:'official',label:'Amtliche Flugwetterquellen',status:'unavailable',detail:error instanceof Error?error.message:'nicht erreichbar'}]}}
}
function levelRank(level:EventFlightHazardLevel){return level==='caution'?2:level==='watch'?1:0}
function stronger(a:EventFlightHazardLevel,b:EventFlightHazardLevel){return levelRank(b)>levelRank(a)?b:a}
function overall(items:EventFlightHazardItem[]){return items.reduce<EventFlightHazardLevel>((best,item)=>stronger(best,item.level),'none')}
export function coherentEventFlightCeiling(ceilingFt:number|null|undefined,visibilityM:number|null|undefined){const ceiling=finite(ceilingFt),visibility=finite(visibilityM);if(ceiling===null)return null;if(visibility!==null&&ceiling<100&&visibility>=5000)return null;if(visibility!==null&&ceiling<300&&visibility>=10000)return null;return ceiling}
export function normalizeEventFlightHazardSummary(summary:EventFlightHazardSummary|null|undefined):EventFlightHazardSummary|null|undefined{
 if(!summary)return summary;
 const ceiling=coherentEventFlightCeiling(summary.ceilingMinFt,summary.visibilityMinM),suppressed=summary.ceilingMinFt!==null&&summary.ceilingMinFt!==undefined&&ceiling===null;
 const items=suppressed?summary.items.map(item=>item.id==='ceiling'?{...item,level:'none' as const,detail:'nicht belastbar',value:undefined,source:undefined}:item):summary.items;
 return{...summary,ceilingMinFt:ceiling,items,overall:overall(items)};
}
function maxNumber(values:(number|null)[]){const nums=values.filter((value):value is number=>value!==null&&Number.isFinite(value));return nums.length?Math.max(...nums):null}
function minNumber(values:(number|null)[]){const nums=values.filter((value):value is number=>value!==null&&Number.isFinite(value));return nums.length?Math.min(...nums):null}
function profile(hourly:HourlyRecord,index:number):ProfilePoint[]{return LEVELS.map(pressure=>({pressure,height:valueAt(hourly,`geopotential_height_${pressure}hPa`,index),temperature:valueAt(hourly,`temperature_${pressure}hPa`,index),humidity:valueAt(hourly,`relative_humidity_${pressure}hPa`,index),cloud:valueAt(hourly,`cloud_cover_${pressure}hPa`,index),windSpeed:valueAt(hourly,`wind_speed_${pressure}hPa`,index),windDirection:valueAt(hourly,`wind_direction_${pressure}hPa`,index)})).filter(point=>point.height!==null)}
function uv(speed:number,direction:number){const rad=direction*Math.PI/180;return[-speed*.514444*Math.sin(rad),-speed*.514444*Math.cos(rad)] as const}
function turbulenceAt(points:ProfilePoint[],index:number){if(index<=0||index>=points.length-1)return{turbulence:0,cat:0};const lower=points[index-1],row=points[index],upper=points[index+1];if([lower.height,upper.height,lower.windSpeed,upper.windSpeed,lower.windDirection,upper.windDirection,lower.temperature,upper.temperature,row.temperature].some(value=>value===null))return{turbulence:0,cat:0};const dz=Math.max(100,Math.abs(upper.height!-lower.height!)),[u1,v1]=uv(lower.windSpeed!,lower.windDirection!),[u2,v2]=uv(upper.windSpeed!,upper.windDirection!),shear=Math.hypot(u2-u1,v2-v1)/dz,theta1=(lower.temperature!+273.15)*Math.pow(1000/lower.pressure,.286),theta2=(upper.temperature!+273.15)*Math.pow(1000/upper.pressure,.286),theta=row.temperature!+273.15,ri=(9.81/theta)*((theta2-theta1)/dz)/Math.max(1e-7,shear*shear);let risk=0;if(shear>=.02||ri<=0)risk=2;else if(shear>=.011||ri<.25)risk=1;const cat=risk>0&&row.pressure<=700&&(row.humidity??100)<70?risk:0;return{turbulence:cat?0:risk,cat}}
function icingAt(point:ProfilePoint){const t=point.temperature,rh=point.humidity,cloud=point.cloud;if(t===null||rh===null)return 0;if(t>1||t< -20||rh<80||(cloud!==null&&cloud<45))return 0;if(t<=0&&t>=-15&&rh>=90&&(cloud===null||cloud>=70))return 2;return 1}
function ceilingFor(points:ProfilePoint[],elevation:number){const layer=points.filter(point=>point.height!==null&&point.height!>=elevation&&((point.humidity??0)>=88||(point.cloud??0)>=72)).sort((a,b)=>a.height!-b.height!)[0];if(!layer?.height)return null;return Math.max(0,(layer.height-elevation)*3.28084)}
function weatherCodeSuggestsLowCeiling(code:number|null){return code!==null&&[45,48,51,53,55,56,57,61,63,65,66,67,80,81,82].includes(Math.round(code))}
function isDiagnosedCeilingPlausible(value:number|null,lowCloud:number|null,visibility:number|null,weatherCode:number|null){
 if(value===null||!Number.isFinite(value))return false;
 if(value>=3000)return true;
 const strongLowCloud=lowCloud!==null&&lowCloud>=75,moderateLowCloud=lowCloud!==null&&lowCloud>=55,reducedVisibility=visibility!==null&&visibility<8000,poorVisibility=visibility!==null&&visibility<5000,weatherSignal=weatherCodeSuggestsLowCeiling(weatherCode);
 if(value<100)return strongLowCloud&&poorVisibility;
 if(value<300)return strongLowCloud&&(poorVisibility||weatherSignal);
 if(value<1000)return strongLowCloud||reducedVisibility||weatherSignal;
 return moderateLowCloud||reducedVisibility||weatherSignal;
}
function hazardLevel(maxRisk:number):EventFlightHazardLevel{return maxRisk>=2?'caution':maxRisk>=1?'watch':'none'}
function detailLevel(level:EventFlightHazardLevel,none:string,watch:string,caution:string){return level==='caution'?caution:level==='watch'?watch:none}
function aviationVisibility(value:number|null){if(value===null||!Number.isFinite(value))return'nicht verfügbar';if(value<1000)return`${Math.max(50,Math.round(value/50)*50)} m`;if(value<10000)return`${new Intl.NumberFormat('de-DE',{minimumFractionDigits:value<3000?1:0,maximumFractionDigits:1}).format(value/1000)} km`;return'≥ 10 km'}
function sourceLabels(sources:EventFlightSourceStatus[]){return sources.filter(source=>source.status==='used').map(source=>source.label)}
function mergeOfficial(items:EventFlightHazardItem[],signals:OfficialSignal[]){
 const byId=new Map(items.map(item=>[item.id,item]))
 for(const signal of signals){const current=byId.get(signal.kind);if(current){const level=stronger(current.level,signal.level),officialWins=levelRank(signal.level)>=levelRank(current.level);byId.set(signal.kind,officialWins?{...current,level,detail:signal.detail,source:signal.source,value:signal.value,unit:signal.unit}:{...current,level})}else byId.set(signal.kind,{id:signal.kind,label:signal.label,level:signal.level,detail:signal.detail,source:signal.source,value:signal.value,unit:signal.unit})}
 const baseOrder:EventFlightHazardId[]=['thunderstorm','icing','turbulence','cat','ceiling','visibility','wind'],specialOrder:EventFlightHazardId[]=['llws','mountain-wave','freezing-rain','volcanic-ash','tropical-cyclone','dust-sand','radiological']
 return[...baseOrder,...specialOrder].map(id=>byId.get(id)).filter((item):item is EventFlightHazardItem=>Boolean(item)).filter(item=>baseOrder.includes(item.id)||item.level!=='none')
}
function officialOnlySummary(official:OfficialResponse,note:string):EventFlightHazardSummary{
 const signals=official.signals??[],items=mergeOfficial([],signals),sources=official.sources??[],used=sourceLabels(sources)
 return{available:items.length>0,overall:overall(items),items,freezingLevelMin:null,ceilingMinFt:null,visibilityMinM:null,gustMaxKt:null,source:used.slice(0,4).join(' · ')||'Amtliche Flugwetterquellen',sources,officialSignalCount:signals.length,note:items.length?`${note} Amtliche Hazardprodukte bleiben verfügbar.`:note}
}

export async function loadEventFlightHazards(lat:number,lon:number,elevation:number,startEpoch:number,endEpoch:number,signal?:AbortSignal):Promise<EventFlightHazardSummary>{
 try{
  const [response,official]=await Promise.all([load(lat,lon,elevation,signal),loadOfficial(lat,lon,startEpoch,endEpoch,signal)]),hourly=response.data?.hourly
  if(!hourly?.time?.length)return officialOnlySummary(official,'Keine Druckniveau-Daten verfügbar.')
  const indices=hourly.time.map((value,index)=>({index,time:epoch(value)})).filter(row=>Number.isFinite(row.time)&&row.time>=startEpoch-30*60*1000&&row.time<=endEpoch+30*60*1000).map(row=>row.index)
  if(!indices.length)return officialOnlySummary(official,'Für das Event-Zeitfenster liegen noch keine Druckniveau-Daten vor.')
  let icing=0,turbulence=0,cat=0
  const ceilings:number[]=[],freezing:number[]=[],visibility:number[]=[],gusts:number[]=[],capes:number[]=[],codes:number[]=[],lifted:number[]=[],cin:number[]=[]
  for(const index of indices){const points=profile(hourly,index);for(let row=0;row<points.length;row++){icing=Math.max(icing,icingAt(points[row]));const risk=turbulenceAt(points,row);turbulence=Math.max(turbulence,risk.turbulence);cat=Math.max(cat,risk.cat)}const vis=valueAt(hourly,'visibility',index),code=valueAt(hourly,'weather_code',index),lowCloud=valueAt(hourly,'cloud_cover_low',index),ceiling=ceilingFor(points,elevation);if(isDiagnosedCeilingPlausible(ceiling,lowCloud,vis,code))ceilings.push(Number(ceiling));const fz=valueAt(hourly,'freezing_level_height',index);if(fz!==null)freezing.push(fz);if(vis!==null)visibility.push(vis);const gust=valueAt(hourly,'wind_gusts_10m',index);if(gust!==null)gusts.push(gust);const cape=valueAt(hourly,'cape',index);if(cape!==null)capes.push(cape);if(code!==null)codes.push(code);const li=valueAt(hourly,'lifted_index',index);if(li!==null)lifted.push(li);const inhibition=valueAt(hourly,'convective_inhibition',index);if(inhibition!==null)cin.push(inhibition)}
  const ceilingMinFt=minNumber(ceilings),visibilityMin=minNumber(visibility),gustMax=maxNumber(gusts),capeMax=maxNumber(capes),liMin=minNumber(lifted),cinMax=maxNumber(cin),thunderStrong=codes.some(code=>[95,96,99].includes(Math.round(code)))||(capeMax??0)>=1400||((capeMax??0)>=800&&(liMin??0)<=-2&&(cinMax??0)<100),thunderWatch=!thunderStrong&&((capeMax??0)>=500||(liMin??0)<=-1)
  const icingLevel=hazardLevel(icing),turbulenceLevel=hazardLevel(turbulence),catLevel=hazardLevel(cat),ceilingLevel:EventFlightHazardLevel=ceilingMinFt!==null&&ceilingMinFt<1000?'caution':ceilingMinFt!==null&&ceilingMinFt<3000?'watch':'none',visibilityLevel:EventFlightHazardLevel=visibilityMin!==null&&visibilityMin<1500?'caution':visibilityMin!==null&&visibilityMin<5000?'watch':'none',windLevel:EventFlightHazardLevel=(gustMax??0)>=35?'caution':(gustMax??0)>=25?'watch':'none',thunderLevel:EventFlightHazardLevel=thunderStrong?'caution':thunderWatch?'watch':'none'
  const diagnosed:EventFlightHazardItem[]=[
   {id:'thunderstorm',label:'Konvektion / Gewitter',level:thunderLevel,detail:detailLevel(thunderLevel,'kein signifikantes Signal','erhöhtes konvektives Signal','markantes Gewitter-/Konvektionssignal')},
   {id:'icing',label:'Vereisung',level:icingLevel,detail:detailLevel(icingLevel,'kein signifikantes Signal','Vereisung diagnostisch möglich','markantes Vereisungssignal')},
   {id:'turbulence',label:'Turbulenz',level:turbulenceLevel,detail:detailLevel(turbulenceLevel,'kein signifikantes Signal','mäßiges Turbulenzsignal','starkes Turbulenzsignal')},
   {id:'cat',label:'CAT',level:catLevel,detail:detailLevel(catLevel,'kein signifikantes Signal','mäßiges CAT-Signal','starkes CAT-Signal')},
   {id:'ceiling',label:'Wolkenuntergrenze',level:ceilingLevel,detail:ceilingMinFt===null?'nicht belastbar':`min. ca. ${Math.round(ceilingMinFt/100)*100} ft AGL`,value:ceilingMinFt??undefined,unit:'ft'},
   {id:'visibility',label:'Sicht',level:visibilityLevel,detail:aviationVisibility(visibilityMin),value:visibilityMin??undefined,unit:'m'},
   {id:'wind',label:'Böen',level:windLevel,detail:gustMax===null?'nicht verfügbar':`bis ${Math.round(gustMax)} kt`,value:gustMax??undefined,unit:'kt'}
  ]
  const officialSignals=official.signals??[],items=mergeOfficial(diagnosed,officialSignals),sources:EventFlightSourceStatus[]=[{id:'model-profile',label:`${response.modelLabel||'Best Match'} / MID-Druckniveau`,status:'used'},...(official.sources??[])],used=sourceLabels(sources),source=[response.modelLabel||'Best Match',...used.filter(label=>!label.startsWith(response.modelLabel||'Best Match'))].filter(Boolean).slice(0,4).join(' · '),resolvedCeilingMinFt=ceilingMinFt,resolvedVisibilityMinM=visibilityMin,resolvedGustMaxKt=gustMax
  return normalizeEventFlightHazardSummary({available:true,overall:overall(items),items,freezingLevelMin:minNumber(freezing),ceilingMinFt:resolvedCeilingMinFt,visibilityMinM:resolvedVisibilityMinM,gustMaxKt:resolvedGustMaxKt,source,sources,officialSignalCount:officialSignals.length})!
 }catch(error){if(signal?.aborted)throw error;const official=await loadOfficial(lat,lon,startEpoch,endEpoch,signal);return officialOnlySummary(official,error instanceof Error?`Druckniveau-Diagnose nicht verfügbar: ${error.message}`:'Druckniveau-Diagnose nicht verfügbar.')}
}
