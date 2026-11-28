type BoundsLike={south:number;west:number;north:number;east:number};
type CanvasEntry={canvas:HTMLCanvasElement;pixels:number};
const MAX_PROJECTED_CANVAS_ENTRIES=8;
const MAX_PROJECTED_CANVAS_PIXELS=4_500_000;
const projectedCanvasCache=new Map<string,CanvasEntry>();
let projectedCanvasPixels=0;

function removeProjectedCanvas(key:string){
 const entry=projectedCanvasCache.get(key);
 if(!entry)return;
 projectedCanvasPixels-=entry.pixels;projectedCanvasCache.delete(key);
}

export function projectedViewportCacheKey({frame,zoom,bounds,width,height,renderWidth,renderHeight}:{frame:string;zoom:number;bounds:BoundsLike;width:number;height:number;renderWidth:number;renderHeight:number}){
 return`${frame}|z${zoom}|${bounds.south.toFixed(5)},${bounds.west.toFixed(5)},${bounds.north.toFixed(5)},${bounds.east.toFixed(5)}|${width}x${height}|${renderWidth}x${renderHeight}`;
}

export function getProjectedCanvas(key:string):HTMLCanvasElement|null{
 const entry=projectedCanvasCache.get(key);if(!entry)return null;
 projectedCanvasCache.delete(key);projectedCanvasCache.set(key,entry);return entry.canvas;
}

export function setProjectedCanvas(key:string,source:HTMLCanvasElement){
 // The old entry must not survive a failed replacement under the same key.
 removeProjectedCanvas(key);
 const {width,height}=source,pixels=width*height;
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1||
    !Number.isSafeInteger(pixels)||pixels>MAX_PROJECTED_CANVAS_PIXELS)return;
 // Reserve capacity before allocating the optional copy, not afterwards.
 // Insertion order is LRU because every successful read moves the key to the end.
 while(projectedCanvasCache.size>=MAX_PROJECTED_CANVAS_ENTRIES||projectedCanvasPixels+pixels>MAX_PROJECTED_CANVAS_PIXELS){
  const oldest=projectedCanvasCache.keys().next();
  if(oldest.done)return;
  removeProjectedCanvas(oldest.value);
 }
 try{
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d',{alpha:true});if(!context)return;
  context.drawImage(source,0,0);
  projectedCanvasCache.set(key,{canvas,pixels});projectedCanvasPixels+=pixels;
 }catch{/* Optional cache allocation/copy failure must not invalidate the displayed raster. */}
}

export function projectedCanvasCacheStats(){return{entries:projectedCanvasCache.size,pixels:projectedCanvasPixels,maxEntries:MAX_PROJECTED_CANVAS_ENTRIES,maxPixels:MAX_PROJECTED_CANVAS_PIXELS}}
