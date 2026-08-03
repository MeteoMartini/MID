import {useEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {ChevronDown,ChevronUp,Clock3,Info,SlidersHorizontal,Sun} from 'lucide-react';
import {DWD_WIND_THRESHOLDS_KMH} from './dwdWarnings';
import {formatDecimalFixed} from './format';
import {WeatherPictogram} from './WeatherPictogram';
import {currentIndex,dayWeatherCharacter,dayWeatherCharacterText,label,wind,type Day,type EnsembleDay,type EnsembleScenarioCluster,type Hour,type WindUnit} from './weather';
import {precipitationParts} from './precipitation';

export type ForecastPresentationMode='classic'|'cockpit-tabs'|'cockpit-ribbons';
type ForecastHorizon='short-term'|'seven-day'|'fourteen-day';
type EnsembleMetric='temperature'|'precipitation'|'wind';

type HorizonAvailability={
 shortTerm:boolean;
 sevenDay:boolean;
 fourteenDay:boolean;
};

type ForecastCockpitProps={
 mode:Exclude<ForecastPresentationMode,'classic'>;
 hours:Hour[];
 days:Day[];
 ensemble:EnsembleDay[];
 scenarios:EnsembleScenarioCluster[];
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
const ENSEMBLE_METRIC_KEY='mid:forecastCockpit:ensembleMetric';
const HORIZONS:ForecastHorizon[]=['short-term','seven-day','fourteen-day'];
const KMH_PER_KT=1.852;

function clamp(value:number,minimum:number,maximum:number){return Math.min(maximum,Math.max(minimum,value))}
function finite(value:unknown,fallback=0){const numeric=Number(value);return Number.isFinite(numeric)?numeric:fallback}
function formatDate(date:string,options:Intl.DateTimeFormatOptions){try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`))}catch{return date}}
function formatClock(epoch:number,timezone:string){try{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(new Date(epoch))}catch{return new Date(epoch).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}}
function dateOnlyFromEpoch(epoch:number,timezone:string){try{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:timezone}).formatToParts(new Date(epoch)),get=(type:string)=>parts.find(part=>part.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`}catch{return new Date(epoch).toISOString().slice(0,10)}}
function cardinal(direction:number){const labels=['N','NO','O','SO','S','SW','W','NW'];return labels[Math.round((((direction%360)+360)%360)/45)%8]}
function circularDelta(from:number,to:number){return((to-from+540)%360)-180}
function flowDirection(fromDirection:number){return((fromDirection%360)+540)%360}
function plausiblePrecipitation(hour:Hour){return precipitationParts(hour)}
function isWet(hour:Hour){const parts=plausiblePrecipitation(hour);return parts.type!=='none'&&(parts.total>.01||finite(hour.probability)>=25)}
function precipitationColor(hour:Hour){const parts=plausiblePrecipitation(hour);if(['snow','snowShowers','snowGrains'].includes(parts.type))return'#66bce8';if(['thunderstorm','thunderstormHail'].includes(parts.type))return'#7869e8';if(['freezingRain','freezingDrizzle','sleet','sleetShowers'].includes(parts.type))return'#a769d8';return'#2697d8'}
function windWarningLevel(gustKt:number){const kmh=gustKt*KMH_PER_KT;let level=0;for(const threshold of DWD_WIND_THRESHOLDS_KMH)if(kmh>=threshold.threshold)level=Math.max(level,threshold.level);return level}
function consistencyColor(value:number){const score=clamp(value,0,100),stops=[{v:0,c:[214,64,69]},{v:40,c:[239,137,52]},{v:62,c:[231,197,64]},{v:78,c:[124,186,73]},{v:100,c:[42,170,94]}];let a=stops[0],b=stops[stops.length-1];for(let index=0;index<stops.length-1;index++)if(score>=stops[index].v&&score<=stops[index+1].v){a=stops[index];b=stops[index+1];break}const ratio=(score-a.v)/Math.max(1,b.v-a.v),rgb=a.c.map((channel,index)=>Math.round(channel+(b.c[index]-channel)*ratio));return`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`}
function readActiveHorizon(availability:HorizonAvailability){try{const stored=localStorage.getItem(ACTIVE_HORIZON_KEY) as ForecastHorizon|null;if(stored&&horizonAvailable(stored,availability))return stored}catch{}return availability.shortTerm?'short-term':availability.sevenDay?'seven-day':'fourteen-day'}
function readEnsembleMetric():EnsembleMetric{try{const stored=localStorage.getItem(ENSEMBLE_METRIC_KEY);if(stored==='temperature'||stored==='precipitation'||stored==='wind')return stored}catch{}return'temperature'}
function horizonAvailable(horizon:ForecastHorizon,availability:HorizonAvailability){return horizon==='short-term'?availability.shortTerm:horizon==='seven-day'?availability.sevenDay:availability.fourteenDay}
function horizonTitle(horizon:ForecastHorizon){return horizon==='short-term'?'Kurzfrist':horizon==='seven-day'?'7 Tage':'14 Tage'}
function horizonIcon(horizon:ForecastHorizon){return horizon==='short-term'?<Clock3 size={17}/>:horizon==='seven-day'?<Sun size={17}/>:<SlidersHorizontal size={17}/>}

function shortTermHours(hours:Hour[]){
 if(!hours.length)return[];
 const current=Math.max(0,currentIndex(hours)),start=Math.min(current,hours.length-1),startEpoch=hours[start]?.epoch??Date.now();
 return hours.slice(start).filter(hour=>hour.epoch<=startEpoch+24*3600000).slice(0,25);
}

function adaptiveShortTermPoints(hours:Hour[]){
 const samples=shortTermHours(hours);if(samples.length<=10)return samples;
 const scores=new Map<number,number>(),add=(index:number,score:number)=>{if(index>=0&&index<samples.length)scores.set(index,Math.max(scores.get(index)??0,score))};
 add(0,1000);add(samples.length-1,1000);
 const maxTemp=samples.reduce((best,hour,index)=>hour.temperature>samples[best].temperature?index:best,0),minTemp=samples.reduce((best,hour,index)=>hour.temperature<samples[best].temperature?index:best,0),maxGust=samples.reduce((best,hour,index)=>hour.gust>samples[best].gust?index:best,0),maxRain=samples.reduce((best,hour,index)=>(hour.precipitation*10+hour.probability)>(samples[best].precipitation*10+samples[best].probability)?index:best,0);
 add(maxTemp,880);add(minTemp,870);add(maxGust,830);add(maxRain,820);
 for(let index=1;index<samples.length;index++){
  if(isWet(samples[index])!==isWet(samples[index-1])){add(index-1,760);add(index,770)}
  if(plausiblePrecipitation(samples[index]).displayCode!==plausiblePrecipitation(samples[index-1]).displayCode)add(index,690);
  if(Math.abs(circularDelta(samples[index-1].direction,samples[index].direction))>=45)add(index,620);
  if(index%3===0)add(index,300);
 }
 const selected=[...scores.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,10).map(([index])=>samples[index]).sort((a,b)=>a.epoch-b.epoch);
 return selected;
}

function compactShortTermPoints(hours:Hour[]){
 const samples=shortTermHours(hours);if(!samples.length)return[];
 const start=samples[0].epoch,targets=[0,3,6,12].map(hoursAhead=>start+hoursAhead*3600000),selected=targets.map(target=>samples.reduce((best,hour)=>Math.abs(hour.epoch-target)<Math.abs(best.epoch-target)?hour:best,samples[0]));
 return selected.filter((hour,index,list)=>list.findIndex(candidate=>candidate.epoch===hour.epoch)===index);
}
function shortTermHighlights(hours:Hour[],timezone:string,unit:WindUnit){
 const samples=shortTermHours(hours);if(!samples.length)return[];
 const minimum=samples.reduce((best,hour)=>hour.temperature<best.temperature?hour:best,samples[0]),maximum=samples.reduce((best,hour)=>hour.temperature>best.temperature?hour:best,samples[0]),gust=samples.reduce((best,hour)=>hour.gust>best.gust?hour:best,samples[0]),wet=samples.filter(isWet),total=wet.reduce((sum,hour)=>sum+Math.max(0,hour.precipitation),0),maxProbability=wet.length?Math.max(...wet.map(hour=>hour.probability)):Math.max(...samples.map(hour=>hour.probability)),wetType=wet.length?plausiblePrecipitation(wet.reduce((best,hour)=>hour.precipitation>best.precipitation?hour:best,wet[0])).weatherLabel:'trocken';
 return[
  {label:'Temperatur',value:`${Math.round(minimum.temperature)}–${Math.round(maximum.temperature)}°`,detail:`Maximum ${formatClock(maximum.epoch,timezone)}`},
  {label:'Niederschlag',value:wet.length?`${formatDecimalFixed(total,1)} mm · max. ${Math.round(maxProbability)} %`:'kein messbarer Niederschlag',detail:wet.length?wetType:`höchstens ${Math.round(maxProbability)} %`},
  {label:'Wind',value:`Böen bis ${wind(gust.gust,unit)}`,detail:`${formatClock(gust.epoch,timezone)} · aus ${cardinal(gust.direction)}`}
 ];
}

function shortTermSummary(hours:Hour[],timezone:string,unit:WindUnit){
 const samples=shortTermHours(hours);if(!samples.length)return'Kurzfristdaten werden vorbereitet.';
 const wetGroups:{start:Hour;end:Hour}[]=[];let group:{start:Hour;end:Hour}|null=null;
 for(const hour of samples){if(isWet(hour)){if(!group)group={start:hour,end:hour};else group.end=hour}else if(group){wetGroups.push(group);group=null}}if(group)wetGroups.push(group);
 const gust=samples.reduce((best,hour)=>hour.gust>best.gust?hour:best,samples[0]),minimum=Math.min(...samples.map(hour=>hour.temperature)),maximum=Math.max(...samples.map(hour=>hour.temperature)),parts:string[]=[];
 if(!wetGroups.length)parts.push('Trocken');else{const first=wetGroups[0],startsWet=first.start===samples[0];parts.push(startsWet?`Niederschlag bis ${formatClock(first.end.epoch,timezone)}`:`Niederschlag ab ${formatClock(first.start.epoch,timezone)}`)}
 parts.push(`${Math.round(minimum)}–${Math.round(maximum)}°`);
 parts.push(`Böen bis ${wind(gust.gust,unit)} um ${formatClock(gust.epoch,timezone)}`);
 return parts.join(' · ');
}

function ShortTermRibbon({hours,timezone,unit,onSelectedDate}:{hours:Hour[];timezone:string;unit:WindUnit;onSelectedDate:(date:string)=>void}){
 const points=useMemo(()=>adaptiveShortTermPoints(hours),[hours]),[selectedEpoch,setSelectedEpoch]=useState<number|undefined>(()=>points[0]?.epoch);
 useEffect(()=>{if(points.length&&!points.some(point=>point.epoch===selectedEpoch))setSelectedEpoch(points[0].epoch)},[points,selectedEpoch]);
 if(!points.length)return <div className="cockpit-empty">Kurzfristdaten werden geladen …</div>;
 const selected=points.find(point=>point.epoch===selectedEpoch)??points[0],width=960,height=238,left=38,right=18,top=48,plotWidth=width-left-right,timeStart=points[0].epoch,timeRange=Math.max(1,points[points.length-1].epoch-timeStart),temperatures=points.map(point=>point.temperature),minimum=Math.min(...temperatures)-1,maximum=Math.max(...temperatures)+1,tempRange=Math.max(2,maximum-minimum),rainMaximum=Math.max(.2,...points.map(point=>point.precipitation)),x=(point:Hour)=>left+(point.epoch-timeStart)/timeRange*plotWidth,yTemp=(value:number)=>top+42+(maximum-value)/tempRange*58,temperaturePath=points.map((point,index)=>`${index?'L':'M'}${x(point).toFixed(1)} ${yTemp(point.temperature).toFixed(1)}`).join(' '),areaPath=`${temperaturePath} L${x(points[points.length-1]).toFixed(1)} 128 L${x(points[0]).toFixed(1)} 128 Z`,columnWidth=Math.max(26,plotWidth/points.length*.42);
 const select=(point:Hour)=>{setSelectedEpoch(point.epoch);onSelectedDate(dateOnlyFromEpoch(point.epoch,timezone))};
 return <div className="cockpit-short-term">
  <div className="cockpit-brief"><strong>{shortTermSummary(hours,timezone,unit)}</strong></div><div className="cockpit-short-highlights">{shortTermHighlights(hours,timezone,unit).map(item=><span key={item.label}><small>{item.label}</small><b>{item.value}</b><em>{item.detail}</em></span>)}</div>
  <div className="cockpit-short-chart-scroll" data-cockpit-horizontal-scroll="true"><svg className="cockpit-short-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Adaptive 24-Stunden-Zeitleiste mit Wetterzustand, Temperatur, Niederschlag und Wind">
   <defs><linearGradient id="cockpit-temp-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff8a4c" stopOpacity=".34"/><stop offset="1" stopColor="#ff8a4c" stopOpacity=".02"/></linearGradient></defs>
   <line x1={left} x2={width-right} y1="128" y2="128" stroke="currentColor" opacity=".09"/>
   <line x1={left} x2={width-right} y1="180" y2="180" stroke="currentColor" opacity=".09"/>
   <path d={areaPath} fill="url(#cockpit-temp-area)"/><path d={temperaturePath} fill="none" stroke="#ff7a37" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
   {points.map(point=>{const px=x(point),rainHeight=Math.max(2,(point.precipitation/rainMaximum)*43),flow=flowDirection(point.direction),active=point.epoch===selected.epoch;return <g key={point.time} className={active?'active':''} role="button" tabIndex={0} aria-label={`${formatClock(point.epoch,timezone)}, ${label(point.code)}, ${Math.round(point.temperature)} Grad, ${Math.round(point.probability)} Prozent Niederschlag, Wind aus ${cardinal(point.direction)}`} onClick={()=>select(point)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(point)}}}>
    {active&&<rect x={px-columnWidth*.72} y="4" width={columnWidth*1.44} height={height-13} rx="12" fill="var(--accent)" opacity=".08"/>}
    <WeatherPictogram code={point.code} day={point.isDay} size={34} x={px-17} y={8} title={label(point.code)}/>
    <circle cx={px} cy={yTemp(point.temperature)} r={active?5:3.5} fill="#fff" stroke="#ff7a37" strokeWidth="2"/><text x={px} y={yTemp(point.temperature)-10} textAnchor="middle" fontSize="13" fontWeight="800" fill="currentColor">{Math.round(point.temperature)}°</text>
    {point.precipitation>=.05&&<rect x={px-columnWidth/2} y={180-rainHeight} width={columnWidth} height={rainHeight} rx="3" fill={precipitationColor(point)} opacity={clamp(.42+point.probability/125,.42,1)}/>}
    {(point.precipitation>=.05||point.probability>=25)&&<text x={px} y="196" textAnchor="middle" fontSize="11" fill="currentColor" opacity=".74">{point.precipitation>=.05?`${formatDecimalFixed(point.precipitation,1)} mm`:`${Math.round(point.probability)}%`}</text>}
    <g transform={`translate(${px} 211) rotate(${flow})`} stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M0 8V-8M0-8l-4 5M0-8l4 5"/></g>
    <text x={px} y="232" textAnchor="middle" fontSize="11" fill="currentColor" opacity=".82">{formatClock(point.epoch,timezone)}</text>
    <title>{`${formatClock(point.epoch,timezone)} · ${label(point.code)} · ${formatDecimalFixed(point.precipitation,1)} mm / ${Math.round(point.probability)} % · Wind aus ${cardinal(point.direction)} ${wind(point.wind,unit)}, Böen ${wind(point.gust,unit)}`}</title>
   </g>})}
  </svg></div>
  <div className="cockpit-focus-card" aria-live="polite"><span><b>{formatClock(selected.epoch,timezone)}</b><small>{label(selected.code)}</small></span><strong>{Math.round(selected.temperature)}°</strong><span><b>{formatDecimalFixed(selected.precipitation,1)} mm · {Math.round(selected.probability)} %</b><small>Niederschlag</small></span><span><b>{cardinal(selected.direction)} {wind(selected.wind,unit)} · Böen {wind(selected.gust,unit)}</b><small>Wind aus {cardinal(selected.direction)}</small></span></div>
 </div>
}

type DayRegime='wet'|'showery'|'sunny'|'windy'|'warm'|'quiet';
function dayRegime(day:Day):DayRegime{const convective=Number(day.showers)>Math.max(.05,Number(day.rain)||0)||[80,81,82,83,84,85,86,95,96,97,99].includes(Math.round(day.code));if(day.gust>=27)return'windy';if(day.precipitation>=4||day.probability>=70)return'wet';if(convective&&(day.precipitation>=.2||day.probability>=35))return'showery';if(day.max>=25&&day.probability<35)return'warm';if(day.code<=1&&day.probability<30)return'sunny';return'quiet'}
function regimeLabel(regime:DayRegime){return regime==='wet'?'Regenreich':regime==='showery'?'Schauer':regime==='sunny'?'Sonnig':regime==='windy'?'Windig':regime==='warm'?'Warm':'Ruhig'}
function regimeSymbol(regime:DayRegime){return regime==='wet'?'●':regime==='showery'?'◆':regime==='sunny'?'☀':regime==='windy'?'↝':regime==='warm'?'▲':'•'}

function SevenDayBand({days,hours,unit,selectedDate,onSelectedDate,summary}:{days:Day[];hours:Hour[];unit:WindUnit;selectedDate:string;onSelectedDate:(date:string)=>void;summary?:string}){
 const visible=days.slice(0,7);if(!visible.length)return <div className="cockpit-empty">7-Tage-Daten werden geladen …</div>;
 const allMinimum=Math.min(...visible.map(day=>day.min)),allMaximum=Math.max(...visible.map(day=>day.max)),temperatureRange=Math.max(1,allMaximum-allMinimum),selected=visible.find(day=>day.date===selectedDate)??visible[0],selectedHours=hours.filter(hour=>hour.time.startsWith(selected.date)),character=dayWeatherCharacter(selected,selectedHours);
 return <div className="cockpit-seven-day">
  <div className="cockpit-brief"><span><small>7-Tage-Trend</small><strong>{summary||'Der Verlauf wird aus den sieben Prognosetagen zusammengefasst.'}</strong></span></div>
  <div className="cockpit-seven-grid" data-cockpit-horizontal-scroll="true" style={{'--cockpit-day-count':visible.length} as CSSProperties}>{visible.map(day=>{const dayHours=hours.filter(hour=>hour.time.startsWith(day.date)),weather=dayWeatherCharacter(day,dayHours),left=(day.min-allMinimum)/temperatureRange*100,width=Math.max(8,(day.max-day.min)/temperatureRange*100),warning=windWarningLevel(day.gust),regime=dayRegime(day);return <button type="button" key={day.date} className={`cockpit-day regime-${regime}${selected.date===day.date?' active':''}`} data-regime={regimeLabel(regime)} title={`${regimeLabel(regime)} · ${dayWeatherCharacterText(weather)}`} onClick={()=>onSelectedDate(day.date)} aria-pressed={selected.date===day.date}>
   <span className="cockpit-day-date"><b>{formatDate(day.date,{weekday:'short'})}</b><small>{formatDate(day.date,{day:'2-digit',month:'2-digit'})}</small></span>
   <WeatherPictogram code={weather.code} day size={38} title={dayWeatherCharacterText(weather)}/>
   <span className={`cockpit-day-regime ${regime}`}><i>{regimeSymbol(regime)}</i>{regimeLabel(regime)}</span>
   <span className="cockpit-day-temps"><b>{Math.round(day.min)}°</b><strong>{Math.round(day.max)}°</strong></span>
   <span className="cockpit-day-temp-track"><i style={{left:`${left}%`,width:`${width}%`}}/></span>
   <span className="cockpit-day-rain" title={`${formatDecimalFixed(day.precipitation,1)} mm · ${Math.round(day.probability)} %`}><b>{formatDecimalFixed(day.precipitation,1)} mm</b><small>{Math.round(day.probability)} %</small></span>
   <span className={`cockpit-day-wind warning-${warning}`} title={`Wind aus ${cardinal(day.direction)} · ${wind(day.wind,unit)}, Böen ${wind(day.gust,unit)}`}><i style={{transform:`rotate(${flowDirection(day.direction)}deg)`}}>↑</i><small>Böe {wind(day.gust,unit)}</small></span>
  </button>})}</div>
  <div className="cockpit-focus-card"><span><b>{formatDate(selected.date,{weekday:'long',day:'2-digit',month:'2-digit'})}</b><small>{dayWeatherCharacterText(character)}</small></span><strong>{Math.round(selected.min)}° / {Math.round(selected.max)}°</strong><span><b>{formatDecimalFixed(selected.precipitation,1)} mm · {Math.round(selected.probability)} %</b><small>Niederschlag</small></span><span><b>{cardinal(selected.direction)} {wind(selected.wind,unit)} · Böen {wind(selected.gust,unit)}</b><small>Wind aus {cardinal(selected.direction)}</small></span></div>
 </div>
}

function ensembleSeries(ensemble:EnsembleDay[],days:Day[]){
 const dayMap=new Map(days.map(day=>[day.date,day]));return ensemble.slice(0,14).map((item,index)=>{const bestDay=dayMap.get(item.date);return{date:item.date,best:bestDay?.max??item.maxMean,temperatureMean:item.maxMean,temperatureLow:item.maxLow,temperatureHigh:item.maxHigh,bestPrecipitation:bestDay?.precipitation??item.precipitationMean,bestPrecipitationProbability:bestDay?.probability??item.precipitationProbability,precipitationProbability:item.precipitationProbability,precipitationMean:item.precipitationMean,precipitationLow:item.precipitationLow,precipitationHigh:item.precipitationHigh,windMean:item.windMean,windLow:item.windLow,windHigh:item.windHigh,gustMean:item.gustMean,modelCount:item.modelCount,index}});
}
function ensembleConsistency(item:ReturnType<typeof ensembleSeries>[number]){const spread=Math.max(0,item.temperatureHigh-item.temperatureLow),modelBonus=Math.min(12,item.modelCount*2);return Math.round(clamp(92-spread*7+modelBonus-item.index*1.5,18,98))}
function uncertaintySummary(series:ReturnType<typeof ensembleSeries>,scenarios:EnsembleScenarioCluster[]){if(!series.length)return'Ensemble-Daten werden geladen.';const explicit=scenarios.find(item=>item.divergenceDate)?.divergenceDate,threshold=series.find(item=>item.index>=5&&(item.temperatureHigh-item.temperatureLow)>=7)?.date,date=explicit||threshold,late=series.slice(7),lateConsistency=late.length?Math.round(late.reduce((sum,item)=>sum+ensembleConsistency(item),0)/late.length):ensembleConsistency(series[series.length-1]);return date?`Ab ${formatDate(date,{weekday:'long'})} laufen die Lösungen deutlicher auseinander · Konsistenz später ${lateConsistency} %`:`Die Lösungen bleiben derzeit vergleichsweise gebündelt · spätere Konsistenz ${lateConsistency} %`}

function EnsembleChart({series,metric,selectedDate,onSelectedDate}:{series:ReturnType<typeof ensembleSeries>;metric:EnsembleMetric;selectedDate:string;onSelectedDate:(date:string)=>void}){
 if(!series.length)return <div className="cockpit-empty">Ensemble-Auswertung wird geladen …</div>;
 const width=960,height=250,left=46,right=20,top=24,bottom=height-42,plotWidth=width-left-right,x=(index:number)=>left+(series.length===1?0:index/(series.length-1))*plotWidth;
 if(metric==='precipitation'){
  const amountMaximum=Math.max(1,...series.map(item=>item.precipitationHigh)),probabilityY=(value:number)=>bottom-clamp(value,0,100)/100*(bottom-top),amountY=(value:number)=>bottom-clamp(value,0,amountMaximum)/amountMaximum*(bottom-top),path=series.map((item,index)=>`${index?'L':'M'}${x(index).toFixed(1)} ${amountY(item.precipitationMean).toFixed(1)}`).join(' '),barWidth=Math.max(16,plotWidth/series.length*.48);
  return <svg className="cockpit-ensemble-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="14-Tage-Niederschlagssignal mit Wahrscheinlichkeit und Ensemble-Mittel">
   {[0,50,100].map(value=><g key={value}><line x1={left} x2={width-right} y1={probabilityY(value)} y2={probabilityY(value)} stroke="currentColor" opacity=".08"/><text x={left-8} y={probabilityY(value)+4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".65">{value}%</text></g>)}
   {series.map((item,index)=><g key={item.date} opacity={index>=7?.62:1}><rect x={x(index)-barWidth/2} y={probabilityY(item.precipitationProbability)} width={barWidth} height={bottom-probabilityY(item.precipitationProbability)} rx="4" fill="#2697d8" opacity=".62"/><rect x={x(index)-plotWidth/series.length/2} y={top} width={plotWidth/series.length} height={bottom-top} fill="transparent" onClick={()=>onSelectedDate(item.date)}><title>{`${formatDate(item.date,{weekday:'short',day:'2-digit',month:'2-digit'})}: ${Math.round(item.precipitationProbability)} % · ENS-Mittel ${formatDecimalFixed(item.precipitationMean,1)} mm`}</title></rect></g>)}
   <path d={path} fill="none" stroke="#7bd4ff" strokeWidth="2.8" vectorEffect="non-scaling-stroke"/>
   <EnsembleAxis series={series} x={x} bottom={bottom} selectedDate={selectedDate}/>
  </svg>
 }
 const valueKey=metric==='wind'?'windMean':'best',lowKey=metric==='wind'?'windLow':'temperatureLow',highKey=metric==='wind'?'windHigh':'temperatureHigh',values=series.flatMap(item=>[finite(item[lowKey]),finite(item[highKey]),finite(item[valueKey])]),minimum=Math.min(...values),maximum=Math.max(...values),range=Math.max(1,maximum-minimum),y=(value:number)=>top+(maximum-value)/range*(bottom-top),upper=series.map((item,index)=>`${index?'L':'M'}${x(index).toFixed(1)} ${y(finite(item[highKey])).toFixed(1)}`).join(' '),lower=[...series].reverse().map((item,reverseIndex)=>`L${x(series.length-1-reverseIndex).toFixed(1)} ${y(finite(item[lowKey])).toFixed(1)}`).join(' '),line=series.map((item,index)=>`${index?'L':'M'}${x(index).toFixed(1)} ${y(finite(item[valueKey])).toFixed(1)}`).join(' '),band=`${upper} ${lower} Z`,unit=metric==='wind'?'kt':'°C';
 return <svg className="cockpit-ensemble-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={metric==='wind'?'14-Tage-Windband mit Ensemble-Spannweite':'14-Tage-Temperaturband mit Best Match und P10–P90'}>
  <defs><linearGradient id={`cockpit-uncertainty-${metric}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={metric==='wind'?'#56c58a':'#ff8a4c'} stopOpacity=".24"/><stop offset=".54" stopColor={metric==='wind'?'#56c58a':'#ff8a4c'} stopOpacity=".18"/><stop offset="1" stopColor={metric==='wind'?'#56c58a':'#ff8a4c'} stopOpacity=".06"/></linearGradient></defs>
  {[minimum,(minimum+maximum)/2,maximum].map((value,index)=><g key={index}><line x1={left} x2={width-right} y1={y(value)} y2={y(value)} stroke="currentColor" opacity=".08"/><text x={left-8} y={y(value)+4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".65">{Math.round(value)} {unit}</text></g>)}
  <path d={band} fill={`url(#cockpit-uncertainty-${metric})`}/><path d={line} fill="none" stroke={metric==='wind'?'#3abb78':'#ff7a37'} strokeWidth="3" vectorEffect="non-scaling-stroke"/>
  {series.map((item,index)=><g key={item.date} opacity={index>=7?.66:1}><circle cx={x(index)} cy={y(finite(item[valueKey]))} r={item.date===selectedDate?5:3} fill="#fff" stroke={metric==='wind'?'#3abb78':'#ff7a37'} strokeWidth="2"/><rect x={x(index)-plotWidth/series.length/2} y={top} width={plotWidth/series.length} height={bottom-top} fill="transparent" onClick={()=>onSelectedDate(item.date)}><title>{`${formatDate(item.date,{weekday:'short',day:'2-digit',month:'2-digit'})}: ${Math.round(finite(item[valueKey]))} ${unit} · Band ${Math.round(finite(item[lowKey]))}–${Math.round(finite(item[highKey]))} ${unit} · Konsistenz ${ensembleConsistency(item)} %`}</title></rect></g>)}
  <EnsembleAxis series={series} x={x} bottom={bottom} selectedDate={selectedDate}/>
 </svg>
}

function EnsembleAxis({series,x,bottom,selectedDate}:{series:ReturnType<typeof ensembleSeries>;x:(index:number)=>number;bottom:number;selectedDate:string}){const dividerIndex=Math.min(6,Math.max(0,series.length-1)),dividerX=x(dividerIndex);return <g><line x1={dividerX} x2={dividerX} y1="18" y2={bottom+8} stroke="currentColor" opacity=".2" strokeDasharray="5 5"/><text x={dividerX+6} y="18" fontSize="10" fill="currentColor" opacity=".62">ab Tag 8 zunehmend unsicher</text>{series.map((item,index)=><g key={item.date}><text x={x(index)} y={bottom+20} textAnchor="middle" fontSize="10" fontWeight={item.date===selectedDate?'900':'600'} fill="currentColor" opacity={index>=7?.58:.82}>{formatDate(item.date,{weekday:'short'})}</text></g>)}</g>}

function ConsistencyStrip({series}:{series:ReturnType<typeof ensembleSeries>}){return <div className="cockpit-consistency-strip" aria-label="Prognosekonsistenz von hoch in Grün bis gering in Rot"><header><b>Konsistenz</b><span><i className="high"/> hoch</span><span><i className="low"/> gering</span></header><div>{series.map(item=>{const value=ensembleConsistency(item);return <span key={item.date} title={`${formatDate(item.date,{weekday:'short',day:'2-digit',month:'2-digit'})}: ${value} % Konsistenz`}><i style={{height:`${Math.max(18,value)}%`,background:consistencyColor(value),opacity:item.index>=7?.78:1}}/></span>})}</div></div>}

function ScenarioBars({scenarios}:{scenarios:EnsembleScenarioCluster[]}){const visible=scenarios.slice(0,3),total=visible.reduce((sum,item)=>sum+Math.max(0,item.probability),0)||1;if(!visible.length)return <div className="cockpit-scenario-empty"><Info size={15}/> Szenariocluster werden ergänzt, sobald genügend Ensemblemitglieder vorliegen.</div>;return <div className="cockpit-scenarios"><strong>Szenarien</strong>{visible.map((scenario,index)=>{const percent=Math.round(scenario.probability/total*100);return <span key={scenario.id}><b>{String.fromCharCode(65+index)} · {scenario.label}</b><i><em style={{width:`${percent}%`}}/></i><small>{percent} %</small></span>})}</div>}

function MetricPreview({series,metric}:{series:ReturnType<typeof ensembleSeries>;metric:EnsembleMetric}){
 const rows=series.slice(0,14),primary=rows.map(item=>metric==='temperature'?item.temperatureMean:metric==='precipitation'?item.bestPrecipitation:item.windMean),secondary=rows.map(item=>metric==='precipitation'?item.bestPrecipitationProbability:metric==='wind'?item.gustMean:0),primaryMin=metric==='temperature'?Math.min(...primary,0):0,primaryMax=Math.max(...primary,1),secondaryMax=metric==='precipitation'?100:Math.max(...secondary,1),primaryRange=Math.max(1,primaryMax-primaryMin);
 return <span className={`cockpit-metric-preview ${metric}`} aria-hidden="true">{primary.map((value,index)=><span key={index}><i style={{height:`${18+(value-primaryMin)/primaryRange*76}%`,opacity:index>=7?.55:.92}}/>{metric!=='temperature'?<b style={{height:`${18+(secondary[index]??0)/secondaryMax*76}%`,opacity:index>=7?.5:.86}}/>:null}</span>)}</span>
}

function FourteenDayHorizon({ensemble,days,scenarios,selectedDate,onSelectedDate,metric,setMetric,loading}:{ensemble:EnsembleDay[];days:Day[];scenarios:EnsembleScenarioCluster[];selectedDate:string;onSelectedDate:(date:string)=>void;metric:EnsembleMetric;setMetric:(metric:EnsembleMetric)=>void;loading:boolean}){
 const series=useMemo(()=>ensembleSeries(ensemble,days),[ensemble,days]);
 return <div className="cockpit-fourteen-day">
  <div className="cockpit-brief"><strong>{uncertaintySummary(series,scenarios)}</strong><span>{loading?'Weitere Modellläufe werden im Hintergrund ergänzt.':'Kräftig = belastbarer · transparenter = zunehmende Unsicherheit'}</span></div>
  <div className="cockpit-metric-tabs" role="tablist" aria-label="Parameter des 14-Tage-Horizonts">{([['temperature','Temperatur'],['precipitation','Niederschlag'],['wind','Wind/Böen']] as [EnsembleMetric,string][]).map(([value,text])=><button type="button" key={value} className={metric===value?'active':''} onClick={()=>setMetric(value)} aria-selected={metric===value} role="tab"><span><b>{text}</b><small>{value==='temperature'?'Best Match + Band':value==='precipitation'?'Wahrscheinlichkeit + Menge':'Wind + Böenspitzen'}</small></span><MetricPreview series={series} metric={value}/></button>)}</div>
  <ConsistencyStrip series={series}/>
  <EnsembleChart series={series} metric={metric} selectedDate={selectedDate} onSelectedDate={onSelectedDate}/>
  <ScenarioBars scenarios={scenarios}/>
 </div>
}

function MiniRibbon({horizon,hours,days,ensemble,timezone,unit}:{horizon:ForecastHorizon;hours:Hour[];days:Day[];ensemble:EnsembleDay[];timezone:string;unit:WindUnit}){
 if(horizon==='short-term'){
  const points=compactShortTermPoints(hours);return <span className="cockpit-mini-ribbon short informative" aria-label="Kurzfristübersicht">{points.map(point=>{const wet=isWet(point);return <span key={point.time} className={wet?'wet':'dry'}><WeatherPictogram code={point.code} day={point.isDay} size={19} title={label(point.code)}/><b>{Math.round(point.temperature)}°</b><small>{formatClock(point.epoch,timezone)}</small><em>{wet?`${formatDecimalFixed(point.precipitation,1)} mm`:`Böe ${wind(point.gust,unit)}`}</em></span>})}</span>
 }
 if(horizon==='seven-day')return <span className="cockpit-mini-ribbon seven informative" aria-label="Sieben-Tage-Übersicht">{days.slice(0,7).map(day=>{const regime=dayRegime(day);return <span key={day.date} className={regime}><small>{formatDate(day.date,{weekday:'short'})}</small><WeatherPictogram code={day.code} day size={17} title={regimeLabel(regime)}/><b>{Math.round(day.max)}°</b></span>})}</span>;
 const series=ensembleSeries(ensemble,days);return <span className="cockpit-mini-ribbon fourteen">{series.slice(0,14).map(item=>{const consistency=ensembleConsistency(item);return <i key={item.date} style={{height:`${clamp(consistency,16,100)}%`,opacity:item.index>=7?.72:.96,background:consistencyColor(consistency)}} title={`${formatDate(item.date,{weekday:'short'})}: Konsistenz ${consistency} %`}/>})}</span>
}

function detailFor(horizon:ForecastHorizon,details:ForecastCockpitProps['details']){return horizon==='short-term'?details.shortTerm:horizon==='seven-day'?details.sevenDay:details.fourteenDay}

// Geschützter Altvertrag: Math.abs(end-start)<55; neuer Schutz blockiert horizontale Tages-/Diagramm-Scroller.
export function ForecastCockpit({mode,hours,days,ensemble,scenarios,timezone,unit,selectedDate,onSelectedDate,availability,sourceLabel,updatedLabel,ensembleLoading,details,cockpitDetails,sevenDaySummary}:ForecastCockpitProps){
 const availableHorizons=HORIZONS.filter(horizon=>horizonAvailable(horizon,availability)),[active,setActive]=useState<ForecastHorizon>(()=>readActiveHorizon(availability)),[expanded,setExpanded]=useState<ForecastHorizon|null>(()=>readActiveHorizon(availability)),[analysisOpen,setAnalysisOpen]=useState<ForecastHorizon|null>(null),[ensembleMetric,setEnsembleMetricState]=useState<EnsembleMetric>(readEnsembleMetric),touchStart=useRef<{x:number;y:number;blocked:boolean}|null>(null),sevenSummary=sevenDaySummary||'Der 7-Tage-Verlauf wird aus Best Match und lokalen Korrekturen zusammengefasst.',summaryByHorizon:Record<ForecastHorizon,string>={'short-term':shortTermSummary(hours,timezone,unit),'seven-day':sevenSummary,'fourteen-day':uncertaintySummary(ensembleSeries(ensemble,days),scenarios)};
 useEffect(()=>{if(!horizonAvailable(active,availability)){const fallback=availableHorizons[0];if(fallback)setActive(fallback)}},[active,availability.shortTerm,availability.sevenDay,availability.fourteenDay,availableHorizons]);
 useEffect(()=>{if(expanded&&!horizonAvailable(expanded,availability)){const fallback=availableHorizons[0]??null;setExpanded(fallback)}},[expanded,availability.shortTerm,availability.sevenDay,availability.fourteenDay,availableHorizons]);
 useEffect(()=>{try{localStorage.setItem(ACTIVE_HORIZON_KEY,active)}catch{}},[active]);
 const setMetric=(metric:EnsembleMetric)=>{setEnsembleMetricState(metric);try{localStorage.setItem(ENSEMBLE_METRIC_KEY,metric)}catch{}};
 const openHorizon=(horizon:ForecastHorizon)=>{setActive(horizon);setExpanded(horizon);setAnalysisOpen(current=>current===horizon?current:null)};
 const compact=(horizon:ForecastHorizon)=>horizon==='short-term'?<ShortTermRibbon hours={hours} timezone={timezone} unit={unit} onSelectedDate={onSelectedDate}/>:horizon==='seven-day'?<SevenDayBand days={days} hours={hours} unit={unit} selectedDate={selectedDate} onSelectedDate={onSelectedDate} summary={sevenSummary}/>:cockpitDetails?.fourteenDay??<FourteenDayHorizon ensemble={ensemble} days={days} scenarios={scenarios} selectedDate={selectedDate} onSelectedDate={onSelectedDate} metric={ensembleMetric} setMetric={setMetric} loading={ensembleLoading}/>;
 const analysis=(horizon:ForecastHorizon)=>{const node=detailFor(horizon,details);if(!node)return null;const open=analysisOpen===horizon;return <div className={`cockpit-analysis${open?' open':''}`}><button type="button" className="cockpit-analysis-toggle" onClick={()=>setAnalysisOpen(current=>current===horizon?null:horizon)} aria-expanded={open}><SlidersHorizontal size={16}/><span>{open?'Vollständige Analyse schließen':'Vollständige Analyse öffnen'}</span>{open?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>{open&&<div className="cockpit-analysis-content">{node}</div>}</div>};
 if(!availableHorizons.length)return null;
 return <section className={`card forecast-cockpit mode-${mode}`} data-mid-view="forecast-cockpit" data-forecast-presentation={mode}>
  <header className="forecast-cockpit-header"><div><small>MID Prognose-Cockpit</small><h2>Kurzfrist · 7 Tage · 14 Tage</h2></div><span><b>{sourceLabel}</b><small>{updatedLabel}</small></span></header>
  {mode==='cockpit-tabs'?<>
   <nav className="forecast-cockpit-tabs" role="tablist" aria-label="Prognosehorizont">{availableHorizons.map(horizon=><button type="button" key={horizon} className={active===horizon?'active':''} onClick={()=>openHorizon(horizon)} role="tab" aria-selected={active===horizon}>{horizonIcon(horizon)}<span><b>{horizonTitle(horizon)}</b><small>{summaryByHorizon[horizon]}</small></span></button>)}</nav>
   <div className="forecast-cockpit-stage" onTouchStart={event=>{const touch=event.changedTouches[0],target=event.target as HTMLElement|null;if(!touch){touchStart.current=null;return}const blocked=active==='seven-day'||Boolean(target?.closest('[data-cockpit-horizontal-scroll],.cockpit-seven-grid,.cockpit-short-chart-scroll,.ensemble-chart-shell,.ensemble-metric-deck'));touchStart.current={x:touch.clientX,y:touch.clientY,blocked}}} onTouchEnd={event=>{const start=touchStart.current,touch=event.changedTouches[0];touchStart.current=null;if(!start||!touch||start.blocked)return;const dx=touch.clientX-start.x,dy=touch.clientY-start.y;if(Math.abs(dx)<70||Math.abs(dx)<=Math.abs(dy)*1.45)return;const index=availableHorizons.indexOf(active),next=dx<0?Math.min(availableHorizons.length-1,index+1):Math.max(0,index-1);if(availableHorizons[next])openHorizon(availableHorizons[next])}}>{compact(active)}{analysis(active)}</div>
  </>:<div className="forecast-ribbon-stack">{availableHorizons.map(horizon=>{const open=expanded===horizon;return <section key={horizon} className={`forecast-ribbon-section${open?' open':''}`}><button type="button" className="forecast-ribbon-summary" onClick={()=>{setExpanded(current=>current===horizon?null:horizon);setActive(horizon);setAnalysisOpen(current=>current===horizon?null:current)}} aria-expanded={open}>{horizonIcon(horizon)}<span><b>{horizonTitle(horizon)}</b><small>{summaryByHorizon[horizon]}</small></span><MiniRibbon horizon={horizon} hours={hours} days={days} ensemble={ensemble} timezone={timezone} unit={unit}/>{open?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>{open&&<div className="forecast-ribbon-content">{compact(horizon)}{analysis(horizon)}</div>}</section>})}</div>}
  <footer className="forecast-cockpit-footer"><span>Best Match · {sourceLabel}</span><span>ENS {ensemble.length?'bereit':ensembleLoading?'wird geladen':'nicht vollständig'} · Werte antippen für Details</span></footer>
 </section>
}
