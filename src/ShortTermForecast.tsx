import {useMemo,useState} from 'react';
import {CloudLightning,Droplets,Gauge,Navigation,Thermometer,Wind as WindIcon} from 'lucide-react';
import {significantHourlyThunderRisk} from './detailThunderRisk';
import {precipitationParts} from './precipitation';
import {label,wind,type Hour,type Minute15,type WindUnit} from './weather';
import {WeatherPictogram} from './WeatherPictogram';
import {formatDecimal} from './format';

type ShortTermSource='15-min'|'hourly';
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
 probability:number;
 code:number;
 weatherLabel:string;
 wind:number;
 gust:number;
 direction:number;
 isDay:boolean;
 thunderPercent?:number;
};

const QUARTER_MS=15*60000;
const HOUR_MS=60*60000;
const SHORT_TERM_HORIZON_MS=24*HOUR_MS;
const QUARTER_STEP_COUNT=4;
const NAVIGATION_ICON_BASE_DEGREES=45;

function nearest<T extends{epoch:number}>(items:T[],epoch:number,maxDistance:number){let best:T|undefined,distance=Infinity;for(const item of items){const current=Math.abs(item.epoch-epoch);if(current<distance){best=item;distance=current}}return distance<=maxDistance?best:undefined}
function bracket(hours:Hour[],epoch:number){let before:Hour|undefined,after:Hour|undefined;for(const hour of hours){if(hour.epoch<=epoch&&(!before||hour.epoch>before.epoch))before=hour;if(hour.epoch>=epoch&&(!after||hour.epoch<after.epoch))after=hour}return{before:before??after,after:after??before}}
function linear(a:number,b:number,t:number){if(!Number.isFinite(a))return b;if(!Number.isFinite(b))return a;return a+(b-a)*t}
function circular(a:number,b:number,t:number){if(!Number.isFinite(a))return b;if(!Number.isFinite(b))return a;const delta=((b-a+540)%360)-180;return(a+delta*t+360)%360}
function interpolatedHour(hours:Hour[],epoch:number){const{before,after}=bracket(hours,epoch);if(!before||!after)return nearest(hours,epoch,90*60000);const span=Math.max(1,after.epoch-before.epoch),t=Math.max(0,Math.min(1,(epoch-before.epoch)/span)),near=t<.5?before:after;return{...near,epoch,time:new Date(epoch).toISOString(),temperature:linear(before.temperature,after.temperature,t),apparent:linear(before.apparent,after.apparent,t),humidity:linear(before.humidity,after.humidity,t),dewPoint:linear(before.dewPoint,after.dewPoint,t),pressure:linear(before.pressure,after.pressure,t),probability:linear(before.probability,after.probability,t),wind:linear(before.wind,after.wind,t),gust:linear(before.gust,after.gust,t),direction:circular(before.direction,after.direction,t),cloud:linear(before.cloud,after.cloud,t),lowCloud:linear(before.lowCloud,after.lowCloud,t),uvIndex:linear(before.uvIndex,after.uvIndex,t),visibility:linear(before.visibility,after.visibility,t),cape:linear(before.cape,after.cape,t),liftedIndex:linear(Number(before.liftedIndex),Number(after.liftedIndex),t),convectiveInhibition:linear(Number(before.convectiveInhibition),Number(after.convectiveInhibition),t),columnWaterVapour:linear(Number(before.columnWaterVapour),Number(after.columnWaterVapour),t),isDay:near.isDay} satisfies Hour}
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

export function buildShortTermForecast(minutes15:Minute15[],hours:Hour[],timezone:string,now=Date.now()):ShortTermForecastPoint[]{
 if(!hours.length)return[];
 const points:ShortTermForecastPoint[]=[];
 for(const target of buildTargetEpochs(now)){
  const offsetMinutes=Math.max(1,Math.round((target-now)/60000)),quarter=offsetMinutes<=60?nearest(minutes15,target,12*60000):undefined,base=interpolatedHour(hours,target);
  if(!base)continue;
  const precipitation=quarter?.precipitation??base.precipitation,rain=quarter?.rain??base.rain,showers=quarter?.showers??base.showers,snowfall=quarter?.snowfall??base.snowfall,probability=quarter?.probability??base.probability,rawCode=quarter?.code??base.code;
  const parts=precipitationParts({time:quarter?.time??base.time,epoch:target,timezone,precipitation,rain,showers,snowfall,probability,code:rawCode,temperature:base.temperature,dewPoint:base.dewPoint,humidity:base.humidity,cloud:base.cloud,lowCloud:base.lowCloud});
  const thunder=significantHourlyThunderRisk({...base,code:parts.displayCode,precipitation,rain,showers,probability});
  points.push({id:`${offsetMinutes}:${target}`,offsetMinutes,offsetLabel:offsetLabel(offsetMinutes),timeLabel:clock(target,timezone),intervalLabel:quarter?'15 min':'1 h',epoch:target,source:quarter?'15-min':'hourly',temperature:base.temperature,apparent:base.apparent,humidity:base.humidity,dewPoint:base.dewPoint,pressure:base.pressure,precipitation,probability,code:parts.displayCode,weatherLabel:parts.type==='none'?label(parts.displayCode):parts.weatherLabel,wind:base.wind,gust:Math.max(base.wind,base.gust),direction:base.direction,isDay:base.isDay,thunderPercent:thunder?.percent});
 }
 return points;
}

function DirectionArrow({direction}:{direction:number}){const rotation=directionArrowRotation(direction);return <Navigation size={13} style={{transform:`rotate(${rotation}deg)`}} aria-hidden="true"/>}

export function ShortTermForecast({minutes15,hours,timezone,unit}:{minutes15:Minute15[];hours:Hour[];timezone:string;unit:WindUnit}){
 const points=useMemo(()=>buildShortTermForecast(minutes15,hours,timezone),[minutes15,hours,timezone]),[selectedId,setSelectedId]=useState(''),selected=points.find(point=>point.id===selectedId);
 if(!points.length)return null;
 return <section className="card short-term-forecast" data-mid-view="short-term"><header className="short-term-header"><span><small>Kurzfristvorhersage</small><strong>Die nächsten 24 Stunden</strong></span><em>Best Match</em></header><div className="short-term-strip" role="list" aria-label="Kurzfristvorhersage in Zeitschritten">{points.map(point=><button type="button" role="listitem" key={point.id} className={selectedId===point.id?'active':''} onClick={()=>setSelectedId(current=>current===point.id?'':point.id)} aria-expanded={selectedId===point.id}><time><b>{point.timeLabel}</b></time><strong className="short-term-temperature">{Math.round(point.temperature)}°</strong><span className="short-term-weather-icon"><WeatherPictogram code={point.code} day={point.isDay} title={point.weatherLabel}/></span><span className="short-term-wind"><DirectionArrow direction={point.direction}/><small>{cardinal(point.direction)} {wind(point.wind,unit)}</small></span><span className="short-term-precip"><Droplets size={13}/><small>{Math.round(point.probability)} %</small>{point.precipitation>=.05&&<em>{formatDecimal(point.precipitation,1)} mm</em>}</span>{Number(point.thunderPercent)>=30&&<span className="short-term-thunder"><CloudLightning size={13}/>{Math.round(Number(point.thunderPercent))} %</span>}</button>)}</div>{selected&&<div className="short-term-detail" role="region" aria-label={`Details ${selected.timeLabel}`}><header><span><b>{selected.timeLabel} Uhr · {selected.weatherLabel}</b><small>{selected.offsetLabel} · Bezugsintervall {selected.intervalLabel}</small></span><button type="button" onClick={()=>setSelectedId('')} aria-label="Kurzfristdetails schließen">×</button></header><div><span><Droplets/><small>Niederschlag</small><strong>{Math.round(selected.probability)} % · {formatDecimal(selected.precipitation,1)} mm</strong></span><span><Thermometer/><small>Gefühlt</small><strong>{Math.round(selected.apparent)} °C</strong></span><span><Gauge/><small>Luftdruck</small><strong>{Math.round(selected.pressure)} hPa</strong></span><span><WindIcon/><small>Wind / Böen</small><strong>{cardinal(selected.direction)} {wind(selected.wind,unit)} · {wind(selected.gust,unit)}</strong></span><span><Navigation/><small>Feuchte / Taupunkt</small><strong>{Math.round(selected.humidity)} % · {Math.round(selected.dewPoint)} °C</strong></span>{Number(selected.thunderPercent)>=30&&<span className="thunder"><CloudLightning/><small>Gewitterrisiko</small><strong>{Math.round(Number(selected.thunderPercent))} %</strong></span>}</div></div>}</section>
}
