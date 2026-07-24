import {fetchWorkerJson} from './workerClient';
import {countryCodeFromLocation,type Location} from './weather';

export type MountainSeason='auto'|'summer'|'winter';
export type MountainLevelRole='valley'|'middle'|'summit';
export type MountainProfileSource='manual'|'osm-dem'|'derived';
export type MountainProfileConfidence='high'|'medium'|'low';

export type MountainConfig={
 enabled:boolean;
 season:MountainSeason;
 middleEnabled:boolean;
 valleyElevation:number;
 middleElevation:number;
 summitElevation:number;
 valleyName:string;
 middleName:string;
 summitName:string;
 valleyLatitude?:number;
 valleyLongitude?:number;
 middleLatitude?:number;
 middleLongitude?:number;
 summitLatitude?:number;
 summitLongitude?:number;
 profileSource:MountainProfileSource;
 profileConfidence:MountainProfileConfidence;
 profileUpdatedAt?:string;
};

export type MountainProfileLevel={
 role:MountainLevelRole;
 name:string;
 latitude:number;
 longitude:number;
 elevation:number;
 source?:string;
};

export type MountainProfileResult={
 levels:MountainProfileLevel[];
 source:string;
 confidence:MountainProfileConfidence;
 checkedAt?:string;
 diagnostics?:Record<string,unknown>;
};

export type MountainSnowObservation={
 role:MountainLevelRole;
 depthCm:number;
 stationName:string;
 stationId?:string;
 elevation?:number;
 distanceKm?:number;
 observedAt?:string;
 provider:string;
 license?:string;
};

export type MountainPointWeather={
 latitude:number;
 longitude:number;
 elevation:number;
 timezone:string;
 timezone_abbreviation?:string;
 utc_offset_seconds?:number;
 current:Record<string,number|string|null>;
 hourly:Record<string,(number|string|null)[]>;
};

export type MountainLevelForecast={
 role:MountainLevelRole;
 name:string;
 latitude:number;
 longitude:number;
 elevation:number;
 weather:MountainPointWeather;
 modelSnowDepthCm:number;
 pastSnow24Cm:number;
 newSnow24Cm:number;
 newSnow48Cm:number;
 observation?:MountainSnowObservation;
};

export type MountainSportsForecast={
 levels:MountainLevelForecast[];
 season:Exclude<MountainSeason,'auto'>;
 observationsProvider?:string;
 observationsCoverage?:string;
};

type SnowObservationResponse={
 observations?:MountainSnowObservation[];
 provider?:string;
 coverage?:string;
 error?:string;
};

type MountainCandidate={
 latitude:number;
 longitude:number;
 elevation?:number;
 name:string;
 role?:MountainLevelRole;
 source:string;
 distanceM:number;
 kind:'station'|'lift-end';
 liftId?:string;
};

type GeoSphereStation={
 id:string;
 name:string;
 latitude:number;
 longitude:number;
 elevation?:number;
};

const OVERPASS_ENDPOINTS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
const ELEVATION_ENDPOINT='https://api.open-meteo.com/v1/elevation';
const GEOSPHERE_METADATA='https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min/metadata';
const GEOSPHERE_CURRENT='https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min';
const LIFT_TYPES=new Set(['cable_car','gondola','chair_lift','mixed_lift','drag_lift','t-bar','j-bar','platter','magic_carpet','funicular']);
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const finite=(value:unknown)=>Number.isFinite(Number(value));
const numeric=(value:unknown)=>{if(value===null||value===undefined||value==='')return undefined;const number=Number(value);return Number.isFinite(number)?number:undefined};
const toRad=(value:number)=>value*Math.PI/180;
let geoSphereMetadataPromise:Promise<GeoSphereStation[]>|null=null;

function distanceMeters(lat1:number,lon1:number,lat2:number,lon2:number){
 const radius=6371000,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
 return 2*radius*Math.asin(Math.min(1,Math.sqrt(a)));
}
function safeDate(value:unknown){const date=new Date(value as string|number);return Number.isFinite(date.getTime())?date.toISOString():undefined}
function parseElevation(value:unknown){const match=String(value??'').replace(',','.').match(/-?\d+(?:\.\d+)?/),number=match?Number(match[0]):NaN;return Number.isFinite(number)&&number>=-100&&number<=9000?number:undefined}
function stationRole(value:unknown):MountainLevelRole|undefined{const role=String(value??'').toLowerCase();if(/bottom|lower|valley|tal/.test(role))return'valley';if(/mid|middle|mittel/.test(role))return'middle';if(/top|upper|summit|berg/.test(role))return'summit';return undefined}
async function fetchJson<T>(url:string,signal?:AbortSignal,init:RequestInit={}):Promise<T>{const response=await fetch(url,{...init,signal,cache:'no-store',headers:{Accept:'application/json',...(init.headers??{})}});if(!response.ok)throw new Error(`${new URL(url).hostname} HTTP ${response.status}`);return response.json() as Promise<T>}

export function defaultMountainConfig(loc:Location):MountainConfig{
 const elevation=Math.max(0,Math.round(Number(loc.elevation)||0)),peak=/gipfel|peak|mountain/i.test(`${loc.poiCategory||''} ${loc.poiType||''}`),valley=peak?Math.max(0,elevation-1200):elevation,summit=peak?Math.max(elevation,1):Math.max(elevation+1200,1200);
 return{enabled:false,season:'auto',middleEnabled:false,valleyElevation:valley,middleElevation:Math.round((valley+summit)/2),summitElevation:summit,valleyName:'Talstation',middleName:'Mittelstation',summitName:'Bergstation',valleyLatitude:loc.latitude,valleyLongitude:loc.longitude,middleLatitude:loc.latitude,middleLongitude:loc.longitude,summitLatitude:loc.latitude,summitLongitude:loc.longitude,profileSource:'derived',profileConfidence:'low'};
}

export function normalizeMountainConfig(value:any,loc:Location):MountainConfig{
 const fallback=defaultMountainConfig(loc),season:MountainSeason=['auto','summer','winter'].includes(value?.season)?value.season:'auto',valley=finite(value?.valleyElevation)?clamp(Number(value.valleyElevation),0,6000):fallback.valleyElevation,summit=finite(value?.summitElevation)?clamp(Number(value.summitElevation),valley+1,7000):Math.max(fallback.summitElevation,valley+1),middleFallback=Math.round((valley+summit)/2),middle=finite(value?.middleElevation)?clamp(Number(value.middleElevation),valley+1,summit-1):middleFallback,source:MountainProfileSource=['manual','osm-dem','derived'].includes(value?.profileSource)?value.profileSource:(value?.profileUpdatedAt?'osm-dem':'derived'),confidence:MountainProfileConfidence=['high','medium','low'].includes(value?.profileConfidence)?value.profileConfidence:(source==='manual'?'medium':'low'),coordinate=(key:string,fallbackValue:number)=>finite(value?.[key])?Number(value[key]):fallbackValue;
 return{enabled:Boolean(value?.enabled),season,middleEnabled:Boolean(value?.middleEnabled),valleyElevation:valley,middleElevation:middle,summitElevation:summit,valleyName:String(value?.valleyName||fallback.valleyName).trim().slice(0,80)||fallback.valleyName,middleName:String(value?.middleName||fallback.middleName).trim().slice(0,80)||fallback.middleName,summitName:String(value?.summitName||fallback.summitName).trim().slice(0,80)||fallback.summitName,valleyLatitude:coordinate('valleyLatitude',loc.latitude),valleyLongitude:coordinate('valleyLongitude',loc.longitude),middleLatitude:coordinate('middleLatitude',loc.latitude),middleLongitude:coordinate('middleLongitude',loc.longitude),summitLatitude:coordinate('summitLatitude',loc.latitude),summitLongitude:coordinate('summitLongitude',loc.longitude),profileSource:source,profileConfidence:confidence,profileUpdatedAt:String(value?.profileUpdatedAt||'')||undefined};
}

async function overpassElements(loc:Location,signal?:AbortSignal){
 const query=`[out:json][timeout:24];(nwr(around:25000,${loc.latitude},${loc.longitude})["aerialway"="station"];way(around:25000,${loc.latitude},${loc.longitude})["aerialway"~"^(cable_car|gondola|chair_lift|mixed_lift|drag_lift|t-bar|j-bar|platter|magic_carpet|funicular)$"];);out tags center geom;`,errors:string[]=[];
 for(const endpoint of OVERPASS_ENDPOINTS){
  try{const data=await fetchJson<{elements?:any[]}>(endpoint,signal,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(query)}`});if(Array.isArray(data.elements))return data.elements}catch(error){if(signal?.aborted)throw error;errors.push(error instanceof Error?error.message:String(error))}
 }
 throw new Error(errors.join(' · ')||'OpenStreetMap-Liftstationen sind derzeit nicht erreichbar.');
}
async function fillElevations(candidates:MountainCandidate[],signal?:AbortSignal){
 const missing=candidates.filter(candidate=>!Number.isFinite(candidate.elevation));
 for(let offset=0;offset<missing.length;offset+=100){const chunk=missing.slice(offset,offset+100),url=new URL(ELEVATION_ENDPOINT);url.searchParams.set('latitude',chunk.map(item=>item.latitude).join(','));url.searchParams.set('longitude',chunk.map(item=>item.longitude).join(','));try{const data=await fetchJson<{elevation?:number[]}>(url.toString(),signal),elevations=Array.isArray(data.elevation)?data.elevation:[];chunk.forEach((item,index)=>{const value=numeric(elevations[index]);if(value!==undefined)item.elevation=Math.round(value)})}catch(error){if(signal?.aborted)throw error}}
 return candidates;
}
function dedupeCandidates(candidates:MountainCandidate[]){
 const result:MountainCandidate[]=[];
 for(const candidate of candidates){const existing=result.find(item=>distanceMeters(item.latitude,item.longitude,candidate.latitude,candidate.longitude)<70);if(!existing){result.push(candidate);continue}if(!existing.role&&candidate.role)existing.role=candidate.role;if(existing.kind!=='station'&&candidate.kind==='station')existing.kind='station';if(existing.name==='Seilbahnstation'&&candidate.name)existing.name=candidate.name;if(!Number.isFinite(existing.elevation)&&Number.isFinite(candidate.elevation))existing.elevation=candidate.elevation;if(!existing.liftId&&candidate.liftId)existing.liftId=candidate.liftId}
 return result;
}
async function derivedProfile(loc:Location,signal?:AbortSignal):Promise<MountainProfileResult>{
 let elevation=Math.max(0,Math.round(Number(loc.elevation)||0));if(!elevation){const url=new URL(ELEVATION_ENDPOINT);url.searchParams.set('latitude',String(loc.latitude));url.searchParams.set('longitude',String(loc.longitude));try{const data=await fetchJson<{elevation?:number[]}>(url.toString(),signal),value=numeric(data.elevation?.[0]);if(value!==undefined)elevation=Math.max(0,Math.round(value))}catch(error){if(signal?.aborted)throw error}}
 const summit=Math.max(elevation+600,Math.max(1200,elevation+1200));return{levels:[{role:'valley',name:`${loc.name} · Talniveau`,latitude:loc.latitude,longitude:loc.longitude,elevation,source:'abgeleitet'},{role:'summit',name:`${loc.name} · Bergniveau`,latitude:loc.latitude,longitude:loc.longitude,elevation:summit,source:'abgeleitet'}],source:'Abgeleitete Ausgangswerte',confidence:'low',checkedAt:new Date().toISOString(),diagnostics:{fallback:true}};
}
async function directMountainProfile(loc:Location,signal?:AbortSignal):Promise<MountainProfileResult>{
 const elements=await overpassElements(loc,signal),candidates:MountainCandidate[]=[];
 for(const element of elements){const tags=element?.tags??{},type=String(tags.aerialway??''),label=String(tags.name||tags.ref||'').trim(),role=stationRole(tags['aerialway:station']),coordinate=element.type==='node'?{latitude:numeric(element.lat),longitude:numeric(element.lon)}:{latitude:numeric(element.center?.lat),longitude:numeric(element.center?.lon)};
  if(type==='station'&&coordinate.latitude!==undefined&&coordinate.longitude!==undefined)candidates.push({latitude:coordinate.latitude,longitude:coordinate.longitude,elevation:parseElevation(tags.ele),name:label||'Seilbahnstation',role,source:'OpenStreetMap-Station',distanceM:distanceMeters(loc.latitude,loc.longitude,coordinate.latitude,coordinate.longitude),kind:'station'});
  if(element.type==='way'&&LIFT_TYPES.has(type)&&Array.isArray(element.geometry)&&element.geometry.length>=2){const first=element.geometry[0],last=element.geometry.at(-1),firstLat=numeric(first?.lat),firstLon=numeric(first?.lon),lastLat=numeric(last?.lat),lastLon=numeric(last?.lon),liftId=String(element.id??`${label}:${candidates.length}`),base=label||'Lift';if(firstLat!==undefined&&firstLon!==undefined)candidates.push({latitude:firstLat,longitude:firstLon,name:`${base} · Tal`,role:'valley',source:'OpenStreetMap-Liftende',distanceM:distanceMeters(loc.latitude,loc.longitude,firstLat,firstLon),kind:'lift-end',liftId});if(lastLat!==undefined&&lastLon!==undefined)candidates.push({latitude:lastLat,longitude:lastLon,name:`${base} · Berg`,role:'summit',source:'OpenStreetMap-Liftende',distanceM:distanceMeters(loc.latitude,loc.longitude,lastLat,lastLon),kind:'lift-end',liftId})}
 }
 await fillElevations(candidates,signal);
 const byLift=new Map<string,MountainCandidate[]>();for(const candidate of candidates)if(candidate.liftId){const rows=byLift.get(candidate.liftId)??[];rows.push(candidate);byLift.set(candidate.liftId,rows)}for(const rows of byLift.values())if(rows.length===2&&Number(rows[0].elevation)>Number(rows[1].elevation)){rows[0].role='summit';rows[1].role='valley';rows[0].name=rows[0].name.replace(/ · Tal$/, ' · Berg');rows[1].name=rows[1].name.replace(/ · Berg$/, ' · Tal')}
 const valid=dedupeCandidates(candidates).filter(candidate=>Number.isFinite(candidate.elevation)&&candidate.distanceM<=30000);if(valid.length<2)return derivedProfile(loc,signal);
 const valleyPool=[...valid.filter(candidate=>candidate.role==='valley'),...valid],summitPool=[...valid.filter(candidate=>candidate.role==='summit'),...valid];let best:{valley:MountainCandidate;summit:MountainCandidate;score:number}|undefined;
 for(const valley of valleyPool)for(const summit of summitPool){if(valley===summit)continue;const gain=Number(summit.elevation)-Number(valley.elevation),span=distanceMeters(valley.latitude,valley.longitude,summit.latitude,summit.longitude);if(gain<250||span>30000)continue;const sameLift=Boolean(valley.liftId&&valley.liftId===summit.liftId),score=gain/12-valley.distanceM/700-summit.distanceM/2800+(valley.role==='valley'?24:0)+(summit.role==='summit'?24:0)+(sameLift?42:0)+(valley.kind==='station'?6:0)+(summit.kind==='station'?6:0);if(!best||score>best.score)best={valley,summit,score}}
 if(!best)return derivedProfile(loc,signal);
 const{valley,summit}=best,target=(Number(valley.elevation)+Number(summit.elevation))/2,explicitMiddle=valid.filter(candidate=>candidate.role==='middle'&&Number(candidate.elevation)>Number(valley.elevation)+100&&Number(candidate.elevation)<Number(summit.elevation)-100&&distanceMeters(valley.latitude,valley.longitude,candidate.latitude,candidate.longitude)<22000&&distanceMeters(summit.latitude,summit.longitude,candidate.latitude,candidate.longitude)<22000).sort((a,b)=>Math.abs(Number(a.elevation)-target)-Math.abs(Number(b.elevation)-target)||a.distanceM-b.distanceM)[0],level=(candidate:MountainCandidate,role:MountainLevelRole):MountainProfileLevel=>({role,name:candidate.name||mountainLevelLabel(role),latitude:candidate.latitude,longitude:candidate.longitude,elevation:Math.round(Number(candidate.elevation)),source:candidate.source}),sameLift=Boolean(valley.liftId&&valley.liftId===summit.liftId),confidence:MountainProfileConfidence=(valley.role==='valley'&&summit.role==='summit')||sameLift?'high':'medium';
 return{levels:[level(valley,'valley'),...(explicitMiddle?[level(explicitMiddle,'middle')]:[]),level(summit,'summit')],source:'OpenStreetMap + Copernicus GLO-90 via Open-Meteo',confidence,checkedAt:new Date().toISOString(),diagnostics:{osmElements:elements.length,candidates:valid.length,sameLift,explicitMiddle:Boolean(explicitMiddle)}};
}
function validProfile(result:MountainProfileResult|undefined){const levels=Array.isArray(result?.levels)?result.levels:[],valley=levels.find(level=>level.role==='valley'),summit=levels.find(level=>level.role==='summit');return Boolean(valley&&summit&&finite(valley.latitude)&&finite(valley.longitude)&&finite(valley.elevation)&&finite(summit.latitude)&&finite(summit.longitude)&&finite(summit.elevation)&&Number(summit.elevation)>Number(valley.elevation))}

export async function mountainProfile(loc:Location,signal?:AbortSignal):Promise<MountainProfileResult>{
 let workerError='';try{const result=await fetchWorkerJson<MountainProfileResult&{error?:string}>('mountain-profile',{lat:loc.latitude,lon:loc.longitude,name:loc.name,country:countryCodeFromLocation(loc.country_code)||countryCodeFromLocation(loc.country)},{purpose:'general',signal,timeoutMs:14000});if(validProfile(result))return result;workerError='Worker lieferte kein Höhenprofil.'}catch(error){if(signal?.aborted)throw error;workerError=error instanceof Error?error.message:String(error)}
 try{return await directMountainProfile(loc,signal)}catch(error){if(signal?.aborted)throw error;const directError=error instanceof Error?error.message:String(error);throw new Error(`Automatische Höhenbestimmung nicht verfügbar. ${directError}${workerError?` · Worker: ${workerError}`:''}`)}
}

export function applyMountainProfile(config:MountainConfig,profile:MountainProfileResult):MountainConfig{
 const byRole=new Map(profile.levels.map(level=>[level.role,level])),valley=byRole.get('valley'),middle=byRole.get('middle'),summit=byRole.get('summit');if(!valley||!summit||summit.elevation<=valley.elevation)return config;const automatic=/OpenStreetMap|Copernicus/i.test(profile.source);
 return{...config,middleEnabled:Boolean(middle),valleyElevation:Math.round(valley.elevation),middleElevation:Math.round(middle?.elevation??((valley.elevation+summit.elevation)/2)),summitElevation:Math.round(summit.elevation),valleyName:valley.name||'Talstation',middleName:middle?.name||'Mittelstation',summitName:summit.name||'Bergstation',valleyLatitude:valley.latitude,valleyLongitude:valley.longitude,middleLatitude:middle?.latitude??config.middleLatitude,middleLongitude:middle?.longitude??config.middleLongitude,summitLatitude:summit.latitude,summitLongitude:summit.longitude,profileSource:automatic?'osm-dem':'derived',profileConfidence:profile.confidence,profileUpdatedAt:profile.checkedAt||new Date().toISOString()};
}

function configuredPoints(loc:Location,config:MountainConfig){const row=(role:MountainLevelRole,name:string,elevation:number,latitude:unknown,longitude:unknown)=>({role,name,latitude:finite(latitude)?Number(latitude):loc.latitude,longitude:finite(longitude)?Number(longitude):loc.longitude,elevation:Math.round(elevation)}),points=[row('valley',config.valleyName,config.valleyElevation,config.valleyLatitude,config.valleyLongitude)];if(config.middleEnabled&&config.middleElevation>config.valleyElevation&&config.middleElevation<config.summitElevation)points.push(row('middle',config.middleName,config.middleElevation,config.middleLatitude,config.middleLongitude));points.push(row('summit',config.summitName,config.summitElevation,config.summitLatitude,config.summitLongitude));return points}
export function mountainTimeEpoch(weather:MountainPointWeather,value:unknown){const match=String(value??'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);if(!match)return NaN;return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]),Number(match[6]||0))-Number(weather.utc_offset_seconds||0)*1000}
function nearestHourlyIndex(weather:MountainPointWeather){const times=(weather.hourly.time??[]) as string[];if(!times.length)return 0;const now=Date.now();return times.reduce((best,time,index)=>{const value=mountainTimeEpoch(weather,time),bestValue=mountainTimeEpoch(weather,times[best]);return Number.isFinite(value)&&Math.abs(value-now)<Math.abs(bestValue-now)?index:best},0)}
function currentValue(weather:MountainPointWeather,key:string){const current=Number(weather.current?.[key]);if(Number.isFinite(current))return current;const index=nearestHourlyIndex(weather),value=Number(weather.hourly?.[key]?.[index]);return Number.isFinite(value)?value:NaN}
function snowfallSums(weather:MountainPointWeather){const times=(weather.hourly.time??[]) as string[],snow=weather.hourly.snowfall??[],now=Date.now();let past24=0,next24=0,next48=0;for(let index=0;index<times.length;index++){const epoch=mountainTimeEpoch(weather,times[index]),value=Math.max(0,Number(snow[index])||0);if(!Number.isFinite(epoch))continue;const delta=(epoch-now)/3600000;if(delta>=-24&&delta<0)past24+=value;if(delta>=0&&delta<24)next24+=value;if(delta>=0&&delta<48)next48+=value}return{past24,next24,next48}}
function autoWinter(latitude:number,levels:MountainLevelForecast[]){const month=new Date().getMonth()+1,winterMonth=latitude>=0?(month>=11||month<=4):(month>=5&&month<=10);return winterMonth||levels.some(level=>level.modelSnowDepthCm>=1||level.pastSnow24Cm>=.2||level.newSnow48Cm>=.2)}

function geoSphereStationArray(data:any){const candidates=[data?.stations,data?.station_metadata,data?.metadata?.stations,data?.data?.stations];for(const rows of candidates)if(Array.isArray(rows))return rows;return[]}
async function geoSphereMetadata(signal?:AbortSignal){if(!geoSphereMetadataPromise)geoSphereMetadataPromise=fetchJson<any>(GEOSPHERE_METADATA,signal).then(data=>geoSphereStationArray(data).map((station:any)=>({id:String(station?.id??station?.station_id??''),name:String(station?.name??station?.station_name??station?.id??'GeoSphere-Station'),latitude:Number(station?.lat??station?.latitude),longitude:Number(station?.lon??station?.longitude),elevation:numeric(station?.altitude??station?.height??station?.elevation)})).filter((station:GeoSphereStation)=>station.id&&Number.isFinite(station.latitude)&&Number.isFinite(station.longitude))).catch(error=>{geoSphereMetadataPromise=null;throw error});return geoSphereMetadataPromise}
function geoSphereLast(value:any){const raw=value?.data??value?.values??value?.value??value;if(Array.isArray(raw)){for(let index=raw.length-1;index>=0;index--){const number=numeric(raw[index]);if(number!==undefined)return number}return undefined}return numeric(raw)}
function geoSphereParam(feature:any,name:string){const properties=feature?.properties??feature,parameters=properties?.parameters??properties?.parameter??properties;return geoSphereLast(parameters?.[name]??parameters?.[name.toLowerCase()]??parameters?.[name.toUpperCase()])}
function geoSphereFeatureId(feature:any){const station=feature?.properties?.station;return String(feature?.properties?.station_id??(station&&typeof station==='object'?station.id:station)??feature?.station_id??feature?.id??'')}
async function directSnowObservations(loc:Location,points:ReturnType<typeof configuredPoints>,signal?:AbortSignal):Promise<SnowObservationResponse>{
 const code=countryCodeFromLocation(loc.country_code)||countryCodeFromLocation(loc.country),austria=code==='AT'||(!code&&loc.latitude>=46.35&&loc.latitude<=49.05&&loc.longitude>=9.45&&loc.longitude<=17.3);if(!austria)return{observations:[],provider:'Open-Meteo Modellschneehöhe',coverage:'Für diesen Ort ist derzeit keine passende freie Live-Schneepegelquelle eingebunden.'};
 const metadata=await geoSphereMetadata(signal),nearby=metadata.map(station=>({...station,minDistance:Math.min(...points.map(point=>distanceMeters(point.latitude,point.longitude,station.latitude,station.longitude))),minElevationDiff:Math.min(...points.map(point=>Math.abs(Number(station.elevation??0)-point.elevation)))})).filter(station=>station.minDistance<=35000&&station.minElevationDiff<=450).sort((a,b)=>a.minDistance-b.minDistance||a.minElevationDiff-b.minElevationDiff).slice(0,18);if(!nearby.length)return{observations:[],provider:'GeoSphere Austria / TAWES',coverage:'Keine räumlich und höhenmäßig passende TAWES-Station gefunden.'};
 let raw:any,param='SCHNEE',lastError:unknown;for(const candidate of['SCHNEE','HS']){const url=new URL(GEOSPHERE_CURRENT);url.searchParams.set('parameters',candidate);url.searchParams.set('station_ids',nearby.map(station=>station.id).join(','));url.searchParams.set('output_format','geojson');try{raw=await fetchJson<any>(url.toString(),signal);param=candidate;break}catch(error){if(signal?.aborted)throw error;lastError=error}}
 if(!raw)throw lastError??new Error('GeoSphere-Schneepegel nicht verfügbar.');const features=Array.isArray(raw?.features)?raw.features:Array.isArray(raw?.data)?raw.data:Array.isArray(raw)?raw:[],byId=new Map(nearby.map(station=>[station.id,station])),timestamp=safeDate(Array.isArray(raw?.timestamps)?raw.timestamps.at(-1):raw?.timestamp),available:{station:typeof nearby[number];depth:number;observedAt?:string}[]=[];
 for(const feature of features){const id=geoSphereFeatureId(feature),station=byId.get(id),depth=geoSphereParam(feature,param),observedAt=safeDate(feature?.properties?.timestamp)||timestamp;if(!station||depth===undefined||depth<0||depth>1500)continue;if(observedAt&&Date.now()-Date.parse(observedAt)>6*3600000)continue;available.push({station,depth,observedAt})}
 const used=new Set<string>(),observations:MountainSnowObservation[]=[];for(const point of points){const maxDistance=point.role==='valley'?20000:point.role==='middle'?25000:30000,maxElevationDiff=point.role==='middle'?250:300,candidate=available.filter(row=>!used.has(row.station.id)&&distanceMeters(point.latitude,point.longitude,row.station.latitude,row.station.longitude)<=maxDistance&&Math.abs(Number(row.station.elevation??0)-point.elevation)<=maxElevationDiff).sort((a,b)=>{const score=(row:typeof a)=>distanceMeters(point.latitude,point.longitude,row.station.latitude,row.station.longitude)/1000+Math.abs(Number(row.station.elevation??0)-point.elevation)/70;return score(a)-score(b)})[0];if(!candidate)continue;used.add(candidate.station.id);observations.push({role:point.role,depthCm:candidate.depth,stationName:candidate.station.name,stationId:candidate.station.id,elevation:candidate.station.elevation,distanceKm:Number((distanceMeters(point.latitude,point.longitude,candidate.station.latitude,candidate.station.longitude)/1000).toFixed(1)),observedAt:candidate.observedAt,provider:'GeoSphere Austria / TAWES Schneepegel',license:'CC BY 4.0'})}
 return{observations,provider:'GeoSphere Austria / TAWES',coverage:observations.length?'Passende aktuelle Schneepegel nach Entfernung und Höhendifferenz':'Keine ausreichend passende aktuelle TAWES-Schneehöhenmessung; Modellwerte bleiben verfügbar.'};
}
async function loadSnowObservations(loc:Location,points:ReturnType<typeof configuredPoints>,signal?:AbortSignal):Promise<SnowObservationResponse>{
 const worker=fetchWorkerJson<SnowObservationResponse>('snow-observations',{lat:loc.latitude,lon:loc.longitude,country:countryCodeFromLocation(loc.country_code)||countryCodeFromLocation(loc.country),levels:JSON.stringify(points.map(({role,latitude,longitude,elevation})=>({role,latitude,longitude,elevation})))},{purpose:'general',signal,timeoutMs:14000}).catch(()=>({observations:[]} as SnowObservationResponse)),direct=directSnowObservations(loc,points,signal).catch(()=>({observations:[]} as SnowObservationResponse)),[workerResult,directResult]=await Promise.all([worker,direct]);if((workerResult.observations?.length??0)>0)return workerResult;if((directResult.observations?.length??0)>0)return directResult;if(workerResult.provider)return workerResult;if(directResult.provider)return directResult;return{observations:[],provider:'Open-Meteo Modellschneehöhe',coverage:'Keine passende aktuelle Messschneequelle verfügbar.'};
}

export async function mountainSportsForecast(loc:Location,config:MountainConfig,signal?:AbortSignal):Promise<MountainSportsForecast>{
 const points=configuredPoints(loc,config),latitudes=points.map(point=>point.latitude).join(','),longitudes=points.map(point=>point.longitude).join(','),elevations=points.map(point=>point.elevation).join(','),variables=['temperature_2m','apparent_temperature','relative_humidity_2m','dew_point_2m','precipitation_probability','precipitation','rain','showers','snowfall','snow_depth','weather_code','cloud_cover','cloud_cover_low','visibility','freezing_level_height','wet_bulb_temperature_2m','wind_speed_10m','wind_gusts_10m','wind_direction_10m','uv_index','cape','is_day'],params=new URLSearchParams({latitude:latitudes,longitude:longitudes,elevation:elevations,timezone:'auto',forecast_hours:'72',past_hours:'24',models:'best_match',wind_speed_unit:'kn',current:variables.filter(key=>key!=='precipitation_probability').join(','),hourly:variables.join(',')}),observationsPromise=loadSnowObservations(loc,points,signal),response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal,cache:'no-store'});if(!response.ok)throw new Error(`Höhenprognose HTTP ${response.status}`);const raw=await response.json() as MountainPointWeather[]|MountainPointWeather,rows=Array.isArray(raw)?raw:[raw];if(rows.length!==points.length)throw new Error('Die Höhenprognose lieferte nicht alle konfigurierten Niveaus.');const observationResult=await observationsPromise,observations=new Map((observationResult.observations??[]).map(item=>[item.role,item])),levels=points.map((point,index)=>{const weather=rows[index],snowfall=snowfallSums(weather),depth=currentValue(weather,'snow_depth');return{...point,weather,modelSnowDepthCm:Number.isFinite(depth)?Math.max(0,depth*100):NaN,pastSnow24Cm:snowfall.past24,newSnow24Cm:snowfall.next24,newSnow48Cm:snowfall.next48,observation:observations.get(point.role)} satisfies MountainLevelForecast}),season=config.season==='auto'?(autoWinter(loc.latitude,levels)?'winter':'summer'):config.season;return{levels,season,observationsProvider:observationResult.provider,observationsCoverage:observationResult.coverage};
}

export function mountainLevelLabel(role:MountainLevelRole){return role==='valley'?'Tal':role==='middle'?'Mitte':'Berg'}
export function mountainSeasonLabel(value:MountainSeason|Exclude<MountainSeason,'auto'>){return value==='summer'?'Sommer':value==='winter'?'Winter':'Automatisch'}
export function mountainProfileSourceLabel(config:MountainConfig){if(config.profileSource==='manual')return'Manuell angepasst';if(config.profileSource==='osm-dem')return`Automatisch · ${config.profileConfidence==='high'?'hohe':config.profileConfidence==='medium'?'mittlere':'geringe'} Sicherheit`;return'Abgeleitete Ausgangswerte'}
export function mountainCurrentValue(level:MountainLevelForecast,key:string){return currentValue(level.weather,key)}
