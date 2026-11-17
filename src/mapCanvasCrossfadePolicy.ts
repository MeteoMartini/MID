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
