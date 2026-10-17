import {useEffect,useMemo} from 'react';
import {VectorTileLayers,useMidMap,type MidVectorTileLayer} from './MapLibreCore';
import {openFreeMapGlyphProxy,openFreeMapVectorTileProxy} from './CompositeData';
import {browserExternalWeatherFallbackAllowed} from './workerClient';
/** Quiet vector geography below all weather; labels/boundaries are separately above it. */
export default function UnifiedVectorBasemap({dark=false,cloudContrast=false}:{dark?:boolean;cloudContrast?:boolean}){
 const pseudoLight=cloudContrast&&!dark;
 const map=useMidMap();
 useEffect(()=>{if(map?.getLayer('mid-map-background'))map.setPaintProperty('mid-map-background','background-color',dark?'#26343f':pseudoLight?'#8595a1':'#e9eef0')},[map,dark,pseudoLight]);
 const layers=useMemo<MidVectorTileLayer[]>(()=>[
  {id:'land',type:'fill',sourceLayer:'landcover',paint:{'fill-color':dark?'#263842':pseudoLight?'#8595a1':'#e9eef0','fill-opacity':.7}},
  {id:'water',type:'fill',sourceLayer:'water',paint:{'fill-color':dark?'#132a39':pseudoLight?'#718998':'#c9e1ec','fill-opacity':1}},

 ],[dark,pseudoLight]);
 const direct=browserExternalWeatherFallbackAllowed(),url=openFreeMapVectorTileProxy()||(direct?'https://tiles.openfreemap.org/planet/latest/{z}/{x}/{y}.pbf':''),glyphsUrl=openFreeMapGlyphProxy()||(direct?'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf':'');
 return <VectorTileLayers id="unified-vector-base" url={url} glyphsUrl={glyphsUrl} layers={layers} zIndex={100}/>;
}
