import {icon,label,type Location,type WindUnit} from './weather';

export type RouteProfile='car'|'bike'|'foot';
export type RouteWeatherSeverity='ok'|'notice'|'warning'|'danger';
export type RouteCoordinate=[number,number];
export type RouteWeatherPoint={
 index:number;
 progress:number;
 latitude:number;
 longitude:number;
 distanceKm:number;
 arrivalEpoch:number;
 locationLabel:string;
 temperature:number;
 apparentTemperature:number;
 precipitationProbability:number;
 precipitation:number;
 rain:number;
 showers:number;
 snowfall:number;
 weatherCode:number;
 isDay:boolean;
 windSpeedKt:number;
 windGustKt:number;
 visibilityM:number;
 severity:RouteWeatherSeverity;
 signals:string[];
};
export type RouteWeatherResult={
 profile:RouteProfile;
 provider:string;
 weatherProvider:string;
 distanceKm:number;
 durationSeconds:number;
 departureEpoch:number;
 arrivalEpoch:number;
 geometry:RouteCoordinate[];
 points:RouteWeatherPoint[];
 severity:RouteWeatherSeverity;
 summary:string;
 checkedAt:string;
};

type OsrmRoute={distance?:number;duration?:number;geometry?:{coordinates?:number[][]}};
type OsrmResponse={code?:string;message?:string;routes?:OsrmRoute[]};
type RouteSample={progress:number;latitude:number;longitude:number;distanceKm:number;arrivalEpoch:number;locationLabel:string};
type OpenMeteoHourly={time?:number[];temperature_2m?:number[];apparent_temperature?:number[];precipitation_probability?:number[];precipitation?:number[];rain?:number[];showers?:number[];snowfall?:number[];weather_code?:number[];is_day?:number[];wind_speed_10m?:number[];wind_gusts_10m?:number[];visibility?:number[]};
type OpenMeteoRouteWeather={hourly?:OpenMeteoHourly};

const PROFILE_ENDPOINTS:Record<RouteProfile,string[]>={
 car:['https://routing.openstreetmap.de/routed-car/route/v1/driving','https://router.project-osrm.org/route/v1/driving'],
 bike:['https://routing.openstreetmap.de/routed-bike/route/v1/driving'],
 foot:['https://routing.openstreetmap.de/routed-foot/route/v1/driving']
};
const PROFILE_LABELS:Record<RouteProfile,string>={car:'Auto',bike:'Fahrrad',foot:'Zu Fuß'};
const SEVERITY_RANK:Record<RouteWeatherSeverity,number>={ok:0,notice:1,warning:2,danger:3};

function finite(value:unknown,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
function haversine(a:RouteCoordinate,b:RouteCoordinate){const r=6371000,toRad=(value:number)=>value*Math.PI/180,dLat=toRad(b[1]-a[1]),dLon=toRad(b[0]-a[0]),x=Math.sin(dLat/2)**2+Math.cos(toRad(a[1]))*Math.cos(toRad(b[1]))*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(x))}
function abortError(){return new DOMException('Routenberechnung abgebrochen.','AbortError')}
async function fetchJson<T>(url:string,signal?:AbortSignal,timeoutMs=16000):Promise<T>{
 const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),timeoutMs),abort=()=>controller.abort();
 signal?.addEventListener('abort',abort,{once:true});
 try{const response=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`HTTP ${response.status}`);return await response.json() as T}catch(error){if(signal?.aborted)throw abortError();if(controller.signal.aborted)throw new Error('Zeitüberschreitung beim Abruf.');throw error}finally{window.clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
function routeUrl(base:string,start:Location,destination:Location){const coordinates=`${start.longitude},${start.latitude};${destination.longitude},${destination.latitude}`,params=new URLSearchParams({overview:'full',geometries:'geojson',steps:'false',alternatives:'false'});return`${base}/${coordinates}?${params}`}
async function loadRoute(start:Location,destination:Location,profile:RouteProfile,signal?:AbortSignal){
 const errors:string[]=[];
 for(const endpoint of PROFILE_ENDPOINTS[profile])try{const data=await fetchJson<OsrmResponse>(routeUrl(endpoint,start,destination),signal);const route=data.routes?.[0],coordinates=(route?.geometry?.coordinates??[]).map(row=>[finite(row[0],NaN),finite(row[1],NaN)] as RouteCoordinate).filter(row=>Number.isFinite(row[0])&&Number.isFinite(row[1]));if(data.code!=='Ok'||!route||coordinates.length<2||!Number.isFinite(route.distance)||!Number.isFinite(route.duration))throw new Error(data.message||'Keine auswertbare Route.');return{distanceMeters:Number(route.distance),durationSeconds:Number(route.duration),coordinates,provider:new URL(endpoint).hostname}}catch(error){if(signal?.aborted)throw error;errors.push(`${new URL(endpoint).hostname}: ${error instanceof Error?error.message:String(error)}`)}
 throw new Error(`Route konnte nicht berechnet werden. ${errors.join(' · ')}`);
}
function cumulativeDistances(coordinates:RouteCoordinate[]){const cumulative=[0];for(let index=1;index<coordinates.length;index++)cumulative.push(cumulative[index-1]+haversine(coordinates[index-1],coordinates[index]));return cumulative}
function pointAtDistance(coordinates:RouteCoordinate[],cumulative:number[],target:number):RouteCoordinate{let index=1;while(index<cumulative.length&&cumulative[index]<target)index++;if(index>=cumulative.length)return coordinates.at(-1)!;const before=cumulative[index-1],after=cumulative[index],ratio=after>before?(target-before)/(after-before):0,a=coordinates[index-1],b=coordinates[index];return[a[0]+(b[0]-a[0])*ratio,a[1]+(b[1]-a[1])*ratio]}
function routeSamples(coordinates:RouteCoordinate[],distanceMeters:number,durationSeconds:number,departureEpoch:number,startName:string,destinationName:string,sampleMinutes:number){
 const requested=Math.ceil(durationSeconds/Math.max(10,sampleMinutes*60))+1,count=Math.max(3,Math.min(9,requested)),cumulative=cumulativeDistances(coordinates),geometryDistance=cumulative.at(-1)||distanceMeters;
 return Array.from({length:count},(_,index)=>{const progress=count===1?0:index/(count-1),coordinate=pointAtDistance(coordinates,cumulative,geometryDistance*progress),locationLabel=index===0?startName:index===count-1?destinationName:`Route · ${Math.round(progress*100)} %`;return{progress,longitude:coordinate[0],latitude:coordinate[1],distanceKm:distanceMeters*progress/1000,arrivalEpoch:departureEpoch+durationSeconds*1000*progress,locationLabel} satisfies RouteSample});
}
function nearestIndex(times:number[]|undefined,targetSeconds:number){if(!times?.length)return-1;let best=0,distance=Number.POSITIVE_INFINITY;for(let index=0;index<times.length;index++){const current=Math.abs(Number(times[index])-targetSeconds);if(current<distance){distance=current;best=index}}return best}
function signalAssessment(values:{weatherCode:number;precipitationProbability:number;precipitation:number;snowfall:number;windGustKt:number;visibilityM:number}){
 const signals:string[]=[],code=values.weatherCode;let severity:RouteWeatherSeverity='ok';const raise=(next:RouteWeatherSeverity)=>{if(SEVERITY_RANK[next]>SEVERITY_RANK[severity])severity=next};
 if([95,96,97,99].includes(code)){signals.push('Gewitter möglich');raise('danger')}
 if(values.snowfall>=.2||[71,73,75,77,85,86].includes(code)){signals.push('Schnee/Glätte möglich');raise(values.snowfall>=1?'danger':'warning')}
 if(values.precipitationProbability>=70||values.precipitation>=2){signals.push(`Niederschlag ${Math.round(values.precipitationProbability)} %`);raise(values.precipitation>=5?'danger':'warning')}
 else if(values.precipitationProbability>=40||values.precipitation>=.2){signals.push(`Schauerchance ${Math.round(values.precipitationProbability)} %`);raise('notice')}
 if(values.windGustKt>=40){signals.push(`Sturmböen ${Math.round(values.windGustKt)} kt`);raise('danger')}
 else if(values.windGustKt>=28){signals.push(`Böen ${Math.round(values.windGustKt)} kt`);raise('warning')}
 else if(values.windGustKt>=20){signals.push(`Böig ${Math.round(values.windGustKt)} kt`);raise('notice')}
 if(values.visibilityM>0&&values.visibilityM<1000){signals.push('Sehr geringe Sicht');raise('danger')}
 else if(values.visibilityM>0&&values.visibilityM<4000){signals.push('Eingeschränkte Sicht');raise('warning')}
 if(!signals.length)signals.push('Keine markante Wetterbelastung');
 return{severity,signals};
}
function routeSummary(points:RouteWeatherPoint[],severity:RouteWeatherSeverity){const wet=points.filter(point=>point.precipitationProbability>=50||point.precipitation>=.2),windy=points.filter(point=>point.windGustKt>=28),thunder=points.filter(point=>[95,96,97,99].includes(point.weatherCode)),snow=points.filter(point=>point.snowfall>=.2||[71,73,75,77,85,86].includes(point.weatherCode));if(thunder.length)return'Gewitterrisiko auf mindestens einem Streckenabschnitt.';if(snow.length)return'Schnee- oder Glätterisiko entlang der Route.';if(severity==='danger')return'Markante Wetterbelastung auf der Route.';if(wet.length&&windy.length)return'Abschnittsweise nass und böig.';if(wet.length)return'Abschnittsweise Niederschlag wahrscheinlich.';if(windy.length)return'Abschnittsweise kräftige Böen.';if(severity==='notice')return'Leichte wetterbedingte Einschränkungen möglich.';return'Überwiegend unauffälliges Routenwetter.'}
function formatProfile(profile:RouteProfile){return PROFILE_LABELS[profile]}
export function routeProfileLabel(profile:RouteProfile){return formatProfile(profile)}
export function routeWeatherIcon(point:RouteWeatherPoint){return icon(point.weatherCode,point.isDay)}
export function routeWeatherLabel(point:RouteWeatherPoint){return label(point.weatherCode)}
export function windValueFromKt(value:number,unit:WindUnit){if(!Number.isFinite(value))return'–';if(unit==='kmh')return`${Math.round(value*1.852)} km/h`;if(unit==='ms')return`${new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(value*.514444)} m/s`;if(unit==='mph')return`${Math.round(value*1.15078)} mph`;return`${Math.round(value)} kt`}

export async function calculateRouteWeather(start:Location,destination:Location,departureEpoch:number,profile:RouteProfile,sampleMinutes:number,signal?:AbortSignal):Promise<RouteWeatherResult>{
 if(!Number.isFinite(departureEpoch))throw new Error('Bitte eine gültige Abfahrtszeit wählen.');
 const horizon=departureEpoch-Date.now();if(horizon<-60*60000)throw new Error('Die Abfahrtszeit liegt zu weit in der Vergangenheit.');if(horizon>7*86400000)throw new Error('Routenwetter ist derzeit bis sieben Tage im Voraus verfügbar.');
 const route=await loadRoute(start,destination,profile,signal),samples=routeSamples(route.coordinates,route.distanceMeters,route.durationSeconds,departureEpoch,start.name,destination.name,sampleMinutes),params=new URLSearchParams({latitude:samples.map(sample=>sample.latitude.toFixed(5)).join(','),longitude:samples.map(sample=>sample.longitude.toFixed(5)).join(','),timezone:'GMT',timeformat:'unixtime',forecast_days:'8',models:'best_match',wind_speed_unit:'kn',hourly:['temperature_2m','apparent_temperature','precipitation_probability','precipitation','rain','showers','snowfall','weather_code','is_day','wind_speed_10m','wind_gusts_10m','visibility'].join(',')});
 const raw=await fetchJson<OpenMeteoRouteWeather[]|OpenMeteoRouteWeather>(`https://api.open-meteo.com/v1/forecast?${params}`,signal,18000),weatherRows=Array.isArray(raw)?raw:[raw];if(weatherRows.length!==samples.length)throw new Error('Wetterdaten entlang der Route waren unvollständig.');
 const points=samples.map((sample,index)=>{const hourly=weatherRows[index]?.hourly??{},timeIndex=nearestIndex(hourly.time,Math.round(sample.arrivalEpoch/1000));if(timeIndex<0)throw new Error('Keine passende Stundenprognose für einen Routenabschnitt.');const weatherCode=finite(hourly.weather_code?.[timeIndex]),precipitationProbability=finite(hourly.precipitation_probability?.[timeIndex]),precipitation=finite(hourly.precipitation?.[timeIndex]),snowfall=finite(hourly.snowfall?.[timeIndex]),windGustKt=finite(hourly.wind_gusts_10m?.[timeIndex]),visibilityM=finite(hourly.visibility?.[timeIndex],100000),assessment=signalAssessment({weatherCode,precipitationProbability,precipitation,snowfall,windGustKt,visibilityM});return{index,progress:sample.progress,latitude:sample.latitude,longitude:sample.longitude,distanceKm:sample.distanceKm,arrivalEpoch:sample.arrivalEpoch,locationLabel:sample.locationLabel,temperature:finite(hourly.temperature_2m?.[timeIndex]),apparentTemperature:finite(hourly.apparent_temperature?.[timeIndex]),precipitationProbability,precipitation,rain:finite(hourly.rain?.[timeIndex]),showers:finite(hourly.showers?.[timeIndex]),snowfall,weatherCode,isDay:finite(hourly.is_day?.[timeIndex],1)===1,windSpeedKt:finite(hourly.wind_speed_10m?.[timeIndex]),windGustKt,visibilityM,severity:assessment.severity,signals:assessment.signals} satisfies RouteWeatherPoint});
 const severity=points.reduce<RouteWeatherSeverity>((current,point)=>SEVERITY_RANK[point.severity]>SEVERITY_RANK[current]?point.severity:current,'ok');
 return{profile,provider:route.provider,weatherProvider:'Open-Meteo Best Match',distanceKm:route.distanceMeters/1000,durationSeconds:route.durationSeconds,departureEpoch,arrivalEpoch:departureEpoch+route.durationSeconds*1000,geometry:route.coordinates,points,severity,summary:routeSummary(points,severity),checkedAt:new Date().toISOString()};
}
