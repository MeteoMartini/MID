import {useEffect,useMemo,useState} from 'react';
import {CloudFog,CloudLightning,Droplets,Gauge,Navigation,Thermometer,Wind as WindIcon} from 'lucide-react';
import {significantHourlyThunderRisk} from './detailThunderRisk';
import {precipitationAmountLabel,precipitationParts,reconcileForecastPrecipitation} from './precipitation';
import {label,wind,type Hour,type Location,type Minute15,type RadarNowcast,type Station,type Weather,type WindUnit} from './weather';
import {blendRadarAtTarget,type RadarBlendMode} from './forecastFusion';
import {WeatherPictogram} from './WeatherPictogram';
import {formatDecimal} from './format';
import {DWD_WIND_THRESHOLDS_KMH} from './dwdWarnings';
import {DwdPrecipitationTypeRadar} from './DwdPrecipitationTypeRadar';

type ShortTermSource='15-min'|'hourly';
type ShortTermAnchorField='temperature'|'apparent'|'humidity'|'dewPoint'|'pressure'|'wind'|'gust'|'direction'|'cloud'|'lowCloud'|'visibility'|'precipitation'|'code';
export type ShortTermAnchor={
 active?:boolean;
 sourceLabel?:string;
 observed?:Partial<Record<ShortTermAnchorField,boolean>>;
 temperature?:number;
 apparent?:number;
 humidity?:number;
 dewPoint?:number;
 pressure?:number;
 wind?:number;
 gust?:number;
 direction?:number;
 cloud?:number;
 lowCloud?:number;
 visibility?:number;
 precipitation?:number;
 precipitationMinutes?:number;
 rain?:number;
 showers?:number;
 snowfall?:number;
 cloudBaseHft?:number;
 ceilingHft?:number;
 code?:number;
 isDay?:boolean;
};

export type ShortTermForecastPoint={
 id:string;
 offsetMinutes:number;
 offsetLabel:string;
 timeLabel:string;
 intervalLabel:string;
 epoch:number;
 source:ShortTermSource;
 temperature:number;
 apparent:number;
 humidity:number;
 dewPoint:number;
 pressure:number;
 precipitation:number;
 rain:number;
 showers:number;
 snowfall:number;
 probability:number;
 code:number;
 weatherLabel:string;
 wind:number;
 gust:number;
 direction:number;
 cloud:number;
 lowCloud:number;
 midCloud?:number;
 highCloud?:number;
 uvIndex?:number;
 sunshineDuration?:number;
 visibility:number;
 isDay:boolean;
 localAdjustment:number;
 thunderPercent?:number;
 radarMode?:RadarBlendMode;
 radarRateMmh?:number;
 radarWeight?:number;
 radarHitClass?:'site'|'nearby'|'dry';
 radarNearestWetKm?:number;
 radarSiteSupport?:number;
 radarFrameCount?:number;
 radarSiteFrameCount?:number;
 radarInterrupted?:boolean;
 thermalPlausibilityAdjusted?:boolean;
};

const QUARTER_MS=15*60000;
const HOUR_MS=60*60000;
const SHORT_TERM_HORIZON_MS=24*HOUR_MS;
const QUARTER_STEP_COUNT=6;
const NAVIGATION_ICON_BASE_DEGREES=45;
const STATION_FRESHNESS_MS=150*60000;

function finite(value:unknown){const number=Number(value);return Number.isFinite(number)?number:undefined}
function clampValue(value:number,minimum:number,maximum:number){return Math.min(maximum,Math.max(minimum,value))}
function currentNumber(current:Weather['current'],key:string){return finite(current[key])}
function stationIsFresh(station:Station|undefined|null,now:number){if(!station)return false;if(!station.timestamp)return true;const timestamp=new Date(station.timestamp).getTime();return Number.isFinite(timestamp)&&now-timestamp>=0&&now-timestamp<STATION_FRESHNESS_MS}
function stationWindKnots(value:number|undefined,unit:Station['windUnit']){const number=finite(value);return number===undefined?undefined:unit==='kmh'?number/1.852:number}
function observedSkyCode(fallback:number,cloud:number|undefined,lowCloud:number|undefined,visibility:number|undefined,humidity:number|undefined,temperature:number|undefined){
 const code=Math.round(Number(fallback)||0),vis=Number(visibility),hum=Number(humidity),temp=Number(temperature),cover=Math.max(Number(cloud)||0,Number(lowCloud)||0);
 if(Number.isFinite(vis)&&vis<=1000&&Number.isFinite(hum)&&hum>=92)return Number.isFinite(temp)&&temp<=0?48:45;
 if((code===45||code===48)&&Number.isFinite(vis)&&vis<=2500)return code;
 if(cover>=87.5)return 3;
 if(cover>=37.5)return 2;
 if(cover>=12.5)return 1;
 return 0;
}

export function shortTermAnchorFromCurrent(station:Station|null|undefined,current:Weather['current'],now=Date.now()):ShortTermAnchor{
 const fresh=stationIsFresh(station,now),observed:Partial<Record<ShortTermAnchorField,boolean>>={};
 const useStation=(field:ShortTermAnchorField,value:unknown)=>{const available=fresh&&finite(value)!==undefined;observed[field]=available;return available?finite(value):undefined};
 const modelTemperature=currentNumber(current,'temperature_2m'),stationTemperature=useStation('temperature',station?.temperature),temperature=stationTemperature??modelTemperature;
 const apparent=currentNumber(current,'apparent_temperature');observed.apparent=Boolean(apparent!==undefined&&fresh);
 const stationHumidity=useStation('humidity',station?.humidity),humidity=stationHumidity??currentNumber(current,'relative_humidity_2m');
 const stationDewPoint=useStation('dewPoint',station?.dewPoint),dewPoint=stationDewPoint??currentNumber(current,'dew_point_2m');
 const qffPressure=Boolean(fresh&&(station?.pressureReference==='QFF'||station?.pressureReference==='MSL')&&Number(station?.pressure)>=870&&Number(station?.pressure)<=1085),pressure=qffPressure?Number(station?.pressure):currentNumber(current,'pressure_msl');observed.pressure=qffPressure;
 const stationWind=stationWindKnots(station?.windSpeed,station?.windUnit),stationGust=stationWindKnots(station?.windGust,station?.windUnit),wind=fresh&&stationWind!==undefined?stationWind:currentNumber(current,'wind_speed_10m'),gust=fresh&&stationGust!==undefined?stationGust:currentNumber(current,'wind_gusts_10m');observed.wind=Boolean(fresh&&stationWind!==undefined);observed.gust=Boolean(fresh&&stationGust!==undefined);
 const stationDirection=useStation('direction',station?.windDirection),direction=stationDirection??currentNumber(current,'wind_direction_10m');
 const stationCloud=useStation('cloud',station?.cloudCover),cloud=stationCloud??currentNumber(current,'cloud_cover'),modelLowCloud=currentNumber(current,'cloud_cover_low'),lowLayerObserved=Boolean(fresh&&stationCloud!==undefined&&((Number.isFinite(Number(station?.ceilingHft))&&Number(station?.ceilingHft)<=30)||(Number.isFinite(Number(station?.cloudBaseHft))&&Number(station?.cloudBaseHft)<=30)||(Number(humidity)>=92&&Number(cloud)>=87.5))),lowCloud=lowLayerObserved?Math.max(Number(stationCloud),Number(modelLowCloud)||0):modelLowCloud;observed.lowCloud=lowLayerObserved;
 const stationVisibility=useStation('visibility',station?.visibility),visibility=stationVisibility??currentNumber(current,'visibility');
 const stationPrecipitation=useStation('precipitation',station?.precipitation),precipitation=stationPrecipitation??currentNumber(current,'precipitation'),precipitationMinutes=fresh&&stationPrecipitation!==undefined?Math.max(1,Number(station?.precipitationMinutes)||60):60;
 const rain=currentNumber(current,'rain')??0,showers=currentNumber(current,'showers')??0,snowfall=currentNumber(current,'snowfall')??0,baseCode=currentNumber(current,'weather_code')??0;
 const parts=precipitationParts({precipitation:precipitation??0,rain,showers,snowfall,probability:0,code:baseCode,temperature,dewPoint,humidity,cloud,lowCloud,cloudBaseHft:fresh?finite(station?.cloudBaseHft):undefined,ceilingHft:fresh?finite(station?.ceilingHft):undefined}),code=parts.type==='none'?observedSkyCode(parts.displayCode,cloud,lowCloud,visibility,humidity,temperature):parts.displayCode;
 observed.code=Boolean(fresh&&(observed.cloud||observed.lowCloud||observed.visibility||observed.precipitation));
 const active=Boolean(fresh&&Object.entries(observed).some(([field,value])=>field!=='apparent'&&value));
 const ownStation=Boolean(station?.provider?.startsWith('Eigene ')||station?.analysisMethod?.startsWith('Eigene ')),sourceLabel=active?(ownStation?'Eigene Station · lokal angepasst':station?.analysisMethod?'Hyperlokal angepasst':'Stationsgestützt angepasst'):'Best Match';
 return{active,sourceLabel,observed,temperature,apparent,humidity,dewPoint,pressure,wind,gust,direction,cloud,lowCloud,visibility,precipitation,precipitationMinutes,rain,showers,snowfall,cloudBaseHft:fresh?finite(station?.cloudBaseHft):undefined,ceilingHft:fresh?finite(station?.ceilingHft):undefined,code,isDay:Number(current.is_day)===1};
}

function nearest<T extends{epoch:number}>(items:T[],epoch:number,maxDistance:number){let best:T|undefined,distance=Infinity;for(const item of items){const current=Math.abs(item.epoch-epoch);if(current<distance){best=item;distance=current}}return distance<=maxDistance?best:undefined}
function bracket(hours:Hour[],epoch:number){let before:Hour|undefined,after:Hour|undefined;for(const hour of hours){if(hour.epoch<=epoch&&(!before||hour.epoch>before.epoch))before=hour;if(hour.epoch>=epoch&&(!after||hour.epoch<after.epoch))after=hour}return{before:before??after,after:after??before}}
function linear(a:number,b:number,t:number){if(!Number.isFinite(a))return b;if(!Number.isFinite(b))return a;return a+(b-a)*t}
function circular(a:number,b:number,t:number){if(!Number.isFinite(a))return b;if(!Number.isFinite(b))return a;const delta=((b-a+540)%360)-180;return(a+delta*t+360)%360}
function interpolatedHour(hours:Hour[],epoch:number){const{before,after}=bracket(hours,epoch);if(!before||!after)return nearest(hours,epoch,90*60000);const span=Math.max(1,after.epoch-before.epoch),t=Math.max(0,Math.min(1,(epoch-before.epoch)/span)),near=t<.5?before:after;return{...near,epoch,time:new Date(epoch).toISOString(),temperature:linear(before.temperature,after.temperature,t),apparent:linear(before.apparent,after.apparent,t),humidity:linear(before.humidity,after.humidity,t),dewPoint:linear(before.dewPoint,after.dewPoint,t),pressure:linear(before.pressure,after.pressure,t),probability:linear(before.probability,after.probability,t),wind:linear(before.wind,after.wind,t),gust:linear(before.gust,after.gust,t),direction:circular(before.direction,after.direction,t),cloud:linear(before.cloud,after.cloud,t),lowCloud:linear(before.lowCloud,after.lowCloud,t),midCloud:linear(Number(before.midCloud),Number(after.midCloud),t),highCloud:linear(Number(before.highCloud),Number(after.highCloud),t),uvIndex:linear(before.uvIndex,after.uvIndex,t),visibility:linear(before.visibility,after.visibility,t),cape:linear(before.cape,after.cape,t),liftedIndex:linear(Number(before.liftedIndex),Number(after.liftedIndex),t),convectiveInhibition:linear(Number(before.convectiveInhibition),Number(after.convectiveInhibition),t),columnWaterVapour:linear(Number(before.columnWaterVapour),Number(after.columnWaterVapour),t),isDay:near.isDay} satisfies Hour}
function clock(epoch:number,timezone:string){try{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(new Date(epoch))}catch{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(new Date(epoch))}}
function offsetLabel(minutes:number){const absolute=Math.max(1,Math.round(minutes));if(absolute<60)return`+${absolute} min`;const hours=Math.floor(absolute/60),rest=absolute%60;if(rest)return`+${hours} h ${rest} min`;return`+${hours} h`}
function cardinal(direction:number){if(!Number.isFinite(direction))return'–';const labels=['N','NO','O','SO','S','SW','W','NW'];return labels[Math.round((((direction%360)+360)%360)/45)%8]}
function nextQuarterEpoch(now:number){return Math.floor(now/QUARTER_MS)*QUARTER_MS+QUARTER_MS}
function nextFullHourEpoch(epoch:number){const rounded=Math.floor(epoch/HOUR_MS)*HOUR_MS;return rounded<=epoch?rounded+HOUR_MS:rounded}
function buildTargetEpochs(now:number){
 const end=now+SHORT_TERM_HORIZON_MS,targets:number[]=[];
 let quarter=nextQuarterEpoch(now);
 for(let index=0;index<QUARTER_STEP_COUNT&&quarter<=end;index+=1,quarter+=QUARTER_MS)targets.push(quarter);
 let hourly=nextFullHourEpoch(targets[targets.length-1]??now);
 while(hourly<=end){targets.push(hourly);hourly+=HOUR_MS}
 return targets;
}
function windToDegrees(direction:number){return((direction+180)%360+360)%360}
function directionArrowRotation(direction:number){return Number.isFinite(direction)?((windToDegrees(direction)-NAVIGATION_ICON_BASE_DEGREES)%360+360)%360:0}
function bridgeThermalValue(anchor:number|undefined,horizon:number|undefined,base:number,offsetMinutes:number){const start=Number(anchor),end=Number(horizon);if(!Number.isFinite(start)||!Number.isFinite(end)||offsetMinutes>60)return base;const progress=Math.max(0,Math.min(1,offsetMinutes/60)),ramp=start+(end-start)*progress;return end>=start?Math.max(base,ramp):Math.min(base,ramp)}
function anchorField(anchor:ShortTermAnchor,key:ShortTermAnchorField){if(anchor.active===false)return undefined;if(anchor.observed)return anchor.observed[key]?finite(anchor[key]):undefined;return finite(anchor[key])}
function adjustmentWeight(offsetMinutes:number,horizonMinutes:number){return clampValue(1-offsetMinutes/Math.max(1,horizonMinutes),0,1)}
function assimilatedValue(observed:number|undefined,modelNow:number|undefined,base:number,offsetMinutes:number,horizonMinutes:number,minimum:number,maximum:number,maxCorrection=Infinity){
 const anchor=Number(observed),model=Number(modelNow);if(!Number.isFinite(anchor))return clampValue(base,minimum,maximum);if(!Number.isFinite(model))return clampValue(bridgeThermalValue(anchor,base,base,Math.min(60,offsetMinutes)),minimum,maximum);const correction=clampValue(anchor-model,-maxCorrection,maxCorrection);return clampValue(base+correction*adjustmentWeight(offsetMinutes,horizonMinutes),minimum,maximum);
}
function assimilatedDirection(observed:number|undefined,modelNow:number|undefined,base:number,offsetMinutes:number){const anchor=Number(observed),model=Number(modelNow);if(!Number.isFinite(anchor)||!Number.isFinite(model))return((base%360)+360)%360;const correction=((anchor-model+540)%360)-180;return((base+correction*adjustmentWeight(offsetMinutes,90))%360+360)%360}
function precipitationCode(code:number){const rounded=Math.round(Number(code)||0);return rounded>=51&&rounded<=99}
function reconciledWeatherCode(forecastCode:number,anchorCode:number|undefined,cloud:number,lowCloud:number,visibility:number,humidity:number,temperature:number,precipitation:number,probability:number,offsetMinutes:number,localAdjustment:number){
 const raw=Math.round(Number(forecastCode)||0),observed=Math.round(Number(anchorCode));
 if(precipitation>=.01||(precipitationCode(raw)&&probability>=30))return raw;
 if(precipitationCode(raw)&&probability<30)return observedSkyCode(Number.isFinite(observed)?observed:raw,cloud,lowCloud,visibility,humidity,temperature);
 if(localAdjustment<=0)return raw;
 if(Number.isFinite(observed)&&precipitationCode(observed)&&offsetMinutes<=30)return observed;
 return observedSkyCode(Number.isFinite(observed)?observed:raw,cloud,lowCloud,visibility,humidity,temperature);
}
function visibilityText(value:number){if(!Number.isFinite(value))return'–';if(value>=10000)return`${Math.round(value/1000)} km`;if(value>=1000)return`${formatDecimal(value/1000,1)} km`;return`${Math.round(value)} m`}
export function shortTermWindWarningLevel(gustKnots:number):0|1|2|3|4{
 const kmh=Math.max(0,Number(gustKnots)||0)*1.852;
 const exceeded=DWD_WIND_THRESHOLDS_KMH.filter(item=>item.threshold===50||item.threshold===140?kmh>item.threshold:kmh>=item.threshold).at(-1);
 return exceeded?.level??0;
}
function windWarningClass(gustKnots:number){const level=shortTermWindWarningLevel(gustKnots);return level?` wind-warning-level-${level}`:''}
function quietThermalNeighbourhood(points:ShortTermForecastPoint[],index:number){
 const group=points.slice(Math.max(0,index-1),Math.min(points.length,index+2));
 const cloudValues=group.map(point=>Number(point.cloud)).filter(Number.isFinite),cloudSpread=cloudValues.length?Math.max(...cloudValues)-Math.min(...cloudValues):0;
 return group.every(point=>point.precipitation<.15&&point.probability<45&&!precipitationCode(point.code)&&Number(point.thunderPercent||0)<30&&point.gust<35)&&cloudSpread<45;
}
export function plausibilizeShortTermThermals(points:ShortTermForecastPoint[]){
 const result=points.map(point=>({...point}));
 for(let index=1;index<result.length-1;index+=1){
  const previous=result[index-1],current=result[index],next=result[index+1];if(current.offsetMinutes>180)break;
  const beforeMinutes=(current.epoch-previous.epoch)/60000,afterMinutes=(next.epoch-current.epoch)/60000;if(beforeMinutes<=0||afterMinutes<=0||beforeMinutes>75||afterMinutes>75||!quietThermalNeighbourhood(result,index))continue;
  const progress=beforeMinutes/(beforeMinutes+afterMinutes),expected=linear(previous.temperature,next.temperature,progress),deviation=current.temperature-expected,leftSlope=current.temperature-previous.temperature,rightSlope=next.temperature-current.temperature,isolatedTurn=leftSlope*rightSlope<0;
  if(!isolatedTurn||Math.abs(deviation)<.65||Math.abs(deviation)>4)continue;
  const apparentOffset=Number.isFinite(current.apparent-current.temperature)?clampValue(current.apparent-current.temperature,-15,15):0;
  current.temperature=expected;current.apparent=expected+apparentOffset;current.thermalPlausibilityAdjusted=true;current.localAdjustment=Math.max(current.localAdjustment,.1);
 }
 return result;
}

export function buildShortTermForecast(minutes15:Minute15[],hours:Hour[],timezone:string,now=Date.now(),anchor:ShortTermAnchor={},radarNowcast?:RadarNowcast):ShortTermForecastPoint[]{
 if(!hours.length)return[];
 const points:ShortTermForecastPoint[]=[],modelNow=interpolatedHour(hours,now),anchorTemperature=anchorField(anchor,'temperature'),anchorApparent=anchorField(anchor,'apparent'),anchorHumidity=anchorField(anchor,'humidity'),anchorDewPoint=anchorField(anchor,'dewPoint'),anchorPressure=anchorField(anchor,'pressure'),anchorWind=anchorField(anchor,'wind'),anchorGust=anchorField(anchor,'gust'),anchorDirection=anchorField(anchor,'direction'),anchorCloud=anchorField(anchor,'cloud'),anchorLowCloud=anchorField(anchor,'lowCloud'),anchorVisibility=anchorField(anchor,'visibility'),anchorPrecipitation=anchorField(anchor,'precipitation'),anchorCode=anchorField(anchor,'code');
 for(const target of buildTargetEpochs(now)){
  const offsetMinutes=Math.max(1,Math.round((target-now)/60000)),isQuarterInterval=offsetMinutes<=QUARTER_STEP_COUNT*15,quarter=isQuarterInterval?nearest(minutes15,target,12*60000):undefined,base=interpolatedHour(hours,target);
  if(!base)continue;
  const intervalMinutes=isQuarterInterval?15:60,intervalFactor=intervalMinutes/60,modelPrecipitation=Math.max(0,quarter?.precipitation??base.precipitation*intervalFactor),modelRain=Math.max(0,quarter?.rain??base.rain*intervalFactor),modelShowers=Math.max(0,quarter?.showers??base.showers*intervalFactor),modelSnowfall=Math.max(0,quarter?.snowfall??base.snowfall*intervalFactor),modelProbability=quarter?.probability??base.probability,radarSignal=blendRadarAtTarget({radar:radarNowcast,targetEpoch:target,intervalMinutes,modelAmount:modelPrecipitation,modelProbability,now}),sourcePrecipitation=radarSignal?.amount??modelPrecipitation,sourceProbability=radarSignal?.probability??modelProbability,componentTotal=modelRain+modelShowers+modelSnowfall,componentScale=componentTotal>.001?sourcePrecipitation/componentTotal:1,sourceRain=componentTotal>.001?modelRain*componentScale:base.temperature<=1?0:sourcePrecipitation,sourceShowers=componentTotal>.001?modelShowers*componentScale:0,sourceSnowfall=componentTotal>.001?modelSnowfall*componentScale:base.temperature<=1?sourcePrecipitation:0,sourceCode=quarter?.code??base.code,observedRate=Number(anchorPrecipitation)*60/Math.max(1,Number(anchor.precipitationMinutes)||60),observedAmount=Number.isFinite(observedRate)?Math.max(0,observedRate*intervalMinutes/60):undefined,modelNowAmount=Number.isFinite(Number(modelNow?.precipitation))?Math.max(0,Number(modelNow?.precipitation)*intervalMinutes/60):undefined;
  const temperature=assimilatedValue(anchorTemperature,modelNow?.temperature,base.temperature,offsetMinutes,120,-80,65,8),apparent=assimilatedValue(anchorApparent,modelNow?.apparent,base.apparent,offsetMinutes,90,-90,70,10),humidity=assimilatedValue(anchorHumidity,modelNow?.humidity,base.humidity,offsetMinutes,120,0,100,45),dewPoint=assimilatedValue(anchorDewPoint,modelNow?.dewPoint,base.dewPoint,offsetMinutes,120,-90,50,10),pressure=assimilatedValue(anchorPressure,modelNow?.pressure,base.pressure,offsetMinutes,180,850,1100,15),windValue=assimilatedValue(anchorWind,modelNow?.wind,base.wind,offsetMinutes,90,0,180,35),gustValue=assimilatedValue(anchorGust,modelNow?.gust,base.gust,offsetMinutes,90,0,220,45),windPair={wind:windValue,gust:Math.max(windValue,gustValue)},direction=assimilatedDirection(anchorDirection,modelNow?.direction,base.direction,offsetMinutes),cloud=assimilatedValue(anchorCloud,modelNow?.cloud,base.cloud,offsetMinutes,90,0,100,100),lowCloud=assimilatedValue(anchorLowCloud,modelNow?.lowCloud,base.lowCloud,offsetMinutes,90,0,100,100),visibility=assimilatedValue(anchorVisibility,modelNow?.visibility,base.visibility,offsetMinutes,90,50,100000,80000),precipitation=assimilatedValue(observedAmount,modelNowAmount,sourcePrecipitation,offsetMinutes,45,0,250,50),probability=Number(anchorPrecipitation)>.01?Math.max(sourceProbability,90*adjustmentWeight(offsetMinutes,45)):sourceProbability,localAdjustment=anchor.active===false?0:Math.max(adjustmentWeight(offsetMinutes,120)*(anchorTemperature!==undefined?1:0),adjustmentWeight(offsetMinutes,90)*([anchorCloud,anchorVisibility,anchorWind,anchorDirection].some(value=>value!==undefined)?1:0),adjustmentWeight(offsetMinutes,45)*(anchorPrecipitation!==undefined?1:0));
  const rawCode=reconciledWeatherCode(sourceCode,anchorCode,cloud,lowCloud,visibility,humidity,temperature,precipitation,probability,offsetMinutes,localAdjustment),ratio=sourcePrecipitation>.001?precipitation/sourcePrecipitation:1,rawRain=sourceRain*ratio,rawShowers=sourceShowers*ratio,rawSnowfall=sourceSnowfall*ratio,signal=reconcileForecastPrecipitation({precipitation,rain:rawRain,showers:rawShowers,snowfall:rawSnowfall,probability,code:rawCode,cloud,lowCloud,humidity,cape:base.cape,liftedIndex:base.liftedIndex,convectiveInhibition:base.convectiveInhibition,sunshineDuration:base.sunshineDuration,isDay:base.isDay}),parts=precipitationParts({time:quarter?.time??base.time,epoch:target,timezone,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:signal.code,temperature,dewPoint,humidity,cloud,lowCloud,cloudBaseHft:offsetMinutes<=60?anchor.cloudBaseHft:undefined,ceilingHft:offsetMinutes<=60?anchor.ceilingHft:undefined,cape:base.cape,liftedIndex:base.liftedIndex,convectiveInhibition:base.convectiveInhibition,sunshineDuration:base.sunshineDuration,isDay:base.isDay}),thunder=significantHourlyThunderRisk({code:parts.displayCode,cape:base.cape,liftedIndex:base.liftedIndex,convectiveInhibition:base.convectiveInhibition,columnWaterVapour:base.columnWaterVapour,temperature,dewPoint,humidity,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,probability:signal.probability});
  points.push({id:`${offsetMinutes}:${target}`,offsetMinutes,offsetLabel:offsetLabel(offsetMinutes),timeLabel:clock(target,timezone),intervalLabel:isQuarterInterval?'15 min':'1 h',epoch:target,source:isQuarterInterval?'15-min':'hourly',temperature,apparent,humidity,dewPoint,pressure,precipitation:signal.precipitation,rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall,probability:signal.probability,code:parts.displayCode,weatherLabel:parts.type==='none'?label(parts.displayCode):parts.weatherLabel,wind:windPair.wind,gust:windPair.gust,direction,cloud,lowCloud,midCloud:base.midCloud,highCloud:base.highCloud,uvIndex:base.uvIndex,sunshineDuration:base.sunshineDuration,visibility,isDay:base.isDay,localAdjustment,thunderPercent:thunder?.percent,radarMode:radarSignal?.mode,radarRateMmh:radarSignal?.radarRateMmh,radarWeight:radarSignal?.radarWeight,radarHitClass:radarSignal?.hitClass,radarNearestWetKm:radarSignal?.nearestWetKm,radarSiteSupport:radarSignal?.siteSupport,radarFrameCount:radarSignal?.frameCount,radarSiteFrameCount:radarSignal?.siteFrameCount,radarInterrupted:radarSignal?.interrupted});
 }
 return plausibilizeShortTermThermals(points);
}

function DirectionArrow({direction,gust}:{direction:number;gust:number}){const rotation=directionArrowRotation(direction),warningClass=windWarningClass(gust);return <Navigation size={13} className={`short-term-wind-arrow${warningClass}`} style={{transform:`rotate(${rotation}deg)`}} aria-hidden="true"/>}

export function ShortTermForecast({minutes15,hours,timezone,unit,anchor,forecastSourceLabel,radarNowcast,location,showDwdPrecipitationTypeRadar=true}:{minutes15:Minute15[];hours:Hour[];timezone:string;unit:WindUnit;anchor?:ShortTermAnchor;forecastSourceLabel?:string;radarNowcast?:RadarNowcast;location:Location;showDwdPrecipitationTypeRadar?:boolean}){
 const points=useMemo(()=>buildShortTermForecast(minutes15,hours,timezone,Date.now(),anchor,radarNowcast),[minutes15,hours,timezone,anchor,radarNowcast]),[selectedId,setSelectedId]=useState(''),selected=points.find(point=>point.id===selectedId),locallyAdjusted=Boolean(anchor?.active&&points.some(point=>point.localAdjustment>0)),sourceLabel=locallyAdjusted?(anchor?.sourceLabel||'Lokal angepasst'):(forecastSourceLabel||'Best Match'),selectPoint=(pointId:string)=>setSelectedId(current=>current===pointId?'':pointId);
 useEffect(()=>{if(selectedId&&!points.some(point=>point.id===selectedId))setSelectedId('')},[points,selectedId]);
 if(!points.length)return null;
 return <section className="card short-term-forecast" data-mid-view="short-term"><header className="short-term-header"><span><small>Kurzfristvorhersage</small><strong>Die nächsten 24 Stunden</strong></span><em>{sourceLabel}</em></header><div className="short-term-strip" role="list" aria-label="Kurzfristvorhersage in Zeitschritten">{points.map(point=><button type="button" role="listitem" key={point.id} className={selectedId===point.id?'active':''} onClick={()=>selectPoint(point.id)} aria-expanded={selectedId===point.id} aria-controls="short-term-selected-detail"><time><b>{point.timeLabel}</b></time><strong className="short-term-temperature">{Math.round(point.temperature)}°</strong><span className="short-term-weather-icon"><WeatherPictogram code={point.code} day={point.isDay} title={point.weatherLabel} cloud={point.cloud} lowCloud={point.lowCloud} midCloud={point.midCloud} highCloud={point.highCloud}/></span><span className="short-term-wind"><DirectionArrow direction={point.direction} gust={point.gust}/><small>{cardinal(point.direction)} {wind(point.wind,unit)}</small></span><span className="short-term-precip"><Droplets size={13}/><small>{Math.round(point.probability)} %</small>{point.precipitation>=.05||point.snowfall>=.05?<em>{precipitationAmountLabel(point)}</em>:null}</span>{Number(point.thunderPercent)>=30&&<span className="short-term-thunder"><CloudLightning size={13}/>{Math.round(Number(point.thunderPercent))} %</span>}</button>)}</div><DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>{selected&&<div id="short-term-selected-detail" className="short-term-detail" role="region" aria-live="polite" aria-label={`Details ${selected.timeLabel}`}><header><span><b>{selected.timeLabel} Uhr · {selected.weatherLabel}</b><small>{selected.offsetLabel} · Bezugsintervall {selected.intervalLabel}{selected.localAdjustment>0?' · lokal angeglichen':''}{selected.thermalPlausibilityAdjusted?' · Verlauf plausibilisiert':''}</small></span><button type="button" onClick={()=>setSelectedId('')} aria-label="Kurzfristdetails schließen">×</button></header><div><span><Droplets/><small>Niederschlag</small><strong>{Math.round(selected.probability)} % · {precipitationAmountLabel(selected)}</strong>{selected.radarMode==='direct'&&Number.isFinite(selected.radarRateMmh)&&<em>DWD-RV-Standorttreffer · Spitze {formatDecimal(Number(selected.radarRateMmh),1)} mm/h · {selected.radarSiteFrameCount??1} bestätigende 5-Minuten-Schritte{selected.radarInterrupted?' · getrennte Niederschlagsphase':''}</em>}{selected.radarMode==='proximity'&&<em>Echo{Number.isFinite(selected.radarNearestWetKm)?` in ${formatDecimal(Number(selected.radarNearestWetKm),1)} km Entfernung`:''} · kein Standorttreffer; nur als Umfeldsignal gewichtet</em>}{selected.radarMode==='transition'&&<em>DWD-RV-Standortsignal jenseits von +120 min nur als Timing-/Wahrscheinlichkeitssignal berücksichtigt</em>}{selected.radarMode==='dry'&&<em>DWD-RV am Standort in diesem Zeitfenster trocken</em>}</span><span><Thermometer/><small>Gefühlt</small><strong>{Math.round(selected.apparent)} °C</strong></span><span><Gauge/><small>Luftdruck</small><strong>{Math.round(selected.pressure)} hPa</strong></span><span><WindIcon/><small>Wind / Böen</small><strong>{cardinal(selected.direction)} {wind(selected.wind,unit)} · {wind(selected.gust,unit)}</strong></span><span><Navigation/><small>Feuchte / Taupunkt</small><strong>{Math.round(selected.humidity)} % · {Math.round(selected.dewPoint)} °C</strong></span><span><CloudFog/><small>Bewölkung / Sicht</small><strong>{Math.round(selected.cloud)} % · {visibilityText(selected.visibility)}</strong></span>{Number(selected.thunderPercent)>=30&&<span className="thunder"><CloudLightning/><small>Gewitterrisiko</small><strong>{Math.round(Number(selected.thunderPercent))} %</strong></span>}</div></div>}</section>
}
