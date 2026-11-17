/**
 * MID Karten 1.16: presentation-only CanvasOverlay crossfade admission.
 * Avoid allocating and cloning a second full-resolution canvas whenever
 * reduced motion, a backgrounded tab, Data Saver or large textures make
 * a cosmetic fade more expensive than an immediate update.
 *
 * This does NOT change original meteorological pixels, raster interpolation,
 * published source TIME, map rendering validity or official warnings.
 */
export const MAP_CANVAS_CROSSFADE_MAX_PIXELS=1_048_576;
export type MapCanvasCrossfadeContext={
 width:number;
 height:number;
 visible:boolean;
 reducedMotion:boolean;
 saveData:boolean;
};
export function shouldCrossfadeMapCanvas(context:MapCanvasCrossfadeContext):boolean{
 const {width,height,visible,reducedMotion,saveData}=context;
 return visible&&!reducedMotion&&!saveData&&
  Number.isSafeInteger(width)&&Number.isSafeInteger(height)&&
  width>0&&height>0&&
  width<=MAP_CANVAS_CROSSFADE_MAX_PIXELS/height;
}

/** The cloned image may exceed the overlay's initial 300x150 bitmap.
 * MapLibre's canvas has already been sized for the actual renderer pixel ratio.
 * Use the larger dimensions in each axis to avoid under-budgeting copies.
 * No guessing from CSS dimensions or a potentially different DPR override.
 * Return undefined (not 300x150) if the renderer is not measured yet.
 */
export type MapCanvasBackingSize={width:number;height:number};
export function mapCanvasCrossfadeBackingSize(
 overlay:MapCanvasBackingSize|undefined,
 renderer:MapCanvasBackingSize|undefined,
):MapCanvasBackingSize|undefined{
 if(!overlay||!renderer)return undefined;
 const values=[overlay.width,overlay.height,renderer.width,renderer.height];
 if(!values.every(v=>Number.isSafeInteger(v)&&v>0))return undefined;
 return {width:Math.max(overlay.width,renderer.width),
  height:Math.max(overlay.height,renderer.height)};
}

/** A staged crossfade is a transaction. If the draw or transition setup
 * throws, the temporary copy must not remain in the DOM as stale weather.
 * Preserve the original exception for the caller's map error boundary.
 */
export function withCanvasFadeRollback<T>(attempt:()=>T,rollback:()=>void):T{
 try{return attempt()}
 catch(error){
  try{rollback()}catch{/* Preserve the primary rendering failure. */}
  throw error;
 }
}

/**
 * MID-Karten: map event redraws are presentation work, not source refreshes.
 * MapLibre can emit many 'render' events while the document is hidden.
 * Coalesce them into a single fresh redraw on return instead of retaining a
 * stale RAF that background throttling may postpone indefinitely.
 * No weather value, observation TIME, model run or NoData is mutated here.
 */
export function createMapCanvasRedrawScheduler(
 draw:()=>void,
 requestFrame:(callback:()=>void)=>number,
 cancelFrame:(handle:number)=>void,
 isVisible:()=>boolean,
){
 let pending:number|null=null,dirty=false,disposed=false,generation=0;
 const cancel=()=>{
  ++generation;
  if(pending!==null){cancelFrame(pending);pending=null}
 };
 const schedule=()=>{
  if(disposed||!dirty||pending!==null||!isVisible())return;
  const current=++generation;
  pending=requestFrame(()=>{
   if(disposed||generation!==current)return;
   pending=null;
   if(!isVisible())return; // Keep dirty; resume draws the CURRENT image.
   if(!dirty)return;
   dirty=false;
   draw();
  });
 };
 const request=()=>{
  if(disposed)return;
  dirty=true;
  schedule();
 };
 const visibilityChange=(visible:boolean)=>{
  if(disposed)return;
  if(!visible){cancel();dirty=true;return}
  // Redraw on return even if no map event fired while hidden.
  request();
 };
 const dispose=()=>{disposed=true;cancel();dirty=false};
 return {request,visibilityChange,dispose};
}
