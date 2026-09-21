import type {SkyBarHourCell,SkyBarSegment} from './detailSkyBar';

type Props={segments:SkyBarSegment[];keyPrefix?:string};

const touches=(a:SkyBarSegment|undefined,b:SkyBarSegment|undefined)=>Boolean(a&&b&&a.layer===b.layer&&Math.abs(a.x2-b.x1)<=0.75&&Math.abs(a.y-b.y)<=0.01&&Math.abs(a.strokeWidth-b.strokeWidth)<=0.01);

export function SkyBarSegmentsSvg({segments,keyPrefix='sky'}:Props){
 return <>{segments.map((segment,index)=>{
  const width=Math.max(0,segment.x2-segment.x1);if(width<=0)return null;
  const radius=Math.min(segment.strokeWidth/2,width/2),joinedLeft=touches(segments[index-1],segment),joinedRight=touches(segment,segments[index+1]);
  if((!joinedLeft&&!joinedRight)||width<=radius*2+.01)return <rect key={`${keyPrefix}-${segment.key}`} data-skybar-level={segment.thicknessLevel} x={segment.x1} y={segment.y-segment.strokeWidth/2} width={width} height={segment.strokeWidth} rx={radius} fill={segment.color} opacity={segment.opacity}><title>{segment.title}</title></rect>;
  const leftInset=joinedLeft?0:radius,rightInset=joinedRight?0:radius,bodyX=segment.x1+leftInset,bodyWidth=Math.max(0,segment.x2-rightInset-bodyX);
  return <g key={`${keyPrefix}-${segment.key}`} data-skybar-level={segment.thicknessLevel} fill={segment.color} opacity={segment.opacity}><title>{segment.title}</title>{bodyWidth>0?<rect x={bodyX} y={segment.y-segment.strokeWidth/2} width={bodyWidth} height={segment.strokeWidth}/>:null}{!joinedLeft?<circle cx={segment.x1+radius} cy={segment.y} r={radius}/>:null}{!joinedRight?<circle cx={segment.x2-radius} cy={segment.y} r={radius}/>:null}</g>;
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
};

const cellOpacity=(level:1|2|3|4,base:number)=>Math.min(1,Math.max(.5,base*(.48+level*.13)));
const SUN_CELL_SHADES=['#fff0a6','#ffe169','#ffd13b','#ffc229'] as const;
const CLOUD_CELL_SHADES=['#e7eaed','#cfd4d8','#aeb3b9','#7f878f'] as const;
const baseCellFill=(visual:NonNullable<SkyBarHourCell['base']>)=>visual.color.toLowerCase()==='#ffc229'?SUN_CELL_SHADES[visual.thicknessLevel-1]:visual.color.toLowerCase()==='#aeb3b9'?CLOUD_CELL_SHADES[visual.thicknessLevel-1]:visual.color;

export function SkyBarHourCellsSvg({cells,left,right,chartW,centerY,selectedIndex=-1,keyPrefix='sky-cell',xPositions}:HourCellsProps){
 if(!cells.length||chartW<=0)return null;
 const rightEdge=Math.max(left,chartW-right),plotWidth=Math.max(1,rightEdge-left),fallbackSlot=plotWidth/cells.length,hasPositions=Array.isArray(xPositions)&&xPositions.length>=cells.length;
 const bounds=(index:number)=>{if(!hasPositions)return{start:left+index*fallbackSlot,end:index===cells.length-1?rightEdge:left+(index+1)*fallbackSlot};const rawStart=Number(xPositions?.[index]),rawNext=Number(xPositions?.[index+1]),rawPrev=Number(xPositions?.[index-1]),start=Math.max(left,Math.min(rightEdge,Number.isFinite(rawStart)?rawStart:left+index*fallbackSlot)),fallback=Number.isFinite(rawPrev)&&Number.isFinite(rawStart)&&rawStart>rawPrev?rawStart-rawPrev:fallbackSlot,end=Math.max(start,Math.min(rightEdge,Number.isFinite(rawNext)&&rawNext>rawStart?rawNext:start+fallback));return{start,end}};
 return <g data-mid-skybar-cells="24h" data-mid-skybar-axis={hasPositions?'shared':'uniform'}>{cells.map((cell,index)=>{
  const {start,end}=bounds(index),span=Math.max(1,end-start),gap=Math.min(1.8,Math.max(.45,span*.1)),size=Math.max(2.4,Math.min(14,span-gap)),x=start+(span-size)/2,y=centerY-size/2,base=cell.base,precip=cell.precip;
  return <g key={`${keyPrefix}-${cell.key}`} data-skybar-hour={index} data-skybar-state={cell.state}>
   <title>{cell.title}</title>
   <rect x={x} y={y} width={size} height={size} rx={Math.min(2.2,size*.22)} fill="var(--mid-skycell-empty,transparent)" stroke={index===selectedIndex?'var(--mid-skycell-selected,var(--accent))':'var(--mid-skycell-border,currentColor)'} strokeOpacity={index===selectedIndex?1:cell.state==='unavailable'?.34:.18} strokeWidth={index===selectedIndex?1.7:.8}/>
   {base?<rect x={x+.55} y={y+.55} width={Math.max(0,size-1.1)} height={Math.max(0,size-1.1)} rx={Math.min(2.3,size*.2)} fill={baseCellFill(base)} opacity={Math.max(.9,base.opacity)}/>:null}
   {precip?<rect x={x+.55} y={y+.55} width={Math.max(0,size-1.1)} height={Math.max(0,size-1.1)} rx={Math.min(2.3,size*.2)} fill={precip.color} opacity={cellOpacity(precip.thicknessLevel,precip.opacity)}/>:null}
   {cell.state==='clear-night'&&!base&&!precip?<rect x={x+.55} y={y+.55} width={Math.max(0,size-1.1)} height={Math.max(0,size-1.1)} rx={Math.min(2.3,size*.2)} fill="var(--mid-skycell-clear-night,#eef1f4)" opacity={.72}/>:null}
  </g>
 })}</g>;
}
