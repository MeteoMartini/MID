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

type ParameterRange={key:string;label:string;low:number;high:number;q25:number;q75:number;point:number|undefined;unit:string};
export function adaptiveForecastRanges(day:EnsembleDay|undefined):ParameterRange[]{
 if(!day||!(day.memberCount>=2||day.modelCount>=2))return [];
 const entries:ParameterRange[]=[
  {key:'temperature',label:'Tmax',low:day.maxLow,high:day.maxHigh,q25:day.maxQ25,q75:day.maxQ75,point:day.maxMedian,unit:'°C'},
  {key:'minimum',label:'Tmin',low:day.minLow,high:day.minHigh,q25:day.minQ25,q75:day.minQ75,point:day.minMedian,unit:'°C'},
  {key:'rain',label:'Regen',low:day.precipitationLow,high:day.precipitationHigh,q25:day.precipitationQ25,q75:day.precipitationQ75,point:day.precipitationMedian,unit:'mm'},
  {key:'wind',label:'Maximaler Mittelwind',low:day.windLow,high:day.windHigh,q25:day.windQ25,q75:day.windQ75,point:day.windMedian,unit:'kt'},
  {key:'gust',label:'Böen',low:day.gustLow,high:day.gustHigh,q25:day.gustQ25,q75:day.gustQ75,point:day.gustMedian,unit:'kt'},
 ];
 return entries.filter(r=>[r.low,r.high,r.q25,r.q75].every(Number.isFinite)&&r.low<=r.q25&&r.q25<=r.q75&&r.q75<=r.high&&(r.unit==='°C'||r.low>=0));
}

export function ForecastRangeGuide({day,days,compact=false,unit='kn'}:{day?:EnsembleDay;days:EnsembleDay[];temperature:number;temperatures?:number[];compact?:boolean;unit?:WindUnit}){
 const ranges=adaptiveForecastRanges(day).filter(r=>r.key!=='wind');
 if(!ranges.length)return null;
 const reference=days.flatMap(adaptiveForecastRanges);
 return <span className={`forecast-range-guide adaptive slim${compact?' compact':''}`} aria-label="Parameterbezogene Modellspannen P10–P90">
  {ranges.map(r=>{
   const peers=reference.filter(p=>r.unit==='°C'?p.unit==='°C':p.key===r.key),low=Math.min(r.low,...peers.map(p=>p.low)),high=Math.max(r.high,...peers.map(p=>p.high)),span=Math.max(r.unit==='°C'?1:.1,high-low),percent=(v:number)=>Math.max(0,Math.min(100,(v-low)/span*100)),point=typeof r.point==='number'&&Number.isFinite(r.point)&&r.point>=r.low&&r.point<=r.high?r.point:null,style={'--range-start':`${percent(r.low)}%`,'--range-width':`${percent(r.high)-percent(r.low)}%`,'--range-core-start':`${percent(r.q25)}%`,'--range-core-width':`${percent(r.q75)-percent(r.q25)}%`,'--range-point':`${percent(point??r.q25)}%`} as CSSProperties,format=(v:number)=>r.key==='rain'?compactPrecipitationAmount(v):String(Math.round(v));
   const isWind=r.unit==='kt',factor=!isWind?1:unit==='kmh'?1.852:unit==='ms'?.514444:unit==='mph'?1.15078:1,unitLabel=!isWind?r.unit:unit==='kmh'?'km/h':unit==='ms'?'m/s':unit==='mph'?'mph':'kt',formatBound=(v:number)=>`${format(v*factor)}${r.unit==='°C'?'':' '}${unitLabel}`,boundsTitle=`P25 ${formatBound(r.q25)} · P75 ${formatBound(r.q75)}`;
   return <span key={r.key} className={`forecast-parameter-range parameter-${r.key}`} role="img" aria-label={`${r.label}: P10–P90 ${format(r.low*factor)}–${format(r.high*factor)} ${unitLabel}; P25–P75 ${format(r.q25*factor)}–${format(r.q75*factor)} ${unitLabel}${point===null?'':`; Median ${format(point*factor)} ${unitLabel}`}`}>
    <span className="forecast-range-label" title={`P10–P90: ${format(r.low*factor)}–${format(r.high*factor)} ${unitLabel}`}>{r.label}</span>
    <span className="forecast-range-track" style={style} aria-hidden="true"><i className="outer"/><i className="core"/>{point!==null?<i className="point"/>:null}</span>
    <span className="forecast-range-bounds" title={boundsTitle} aria-hidden="true"><span><small>P25</small>{formatBound(r.q25)}</span><span><small>P75</small>{formatBound(r.q75)}</span></span>
   </span>
  })}
 </span>;
}

export function ForecastRangeLegend(){return <details className="forecast-range-legend"><summary>Modellspanne ⓘ</summary><p>Schmale Bänder zeigen ähnliche Modellprognosen, breite größere Unterschiede. Hell: P10–P90, dunkel: P25–P75. Der Strich zeigt den echten gewichteten Ensemble-Median, sofern verfügbar. Er teilt die Ensemblewerte in zwei Hälften; bei Niederschlag können seltenere hohe Mengen trotzdem relevant sein. Tmax und Tmin teilen dieselbe Temperaturskala. Pro Parameter gilt für alle sichtbaren Tage dieselbe Skala; verschiedene Parameter sind nicht direkt vergleichbar.</p><p>Spannen erscheinen nur mit belastbaren Daten für den jeweiligen Parameter. Tagesbänder gelten nicht für einzelne Stunden. Sie sind keine garantierten Eintrittsbereiche. Modellübereinstimmung ist keine Trefferwahrscheinlichkeit. Mit größerem Vorhersageabstand gewinnen Tendenzen gegenüber einzelnen Uhrzeiten an Bedeutung.</p></details>}
