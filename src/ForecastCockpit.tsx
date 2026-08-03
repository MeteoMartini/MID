import {useEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ChevronDown,ChevronUp,Clock3,Droplets,Info,SlidersHorizontal,ThermometerSun,Wind} from 'lucide-react';
import {DWD_WIND_THRESHOLDS_KMH} from './dwdWarnings';
import {formatDecimalFixed} from './format';
import {WeatherPictogram} from './WeatherPictogram';
import {currentIndex,dayWeatherCharacter,dayWeatherCharacterText,wind,type ClimateDay,type Day,type EnsembleDay,type EnsembleScenarioCluster,type Hour,type Minute15,type WindUnit} from './weather';
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
function shortTermDirectionDelta(from:number,to:number){return((to-from+540)%360)-180}
function windSignalColor(gustKt:number){const level=windWarningLevel(gustKt);return level>=4?'#9b59c6':level===3?'#e74a4a':level===2?'#ef8d32':level===1?'#e6c229':'#2f9b6a'}
function nearestHour(hours:Hour[],epoch:number){return hours.reduce<Hour|undefined>((best,item)=>!best||Math.abs(item.epoch-epoch)<Math.abs(best.epoch-epoch)?item:best,undefined)}
function interpolatedWeatherAt(hours:Hour[],epoch:number){
 const ordered=hours.filter(item=>Number.isFinite(item.epoch)).sort((a,b)=>a.epoch-b.epoch),before=[...ordered].reverse().find(item=>item.epoch<=epoch),after=ordered.find(item=>item.epoch>=epoch),fallback=nearestHour(ordered,epoch);
 if(!before||!after||before.epoch===after.epoch)return fallback;
 const ratio=clamp((epoch-before.epoch)/Math.max(1,after.epoch-before.epoch),0,1),near=ratio<.5?before:after,linear=(a:number,b:number)=>a+(b-a)*ratio,direction=((before.direction+shortTermDirectionDelta(before.direction,after.direction)*ratio)%360+360)%360;
 return{...near,epoch,temperature:linear(before.temperature,after.temperature),wind:linear(before.wind,after.wind),gust:linear(before.gust,after.gust),direction,isDay:near.isDay};
}
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

function nextNinetyMinutes(minutes15:Minute15[],hours:Hour[],timezone:string){
 const now=Date.now(),source=minutes15.length?minutes15:shortTermHours(hours).filter(item=>item.epoch<=now+90*60000);
 return source
  .filter(item=>Number.isFinite(item.epoch))
  .filter(item=>item.epoch>=now-15*60000&&item.epoch<=now+90*60000)
  .sort((a,b)=>a.epoch-b.epoch)
  .slice(0,7)
  .map(item=>{const weather=interpolatedWeatherAt(hours,item.epoch),sample={...item,temperature:weather?.temperature,dewPoint:weather?.dewPoint,humidity:weather?.humidity,cloud:weather?.cloud,lowCloud:weather?.lowCloud,cape:weather?.cape,liftedIndex:weather?.liftedIndex,convectiveInhibition:weather?.convectiveInhibition,isDay:weather?.isDay},parts=plausiblePrecipitation(sample);return{...item,clock:formatClock(item.epoch,timezone),parts,temperature:weather?.temperature??Number.NaN,wind:weather?.wind??Number.NaN,gust:weather?.gust??Number.NaN,direction:weather?.direction??0,isDay:weather?.isDay??true}});
}

function shortTermSummary(hours:Hour[],timezone:string,unit:WindUnit){
 const samples=shortTermHours(hours);if(!samples.length)return'Kurzfristdaten werden geladen.';
 const wet=samples.filter(sample=>sample.precipitation>=.05||sample.probability>=40),gust=samples.reduce((best,item)=>item.gust>best.gust?item:best,samples[0]),peak=wet.reduce((best,item)=>(item.precipitation+item.probability/100)>(best.precipitation+best.probability/100)?item:best,wet[0]??samples[0]),maxTemp=samples.reduce((best,item)=>item.temperature>best.temperature?item:best,samples[0]),parts=wet.length?plausiblePrecipitation(peak):null;
 if(wet.length&&parts)return `${parts.weatherLabel} voraussichtlich markant um ${formatClock(peak.epoch,timezone)} · stärkste Böe ${formatClock(gust.epoch,timezone)} (${wind(gust.gust,unit)})`;
 return `Überwiegend trocken · Tagesmaximum ${Math.round(maxTemp.temperature)}° um ${formatClock(maxTemp.epoch,timezone)} · stärkste Böe ${formatClock(gust.epoch,timezone)}`;
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
function regimeSymbol(regime:DayRegime){return regime==='wet'?'●':regime==='showery'?'◆':regime==='sunny'?'☀':regime==='windy'?'↝':regime==='warm'?'▲':'•'}

function shortTermFocusDate(hours:Hour[],timezone:string){const samples=shortTermHours(hours);return samples.length?dateOnlyFromEpoch(samples[0].epoch,timezone):''}

function ShortTermRibbon({hours,minutes15,timezone,unit,onSelectedDate}:{hours:Hour[];minutes15:Minute15[];timezone:string;unit:WindUnit;onSelectedDate:(date:string)=>void}){
 const [resolution,setResolution]=useState<ShortTermResolution>(readShortTermResolution);
 useEffect(()=>{try{localStorage.setItem(SHORT_TERM_RESOLUTION_KEY,resolution)}catch{}},[resolution]);
 const points=useMemo(()=>resolution==='1h'?regularShortTermPoints(hours,1):regularShortTermPoints(hours,3),[hours,resolution]);
 const now90=useMemo(()=>nextNinetyMinutes(minutes15,hours,timezone),[minutes15,hours,timezone]);
 const summary=useMemo(()=>shortTermSummary(hours,timezone,unit),[hours,timezone,unit]);
 const focusDate=useMemo(()=>shortTermFocusDate(hours,timezone),[hours,timezone]);
 useEffect(()=>{if(focusDate)onSelectedDate(focusDate)},[focusDate,onSelectedDate]);
 if(!points.length)return <div className="cockpit-empty">Kurzfristdaten werden geladen …</div>;
 const width=Math.max(720,points.length*72),height=250,left=48,right=18,top=30,bottom=height-52,plotWidth=width-left-right,x=(index:number)=>left+(points.length===1?plotWidth/2:index/(points.length-1))*plotWidth;
 const temperatures=points.map(point=>point.temperature),temperatureMin=Math.min(...temperatures),temperatureMax=Math.max(...temperatures),temperatureRange=Math.max(3,temperatureMax-temperatureMin),referenceTemperature=temperatures.reduce((sum,value)=>sum+value,0)/Math.max(1,temperatures.length),yTemp=(value:number)=>top+(temperatureMax+1.2-value)/(temperatureRange+2.4)*(bottom-top-42);
 const precipMax=Math.max(.2,...points.map(point=>Math.max(point.precipitation,.05))),yPrecip=(value:number)=>bottom-clamp(value,0,precipMax)/precipMax*46;
 const line=points.map((point,index)=>`${index?'L':'M'}${x(index).toFixed(1)} ${yTemp(point.temperature).toFixed(1)}`).join(' '),baselineY=yTemp(referenceTemperature),barWidth=Math.max(12,Math.min(26,plotWidth/Math.max(1,points.length)*.42));
 return <div className="cockpit-short-term">
  <div className="cockpit-brief"><span><small>Kurzfrist</small><strong>{summary}</strong></span><div className="cockpit-resolution"><small>Raster</small><div className="cockpit-inline-toggle" role="group" aria-label="Auflösung der Kurzfristvorhersage"><button type="button" className={resolution==='3h'?'active':''} aria-pressed={resolution==='3h'} onClick={()=>setResolution('3h')}>3 h</button><button type="button" className={resolution==='1h'?'active':''} aria-pressed={resolution==='1h'} onClick={()=>setResolution('1h')}>1 h</button></div></div></div>
  {now90.length?<div className="cockpit-now90"><header><b>Nächste 90 Minuten</b><small>Wetter · Temperatur · Niederschlag · Wind</small></header><div className="cockpit-now90-grid" data-cockpit-horizontal-scroll="true">{now90.map(item=><span key={item.epoch} className={`cockpit-now90-slot${item.parts.type!=='none'?' wet':''}`} title={`${item.clock}: ${item.parts.weatherLabel} · ${Number.isFinite(item.temperature)?`${Math.round(item.temperature)} °C · `:''}${formatDecimalFixed(item.precipitation,1)} mm · ${Math.round(item.probability)} %${Number.isFinite(item.wind)?` · Wind ${wind(item.wind,unit)}, Böen ${wind(item.gust,unit)}`:''}`}><small>{item.clock}</small><WeatherPictogram code={item.parts.displayCode} day={item.isDay} size={34} title={item.parts.weatherLabel}/><b className="cockpit-now90-temp">{Number.isFinite(item.temperature)?`${Math.round(item.temperature)}°`:'–'}</b><span className="cockpit-now90-weather">{item.parts.weatherLabel}</span><span className="cockpit-now90-meta"><i style={{background:precipitationColor(item)}}/>{formatDecimalFixed(item.precipitation,1)} mm · {Math.round(item.probability)} %</span><span className="cockpit-now90-wind"><i style={{color:windSignalColor(item.gust),transform:`rotate(${flowDirection(item.direction)}deg)`}}>↑</i>{Number.isFinite(item.wind)?wind(item.wind,unit):'–'}</span></span>)}</div></div>:null}
  <div className="cockpit-chart-wrap" data-cockpit-horizontal-scroll="true"><svg className="cockpit-short-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Kurzfristige Temperatur-, Niederschlags- und Windsignale">
   <rect x={left} y={top-12} width={plotWidth} height={bottom-top+22} rx="12" fill="currentColor" opacity=".025"/><line x1={left} x2={width-right} y1={bottom} y2={bottom} stroke="currentColor" opacity=".22"/><line x1={left} x2={left} y1={top} y2={bottom} stroke="currentColor" opacity=".22"/><text x={left} y={top-16} fontSize="11" fontWeight="700" fill="currentColor" opacity=".72">Temperatur °C</text><text x={width-right} y={bottom+38} textAnchor="end" fontSize="10" fill="currentColor" opacity=".62">Windrichtung · Zeit</text><line x1={left} x2={width-right} y1={baselineY} y2={baselineY} stroke="#ff9a62" opacity=".45" strokeDasharray="5 4"/>
   <text x={width-right} y={baselineY-6} textAnchor="end" fontSize="11" fill="currentColor" opacity=".6">Temperaturmittel {Math.round(referenceTemperature)}°</text>
   {[temperatureMin,temperatureMax].map(value=><g key={value}><line x1={left} x2={width-right} y1={yTemp(value)} y2={yTemp(value)} stroke="currentColor" opacity=".08"/><text x={left-8} y={yTemp(value)+4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".6">{Math.round(value)}°</text></g>)}
   {points.map((point,index)=>{const parts=plausiblePrecipitation(point),barTop=yPrecip(Math.max(point.precipitation,.02));return <g key={point.epoch} opacity={index>=Math.ceil(points.length*.72)?.72:1}><line x1={x(index)} x2={x(index)} y1={bottom-2} y2={bottom+6} stroke="currentColor" opacity=".14"/><rect x={x(index)-barWidth/2} y={barTop} width={barWidth} height={Math.max(4,bottom-barTop)} rx="4" fill={precipitationColor(point)} opacity={Math.max(.18,Math.min(.95,point.probability/100))}/><WeatherPictogram code={parts.displayCode} day={point.isDay} size={30} x={x(index)-15} y={top-10} title={parts.weatherLabel}/><SvgWindDirectionArrow x={x(index)} y={bottom+24} direction={point.direction} size={14} color={windSignalColor(point.gust)}/><text x={x(index)} y={yTemp(point.temperature)-10} textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">{Math.round(point.temperature)}°</text><text x={x(index)} y={height-18} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".72">{formatClock(point.epoch,timezone)}</text><rect x={x(index)-plotWidth/points.length/2} y={top-12} width={plotWidth/points.length} height={bottom-top+40} fill="transparent"><title>{`${formatClock(point.epoch,timezone)} · ${Math.round(point.temperature)} °C · ${formatDecimalFixed(point.precipitation,1)} mm · ${Math.round(point.probability)} % · ${wind(point.wind,unit)} / ${wind(point.gust,unit)}`}</title></rect></g>})}
   <path d={line} fill="none" stroke="#ff7a37" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
  </svg></div>
  <div className="cockpit-focus-card short-term"><span><b>Auf einen Blick</b><small>{resolution==='3h'?'Standard: 3-Stunden-Raster':'Stündliche Detailansicht'} · Linie = Temperaturmittel</small></span><span><b>{points.reduce((best,item)=>item.gust>best.gust?item:best,points[0])?`Böen bis ${wind(points.reduce((best,item)=>item.gust>best.gust?item:best,points[0]).gust,unit)}`:'–'}</b><small>Windspitze</small></span><span><b>{Math.max(...points.map(item=>item.probability))} %</b><small>max. Niederschlagsrisiko</small></span></div>
 </div>
}

function SevenDayBand({days,hours,unit,selectedDate,onSelectedDate,summary}:{days:Day[];hours:Hour[];unit:WindUnit;selectedDate:string;onSelectedDate:(date:string)=>void;summary?:string}){
 const visible=days.slice(0,7);if(!visible.length)return <div className="cockpit-empty">7-Tage-Daten werden geladen …</div>;
 const allMinimum=Math.min(...visible.map(day=>day.min)),allMaximum=Math.max(...visible.map(day=>day.max)),temperatureRange=Math.max(1,allMaximum-allMinimum),selected=visible.find(day=>day.date===selectedDate)??visible[0],selectedHours=hours.filter(hour=>hour.time.startsWith(selected.date)),character=dayWeatherCharacter(selected,selectedHours);
 return <div className="cockpit-seven-day">
  <div className="cockpit-brief"><span><small>7-Tage-Trend</small><strong>{summary||'Der Verlauf wird aus den sieben Prognosetagen zusammengefasst.'}</strong></span><small className="cockpit-legend-inline">Stichwort + Farbe beschreiben den prägenden Tagescharakter.</small></div>
  <div className="cockpit-seven-grid" data-cockpit-horizontal-scroll="true" style={{'--cockpit-day-count':visible.length} as CSSProperties}>{visible.map(day=>{const dayHours=hours.filter(hour=>hour.time.startsWith(day.date)),weather=dayWeatherCharacter(day,dayHours),left=(day.min-allMinimum)/temperatureRange*100,width=Math.max(8,(day.max-day.min)/temperatureRange*100),warning=windWarningLevel(day.gust),regime=dayRegime(day,dayHours);return <button type="button" key={day.date} className={`cockpit-day regime-${regime}${selected.date===day.date?' active':''}`} data-regime={regimeLabel(regime)} title={`${regimeLabel(regime)} · ${dayWeatherCharacterText(weather)}`} onClick={()=>onSelectedDate(day.date)} aria-pressed={selected.date===day.date}>
   <span className="cockpit-day-date"><b>{formatDate(day.date,{weekday:'short'})}</b><small>{formatDate(day.date,{day:'2-digit',month:'2-digit'})}</small></span>
   <WeatherPictogram code={weather.code} day size={38} title={dayWeatherCharacterText(weather)}/>
   <span className={`cockpit-day-regime ${regime}`}><i>{regimeSymbol(regime)}</i>{regimeLabel(regime)}</span>
   <span className="cockpit-day-temps"><b>{Math.round(day.min)}°</b><strong>{Math.round(day.max)}°</strong></span>
   <span className="cockpit-day-temp-track"><i style={{left:`${left}%`,width:`${width}%`}}/></span>
   <span className="cockpit-day-rain" title={`${formatDecimalFixed(day.precipitation,1)} mm · ${Math.round(day.probability)} %`}><b>{formatDecimalFixed(day.precipitation,1)} mm</b><small>{Math.round(day.probability)} %</small></span>
   <span className={`cockpit-day-wind warning-${warning}`} title={`Wind aus ${cardinal(day.direction)} · ${wind(day.wind,unit)}, Böen ${wind(day.gust,unit)}`}><i style={{transform:`rotate(${flowDirection(day.direction)}deg)`}}>↑</i><small>Böen {wind(day.gust,unit)}</small></span>
  </button>})}</div>
  <div className="cockpit-focus-card"><span><b>{formatDate(selected.date,{weekday:'long',day:'2-digit',month:'2-digit'})}</b><small>{dayWeatherCharacterText(character)}</small></span><strong className="cockpit-focus-temp-pair"><b>{Math.round(selected.min)}°</b><em>/</em><span>{Math.round(selected.max)}°</span></strong><span><b>{formatDecimalFixed(selected.precipitation,1)} mm · {Math.round(selected.probability)} %</b><small>Niederschlag</small></span><span><b>{cardinal(selected.direction)} {wind(selected.wind,unit)} · Böen {wind(selected.gust,unit)}</b><small>Wind aus {cardinal(selected.direction)}</small></span></div>
 </div>
}

function ensembleSeries(ensemble:EnsembleDay[],days:Day[],climate:ClimateDay[]){
 const dayMap=new Map(days.map(day=>[day.date,day]));
 const climateMap=new Map(climate.map(item=>[item.date,item]));
 const maxModelCount=Math.max(1,...ensemble.map(item=>Math.max(1,item.modelCount||1)),1);
 return ensemble.slice(0,14).map((item,index)=>{const bestDay=dayMap.get(item.date),climateDay=climateMap.get(item.date),spread=Math.max(0,item.maxHigh-item.maxLow),consistency=computeEnsembleConfidence({spread,index,modelCount:item.modelCount||1,maxModelCount}),meanDayTemperature=((bestDay?.min??item.minMean)+(bestDay?.max??item.maxMean))/2,climateMean=climateDay?((climateDay.minMean+climateDay.maxMean)/2):NaN;return{date:item.date,index,bestMin:bestDay?.min??item.minMean,bestMax:bestDay?.max??item.maxMean,bestPrecipitation:bestDay?.precipitation??item.precipitationMean,bestPrecipitationProbability:bestDay?.probability??item.precipitationProbability,bestWind:bestDay?.wind??item.windMean,bestGust:bestDay?.gust??item.gustMean,temperatureSpread:spread,windMean:item.windMean,windHigh:item.windHigh,gustMean:item.gustMean,gustHigh:item.gustHigh,modelCount:item.modelCount||1,consistency,meanDayTemperature,climateMean,anomaly:Number.isFinite(climateMean)?meanDayTemperature-climateMean:NaN}});
}
function uncertaintySummary(series:ReturnType<typeof ensembleSeries>,scenarios:EnsembleScenarioCluster[]){if(!series.length)return'Ensemble-Daten werden geladen.';const explicit=scenarios.find(item=>item.divergenceDate)?.divergenceDate,threshold=series.find(item=>item.index>=5&&item.temperatureSpread>=7)?.date,date=explicit||threshold,late=series.slice(7),lateConsistency=late.length?Math.round(late.reduce((sum,item)=>sum+item.consistency,0)/late.length):series[series.length-1].consistency;return date?`Ab ${formatDate(date,{weekday:'long'})} streuen die Lösungen deutlicher · spätere Konsistenz ${lateConsistency} %`:`Die Lösungen bleiben derzeit vergleichsweise gebündelt · spätere Konsistenz ${lateConsistency} %`}
function precipCombinedScore(amount:number,probability:number){return clamp((Math.min(1,Math.max(0,amount)/8)*58)+(clamp(probability,0,100)*.42),0,100)}
function anomalyColor(value:number){if(!Number.isFinite(value))return'#8aa0b3';if(value>=6)return'#ff6b39';if(value>=3)return'#ff9650';if(value>=1)return'#ffbf66';if(value<=-6)return'#2f87e0';if(value<=-3)return'#55a7ff';if(value<=-1)return'#8ec7ff';return'#9db36a'}
function anomalyLabel(value:number){if(!Number.isFinite(value))return'–';return `${value>=0?'+':''}${formatDecimalFixed(value,1)} K`}

function FourteenDayHorizon({ensemble,days,scenarios,climate,selectedDate,onSelectedDate,loading}:{ensemble:EnsembleDay[];days:Day[];scenarios:EnsembleScenarioCluster[];climate:ClimateDay[];selectedDate:string;onSelectedDate:(date:string)=>void;loading:boolean}){
 const series=useMemo(()=>ensembleSeries(ensemble,days,climate),[ensemble,days,climate]);
 const selected=series.find(item=>item.date===selectedDate)??series[0];
 if(!series.length)return <div className="cockpit-empty">14-Tage-Daten werden geladen …</div>;
 return <div className="cockpit-fourteen-day">
  <div className="cockpit-brief"><span><small>14-Tage-Übersicht</small><strong>{uncertaintySummary(series,scenarios)}</strong></span><small className="cockpit-legend-inline">Kompakt pro Tag: Temperaturabweichung · Niederschlagssignal · Wind/Böen · Konsistenz.</small></div>
  <div className="cockpit-fourteen-grid" data-cockpit-horizontal-scroll="true">{series.map(item=>{const amountScore=precipCombinedScore(item.bestPrecipitation,item.bestPrecipitationProbability),windScale=Math.max(1,...series.map(entry=>Math.max(entry.bestGust,entry.bestWind))),windWidth=Math.max(8,item.bestWind/windScale*100),gustWidth=Math.max(windWidth,item.bestGust/windScale*100),anomaly=item.anomaly,positive=Number.isFinite(anomaly)&&anomaly>=0,anomalyWidth=Math.min(48,Math.max(6,Math.abs(Number.isFinite(anomaly)?anomaly:0)*7));return <button type="button" key={item.date} className={`cockpit-fourteen-card${selected?.date===item.date?' active':''}`} onClick={()=>onSelectedDate(item.date)} aria-pressed={selected?.date===item.date}><header><span><b>{formatDate(item.date,{weekday:'short'})}</b><small>{formatDate(item.date,{day:'2-digit',month:'2-digit'})}</small></span><em style={{background:consistencyColor(item.consistency)}}>{item.consistency} %</em></header><div className="cockpit-fourteen-row"><label><ThermometerSun size={12}/> Temp</label><span className="cockpit-anomaly-track"><i className="zero"/><b className={positive?'positive':'negative'} style={{width:`${anomalyWidth}%`,background:anomalyColor(anomaly),[positive?'left':'right']:'50%'} as CSSProperties}/></span><small>{anomalyLabel(anomaly)}</small></div><div className="cockpit-fourteen-row"><label><Droplets size={12}/> Regen</label><span className="cockpit-rain-track"><b style={{width:`${amountScore}%`,opacity:Math.max(.34,item.bestPrecipitationProbability/100)}}/></span><small>{formatDecimalFixed(item.bestPrecipitation,1)} mm · {Math.round(item.bestPrecipitationProbability)} %</small></div><div className="cockpit-fourteen-row"><label><Wind size={12}/> Wind</label><span className="cockpit-wind-track"><i style={{width:`${gustWidth}%`}}/><b style={{width:`${windWidth}%`}}/></span><small>{wind(item.bestWind,'kn')} · Böen {wind(item.bestGust,'kn')}</small></div><footer className="cockpit-fourteen-temps"><b>{Math.round(item.bestMin)}°</b><em>/</em><strong>{Math.round(item.bestMax)}°</strong></footer></button>})}</div>
  {selected?<div className="cockpit-focus-card fourteen"><span><b>{formatDate(selected.date,{weekday:'long',day:'2-digit',month:'2-digit'})}</b><small>{loading?'Weitere Modellläufe werden ergänzt.':`Konsistenz ${selected.consistency} % · ${selected.modelCount} Modelle`}</small></span><span className="cockpit-fourteen-selected-temps"><b>{Math.round(selected.bestMin)}°</b><em>/</em><strong>{Math.round(selected.bestMax)}°</strong><small>{Number.isFinite(selected.anomaly)?`Abweichung zum Klimamittel ${anomalyLabel(selected.anomaly)}`:'Klimamittel nicht verfügbar'}</small></span><span><b>{formatDecimalFixed(selected.bestPrecipitation,1)} mm · {Math.round(selected.bestPrecipitationProbability)} %</b><small>Niederschlagssignal</small></span><span><b>{wind(selected.bestWind,'kn')} · Böen {wind(selected.bestGust,'kn')}</b><small>Wind und Böen</small></span></div>:null}
 </div>
}

function MiniRibbon({horizon,hours,days,ensemble,climate,timezone}:{horizon:ForecastHorizon;hours:Hour[];days:Day[];ensemble:EnsembleDay[];climate:ClimateDay[];timezone:string}){
 if(horizon==='short-term'){const points=regularShortTermPoints(hours,3).slice(0,8);return <span className="cockpit-mini-ribbon short">{points.map(point=>{const part=plausiblePrecipitation(point);return <i key={point.epoch} style={{height:`${Math.max(16,Math.round(point.probability))}%`,background:precipitationColor(point)}} title={`${formatClock(point.epoch,timezone)} · ${part.weatherLabel} · ${Math.round(point.probability)} %`}/>})}</span>}
 if(horizon==='seven-day'){const selected=days.slice(0,7);const minimum=Math.min(...selected.map(day=>day.min),0),maximum=Math.max(...selected.map(day=>day.max),1),range=Math.max(1,maximum-minimum);return <span className="cockpit-mini-ribbon seven">{selected.map(day=>{const left=((day.min-minimum)/range)*100,width=Math.max(8,(day.max-day.min)/range*100);return <i key={day.date}><b style={{left:`${left}%`,width:`${width}%`}}/></i>})}</span>}
 const series=ensembleSeries(ensemble,days,climate);return <span className="cockpit-mini-ribbon fourteen">{series.slice(0,14).map(item=><i key={item.date} style={{height:`${clamp(item.consistency,16,100)}%`,opacity:item.index>=7?.72:.96,background:consistencyColor(item.consistency)}} title={`${formatDate(item.date,{weekday:'short'})}: Konsistenz ${item.consistency} %`}/>)}</span>
}
function summaryByHorizon(horizon:ForecastHorizon,{hours,days,timezone,unit,sevenDaySummary,ensemble,scenarios,climate}:{hours:Hour[];days:Day[];timezone:string;unit:WindUnit;sevenDaySummary?:string;ensemble:EnsembleDay[];scenarios:EnsembleScenarioCluster[];climate:ClimateDay[]}){if(horizon==='short-term')return shortTermSummary(hours,timezone,unit);if(horizon==='seven-day')return sevenDaySummary||'Die nächsten sieben Tage werden in Tageskarten verdichtet.';const series=ensembleSeries(ensemble,days,climate);return uncertaintySummary(series,scenarios)}

function AnalysisReveal({open,onToggle,children}:{open:boolean;onToggle:()=>void;children?:ReactNode}){return <div className={`cockpit-analysis${open?' open':''}`}><button type="button" className="cockpit-analysis-toggle" onClick={onToggle} aria-expanded={open}><span><SlidersHorizontal size={18}/><strong>Vollständige Analyse öffnen</strong></span>{open?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button>{open&&children?<div className="cockpit-analysis-panel">{children}</div>:null}</div>}

function SvgWindDirectionArrow({x,y,direction,size=14,color='#2f9b6a'}:{x:number;y:number;direction:number;size?:number;color?:string}){const to=((direction%360)+540)%360,scale=size/14,description=`Wind aus ${Math.round(((direction%360)+360)%360)}°`;return <g className="svg-wind-direction-arrow" style={{color}} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${to.toFixed(1)}) scale(${scale.toFixed(3)})`} role="img" aria-label={description}><title>{description}</title><line x1="0" y1="5" x2="0" y2="-5"/><path d="M -3 -2 L 0 -6 L 3 -2"/></g>}

export function ForecastCockpit({mode,hours,minutes15,days,ensemble,scenarios,climate,timezone,unit,selectedDate,onSelectedDate,availability,sourceLabel,updatedLabel,ensembleLoading,details,cockpitDetails,sevenDaySummary}:ForecastCockpitProps){
 const availableHorizons=HORIZONS.filter(horizon=>horizonAvailable(horizon,availability));
 const [activeHorizon,setActiveHorizon]=useState<ForecastHorizon>(()=>readActiveHorizon(availability));
 const [analysisOpen,setAnalysisOpen]=useState(false);
 const wrapRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{if(!horizonAvailable(activeHorizon,availability))setActiveHorizon(readActiveHorizon(availability))},[activeHorizon,availability]);
 useEffect(()=>{try{localStorage.setItem(ACTIVE_HORIZON_KEY,activeHorizon)}catch{}},[activeHorizon]);
 useEffect(()=>{setAnalysisOpen(false)},[activeHorizon]);
 useEffect(()=>{const node=wrapRef.current;if(!node)return;requestAnimationFrame(()=>node.scrollTo({top:0,left:0,behavior:'smooth'}))},[activeHorizon]);
 const headerSummary=summaryByHorizon(activeHorizon,{hours,days,timezone,unit,sevenDaySummary,ensemble,scenarios,climate});
 const activeCompactDetail=activeHorizon==='fourteen-day'?cockpitDetails?.fourteenDay:undefined;
 const activeAnalysis=activeCompactDetail??(activeHorizon==='short-term'?details.shortTerm:activeHorizon==='seven-day'?details.sevenDay:details.fourteenDay);
 return <section ref={wrapRef} className={`forecast-cockpit mode-${mode}`}><header className="cockpit-header"><small>MID Prognose-Cockpit</small><strong>Kurzfrist · 7 Tage · 14 Tage</strong><span>{headerSummary}</span></header><div className={`cockpit-tabs tabs-${availableHorizons.length}`}>{availableHorizons.map(horizon=><button type="button" key={horizon} className={activeHorizon===horizon?'active':''} onClick={()=>setActiveHorizon(horizon)} aria-pressed={activeHorizon===horizon}><span>{horizonIcon(horizon)}</span><b>{horizonTitle(horizon)}</b><small>{summaryByHorizon(horizon,{hours,days,timezone,unit,sevenDaySummary,ensemble,scenarios,climate})}</small>{mode==='cockpit-ribbons'?<MiniRibbon horizon={horizon} hours={hours} days={days} ensemble={ensemble} climate={climate} timezone={timezone}/>:null}</button>)}</div><div className="cockpit-body">{activeHorizon==='short-term'?<ShortTermRibbon hours={hours} minutes15={minutes15} timezone={timezone} unit={unit} onSelectedDate={onSelectedDate}/>:null}{activeHorizon==='seven-day'?<SevenDayBand days={days} hours={hours} unit={unit} selectedDate={selectedDate} onSelectedDate={onSelectedDate} summary={sevenDaySummary}/>:null}{activeHorizon==='fourteen-day'?<FourteenDayHorizon ensemble={ensemble} days={days} scenarios={scenarios} climate={climate} selectedDate={selectedDate} onSelectedDate={onSelectedDate} loading={ensembleLoading}/>:null}<AnalysisReveal open={analysisOpen} onToggle={()=>setAnalysisOpen(value=>!value)}>{activeAnalysis}</AnalysisReveal></div><footer><span>{sourceLabel}</span><span>{updatedLabel}</span><button type="button" className="cockpit-footer-info" aria-label="Hinweis zur Prognosedarstellung"><Info size={14}/><small>Werte antippen für Details</small></button></footer></section>
}

export default ForecastCockpit;
