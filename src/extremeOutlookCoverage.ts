import domain from './extremeOutlookCoverage.generated.json';

// Same rotated ICON-D2 domain used by the outlook analysis. A bounding box
// would incorrectly leave its curved corners unshaded. Never derive coverage
// from hazard signals or temporarily missing forecast cells.
// Screen-space mask avoids dependence on a GeoJSON worker and repaints while
// panning/zooming. The viewport rectangle with the domain as an even-odd hole
// also remains correct when the map repeats across the antimeridian.
export function drawExtremeOutlookOutsideCoverage(map:{getCanvas:()=>{clientWidth:number;clientHeight:number};project:(position:[number,number])=>{x:number;y:number};getCenter:()=>{lng:number}},canvas:HTMLCanvasElement){
 const {clientWidth:width,clientHeight:height}=map.getCanvas();if(!width||!height)return;
 const ratio=Math.max(1,Math.min(2,globalThis.devicePixelRatio||1));
 const w=Math.round(width*ratio),h=Math.round(height*ratio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`}
 const context=canvas.getContext('2d');if(!context)return;
 context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);context.beginPath();context.rect(0,0,width,height);
 const center=map.getCenter().lng,world=Math.round(center/360);
 for(const offset of [world-1,world,world+1]){
  domain.forEach((point,index)=>{const projected=map.project([point[0]+offset*360,point[1]]);if(index===0)context.moveTo(projected.x,projected.y);else context.lineTo(projected.x,projected.y)});context.closePath();
 }
 context.fillStyle='rgba(16,25,35,.84)';context.fill('evenodd');
}
