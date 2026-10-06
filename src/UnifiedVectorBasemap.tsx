import {useEffect,useMemo} from 'react';
import {VectorTileLayers,useMidMap,type MidVectorTileLayer} from './MapLibreCore';
import {openFreeMapGlyphProxy,openFreeMapVectorTileProxy} from './CompositeData';
import {browserExternalWeatherFallbackAllowed} from './workerClient';
/** Quiet vector geography below all weather; labels/boundaries are separately above it. */
export default function UnifiedVectorBasemap({dark=false}:{dark?:boolean}){
 const map=useMidMap();
 useEffect(()=>{if(map?.getLayer('mid-map-background'))map.setPaintProperty('mid-map-background','background-color',dark?'#26343f':'#e9eef0')},[map,dark]);
 const layers=useMemo<MidVectorTileLayer[]>(()=>[
  {id:'land',type:'fill',sourceLayer:'landcover',paint:{'fill-color':dark?'#263842':'#e9eef0','fill-opacity':.7}},
  {id:'water',type:'fill',sourceLayer:'water',paint:{'fill-color':dark?'#132a39':'#c9e1ec','fill-opacity':1}},
  {id:'waterways',type:'line',sourceLayer:'waterway',minzoom:6,paint:{'line-color':dark?'#385b6c':'#9dc6d9','line-width':['interpolate',['linear'],['zoom'],6,.4,12,1.8]}},
  {id:'roads',type:'line',sourceLayer:'transportation',minzoom:6,filter:['match',['get','class'],['motorway','trunk','primary','secondary'],true,false],paint:{'line-color':dark?'#53636c':'#c2ccd2','line-width':['interpolate',['linear'],['zoom'],6,.45,12,1.3],'line-opacity':.65}}
 ],[dark]);
 const direct=browserExternalWeatherFallbackAllowed(),url=openFreeMapVectorTileProxy()||(direct?'https://tiles.openfreemap.org/planet/latest/{z}/{x}/{y}.pbf':''),glyphsUrl=openFreeMapGlyphProxy()||(direct?'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf':'');
 return <VectorTileLayers id="unified-vector-base" url={url} glyphsUrl={glyphsUrl} layers={layers} zIndex={100}/>;
}
