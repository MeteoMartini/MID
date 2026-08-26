import {Fragment,memo,useEffect,useMemo} from 'react';
import {HtmlMarker,registerMapLayerOrder,unregisterMapLayerOrder,useMidMap} from './MapLibreCore';
import {buildExtremeOutlookContours,type ExtremeAreaContour} from './extremeOutlookAreaCanvas';
import {buildExtremeOutlookContourGeoJson} from './extremeOutlookAreaGeoJson';
import {EXTREME_INTENSITY_COLORS,extremeProbabilityLevelsForCell,type ExtremeHazardId,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

const SOURCE_ID='extreme-outlook-contours-source';
const HATCH_SOURCE_ID='extreme-outlook-hatch-source';
const LAYER_IDS=['extreme-outlook-contours-fill','extreme-outlook-contours-hatch','extreme-outlook-contours-casing','extreme-outlook-contours-outline'] as const;
const HATCH_IMAGE_ID='extreme-outlook-probability-hatch';

type ContourLabel={latitude:number;longitude:number;intensity:ExtremeAreaContour['intensity'];probability:number};

function ringArea(ring:ExtremeAreaContour['rings'][number]){let area=0;for(let index=0;index<ring.length;index++){const point=ring[index],next=ring[(index+1)%ring.length];area+=point.lon*next.lat-next.lon*point.lat}return area/2}
function ringCenter(ring:ExtremeAreaContour['rings'][number]){const area=ringArea(ring);if(Math.abs(area)<1e-9){const count=Math.max(1,ring.length);return{lon:ring.reduce((sum,point)=>sum+point.lon,0)/count,lat:ring.reduce((sum,point)=>sum+point.lat,0)/count}}let lon=0,lat=0;for(let index=0;index<ring.length;index++){const point=ring[index],next=ring[(index+1)%ring.length],cross=point.lon*next.lat-next.lon*point.lat;lon+=(point.lon+next.lon)*cross;lat+=(point.lat+next.lat)*cross}return{lon:lon/(6*area),lat:lat/(6*area)}}
function pointInRing(point:{lon:number;lat:number},ring:ExtremeAreaContour['rings'][number]){let inside=false;for(let index=0,last=ring.length-1;index<ring.length;last=index++){const a=ring[index],b=ring[last],intersects=(a.lat>point.lat)!==(b.lat>point.lat)&&point.lon<(b.lon-a.lon)*(point.lat-a.lat)/((b.lat-a.lat)||1e-9)+a.lon;if(intersects)inside=!inside}return inside}
function contourCenter(contour:ExtremeAreaContour){const outer=[...contour.rings].sort((a,b)=>Math.abs(ringArea(b))-Math.abs(ringArea(a)))[0];return outer?ringCenter(outer):{lon:0,lat:0}}
function contourContains(contour:ExtremeAreaContour,point:{lon:number;lat:number}){return contour.rings.reduce((inside,ring)=>pointInRing(point,ring)?!inside:inside,false)}
export function extremeOutlookContourLabels(contours:ExtremeAreaContour[]):ContourLabel[]{
 const selected:ExtremeAreaContour[]=[];
 for(const contour of [...contours].sort((a,b)=>b.intensity-a.intensity||b.probability-a.probability)){
  const center=contourCenter(contour),overlapsStronger=selected.some(stronger=>stronger.intensity>contour.intensity&&(contourContains(stronger,center)||contourContains(contour,contourCenter(stronger))));
  if(!overlapsStronger)selected.push(contour);
 }
 return selected.map(contour=>{const center=contourCenter(contour);return{latitude:center.lat,longitude:center.lon,intensity:contour.intensity,probability:contour.probability}});
}

function hatchImage(){
 const size=8,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x+y)%8<=1){const offset=(y*size+x)*4;data[offset]=255;data[offset+1]=255;data[offset+2]=255;data[offset+3]=185}
 return{width:size,height:size,data};
}

function ExtremeOutlookAreaOverlay({data,periodId,hazard}:{data:ExtremeWeatherOutlook;periodId:string;hazard:ExtremeHazardId}){
 const map=useMidMap(),paintAreas=useMemo(()=>data.cells.map(cell=>({row:cell.row,col:cell.col,lat:cell.lat,lon:cell.lon,probabilityLevels:extremeProbabilityLevelsForCell(cell,periodId,hazard)})),[data,periodId,hazard]);
 const minimumProbability=hazard==='overall'?data.thresholds.probability.overviewMin:data.thresholds.probability.hazardMin;
 const contours=useMemo(()=>buildExtremeOutlookContours(paintAreas,data.grid,{minimumProbability,extremeMinimumProbability:data.thresholds.probability.extremeExceptionMin,colors:EXTREME_INTENSITY_COLORS}),[paintAreas,data.grid,minimumProbability,data.thresholds.probability.extremeExceptionMin]);
 const hatchContours=useMemo(()=>buildExtremeOutlookContours(paintAreas,data.grid,{minimumProbability,extremeMinimumProbability:data.thresholds.probability.extremeExceptionMin,maximumProbability:60,colors:EXTREME_INTENSITY_COLORS}),[paintAreas,data.grid,minimumProbability,data.thresholds.probability.extremeExceptionMin]);
 const geojson=useMemo(()=>buildExtremeOutlookContourGeoJson(contours),[contours]);
 const hatchGeojson=useMemo(()=>buildExtremeOutlookContourGeoJson(hatchContours),[hatchContours]);
 const labels=useMemo(()=>extremeOutlookContourLabels(contours),[contours]);
 useEffect(()=>{if(!map)return;try{
  if(!map.hasImage(HATCH_IMAGE_ID))map.addImage(HATCH_IMAGE_ID,hatchImage(),{pixelRatio:1});
  if(map.getSource(SOURCE_ID))(map.getSource(SOURCE_ID) as any).setData(geojson);else map.addSource(SOURCE_ID,{type:'geojson',data:geojson});
  if(map.getSource(HATCH_SOURCE_ID))(map.getSource(HATCH_SOURCE_ID) as any).setData(hatchGeojson);else map.addSource(HATCH_SOURCE_ID,{type:'geojson',data:hatchGeojson});
  const layers:any[]=[
   {id:LAYER_IDS[0],type:'fill',source:SOURCE_ID,paint:{'fill-color':['get','color'],'fill-opacity':['get','opacity']}},
   {id:LAYER_IDS[1],type:'fill',source:HATCH_SOURCE_ID,paint:{'fill-pattern':HATCH_IMAGE_ID,'fill-opacity':.68}},
   {id:LAYER_IDS[2],type:'line',source:SOURCE_ID,paint:{'line-color':'rgba(255,255,255,.82)','line-width':3.4}},
   {id:LAYER_IDS[3],type:'line',source:SOURCE_ID,paint:{'line-color':['get','color'],'line-width':1.45}}
  ];
  layers.forEach((layer,index)=>{if(map.getLayer(layer.id))map.removeLayer(layer.id);map.addLayer(layer);registerMapLayerOrder(map,layer.id,8+index/100)});
 }catch{}
 return()=>{try{for(const id of [...LAYER_IDS].reverse()){unregisterMapLayerOrder(map,id);if(map.getLayer(id))map.removeLayer(id)}if(map.getSource(HATCH_SOURCE_ID))map.removeSource(HATCH_SOURCE_ID);if(map.getSource(SOURCE_ID))map.removeSource(SOURCE_ID)}catch{}}},[map,geojson,hatchGeojson]);
 return <Fragment>{labels.map((label,index)=><HtmlMarker key={`${periodId}:${hazard}:field:${index}:${label.intensity}:${label.probability}`} latitude={label.latitude} longitude={label.longitude} className="extreme-map-label" anchor="center" html={`<span style="background:${EXTREME_INTENSITY_COLORS[label.intensity]};color:${label.intensity<=2?'#17202a':'#ffffff'}"><b>I${label.intensity}</b><small>${label.probability}%</small></span>`} popupHtml={`<strong>Modellierte Gefahrenfläche</strong><br/>I${label.intensity} · <b>${label.probability} %</b>`} zIndex={35}/>)}</Fragment>;
}

export default memo(ExtremeOutlookAreaOverlay);
