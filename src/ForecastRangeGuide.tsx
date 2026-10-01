import type {CSSProperties} from 'react';
import type {EnsembleDay} from './weather';
import {formatDecimalFixed} from './format';
import './radarForecastReadability.css';

export function forecastRangeValues(day:EnsembleDay|undefined){
 if(!day||!(day.memberCount>=2||day.modelCount>=2))return null;
 const range=(low:number,high:number,q25:number,q75:number)=>[low,high,q25,q75].every(Number.isFinite)&&low<=q25&&q25<=q75&&q75<=high?{low,high,q25,q75}:null;
 const temperature=range(day.maxLow,day.maxHigh,day.maxQ25,day.maxQ75),rain=range(day.precipitationLow,day.precipitationHigh,day.precipitationQ25,day.precipitationQ75);
 return temperature&&rain?{temperature,rain}:null;
}

export function ForecastRangeGuide({day,days,temperature,compact=false}:{day?:EnsembleDay;days:EnsembleDay[];temperature:number;compact?:boolean}){
 const ranges=forecastRangeValues(day);
 if(!ranges)return <span className="forecast-range-pending">Modellspanne noch nicht verfügbar</span>;
 const valid=days.map(forecastRangeValues).filter((value):value is NonNullable<ReturnType<typeof forecastRangeValues>>=>Boolean(value)),low=Math.min(...valid.map(value=>value.temperature.low),ranges.temperature.low,temperature),high=Math.max(...valid.map(value=>value.temperature.high),ranges.temperature.high,temperature),span=Math.max(1,high-low),percent=(value:number)=>(value-low)/span*100,t=ranges.temperature;
 const style={'--range-start':`${percent(t.low)}%`,'--range-width':`${Math.max(.8,(t.high-t.low)/span*100)}%`,'--range-core-start':`${percent(t.q25)}%`,'--range-core-width':`${Math.max(.8,(t.q75-t.q25)/span*100)}%`,'--range-point':`${percent(temperature)}%`} as CSSProperties;
 return <span className={`forecast-range-guide${compact?' compact':''}`} aria-label={`Modellspanne P10 bis P90: Tageshöchsttemperatur ${Math.round(t.low)} bis ${Math.round(t.high)} Grad; Niederschlag ${formatDecimalFixed(ranges.rain.low,1)} bis ${formatDecimalFixed(ranges.rain.high,1)} Millimeter`}>
  <span className="forecast-range-value"><span>Tageshöchstwert</span><b>{Math.round(t.low)}–{Math.round(t.high)}°</b></span>
  <span className="forecast-range-track" style={style} aria-hidden="true"><i className="outer"/><i className="core"/><i className="point"/></span>
  <span className="forecast-range-value"><span>Niederschlag</span><b>{formatDecimalFixed(ranges.rain.low,1)}–{formatDecimalFixed(ranges.rain.high,1)} mm</b></span>
  <small>Modellspanne · P10–P90</small>
 </span>;
}

export function ForecastRangeLegend(){return <details className="forecast-range-legend"><summary>Wie sicher ist der Ausblick?</summary><p>Ein schmales Band zeigt ähnliche Modellprognosen, ein breites Band größere Unterschiede. Das helle Band zeigt P10–P90, das dunkle den mittleren Bereich P25–P75. Der Strich markiert den angezeigten Tageshöchstwert. Alle Tage verwenden dieselbe Temperaturskala.</p><p>Die Spannen stammen aus den verfügbaren gewichteten Modellläufen. Sie sind keine garantierten Eintrittsbereiche. Modellübereinstimmung ist keine Trefferwahrscheinlichkeit. Mit größerem Vorhersageabstand gewinnen Tendenzen gegenüber einzelnen Uhrzeiten an Bedeutung.</p></details>}
