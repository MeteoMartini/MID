export type ExtremeAreaIntensity=1|2|3|4;
export type ExtremeAreaPaintCell={
 row?:number;
 col?:number;
 lat:number;
 lon:number;
 color?:string;
 opacity?:number;
 probability?:number;
 intensity?:0|ExtremeAreaIntensity;
 probabilityLevels?:[number,number,number,number];
};
export type ExtremeAreaCanvasGrid={
 rows?:number;
 cols?:number;
 latStep:number;
 lonStep:number;
 bounds?:{south:number;west:number;north:number;east:number};
 analysisBounds?:{south:number;west:number;north:number;east:number};
};
export type ExtremeAreaContourOptions={
 minimumProbability?:number;
 extremeMinimumProbability?:number;
 maximumProbability?:number;
 colors?:Partial<Record<ExtremeAreaIntensity,string>>;
};
export type ExtremeAreaProjection={getCanvas:()=>{clientWidth:number;clientHeight:number};project:(coordinate:[number,number])=>{x:number;y:number}};
export type ExtremeAreaGeoPoint={lon:number;lat:number};
export type ExtremeAreaContour={intensity:ExtremeAreaIntensity;color:string;opacity:number;probability:number;rings:ExtremeAreaGeoPoint[][]};

type GridPoint={x:number;y:number};
type GridEdge={start:GridPoint;end:GridPoint};
type ProjectedPoint={x:number;y:number};
type ProjectedContour=Omit<ExtremeAreaContour,'rings'>&{rings:ProjectedPoint[][]};
type IndexedCell=ExtremeAreaPaintCell&{row:number;col:number};
type IndexedField={cells:IndexedCell[];rows:number;cols:number;north:number;west:number};

const FIELD_SUBDIVISIONS=10;
const FIELD_PADDING_STEPS=1;
const COVERAGE_THRESHOLD=.28;
const MIN_REGION_FINE_CELLS=3;
const DEFAULT_COLORS:Record<ExtremeAreaIntensity,string>={1:'#f4d03f',2:'#f08a24',3:'#d9363e',4:'#8f174f'};

function rgba(hex:string,alpha:number){const value=hex.replace('#',''),expanded=value.length===3?value.split('').map(character=>character+character).join(''):value,number=Number.parseInt(expanded,16);if(!Number.isFinite(number))return`rgba(38,155,131,${alpha})`;return`rgba(${number>>16&255},${number>>8&255},${number&255},${alpha})`}
function pointKey(point:GridPoint){return`${point.x}:${point.y}`}
function finite(value:unknown,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
function probabilityOpacity(probability:number){return probability>=80?.82:probability>=60?.7:probability>=30?.54:probability>=10?.4:.3}

function indexField(areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid):IndexedField|null{
 if(!areas.length||!(grid.latStep>0)||!(grid.lonStep>0))return null;
 const indexed=areas.every(area=>Number.isInteger(area.row)&&Number.isInteger(area.col));
 const north=grid.analysisBounds?.north??grid.bounds?.north??(indexed?areas.reduce((sum,area)=>sum+area.lat+finite(area.row)*grid.latStep,0)/areas.length:Math.max(...areas.map(area=>area.lat)));
 const west=grid.analysisBounds?.west??grid.bounds?.west??(indexed?areas.reduce((sum,area)=>sum+area.lon-finite(area.col)*grid.lonStep,0)/areas.length:Math.min(...areas.map(area=>area.lon)));
 const cells=areas.map(area=>({...area,row:indexed?finite(area.row):Math.round((north-area.lat)/grid.latStep),col:indexed?finite(area.col):Math.round((area.lon-west)/grid.lonStep)})).filter(area=>area.row>=0&&area.col>=0);
 if(!cells.length)return null;
 const rows=Math.max(grid.rows||0,...cells.map(area=>area.row+1)),cols=Math.max(grid.cols||0,...cells.map(area=>area.col+1));
 return{cells,rows,cols,north,west};
}

function probabilityForLevel(cell:IndexedCell,level:ExtremeAreaIntensity,explicitLevels:boolean){
 if(explicitLevels)return Math.max(0,Math.min(100,finite(cell.probabilityLevels?.[level-1])));
 return cell.intensity===level?Math.max(0,Math.min(100,finite(cell.probability))):0;
}

function bilinear(matrix:number[][],row:number,col:number){
 const row0=Math.floor(row),col0=Math.floor(col),rowFraction=row-row0,colFraction=col-col0;
 return finite(matrix[row0]?.[col0])*(1-rowFraction)*(1-colFraction)+finite(matrix[row0]?.[col0+1])*(1-rowFraction)*colFraction+finite(matrix[row0+1]?.[col0])*rowFraction*(1-colFraction)+finite(matrix[row0+1]?.[col0+1])*rowFraction*colFraction;
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

function fieldComponents(mask:boolean[][],values:number[][]){
 const rows=mask.length,cols=mask[0]?.length||0,visited=Array.from({length:rows},()=>Array(cols).fill(false)),components:Array<{cells:GridPoint[];probability:number}>=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){if(!mask[row][col]||visited[row][col])continue;const queue=[{x:col,y:row}],cells:GridPoint[]=[];let probability=0;visited[row][col]=true;for(let cursor=0;cursor<queue.length;cursor++){const point=queue[cursor];cells.push(point);probability=Math.max(probability,finite(values[point.y]?.[point.x]));for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=point.x+dx,y=point.y+dy;if(y<0||y>=rows||x<0||x>=cols||visited[y][x]||!mask[y][x])continue;visited[y][x]=true;queue.push({x,y})}}if(cells.length>=MIN_REGION_FINE_CELLS)components.push({cells,probability})}
 return components;
}

function componentRings(component:{cells:GridPoint[]},globalWest:number,globalNorth:number,lonStep:number,latStep:number){
 const minX=Math.max(0,Math.min(...component.cells.map(point=>point.x))-1),maxX=Math.max(...component.cells.map(point=>point.x))+1,minY=Math.max(0,Math.min(...component.cells.map(point=>point.y))-1),maxY=Math.max(...component.cells.map(point=>point.y))+1,mask=Array.from({length:maxY-minY+1},()=>Array(maxX-minX+1).fill(false));
 for(const point of component.cells)mask[point.y-minY][point.x-minX]=true;
 return traceMask(mask,globalWest+minX*lonStep,globalNorth-minY*latStep,lonStep,latStep);
}

export function buildExtremeOutlookContours(areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid,options:ExtremeAreaContourOptions={}){
 const indexed=indexField(areas,grid);if(!indexed)return[];
 const explicitLevels=indexed.cells.some(area=>Array.isArray(area.probabilityLevels)),minimumProbability=Math.max(0,Math.min(100,finite(options.minimumProbability,40))),extremeMinimumProbability=Math.max(0,Math.min(minimumProbability,finite(options.extremeMinimumProbability,5))),maximumProbability=Math.max(minimumProbability,Math.min(101,finite(options.maximumProbability,101))),coverage=Array.from({length:indexed.rows},()=>Array(indexed.cols).fill(0));
 for(const cell of indexed.cells)coverage[cell.row][cell.col]=1;
 const subdivisions=FIELD_SUBDIVISIONS,fineRows=(indexed.rows+FIELD_PADDING_STEPS*2)*subdivisions,fineCols=(indexed.cols+FIELD_PADDING_STEPS*2)*subdivisions,fineLatStep=grid.latStep/subdivisions,fineLonStep=grid.lonStep/subdivisions,globalNorth=indexed.north+FIELD_PADDING_STEPS*grid.latStep,globalWest=indexed.west-FIELD_PADDING_STEPS*grid.lonStep,contours:ExtremeAreaContour[]=[];
 for(const level of[1,2,3,4] as const){
  const threshold=level===4?extremeMinimumProbability:minimumProbability,nodeValues=Array.from({length:indexed.rows},()=>Array(indexed.cols).fill(0));
  for(const cell of indexed.cells)nodeValues[cell.row][cell.col]=probabilityForLevel(cell,level,explicitLevels);
  if(!indexed.cells.some(cell=>probabilityForLevel(cell,level,explicitLevels)>=threshold))continue;
  const values=Array.from({length:fineRows},()=>Array(fineCols).fill(0)),mask=Array.from({length:fineRows},()=>Array(fineCols).fill(false));
  for(let row=0;row<fineRows;row++)for(let col=0;col<fineCols;col++){const fieldRow=-FIELD_PADDING_STEPS+(row+.5)/subdivisions,fieldCol=-FIELD_PADDING_STEPS+(col+.5)/subdivisions,coverageValue=bilinear(coverage,fieldRow,fieldCol);if(coverageValue<COVERAGE_THRESHOLD)continue;const probability=bilinear(nodeValues,fieldRow,fieldCol)/coverageValue;values[row][col]=probability;mask[row][col]=probability>=threshold&&probability<maximumProbability}
  for(const component of fieldComponents(mask,values)){const rings=componentRings(component,globalWest,globalNorth,fineLonStep,fineLatStep);if(!rings.length)continue;const roundedProbability=Math.min(100,Math.round(component.probability/5)*5),probability=Math.max(threshold,maximumProbability<101?Math.min(maximumProbability-1,roundedProbability):roundedProbability),color=options.colors?.[level]||DEFAULT_COLORS[level];contours.push({intensity:level,color,probability,opacity:Math.max(.34,Math.min(.7,probabilityOpacity(probability)-.04)),rings})}
 }
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

export function drawExtremeOutlookAreas(map:ExtremeAreaProjection,canvas:HTMLCanvasElement,areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid,options:ExtremeAreaContourOptions={}){drawExtremeOutlookContours(map,canvas,buildExtremeOutlookContours(areas,grid,options))}
