import type {SkyBarSegment} from './detailSkyBar';

type Props={segments:SkyBarSegment[];keyPrefix?:string};

const touches=(a:SkyBarSegment|undefined,b:SkyBarSegment|undefined)=>Boolean(a&&b&&a.layer===b.layer&&Math.abs(a.x2-b.x1)<=0.75&&Math.abs(a.y-b.y)<=0.01&&Math.abs(a.strokeWidth-b.strokeWidth)<=0.01);

export function SkyBarSegmentsSvg({segments,keyPrefix='sky'}:Props){
 return <>{segments.map((segment,index)=>{
  const width=Math.max(0,segment.x2-segment.x1);if(width<=0)return null;
  const radius=Math.min(segment.strokeWidth/2,width/2),joinedLeft=touches(segments[index-1],segment),joinedRight=touches(segment,segments[index+1]);
  if((!joinedLeft&&!joinedRight)||width<=radius*2+.01)return <rect key={`${keyPrefix}-${segment.key}`} x={segment.x1} y={segment.y-segment.strokeWidth/2} width={width} height={segment.strokeWidth} rx={radius} fill={segment.color} opacity={segment.opacity}><title>{segment.title}</title></rect>;
  const leftInset=joinedLeft?0:radius,rightInset=joinedRight?0:radius,bodyX=segment.x1+leftInset,bodyWidth=Math.max(0,segment.x2-rightInset-bodyX);
  return <g key={`${keyPrefix}-${segment.key}`} fill={segment.color} opacity={segment.opacity}><title>{segment.title}</title>{bodyWidth>0?<rect x={bodyX} y={segment.y-segment.strokeWidth/2} width={bodyWidth} height={segment.strokeWidth}/>:null}{!joinedLeft?<circle cx={segment.x1+radius} cy={segment.y} r={radius}/>:null}{!joinedRight?<circle cx={segment.x2-radius} cy={segment.y} r={radius}/>:null}</g>;
 })}</>;
}
