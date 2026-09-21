import {useId,type CSSProperties,type HTMLAttributes,type ReactNode} from 'react';
import {ChevronLeft,ChevronRight,Pause,Play,X} from 'lucide-react';
import {AppPortalFullscreen} from './AppPortalPopover';
import {ecmwfTemperatureColor} from './temperatureTone';

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

export type MidWeatherThreadNightBand={start:number;end:number;fadeIn?:boolean;fadeOut?:boolean};
export function MidWeatherThread({points=[],label='Temperaturverlauf',className='',minimumSpan=4,verticalGridDivisions=2,horizontalInset=0,temperatureColorMode='solid',markers='both',nightBands=[]}:{points:number[];label?:string;className?:string;minimumSpan?:number;verticalGridDivisions?:number;horizontalInset?:number;temperatureColorMode?:'solid'|'ecmwf';markers?:'none'|'start'|'both';nightBands?:MidWeatherThreadNightBand[]}){
 const gradientId=`mid-weather-thread-${useId().replace(/:/g,'')}`;
 const finite=points.map((value,index)=>({value,index})).filter(item=>Number.isFinite(item.value));if(finite.length<2)return null;
 const rawLow=Math.min(...finite.map(item=>item.value)),rawHigh=Math.max(...finite.map(item=>item.value)),rawRange=Math.max(.1,rawHigh-rawLow),span=Math.max(Math.max(.1,minimumSpan),rawRange*1.18),mid=(rawLow+rawHigh)/2,low=mid-span/2,high=mid+span/2,range=high-low,denominator=Math.max(1,points.length-1),safeInset=Math.max(0,Math.min(18,Number(horizontalInset)||0)),plotWidth=Math.max(1,100-safeInset*2),x=(index:number)=>safeInset+index/denominator*plotWidth,y=(value:number)=>92-(value-low)/range*84;
 const segments:string[]=[];let segment:string[]=[];
 points.forEach((value,index)=>{if(Number.isFinite(value)){segment.push(`${segment.length?'L':'M'} ${x(index)} ${y(value)}`);return}if(segment.length){segments.push(segment.join(' '));segment=[]}});if(segment.length)segments.push(segment.join(' '));
 const colorSegments=points.flatMap((value,index)=>{if(index>=points.length-1||!Number.isFinite(value)||!Number.isFinite(points[index+1]))return[];const next=Number(points[index+1]),current=Number(value);return[{index,x1:x(index),y1:y(current),x2:x(index+1),y2:y(next),color:ecmwfTemperatureColor((current+next)/2)}]}),first=finite[0],last=finite.at(-1)!,guideY=y(first.value),gridY=[8,50,92],safeVerticalDivisions=Math.max(1,Math.min(48,Math.round(verticalGridDivisions))),gridX=Array.from({length:safeVerticalDivisions+1},(_,index)=>safeInset+index/safeVerticalDivisions*plotWidth),areaPoints=finite.length===points.length?[[x(first.index),92],...finite.map(item=>[x(item.index),y(item.value)] as [number,number]),[x(last.index),92]].map(([px,py])=>`${px},${py}`).join(' '):'',areaStops=finite.map(item=>({offset:`${Math.round(item.index/denominator*1000)/10}%`,color:ecmwfTemperatureColor(item.value)})),safeNightBands=nightBands.map((band,index)=>{const start=Math.max(0,Math.min(1,Number(band.start)||0)),end=Math.max(start,Math.min(1,Number(band.end)||0));return{...band,index,start,end,x:safeInset+start*plotWidth,width:(end-start)*plotWidth,gradientId:`${gradientId}-night-${index}`}}).filter(band=>band.width>.01);
 return <svg className={`mid-weather-thread${className?` ${className}`:''}`} viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={label}>{temperatureColorMode==='ecmwf'&&areaPoints||safeNightBands.length?<defs>{temperatureColorMode==='ecmwf'&&areaPoints?<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">{areaStops.map((stop,index)=><stop key={index} offset={stop.offset} stopColor={stop.color} stopOpacity="0.18"/>)}</linearGradient>:null}{safeNightBands.map(band=><linearGradient key={band.gradientId} id={band.gradientId} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="var(--mg-night,#5b667c)" stopOpacity={band.fadeIn?0:.2}/><stop offset="14%" stopColor="var(--mg-night,#5b667c)" stopOpacity=".2"/><stop offset="86%" stopColor="var(--mg-night,#5b667c)" stopOpacity=".2"/><stop offset="100%" stopColor="var(--mg-night,#5b667c)" stopOpacity={band.fadeOut?0:.2}/></linearGradient>)}</defs>:null}{safeNightBands.length?<g className="mid-weather-thread-night-bands" aria-hidden="true">{safeNightBands.map(band=><rect key={band.gradientId} x={band.x} y="8" width={band.width} height="84" rx=".7" fill={`url(#${band.gradientId})`}/>)}</g>:null}<g className="mid-weather-thread-grid" aria-hidden="true">{gridY.map(value=><line key={`h-${value}`} x1={safeInset} y1={value} x2={100-safeInset} y2={value}/>)}{gridX.map((value,index)=><line key={`v-${index}`} x1={value} y1="8" x2={value} y2="92"/>)}</g><line className="mid-weather-thread-guide" x1={safeInset} y1={guideY} x2={100-safeInset} y2={guideY}/>{temperatureColorMode==='ecmwf'&&areaPoints?<polygon className="mid-weather-thread-temperature-area" points={areaPoints} fill={`url(#${gradientId})`} aria-hidden="true"/>:null}{temperatureColorMode==='ecmwf'?<g className="mid-weather-thread-temperature-ecmwf">{colorSegments.map(segment=><line key={segment.index} x1={segment.x1} y1={segment.y1} x2={segment.x2} y2={segment.y2} stroke={segment.color}/>)}</g>:segments.map((path,index)=><path key={index} d={path}/>)}
 {markers!=='none'?<circle className="mid-weather-thread-current" cx={x(first.index)} cy={y(first.value)} r="2.1"/>:null}{markers==='both'?<circle className="mid-weather-thread-end" cx={x(last.index)} cy={y(last.value)} r="1.35"/>:null}</svg>
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
 const titleId=useId();
 return <AppPortalFullscreen open={open} onClose={onClose} className="mid-detail-sheet-backdrop" ariaLabel={ariaLabel}><section className={`mid-detail-sheet${className?` ${className}`:''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-label={ariaLabel}><header><div><small>Details</small><strong id={titleId}>{title}</strong></div><button type="button" onClick={onClose} aria-label="Details schließen"><X size={18}/></button></header><div className="mid-detail-sheet-content">{children}</div></section></AppPortalFullscreen>
}

export function midThreadStyle(values:number[]):CSSProperties{return{'--mid-thread-count':Math.max(2,values.filter(Number.isFinite).length)} as CSSProperties}
