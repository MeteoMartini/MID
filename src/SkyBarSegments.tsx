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
};

const cellOpacity=(level:1|2|3|4,base:number)=>Math.min(1,Math.max(.42,base*(.54+level*.115)));

export function SkyBarHourCellsSvg({cells,left,right,chartW,centerY,selectedIndex=-1,keyPrefix='sky-cell'}:HourCellsProps){
 if(!cells.length||chartW<=0)return null;
 const rightEdge=Math.max(left,chartW-right),plotWidth=Math.max(1,rightEdge-left),slot=plotWidth/cells.length,gap=Math.min(2.2,Math.max(.7,slot*.16)),size=Math.max(4,Math.min(10.5,slot-gap)),y=centerY-size/2;
 return <g data-mid-skybar-cells="24h">{cells.map((cell,index)=>{
  const x=left+index*slot+(slot-size)/2,base=cell.base,precip=cell.precip;
  return <g key={`${keyPrefix}-${cell.key}`} data-skybar-hour={index} data-skybar-state={cell.state}>
   <title>{cell.title}</title>
   <rect x={x} y={y} width={size} height={size} rx={Math.min(2.2,size*.22)} fill="var(--mid-skycell-empty,transparent)" stroke={index===selectedIndex?'var(--mid-skycell-selected,var(--accent))':'var(--mid-skycell-border,currentColor)'} strokeOpacity={index===selectedIndex?1:cell.state==='unavailable'?.34:.18} strokeWidth={index===selectedIndex?1.7:.8}/>
   {base?<rect x={x+.65} y={y+.65} width={Math.max(0,size-1.3)} height={Math.max(0,size-1.3)} rx={Math.min(1.8,size*.18)} fill={base.color} opacity={cellOpacity(base.thicknessLevel,base.opacity)}/>:null}
   {precip?<rect x={x+.65} y={y+.65} width={Math.max(0,size-1.3)} height={Math.max(0,size-1.3)} rx={Math.min(1.8,size*.18)} fill={precip.color} opacity={cellOpacity(precip.thicknessLevel,precip.opacity)}/>:null}
   {cell.state==='clear-night'&&!base&&!precip?<circle cx={x+size/2} cy={centerY} r={Math.max(1.2,size*.13)} fill="var(--mid-skycell-night,#71809b)" opacity={.58}/>:null}
  </g>
 })}</g>;
}
