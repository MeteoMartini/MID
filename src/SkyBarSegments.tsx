import type {SkyBarHourCell,SkyBarSegment} from './detailSkyBar';
import {skyBarVisualRuns} from './skyBarVisualRuns';

type Props={segments:SkyBarSegment[];keyPrefix?:string;thicknessScale?:number};

export function SkyBarSegmentsSvg({segments,keyPrefix='sky',thicknessScale=1}:Props){
 const runs=skyBarVisualRuns(segments);
 return <>{runs.map(run=>{
  const segment=run.segment;
  const width=Math.max(0,segment.x2-segment.x1);if(width<=0)return null;
  const thickness=segment.strokeWidth*thicknessScale;
  return <g key={`${keyPrefix}-${segment.key}`} data-skybar-level={segment.thicknessLevel} data-skybar-run-samples={run.samples.length} fill={segment.color} opacity={segment.opacity}>
   <rect pointerEvents="none" x={segment.x1} y={segment.y-thickness/2} width={width} height={thickness}/>
   {run.samples.map(sample=><rect key={sample.key} x={sample.x1} y={sample.y-thickness/2} width={sample.x2-sample.x1} height={thickness} fill="transparent"><title>{sample.title}</title></rect>)}
  </g>;
 })}</>;
}


type HourCellsProps={
 cells:SkyBarHourCell[];
 left:number;
 right:number;
 chartW:number;
 centerY:number;
 selectedIndex?:number;
 keyPrefix?:string;
 xPositions?:number[];
 xEndPositions?:number[];
 interactive?:boolean;
 onSelectIndex?:(index:number)=>void;
 ariaLabelForIndex?:(index:number,cell:SkyBarHourCell)=>string;
};

const cellOpacity=(level:1|2|3|4,base:number)=>Math.min(1,Math.max(.5,base*(.48+level*.13)));
const SUN_CELL_SHADES=['#fff0a6','#ffe169','#ffd13b','#ffc229'] as const;
const CLOUD_CELL_SHADES=['#e7eaed','#cfd4d8','#aeb3b9','#7f878f'] as const;
const baseCellFill=(visual:NonNullable<SkyBarHourCell['base']>)=>visual.color.toLowerCase()==='#ffc229'?SUN_CELL_SHADES[visual.thicknessLevel-1]:visual.color.toLowerCase()==='#aeb3b9'?CLOUD_CELL_SHADES[visual.thicknessLevel-1]:visual.color;

export function SkyBarHourCellsSvg({cells,left,right,chartW,centerY,selectedIndex=-1,keyPrefix='sky-cell',xPositions,xEndPositions,interactive=false,onSelectIndex,ariaLabelForIndex}:HourCellsProps){
 if(!cells.length||chartW<=0)return null;
 const rightEdge=Math.max(left,chartW-right),plotWidth=Math.max(1,rightEdge-left),fallbackSlot=plotWidth/cells.length,hasPositions=Array.isArray(xPositions)&&xPositions.length>=cells.length;
 const bounds=(index:number)=>{if(!hasPositions)return{start:left+index*fallbackSlot,end:index===cells.length-1?rightEdge:left+(index+1)*fallbackSlot};const rawStart=Number(xPositions?.[index]),rawNext=Number(xPositions?.[index+1]),explicitEnd=Number(xEndPositions?.[index]),rawPrev=Number(xPositions?.[index-1]),start=Math.max(left,Math.min(rightEdge,Number.isFinite(rawStart)?rawStart:left+index*fallbackSlot)),fallback=Number.isFinite(rawPrev)&&Number.isFinite(rawStart)&&rawStart>rawPrev?rawStart-rawPrev:fallbackSlot,end=Math.max(start,Math.min(rightEdge,Array.isArray(xEndPositions)&&Number.isFinite(explicitEnd)&&explicitEnd>rawStart?explicitEnd:Number.isFinite(rawNext)&&rawNext>rawStart?rawNext:start+fallback));return{start,end}};
 return <g data-mid-skybar-cells="24h" data-mid-skybar-axis={hasPositions?'shared':'uniform'} data-skybar-interactive={interactive?'true':'false'}>{cells.map((cell,index)=>{
  const {start,end}=bounds(index),span=Math.max(1,end-start),gap=Math.min(1.8,Math.max(.45,span*.1)),size=Math.max(2.4,Math.min(14,span-gap)),x=start+(span-size)/2,y=centerY-size/2,base=cell.base,precip=cell.precip,ariaLabel=ariaLabelForIndex?.(index,cell)??cell.title;
  return <g key={`${keyPrefix}-${cell.key}`} data-skybar-hour={index} data-skybar-state={cell.state} role={interactive?'button':undefined} tabIndex={interactive?0:undefined} aria-label={interactive?ariaLabel:undefined} aria-pressed={interactive?index===selectedIndex:undefined} onClick={interactive?()=>onSelectIndex?.(index):undefined} onKeyDown={interactive?event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelectIndex?.(index)}}:undefined}>
   <title>{cell.title}</title>
   <rect x={x} y={y} width={size} height={size} rx={Math.min(2.2,size*.22)} fill="var(--mid-skycell-empty,transparent)" stroke={index===selectedIndex?'var(--mid-skycell-selected,var(--accent))':'var(--mid-skycell-border,currentColor)'} strokeOpacity={index===selectedIndex?1:cell.state==='unavailable'?.34:.18} strokeWidth={index===selectedIndex?1.7:.8}/>
   {base?<rect x={x+.55} y={y+.55} width={Math.max(0,size-1.1)} height={Math.max(0,size-1.1)} rx={Math.min(2.3,size*.2)} fill={baseCellFill(base)} opacity={Math.max(.9,base.opacity)}/>:null}
   {precip?<rect x={x+.55} y={y+.55} width={Math.max(0,size-1.1)} height={Math.max(0,size-1.1)} rx={Math.min(2.3,size*.2)} fill={precip.color} opacity={cellOpacity(precip.thicknessLevel,precip.opacity)}/>:null}
   {cell.state==='clear-night'&&!base&&!precip?<rect x={x+.55} y={y+.55} width={Math.max(0,size-1.1)} height={Math.max(0,size-1.1)} rx={Math.min(2.3,size*.2)} fill="var(--mid-skycell-clear-night,#eef1f4)" opacity={.72}/>:null}
  </g>
 })}</g>;
}

/** Unknown calendar-day slots are visibly marked and never interpreted as clear or dry. */
export function SkyBarCoverageGapsSvg({ranges,startEpoch,endEpoch,left,right,chartW,centerY}:{ranges:{start:number;end:number}[];startEpoch:number;endEpoch:number;left:number;right:number;chartW:number;centerY:number}){
 if(!Number.isFinite(startEpoch)||!Number.isFinite(endEpoch)||endEpoch<=startEpoch)return null;
 const span=endEpoch-startEpoch,plotWidth=Math.max(0,chartW-left-right),x=(time:number)=>left+Math.max(0,Math.min(1,(time-startEpoch)/span))*plotWidth;
 return <g data-mid-skybar-unknown="true" pointerEvents="none">{ranges.map((range,index)=>{const start=x(range.start),end=x(range.end),width=Math.max(0,end-start);return width>.05?<rect key={index} x={start} y={centerY-2.5} width={width} height={5} fill="var(--mid-skycell-empty,#bbc3ca)" fillOpacity={.34} stroke="var(--mid-skycell-border,#64748b)" strokeOpacity={.32} strokeDasharray="1.5 1.5"><title>Stundenwerte für diesen Zeitraum nicht verfügbar – keine Aussage über Wolken oder Niederschlag</title></rect>:null})}</g>;
}
