import {niceChartScale,chartLabelVisible} from './chartScale';
import {seasonalTraceDates,type SeasonalTrace} from './seasonalMemberAggregation';
import {formatDecimalFixed} from './format';
import {useSignalChartWidth} from './HorizonSignalChart';
function quantile(values:number[],fraction:number){const sorted=[...values].sort((a,b)=>a-b),position=(sorted.length-1)*fraction,low=Math.floor(position),high=Math.ceil(position);return sorted[low]+(sorted[high]-sorted[low])*(position-low)}
export function SeasonalMemberPanel({traces}:{traces:SeasonalTrace[]}){
 if(traces.length<2)return <p className="long-range-info">Keine einzelnen SEAS5-Mitglieder verfügbar. Monatsmittel bleiben sichtbar; daraus wird keine Rauchfahne erfunden.</p>;
 const dates=seasonalTraceDates(traces);
 return <section className="long-range-overview" data-seasonal-members={traces.length}><header><div><strong>ECMWF SEAS5 · echte Mitgliedskurven</strong><small>{traces.length} gelieferte Verläufe · vollständige Kalendermonate · absolute Monatsmittel; keine Tagesprognose</small></div></header><div className="long-range-grid">{(['temperature','precipitation'] as const).map(metric=><SeasonalMemberChart key={metric} traces={traces} dates={dates} metric={metric}/>)}</div><div className="long-range-info"><p>Abweichungen zum Modellklima und unabhängige Modelllinien stehen darunter. Einzelmitglieder und Anomalien bleiben getrennt; angebrochene Monate und Datenlücken werden ausgeschlossen.</p></div></section>;
}
function SeasonalMemberChart({traces,dates,metric}:{traces:SeasonalTrace[];dates:string[];metric:'temperature'|'precipitation'}){
 const [chartRef,chartWidth]=useSignalChartWidth();
  const rows=dates.map(date=>({date,values:traces.flatMap(trace=>{const value=trace.months.find(month=>month.date===date)?.[metric];return value!=null&&Number.isFinite(value)?[value]:[]})})),valid=rows.flatMap(row=>row.values);if(!valid.length)return null;
  const width=chartWidth,height=250,left=56,right=22,top=20,bottom=45,scale=niceChartScale(valid,metric==='precipitation'),min=scale.low,max=scale.high,x=(index:number)=>left+(index+.5)*(width-left-right)/Math.max(1,dates.length),y=(value:number)=>top+(max-value)/Math.max(1,max-min)*(height-top-bottom),color=metric==='temperature'?'var(--param-temperature)':'var(--param-precipitation)',unit=metric==='temperature'?'°C':'mm/Tag';
  const path=(values:(number|null)[])=>{let active=false;return values.map((value,index)=>{if(value===null){active=false;return''}const command=active?'L':'M';active=true;return `${command} ${x(index)} ${y(value)}`}).join(' ')};
  const band=(low:number,high:number)=>{let output='';let group:number[]=[];const flush=()=>{if(group.length){output+=group.map((index,i)=>`${i?'L':'M'} ${x(index)} ${y(quantile(rows[index].values,high))}`).join(' ')+[...group].reverse().map(index=>` L ${x(index)} ${y(quantile(rows[index].values,low))}`).join('')+' Z ';group=[]}};rows.forEach((row,index)=>{if(row.values.length>=2)group.push(index);else flush()});flush();return output};
  return <article key={metric}><header><strong>{metric==='temperature'?'Temperatur · Rauchfahne':'Niederschlag · Rauchfahne'}</strong><small>Schattierung P10–P90 / P25–P75 · Linie Mittel der verfügbaren Mitglieder</small></header><div ref={chartRef} className="long-range-chart"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`SEAS5 ${metric==='temperature'?'Temperatur':'Niederschlag'}: echte Monats-Mitgliedskurven`}>
   {scale.ticks.map(tick=><g key={tick}><line className="grid" x1={left} x2={width-right} y1={y(tick)} y2={y(tick)}/><text className="axis-label" x={left-8} y={y(tick)+4} textAnchor="end">{formatDecimalFixed(tick,scale.decimals)}</text></g>)}
   <path d={band(.1,.9)} fill={color} fillOpacity={.12}/><path d={band(.25,.75)} fill={color} fillOpacity={.22}/>
   {traces.map(trace=><path key={trace.id} data-seasonal-member={trace.id} d={path(dates.map(date=>trace.months.find(month=>month.date===date)?.[metric]??null))} fill="none" stroke={color} strokeWidth={.8} opacity={.18}><title>{trace.label}</title></path>)}
   <path d={path(rows.map(row=>row.values.length?row.values.reduce((sum,value)=>sum+value,0)/row.values.length:null))} fill="none" stroke={color} strokeWidth={2.5}/>
   {rows.map((row,index)=><g key={row.date}>{chartLabelVisible(index,rows.length,width-left-right)?<text className="month-label" x={x(index)} y={height-18} textAnchor="middle">{new Intl.DateTimeFormat('de-DE',{month:'short',year:'2-digit',timeZone:'UTC'}).format(new Date(row.date))}</text>:null}<title>{`${row.date}: ${row.values.length} verfügbare Mitglieder`}</title></g>)}
  </svg><span>{unit} · unbereinigte Modellwerte am Modellgitter</span></div></article>;
}
