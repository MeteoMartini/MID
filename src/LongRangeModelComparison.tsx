import {useEffect,useMemo,useState} from 'react';
import {CloudRain,ThermometerSun} from 'lucide-react';
import {formatDecimalFixed} from './format';
import type {SeasonalMonth,SeasonalPointModel} from './seasonalForecast';

type Metric='temperature'|'precipitation';
type Props={models:SeasonalPointModel[]};
function finite(value:number|null|undefined):value is number{return Number.isFinite(value)}
function metricValue(month:SeasonalMonth,metric:Metric){return metric==='temperature'?month.temperatureAnomaly:month.precipitationAnomaly}
function metricLow(month:SeasonalMonth,metric:Metric){return metric==='temperature'?month.temperatureAnomalyLow:month.precipitationAnomalyLow}
function metricHigh(month:SeasonalMonth,metric:Metric){return metric==='temperature'?month.temperatureAnomalyHigh:month.precipitationAnomalyHigh}
function unit(_month:SeasonalMonth|undefined,metric:Metric){return metric==='temperature'?'K':'mm/Tag'}
function formatValue(value:number|undefined|null,currentUnit:'K'|'%'|'mm/Tag'){if(!finite(value))return'–';if(currentUnit==='%')return`${value>=0?'+':''}${Math.round(value)} %`;return`${value>=0?'+':''}${formatDecimalFixed(value,currentUnit==='K'?1:2)} ${currentUnit}`}

export default function LongRangeModelComparison({models}:Props){
 const months=useMemo(()=>{const map=new Map<string,string>();models.forEach(model=>model.months.forEach(month=>map.set(month.date,map.get(month.date)??month.label)));return[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date,label])=>({date,label}))},[models]);
 const[metric,setMetric]=useState<Metric>(()=>{try{return localStorage.getItem('mid:long-range:comparison-metric')==='precipitation'?'precipitation':'temperature'}catch{return'temperature'}}),[selectedDate,setSelectedDate]=useState('');
 useEffect(()=>{if(!selectedDate||!months.some(month=>month.date===selectedDate))setSelectedDate(months[0]?.date??'')},[months,selectedDate]);
 useEffect(()=>{try{localStorage.setItem('mid:long-range:comparison-metric',metric)}catch{}},[metric]);
 if(models.length<2||!months.length)return null;
 const selected=months.find(month=>month.date===selectedDate)??months[0],rows=models.map(model=>({model,month:model.months.find(month=>month.date===selected.date)})).filter(row=>row.month&&finite(metricValue(row.month,metric))),Icon=metric==='temperature'?ThermometerSun:CloudRain;
 return <section className="long-range-models"><header><div><span>MODELLE DIREKT VERGLEICHEN</span><h4>{selected.label} · {metric==='temperature'?'Temperatur':'Niederschlag'}</h4><small className="long-range-c3s-status">Nur numerisch geladene Modellfamilien; Katalogmodelle ohne Punktwerte fließen nicht ein.</small></div></header><div className="long-range-controls section-sticky-controls" style={{display:'grid'}}><div className="long-range-model-selector"><button type="button" className={metric==='temperature'?'active':''} onClick={()=>setMetric('temperature')}><b>Temperatur</b><small>Anomalie zum Modellklima</small></button><button type="button" className={metric==='precipitation'?'active':''} onClick={()=>setMetric('precipitation')}><b>Niederschlag</b><small>Anomalie zum Modellklima</small></button></div><div className="long-range-model-selector">{months.map(month=><button key={month.date} type="button" className={selected.date===month.date?'active':''} onClick={()=>setSelectedDate(month.date)}><b>{month.label}</b><small>{rows.length} numerische Familien</small></button>)}</div></div><div className="long-range-model-strip">{rows.map(({model,month})=>{const currentUnit=unit(month,metric),value=metricValue(month!,metric),low=metricLow(month!,metric),high=metricHigh(month!,metric);return <article key={model.id} className="live"><div className="long-range-model-title"><strong>{model.family}</strong><b>{model.ensembleMembers>1?`${model.ensembleMembers} M`:'Mittel'}</b></div><span><Icon size={12}/> {formatValue(value,currentUnit)}</span><small>{finite(low)&&finite(high)?`P10–P90 ${formatValue(low,currentUnit)} bis ${formatValue(high,currentUnit)}`:'keine Member-Quantile geliefert'}</small><em>{model.runLabel} · {model.gridPoint?`${Math.round(model.gridPoint.distanceKm)} km zum Gitterpunkt`:model.provider}</em></article>})}</div><div className="long-range-method"><b>Vergleichsvertrag</b><p>Die Karten zeigen die Modellfamilien nebeneinander statt nur als gemeinsame Mittellinie. Unterschiede zwischen Modellklima, Gitterauflösung und Initialisierung bleiben sichtbar. Ensemble-Mittel ohne Einzelmember werden nicht künstlich mit einer erfundenen Streuung versehen.</p></div></section>
}
