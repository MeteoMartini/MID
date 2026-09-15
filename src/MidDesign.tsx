import {useEffect,useId,type CSSProperties,type HTMLAttributes,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight,Pause,Play,X} from 'lucide-react';
import {createPortal} from 'react-dom';

/** Shared building blocks for the opt-in MID Next system. They deliberately keep
 * meteorological colour semantics in the calling module rather than inventing
 * decorative accent colours. */
export function MidSurface({as:Tag='section',level='base',className='',children,...props}:{as?:'section'|'article'|'div';level?:'base'|'raised'|'floating';className?:string;children:ReactNode}&HTMLAttributes<HTMLElement>){
 return <Tag {...props} className={`mid-surface mid-surface-${level}${className?` ${className}`:''}`}>{children}</Tag>
}

export function MidMetric({label,value,icon,trend,className=''}:{label:string;value:ReactNode;icon?:ReactNode;trend?:ReactNode;className?:string}){
 return <div className={`mid-metric${className?` ${className}`:''}`}><span className="mid-metric-label">{icon}{label}</span><strong>{value}</strong>{trend?<small>{trend}</small>:null}</div>
}

export function MidDataStatus({label='Datenstand',detail,tone='neutral',className=''}:{label?:string;detail:ReactNode;tone?:'neutral'|'fresh'|'pending'|'limited';className?:string}){
 return <span className={`mid-data-status ${tone}${className?` ${className}`:''}`}><i aria-hidden="true"/><span><small>{label}</small><b>{detail}</b></span></span>
}

export function MidWeatherThread({points=[],label='Temperaturverlauf',className=''}:{points:number[];label?:string;className?:string}){
 const valid=points.filter(Number.isFinite);if(valid.length<2)return null;const low=Math.min(...valid),high=Math.max(...valid),range=Math.max(.1,high-low),path=valid.map((value,index)=>`${index?'L':'M'} ${index/(valid.length-1)*100} ${100-(value-low)/range*100}`).join(' '),last=valid.at(-1)!;
 return <svg className={`mid-weather-thread${className?` ${className}`:''}`} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label}><path d={path}/><circle cx="100" cy={100-(last-low)/range*100} r="3.8"/></svg>
}

export type MidTimelineFrame={id:string;label:string;detail?:string;phase?:'observation'|'nowcast'|'forecast';live?:boolean};
export function MidTimeline({frames,index,onChange,playing,onTogglePlay,onStep,className=''}:{frames:MidTimelineFrame[];index:number;onChange:(index:number)=>void;playing:boolean;onTogglePlay:()=>void;onStep?:(delta:number)=>void;className?:string}){
 const safe=Math.max(0,Math.min(Math.max(0,frames.length-1),index)),frame=frames[safe];
 return <div className={`mid-timeline${className?` ${className}`:''}`}><div className="mid-timeline-actions"><button type="button" disabled={frames.length<2||safe===0} onClick={()=>onStep?onStep(-1):onChange(safe-1)} aria-label="Vorheriger Zeitschritt"><ChevronLeft size={17}/></button><button type="button" disabled={frames.length<2} onClick={onTogglePlay} aria-label={playing?'Animation pausieren':'Animation starten'}>{playing?<Pause size={16}/>:<Play size={16}/>}</button><button type="button" disabled={frames.length<2||safe===frames.length-1} onClick={()=>onStep?onStep(1):onChange(safe+1)} aria-label="Nächster Zeitschritt"><ChevronRight size={17}/></button></div><label className="mid-timeline-scrubber"><span>{frames.length?`${safe+1} / ${frames.length} Zeitschritte`:'Kein Zeitschritt'}</span><input type="range" min={0} max={Math.max(0,frames.length-1)} value={safe} disabled={frames.length<2} onChange={event=>onChange(Number(event.target.value))}/><b>{frame?.label||'–'}{frame?.detail?<small>{frame.detail}</small>:null}</b></label></div>
}

export type MidLayerChip={id:string;label:string;active?:boolean;disabled?:boolean;loading?:boolean};
export function MidLayerChips({items,onChange,className=''}:{items:MidLayerChip[];onChange:(id:string)=>void;className?:string}){return <div className={`mid-layer-chips${className?` ${className}`:''}`} role="group" aria-label="Kartenebenen">{items.map(item=><button key={item.id} type="button" disabled={item.disabled} className={item.active?'active':''} aria-pressed={item.active} onClick={()=>onChange(item.id)}>{item.loading?<i className="mid-layer-loading"/>:null}{item.label}</button>)}</div>}

export function MidInsight({eyebrow='MID Analyse',title,children,source,className=''}:{eyebrow?:string;title:string;children:ReactNode;source?:ReactNode;className?:string}){return <section className={`mid-insight${className?` ${className}`:''}`}><header><small>{eyebrow}</small><strong>{title}</strong></header><p>{children}</p>{source?<footer>{source}</footer>:null}</section>}

export function MidForecastRow({className='',children,...props}:{className?:string;children:ReactNode}&HTMLAttributes<HTMLDivElement>){return <div {...props} className={`mid-forecast-row${className?` ${className}`:''}`}>{children}</div>}

export function MidDetailSheet({open,onClose,title,children,className='',ariaLabel}:{open:boolean;onClose:()=>void;title:string;children:ReactNode;className?:string;ariaLabel?:string}){
 const titleId=useId();useEffect(()=>{if(!open)return;const closeOnScroll=()=>onClose(),escape=(event:KeyboardEvent)=>{if(event.key==='Escape')onClose()};window.addEventListener('scroll',closeOnScroll,{capture:true,passive:true});window.addEventListener('keydown',escape);return()=>{window.removeEventListener('scroll',closeOnScroll,true);window.removeEventListener('keydown',escape)}},[open,onClose]);
 if(!open||typeof document==='undefined')return null;
 return createPortal(<div className="mid-detail-sheet-backdrop" role="presentation" onPointerDown={event=>{if(event.target===event.currentTarget)onClose()}}><section className={`mid-detail-sheet${className?` ${className}`:''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-label={ariaLabel}><header><div><small>Details</small><strong id={titleId}>{title}</strong></div><button type="button" onClick={onClose} aria-label="Details schließen"><X size={18}/></button></header><div className="mid-detail-sheet-content">{children}</div></section></div>,document.body)
}

export function midThreadStyle(values:number[]):CSSProperties{return{'--mid-thread-count':Math.max(2,values.filter(Number.isFinite).length)} as CSSProperties}
