type BoundsLike={south:number;west:number;north:number;east:number};
type CanvasEntry={canvas:HTMLCanvasElement;pixels:number;lastUsed:number};
const MAX_PROJECTED_CANVAS_ENTRIES=8;
const MAX_PROJECTED_CANVAS_PIXELS=4_500_000;
const projectedCanvasCache=new Map<string,CanvasEntry>();
let projectedCanvasPixels=0;

function trimProjectedCanvasCache(){
 while(projectedCanvasCache.size>MAX_PROJECTED_CANVAS_ENTRIES||projectedCanvasPixels>MAX_PROJECTED_CANVAS_PIXELS){
  const oldest=[...projectedCanvasCache.entries()].sort((a,b)=>a[1].lastUsed-b[1].lastUsed)[0];if(!oldest)break;
  projectedCanvasPixels-=oldest[1].pixels;projectedCanvasCache.delete(oldest[0]);
 }
}

export function projectedViewportCacheKey({frame,zoom,bounds,width,height,renderWidth,renderHeight}:{frame:string;zoom:number;bounds:BoundsLike;width:number;height:number;renderWidth:number;renderHeight:number}){
 return`${frame}|z${zoom}|${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)}|${width}x${height}|${renderWidth}x${renderHeight}`;
}

export function getProjectedCanvas(key:string):HTMLCanvasElement|null{
 const entry=projectedCanvasCache.get(key);if(!entry)return null;entry.lastUsed=Date.now();projectedCanvasCache.delete(key);projectedCanvasCache.set(key,entry);return entry.canvas;
}

export function setProjectedCanvas(key:string,source:HTMLCanvasElement){
 const existing=projectedCanvasCache.get(key);if(existing){projectedCanvasPixels-=existing.pixels;projectedCanvasCache.delete(key)}
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;const context=canvas.getContext('2d',{alpha:true});if(!context)return;context.drawImage(source,0,0);
 const pixels=canvas.width*canvas.height;projectedCanvasCache.set(key,{canvas,pixels,lastUsed:Date.now()});projectedCanvasPixels+=pixels;trimProjectedCanvasCache();
}

export function projectedCanvasCacheStats(){return{entries:projectedCanvasCache.size,pixels:projectedCanvasPixels,maxEntries:MAX_PROJECTED_CANVAS_ENTRIES,maxPixels:MAX_PROJECTED_CANVAS_PIXELS}}
