export type ExtremeAreaPaintCell={lat:number;lon:number;color:string;opacity:number};
export type ExtremeAreaCanvasGrid={latStep:number;lonStep:number};
export type ExtremeAreaProjection={getCanvas:()=>{clientWidth:number;clientHeight:number};project:(coordinate:[number,number])=>{x:number;y:number}};

function rgba(hex:string,alpha:number){const value=hex.replace('#',''),expanded=value.length===3?value.split('').map(character=>character+character).join(''):value,number=Number.parseInt(expanded,16);if(!Number.isFinite(number))return`rgba(38,155,131,${alpha})`;return`rgba(${number>>16&255},${number>>8&255},${number&255},${alpha})`}
function traceCell(context:CanvasRenderingContext2D,map:ExtremeAreaProjection,cell:ExtremeAreaPaintCell,grid:ExtremeAreaCanvasGrid){const halfLat=grid.latStep*.515,halfLon=grid.lonStep*.515,corners=[[cell.lon-halfLon,cell.lat-halfLat],[cell.lon+halfLon,cell.lat-halfLat],[cell.lon+halfLon,cell.lat+halfLat],[cell.lon-halfLon,cell.lat+halfLat]] as Array<[number,number]>,points=corners.map(coordinate=>map.project(coordinate));context.beginPath();points.forEach((point,index)=>index?context.lineTo(point.x,point.y):context.moveTo(point.x,point.y));context.closePath()}

export function drawExtremeOutlookAreas(map:ExtremeAreaProjection,canvas:HTMLCanvasElement,areas:ExtremeAreaPaintCell[],grid:ExtremeAreaCanvasGrid){
 const mapCanvas=map.getCanvas(),width=Math.max(0,mapCanvas.clientWidth),height=Math.max(0,mapCanvas.clientHeight);if(!width||!height)return;
 const ratio=Math.max(1,Math.min(2,globalThis.devicePixelRatio||1)),pixelWidth=Math.round(width*ratio),pixelHeight=Math.round(height*ratio);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`}
 const context=canvas.getContext('2d');if(!context)return;context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);context.lineJoin='round';context.lineCap='round';
 for(const area of areas){traceCell(context,map,area,grid);context.fillStyle=rgba(area.color,area.opacity);context.fill()}
 for(const area of areas){traceCell(context,map,area,grid);context.strokeStyle=rgba(area.color,.96);context.lineWidth=1.35;context.stroke()}
}
