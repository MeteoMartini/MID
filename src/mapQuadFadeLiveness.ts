/**
 * MID-Karten 1.15: bounded liveness cleanup for MapLibre image layers.
 * An image target layer can disappear after a style rebuild during a fade.
 * Leaving the active fade flag set makes subsequent installs poll endlessly.
 * Used only on confirmed renderer-layer loss; never on normal frame transitions.
 * No requests, weather data, TIME, coverage, or official warning semantics.
 */
export type QuadFadeMutable<T> = {current:T};
export type AbandonedQuadFade={abandoned:boolean;disposedFrames:number;failedDisposals:number};

/** Idempotent O(n) release; caller owns frame disposal and error UI. */
export function abandonMissingQuadFade<TFrame>(
 fading:QuadFadeMutable<boolean>,
 frames:QuadFadeMutable<TFrame[]>,
 disposeFrame:(frame:TFrame)=>void
):AbandonedQuadFade{
 if(!fading.current)return{abandoned:false,disposedFrames:0,failedDisposals:0};
 // Clear the wait state first so disposal exceptions cannot strand the UI.
 fading.current=false;
 const abandoned=frames.current;
 frames.current=[];
 let disposedFrames=0,failedDisposals=0;
 for(const frame of abandoned){
  try{disposeFrame(frame);disposedFrames++}
  catch{failedDisposals++}
 }
 return{abandoned:true,disposedFrames,failedDisposals};
}
