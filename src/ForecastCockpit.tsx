import {useEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ChevronDown,ChevronUp,Clock3,Droplets,Info,SlidersHorizontal,ThermometerSun,Wind} from 'lucide-react';
import {DWD_WIND_THRESHOLDS_KMH} from './dwdWarnings';
import {formatDecimalFixed} from './format';
import {WeatherPictogram,weatherPictogramKind} from './WeatherPictogram';
import {buildShortTermForecast,type ShortTermAnchor,type ShortTermForecastPoint} from './ShortTermForecast';
import {currentIndex,dayWeatherCharacter,dayWeatherCharacterText,label as weatherCodeLabel,wind,type ClimateDay,type Day,type EnsembleDay,type EnsembleScenarioCluster,type Hour,type Minute15,type RadarNowcast,type WindUnit} from './weather';
import {precipitationParts} from './precipitation';
import {computeEnsembleConfidence} from './ensembleConfidence';

export type ForecastPresentationMode='classic'|'cockpit-tabs'|'cockpit-ribbons';
type ForecastHorizon='short-term'|'seven-day'|'fourteen-day';
type ShortTermResolution='3h'|'1h';
type DayRegime='wet'|'showery'|'sunny'|'windy'|'warm'|'quiet';

type HorizonAvailability={
 shortTerm:boolean;
 sevenDay:boolean;
 fourteenDay:boolean;
};

type ForecastCockpitProps={
 mode:Exclude<ForecastPresentationMode,'classic'>;
 hours:Hour[];
 minutes15:Minute15[];
 days:Day[];
 ensemble:EnsembleDay[];
 scenarios:EnsembleScenarioCluster[];
 climate:ClimateDay[];
 timezone:string;
 unit:WindUnit;
 selectedDate:string;
 onSelectedDate:(date:string)=>void;
 availability:HorizonAvailability;
 sourceLabel:string;
 updatedLabel:string;
 ensembleLoading:boolean;
 details:{shortTerm?:ReactNode;sevenDay?:ReactNode;fourteenDay?:ReactNode};
 cockpitDetails?:{fourteenDay?:ReactNode};
 sevenDaySummary?:string;
 shortTermAnchor?:ShortTermAnchor;
 radarNowcast?:RadarNowcast;
};

const ACTIVE_HORIZON_KEY='mid:forecastCockpit:activeHorizon';
const SHORT_TERM_RESOLUTION_KEY='mid:forecastCockpit:shortTermResolution';
const HORIZONS:ForecastHorizon[]=['short-term','seven-day','fourteen-day'];
const KMH_PER_KT=1.852;

function clamp(value:number,minimum:number,maximum:number){return Math.min(maximum,Math.max(minimum,value))}
function formatDate(date:string,options:Intl.DateTimeFormatOptions){try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`))}catch{return date}}
function formatClock(epoch:number,timezone:string){try{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(new Date(epoch))}catch{return new Date(epoch).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}}
function dateOnlyFromEpoch(epoch:number,timezone:string){try{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:timezone}).formatToParts(new Date(epoch)),get=(type:string)=>parts.find(part=>part.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`}catch{return new Date(epoch).toISOString().slice(0,10)}}
function cardinal(direction:number){const labels=['N','NO','O','SO','S','SW','W','NW'];return labels[Math.round((((direction%360)+360)%360)/45)%8]}
function flowDirection(fromDirection:number){return((fromDirection%360)+540)%360}
function plausiblePrecipitation(sample:Hour|Minute15){return precipitationParts(sample as Hour)}
function precipitationColor(sample:Hour|Minute15){const parts=plausiblePrecipitation(sample);if(['snow','snowShowers','snowGrains'].includes(parts.type))return'#66bce8';if(['thunderstorm','thunderstormHail'].includes(parts.type))return'#7869e8';if(['freezingRain','freezingDrizzle','sleet','sleetShowers'].includes(parts.type))return'#a769d8';return'#2697d8'}
function windWarningLevel(gustKt:number){const kmh=gustKt*KMH_PER_KT;let level=0;for(const threshold of DWD_WIND_THRESHOLDS_KMH)if(kmh>=threshold.threshold)level=Math.max(level,threshold.level);return level}
function consistencyColor(value:number){const score=clamp(value,0,100),stops=[{v:0,c:[232,54,54]},{v:25,c:[244,125,48]},{v:50,c:[242,201,76]},{v:70,c:[199,214,54]},{v:85,c:[100,190,65]},{v:100,c:[45,193,90]}];let a=stops[0],b=stops[stops.length-1];for(let index=0;index<stops.length-1;index++)if(score>=stops[index].v&&score<=stops[index+1].v){a=stops[index];b=stops[index+1];break}const ratio=(score-a.v)/Math.max(1,b.v-a.v),rgb=a.c.map((channel,index)=>Math.round(channel+(b.c[index]-channel)*ratio));return`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`}
function readActiveHorizon(availability:HorizonAvailability){try{const stored=localStorage.getItem(ACTIVE_HORIZON_KEY) as ForecastHorizon|null;if(stored&&horizonAvailable(stored,availability))return stored}catch{}return availability.shortTerm?'short-term':availability.sevenDay?'seven-day':'fourteen-day'}
function readShortTermResolution():ShortTermResolution{try{const stored=localStorage.getItem(SHORT_TERM_RESOLUTION_KEY);if(stored==='3h'||stored==='1h')return stored}catch{}return'3h'}
function horizonAvailable(horizon:ForecastHorizon,availability:HorizonAvailability){return horizon==='short-term'?availability.shortTerm:horizon==='seven-day'?availability.sevenDay:availability.fourteenDay}
function horizonTitle(horizon:ForecastHorizon){return horizon==='short-term'?'Kurzfrist':horizon==='seven-day'?'7 Tage':'14 Tage'}
function horizonIcon(horizon:ForecastHorizon){return horizon==='short-term'?<Clock3 size={17}/>:horizon==='seven-day'?<ThermometerSun size={17}/>:<SlidersHorizontal size={17}/>}

function shortTermHours(hours:Hour[]){
 if(!hours.length)return[];
 const current=Math.max(0,currentIndex(hours)),start=Math.min(current,hours.length-1),startEpoch=hours[start]?.epoch??Date.now();
 return hours.slice(start).filter(hour=>hour.epoch<=startEpoch+24*3600000).slice(0,25);
}

function regularShortTermPoints(hours:Hour[],stepHours:number){
 const samples=shortTermHours(hours);if(!samples.length)return[];
 const start=samples[0]?.epoch??0;
 return samples.filter((hour,index)=>index===0||index===samples.length-1||Math.abs(((hour.epoch-start)/3600000)%stepHours)<.01);
}


function shortTermSummary(hours:Hour[],timezone:string,unit:WindUnit){
 const samples=shortTermHours(hours);if(!samples.length)return'Kurzfristdaten werden geladen.';
 const wet=samples.filter(sample=>(sample.precipitation>=.05&&sample.probability>=25)||sample.probability>=60),gust=samples.reduce((best,item)=>item.gust>best.gust?item:best,samples[0]);
 const gustPart=`Böen bis ${wind(gust.gust,unit)} um ${formatClock(gust.epoch,timezone)}`;
 if(!wet.length)return `Trocken · ${gustPart}`;
 const first=wet[0],parts=plausiblePrecipitation(first),kind=parts.type==='showers'?'Schauer':parts.type==='thunderstorm'||parts.type==='thunderstormHail'?'Gewitter':parts.weatherLabel;
 return `${kind} ab ${formatClock(first.epoch,timezone)} · ${gustPart}`;
}
function shortTermPointSummary(points:ShortTermForecastPoint[],unit:WindUnit){
 if(!points.length)return'Kurzfristdaten werden geladen.';
 const wet=points.filter(point=>(point.precipitation>=.05&&point.probability>=25)||point.probability>=60),gust=points.reduce((best,item)=>item.gust>best.gust?item:best,points[0]),gustPart=`Böen bis ${wind(gust.gust,unit)} um ${gust.timeLabel}`;
 if(!wet.length)return `Bis auf Weiteres trocken · ${gustPart}`;
 const first=wet[0],kind=/schauer/i.test(first.weatherLabel)?'Schauer':/gewitter/i.test(first.weatherLabel)?'Gewitter':first.weatherLabel;
 return `${kind} voraussichtlich ab ${first.timeLabel} · ${gustPart}`;
}
function selectShortTermPoints(points:ShortTermForecastPoint[],resolution:ShortTermResolution){
 if(!points.length)return[];
 const hourly=points.filter(point=>point.source==='hourly'),selected=resolution==='1h'?hourly:hourly.filter((_,index)=>index%3===0),first=points[0],last=hourly.at(-1),merged=[first,...selected,last].filter(Boolean) as ShortTermForecastPoint[];
 return merged.filter((point,index,array)=>array.findIndex(candidate=>candidate.epoch===point.epoch)===index);
}

function dayRegime(day:Day,hours:Hour[]):DayRegime{
 const text=dayWeatherCharacterText(dayWeatherCharacter(day,hours)).toLocaleLowerCase('de-DE');
 const parts=precipitationParts({precipitation:day.precipitation,rain:day.rain??0,showers:day.showers??0,snowfall:day.snowfall??0,probability:day.probability,code:day.code});
 const convective=parts.type==='showers'||parts.type==='thunderstorm'||parts.type==='thunderstormHail'||hours.some(hour=>[80,81,82,95,96,97,99].includes(Math.round(hour.code))||hour.showers>=.12||hour.cape>=350);
 const sunny=/sonnig|heiter|freundlich/.test(text);
 const cloudy=/bedeckt|stark bewölkt|meist bewölkt/.test(text);
 const warm=day.max>=30;
 const windy=day.wind>=15||(day.gust>=34&&day.wind>=10)||(day.gust>=42);
 const wet=day.precipitation>=5||(day.precipitation>=2&&day.probability>=65)||day.probability>=85;
 const showery=convective&&((day.precipitation>=.6&&day.probability>=35)||day.probability>=45);
 if(wet)return'wet';
 if(showery)return'showery';
 if(windy&&!cloudy)return'windy';
 if(sunny&&warm)return'warm';
 if(sunny)return'sunny';
 if(windy)return'windy';
 return'quiet';
}
function regimeLabel(regime:DayRegime){return regime==='wet'?'Regen':regime==='showery'?'Schauer':regime==='sunny'?'Sonnig':regime==='windy'?'Wind':regime==='warm'?'Heiß':'Ruhig'}

function cockpitCloudMean(hours:Hour[],key:'cloud'|'lowCloud'|'midCloud'|'highCloud'){const values=hours.map(hour=>Number(hour[key])).filter(Number.isFinite);return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:undefined}
function cockpitWeatherImpact(hour:Hour){const kind=weatherPictogramKind(hour.code);return(kind==='thunder'||kind==='thunder-hail'?100:kind==='showers'||kind==='snow-showers'?78:kind==='rain'||kind==='freezing-rain'||kind==='sleet'||kind==='snow'?68:kind==='drizzle'||kind==='freezing-drizzle'||kind==='snow-grains'?48:kind==='fog'||kind==='rime-fog'?42:kind==='cloudy'?28:kind==='partly-cloudy'?18:kind==='mostly-clear'?9:0)+Math.min(18,Math.max(0,hour.precipitation)*6)+Math.max(0,hour.probability)*.12}
function cockpitPeriodVisual(hours:Hour[],dayPeriod:boolean,fallbackCode:number,fallbackTitle:string){const pool=hours.filter(hour=>hour.isDay===dayPeriod),candidates=pool.length?pool:hours;if(!candidates.length)return{available:false,code:fallbackCode,title:fallbackTitle};const representative=candidates.reduce((best,hour)=>cockpitWeatherImpact(hour)>cockpitWeatherImpact(best)?hour:best,candidates[0]),code=representative.code;return{available:true,code,title:`${dayPeriod?'Tagsüber':'Nachts'}: ${weatherCodeLabel(code)||fallbackTitle}`,cloud:cockpitCloudMean(candidates,'cloud'),lowCloud:cockpitCloudMean(candidates,'lowCloud'),midCloud:cockpitCloudMean(candidates,'midCloud'),highCloud:cockpitCloudMean(candidates,'highCloud')}}
function regimeSymbol(regime:DayRegime){return regime==='wet'?'●':regime==='showery'?'◆':regime==='sunny'?'☀':regime==='windy'?'↝':regime==='warm'?'▲':'•'}

function shortTermFocusDate(hours:Hour[],timezone:string){const samples=shortTermHours(hours);return samples.length?dateOnlyFromEpoch(samples[0].epoch,timezone):''}

function ShortTermRibbon({hours,minutes15,timezone,unit,onSelectedDate,anchor,radarNowcast}:{hours:Hour[];minutes15:Minute15[];timezone:string;unit:WindUnit;onSelectedDate:(date:string)=>void;anchor?:ShortTermAnchor;radarNowcast?:RadarNowcast}){
 const [resolution,setResolution]=useState<ShortTermResolution>(readShortTermResolution);
 useEffect(()=>{try{localStorage.setItem(SHORT_TERM_RESOLUTION_KEY,resolution)}catch{}},[resolution]);
 const adjusted=useMemo(()=>buildShortTermForecast(minutes15,hours,timezone,Date.now(),anchor,radarNowcast),[minutes15,hours,timezone,anchor,radarNowcast]),points=useMemo(()=>selectShortTermPoints(adjusted,resolution),[adjusted,resolution]),now90=useMemo(()=>adjusted.filter(point=>point.offsetMinutes<=90),[adjusted]),summary=useMemo(()=>shortTermPointSummary(adjusted,unit),[adjusted,unit]),focusDate=useMemo(()=>shortTermFocusDate(hours,timezone),[hours,timezone]),locallyAdjusted=Boolean(anchor?.active&&adjusted.some(point=>point.localAdjustment>0));
 useEffect(()=>{if(focusDate)onSelectedDate(focusDate)},[focusDate,onSelectedDate]);
 if(!points.length)return <div className="cockpit-empty">Kurzfristdaten werden geladen …</div>;
 const width=Math.max(720,points.length*72),height=286,left=50,right=20,top=46,bottom=height-78,plotWidth=width-left-right,x=(index:number)=>left+(points.length===1?plotWidth/2:index/(points.length-1))*plotWidth;
 const temperatures=points.map(point=>point.temperature),temperatureMin=Math.min(...temperatures),temperatureMax=Math.max(...temperatures),temperatureRange=Math.max(3,temperatureMax-temperatureMin),referenceTemperature=temperatures.reduce((sum,value)=>sum+value,0)/Math.max(1,temperatures.length),yTemp=(value:number)=>top+(temperatureMax+1.2-value)/(temperatureRange+2.4)*(bottom-top-42);
 const precipMax=Math.max(.2,...points.map(point=>Math.max(point.precipitation,.05))),yPrecip=(value:number)=>bottom-clamp(value,0,precipMax)/precipMax*46;
 const line=points.map((point,index)=>`${index?'L':'M'}${x(index).toFixed(1)} ${yTemp(point.temperature).toFixed(1)}`).join(' '),baselineY=yTemp(referenceTemperature),barWidth=Math.max(12,Math.min(26,plotWidth/Math.max(1,points.length)*.42));
 return <div className="cockpit-short-term" data-hyperlocal={locallyAdjusted?'true':'false'}>
  <div className="cockpit-brief"><span><small>Kurzfrist</small><strong>{summary}</strong>{locallyAdjusted?<em className="cockpit-local-badge">{anchor?.sourceLabel||'Hyperlokal angepasst'}</em>:null}</span><div className="cockpit-resolution"><small>Raster</small><div className="cockpit-inline-toggle" role="group" aria-label="Auflösung der Kurzfristvorhersage"><button type="button" className={resolution==='3h'?'active':''} aria-pressed={resolution==='3h'} onClick={()=>setResolution('3h')}>3 h</button><button type="button" className={resolution==='1h'?'active':''} aria-pressed={resolution==='1h'} onClick={()=>setResolution('1h')}>1 h</button></div></div></div>
  {now90.length?<div className="cockpit-now90"><header><b>Nächste 90 Minuten</b><small>{locallyAdjusted?'hyperlokal angeglichen · ':''}Wetter · Temperatur · Niederschlag · Wind</small></header><div className="cockpit-now90-grid" data-cockpit-horizontal-scroll="true">{now90.map(item=><span key={item.epoch} className={`cockpit-now90-slot${item.precipitation>=.01?' wet':''}`} title={`${item.timeLabel}: ${item.weatherLabel} · ${Math.round(item.temperature)} °C · ${formatDecimalFixed(item.precipitation,1)} mm · ${Math.round(item.probability)} % · Wind ${wind(item.wind,unit)}, Böen ${wind(item.gust,unit)}`}><small>{item.timeLabel}</small><WeatherPictogram code={item.code} day={item.isDay} size={34} title={item.weatherLabel} cloud={item.cloud} lowCloud={item.lowCloud} midCloud={item.midCloud} highCloud={item.highCloud}/><b className="cockpit-now90-temp">{Math.round(item.temperature)}°</b><span className="cockpit-now90-weather">{item.weatherLabel}</span><span className="cockpit-now90-meta"><i style={{background:precipitationColor({precipitation:item.precipitation,rain:item.precipitation,showers:0,snowfall:0,probability:item.probability,code:item.code,time:'',epoch:item.epoch,timezone})}}/>{formatDecimalFixed(item.precipitation,1)} mm · {Math.round(item.probability)} %</span><span className="cockpit-now90-wind"><InlineWindArrow direction={item.direction} gust={item.gust} size={15}/>{wind(item.wind,unit)}</span></span>)}</div></div>:null}
  <div className="cockpit-chart-wrap" data-cockpit-horizontal-scroll="true"><svg className="cockpit-short-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Kurzfristige Temperatur-, Niederschlags- und Windsignale">
   <rect x={left} y={top-20} width={plotWidth} height={bottom-top+28} rx="12" fill="currentColor" opacity=".025"/><line x1={left} x2={width-right} y1={bottom} y2={bottom} stroke="currentColor" opacity=".22"/><line x1={left} x2={left} y1={top} y2={bottom} stroke="currentColor" opacity=".22"/><text x={left} y={top-22} fontSize="11" fontWeight="700" fill="currentColor" opacity=".72">Temperatur °C</text><text x={width-right} y={height-14} textAnchor="end" fontSize="10" fill="currentColor" opacity=".62">Windrichtung · Zeit</text><line x1={left} x2={width-right} y1={baselineY} y2={baselineY} stroke="#ff9a62" opacity=".45" strokeDasharray="5 4"/>
   <text x={width-right} y={baselineY-6} textAnchor="end" fontSize="11" fill="currentColor" opacity=".6">Temperaturmittel {Math.round(referenceTemperature)}°</text>
   {[temperatureMin,temperatureMax].map(value=><g key={value}><line x1={left} x2={width-right} y1={yTemp(value)} y2={yTemp(value)} stroke="currentColor" opacity=".08"/><text x={left-8} y={yTemp(value)+4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".6">{Math.round(value)}°</text></g>)}
   {points.map((point,index)=>{const barTop=yPrecip(Math.max(point.precipitation,.02)),pointX=x(index),iconY=top-6,tempCurveY=yTemp(point.temperature),tempLabelBelow=tempCurveY<top+30,tempLabelY=tempLabelBelow?Math.min(bottom-12,tempCurveY+18):tempCurveY-10,arrowY=height-42,timeY=height-18,hitWidth=plotWidth/points.length;return <g key={point.epoch} opacity={index>=Math.ceil(points.length*.72)?.72:1}><line x1={pointX} x2={pointX} y1={bottom-2} y2={bottom+6} stroke="currentColor" opacity=".14"/><rect x={pointX-barWidth/2} y={barTop} width={barWidth} height={Math.max(4,bottom-barTop)} rx="4" fill={precipitationColor({precipitation:point.precipitation,rain:point.precipitation,showers:0,snowfall:0,probability:point.probability,code:point.code,time:'',epoch:point.epoch,timezone})} opacity={Math.max(.18,Math.min(.95,point.probability/100))}/><WeatherPictogram code={point.code} day={point.isDay} size={28} x={pointX-14} y={iconY} title={point.weatherLabel} cloud={point.cloud} lowCloud={point.lowCloud} midCloud={point.midCloud} highCloud={point.highCloud}/><SvgWindDirectionArrow x={pointX} y={arrowY} direction={point.direction} size={14} color={windSignalColor(point.gust)}/><text x={pointX} y={tempLabelY} textAnchor="middle" dominantBaseline={tempLabelBelow?'hanging':'auto'} fontSize="12" fontWeight="700" fill="currentColor">{Math.round(point.temperature)}°</text><text x={pointX} y={timeY} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".72">{point.timeLabel}</text><rect x={pointX-hitWidth/2} y={top-18} width={hitWidth} height={bottom-top+74} fill="transparent"><title>{`${point.timeLabel} · ${Math.round(point.temperature)} °C · ${formatDecimalFixed(point.precipitation,1)} mm · ${Math.round(point.probability)} % · ${wind(point.wind,unit)} / ${wind(point.gust,unit)}`}</title></rect></g>})}
   <path d={line} fill="none" stroke="#ff7a37" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
  </svg></div>
  <div className="cockpit-focus-card short-term"><span><b>Auf einen Blick</b><small>{resolution==='3h'?'3-Stunden-Raster':'Stündlich'} · Linie = Temperaturmittel</small></span><span><b>{`Böen bis ${wind(points.reduce((best,item)=>item.gust>best.gust?item:best,points[0]).gust,unit)}`}</b><small>Windspitze</small></span><span><b>{Math.max(...points.map(item=>item.probability))} %</b><small>max. Niederschlagsrisiko</small></span></div>
 </div>
}

function SevenDayBand({days,hours,unit,selectedDate,onSelectedDate,summary}:{days:Day[];hours:Hour[];unit:WindUnit;selectedDate:string;onSelectedDate:(date:string)=>void;summary?:string}){
 const visible=days.slice(0,7);if(!visible.length)return <div className="cockpit-empty">7-Tage-Daten werden geladen …</div>;
 const allMinimum=Math.min(...visible.map(day=>day.min)),allMaximum=Math.max(...visible.map(day=>day.max)),temperatureRange=Math.max(1,allMaximum-allMinimum),selected=visible.find(day=>day.date===selectedDate)??visible[0],selectedHours=hours.filter(hour=>hour.time.startsWith(selected.date)),character=dayWeatherCharacter(selected,selectedHours);
 return <div className="cockpit-seven-day">
  <div className="cockpit-brief"><span><small>7-Tage-Trend</small><strong>{summary||'Der Verlauf wird aus den sieben Prognosetagen zusammengefasst.'}</strong></span><small className="cockpit-legend-inline">Stichwort + Farbe beschreiben den prägenden Tagescharakter.</small></div>
  <div className="cockpit-seven-grid" data-cockpit-horizontal-scroll="true" style={{'--cockpit-day-count':visible.length} as CSSProperties}>{visible.map(day=>{const dayHours=hours.filter(hour=>hour.time.startsWith(day.date)),weather=dayWeatherCharacter(day,dayHours),dayVisual=cockpitPeriodVisual(dayHours,true,weather.code,dayWeatherCharacterText(weather)),nightVisual=cockpitPeriodVisual(dayHours,false,weather.code,weather.label),left=(day.min-allMinimum)/temperatureRange*100,width=Math.max(8,(day.max-day.min)/temperatureRange*100),warning=windWarningLevel(day.gust),regime=dayRegime(day,dayHours);return <button type="button" key={day.date} className={`cockpit-day regime-${regime}${selected.date===day.date?' active':''}`} data-regime={regimeLabel(regime)} title={`${regimeLabel(regime)} · ${dayWeatherCharacterText(weather)}`} onClick={()=>onSelectedDate(day.date)} aria-pressed={selected.date===day.date}>
   <span className="cockpit-day-date"><b>{formatDate(day.date,{weekday:'short'})}</b><small>{formatDate(day.date,{day:'2-digit',month:'2-digit'})}</small></span>
   <span className="cockpit-day-weather-pair"><WeatherPictogram code={dayVisual.code} day size={38} title={dayVisual.title} cloud={dayVisual.cloud} lowCloud={dayVisual.lowCloud} midCloud={dayVisual.midCloud} highCloud={dayVisual.highCloud}/>{nightVisual.available&&<span className="cockpit-day-night-icon"><WeatherPictogram code={nightVisual.code} day={false} size={25} compact title={nightVisual.title} cloud={nightVisual.cloud} lowCloud={nightVisual.lowCloud} midCloud={nightVisual.midCloud} highCloud={nightVisual.highCloud}/><small>Nacht</small></span>}</span>
   <span className={`cockpit-day-regime ${regime}`}><i>{regimeSymbol(regime)}</i>{regimeLabel(regime)}</span>
   <span className="cockpit-day-temps"><b>{Math.round(day.min)}°</b><strong>{Math.round(day.max)}°</strong></span>
   <span className="cockpit-day-temp-track"><i style={{left:`${left}%`,width:`${width}%`}}/></span>
   <span className="cockpit-day-rain" title={`${formatDecimalFixed(day.precipitation,1)} mm · ${Math.round(day.probability)} %`}><b>{formatDecimalFixed(day.precipitation,1)} mm</b><small>{Math.round(day.probability)} %</small></span>
   <span className={`cockpit-day-wind warning-${warning}`} title={`Wind aus ${cardinal(day.direction)} · ${wind(day.wind,unit)}, Böen ${wind(day.gust,unit)}`}><InlineWindArrow direction={day.direction} gust={day.gust} size={17}/><small className={windAlertClass(day.gust)}>Böen {wind(day.gust,unit)}</small></span>
  </button>})}</div>
  <div className="cockpit-focus-card"><span><b>{formatDate(selected.date,{weekday:'long',day:'2-digit',month:'2-digit'})}</b><small>{dayWeatherCharacterText(character)}</small></span><strong className="cockpit-focus-temp-pair"><b>{Math.round(selected.min)}°</b><em>/</em><span>{Math.round(selected.max)}°</span></strong><span><b>{formatDecimalFixed(selected.precipitation,1)} mm · {Math.round(selected.probability)} %</b><small>Niederschlag</small></span><span><b>{cardinal(selected.direction)} {wind(selected.wind,unit)} · Böen {wind(selected.gust,unit)}</b><small>Wind aus {cardinal(selected.direction)}</small></span></div>
 </div>
}

function ensembleSeries(ensemble:EnsembleDay[],days:Day[],climate:ClimateDay[]){
 const dayMap=new Map(days.map(day=>[day.date,day]));
 const climateMap=new Map(climate.map(item=>[item.date,item]));
 const maxModelCount=Math.max(1,...ensemble.map(item=>Math.max(1,item.modelCount||1)),1);
 return ensemble.slice(0,14).map((item,index)=>{const bestDay=dayMap.get(item.date),climateDay=climateMap.get(item.date),spread=Math.max(0,item.maxHigh-item.maxLow),consistency=computeEnsembleConfidence({spread,index,modelCount:item.modelCount||1,maxModelCount}),meanDayTemperature=((bestDay?.min??item.minMean)+(bestDay?.max??item.maxMean))/2,climateMean=climateDay?((climateDay.minMean+climateDay.maxMean)/2):NaN,weatherCode=bestDay?.code??3,weatherLabel=bestDay?weatherCodeLabel(bestDay.code):weatherCodeLabel(weatherCode),direction=((bestDay?.direction??0)%360+360)%360;return{date:item.date,index,bestMin:bestDay?.min??item.minMean,bestMax:bestDay?.max??item.maxMean,bestPrecipitation:bestDay?.precipitation??item.precipitationMean,bestPrecipitationProbability:bestDay?.probability??item.precipitationProbability,bestWind:bestDay?.wind??item.windMean,bestGust:bestDay?.gust??item.gustMean,temperatureSpread:spread,windMean:item.windMean,windHigh:item.windHigh,gustMean:item.gustMean,gustHigh:item.gustHigh,modelCount:item.modelCount||1,consistency,meanDayTemperature,climateMean,anomaly:Number.isFinite(climateMean)?meanDayTemperature-climateMean:NaN,weatherCode,weatherLabel,direction}});
}
function uncertaintySummary(series:ReturnType<typeof ensembleSeries>,scenarios:EnsembleScenarioCluster[]){if(!series.length)return'Ensemble-Daten werden geladen.';const explicit=scenarios.find(item=>item.divergenceDate)?.divergenceDate,threshold=series.find(item=>item.index>=5&&item.temperatureSpread>=7)?.date,date=explicit||threshold,late=series.slice(7),lateConsistency=late.length?Math.round(late.reduce((sum,item)=>sum+item.consistency,0)/late.length):series[series.length-1].consistency;return date?`Ab ${formatDate(date,{weekday:'long'})} streuen die Lösungen deutlicher · spätere Konsistenz ${lateConsistency} %`:`Die Lösungen bleiben derzeit vergleichsweise gebündelt · spätere Konsistenz ${lateConsistency} %`}
function precipCombinedScore(amount:number,probability:number){return clamp((Math.min(1,Math.max(0,amount)/8)*58)+(clamp(probability,0,100)*.42),0,100)}
function anomalyColor(value:number){if(!Number.isFinite(value))return'#8aa0b3';if(value>=6)return'#ff6b39';if(value>=3)return'#ff9650';if(value>=1)return'#ffbf66';if(value<=-6)return'#2f87e0';if(value<=-3)return'#55a7ff';if(value<=-1)return'#8ec7ff';return'#9db36a'}
function anomalyLabel(value:number){if(!Number.isFinite(value))return'–';return `${value>=0?'+':''}${formatDecimalFixed(value,1)} K`}
function windAlertClass(gustKt:number){const level=windWarningLevel(gustKt);return level>=4?'severe':level===3?'marked':level===2?'noticeable':level===1?'elevated':'calm'}
function windSignalColor(gustKt:number){const level=windWarningLevel(gustKt);return level>=4?'#9b59c6':level===3?'#e74a4a':level===2?'#ef8d32':level===1?'#e6c229':'#2f9b6a'}
function InlineWindArrow({direction,gust,size=16}:{direction:number;gust:number;size?:number}){const level=windWarningLevel(gust),rotation=flowDirection(direction);return <span className={`cockpit-inline-wind-arrow warning-${level}`} style={{'--arrow-size':`${size}px`} as CSSProperties} aria-hidden="true"><span style={{transform:`rotate(${rotation}deg)`}}>↑</span></span>}

function FourteenDayHorizon({ensemble,days,scenarios,climate,selectedDate,onSelectedDate,loading,unit}:{ensemble:EnsembleDay[];days:Day[];scenarios:EnsembleScenarioCluster[];climate:ClimateDay[];selectedDate:string;onSelectedDate:(date:string)=>void;loading:boolean;unit:WindUnit}){
 const series=useMemo(()=>ensembleSeries(ensemble,days,climate),[ensemble,days,climate]);
 const selected=series.find(item=>item.date===selectedDate)??series[0];
 if(!series.length)return <div className="cockpit-empty">14-Tage-Daten werden geladen …</div>;
 return <div className="cockpit-fourteen-day">
  <div className="cockpit-brief"><span><small>14-Tage-Übersicht</small><strong>{uncertaintySummary(series,scenarios)}</strong></span><small className="cockpit-legend-inline">Kompakt pro Tag: Temperaturabweichung · Niederschlagssignal · Wind/Böen · Konsistenz.</small></div>
  <div className="cockpit-fourteen-grid" data-cockpit-horizontal-scroll="true">{series.map(item=>{const amountScore=precipCombinedScore(item.bestPrecipitation,item.bestPrecipitationProbability),windScale=Math.max(1,...series.map(entry=>Math.max(entry.bestGust,entry.bestWind))),windWidth=Math.max(8,item.bestWind/windScale*100),gustWidth=Math.max(windWidth,item.bestGust/windScale*100),anomaly=item.anomaly,positive=Number.isFinite(anomaly)&&anomaly>=0,anomalyWidth=Math.min(48,Math.max(6,Math.abs(Number.isFinite(anomaly)?anomaly:0)*7)),warning=windWarningLevel(item.bestGust),windTone=windAlertClass(item.bestGust);return <button type="button" key={item.date} className={`cockpit-fourteen-card${selected?.date===item.date?' active':''}`} onClick={()=>onSelectedDate(item.date)} aria-pressed={selected?.date===item.date}><header><span className="cockpit-fourteen-heading"><WeatherPictogram code={item.weatherCode} day size={32} title={item.weatherLabel}/><span className="cockpit-fourteen-heading-copy"><b>{formatDate(item.date,{weekday:'short'})}</b><small>{formatDate(item.date,{day:'2-digit',month:'2-digit'})}</small><span className="cockpit-fourteen-weather-label">{item.weatherLabel}</span></span></span><em style={{background:consistencyColor(item.consistency)}}>{item.consistency} %</em></header><div className="cockpit-fourteen-row"><label><ThermometerSun size={12}/> Temp</label><span className="cockpit-anomaly-track"><i className="zero"/><b className={positive?'positive':'negative'} style={{width:`${anomalyWidth}%`,background:anomalyColor(anomaly),[positive?'left':'right']:'50%'} as CSSProperties}/></span><small>{anomalyLabel(anomaly)}</small></div><div className="cockpit-fourteen-row"><label><Droplets size={12}/> Regen</label><span className="cockpit-rain-track"><b style={{width:`${amountScore}%`,opacity:Math.max(.34,item.bestPrecipitationProbability/100)}}/></span><small>{formatDecimalFixed(item.bestPrecipitation,1)} mm · {Math.round(item.bestPrecipitationProbability)} %</small></div><div className="cockpit-fourteen-row"><label><Wind size={12}/> Wind</label><span className="cockpit-wind-track"><i style={{width:`${gustWidth}%`}}/><b style={{width:`${windWidth}%`}}/></span><small className={`cockpit-fourteen-wind-meta warning-${warning} ${windTone}`}><InlineWindArrow direction={item.direction} gust={item.bestGust} size={15}/>{wind(item.bestWind,unit)} · Böen {wind(item.bestGust,unit)}</small></div><footer className="cockpit-fourteen-temps"><b>{Math.round(item.bestMin)}°</b><em>/</em><strong>{Math.round(item.bestMax)}°</strong></footer></button>})}</div>
  {selected?<div className="cockpit-focus-card fourteen"><span className="cockpit-fourteen-selected-summary"><WeatherPictogram code={selected.weatherCode} day size={42} title={selected.weatherLabel}/><span><b>{formatDate(selected.date,{weekday:'long',day:'2-digit',month:'2-digit'})}</b><small>{selected.weatherLabel}</small><small>{loading?'Weitere Modellläufe werden ergänzt.':`Konsistenz ${selected.consistency} % · ${selected.modelCount} Modelle`}</small></span></span><span className="cockpit-fourteen-selected-temps"><b>{Math.round(selected.bestMin)}°</b><em>/</em><strong>{Math.round(selected.bestMax)}°</strong><small>{Number.isFinite(selected.anomaly)?`Abweichung zum Klimamittel ${anomalyLabel(selected.anomaly)}`:'Klimamittel nicht verfügbar'}</small></span><span><b>{formatDecimalFixed(selected.bestPrecipitation,1)} mm · {Math.round(selected.bestPrecipitationProbability)} %</b><small>Niederschlagssignal</small></span><span className="cockpit-fourteen-selected-wind"><b><InlineWindArrow direction={selected.direction} gust={selected.bestGust} size={17}/>{cardinal(selected.direction)} {wind(selected.bestWind,unit)} <em className={windAlertClass(selected.bestGust)}>Böen {wind(selected.bestGust,unit)}</em></b><small>Wind und Böen</small></span></div>:null}
 </div>
}

function MiniRibbon({horizon,hours,days,ensemble,climate,timezone}:{horizon:ForecastHorizon;hours:Hour[];days:Day[];ensemble:EnsembleDay[];climate:ClimateDay[];timezone:string}){
 if(horizon==='short-term'){const points=regularShortTermPoints(hours,3).slice(0,8);return <span className="cockpit-mini-ribbon short">{points.map(point=>{const part=plausiblePrecipitation(point);return <i key={point.epoch} style={{height:`${Math.max(16,Math.round(point.probability))}%`,background:precipitationColor(point)}} title={`${formatClock(point.epoch,timezone)} · ${part.weatherLabel} · ${Math.round(point.probability)} %`}/>})}</span>}
 if(horizon==='seven-day'){const selected=days.slice(0,7);const minimum=Math.min(...selected.map(day=>day.min),0),maximum=Math.max(...selected.map(day=>day.max),1),range=Math.max(1,maximum-minimum);return <span className="cockpit-mini-ribbon seven">{selected.map(day=>{const left=((day.min-minimum)/range)*100,width=Math.max(8,(day.max-day.min)/range*100);return <i key={day.date}><b style={{left:`${left}%`,width:`${width}%`}}/></i>})}</span>}
 const series=ensembleSeries(ensemble,days,climate);return <span className="cockpit-mini-ribbon fourteen">{series.slice(0,14).map(item=><i key={item.date} style={{height:`${clamp(item.consistency,16,100)}%`,opacity:item.index>=7?.72:.96,background:consistencyColor(item.consistency)}} title={`${formatDate(item.date,{weekday:'short'})}: Konsistenz ${item.consistency} %`}/>)}</span>
}
function summaryByHorizon(horizon:ForecastHorizon,{hours,days,timezone,unit,sevenDaySummary,ensemble,scenarios,climate,shortPoints}:{hours:Hour[];days:Day[];timezone:string;unit:WindUnit;sevenDaySummary?:string;ensemble:EnsembleDay[];scenarios:EnsembleScenarioCluster[];climate:ClimateDay[];shortPoints?:ShortTermForecastPoint[]}){if(horizon==='short-term')return shortPoints?.length?shortTermPointSummary(shortPoints,unit):shortTermSummary(hours,timezone,unit);if(horizon==='seven-day')return sevenDaySummary||'Die nächsten sieben Tage werden in Tageskarten verdichtet.';const series=ensembleSeries(ensemble,days,climate);return uncertaintySummary(series,scenarios)}

function AnalysisReveal({open,onToggle,children}:{open:boolean;onToggle:()=>void;children?:ReactNode}){return <div className={`cockpit-analysis${open?' open':''}`}><button type="button" className="cockpit-analysis-toggle" onClick={onToggle} aria-expanded={open}><span><SlidersHorizontal size={18}/><strong>Vollständige Analyse öffnen</strong></span>{open?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button>{open&&children?<div className="cockpit-analysis-panel">{children}</div>:null}</div>}

function SvgWindDirectionArrow({x,y,direction,size=14,color='#2f9b6a'}:{x:number;y:number;direction:number;size?:number;color?:string}){const to=((direction%360)+540)%360,scale=size/14,description=`Wind aus ${Math.round(((direction%360)+360)%360)}°`;return <g className="svg-wind-direction-arrow" style={{color}} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${to.toFixed(1)}) scale(${scale.toFixed(3)})`} role="img" aria-label={description}><title>{description}</title><line x1="0" y1="5" x2="0" y2="-5"/><path d="M -3 -2 L 0 -6 L 3 -2"/></g>}

export function ForecastCockpit({mode,hours,minutes15,days,ensemble,scenarios,climate,timezone,unit,selectedDate,onSelectedDate,availability,sourceLabel,updatedLabel,ensembleLoading,details,cockpitDetails,sevenDaySummary,shortTermAnchor,radarNowcast}:ForecastCockpitProps){
 const availableHorizons=HORIZONS.filter(horizon=>horizonAvailable(horizon,availability));
 const [activeHorizon,setActiveHorizon]=useState<ForecastHorizon>(()=>readActiveHorizon(availability));
 const [analysisOpen,setAnalysisOpen]=useState(false);
 const shortPoints=useMemo(()=>buildShortTermForecast(minutes15,hours,timezone,Date.now(),shortTermAnchor,radarNowcast),[minutes15,hours,timezone,shortTermAnchor,radarNowcast]);
 const wrapRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{if(!horizonAvailable(activeHorizon,availability))setActiveHorizon(readActiveHorizon(availability))},[activeHorizon,availability]);
 useEffect(()=>{try{localStorage.setItem(ACTIVE_HORIZON_KEY,activeHorizon)}catch{}},[activeHorizon]);
 useEffect(()=>{setAnalysisOpen(false)},[activeHorizon]);
 useEffect(()=>{const node=wrapRef.current;if(!node)return;requestAnimationFrame(()=>node.scrollTo({top:0,left:0,behavior:'smooth'}))},[activeHorizon]);
 const headerSummary=summaryByHorizon(activeHorizon,{hours,days,timezone,unit,sevenDaySummary,ensemble,scenarios,climate,shortPoints});
 const activeCompactDetail=activeHorizon==='fourteen-day'?cockpitDetails?.fourteenDay:undefined;
 const activeAnalysis=activeCompactDetail??(activeHorizon==='short-term'?details.shortTerm:activeHorizon==='seven-day'?details.sevenDay:details.fourteenDay);
 return <section ref={wrapRef} className={`forecast-cockpit mode-${mode}`}><header className="cockpit-header"><small>MID Prognose-Cockpit</small><strong>Kurzfrist · 7 Tage · 14 Tage</strong><span>{headerSummary}</span></header><div className={`cockpit-tabs tabs-${availableHorizons.length}`}>{availableHorizons.map(horizon=>{const summary=summaryByHorizon(horizon,{hours,days,timezone,unit,sevenDaySummary,ensemble,scenarios,climate,shortPoints});return <button type="button" key={horizon} className={activeHorizon===horizon?'active':''} onClick={()=>setActiveHorizon(horizon)} aria-pressed={activeHorizon===horizon} title={`${horizonTitle(horizon)}: ${summary}`}><span className="cockpit-tab-icon" aria-hidden="true">{horizonIcon(horizon)}</span><span className="cockpit-tab-copy"><b>{horizonTitle(horizon)}</b><small>{summary}</small></span>{mode==='cockpit-ribbons'?<MiniRibbon horizon={horizon} hours={hours} days={days} ensemble={ensemble} climate={climate} timezone={timezone}/>:null}</button>})}</div><div className="cockpit-body">{activeHorizon==='short-term'?<ShortTermRibbon hours={hours} minutes15={minutes15} timezone={timezone} unit={unit} onSelectedDate={onSelectedDate} anchor={shortTermAnchor} radarNowcast={radarNowcast}/>:null}{activeHorizon==='seven-day'?<SevenDayBand days={days} hours={hours} unit={unit} selectedDate={selectedDate} onSelectedDate={onSelectedDate} summary={sevenDaySummary}/>:null}{activeHorizon==='fourteen-day'?<FourteenDayHorizon ensemble={ensemble} days={days} scenarios={scenarios} climate={climate} selectedDate={selectedDate} onSelectedDate={onSelectedDate} loading={ensembleLoading} unit={unit}/>:null}<AnalysisReveal open={analysisOpen} onToggle={()=>setAnalysisOpen(value=>!value)}>{activeAnalysis}</AnalysisReveal></div><footer><span>{sourceLabel}</span><span>{updatedLabel}</span><button type="button" className="cockpit-footer-info" aria-label="Hinweis zur Prognosedarstellung"><Info size={14}/><small>Werte antippen für Details</small></button></footer></section>
}

export default ForecastCockpit;
