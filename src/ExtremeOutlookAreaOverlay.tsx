import {memo,useEffect,useMemo} from 'react';
import {registerMapLayerOrder,unregisterMapLayerOrder,useMidMap} from './MapLibreCore';
import {buildExtremeOutlookContours} from './extremeOutlookAreaCanvas';
import {EXTREME_INTENSITY_COLORS,extremeProbabilityLevelsForCell,type ExtremeHazardId,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

const SOURCE_ID='extreme-outlook-contours-source';
const LAYER_IDS=['extreme-outlook-contours-fill','extreme-outlook-contours-hatch','extreme-outlook-contours-casing','extreme-outlook-contours-outline'] as const;
const HATCH_IMAGE_ID='extreme-outlook-probability-hatch';

function hatchImage(){
 const size=8,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x+y)%8<=1){const offset=(y*size+x)*4;data[offset]=255;data[offset+1]=255;data[offset+2]=255;data[offset+3]=185}
 return{width:size,height:size,data};
}

function contourGeoJson(contours:ReturnType<typeof buildExtremeOutlookContours>){return{type:'FeatureCollection',features:contours.map((contour,index)=>({type:'Feature',id:index,properties:{intensity:contour.intensity,color:contour.color,opacity:contour.opacity,probability:contour.probability},geometry:{type:'MultiPolygon',coordinates:contour.rings.map(ring=>[[...ring.map(point=>[point.lon,point.lat]),[ring[0].lon,ring[0].lat]]])}}))} as any}

function ExtremeOutlookAreaOverlay({data,periodId,hazard}:{data:ExtremeWeatherOutlook;periodId:string;hazard:ExtremeHazardId}){
 const map=useMidMap(),paintAreas=useMemo(()=>data.cells.map(cell=>({row:cell.row,col:cell.col,lat:cell.lat,lon:cell.lon,probabilityLevels:extremeProbabilityLevelsForCell(cell,periodId,hazard)})),[data,periodId,hazard]);
 const minimumProbability=hazard==='overall'?data.thresholds.probability.overviewMin:data.thresholds.probability.hazardMin;
 const contours=useMemo(()=>buildExtremeOutlookContours(paintAreas,data.grid,{minimumProbability,extremeMinimumProbability:data.thresholds.probability.extremeExceptionMin,colors:EXTREME_INTENSITY_COLORS}),[paintAreas,data.grid,minimumProbability,data.thresholds.probability.extremeExceptionMin]);
 const geojson=useMemo(()=>contourGeoJson(contours),[contours]);
 useEffect(()=>{if(!map||!contours.length)return;try{
  if(!map.hasImage(HATCH_IMAGE_ID))map.addImage(HATCH_IMAGE_ID,hatchImage(),{pixelRatio:1});
  if(map.getSource(SOURCE_ID))(map.getSource(SOURCE_ID) as any).setData(geojson);else map.addSource(SOURCE_ID,{type:'geojson',data:geojson});
  const layers:any[]=[
   {id:LAYER_IDS[0],type:'fill',source:SOURCE_ID,paint:{'fill-color':['get','color'],'fill-opacity':['get','opacity']}},
   {id:LAYER_IDS[1],type:'fill',source:SOURCE_ID,filter:['<',['get','probability'],60],paint:{'fill-pattern':HATCH_IMAGE_ID,'fill-opacity':.58}},
   {id:LAYER_IDS[2],type:'line',source:SOURCE_ID,paint:{'line-color':'rgba(255,255,255,.82)','line-width':3.4}},
   {id:LAYER_IDS[3],type:'line',source:SOURCE_ID,paint:{'line-color':['get','color'],'line-width':1.45}}
  ];
  layers.forEach((layer,index)=>{if(map.getLayer(layer.id))map.removeLayer(layer.id);map.addLayer(layer);registerMapLayerOrder(map,layer.id,8+index/100)});
 }catch{}
 return()=>{try{for(const id of [...LAYER_IDS].reverse()){unregisterMapLayerOrder(map,id);if(map.getLayer(id))map.removeLayer(id)}if(map.getSource(SOURCE_ID))map.removeSource(SOURCE_ID)}catch{}}},[map,geojson,contours.length]);
 return null;
}

export default memo(ExtremeOutlookAreaOverlay);
