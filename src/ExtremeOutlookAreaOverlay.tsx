import {Fragment,memo,useCallback,useEffect,useMemo,useState} from 'react';
import {CanvasOverlay,HtmlMarker,registerMapLayerOrder,unregisterMapLayerOrder,useMidMap,type MidMap} from './MapLibreCore';
import {drawExtremeOutlookContours} from './extremeOutlookAreaCanvas';
import {requiresExtremeOutlookCanvasFallback} from './extremeOutlookRenderHealth';
import {buildExtremeOutlookContourGeoJson} from './extremeOutlookAreaGeoJson';
import {buildExtremeOutlookContourSet} from './extremeOutlookModelledAreas';
import {EXTREME_HAZARDS,EXTREME_INTENSITY_COLORS,type ExtremeHazardId,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

const SOURCE_ID='extreme-outlook-contours-source';
const HATCH_SOURCE_ID='extreme-outlook-hatch-source';
const LAYER_IDS=['extreme-outlook-contours-fill','extreme-outlook-contours-hatch','extreme-outlook-contours-casing','extreme-outlook-contours-outline'] as const;
const HATCH_IMAGE_ID='extreme-outlook-probability-hatch';
function escapeHtml(value:unknown){return String(value??'').replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]||character))}
function hazardLabel(hazard:Exclude<ExtremeHazardId,'overall'>){return EXTREME_HAZARDS.find(item=>item.id===hazard)?.label??hazard}

function hatchImage(){
 const size=8,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x+y)%8<=1){const offset=(y*size+x)*4;data[offset]=255;data[offset+1]=255;data[offset+2]=255;data[offset+3]=185}
 return{width:size,height:size,data};
}

function ExtremeOutlookAreaOverlay({data,periodId,hazard}:{data:ExtremeWeatherOutlook;periodId:string;hazard:ExtremeHazardId}){
 const map=useMidMap(),contourSet=useMemo(()=>buildExtremeOutlookContourSet(data,periodId,hazard),[data,periodId,hazard]),{contours,hatchContours,areas}=contourSet;
 const geojson=useMemo(()=>buildExtremeOutlookContourGeoJson(contours),[contours]);
 const hatchGeojson=useMemo(()=>buildExtremeOutlookContourGeoJson(hatchContours),[hatchContours]);

 const [fallback,setFallback]=useState(false);
 const drawFallback=useCallback((activeMap:MidMap,canvas:HTMLCanvasElement)=>drawExtremeOutlookContours(activeMap,canvas,contours),[contours]);
 useEffect(()=>{
  if(!map)return;
  let active=true;
  let watchdog:ReturnType<typeof setTimeout>|undefined;
  const errorHandler=(event:{sourceId?:string;error?:{message?:string}})=>{
   const message=String(event.error?.message??'');
   if(event.sourceId===SOURCE_ID||event.sourceId===HATCH_SOURCE_ID||/geojson.{0,60}worker|worker.{0,60}geojson/i.test(message))setFallback(true);
  };
  const nativeVisible=()=>{
   if(!contours.length)return true;
   const polygonCount=geojson.features.filter(feature=>feature.geometry.coordinates.some(polygon=>polygon.some(ring=>ring.length>=4))).length;
   const hasFillLayer=Boolean(map.getLayer(LAYER_IDS[0]));
   const hasSource=Boolean(map.getSource(SOURCE_ID));
   const sourceLoaded=hasSource&&map.isSourceLoaded(SOURCE_ID);
   const mapCanvas=map.getCanvas();
   const labelInView=areas.some(area=>{
    const point=map.project([area.longitude,area.latitude]);
    return Number.isFinite(point.x)&&Number.isFinite(point.y)&&point.x>=0&&point.y>=0&&point.x<=mapCanvas.clientWidth&&point.y<=mapCanvas.clientHeight;
   });
   const renderedFeatureCount=hasFillLayer&&sourceLoaded&&labelInView?map.queryRenderedFeatures({layers:[LAYER_IDS[0]]}).length:0;
   return !requiresExtremeOutlookCanvasFallback({contourCount:contours.length,polygonCount,hasFillLayer,hasSource,sourceLoaded,labelInView,renderedFeatureCount});
  };
  const verify=()=>{
   if(!active)return;
   try{setFallback(!nativeVisible())}catch{setFallback(contours.length>0)}
  };
  map.on('error',errorHandler);
  map.on('idle',verify);
  try{
   if(!map.hasImage(HATCH_IMAGE_ID))map.addImage(HATCH_IMAGE_ID,hatchImage(),{pixelRatio:1});
   if(map.getSource(SOURCE_ID))(map.getSource(SOURCE_ID) as any).setData(geojson);else map.addSource(SOURCE_ID,{type:'geojson',data:geojson});
   if(map.getSource(HATCH_SOURCE_ID))(map.getSource(HATCH_SOURCE_ID) as any).setData(hatchGeojson);else map.addSource(HATCH_SOURCE_ID,{type:'geojson',data:hatchGeojson});
   const layers:any[]=[
    {id:LAYER_IDS[0],type:'fill',source:SOURCE_ID,paint:{'fill-color':['get','color'],'fill-opacity':['min',.66,['*',['get','opacity'],.86]]}},
    {id:LAYER_IDS[1],type:'fill',source:HATCH_SOURCE_ID,paint:{'fill-pattern':HATCH_IMAGE_ID,'fill-opacity':.58}},
    {id:LAYER_IDS[2],type:'line',source:SOURCE_ID,paint:{'line-color':'rgba(255,255,255,.9)','line-width':3.4}},
    {id:LAYER_IDS[3],type:'line',source:SOURCE_ID,paint:{'line-color':['get','color'],'line-width':1.45}}
   ];
   layers.forEach((layer,index)=>{if(map.getLayer(layer.id))map.removeLayer(layer.id);map.addLayer(layer);registerMapLayerOrder(map,layer.id,8+index/100)});
   if(!contours.length)setFallback(false);
   else watchdog=setTimeout(verify,3500);
  }catch{
   if(contours.length)setFallback(true);
  }
  return()=>{
   active=false;
   if(watchdog!==undefined)clearTimeout(watchdog);
   map.off('idle',verify);
   map.off('error',errorHandler);
   try{
    for(const id of [...LAYER_IDS].reverse()){unregisterMapLayerOrder(map,id);if(map.getLayer(id))map.removeLayer(id)}
    if(map.getSource(HATCH_SOURCE_ID))map.removeSource(HATCH_SOURCE_ID);
    if(map.getSource(SOURCE_ID))map.removeSource(SOURCE_ID);
   }catch{}
  };
 },[map,geojson,hatchGeojson,contours,areas]);

 return <Fragment>{fallback&&contours.length>0?<CanvasOverlay id="extreme-outlook-native-fallback" zIndex={12} events={['render','resize','moveend','zoomend']} render={drawFallback}/>:null}{fallback&&contours.length>0?<div className="extreme-map-layer-fallback-status" role="status">Gefahrenflächen: georeferenzierte Ersatzdarstellung · native Kartenebene vorübergehend nicht verfügbar</div>:null}{areas.map(area=><HtmlMarker key={area.id} latitude={area.latitude} longitude={area.longitude} className="extreme-map-label" anchor="center" html={`<span style="background:${EXTREME_INTENSITY_COLORS[area.intensity]};color:${area.intensity<=2?'#17202a':'#ffffff'}"><b>I${area.intensity}</b><small>${area.probability}%</small></span>`} popupHtml={`<strong>${escapeHtml(area.region)}</strong><br/>${escapeHtml(hazardLabel(area.signal.hazard))}<br/>I${area.intensity} · <b>${area.probability} %</b>`} zIndex={35}/>)}</Fragment>;
}

export default memo(ExtremeOutlookAreaOverlay);
