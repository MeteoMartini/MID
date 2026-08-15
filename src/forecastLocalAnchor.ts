import {precipitationParts} from './precipitation';
import {stationFieldObservationUsable,type Station,type Weather} from './weather';
import type {ForecastLocalAnchor,ForecastLocalAnchorField} from './forecastFusion';

function finite(value:unknown){const number=Number(value);return Number.isFinite(number)?number:undefined}
function currentNumber(current:Weather['current'],key:string){return finite(current[key])}
function stationWindKnots(value:number|undefined,unit:Station['windUnit']){const number=finite(value);return number===undefined?undefined:unit==='kmh'?number/1.852:number}
function observedSkyCode(fallback:number,cloud:number|undefined,lowCloud:number|undefined,visibility:number|undefined,humidity:number|undefined,temperature:number|undefined){
 const code=Math.round(Number(fallback)||0),vis=Number(visibility),hum=Number(humidity),temp=Number(temperature),cover=Math.max(Number(cloud)||0,Number(lowCloud)||0);
 if(Number.isFinite(vis)&&vis<=1000&&Number.isFinite(hum)&&hum>=92)return Number.isFinite(temp)&&temp<=0?48:45;
 if((code===45||code===48)&&Number.isFinite(vis)&&vis<=2500)return code;
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
 const parts=precipitationParts({precipitation:precipitation??0,rain,showers,snowfall,probability:0,code:baseCode,temperature,dewPoint,humidity,cloud,lowCloud,cloudBaseHft:cloudBaseUsable?finite(station?.cloudBaseHft):undefined,ceilingHft:ceilingUsable?finite(station?.ceilingHft):undefined}),code=parts.type==='none'?observedSkyCode(parts.displayCode,cloud,lowCloud,visibility,humidity,temperature):parts.displayCode;
 observed.code=Boolean(observed.cloud||observed.lowCloud||observed.visibility||observed.precipitation);
 const active=Object.entries(observed).some(([field,value])=>field!=='apparent'&&value),ownStation=Boolean(station?.provider?.startsWith('Eigene ')||station?.analysisMethod?.startsWith('Eigene ')),sourceLabel=active?(ownStation?'Eigene Station · lokal angepasst':station?.analysisMethod?'Hyperlokal angepasst':'Stationsgestützt angepasst'):'Best Match';
 return{active,sourceLabel,observed,temperature,apparent,humidity,dewPoint,pressure,wind,gust,direction,cloud,lowCloud,visibility,precipitation,precipitationMinutes,rain,showers,snowfall,cloudBaseHft:cloudBaseUsable?finite(station?.cloudBaseHft):undefined,ceilingHft:ceilingUsable?finite(station?.ceilingHft):undefined,code,isDay:Number(current.is_day)===1};
}
