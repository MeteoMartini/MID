import {HorizonSignalChart} from './HorizonSignalChart';
import {assessmentSummary,type DayAssessment} from './ensembleAssessment';
import {formatDecimalFixed} from './format';
type Row={date:string;meanDayTemperature:number;regimeText:string;bestMax:number;bestMin:number;maxLow:number;maxHigh:number;maxQ25:number;maxQ75:number;minLow:number;minHigh:number;minQ25:number;minQ75:number;ensembleAvailable:boolean;assessment:DayAssessment};
// Quantiles are the existing weighted daily ensemble values, never Best-Match proxies.
export function fourteenTemperatureSeries(series:Row[]){
 const bound=(row:Row,value:number)=>row.ensembleAvailable&&Number.isFinite(value)?value:null;
 return [
  {id:'tmax',label:'Tmax · Best Match',color:'var(--param-temperature-max)',points:series.map(row=>({id:row.date,label:dateLabel(row.date),mean:Number.isFinite(row.bestMax)?row.bestMax:null,low:bound(row,row.maxLow),high:bound(row,row.maxHigh),q25:bound(row,row.maxQ25),q75:bound(row,row.maxQ75),detail:assessmentSummary(row.assessment)}))},
  {id:'tmin',label:'Tmin · Best Match',color:'var(--param-temperature-min)',points:series.map(row=>({id:row.date,label:dateLabel(row.date),mean:Number.isFinite(row.bestMin)?row.bestMin:null,low:bound(row,row.minLow),high:bound(row,row.minHigh),q25:bound(row,row.minQ25),q75:bound(row,row.minQ75),detail:assessmentSummary(row.assessment)}))}
 ];
}
const dateLabel=(date:string)=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
export function FourteenDayDevelopment({series}:{series:Row[]}){
 const phases=[{label:'Tag 1–4',rows:series.slice(0,4)},{label:'Tag 5–9',rows:series.slice(4,9)},{label:'Tag 10–14',rows:series.slice(9,14)}].filter(phase=>phase.rows.length);
  return (
   <section className="long-range-overview" data-fourteen-development="true">
    <header><div><strong>14 Tage · Entwicklung</strong><small>3 Phasen · Tmax / Tmin · Ensemble-Spannen</small></div></header>
    <div className="long-range-dwd-periods fourteen-phase-summary">
     {phases.map(phase=>{
      const temperatures=phase.rows.map(row=>row.meanDayTemperature).filter(Number.isFinite);
      const mean=temperatures.length?temperatures.reduce((sum,value)=>sum+value,0)/temperatures.length:null;
      const regimes=phase.rows.reduce<Record<string,number>>((counts,row)=>({...counts,[row.regimeText]:(counts[row.regimeText]??0)+1}),{});
      const character=Object.entries(regimes).sort((a,b)=>b[1]-a[1])[0]?.[0];
      const ensembleDays=phase.rows.filter(row=>row.ensembleAvailable).length;
      return <article key={phase.label}>
       <header><strong>{phase.label}</strong><small>{dateLabel(phase.rows[0].date)} – {dateLabel(phase.rows.at(-1)!.date)}</small></header>
       <b>{character??'Entwicklung offen'}</b>
       <p><span>Tagesmittel</span> <strong>{mean!==null?`${formatDecimalFixed(mean,1)} °C`:'–'}</strong></p>
       <small>Ensemble {ensembleDays}/{phase.rows.length} Tage</small>
      </article>;
     })}
    </div>
    <HorizonSignalChart label="14 Tage: Tageshöchst- und Tiefsttemperatur mit P10–P90 und P25–P75 des Ensembles" unit="°C" zero={false} series={fourteenTemperatureSeries(series)}/>
   </section>
  );
}
