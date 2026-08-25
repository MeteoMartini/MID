export type ExtremeAreaIntensity=1|2|3|4;
export type ExtremeAreaPaintCell={lat:number;lon:number;color:string;opacity:number;probability:number;intensity:ExtremeAreaIntensity};
export type ExtremeAreaCanvasGrid={latStep:number;lonStep:number};
export type ExtremeAreaProjection={getCanvas:()=>{clientWidth:number;clientHeight:number};project:(coordinate:[number,number])=>{x:number;y:number}};
export type ExtremeAreaGeoPoint={lon:number;lat:number};
export type ExtremeAreaContour={intensity:ExtremeAreaIntensity;color:string;opacity:number;probability:number;rings:ExtremeAreaGeoPoint[][]};

type GridPoint={x:number;y:number};
type GridEdge={start:GridPoint;end:GridPoint};
type ProjectedPoint={x:number;y:number};
type ProjectedContour=Omit<ExtremeAreaContour,'rings'>&{rings:ProjectedPoint[][]};

const SAMPLE_SUBDIVISIONS=9;
const KERNEL_RADIUS_STEPS=.8;
const FIELD_THRESHOLD=.09;
const COMPONENT_DISTANCE_STEPS=1.5;

function rgba(hex:string,alpha:number){const value=hex.replace('#',''),expanded=value.length===3?value.split('').map(character=>character+character).join(''):value,number=Number.parseInt(expanded,16);if(!Number.isFinite(number))return`rgba(38,155,131,${alpha})`;return`rgba(${number>>16&255},${number>>8&255},${number&255},${alpha})`}
function pointKey(point:GridPoint){return`${point.x}:${point.y}`}
function normalizedDistance(a:ExtremeAreaPaintCell,b:ExtremeAreaPaintCell,grid:ExtremeAreaCanvasGrid){return Math.hypot((a.lat-b.lat)/grid.latStep,(a.lon-b.lon)/grid.lonStep)}

function connectedComponents(areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid){
 const remaining=new Set(areas.map((_,index)=>index)),components:ExtremeAreaPaintCell[][]=[];
 while(remaining.size){const first=remaining.values().next().value as number,queue=[first],component:ExtremeAreaPaintCell[]=[];remaining.delete(first);while(queue.length){const index=queue.shift()!,area=areas[index];component.push(area);for(const candidate of [...remaining])if(normalizedDistance(area,areas[candidate],grid)<=COMPONENT_DISTANCE_STEPS){remaining.delete(candidate);queue.push(candidate)}}components.push(component)}
 return components;
}

function supportAt(lat:number,lon:number,areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid){
 let outside=1;
 for(const area of areas){const dx=(lon-area.lon)/(grid.lonStep*KERNEL_RADIUS_STEPS),dy=(lat-area.lat)/(grid.latStep*KERNEL_RADIUS_STEPS),distanceSquared=dx*dx+dy*dy;if(distanceSquared>=1)continue;const kernel=(1-distanceSquared)**2;outside*=1-kernel}
 return 1-outside;
}

function smoothRing(points:ExtremeAreaGeoPoint[],passes=2){let result=points;for(let pass=0;pass<passes;pass++){const next:ExtremeAreaGeoPoint[]=[];for(let index=0;index<result.length;index++){const current=result[index],following=result[(index+1)%result.length];next.push({lon:current.lon*.75+following.lon*.25,lat:current.lat*.75+following.lat*.25},{lon:current.lon*.25+following.lon*.75,lat:current.lat*.25+following.lat*.75})}result=next}return result}
function ringArea(points:ExtremeAreaGeoPoint[]){let area=0;for(let index=0;index<points.length;index++){const current=points[index],next=points[(index+1)%points.length];area+=current.lon*next.lat-next.lon*current.lat}return area/2}

function traceMask(mask:boolean[][],west:number,north:number,lonStep:number,latStep:number){
 const rows=mask.length,cols=mask[0]?.length||0,edges:GridEdge[]=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){if(!mask[row][col])continue;if(!mask[row-1]?.[col])edges.push({start:{x:col,y:row},end:{x:col+1,y:row}});if(!mask[row]?.[col+1])edges.push({start:{x:col+1,y:row},end:{x:col+1,y:row+1}});if(!mask[row+1]?.[col])edges.push({start:{x:col+1,y:row+1},end:{x:col,y:row+1}});if(!mask[row]?.[col-1])edges.push({start:{x:col,y:row+1},end:{x:col,y:row}})}
 const byStart=new Map<string,number[]>();edges.forEach((edge,index)=>{const key=pointKey(edge.start),items=byStart.get(key)||[];items.push(index);byStart.set(key,items)});const unused=new Set(edges.map((_,index)=>index)),rings:ExtremeAreaGeoPoint[][]=[];
 while(unused.size){const first=unused.values().next().value as number,start=edges[first].start,ring:GridPoint[]=[start];let edgeIndex=first,closed=false;for(let guard=0;guard<=edges.length;guard++){if(!unused.delete(edgeIndex))break;const end=edges[edgeIndex].end;if(end.x===start.x&&end.y===start.y){closed=true;break}ring.push(end);const next=(byStart.get(pointKey(end))||[]).find(candidate=>unused.has(candidate));if(next===undefined)break;edgeIndex=next}if(!closed||ring.length<8)continue;const geographic=smoothRing(ring.map(point=>({lon:west+point.x*lonStep,lat:north-point.y*latStep})));if(Math.abs(ringArea(geographic))>=lonStep*latStep*2)rings.push(geographic)}
 return rings;
}

function contoursForComponent(component:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid):ExtremeAreaContour|null{
 const padding=KERNEL_RADIUS_STEPS+.18,minLat=Math.min(...component.map(area=>area.lat))-padding*grid.latStep,maxLat=Math.max(...component.map(area=>area.lat))+padding*grid.latStep,minLon=Math.min(...component.map(area=>area.lon))-padding*grid.lonStep,maxLon=Math.max(...component.map(area=>area.lon))+padding*grid.lonStep,rows=Math.max(8,Math.ceil((maxLat-minLat)/grid.latStep*SAMPLE_SUBDIVISIONS)),cols=Math.max(8,Math.ceil((maxLon-minLon)/grid.lonStep*SAMPLE_SUBDIVISIONS)),latStep=(maxLat-minLat)/rows,lonStep=(maxLon-minLon)/cols,mask=Array.from({length:rows},(_,row)=>Array.from({length:cols},(_,col)=>supportAt(maxLat-(row+.5)*latStep,minLon+(col+.5)*lonStep,component,grid)>=FIELD_THRESHOLD)),rings=traceMask(mask,minLon,maxLat,lonStep,latStep);if(!rings.length)return null;
 const probability=Math.round(component.reduce((sum,area)=>sum+area.probability,0)/component.length),opacity=component.reduce((sum,area)=>sum+area.opacity,0)/component.length;
 return{intensity:component[0].intensity,color:component[0].color,probability,opacity:Math.max(.38,Math.min(.82,opacity)),rings};
}

export function buildExtremeOutlookContours(areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid){
 const contours:ExtremeAreaContour[]=[];
 for(const intensity of[1,2,3,4] as const){const sameIntensity=areas.filter(area=>area.intensity===intensity);for(const component of connectedComponents(sameIntensity,grid)){const contour=contoursForComponent(component,grid);if(contour)contours.push(contour)}}
 return contours.sort((a,b)=>a.intensity-b.intensity||a.probability-b.probability);
}

function traceProjected(context:CanvasRenderingContext2D,contour:ProjectedContour){context.beginPath();for(const ring of contour.rings){if(!ring.length)continue;context.moveTo(ring[0].x,ring[0].y);for(let index=1;index<ring.length;index++)context.lineTo(ring[index].x,ring[index].y);context.closePath()}}
function projectedBounds(contour:ProjectedContour){const points=contour.rings.flat(),xs=points.map(point=>point.x),ys=points.map(point=>point.y);return{left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)}}

export function drawExtremeOutlookContours(map:ExtremeAreaProjection,canvas:HTMLCanvasElement,contours:ExtremeAreaContour[]){
 const mapCanvas=map.getCanvas(),width=Math.max(0,mapCanvas.clientWidth),height=Math.max(0,mapCanvas.clientHeight);if(!width||!height)return;
 const ratio=Math.max(1,Math.min(2,globalThis.devicePixelRatio||1)),pixelWidth=Math.round(width*ratio),pixelHeight=Math.round(height*ratio);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`}
 const context=canvas.getContext('2d');if(!context)return;context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);context.lineJoin='round';context.lineCap='round';const projected:ProjectedContour[]=contours.map(contour=>({...contour,rings:contour.rings.map(ring=>ring.map(point=>map.project([point.lon,point.lat])))}));
 for(const contour of projected){traceProjected(context,contour);context.fillStyle=rgba(contour.color,contour.opacity);context.fill('evenodd');if(contour.probability<60){const bounds=projectedBounds(contour),span=Math.max(1,bounds.bottom-bounds.top);context.save();traceProjected(context,contour);context.clip('evenodd');context.strokeStyle=rgba(contour.color,.78);context.lineWidth=.8;for(let x=bounds.left-span-12;x<=bounds.right+12;x+=9){context.beginPath();context.moveTo(x,bounds.top-6);context.lineTo(x+span+12,bounds.bottom+6);context.stroke()}context.restore()}}
 for(const contour of projected){traceProjected(context,contour);context.strokeStyle='rgba(255,255,255,.78)';context.lineWidth=3.4;context.stroke();traceProjected(context,contour);context.strokeStyle=rgba(contour.color,.98);context.lineWidth=1.45;context.stroke()}
}

export function drawExtremeOutlookAreas(map:ExtremeAreaProjection,canvas:HTMLCanvasElement,areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid){drawExtremeOutlookContours(map,canvas,buildExtremeOutlookContours(areas,grid))}
