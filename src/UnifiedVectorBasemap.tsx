import {useEffect,useMemo} from 'react';
import {VectorTileLayers,useMidMap,type MidVectorTileLayer} from './MapLibreCore';
import {openFreeMapGlyphProxy,openFreeMapVectorTileProxy} from './CompositeData';
import {browserExternalWeatherFallbackAllowed} from './workerClient';
import {PSEUDO_SAT_BASEMAP} from './pseudoSatelliteBasemap';
/** Quiet vector geography below all weather; labels/boundaries are separately above it. */
export default function UnifiedVectorBasemap({dark=false,cloudContrast=false,zIndex=100}:{dark?:boolean;cloudContrast?:boolean;zIndex?:number}){
 const pseudoClouds=cloudContrast;
 const map=useMidMap();
 // Background = land; vector water polygons cover seas and lakes. Landcover is vegetation etc., not a land mask.
 useEffect(()=>{if(map?.getLayer('mid-map-background'))map.setPaintProperty('mid-map-background','background-color',pseudoClouds?PSEUDO_SAT_BASEMAP.land:dark?'#26343f':'#e9eef0')},[map,dark,pseudoClouds]);
 const layers=useMemo<MidVectorTileLayer[]>(()=>[
  {id:'land',type:'fill',sourceLayer:'landcover',paint:{'fill-color':pseudoClouds?PSEUDO_SAT_BASEMAP.landcover:dark?'#263842':'#e9eef0','fill-opacity':pseudoClouds?.35:.7}},
  {id:'water',type:'fill',sourceLayer:'water',paint:{'fill-color':pseudoClouds?PSEUDO_SAT_BASEMAP.water:dark?'#132a39':'#c9e1ec','fill-opacity':1}}
 ],[dark,pseudoClouds]);
 const direct=browserExternalWeatherFallbackAllowed(),url=openFreeMapVectorTileProxy()||(direct?'https://tiles.openfreemap.org/planet/latest/{z}/{x}/{y}.pbf':''),glyphsUrl=openFreeMapGlyphProxy()||(direct?'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf':'');
 return <VectorTileLayers id="unified-vector-base" url={url} glyphsUrl={glyphsUrl} layers={layers} zIndex={zIndex}/>;
}
