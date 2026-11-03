import './midC28MapPhase.css';
import './midDesignWeFourteen.css';
import {useDisplayPreference,displayChoice} from './useDisplayPreference';
import {wind,type WindUnit} from './weather';
import {compactPrecipitationAmount} from './precipitation';
import {HorizonSignalChart} from './HorizonSignalChart';
import {assessmentSummary,type DayAssessment} from './ensembleAssessment';
import {formatDecimalFixed} from './format';
type Row={date:string;meanDayTemperature:number;regimeText:string;bestMax:number;bestMin:number;maxLow:number;maxHigh:number;maxQ25:number;maxQ75:number;minLow:number;minHigh:number;minQ25:number;minQ75:number;ensembleAvailable:boolean;assessment:DayAssessment;bestPrecipitation:number;bestPrecipitationProbability:number;bestWind:number;bestGust:number;precipitationLow:number;precipitationHigh:number;windLow:number;windHigh:number;gustLow:number;gustHigh:number;weatherLabel:string};
// Quantiles are the existing weighted daily ensemble values, never Best-Match proxies.
export function fourteenTemperatureSeries(series:Row[]){
 const bound=(row:Row,value:number)=>row.ensembleAvailable&&Number.isFinite(value)?value:null;
 return [
  {id:'tmax',label:'Tmax · Best Match',color:'var(--param-temperature-max)',points:series.map(row=>({id:row.date,label:dateLabel(row.date),mean:Number.isFinite(row.bestMax)?row.bestMax:null,low:bound(row,row.maxLow),high:bound(row,row.maxHigh),q25:bound(row,row.maxQ25),q75:bound(row,row.maxQ75),detail:assessmentSummary(row.assessment)}))},
  {id:'tmin',label:'Tmin · Best Match',color:'var(--param-temperature-min)',points:series.map(row=>({id:row.date,label:dateLabel(row.date),mean:Number.isFinite(row.bestMin)?row.bestMin:null,low:bound(row,row.minLow),high:bound(row,row.minHigh),q25:bound(row,row.minQ25),q75:bound(row,row.minQ75),detail:assessmentSummary(row.assessment)}))}
 ];
}
const dateLabel=(date:string)=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));

export type FourteenView='compact'|'charts'|'days';
const finiteNonnegative=(n:number)=>Number.isFinite(n)&&n>=0?n:null;
const availableBounds=(row:Row,low:number,high:number)=>row.ensembleAvailable&&Number.isFinite(low)&&Number.isFinite(high)&&low>=0&&low<=high?{low,high}:{low:null,high:null};
const windUnitFactor:Record<WindUnit,number>={kn:1,kmh:1.852,ms:.514444,mph:1.15078};
const windUnitLabel:Record<WindUnit,string>={kn:'kt',kmh:'km/h',ms:'m/s',mph:'mph'};
const toWindUnit=(value:number,unit:WindUnit)=>Number.isFinite(value)&&value>=0?value*windUnitFactor[unit]:null;
/** Daily accumulation and deterministic PoP are distinct; bounds are only genuine ensemble limits. */
export function fourteenPrecipitationSeries(rows:Row[]){
 return [{id:'precipitation',label:'Tagesmenge · Best Match',color:'var(--param-precipitation)',points:rows.map(row=>{
  const bounds=availableBounds(row,row.precipitationLow,row.precipitationHigh);
  return{id:row.date,label:dateLabel(row.date),mean:finiteNonnegative(row.bestPrecipitation),...bounds,detail:assessmentSummary(row.assessment)};
 })}];
}
export function fourteenProbabilitySeries(rows:Row[]){
 return [{id:'probability',label:'Tägliche Niederschlagswahrscheinlichkeit · Best Match',color:'var(--param-precipitation)',points:rows.map(row=>({
  id:row.date,label:dateLabel(row.date),mean:Number.isFinite(row.bestPrecipitationProbability)&&row.bestPrecipitationProbability>=0&&row.bestPrecipitationProbability<=100?row.bestPrecipitationProbability:null,detail:'Best Match · keine Ensemble-Eintrittswahrscheinlichkeit'
 }))}];
}
export function fourteenWindSeries(rows:Row[],unit:WindUnit){
 const series=[
  {id:'wind',label:'Wind · Best Match',color:'var(--param-wind)',mean:(row:Row)=>row.bestWind,low:(row:Row)=>row.windLow,high:(row:Row)=>row.windHigh},
  {id:'gust',label:'Böen · Best Match',color:'var(--param-gust)',mean:(row:Row)=>row.bestGust,low:(row:Row)=>row.gustLow,high:(row:Row)=>row.gustHigh}
 ];
 return series.map(source=>({id:source.id,label:source.label,color:source.color,points:rows.map(row=>{
  const bounds=availableBounds(row,source.low(row),source.high(row));
  return{id:row.date,label:dateLabel(row.date),mean:toWindUnit(source.mean(row),unit),low:bounds.low===null?null:toWindUnit(bounds.low,unit),high:bounds.high===null?null:toWindUnit(bounds.high,unit),detail:assessmentSummary(row.assessment)};
 })}));
}
const numeric=(value:number,unit:string,decimals=0)=>Number.isFinite(value)?formatDecimalFixed(value,decimals)+' '+unit:'–';
const probability=(value:number)=>Number.isFinite(value)&&value>=0&&value<=100?formatDecimalFixed(value,0)+' %':'–';
export function FourteenDayDevelopment({series,unit='kn',onOpenDay}:{series:Row[];unit?:WindUnit;onOpenDay?:(date:string)=>void}){
 const [mode,setMode]=useDisplayPreference<FourteenView>('ForecastCockpit.fourteenDevelopment.mode','compact',displayChoice<FourteenView>('compact','charts','days'));
 const weeks=[{label:'Woche 1 · Tage 1–7',rows:series.slice(0,7)},{label:'Woche 2 · Tage 8–14',rows:series.slice(7,14)}].filter(week=>week.rows.length);
 const phases=[{label:'Tag 1–4',rows:series.slice(0,4)},{label:'Tag 5–9',rows:series.slice(4,9)},{label:'Tag 10–14',rows:series.slice(9,14)}].filter(phase=>phase.rows.length);
 const chartTemperature=fourteenTemperatureSeries(series);
 const options:readonly {key:FourteenView;label:string;description:string}[]=[
  {key:'compact',label:'Übersicht',description:'Kompakte Standardansicht'},
  {key:'charts',label:'Diagramme',description:'Erweiterte Diagrammansicht'},
  {key:'days',label:'Tagesdetails',description:'Alle Tageswerte im Vergleich'}
 ];
 return <section className="long-range-overview" data-fourteen-development="true" data-mid-fourteen-view={mode}>
  <header><div><strong>14 Tage · Entwicklung</strong><small>Tmax / Tmin · Best Match mit Ensemble-Spannen</small></div><span className="fourteen-development-kicker">{phases.length} Wetterphasen</span></header>
  <div className="mid-we-fourteen-switch" role="group" aria-label="Darstellung des 14-Tage-Wetters wählen">
   {options.map(option=><button type="button" key={option.key} aria-pressed={mode===option.key} aria-label={option.description} className={mode===option.key?'active':''} onClick={()=>setMode(option.key)}>{option.label}</button>)}
  </div>
  {mode==='compact'?<div className="long-range-dwd-periods fourteen-phase-summary" aria-label="Entwicklung nach drei Wetterphasen">
   {phases.map(phase=>{
    const temperatures=phase.rows.map(row=>row.meanDayTemperature).filter(Number.isFinite);
    const mean=temperatures.length?temperatures.reduce((sum,value)=>sum+value,0)/temperatures.length:null;
    const regimes=phase.rows.reduce<Record<string,number>>((counts,row)=>({...counts,[row.regimeText]:(counts[row.regimeText]??0)+1}),{});
    const character=Object.entries(regimes).sort((a,b)=>b[1]-a[1])[0]?.[0];
    const ensembleDays=phase.rows.filter(row=>row.ensembleAvailable).length;
    return <article key={phase.label}>
     <header><strong>{phase.label}</strong><small>{dateLabel(phase.rows[0].date)} – {dateLabel(phase.rows.at(-1)!.date)}</small></header>
     <b>{character??'Entwicklung offen'}</b>
     <p><span>Tagesmittel</span> <strong>{mean!==null?numeric(mean,'°C',1):'–'}</strong></p>
     <small>Ensemble {ensembleDays}/{phase.rows.length} Tage</small>
    </article>;
   })}
  </div>:null}
  {mode==='compact'?<div className="mid-we-fourteen-primary">
   <div className="mid-we-fourteen-mode-head"><span><small>STANDARD · A</small><strong>Vierzehn Tage, zwei Wochen</strong></span><small>Wetterphasen, Tageswerte und tatsächliche Unsicherheit</small></div>
   <div className="mid-we-fourteen-weeks">{weeks.map(week=><section key={week.label} className="mid-we-fourteen-week">
    <header><strong>{week.label}</strong><small>Seitlich scrollbare Tageskarten · Details per Tipp</small></header>
    <div className="mid-we-fourteen-weekscroll" role="region" tabIndex={0} aria-label={week.label+' im Tagesvergleich'}>
     <div className="mid-we-fourteen-weekrow">{week.rows.map(row=><button type="button" className="mid-we-fourteen-daytile" key={row.date}
       disabled={!onOpenDay} onClick={()=>onOpenDay?.(row.date)} aria-controls="mid-fourteen-full-details"
       aria-label={dateLabel(row.date)+': '+row.weatherLabel+', '+numeric(row.bestMin,'°C')+' bis '+numeric(row.bestMax,'°C')+'. Vollständige Tagesdetails öffnen'}>
      <strong className="mid-we-fourteen-daydate">{dateLabel(row.date)}</strong><span className="mid-we-fourteen-weather" title={row.weatherLabel}>{row.weatherLabel||'Wetterlage offen'}</span>
      <span className="mid-we-fourteen-temps"><b>{numeric(row.bestMax,'°C')}</b><small>{numeric(row.bestMin,'°C')}</small></span>
      <span className="mid-we-fourteen-rain"><small>Niederschlag · PoP</small><b>{numeric(row.bestPrecipitation,'mm',1)} · {probability(row.bestPrecipitationProbability)}</b></span>
      <span className="mid-we-fourteen-wind"><small>Wind · Böen</small><b>{toWindUnit(row.bestWind,unit)===null?'–':numeric(toWindUnit(row.bestWind,unit)!,windUnitLabel[unit],0)} · {toWindUnit(row.bestGust,unit)===null?'–':numeric(toWindUnit(row.bestGust,unit)!,windUnitLabel[unit],0)}</b></span>
      <span className="mid-we-fourteen-range">{row.ensembleAvailable&&Number.isFinite(row.maxLow)&&Number.isFinite(row.maxHigh)?'Tmax P10–P90 '+numeric(row.maxLow,'°C')+' bis '+numeric(row.maxHigh,'°C'):'Ensemble-Spanne nicht verfügbar'}</span>
      <span className="mid-we-fourteen-more" aria-hidden="true">Details ↓</span>
     </button>)}</div>
    </div>
   </section>)}</div>
   <div className="mid-we-fourteen-chart-feature"><div className="mid-we-fourteen-mode-head"><span><small>TEMPERATURTREND</small><strong>Verlauf und Unsicherheit</strong></span><small>Best Match und originale Ensemble-Spannen</small></div>
    <HorizonSignalChart label="14 Tage: Höchst- und Tiefsttemperatur. Best Match mit P10–P90 und P25–P75 der verfügbaren Ensembles" unit="°C" zero={false} connectDaily compact series={chartTemperature}/>
   </div>
   <small className="mid-we-fourteen-footnote">P10–P90 und P25–P75 ausschließlich aus vorhandenen Ensembledaten. Die Punktprognose ist kein Ensemble-Mittelwert. Alle bisherigen vollständigen Tageskarten bleiben über „Details“ zugänglich.</small>
  </div>:null}
  {mode==='charts'?<div className="mid-we-fourteen-charts" aria-label="Erweiterte, gemeinsam datierte 14-Tage-Diagramme"><div className="mid-we-fourteen-mode-head"><span><small>GRAFIK · B</small><strong>Vier fachlich getrennte Verläufe</strong></span><small>Gleiche Datumsachse, echte Datenlücken</small></div>
   <article><h3>Temperatur · Tmax und Tmin</h3><HorizonSignalChart label="14 Tage Temperatur mit Ensemblequantilen" unit="°C" zero={false} connectDaily series={chartTemperature}/></article>
   <article><h3>Niederschlagsmenge · Tagesakkumulation</h3><HorizonSignalChart label="14 Tage Tagesniederschlag in Millimetern mit Ensemble-Spannen bei verfügbaren Daten" unit="mm/Tag" bars formatValue={compactPrecipitationAmount} series={fourteenPrecipitationSeries(series)}/></article>
   <article><h3>Niederschlagswahrscheinlichkeit · Best Match</h3><HorizonSignalChart label="14 Tage tägliche Best-Match-Niederschlagswahrscheinlichkeit in Prozent, nicht Ensembleübereinstimmung" unit="%" bars formatValue={v=>formatDecimalFixed(v,0)} series={fourteenProbabilitySeries(series)}/></article>
   <article><h3>Wind und Böen · {windUnitLabel[unit]}</h3><HorizonSignalChart label={'14 Tage Wind und Böen in '+windUnitLabel[unit]+' mit echten Ensemble-Spannen bei verfügbaren Daten'} unit={windUnitLabel[unit]} connectDaily formatValue={v=>formatDecimalFixed(v,0)} series={fourteenWindSeries(series,unit)}/></article>
   <p className="mid-we-fourteen-footnote">Alle Spuren verwenden dieselben Kalendertage. Fehlende Daten unterbrechen die Kurve. Ensemble-Spannen sind keine zusätzlichen Best-Match-Werte; Wahrscheinlichkeit und Menge werden getrennt gezeigt.</p>
  </div>:null}
  {mode==='days'?<div className="mid-we-fourteen-days"><div className="mid-we-fourteen-mode-head"><span><small>TABELLE · C</small><strong>Tageswerte direkt vergleichen</strong></span><small>Alle 14 Tage mit vollständigen Detailkarten</small></div>
   <p className="mid-we-fourteen-footnote">Tagesvergleich aus der kanonischen Prognose. „Öffnen“ zeigt die unveränderten vollständigen Tageskarten mit Skybar, Quellen und weiteren Wetterwerten.</p>
   <div className="mid-we-fourteen-table-scroll">
    <table><thead><tr><th scope="col">Tag</th><th scope="col">Wetter</th><th scope="col">Tmin / Tmax</th><th scope="col">Niederschlag / PoP</th><th scope="col">Wind / Böen</th><th scope="col">Ensemble</th><th scope="col">Details</th></tr></thead>
     <tbody>{series.map(row=><tr key={row.date}>
      <th scope="row">{dateLabel(row.date)}</th>
      <td data-label="Wetter">{row.weatherLabel||row.regimeText}</td>
      <td data-label="Temperatur">{numeric(row.bestMin,'°C')} / {numeric(row.bestMax,'°C')}</td>
      <td data-label="Niederschlag">{compactPrecipitationAmount(row.bestPrecipitation)} mm · {probability(row.bestPrecipitationProbability)}</td>
      <td data-label="Wind und Böen">{wind(row.bestWind,unit)} / {wind(row.bestGust,unit)}</td>
      <td data-label="Ensemble">{row.ensembleAvailable?assessmentSummary(row.assessment):'Spannen fehlen'}</td>
      <td data-label="Tagesdetails">{onOpenDay?<button type="button" onClick={()=>onOpenDay(row.date)} aria-label={'Tagesdetails '+dateLabel(row.date)+' öffnen'}>Öffnen</button>:<details className="mid-we-fourteen-row-expansion">
       <summary>Spannen & Einordnung</summary>
       <div><b>Ensemble-Temperatur</b><span>{row.ensembleAvailable?numeric(row.minLow,'°C',1)+' – '+numeric(row.minHigh,'°C',1)+' (Tmin P10–P90)':'nicht verfügbar'}</span><span>{row.ensembleAvailable?numeric(row.maxLow,'°C',1)+' – '+numeric(row.maxHigh,'°C',1)+' (Tmax P10–P90)':'nicht verfügbar'}</span></div>
       <div><b>Niederschlag (P10–P90)</b><span>{row.ensembleAvailable?compactPrecipitationAmount(row.precipitationLow)+' – '+compactPrecipitationAmount(row.precipitationHigh)+' mm':'nicht verfügbar'}</span></div>
       <div><b>Wind/Böen (P10–P90)</b><span>{row.ensembleAvailable?wind(row.windLow,unit)+' – '+wind(row.windHigh,unit):'nicht verfügbar'}</span><span>{row.ensembleAvailable?wind(row.gustLow,unit)+' – '+wind(row.gustHigh,unit):'nicht verfügbar'}</span></div>
       <small>{assessmentSummary(row.assessment)} · Die vollständigen Tageskarten folgen unterhalb dieser Übersicht.</small>
      </details>}</td>
     </tr>)}</tbody>
    </table>
   </div>
  </div>:null}
 </section>;
}
