/**
 * Frame-coalesced MapLibre resize admission shared by the compact surroundings
 * map and the full weather map. Read layout only in RAF, never synchronously
 * inside ResizeObserver; skip unchanged CSS pixels + devicePixelRatio.
 *
 * The callback is a renderer resize only: it must not change map center/zoom,
 * raster frame, original source time, warnings or NoData state.
 */
export type MapDisplaySize={width:number;height:number;pixelRatio:number};

export function createMapResizeCoalescer(
 readSize:()=>MapDisplaySize,
 resize:()=>void,
 requestFrame:(callback:()=>void)=>number,
 cancelFrame:(id:number)=>void,
){
 let pending:number|null=null,disposed=false,lastWidth:number|null=null,
  lastHeight:number|null=null,lastDpr:number|null=null;
 const flush=()=>{
  pending=null;
  if(disposed)return;
  const {width,height,pixelRatio}=readSize();
  // A hidden/zero-sized container must not make WebGL allocate a tiny
  // surface or poison the last valid geometry. Re-observe on its next layout.
  if(![width,height,pixelRatio].every(Number.isFinite)||
     width<=0||height<=0||pixelRatio<=0)return;
  if(width===lastWidth&&height===lastHeight&&pixelRatio===lastDpr)return;
  // Record only after the actual renderer accepted the updated dimensions.
  resize();
  lastWidth=width;lastHeight=height;lastDpr=pixelRatio;
 };
 return {
  schedule:()=>{
   if(disposed||pending!==null)return;
   pending=requestFrame(flush);
  },
  dispose:()=>{
   disposed=true;
   if(pending!==null){cancelFrame(pending);pending=null}
  }
 };
}
