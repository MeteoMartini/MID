import {niceChartScale,chartLabelVisible} from './chartScale';
import {formatDecimalFixed} from './format';
import {useId,useLayoutEffect,useRef,useState} from 'react';
export function useSignalChartWidth(){const ref=useRef<HTMLDivElement>(null),[width,setWidth]=useState(760);useLayoutEffect(()=>{const node=ref.current;if(!node)return;const update=()=>setWidth(Math.max(120,node.clientWidth-parseFloat(getComputedStyle(node).paddingLeft)-parseFloat(getComputedStyle(node).paddingRight)));update();const observer=new ResizeObserver(update);observer.observe(node);return()=>observer.disconnect()});return[ref,width] as const}
export type SignalPoint={id:string;label:string;labelEnd?:string;mean:number|null;low?:number|null;high?:number|null;q25?:number|null;q75?:number|null;detail?:string;color?:string};
export type SignalSeries={id:string;label:string;color:string;points:SignalPoint[]};
/** Connect only adjacent dated daily observations; missing values/dates break a path. */
export function dailySignalPaths(points:SignalPoint[],x:(index:number)=>number,y:(value:number)=>number){
 const paths:string[]=[];let path='',previousTime=Number.NaN;
 points.forEach((point,index)=>{
  const time=/^\d{4}-\d{2}-\d{2}$/.test(point.id)?Date.parse(`${point.id}T12:00:00Z`):Number.NaN;
  if(point.mean===null||!Number.isFinite(point.mean)||!Number.isFinite(time)){if(path)paths.push(path);path='';previousTime=Number.NaN;return}
  if(path&&time-previousTime!==86400000){paths.push(path);path=''}
  path+=`${path?' L':'M'} ${x(index)} ${y(point.mean)}`;previousTime=time;
 });
 if(path)paths.push(path);return paths;
}
/** Only consecutive, finite UTC calendar days may share a value-based colored segment. */
function dailySignalColorSegments(points:SignalPoint[]){
 const segments:{start:number;end:number;startColor:string;endColor:string}[]=[];
 for(let index=1;index<points.length;index++){
  const previous=points[index-1],current=points[index];
  const prevTime=/^\d{4}-\d{2}-\d{2}$/.test(previous.id)?Date.parse(previous.id+'T12:00:00Z'):NaN;
  const nowTime=/^\d{4}-\d{2}-\d{2}$/.test(current.id)?Date.parse(current.id+'T12:00:00Z'):NaN;
  if(previous.mean===null||current.mean===null||!Number.isFinite(previous.mean)||!Number.isFinite(current.mean)||!Number.isFinite(prevTime)||nowTime-prevTime!==86400000)continue;
  segments.push({start:index-1,end:index,startColor:previous.color??'',endColor:current.color??''});
 }
 return segments;
}
/** Period intervals remain discrete by default; daily connections are opt-in. */
export function HorizonSignalChart({series,unit,zero=true,label,connectDaily=false,compact=false,formatValue,bars=false}:{series:SignalSeries[];unit:string;zero?:boolean;label:string;connectDaily?:boolean;compact?:boolean;formatValue?:(value:number)=>string;bars?:boolean}){
 const [chartRef,width]=useSignalChartWidth(),[selected,setSelected]=useState<string|null>(null);
 const chartId=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const valueLabel=(value:number)=>formatValue?formatValue(value):formatDecimalFixed(value,1);
 const points=series[0]?.points??[],values=series.flatMap(row=>row.points.flatMap(point=>[point.mean,point.low,point.q25,point.q75,point.high])).filter((value):value is number=>typeof value==='number'&&Number.isFinite(value)),scale=niceChartScale(values,zero),lo=scale.low,hi=scale.high,height=compact?210:250,left=points.some(point=>point.labelEnd)?48:60,right=points.some(point=>point.labelEnd)?12:22,top=22,bottom=48,x=(index:number)=>left+(index+.5)*(width-left-right)/Math.max(1,points.length),y=(value:number)=>top+(hi-value)/(hi-lo)*(height-top-bottom),ticks=scale.ticks;
 if(!values.length)return <div ref={chartRef} className="long-range-info"><p>Keine vergleichbaren Periodenwerte verfügbar. Fehlende Daten werden nicht als Nullsignal dargestellt.</p></div>;
 return <div ref={chartRef} className="long-range-chart" data-horizon-signal="period-intervals"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
  {ticks.map((tick,index)=><g key={index}><line className="grid" x1={left} x2={width-right} y1={y(tick)} y2={y(tick)}/><text className="axis-label" x={left-8} y={y(tick)+4} textAnchor="end">{formatDecimalFixed(tick,scale.decimals)}</text></g>)}
  {zero&&lo<=0&&hi>=0?<line x1={left} x2={width-right} y1={y(0)} y2={y(0)} stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 4" opacity={.65}/>:null}
  {series.map((row,rowIndex)=><g key={row.id} data-signal-series={row.id}>{connectDaily&&(row.points.some(point=>Boolean(point.color))?
 dailySignalColorSegments(row.points).map(segment=>{
  const id=`mid-daily-gradient-${chartId}-${row.id}-${segment.start}`,offset=(rowIndex-(series.length-1)/2)*10;
  return <g key={id}><defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={segment.startColor||row.color}/><stop offset="100%" stopColor={segment.endColor||row.color}/></linearGradient></defs><line className="daily-signal-line" x1={x(segment.start)+offset} y1={y(row.points[segment.start].mean!)} x2={x(segment.end)+offset} y2={y(row.points[segment.end].mean!)} stroke={`url(#${id})`} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"/></g>;
 }):
 dailySignalPaths(row.points,index=>x(index)+(rowIndex-(series.length-1)/2)*10,y).map((path,index)=><path key={`line-${index}`} className="daily-signal-line" d={path} fill="none" stroke={row.color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none"/>))}{row.points.map((point,index)=>{if(point.mean===null||!Number.isFinite(point.mean))return null;const px=x(index)+(rowIndex-(series.length-1)/2)*10;return <g key={point.id} role="button" tabIndex={0} aria-label={`${point.label}: ${valueLabel(point.mean)} ${unit} · ${point.detail??row.label}`} onClick={()=>setSelected(point.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(point.id)}}}><title>{`${row.label} · ${point.label}: ${valueLabel(point.mean)} ${unit}${point.detail?` · ${point.detail}`:''}${point.low!=null&&point.high!=null?` · P10–P90 ${valueLabel(point.low)} bis ${valueLabel(point.high)} ${unit}`:''}${point.q25!=null&&point.q75!=null?` · P25–P75 ${valueLabel(point.q25)} bis ${valueLabel(point.q75)} ${unit}`:''}`}</title>{bars?<rect className="daily-accumulation-bar" x={px-Math.min(13,(width-left-right)/Math.max(1,points.length)*.28)} y={y(point.mean)} width={Math.min(26,(width-left-right)/Math.max(1,points.length)*.56)} height={Math.max(0,y(0)-y(point.mean))} rx={2.5} fill={row.color} opacity={.78}/>:null}{point.low!=null&&point.high!=null?<><line x1={px} x2={px} y1={y(point.low)} y2={y(point.high)} stroke={point.color??row.color} strokeWidth={2} opacity={.55}/><path d={`M ${px-4} ${y(point.low)} H ${px+4} M ${px-4} ${y(point.high)} H ${px+4}`} stroke={point.color??row.color}/></>:null}{point.q25!=null&&point.q75!=null?<line x1={px} x2={px} y1={y(point.q25)} y2={y(point.q75)} stroke={point.color??row.color} strokeWidth={8} opacity={.3}/>:null}<circle cx={px} cy={y(point.mean)} r={12} fill="transparent"/><circle cx={px} cy={y(point.mean)} r={4} fill={point.color??row.color} stroke="var(--surface)" strokeWidth={1.5}/></g>})}</g>)}
  {points.filter((_,index)=>points[index].labelEnd||chartLabelVisible(index,points.length,width-left-right,80)).map(point=><text key={point.id} className="month-label" x={x(points.indexOf(point))} y={height-(point.labelEnd?31:20)} textAnchor="middle">{point.labelEnd?<><tspan x={x(points.indexOf(point))}>{point.label}</tspan><tspan x={x(points.indexOf(point))} dy={14}>{point.labelEnd}</tspan></>:point.label}</text>)}
 </svg><div className="long-range-model-line-legend">{series.map(row=><span key={row.id}><i style={{borderTopColor:row.color}}/><b>{row.label}</b></span>)}<span><b>{unit} · schmal P10–P90{series.some(row=>row.points.some(point=>point.q25!=null&&point.q75!=null))?' · breit P25–P75':''}</b></span></div>{selected?<p role="status">{series.map(row=>{const point=row.points.find(item=>item.id===selected);return point&&point.mean!==null?`${row.label} · ${point.label}: ${valueLabel(point.mean)} ${unit}${point.low!=null&&point.high!=null?` · P10–P90 ${valueLabel(point.low)} bis ${valueLabel(point.high)} ${unit}`:''}${point.q25!=null&&point.q75!=null?` · P25–P75 ${valueLabel(point.q25)} bis ${valueLabel(point.q75)} ${unit}`:''} · ${point.detail??''}`:null}).filter(Boolean).join(' · ')}</p>:null}</div>;
}
