import type {Feature,FeatureCollection,MultiPolygon,Position} from 'geojson';
import type {ExtremeAreaContour} from './extremeOutlookAreaCanvas';

type OverlayRing={raw:Array<{lon:number;lat:number}>;closed:Position[];absoluteArea:number;children:OverlayRing[];parent:OverlayRing|null};
type ExtremeOutlookContourProperties={intensity:ExtremeAreaContour['intensity'];color:string;opacity:number;probability:number};

function ringArea(ring:Array<{lon:number;lat:number}>){let area=0;for(let index=0;index<ring.length;index++){const current=ring[index],next=ring[(index+1)%ring.length];area+=current.lon*next.lat-next.lon*current.lat}return area/2}
function ringCoordinates(ring:Array<{lon:number;lat:number}>):Position[]{return[...ring.map(point=>[point.lon,point.lat] as Position),[ring[0].lon,ring[0].lat] as Position]}
function pointInRing(point:[number,number],ring:Array<{lon:number;lat:number}>){let inside=false;for(let index=0,last=ring.length-1;index<ring.length;last=index++){const xi=ring[index].lon,yi=ring[index].lat,xj=ring[last].lon,yj=ring[last].lat,intersects=(yi>point[1])!==(yj>point[1])&&point[0]<(xj-xi)*(point[1]-yi)/((yj-yi)||1e-9)+xi;if(intersects)inside=!inside}return inside}
function normalizeOrientation(ring:Position[],clockwise:boolean):Position[]{const body=ring.slice(0,-1),area=body.reduce((sum,point,index)=>{const next=ring[index+1];return sum+Number(point[0])*Number(next[1])-Number(next[0])*Number(point[1])},0)/2,ordered=clockwise===area<0?body:[...body].reverse();return[...ordered,[...ordered[0]] as Position]}

function contourPolygons(contour:ExtremeAreaContour):Position[][][]{
 const rings:OverlayRing[]=contour.rings.filter(ring=>ring.length>=3).map(ring=>({raw:ring,closed:ringCoordinates(ring),absoluteArea:Math.abs(ringArea(ring)),children:[],parent:null})).sort((a,b)=>b.absoluteArea-a.absoluteArea);
 for(const ring of rings){
  const sample:[number,number]=[ring.raw[0].lon,ring.raw[0].lat];
  let parent:OverlayRing|null=null;
  for(const candidate of rings){
   if(candidate===ring||candidate.absoluteArea<=ring.absoluteArea)continue;
   if(!pointInRing(sample,candidate.raw))continue;
   if(!parent||candidate.absoluteArea<parent.absoluteArea)parent=candidate;
  }
  ring.parent=parent;
  if(parent)parent.children.push(ring);
 }
 const depthOf=(ring:OverlayRing)=>{let depth=0,current=ring.parent;while(current){depth++;current=current.parent}return depth};
 const polygons:Position[][][]=[];
 const appendPolygon=(outer:OverlayRing)=>{const polygon:Position[][]=[normalizeOrientation(outer.closed,false)];const stack=[...outer.children];while(stack.length){const child=stack.shift()!;const depth=depthOf(child)-depthOf(outer);if(depth===1)polygon.push(normalizeOrientation(child.closed,true));else if(depth%2===0)appendPolygon(child);stack.push(...child.children)}polygons.push(polygon)};
 for(const ring of rings)if(!ring.parent)appendPolygon(ring);
 return polygons;
}

export function buildExtremeOutlookContourGeoJson(contours:ExtremeAreaContour[]):FeatureCollection<MultiPolygon,ExtremeOutlookContourProperties>{
 const features:Feature<MultiPolygon,ExtremeOutlookContourProperties>[] = contours.map((contour,index)=>({
  type:'Feature',
  id:index,
  properties:{intensity:contour.intensity,color:contour.color,opacity:contour.opacity,probability:contour.probability},
  geometry:{type:'MultiPolygon',coordinates:contourPolygons(contour)}
 }));
 return{type:'FeatureCollection',features};
}

export type {ExtremeOutlookContourProperties};
