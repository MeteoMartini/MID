import './midDesignWeSeven.css';
import {useMemo} from 'react';
import {WeatherPictogram} from './WeatherPictogram';
import {HorizonSignalChart} from './HorizonSignalChart';
import {dayPeriodHoursForDate} from './forecastPeriods';
import {dayWeatherCharacter,wind,type Day,type Hour,type EnsembleDay,type WindUnit} from './weather';
import {compactPrecipitationAmount} from './precipitation';
import {formatDecimalFixed} from './format';
import {ecmwfTemperatureColor,parameterTemperatureTone} from './temperatureTone';

export type SevenDayView='standard'|'charts'|'table';
type Props={
 days:Day[];
 ensemble:EnsembleDay[];
 hours:Hour[];
 unit:WindUnit;
 ecmwfTemperatureColors?:boolean;
 mode:SevenDayView;
 onModeChange:(next:SevenDayView)=>void;
 onOpenDay:(date:string)=>void;
};
const modes:ReadonlyArray<{key:SevenDayView;label:string;help:string}>=[
 {key:'standard',label:'Standard',help:'Kompakte Tageskarten'},
 {key:'charts',label:'Grafik',help:'Erweiterte Diagramme'},
 {key:'table',label:'Tabelle',help:'Tabellarische Tagesdetails'}
];
const dayLabel=(date:string)=>new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
const readableTemperature=(value:number)=>Number.isFinite(value)?formatDecimalFixed(value,0)+' °C':'–';
const nonnegative=(n:number)=>Number.isFinite(n)&&n>=0?n:null;
const probability=(day:Day)=>day.probabilityAvailable!==false&&Number.isFinite(day.probability)&&day.probability>=0&&day.probability<=100?day.probability:null;
const amount=(day:Day)=>day.precipitationAvailable!==false?nonnegative(day.precipitation):null;
const gust=(day:Day)=>nonnegative(day.gust);
const speed=(day:Day)=>nonnegative(day.wind);
const sunshine=(day:Day)=>day.sunshineDuration!==null&&Number.isFinite(day.sunshineDuration)&&day.sunshineDuration>=0?day.sunshineDuration/3600:null;
const displayPoP=(day:Day)=>probability(day)===null?'–':formatDecimalFixed(probability(day)!,0)+' %';
const displayAmount=(day:Day)=>compactPrecipitationAmount(amount(day)??Number.NaN)+' mm';
const displaySun=(day:Day)=>sunshine(day)===null?'–':formatDecimalFixed(sunshine(day)!,1)+' h';
const datePoint=(date:string,mean:number|null,bounds?:{low:number|null;high:number|null;q25?:number|null;q75?:number|null},color?:string)=>({id:date,label:dayLabel(date),mean,low:bounds?.low??null,high:bounds?.high??null,q25:bounds?.q25??null,q75:bounds?.q75??null,color});
function ensembleBounds(low:number,high:number,e?:EnsembleDay,q25?:number,q75?:number,nonnegativeOnly=false){
 if(!e||e.modelCount<1||e.memberCount<1||!Number.isFinite(low)||!Number.isFinite(high)||low>high||(nonnegativeOnly&&low<0))return {low:null,high:null,q25:null,q75:null};
 const validQuantiles=typeof q25==='number'&&typeof q75==='number'&&Number.isFinite(q25)&&Number.isFinite(q75)&&low<=q25&&q25<=q75&&q75<=high;
 return {low,high,q25:validQuantiles?q25!:null,q75:validQuantiles?q75!:null};
}
const windUnits:Record<WindUnit,{factor:number;label:string}>={kn:{factor:1,label:'kt'},kmh:{factor:1.852,label:'km/h'},ms:{factor:.514444,label:'m/s'},mph:{factor:1.15078,label:'mph'}};
/** Shared seven-day Best-Match data and authentic ensemble bounds, without surrogate zeros. */
export function sevenDayDetailedSeries(days:Day[],ensemble:EnsembleDay[],unit:WindUnit,ecmwf=false){
 const byDate=new Map(ensemble.map(row=>[row.date,row])),factor=windUnits[unit].factor;
 const convert=(value:number|null)=>value===null?null:value*factor;
 const temperatureColor=(value:number)=>ecmwf&&Number.isFinite(value)?ecmwfTemperatureColor(value):undefined;
 const tmax={id:'tmax',label:ecmwf?'Tmax · ECMWF-Farbskala':'Tmax · Best Match',color:ecmwf?ecmwfTemperatureColor(days[0]?.max):'var(--param-temperature-max)',points:days.map(day=>{const e=byDate.get(day.date),bounds=ensembleBounds(e?.maxLow??NaN,e?.maxHigh??NaN,e,e?.maxQ25,e?.maxQ75);return datePoint(day.date,Number.isFinite(day.max)?day.max:null,bounds,temperatureColor(day.max))})};
 const tmin={id:'tmin',label:ecmwf?'Tmin · ECMWF-Farbskala':'Tmin · Best Match',color:ecmwf?ecmwfTemperatureColor(days[0]?.min):'var(--param-temperature-min)',points:days.map(day=>{const e=byDate.get(day.date),bounds=ensembleBounds(e?.minLow??NaN,e?.minHigh??NaN,e,e?.minQ25,e?.minQ75);return datePoint(day.date,Number.isFinite(day.min)?day.min:null,bounds,temperatureColor(day.min))})};
 const precipitation={id:'precipitation',label:'Niederschlagsmenge · Tagesakkumulation',color:'var(--param-precipitation)',points:days.map(day=>{const e=byDate.get(day.date),bounds=ensembleBounds(e?.precipitationLow??NaN,e?.precipitationHigh??NaN,e,undefined,undefined,true);return datePoint(day.date,amount(day),bounds)})};
 const pop={id:'pop',label:'Tägliche Niederschlagswahrscheinlichkeit · Best Match',color:'var(--param-precipitation)',points:days.map(day=>datePoint(day.date,probability(day)))};
 const windMean={id:'wind',label:'Wind · Best Match',color:'var(--param-wind)',points:days.map(day=>{const e=byDate.get(day.date),bounds=ensembleBounds(e?.windLow??NaN,e?.windHigh??NaN,e,undefined,undefined,true);return datePoint(day.date,convert(speed(day)),{low:convert(bounds.low),high:convert(bounds.high)})})};
 const windGust={id:'gust',label:'Böen · Best Match',color:'var(--param-gust)',points:days.map(day=>{const e=byDate.get(day.date),bounds=ensembleBounds(e?.gustLow??NaN,e?.gustHigh??NaN,e,undefined,undefined,true);return datePoint(day.date,convert(gust(day)),{low:convert(bounds.low),high:convert(bounds.high)})})};
 const sun={id:'sunshine',label:'Sonnenscheindauer · Tageswert',color:'var(--param-sunshine)',points:days.map(day=>datePoint(day.date,sunshine(day)))};
 return {temperature:[tmax,tmin],precipitation:[precipitation],probability:[pop],wind:[windMean,windGust],sunshine:[sun]};
}
export function SevenDayDesignModes({days,ensemble,hours,unit,mode,onModeChange,onOpenDay,ecmwfTemperatureColors=false}:Props){
 const visible=days.slice(0,7);
 const curves=useMemo(()=>sevenDayDetailedSeries(visible,ensemble,unit,ecmwfTemperatureColors),[days,ensemble,unit,ecmwfTemperatureColors]);
 if(!visible.length)return null;
 return <section className="mid-we-seven" data-mid-seven-design="true" data-mid-seven-mode={mode}>
  <div className="mid-we-seven-switch" role="group" aria-label="Ansicht für sieben Prognosetage">
   {modes.map(item=><button key={item.key} type="button" aria-pressed={mode===item.key} title={item.help} onClick={()=>onModeChange(item.key)}>{item.label}</button>)}
  </div>
  {mode==='standard'?<p className="mid-we-seven-hint">Tagesübersicht · Tag antippen für den vollständigen Stundenverlauf.</p>:null}
  {mode==='charts'?<div className="mid-we-seven-charts" aria-label="Grafische Details über sieben lokale Prognosetage">
   <article><h3>Temperatur · Tmin und Tmax</h3><HorizonSignalChart label="Sieben Tage Tagesminimum und Tagesmaximum; Best Match mit echten Ensemblequantilen, falls verfügbar" unit="°C" zero={false} connectDaily series={curves.temperature}/></article>
   <article><h3>Niederschlagsmenge · mm pro Tag</h3><HorizonSignalChart label="Sieben lokale Tage als Niederschlagssummen, diskrete Säulen, nicht Niederschlagsintensität" unit="mm/Tag" bars formatValue={compactPrecipitationAmount} series={curves.precipitation}/></article>
   <article><h3>Niederschlagswahrscheinlichkeit · %</h3><HorizonSignalChart label="Sieben Tage Best-Match-Niederschlagswahrscheinlichkeit, keine Ensembleübereinstimmung" unit="%" bars formatValue={value=>formatDecimalFixed(value,0)} series={curves.probability}/></article>
   <article><h3>Wind und Böen · {windUnits[unit].label}</h3><HorizonSignalChart label={'Sieben Tage Wind und Böen mit getrennten Linien in '+windUnits[unit].label} unit={windUnits[unit].label} connectDaily formatValue={value=>formatDecimalFixed(value,0)} series={curves.wind}/></article>
   <article><h3>Sonnenscheindauer · h pro Tag</h3><HorizonSignalChart label="Sieben Tage tägliche Sonnenscheindauer, fehlende Angaben bleiben Lücken" unit="h/Tag" bars formatValue={value=>formatDecimalFixed(value,1)} series={curves.sunshine}/></article>
   <p className="mid-we-seven-note">Gemeinsame Datumsachse · Tagesmengen und Wahrscheinlichkeiten getrennt · P10–P90/P25–P75 nur bei echten Ensemblewerten · fehlend ≠ 0.</p>
  </div>:null}
  {mode==='table'?<div className="mid-we-seven-table-wrap">
   <p className="mid-we-seven-hint">Sieben Tage vergleichen. „Stunden“ öffnet die unveränderte Tageskarte mit Skybar und Stundenprofil.</p>
   <div className="mid-we-seven-table-scroll"><table>
    <thead><tr><th scope="col">Tag</th><th scope="col">Wetter</th><th scope="col">Tmin / Tmax</th><th scope="col">Niederschlag / PoP</th><th scope="col">Wind / Böen</th><th scope="col">Sonne</th><th scope="col">Details</th></tr></thead>
    <tbody>{visible.map(day=>{
     const character=dayWeatherCharacter(day,dayPeriodHoursForDate(day.date,hours));
     return <tr key={day.date}>
      <th scope="row">{dayLabel(day.date)}</th>
      <td data-label="Wetter"><span className="mid-we-seven-weather">{Number.isFinite(character.code)?<WeatherPictogram code={character.code} size={27} day title={character.label}/>:null}<span>{character.label||'–'}</span></span></td>
      <td data-label="Temperatur"><span className="mid-we-seven-min" style={{color:parameterTemperatureTone(day.min,'min',ecmwfTemperatureColors).color}}>{readableTemperature(day.min)}</span> / <span className="mid-we-seven-max" style={{color:parameterTemperatureTone(day.max,'max',ecmwfTemperatureColors).color}}>{readableTemperature(day.max)}</span></td>
      <td data-label="Niederschlag">{displayAmount(day)} · {displayPoP(day)}</td>
      <td data-label="Wind und Böen">{speed(day)===null?'–':wind(day.wind,unit)} / {gust(day)===null?'–':wind(day.gust,unit)}</td>
      <td data-label="Sonne">{displaySun(day)}</td>
      <td><button type="button" onClick={()=>onOpenDay(day.date)} aria-label={'Stundenverlauf für '+dayLabel(day.date)+' öffnen'}>Stunden</button></td>
     </tr>
    })}</tbody>
   </table></div>
  </div>:null}
 </section>;
}
