import {HorizonSignalChart} from './HorizonSignalChart';
import {assessmentSummary,type DayAssessment} from './ensembleAssessment';
import {formatDecimalFixed} from './format';
type Row={date:string;meanDayTemperature:number;regimeText:string;bestMax:number;maxLow:number;maxHigh:number;ensembleAvailable:boolean;assessment:DayAssessment};
const dateLabel=(date:string)=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
export function FourteenDayDevelopment({series}:{series:Row[]}){
 const phases=[{label:'Tag 1–4',rows:series.slice(0,4)},{label:'Tag 5–9',rows:series.slice(4,9)},{label:'Tag 10–14',rows:series.slice(9,14)}].filter(phase=>phase.rows.length);
  return (
   <section className="long-range-overview" data-fourteen-development="true">
    <header><div><strong>14 Tage · Entwicklung</strong><small>3 Phasen · Tmax und Ensemble-Spanne</small></div></header>
    <div className="long-range-dwd-periods">
     {phases.map(phase=>{
      const temperatures=phase.rows.map(row=>row.meanDayTemperature).filter(Number.isFinite);
      const mean=temperatures.length?temperatures.reduce((sum,value)=>sum+value,0)/temperatures.length:null;
      const regimes=phase.rows.reduce<Record<string,number>>((counts,row)=>({...counts,[row.regimeText]:(counts[row.regimeText]??0)+1}),{});
      const character=Object.entries(regimes).sort((a,b)=>b[1]-a[1])[0]?.[0];
      const ensembleDays=phase.rows.filter(row=>row.ensembleAvailable).length;
      return <article key={phase.label}>
       <header><strong>{phase.label}</strong><small>{dateLabel(phase.rows[0].date)} – {dateLabel(phase.rows.at(-1)!.date)}</small></header>
       <b>{character??'Entwicklung offen'}</b>
       <p>{mean!==null?`Mittlere Tagestemperatur ${formatDecimalFixed(mean,1)} °C`:'Temperaturdaten fehlen'}</p>
       <small>Ensemble {ensembleDays}/{phase.rows.length} Tage</small>
      </article>;
     })}
    </div>
    <HorizonSignalChart label="14 Tage: Tageshöchsttemperatur und gelieferte Ensemblebandbreite" unit="°C" zero={false} series={[{id:'tmax',label:'Tageshöchsttemperatur · Best Match / P10–P90 des Ensembles',color:'var(--param-temperature)',points:series.map(row=>({id:row.date,label:dateLabel(row.date),mean:Number.isFinite(row.bestMax)?row.bestMax:null,low:row.ensembleAvailable&&Number.isFinite(row.maxLow)?row.maxLow:null,high:row.ensembleAvailable&&Number.isFinite(row.maxHigh)?row.maxHigh:null,detail:assessmentSummary(row.assessment)}))}]}/>
   </section>
  );
}
