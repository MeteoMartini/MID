import {forecast,icon,label,mapHours,type Hour,type Location} from './weather';
import {precipitationParts,type PrecipType} from './precipitation';

export type RouteProfile='car'|'bike'|'foot';
export type RouteRestrictionLevel='none'|'low'|'moderate'|'high'|'critical';
export type RouteMapMode='line'|'segments'|'corridor';

export type RouteCheckpointWeather={
 code:number;
 displayCode:number;
 icon:string;
 label:string;
 precipType:PrecipType;
 precipLabel:string;
 precipitation:number;
 precipitationProbability:number;
 temperature:number;
 apparent:number;
 wind:number;
 gust:number;
 direction:number;
 visibility:number;
 isDay:boolean;
};

export type RouteCheckpoint={
 id:string;
 name:string;
 fraction:number;
 latitude:number;
 longitude:number;
 distanceKm:number;
 elapsedMinutes:number;
 etaIso:string;
 weather:RouteCheckpointWeather;
 restriction:{level:RouteRestrictionLevel;score:number;headline:string;reasons:string[]};
};

export type RouteAssessment={
 level:RouteRestrictionLevel;
 headline:string;
 summary:string;
 impacts:string[];
 limitations:string[];
};

export type RouteWeatherResult={
 start:Location;
 destination:Location;
 departureIso:string;
 arrivalIso:string;
 distanceKm:number;
 durationMinutes:number;
 speedKmh:number;
 checkpoints:RouteCheckpoint[];
 assessment:RouteAssessment;
};

const ROUTE_LEVEL_ORDER:RouteRestrictionLevel[]=['none','low','moderate','high','critical'];
const ROUTE_LEVEL_LABEL:Record<RouteRestrictionLevel,string>={none:'keine nennenswerten Einschränkungen',low:'geringe Einschränkungen',moderate:'mäßige Einschränkungen',high:'deutliche Einschränkungen',critical:'kritische Einschränkungen'};

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value));}
function levelFromScore(score:number):RouteRestrictionLevel{return ROUTE_LEVEL_ORDER[clamp(Math.round(score),0,4)]}
function formatKm(value:number){return new Intl.NumberFormat('de-DE',{minimumFractionDigits:value>=100?0:1,maximumFractionDigits:value>=100?0:1}).format(value)}
function formatLocalIso(value:string){const date=new Date(value),pad=(n:number)=>String(n).padStart(2,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`}
export {formatLocalIso};

export function haversineKm(lat1:number,lon1:number,lat2:number,lon2:number){
 const r=6371,toRad=(x:number)=>x*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
 return 2*r*Math.asin(Math.sqrt(a));
}

function interpolateCoordinate(start:number,end:number,fraction:number){return start+(end-start)*fraction}
function chooseCheckpointCount(distanceKm:number,durationMinutes:number,sampleMinutes:number){
 const temporal=Math.ceil(durationMinutes/Math.max(15,sampleMinutes))+1;
 const spatial=distanceKm<60?3:distanceKm<180?4:distanceKm<320?5:distanceKm<520?6:7;
 return clamp(Math.max(spatial,temporal),3,9);
}

function nearestHour(hours:Hour[],targetMs:number){
 if(!hours.length)return null;
 let best=hours[0],bestDelta=Math.abs(hours[0].epoch-targetMs);
 for(let index=1;index<hours.length;index++){
  const candidate=hours[index],delta=Math.abs(candidate.epoch-targetMs);
  if(delta<bestDelta){best=candidate;bestDelta=delta;}
 }
 return best;
}

function directionSector(direction:number){
 const sectors=['N','NO','O','SO','S','SW','W','NW'];
 return sectors[Math.round((((direction%360)+360)%360)/45)%8];
}

function assessCheckpoint(hour:Hour){
 const precipitation=precipitationParts({
  time:hour.time,
  epoch:hour.epoch,
  timezone:hour.timezone,
  precipitation:hour.precipitation,
  rain:hour.rain,
  showers:hour.showers,
  snowfall:hour.snowfall,
  probability:hour.probability,
  code:hour.code,
  temperature:hour.temperature,
  humidity:hour.humidity,
  cloud:hour.cloud,
  lowCloud:hour.lowCloud
 });
 const displayCode=precipitation.displayCode;
 const displayLabel=precipitation.type==='none'?label(displayCode):precipitation.weatherLabel;
 const reasons:string[]=[];
 let score=0;

 if(precipitation.type==='thunderstorm'||precipitation.type==='thunderstormHail'){score=Math.max(score,4);reasons.push('Gewitterrisiko');}
 if(precipitation.type==='snow'||precipitation.type==='snowShowers'||precipitation.type==='snowGrains'){score=Math.max(score,3);reasons.push('Schnee / winterliche Fahrbahnbedingungen');}
 if(precipitation.type==='sleet'||precipitation.type==='sleetShowers'||precipitation.type==='freezingRain'||precipitation.type==='freezingDrizzle'){score=Math.max(score,4);reasons.push('Glättegefahr durch gefrierenden oder gemischten Niederschlag');}
 if(hour.precipitation>=8){score=Math.max(score,3);reasons.push('kräftiger Niederschlag');}
 else if(hour.precipitation>=2){score=Math.max(score,2);reasons.push('nasser Fahrbahnabschnitt');}
 else if(hour.precipitation>=0.2||hour.probability>=70){score=Math.max(score,1);reasons.push('mögliche Niederschläge');}
 if(hour.gust>=45){score=Math.max(score,4);reasons.push('stürmische Böen');}
 else if(hour.gust>=35){score=Math.max(score,3);reasons.push('starke Böen');}
 else if(hour.gust>=25){score=Math.max(score,2);reasons.push('böiger Wind');}
 if(hour.visibility>0&&hour.visibility<1000){score=Math.max(score,4);reasons.push('stark eingeschränkte Sicht');}
 else if(hour.visibility>0&&hour.visibility<4000){score=Math.max(score,2);reasons.push('eingeschränkte Sicht');}
 if(hour.temperature<=0&&hour.precipitation>0){score=Math.max(score,4);if(!reasons.includes('Glättegefahr durch gefrierenden oder gemischten Niederschlag'))reasons.push('Glättegefahr');}
 const level=levelFromScore(score);
 return{
  level,
  score,
  headline:ROUTE_LEVEL_LABEL[level],
  reasons:reasons.length?reasons:['unauffällige Wetterlage'],
  weather:{
   code:hour.code,
   displayCode,
   icon:icon(displayCode,hour.isDay),
   label:displayLabel,
   precipType:precipitation.type,
   precipLabel:precipitation.label,
   precipitation:hour.precipitation,
   precipitationProbability:hour.probability,
   temperature:hour.temperature,
   apparent:hour.apparent,
   wind:hour.wind,
   gust:hour.gust,
   direction:hour.direction,
   visibility:hour.visibility,
   isDay:hour.isDay
  }
 };
}

function summariseAssessment(distanceKm:number,durationMinutes:number,checkpoints:RouteCheckpoint[]):RouteAssessment{
 const maxScore=Math.max(...checkpoints.map(point=>point.restriction.score),0);
 const level=levelFromScore(maxScore);
 const criticalPoints=checkpoints.filter(point=>point.restriction.score>=2);
 const impacts=(criticalPoints.length?criticalPoints:checkpoints.filter(point=>point.restriction.score>=1)).slice(0,4).map(point=>`${point.name}: ${point.restriction.reasons.join(', ')}`);
 const limitations=[
  'Schematische Route als Luftlinie zwischen Start und Ziel; tatsächlicher Straßenverlauf, Tunnel und Exposition können abweichen.',
  'Niederschlag und Gewitter sind entlang der Route räumlich und zeitlich unsicher, besonders bei Schauern und Konvektion.',
  'Die Bewertung nutzt Modellgitterpunkte an Stichproben entlang der Strecke und ersetzt keine amtliche Straßen- oder Reiseinformation.'
 ];
 if(distanceKm>250)limitations.push('Längere Route: lokale Unterschiede zwischen einzelnen Streckenabschnitten nehmen zu.');
 if(durationMinutes>240)limitations.push('Lange Fahrtdauer: die zeitliche Unsicherheit steigt im späteren Routenabschnitt zusätzlich an.');
 return{
  level,
  headline:ROUTE_LEVEL_LABEL[level],
  summary:`${criticalPoints.length?`${criticalPoints.length} kritische(r) bzw. markante(r) Abschnitt(e)`:'Keine markanten Problemabschnitte'} auf ${formatKm(distanceKm)} km Routenlänge.`,
  impacts:impacts.length?impacts:['Keine relevanten wetterbedingten Einschränkungen entlang der Stichprobenpunkte erkannt.'],
  limitations
 };
}

export function routeLevelColor(level:RouteRestrictionLevel){
 return({none:'#169b62',low:'#4b8dff',moderate:'#d69a00',high:'#e85d24',critical:'#c81e1e'} as Record<RouteRestrictionLevel,string>)[level];
}

export function routeLevelClass(level:RouteRestrictionLevel){return `route-level-${level}`}

export async function loadRouteWeather(start:Location,destination:Location,departureIso:string,speedKmh:number,sampleMinutes=20,signal?:AbortSignal):Promise<RouteWeatherResult>{
 const safeSpeed=Math.max(4,Math.min(140,Number(speedKmh)||90));
 const distanceKm=Math.max(1,haversineKm(start.latitude,start.longitude,destination.latitude,destination.longitude));
 const durationMinutes=Math.max(20,Math.round(distanceKm/safeSpeed*60));
 const checkpointCount=chooseCheckpointCount(distanceKm,durationMinutes,sampleMinutes);
 const departureTime=new Date(departureIso);
 const points=Array.from({length:checkpointCount},(_,index)=>{
  const fraction=index/(checkpointCount-1);
  const latitude=interpolateCoordinate(start.latitude,destination.latitude,fraction);
  const longitude=interpolateCoordinate(start.longitude,destination.longitude,fraction);
  const etaIso=new Date(departureTime.getTime()+durationMinutes*60000*fraction).toISOString();
  return{fraction,latitude,longitude,etaIso,distanceKm:distanceKm*fraction,elapsedMinutes:Math.round(durationMinutes*fraction)};
 });
 const forecasts=await Promise.all(points.map(point=>forecast(point.latitude,point.longitude,signal)));
 const checkpoints=points.map((point,index)=>{
  const weather=forecasts[index],hours=mapHours(weather),hour=nearestHour(hours,new Date(point.etaIso).getTime());
  if(!hour)throw new Error('Stundenprognose entlang der Route konnte nicht bestimmt werden.');
  const assessed=assessCheckpoint(hour);
  return{
   id:`route-point-${index}`,
   name:index===0?'Start':index===points.length-1?'Ziel':`Abschnitt ${index}`,
   fraction:point.fraction,
   latitude:point.latitude,
   longitude:point.longitude,
   distanceKm:point.distanceKm,
   elapsedMinutes:point.elapsedMinutes,
   etaIso:point.etaIso,
   weather:assessed.weather,
   restriction:{level:assessed.level,score:assessed.score,headline:assessed.headline,reasons:assessed.reasons}
  } satisfies RouteCheckpoint;
 });
 const assessment=summariseAssessment(distanceKm,durationMinutes,checkpoints);
 return{
  start,
  destination,
  departureIso:new Date(departureIso).toISOString(),
  arrivalIso:new Date(departureTime.getTime()+durationMinutes*60000).toISOString(),
  distanceKm,
  durationMinutes,
  speedKmh:safeSpeed,
  checkpoints,
  assessment
 };
}

export function formatRouteWind(direction:number,wind:number,gust:number){
 return `${Math.round(direction)}° ${directionSector(direction)} · ${Math.round(wind)} kt${gust>wind?` · Böen ${Math.round(gust)} kt`:''}`;
}
