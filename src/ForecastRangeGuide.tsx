import type {CSSProperties} from 'react';
import type {EnsembleDay,WindUnit} from './weather';
import {compactPrecipitationAmount} from './forecastAmountFormat';
import './radarForecastReadability.css';

export function forecastRangeValues(day:EnsembleDay|undefined){
 if(!day||!(day.memberCount>=2||day.modelCount>=2))return null;
 const range=(low:number,high:number,q25:number,q75:number)=>[low,high,q25,q75].every(Number.isFinite)&&low<=q25&&q25<=q75&&q75<=high?{low,high,q25,q75}:null;
 const temperature=range(day.maxLow,day.maxHigh,day.maxQ25,day.maxQ75),rain=range(day.precipitationLow,day.precipitationHigh,day.precipitationQ25,day.precipitationQ75);
 return temperature&&rain?{temperature,rain}:null;
}

type ParameterRange={key:string;label:string;low:number;high:number;q25:number;q75:number;point:number;unit:string};
export function adaptiveForecastRanges(day:EnsembleDay|undefined):ParameterRange[]{
 if(!day||!(day.memberCount>=2||day.modelCount>=2))return [];
 const entries:ParameterRange[]=[
  {key:'temperature',label:'Tageshöchstwert',low:day.maxLow,high:day.maxHigh,q25:day.maxQ25,q75:day.maxQ75,point:day.maxMean,unit:'°'},
  {key:'minimum',label:'Tagestiefstwert',low:day.minLow,high:day.minHigh,q25:day.minQ25,q75:day.minQ75,point:day.minMean,unit:'°'},
  {key:'rain',label:'Niederschlag',low:day.precipitationLow,high:day.precipitationHigh,q25:day.precipitationQ25,q75:day.precipitationQ75,point:day.precipitationMean,unit:'mm'},
  {key:'wind',label:'Maximaler Mittelwind',low:day.windLow,high:day.windHigh,q25:day.windQ25,q75:day.windQ75,point:day.windMean,unit:'kt'},
  {key:'gust',label:'Maximale Böen',low:day.gustLow,high:day.gustHigh,q25:day.gustQ25,q75:day.gustQ75,point:day.gustMean,unit:'kt'},
 ];
 return entries.filter(r=>[r.low,r.high,r.q25,r.q75,r.point].every(Number.isFinite)&&r.low<=r.q25&&r.q25<=r.q75&&r.q75<=r.high&&(r.unit==='°'||r.low>=0));
}

export function ForecastRangeGuide({day,days,temperature,temperatures=[],compact=false,unit='kn'}:{day?:EnsembleDay;days:EnsembleDay[];temperature:number;temperatures?:number[];compact?:boolean;unit?:WindUnit}){
 const ranges=adaptiveForecastRanges(day).filter(r=>!compact||!['minimum','gust'].includes(r.key));
 if(!ranges.length)return <span className="forecast-range-pending">Modellspanne noch nicht verfügbar</span>;
 const reference=days.flatMap(adaptiveForecastRanges);
 return <span className={`forecast-range-guide adaptive${compact?' compact':''}`} aria-label="Parameterbezogene Modellspannen P10–P90">
  {ranges.map(r=>{const peers=reference.filter(p=>p.key===r.key),low=Math.min(r.low,...peers.map(p=>p.low),...(r.key==='temperature'?temperatures.filter(Number.isFinite):[])),high=Math.max(r.high,...peers.map(p=>p.high),...(r.key==='temperature'?temperatures.filter(Number.isFinite):[])),span=Math.max(r.unit==='°'?1:.1,high-low),percent=(v:number)=>Math.max(0,Math.min(100,(v-low)/span*100)),point=r.key==='temperature'?temperature:r.point,style={'--range-start':`${percent(r.low)}%`,'--range-width':`${Math.max(.8,percent(r.high)-percent(r.low))}%`,'--range-core-start':`${percent(r.q25)}%`,'--range-core-width':`${Math.max(.8,percent(r.q75)-percent(r.q25))}%`,'--range-point':`${percent(point)}%`} as CSSProperties,format=(v:number)=>r.key==='rain'?compactPrecipitationAmount(v):String(Math.round(v));
   const isWind=r.key==='wind'||r.key==='gust',factor=!isWind?1:unit==='kmh'?1.852:unit==='ms'?.514444:unit==='mph'?1.15078:1,unitLabel=!isWind?r.unit:unit==='kmh'?'km/h':unit==='ms'?'m/s':unit==='mph'?'mph':'kt';
   return <span key={r.key} className={`forecast-parameter-range parameter-${r.key}`}><span className="forecast-range-value"><span>{r.label}</span><b>{format(r.low*factor)}–{format(r.high*factor)} {unitLabel}</b></span><span className="forecast-range-track" style={style} aria-hidden="true"><i className="outer"/><i className="core"/><i className="point"/></span></span>})}
  <small>Modellspanne · P10–P90</small>
 </span>;
}

export function ForecastRangeLegend(){return <details className="forecast-range-legend"><summary>Wie sicher ist der Ausblick?</summary><p>Schmale Bänder zeigen ähnliche Modellprognosen, breite größere Unterschiede. Hell: P10–P90, dunkel: P25–P75. Der Strich zeigt den angezeigten Höchstwert beziehungsweise den Modellmittelwert. Pro Parameter gilt für alle sichtbaren Tage dieselbe Skala; verschiedene Parameter sind nicht direkt vergleichbar.</p><p>Spannen erscheinen nur mit belastbaren Daten für den jeweiligen Parameter. Tagesbänder gelten nicht für einzelne Stunden. Sie sind keine garantierten Eintrittsbereiche. Modellübereinstimmung ist keine Trefferwahrscheinlichkeit. Mit größerem Vorhersageabstand gewinnen Tendenzen gegenüber einzelnen Uhrzeiten an Bedeutung.</p></details>}
