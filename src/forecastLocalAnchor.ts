import {precipitationParts} from './precipitation';
import {stationFieldObservationUsable,type Station,type Weather} from './weather';
import type {ForecastLocalAnchor,ForecastLocalAnchorField} from './forecastFusion';
import {classifyVisibilityPhenomenon,parseReportedVisibilityPhenomenon} from './visibilityPhenomena';

function finite(value:unknown){const number=Number(value);return Number.isFinite(number)?number:undefined}
function currentNumber(current:Weather['current'],key:string){return finite(current[key])}
function stationWindKnots(value:number|undefined,unit:Station['windUnit']){const number=finite(value);return number===undefined?undefined:unit==='kmh'?number/1.852:number}
function trustedPresentWeather(station:Station|null|undefined,now:number){
 const report=parseReportedVisibilityPhenomenon(station?.presentWeather);if(!report)return false;
 const network=station?.networkClass,provider=String(station?.provider||''),trusted=network==='official'||network==='professional'||/dwd|metar|aviationweather|wmo|geosphere|meteoswiss|knmi|hyperlokalanalyse/i.test(provider);
 const observedAt=Date.parse(String(station?.timestamp||'')),ageMinutes=Number.isFinite(observedAt)?Math.max(0,(now-observedAt)/60000):Infinity,distanceM=Number(station?.distance),distanceKm=Number.isFinite(distanceM)?Math.max(0,distanceM/1000):Infinity,localLimitKm=report.geometryException?15:report.kind==='fog'||report.kind==='freezing-fog'?20:25;
 return trusted&&ageMinutes<=120&&distanceKm<=localLimitKm;
}
function observedSkyCode(fallback:number,cloud:number|undefined,lowCloud:number|undefined,visibility:number|undefined,humidity:number|undefined,temperature:number|undefined,dewPoint:number|undefined,presentWeather:string|undefined,trustPresentWeather:boolean){
 const covers=[cloud,lowCloud].map(value=>value===null||value===undefined||String(value).trim()===''?Number.NaN:Number(value)).filter(Number.isFinite),cover=covers.length?Math.max(...covers):Number.NaN,visibilityState=classifyVisibilityPhenomenon({weatherCode:fallback,visibility,humidity,temperature,dewPoint,presentWeather,trustPresentWeather});
 if(visibilityState.displayCode!==undefined)return visibilityState.displayCode;
 if(!Number.isFinite(cover))return 2;
 if(cover>=87.5)return 3;if(cover>=37.5)return 2;if(cover>=12.5)return 1;return 0;
}

/**
 * Gemeinsamer Beobachtungsanker für die operative MID-Prognose.
 * Nur feldbezogen verwendbare Messwerte werden als echte lokale Evidenz markiert;
 * Modell-/Current-Fallbacks bleiben Referenzwerte und lösen keine Korrektur aus.
 */
export function forecastLocalAnchorFromCurrent(station:Station|null|undefined,current:Weather['current'],now=Date.now(),elevation?:number):ForecastLocalAnchor{
 const observed:Partial<Record<ForecastLocalAnchorField,boolean>>={},usable=(field:Parameters<typeof stationFieldObservationUsable>[1])=>stationFieldObservationUsable(station,field,now,elevation),useStation=(displayField:ForecastLocalAnchorField,analysisField:Parameters<typeof stationFieldObservationUsable>[1],value:unknown)=>{const available=usable(analysisField)&&finite(value)!==undefined;observed[displayField]=available;return available?finite(value):undefined};
 const modelTemperature=currentNumber(current,'temperature_2m'),stationTemperature=useStation('temperature','temperature',station?.temperature),temperature=stationTemperature??modelTemperature;
 const apparent=currentNumber(current,'apparent_temperature');observed.apparent=false;
 const stationHumidity=useStation('humidity','humidity',station?.humidity),humidity=stationHumidity??currentNumber(current,'relative_humidity_2m');
 const stationDewPoint=useStation('dewPoint','dewPoint',station?.dewPoint),dewPoint=stationDewPoint??currentNumber(current,'dew_point_2m');
 const qffPressure=Boolean(usable('pressure')&&(station?.pressureReference==='QFF'||station?.pressureReference==='MSL')&&Number(station?.pressure)>=870&&Number(station?.pressure)<=1085),pressure=qffPressure?Number(station?.pressure):currentNumber(current,'pressure_msl');observed.pressure=qffPressure;
 const stationWind=stationWindKnots(station?.windSpeed,station?.windUnit),stationGust=stationWindKnots(station?.windGust,station?.windUnit),windUsable=usable('windSpeed'),gustUsable=usable('windGust'),wind=windUsable&&stationWind!==undefined?stationWind:currentNumber(current,'wind_speed_10m'),gust=gustUsable&&stationGust!==undefined?stationGust:currentNumber(current,'wind_gusts_10m');observed.wind=Boolean(windUsable&&stationWind!==undefined);observed.gust=Boolean(gustUsable&&stationGust!==undefined);
 const stationDirection=useStation('direction','windDirection',station?.windDirection),direction=stationDirection??currentNumber(current,'wind_direction_10m');
 const stationCloud=useStation('cloud','cloudCover',station?.cloudCover),cloud=stationCloud??currentNumber(current,'cloud_cover'),modelLowCloud=currentNumber(current,'cloud_cover_low'),ceilingUsable=usable('ceilingHft'),cloudBaseUsable=usable('cloudBaseHft'),lowLayerObserved=Boolean(stationCloud!==undefined&&((ceilingUsable&&Number(station?.ceilingHft)<=30)||(cloudBaseUsable&&Number(station?.cloudBaseHft)<=30)||(Number(humidity)>=92&&Number(cloud)>=87.5))),lowCloud=lowLayerObserved?Math.max(Number(stationCloud),Number(modelLowCloud)||0):modelLowCloud;observed.lowCloud=lowLayerObserved;
 const stationVisibility=useStation('visibility','visibility',station?.visibility),visibility=stationVisibility??currentNumber(current,'visibility');
 const stationPrecipitation=useStation('precipitation','precipitation',station?.precipitation),precipitation=stationPrecipitation??currentNumber(current,'precipitation'),precipitationMinutes=stationPrecipitation!==undefined?Math.max(1,Number(station?.precipitationMinutes)||60):60;
 const rain=currentNumber(current,'rain')??0,showers=currentNumber(current,'showers')??0,snowfall=currentNumber(current,'snowfall')??0,baseCode=currentNumber(current,'weather_code')??0;
 const parts=precipitationParts({precipitation:precipitation??0,rain,showers,snowfall,probability:0,code:baseCode,temperature,dewPoint,humidity,cloud,lowCloud,cloudBaseHft:cloudBaseUsable?finite(station?.cloudBaseHft):undefined,ceilingHft:ceilingUsable?finite(station?.ceilingHft):undefined}),code=parts.type==='none'?observedSkyCode(parts.displayCode,cloud,lowCloud,visibility,humidity,temperature,dewPoint,station?.presentWeather,trustedPresentWeather(station,now)):parts.displayCode;
 observed.code=Boolean(observed.cloud||observed.lowCloud||observed.visibility||observed.precipitation);
 const active=Object.entries(observed).some(([field,value])=>field!=='apparent'&&value),ownStation=Boolean(station?.provider?.startsWith('Eigene ')||station?.analysisMethod?.startsWith('Eigene ')),sourceLabel=active?(ownStation?'Eigene Station · lokal angepasst':station?.analysisMethod?'Hyperlokal angepasst':'Stationsgestützt angepasst'):'Best Match';
 return{active,sourceLabel,observed,temperature,apparent,humidity,dewPoint,pressure,wind,gust,direction,cloud,lowCloud,visibility,precipitation,precipitationMinutes,rain,showers,snowfall,cloudBaseHft:cloudBaseUsable?finite(station?.cloudBaseHft):undefined,ceilingHft:ceilingUsable?finite(station?.ceilingHft):undefined,code,isDay:Number(current.is_day)===1};
}
