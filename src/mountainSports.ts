import type {Location} from './weather';
import {fetchWorkerJson} from './workerClient';

export type MountainSeason='auto'|'summer'|'winter';
export type MountainLevelRole='valley'|'middle'|'summit';
export type MountainProfileSource='manual'|'osm-dem'|'derived';
export type MountainProfileConfidence='high'|'medium'|'low';

export type MountainConfig={
 schemaVersion:2;
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

export type MountainProfileLevel={role:MountainLevelRole;name:string;latitude:number;longitude:number;elevation:number;source?:string};
export type MountainProfileResult={levels:MountainProfileLevel[];source:string;confidence:MountainProfileConfidence;checkedAt?:string;diagnostics?:Record<string,unknown>};
export type MountainPointWeather={latitude:number;longitude:number;elevation:number;timezone:string;timezone_abbreviation?:string;utc_offset_seconds?:number;current:Record<string,number|string|null>;hourly:Record<string,(number|string|null)[]>};
export type MountainSnowMeasurement={valueCm:number;stationName:string;stationId?:string;stationElevation?:number;distanceKm:number;heightDifferenceM:number;observedAt:string;provider:string};
export type MountainLevelForecast={role:MountainLevelRole;name:string;latitude:number;longitude:number;elevation:number;weather:MountainPointWeather;modelSnowDepthCm:number;measuredSnowDepthCm:number;snowMeasurement?:MountainSnowMeasurement;pastSnow24Cm:number;newSnow24Cm:number;newSnow48Cm:number};
export type MountainSportsForecast={levels:MountainLevelForecast[];season:Exclude<MountainSeason,'auto'>;source:string};

type MountainCandidate={latitude:number;longitude:number;elevation?:number;name:string;role?:MountainLevelRole;source:string;distanceM:number;kind:'station'|'lift-end';liftId?:string};

const OVERPASS_ENDPOINTS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
const ELEVATION_ENDPOINT='https://api.open-meteo.com/v1/elevation';
const FORECAST_ENDPOINT='https://api.open-meteo.com/v1/forecast';
const LIFT_TYPES=new Set(['cable_car','gondola','chair_lift','mixed_lift','drag_lift','t-bar','j-bar','platter','magic_carpet','funicular']);
const PROFILE_SEARCH_RADIUS_M=18000;
const PROFILE_CLUSTER_LINK_M=2600;
const PROFILE_MAX_SPAN_M=18000;
const PROFILE_MIN_GAIN_M=250;
const PROFILE_MAX_GAIN_M=2200;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const finite=(value:unknown)=>Number.isFinite(Number(value));
const numeric=(value:unknown)=>{if(value===null||value===undefined||value==='')return undefined;const number=Number(value);return Number.isFinite(number)?number:undefined};
const toRad=(value:number)=>value*Math.PI/180;

function distanceMeters(lat1:number,lon1:number,lat2:number,lon2:number){const radius=6371000,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*radius*Math.asin(Math.min(1,Math.sqrt(a)))}
function isPeakLocation(loc:Location){return /gipfel|peak|summit|mountain|bergspitze|mountain_peak/i.test(`${loc.poiCategory||''} ${loc.poiType||''}`)}
function automaticProfileEnvelope(loc:Location,anchorElevation:number,candidate:MountainCandidate){
 const elevation=Number(candidate.elevation),peak=isPeakLocation(loc);
 if(!Number.isFinite(elevation)||candidate.distanceM>PROFILE_SEARCH_RADIUS_M)return false;
 return peak?elevation>=anchorElevation-2200&&elevation<=anchorElevation+600:elevation>=Math.max(-100,anchorElevation-550)&&elevation<=anchorElevation+2200;
}
function automaticConfigPlausible(loc:Location,config:{valleyElevation:number;middleElevation:number;summitElevation:number;middleEnabled:boolean;valleyLatitude?:number;valleyLongitude?:number;middleLatitude?:number;middleLongitude?:number;summitLatitude?:number;summitLongitude?:number}){
 const anchor=Number(loc.elevation),peak=isPeakLocation(loc),valley=Number(config.valleyElevation),summit=Number(config.summitElevation),middle=Number(config.middleElevation);
 if(!Number.isFinite(valley)||!Number.isFinite(summit)||summit-valley<PROFILE_MIN_GAIN_M||summit-valley>PROFILE_MAX_GAIN_M)return false;
 if(Number.isFinite(anchor)&&anchor>0){
  if(peak){if(summit<anchor-500||summit>anchor+650||valley<anchor-2300)return false}
  else if(valley<anchor-550||valley>anchor+500||summit>anchor+2200||summit<anchor+120)return false;
 }
 if(config.middleEnabled&&(!Number.isFinite(middle)||middle<=valley+80||middle>=summit-80))return false;
 const coordinates:[[unknown,unknown],[unknown,unknown],[unknown,unknown]]=[[config.valleyLatitude,config.valleyLongitude],[config.middleLatitude,config.middleLongitude],[config.summitLatitude,config.summitLongitude]];
 for(const[latitude,longitude]of coordinates){if(!finite(latitude)||!finite(longitude))continue;if(distanceMeters(loc.latitude,loc.longitude,Number(latitude),Number(longitude))>PROFILE_SEARCH_RADIUS_M)return false}
 return true;
}
function parseElevation(value:unknown){const match=String(value??'').replace(',','.').match(/-?\d+(?:\.\d+)?/),number=match?Number(match[0]):NaN;return Number.isFinite(number)&&number>=-100&&number<=9000?number:undefined}
function stationRole(value:unknown):MountainLevelRole|undefined{const role=String(value??'').toLowerCase();if(/bottom|lower|valley|tal/.test(role))return'valley';if(/mid|middle|mittel|intermediate|zwischen/.test(role))return'middle';if(/top|upper|summit|berg/.test(role))return'summit';return undefined}
async function fetchJson<T>(url:string,signal?:AbortSignal,init:RequestInit={}):Promise<T>{const response=await fetch(url,{...init,signal,cache:'no-store',headers:{Accept:'application/json',...(init.headers??{})}});if(!response.ok)throw new Error(`${new URL(url).hostname} HTTP ${response.status}`);return response.json() as Promise<T>}

export function defaultMountainConfig(loc:Location):MountainConfig{const elevation=Math.max(0,Math.round(Number(loc.elevation)||0)),peak=/gipfel|peak|mountain/i.test(`${loc.poiCategory||''} ${loc.poiType||''}`),valley=peak?Math.max(0,elevation-1200):elevation,summit=peak?Math.max(elevation,1):Math.max(elevation+1200,1200);return{schemaVersion:2,enabled:false,season:'auto',middleEnabled:false,valleyElevation:valley,middleElevation:Math.round((valley+summit)/2),summitElevation:summit,valleyName:'Talstation',middleName:'Mittelstation',summitName:'Bergstation',valleyLatitude:loc.latitude,valleyLongitude:loc.longitude,middleLatitude:loc.latitude,middleLongitude:loc.longitude,summitLatitude:loc.latitude,summitLongitude:loc.longitude,profileSource:'derived',profileConfidence:'low'}}

export function normalizeMountainConfig(value:any,loc:Location):MountainConfig{
 const fallback=defaultMountainConfig(loc),season:MountainSeason=['auto','summer','winter'].includes(value?.season)?value.season:'auto',enabled=Boolean(value?.enabled),valley=finite(value?.valleyElevation)?clamp(Number(value.valleyElevation),0,6000):fallback.valleyElevation,summit=finite(value?.summitElevation)?clamp(Number(value.summitElevation),valley+1,7000):Math.max(fallback.summitElevation,valley+1),middleFallback=Math.round((valley+summit)/2),middle=finite(value?.middleElevation)?clamp(Number(value.middleElevation),valley+1,summit-1):middleFallback,source:MountainProfileSource=['manual','osm-dem','derived'].includes(value?.profileSource)?value.profileSource:(value?.profileUpdatedAt?'osm-dem':'derived'),confidence:MountainProfileConfidence=['high','medium','low'].includes(value?.profileConfidence)?value.profileConfidence:(source==='manual'?'medium':'low'),coordinate=(key:string,fallbackValue:number)=>finite(value?.[key])?Number(value[key]):fallbackValue;
 const normalized:MountainConfig={schemaVersion:2,enabled,season,middleEnabled:Boolean(value?.middleEnabled),valleyElevation:valley,middleElevation:middle,summitElevation:summit,valleyName:String(value?.valleyName||fallback.valleyName).trim().slice(0,80)||fallback.valleyName,middleName:String(value?.middleName||fallback.middleName).trim().slice(0,80)||fallback.middleName,summitName:String(value?.summitName||fallback.summitName).trim().slice(0,80)||fallback.summitName,valleyLatitude:coordinate('valleyLatitude',loc.latitude),valleyLongitude:coordinate('valleyLongitude',loc.longitude),middleLatitude:coordinate('middleLatitude',loc.latitude),middleLongitude:coordinate('middleLongitude',loc.longitude),summitLatitude:coordinate('summitLatitude',loc.latitude),summitLongitude:coordinate('summitLongitude',loc.longitude),profileSource:source,profileConfidence:confidence,profileUpdatedAt:String(value?.profileUpdatedAt||'')||undefined};
 // Bereits gespeicherte automatische Profile aus älteren Versionen werden nur
 // übernommen, wenn Höhen und Koordinaten noch zum Favoriten passen. Dadurch
 // verschwinden ortsfremde Liftpaare (z. B. 490 m bei einem Ort auf 1.958 m)
 // nach dem Versionswechsel automatisch und werden beim nächsten Öffnen neu gesucht.
 if(source==='osm-dem'&&!automaticConfigPlausible(loc,normalized))return{...fallback,enabled,season};
 return normalized;
}

async function overpassElements(loc:Location,signal?:AbortSignal){
 const query=`[out:json][timeout:24];(nwr(around:${PROFILE_SEARCH_RADIUS_M},${loc.latitude},${loc.longitude})["aerialway"="station"];way(around:${PROFILE_SEARCH_RADIUS_M},${loc.latitude},${loc.longitude})["aerialway"~"^(cable_car|gondola|chair_lift|mixed_lift|drag_lift|t-bar|j-bar|platter|magic_carpet|funicular)$"];);out tags center geom;`,errors:string[]=[];
 for(let round=0;round<2;round++){
  if(round>0)await new Promise<void>((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(new DOMException('Abgebrochen','AbortError'))},timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve()},500);signal?.addEventListener('abort',abort,{once:true})});
  for(const endpoint of OVERPASS_ENDPOINTS){try{const data=await fetchJson<{elements?:any[]}>(endpoint,signal,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:`data=${encodeURIComponent(query)}`});if(Array.isArray(data.elements))return data.elements}catch(error){if(signal?.aborted)throw error;errors.push(error instanceof Error?error.message:String(error))}}
 }
 throw new Error(errors.join(' · ')||'OpenStreetMap-Liftstationen sind derzeit nicht erreichbar.');
}
async function fillElevations(candidates:MountainCandidate[],signal?:AbortSignal){const missing=candidates.filter(candidate=>!Number.isFinite(candidate.elevation));for(let offset=0;offset<missing.length;offset+=100){const chunk=missing.slice(offset,offset+100);if(!chunk.length)continue;const url=new URL(ELEVATION_ENDPOINT);url.searchParams.set('latitude',chunk.map(item=>item.latitude).join(','));url.searchParams.set('longitude',chunk.map(item=>item.longitude).join(','));try{const data=await fetchJson<{elevation?:number[]}>(url.toString(),signal),elevations=Array.isArray(data.elevation)?data.elevation:[];chunk.forEach((item,index)=>{const value=numeric(elevations[index]);if(value!==undefined)item.elevation=Math.round(value)})}catch(error){if(signal?.aborted)throw error}}return candidates}
function dedupeCandidates(candidates:MountainCandidate[]){const result:MountainCandidate[]=[];for(const candidate of candidates){const existing=result.find(item=>distanceMeters(item.latitude,item.longitude,candidate.latitude,candidate.longitude)<70);if(!existing){result.push(candidate);continue}if(!existing.role&&candidate.role)existing.role=candidate.role;if(existing.kind!=='station'&&candidate.kind==='station')existing.kind='station';if(existing.name==='Seilbahnstation'&&candidate.name)existing.name=candidate.name;if(!Number.isFinite(existing.elevation)&&Number.isFinite(candidate.elevation))existing.elevation=candidate.elevation;if(!existing.liftId&&candidate.liftId)existing.liftId=candidate.liftId}return result}
function associateStationsWithLiftEnds(candidates:MountainCandidate[]){
 const liftEnds=candidates.filter(candidate=>candidate.kind==='lift-end'&&candidate.liftId);
 for(const station of candidates){if(station.kind!=='station'||station.liftId)continue;const nearest=liftEnds.map(endpoint=>({endpoint,distance:distanceMeters(station.latitude,station.longitude,endpoint.latitude,endpoint.longitude)})).filter(row=>row.distance<=240).sort((a,b)=>a.distance-b.distance)[0];if(!nearest)continue;station.liftId=nearest.endpoint.liftId;if(!station.role)station.role=nearest.endpoint.role}
}
function connectedCandidateGroups(candidates:MountainCandidate[]){
 const parent=candidates.map((_,index)=>index),find=(index:number):number=>parent[index]===index?index:(parent[index]=find(parent[index])),join=(left:number,right:number)=>{const a=find(left),b=find(right);if(a!==b)parent[b]=a};
 for(let left=0;left<candidates.length;left++)for(let right=left+1;right<candidates.length;right++){const a=candidates[left],b=candidates[right],sameLift=Boolean(a.liftId&&a.liftId===b.liftId);if(sameLift||distanceMeters(a.latitude,a.longitude,b.latitude,b.longitude)<=PROFILE_CLUSTER_LINK_M)join(left,right)}
 const groups=new Map<number,MountainCandidate[]>();for(let index=0;index<candidates.length;index++){const root=find(index),rows=groups.get(root)??[];rows.push(candidates[index]);groups.set(root,rows)}return[...groups.values()];
}
async function localElevation(loc:Location,signal?:AbortSignal){let elevation=Math.max(0,Math.round(Number(loc.elevation)||0));if(elevation)return elevation;const url=new URL(ELEVATION_ENDPOINT);url.searchParams.set('latitude',String(loc.latitude));url.searchParams.set('longitude',String(loc.longitude));try{const data=await fetchJson<{elevation?:number[]}>(url.toString(),signal),value=numeric(data.elevation?.[0]);if(value!==undefined)elevation=Math.max(0,Math.round(value))}catch(error){if(signal?.aborted)throw error}return elevation}
async function derivedProfile(loc:Location,signal?:AbortSignal):Promise<MountainProfileResult>{const elevation=await localElevation(loc,signal),summit=Math.max(elevation+600,Math.max(1200,elevation+1200));return{levels:[{role:'valley',name:`${loc.name} · Talniveau`,latitude:loc.latitude,longitude:loc.longitude,elevation,source:'abgeleitet'},{role:'summit',name:`${loc.name} · Bergniveau`,latitude:loc.latitude,longitude:loc.longitude,elevation:summit,source:'abgeleitet'}],source:'Abgeleitete Ausgangswerte',confidence:'low',checkedAt:new Date().toISOString(),diagnostics:{fallback:true}}}

type MountainPairSelection={valley:MountainCandidate;summit:MountainCandidate;middle?:MountainCandidate;sameLift:boolean;areaWide:boolean;groupSize:number;score:number};
function candidateElevation(candidate:MountainCandidate){return Number(candidate.elevation)}
function explicitMiddle(candidate:MountainCandidate){return candidate.role==='middle'||/mittel(?:station)?|middle|intermediate|zwischenstation/i.test(candidate.name)}
function candidateConnectivity(candidate:MountainCandidate,group:MountainCandidate[]){return group.filter(other=>other!==candidate&&(Boolean(candidate.liftId&&candidate.liftId===other.liftId)||distanceMeters(candidate.latitude,candidate.longitude,other.latitude,other.longitude)<=320)).length}
function chooseAreaMiddle(group:MountainCandidate[],valley:MountainCandidate,summit:MountainCandidate){
 const low=candidateElevation(valley),high=candidateElevation(summit),target=low+(high-low)*.44;
 const candidates=group.filter(candidate=>candidate!==valley&&candidate!==summit&&candidateElevation(candidate)>low+140&&candidateElevation(candidate)<high-140&&(candidate.kind==='station'||explicitMiddle(candidate)));
 return candidates.sort((left,right)=>{
  const leftScore=(explicitMiddle(left)?180:0)+(left.kind==='station'?42:0)+candidateConnectivity(left,group)*16-Math.abs(candidateElevation(left)-target)/8-left.distanceM/1000;
  const rightScore=(explicitMiddle(right)?180:0)+(right.kind==='station'?42:0)+candidateConnectivity(right,group)*16-Math.abs(candidateElevation(right)-target)/8-right.distanceM/1000;
  return rightScore-leftScore;
 })[0];
}
export function selectMountainProfileCandidates(loc:Location,anchorElevation:number,input:MountainCandidate[]):MountainPairSelection|undefined{
 const peak=isPeakLocation(loc),candidates=dedupeCandidates(input).filter(candidate=>automaticProfileEnvelope(loc,anchorElevation,candidate)),groups=connectedCandidateGroups(candidates);let best:MountainPairSelection|undefined;
 for(const group of groups){
  if(group.length<3)continue;
  const nearest=Math.min(...group.map(candidate=>candidate.distanceM));
  if(nearest>9000)continue;
  const valleyPool=group.filter(candidate=>{const elevation=candidateElevation(candidate);if(!Number.isFinite(elevation))return false;if(peak)return elevation>=anchorElevation-2300&&elevation<=anchorElevation-250;return elevation>=anchorElevation-500&&elevation<=anchorElevation+450&&candidate.distanceM<=9000&&candidate.role!=='summit'}).sort((left,right)=>candidateElevation(left)-candidateElevation(right)||(left.role==='valley'?-1:0)-(right.role==='valley'?-1:0)||(left.kind==='station'?-1:0)-(right.kind==='station'?-1:0)||left.distanceM-right.distanceM);
  if(!valleyPool.length)continue;
  for(const valley of valleyPool.slice(0,4)){
   const valleyElevation=candidateElevation(valley),summitPool=group.filter(candidate=>{const elevation=candidateElevation(candidate),gain=elevation-valleyElevation,span=distanceMeters(valley.latitude,valley.longitude,candidate.latitude,candidate.longitude);if(!Number.isFinite(elevation)||candidate===valley||gain<PROFILE_MIN_GAIN_M||gain>PROFILE_MAX_GAIN_M||span>PROFILE_MAX_SPAN_M)return false;if(peak)return elevation>=anchorElevation-500&&elevation<=anchorElevation+650;return elevation>=anchorElevation+120&&elevation<=anchorElevation+2200&&candidate.role!=='valley'}).sort((left,right)=>candidateElevation(right)-candidateElevation(left)||(right.role==='summit'?1:0)-(left.role==='summit'?1:0)||left.distanceM-right.distanceM);
   if(!summitPool.length)continue;
   const summit=summitPool[0],summitElevation=candidateElevation(summit),gain=summitElevation-valleyElevation,span=distanceMeters(valley.latitude,valley.longitude,summit.latitude,summit.longitude),sameLift=Boolean(valley.liftId&&valley.liftId===summit.liftId),middle=chooseAreaMiddle(group,valley,summit),explicitRoles=(valley.role==='valley'?20:0)+(summit.role==='summit'?20:0)+(middle&&explicitMiddle(middle)?30:0),score=gain*.16+(summitElevation-anchorElevation)*.08+(anchorElevation-valleyElevation)*.06+Math.min(90,group.length*5)+explicitRoles-nearest/180-span/1400-valley.distanceM/700;
   const selection={valley,summit,middle,sameLift,areaWide:!sameLift,groupSize:group.length,score};
   if(!best||selection.score>best.score)best=selection;
  }
 }
 return best;
}
async function directMountainProfile(loc:Location,signal?:AbortSignal):Promise<MountainProfileResult>{
 const elements=await overpassElements(loc,signal),anchorElevation=await localElevation(loc,signal),candidates:MountainCandidate[]=[];
 for(const element of elements){const tags=element?.tags??{},type=String(tags.aerialway??''),label=String(tags.name||tags.ref||'').trim(),role=stationRole(tags['aerialway:station']),coordinate=element.type==='node'?{latitude:numeric(element.lat),longitude:numeric(element.lon)}:{latitude:numeric(element.center?.lat),longitude:numeric(element.center?.lon)};
  if(type==='station'&&coordinate.latitude!==undefined&&coordinate.longitude!==undefined)candidates.push({latitude:coordinate.latitude,longitude:coordinate.longitude,elevation:parseElevation(tags.ele),name:label||'Seilbahnstation',role,source:'OpenStreetMap-Station',distanceM:distanceMeters(loc.latitude,loc.longitude,coordinate.latitude,coordinate.longitude),kind:'station'});
  if(element.type==='way'&&LIFT_TYPES.has(type)&&Array.isArray(element.geometry)&&element.geometry.length>=2){const first=element.geometry[0],last=element.geometry.at(-1),firstLat=numeric(first?.lat),firstLon=numeric(first?.lon),lastLat=numeric(last?.lat),lastLon=numeric(last?.lon),liftId=String(element.id??`${label}:${candidates.length}`),base=label||'Lift';if(firstLat!==undefined&&firstLon!==undefined)candidates.push({latitude:firstLat,longitude:firstLon,name:`${base} · Tal`,role:'valley',source:'OpenStreetMap-Liftende',distanceM:distanceMeters(loc.latitude,loc.longitude,firstLat,firstLon),kind:'lift-end',liftId});if(lastLat!==undefined&&lastLon!==undefined)candidates.push({latitude:lastLat,longitude:lastLon,name:`${base} · Berg`,role:'summit',source:'OpenStreetMap-Liftende',distanceM:distanceMeters(loc.latitude,loc.longitude,lastLat,lastLon),kind:'lift-end',liftId})}
 }
 await fillElevations(candidates,signal);
 const byLift=new Map<string,MountainCandidate[]>();for(const candidate of candidates)if(candidate.liftId){const rows=byLift.get(candidate.liftId)??[];rows.push(candidate);byLift.set(candidate.liftId,rows)}for(const rows of byLift.values())if(rows.length===2&&Number(rows[0].elevation)>Number(rows[1].elevation)){rows[0].role='summit';rows[1].role='valley';rows[0].name=rows[0].name.replace(/ · Tal$/,' · Berg');rows[1].name=rows[1].name.replace(/ · Berg$/,' · Tal')}
 associateStationsWithLiftEnds(candidates);
 const selection=selectMountainProfileCandidates(loc,anchorElevation,candidates);if(!selection)return derivedProfile(loc,signal);
 const level=(candidate:MountainCandidate,role:MountainLevelRole):MountainProfileLevel=>({role,name:candidate.name||mountainLevelLabel(role),latitude:candidate.latitude,longitude:candidate.longitude,elevation:Math.round(Number(candidate.elevation)),source:candidate.source}),confidence:MountainProfileConfidence=selection.groupSize>=7&&Number(selection.summit.elevation)-Number(selection.valley.elevation)>=700?'high':selection.groupSize>=4?'medium':'low',levels=[level(selection.valley,'valley'),...(selection.middle?[level(selection.middle,'middle')]:[]),level(selection.summit,'summit')],profileCheck={valleyElevation:levels[0].elevation,middleElevation:levels[1]?.role==='middle'?levels[1].elevation:Math.round((levels[0].elevation+levels.at(-1)!.elevation)/2),summitElevation:levels.at(-1)!.elevation,middleEnabled:levels.some(row=>row.role==='middle'),valleyLatitude:levels[0].latitude,valleyLongitude:levels[0].longitude,middleLatitude:levels.find(row=>row.role==='middle')?.latitude,middleLongitude:levels.find(row=>row.role==='middle')?.longitude,summitLatitude:levels.at(-1)!.latitude,summitLongitude:levels.at(-1)!.longitude};if(!automaticConfigPlausible(loc,profileCheck))return derivedProfile(loc,signal);
 return{levels,source:'OpenStreetMap + Copernicus GLO-90 via Open-Meteo',confidence,checkedAt:new Date().toISOString(),diagnostics:{osmElements:elements.length,candidates:candidates.length,localCandidates:candidates.filter(candidate=>automaticProfileEnvelope(loc,anchorElevation,candidate)).length,anchorElevation,sameLift:selection.sameLift,areaWide:selection.areaWide,clusterSize:selection.groupSize,explicitMiddle:Boolean(selection.middle),selectionScore:Number(selection.score.toFixed(1)),searchRadiusKm:PROFILE_SEARCH_RADIUS_M/1000}};
}

export async function mountainProfile(loc:Location,signal?:AbortSignal):Promise<MountainProfileResult>{try{return await directMountainProfile(loc,signal)}catch(error){if(signal?.aborted)throw error;const fallback=await derivedProfile(loc,signal);return{...fallback,diagnostics:{...fallback.diagnostics,error:error instanceof Error?error.message:String(error)}}}}
export function applyMountainProfile(loc:Location,config:MountainConfig,profile:MountainProfileResult):MountainConfig{const byRole=new Map(profile.levels.map(level=>[level.role,level])),valley=byRole.get('valley'),middle=byRole.get('middle'),summit=byRole.get('summit');if(!valley||!summit||summit.elevation<=valley.elevation)return config;const automatic=/OpenStreetMap|Copernicus/i.test(profile.source),next:MountainConfig={...config,middleEnabled:Boolean(middle),valleyElevation:Math.round(valley.elevation),middleElevation:Math.round(middle?.elevation??((valley.elevation+summit.elevation)/2)),summitElevation:Math.round(summit.elevation),valleyName:valley.name||'Talstation',middleName:middle?.name||'Mittelstation',summitName:summit.name||'Bergstation',valleyLatitude:valley.latitude,valleyLongitude:valley.longitude,middleLatitude:middle?.latitude??config.middleLatitude,middleLongitude:middle?.longitude??config.middleLongitude,summitLatitude:summit.latitude,summitLongitude:summit.longitude,profileSource:automatic?'osm-dem':'derived',profileConfidence:profile.confidence,profileUpdatedAt:profile.checkedAt||new Date().toISOString()};if(automatic&&!automaticConfigPlausible(loc,next))return{...defaultMountainConfig(loc),enabled:config.enabled,season:config.season};return next}
function configuredPoints(loc:Location,config:MountainConfig){const row=(role:MountainLevelRole,name:string,elevation:number,latitude:unknown,longitude:unknown)=>({role,name,latitude:finite(latitude)?Number(latitude):loc.latitude,longitude:finite(longitude)?Number(longitude):loc.longitude,elevation:Math.round(elevation)}),points=[row('valley',config.valleyName,config.valleyElevation,config.valleyLatitude,config.valleyLongitude)];if(config.middleEnabled&&config.middleElevation>config.valleyElevation&&config.middleElevation<config.summitElevation)points.push(row('middle',config.middleName,config.middleElevation,config.middleLatitude,config.middleLongitude));points.push(row('summit',config.summitName,config.summitElevation,config.summitLatitude,config.summitLongitude));return points}
export function mountainTimeEpoch(weather:MountainPointWeather,value:unknown){const match=String(value??'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);if(!match)return NaN;return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]),Number(match[6]||0))-Number(weather.utc_offset_seconds||0)*1000}
function nearestHourlyIndex(weather:MountainPointWeather){const times=(weather.hourly.time??[]) as string[];if(!times.length)return 0;const now=Date.now();return times.reduce((best,time,index)=>{const value=mountainTimeEpoch(weather,time),bestValue=mountainTimeEpoch(weather,times[best]);return Number.isFinite(value)&&Math.abs(value-now)<Math.abs(bestValue-now)?index:best},0)}
function currentValue(weather:MountainPointWeather,key:string){const current=Number(weather.current?.[key]);if(Number.isFinite(current))return current;const index=nearestHourlyIndex(weather),value=Number(weather.hourly?.[key]?.[index]);return Number.isFinite(value)?value:NaN}
function snowfallSums(weather:MountainPointWeather){const times=(weather.hourly.time??[]) as string[],snow=weather.hourly.snowfall??[],now=Date.now();let past24=0,next24=0,next48=0;for(let index=0;index<times.length;index++){const epoch=mountainTimeEpoch(weather,times[index]),value=Math.max(0,Number(snow[index])||0);if(!Number.isFinite(epoch))continue;const delta=(epoch-now)/3600000;if(delta>=-24&&delta<0)past24+=value;if(delta>=0&&delta<24)next24+=value;if(delta>=0&&delta<48)next48+=value}return{past24,next24,next48}}
function autoWinter(latitude:number,levels:MountainLevelForecast[]){const month=new Date().getMonth()+1,winterMonth=latitude>=0?(month>=11||month<=4):(month>=5&&month<=10);return winterMonth||levels.some(level=>level.modelSnowDepthCm>=1||level.pastSnow24Cm>=.2||level.newSnow48Cm>=.2)}


type GeoSphereSnowResponse={available?:boolean;valueCm?:number;stationName?:string;stationId?:string;stationElevation?:number;distanceKm?:number;heightDifferenceM?:number;observedAt?:string;provider?:string;error?:string};
async function geoSphereSnowMeasurement(point:{latitude:number;longitude:number;elevation:number},signal?:AbortSignal):Promise<MountainSnowMeasurement|undefined>{
 try{
  const response=await fetchWorkerJson<GeoSphereSnowResponse>('geosphere-snow',{lat:point.latitude,lon:point.longitude,elevation:point.elevation},{purpose:'general',signal,timeoutMs:11000});
  const value=Number(response.valueCm),distanceKm=Number(response.distanceKm),heightDifferenceM=Number(response.heightDifferenceM),observedAt=String(response.observedAt||'');
  if(!response.available||!Number.isFinite(value)||value<0||value>1000||!Number.isFinite(distanceKm)||distanceKm>25||!Number.isFinite(heightDifferenceM)||Math.abs(heightDifferenceM)>350||!Number.isFinite(Date.parse(observedAt))||Date.now()-Date.parse(observedAt)>3*3600000)return undefined;
  return{valueCm:value,stationName:String(response.stationName||'GeoSphere-Schneestation'),stationId:response.stationId,stationElevation:Number.isFinite(Number(response.stationElevation))?Number(response.stationElevation):undefined,distanceKm,heightDifferenceM,observedAt,provider:String(response.provider||'GeoSphere Austria')};
 }catch{return undefined}
}

export async function mountainSportsForecast(loc:Location,config:MountainConfig,signal?:AbortSignal):Promise<MountainSportsForecast>{
 const points=configuredPoints(loc,config),latitudes=points.map(point=>point.latitude).join(','),longitudes=points.map(point=>point.longitude).join(','),elevations=points.map(point=>point.elevation).join(','),variables=['temperature_2m','apparent_temperature','relative_humidity_2m','dew_point_2m','precipitation_probability','precipitation','rain','showers','snowfall','snow_depth','weather_code','cloud_cover','cloud_cover_low','visibility','freezing_level_height','wet_bulb_temperature_2m','wind_speed_10m','wind_gusts_10m','wind_direction_10m','uv_index','cape','is_day'],params=new URLSearchParams({latitude:latitudes,longitude:longitudes,elevation:elevations,timezone:'auto',forecast_hours:'72',past_hours:'24',models:'best_match',wind_speed_unit:'kn',current:variables.filter(key=>key!=='precipitation_probability').join(','),hourly:variables.join(',')}),response=await fetch(`${FORECAST_ENDPOINT}?${params}`,{signal,cache:'no-store'});if(!response.ok)throw new Error(`Höhenprognose HTTP ${response.status}`);const raw=await response.json() as MountainPointWeather[]|MountainPointWeather,rows=Array.isArray(raw)?raw:[raw];if(rows.length!==points.length)throw new Error('Die Höhenprognose lieferte nicht alle konfigurierten Niveaus.');const baseLevels=points.map((point,index)=>{const weather=rows[index],snowfall=snowfallSums(weather),depth=currentValue(weather,'snow_depth');return{...point,weather,modelSnowDepthCm:Number.isFinite(depth)?Math.max(0,depth*100):NaN,measuredSnowDepthCm:NaN,pastSnow24Cm:snowfall.past24,newSnow24Cm:snowfall.next24,newSnow48Cm:snowfall.next48} satisfies MountainLevelForecast}),measurements=await Promise.all(baseLevels.map(level=>geoSphereSnowMeasurement(level,signal))),levels=baseLevels.map((level,index)=>{const snowMeasurement=measurements[index];return{...level,measuredSnowDepthCm:snowMeasurement?.valueCm??NaN,snowMeasurement}}),season=config.season==='auto'?(autoWinter(loc.latitude,levels)?'winter':'summer'):config.season;return{levels,season,source:'Open-Meteo Best Match · höhenbezogene Koordinaten und Höhen · GeoSphere-Schneemessung bei strenger Nähe-/Höhen-/Aktualitätsprüfung'};
}

export function mountainLevelLabel(role:MountainLevelRole){return role==='valley'?'Tal':role==='middle'?'Mitte':'Berg'}
export function mountainSeasonLabel(value:MountainSeason|Exclude<MountainSeason,'auto'>){return value==='summer'?'Sommer':value==='winter'?'Winter':'Automatisch'}
export function mountainProfileSourceLabel(config:MountainConfig){if(config.profileSource==='manual')return'Manuell angepasst';if(config.profileSource==='osm-dem')return`Automatisch · ${config.profileConfidence==='high'?'hohe':config.profileConfidence==='medium'?'mittlere':'geringe'} Sicherheit`;return'Abgeleitete Ausgangswerte'}
export function mountainCurrentValue(level:MountainLevelForecast,key:string){return currentValue(level.weather,key)}
