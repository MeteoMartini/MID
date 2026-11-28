/** Shared native Overview presentation preparation (QA only).
 * Hourly precipitation amount and endpoint WW stay independent.
 * Contour segments are preserved or explicitly omitted on incomplete shared masks;
 * no synthetic smoothing. Named locations only; bounded symbol inventory.
 */
import {nativeOverviewCell,nativeOverviewCellValid,nativeOverviewRaster,type NativeOverviewFrame} from './nativeOverviewFrame';
import {WMO_PRECIP_TYPE,compactPrecipitationTypeLabel} from './precipitation';
import {modelMapValue} from './modelMapUnits';
import {nativeIsobarFeatures} from './unifiedMapPresentation';
import {adaptiveContourLayers} from './adaptiveModelContours';
import type {TemporalMapFrameData,TemporalMapGroup} from './TemporalMapFrame';
export type OverviewVariant='overview'|'winter-overview';
export type OverviewPlace={name:string;latitude:number;longitude:number};
export function overviewEndpointWeather(code:number){
 if(!Number.isInteger(code)||code<0||code>99)return null;
 const type=WMO_PRECIP_TYPE[code];
 if(code===98)return {label:'Gewitter mit Staub-/Sandsturm',phase:'unbestimmt',code,winter:false};
 if(code===95||code===97)return {label:'Gewitter · Niederschlagsphase unbestimmt',phase:'unbestimmt',code,winter:false};
 if(code===96||code===99)return {label:'Gewitter · Graupel/Hagel',phase:'Graupel/Hagel',code,winter:true};
 if(code===93||code===94)return {label:'Schnee/Schneeregen/Hagel nach Gewitter',phase:'unbestimmt',code,winter:true};
 if(code===91||code===92)return {label:'Regenschauer nach Gewitter',phase:'Regen',code,winter:false};
 if(type){
  const label=compactPrecipitationTypeLabel(type);
  return {label,phase:label,code,winter:!['drizzle','rain','showers','none','thunderstorm'].includes(type)};
 }
 return {label:code>=20&&code<=29?'Wetter in der vorangegangenen Stunde · keine eindeutige aktuelle Phase':'Keine eindeutige Niederschlagsphase aus WW',phase:'unbestimmt',code,winter:false};
}
function gridPoint(frame:NativeOverviewFrame,lat:number,lon:number){
 const {lats,lons}=frame.cloud;
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<lats[0]||lat>lats[lats.length-1]||lon<lons[0]||lon>lons[lons.length-1])return null;
 return {row:Math.round((lat-lats[0])/(lats[1]-lats[0])),col:Math.round((lon-lons[0])/(lons[1]-lons[0]))};
}
export function nativeOverviewAt(frame:NativeOverviewFrame,lat:number,lon:number){
 const cell=gridPoint(frame,lat,lon);
 if(!cell)return null;
 const value=nativeOverviewCell(frame,cell.row*frame.width+cell.col);
 return value?{...value,endpointWeather:overviewEndpointWeather(value.weatherCode)}:null;
}
export function overviewPressureFeatures(frame:NativeOverviewFrame){
 let omittedSegments=0;
 const contours=frame.pressure.isobars.map(c=>({...c,paths:c.paths.filter(path=>{
  if(path.length!==2){omittedSegments++;return false}
  const a=gridPoint(frame,path[0][0],path[0][1]),b=gridPoint(frame,path[1][0],path[1][1]);
  if(!a||!b){omittedSegments++;return false}
  const r0=Math.min(a.row,b.row),r1=Math.max(a.row,b.row),c0=Math.min(a.col,b.col),c1=Math.max(a.col,b.col);
  if((r1-r0+1)*(c1-c0+1)>64){omittedSegments++;return false}
  for(let row=r0;row<=r1;row++)for(let col=c0;col<=c1;col++)
   if(!nativeOverviewCellValid(frame,row*frame.width+col)){omittedSegments++;return false}
  return true;
 })}));
 return {data:nativeIsobarFeatures(contours),omittedSegments};
}
export function overviewPlaceFeatures(frame:NativeOverviewFrame,places:readonly OverviewPlace[],variant:OverviewVariant){
 const features=[];
 const seen=new Set<string>();
 for(const place of places){
  if(features.length>=96)break;
  if(!place.name||!Number.isFinite(place.latitude)||!Number.isFinite(place.longitude))continue;
  const point=gridPoint(frame,place.latitude,place.longitude);
  if(!point)continue;
  const key=point.row+':'+point.col;
  if(seen.has(key))continue;
  const value=nativeOverviewAt(frame,place.latitude,place.longitude);
  if(!value)continue;
  seen.add(key);
  const phase=value.endpointWeather;
  const temperature=modelMapValue('temperature',value.temperature,'°C','kn')+' °C';
  const display=variant==='winter-overview'&&phase?.winter?temperature+' · '+phase.label:temperature;
  features.push({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[place.longitude,place.latitude]},
   properties:{name:place.name,label:display,temperature,weather:phase?.label??'WW unbekannt',code:value.weatherCode}});
 }
 return {type:'FeatureCollection' as const,features};
}

/** A frame is immutable after admission. Cache its raster and original contours
 * weakly: changing variants or labels must not re-rasterize millions of cells.
 * The caller memoizes the admitted frame and never mutates its source arrays. */
const staticOverviewScene=new WeakMap<NativeOverviewFrame,{raster:string;pressure:ReturnType<typeof overviewPressureFeatures>}>();
export function createNativeOverviewPresentation(frame:NativeOverviewFrame,places:readonly OverviewPlace[],variant:OverviewVariant){
 let scene=staticOverviewScene.get(frame);
 if(!scene){
  scene={raster:nativeOverviewRaster(frame),pressure:overviewPressureFeatures(frame)};
  staticOverviewScene.set(frame,scene);
 }
 const {raster,pressure}=scene,locations=overviewPlaceFeatures(frame,places,variant),groups:TemporalMapGroup[]=[];
 if(pressure.data.features.length)groups.push({id:'isobars',data:pressure.data,zIndex:680,hoverProperty:'label',
  layers:adaptiveContourLayers('pressure','#20384d',1,{halo:'#fff'})});
 if(locations.features.length)groups.push({id:'temperature-and-weather',data:locations,zIndex:720,hoverProperty:'weather',
  layers:[{id:'labels',type:'symbol',layout:{'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':12,
   'text-allow-overlap':false,'text-ignore-placement':false,'text-padding':4,'text-max-width':12},
   paint:{'text-color':'#182d43','text-halo-color':'#fff','text-halo-width':1.4}}]});
 const mapFrame:TemporalMapFrameData={key:JSON.stringify([frame.key,variant,locations.features.map(f=>[f.geometry.coordinates,f.properties.name,f.properties.label])]),
  raster:{url:raster,bounds:[[frame.cloud.lats[0],frame.cloud.lons[0]],[frame.cloud.lats[frame.height-1],frame.cloud.lons[frame.width-1]]],resampling:'nearest',zIndex:300},groups};
 return {mapFrame,frame,variant,pressure,locations,
  amountLabel:'Niederschlag der vorangegangenen Stunde · mm/1 h',
  weatherLabel:'WW zum Modelltermin · keine Aussage über die Phase der gesamten Stunde',
  sourceLabel:'DWD ICON-D2 · Originalfelder · DWD Open Data · CC BY 4.0'};
}
export type NativeOverviewPresentation=ReturnType<typeof createNativeOverviewPresentation>;
