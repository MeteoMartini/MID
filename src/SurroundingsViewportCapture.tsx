import {useEffect,useRef} from 'react';
import {useMidMap} from './MapLibreCore';
import {observeSurroundingsViewportRaster} from './surroundingsViewportObserver';
import type {SurroundingsRasterPlan} from './surroundingsViewportRaster';

/** Mount only inside MidMapLibre, after the initial MapFitBounds child.
 * A future integration can use the plan for WMS, OPERA and ImageQuadLayer in
 * one place. This component intentionally renders no source and no imagery.
 */
export default function SurroundingsViewportCapture({onChange,overscanPixels=12}:{
 onChange:(plan:SurroundingsRasterPlan|undefined)=>void;
 overscanPixels?:number;
}){
 const map=useMidMap(),changeRef=useRef(onChange);
 changeRef.current=onChange;
 useEffect(()=>{
  if(!map)return;
  return observeSurroundingsViewportRaster(map,plan=>changeRef.current(plan),{overscanPixels});
 },[map,overscanPixels]);
 return null;
}