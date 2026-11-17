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
