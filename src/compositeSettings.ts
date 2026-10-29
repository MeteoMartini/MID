import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety';
import {DEFAULT_RADAR_COLOR_TABLE,type RadarColorTableId} from './radarColorTables';

export type BasemapId='osm'|'positron'|'dark';
export type ModelLineMode='off'|'isobars'|'isoheights'|'both';
export type MotionTimeMode='absolute'|'relative';
export type CompositeViewMode='radar'|'satellite'|'synoptic';
export type ModelLineColor='white'|'black'|'multicolor';
export type ModelLineTone='auto'|ModelLineColor;
export type CompositeSettings={observationsEnabled:boolean;basemap:BasemapId;viewMode:CompositeViewMode;showRadar:boolean;highResolution:boolean;showPrecipitationType:boolean;showSatellite:boolean;showLightning:boolean;showNowcastObjects:boolean;showMotionOverlay:boolean;motionTimeMode:MotionTimeMode;showWarnings:boolean;modelLines:ModelLineMode;modelLineTone:ModelLineTone;isobarLineColor:ModelLineColor;isoheightLineColor:ModelLineColor;radarOpacity:number;radarColorTable:RadarColorTableId;precipitationTypeOpacity:number;satelliteOpacity:number;lightningOpacity:number;warningOpacity:number;modelOpacity:number;mapOverlayOpacity:number;playbackSeconds:number};
export const COMPOSITE_SETTINGS_KEY='mid:composite-settings:v3';
export const COMPOSITE_LAYERS_KEY='mid:composite-layers:v3';
type BasemapTone={saturation?:number;contrast?:number;brightnessMin?:number;brightnessMax?:number;hueRotate?:number};
type CompositeBasemap={label:string;detail:string;url:string;attribution:string;tone?:BasemapTone};
const OSM_TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION='&copy; OpenStreetMap-Mitwirkende';
export const COMPOSITE_BASEMAPS:Record<BasemapId,CompositeBasemap>={
 osm:{label:'OpenStreetMap',detail:'Standard',url:OSM_TILE_URL,attribution:OSM_ATTRIBUTION},
 positron:{label:'Schlicht hell',detail:'OSM',url:OSM_TILE_URL,attribution:OSM_ATTRIBUTION,tone:{saturation:-.9,contrast:-.08,brightnessMin:.18,brightnessMax:1}},
 dark:{label:'Schlicht dunkel',detail:'OSM',url:OSM_TILE_URL,attribution:OSM_ATTRIBUTION,tone:{saturation:-1,contrast:.2,brightnessMin:0,brightnessMax:.48}}
};
export const MODEL_LINE_MODES:ModelLineMode[]=['off','isobars','isoheights','both'];

const DEFAULTS:CompositeSettings={observationsEnabled:true,basemap:'positron',viewMode:'radar',showRadar:true,highResolution:false,showPrecipitationType:false,showSatellite:false,showLightning:false,showNowcastObjects:true,showMotionOverlay:true,motionTimeMode:'relative',showWarnings:false,modelLines:'off',modelLineTone:'auto',isobarLineColor:'white',isoheightLineColor:'white',radarOpacity:76,radarColorTable:DEFAULT_RADAR_COLOR_TABLE,precipitationTypeOpacity:84,satelliteOpacity:58,lightningOpacity:92,warningOpacity:72,modelOpacity:70,mapOverlayOpacity:86,playbackSeconds:2.4};
const clamp=(value:number,minimum:number,maximum:number)=>Math.max(minimum,Math.min(maximum,value));
const storedNumber=(value:unknown,fallback:number)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):fallback;
type LayerSettings=Pick<CompositeSettings,'observationsEnabled'|'showRadar'|'highResolution'|'showPrecipitationType'|'showSatellite'|'showLightning'|'showNowcastObjects'|'showMotionOverlay'|'showWarnings'|'modelLines'>;

function stored(key:string):Record<string,unknown>{
 try{const raw=readDurableStorageValue(key),value=raw?JSON.parse(raw):null;return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}}
 catch{return{}}
}
/** Canonical v3 is authoritative; legacy layers are a missing-field migration only. */
export function readCompositeSettings():CompositeSettings{
 const raw=stored(COMPOSITE_SETTINGS_KEY),legacy=stored(COMPOSITE_LAYERS_KEY);
 const yes=(k:keyof LayerSettings,fallback:boolean)=>typeof raw[k]==='boolean'?raw[k] as boolean:typeof legacy[k]==='boolean'?legacy[k] as boolean:fallback;
 const select=<T extends string>(value:unknown,options:readonly T[],fallback:T):T=>options.includes(value as T)?value as T:fallback;
 const modelLines=select(raw.modelLines??legacy.modelLines,MODEL_LINE_MODES,DEFAULTS.modelLines);
 const showRadar=yes('showRadar',DEFAULTS.showRadar),showSatellite=yes('showSatellite',DEFAULTS.showSatellite);
 const modelLineTone=select(raw.modelLineTone,['auto','white','black','multicolor'] as const,DEFAULTS.modelLineTone);
 const defaultColor:ModelLineColor=modelLineTone==='black'?'black':modelLineTone==='multicolor'?'multicolor':'white';
 const color=(value:unknown):ModelLineColor=>select(value,['white','black','multicolor'] as const,defaultColor);
 const numberValue=(key:keyof CompositeSettings,fallback:number,lo:number,hi:number)=>clamp(storedNumber(raw[key],fallback),lo,hi);
 const viewMode=select(raw.viewMode,['radar','satellite','synoptic'] as const,!showRadar&&modelLines!=='off'?'synoptic':!showRadar&&showSatellite?'satellite':'radar');
 return{observationsEnabled:yes('observationsEnabled',DEFAULTS.observationsEnabled),basemap:select(raw.basemap,['osm','positron','dark'] as const,DEFAULTS.basemap),viewMode,
  showRadar,highResolution:yes('highResolution',DEFAULTS.highResolution),showPrecipitationType:yes('showPrecipitationType',DEFAULTS.showPrecipitationType),showSatellite,
  showLightning:yes('showLightning',DEFAULTS.showLightning),showNowcastObjects:yes('showNowcastObjects',DEFAULTS.showNowcastObjects),showMotionOverlay:yes('showMotionOverlay',DEFAULTS.showMotionOverlay),
  motionTimeMode:select(raw.motionTimeMode,['relative','absolute'] as const,DEFAULTS.motionTimeMode),showWarnings:yes('showWarnings',DEFAULTS.showWarnings),
  modelLines,modelLineTone,isobarLineColor:color(raw.isobarLineColor),isoheightLineColor:color(raw.isoheightLineColor),
  radarOpacity:numberValue('radarOpacity',DEFAULTS.radarOpacity,15,100),radarColorTable:DEFAULT_RADAR_COLOR_TABLE,
  precipitationTypeOpacity:numberValue('precipitationTypeOpacity',DEFAULTS.precipitationTypeOpacity,20,100),
  satelliteOpacity:numberValue('satelliteOpacity',DEFAULTS.satelliteOpacity,15,100),lightningOpacity:numberValue('lightningOpacity',DEFAULTS.lightningOpacity,20,100),
  warningOpacity:numberValue('warningOpacity',DEFAULTS.warningOpacity,20,100),modelOpacity:numberValue('modelOpacity',DEFAULTS.modelOpacity,20,100),
  mapOverlayOpacity:numberValue('mapOverlayOpacity',DEFAULTS.mapOverlayOpacity,0,100),
  playbackSeconds:[1.2,2.4,4.8].includes(Number(raw.playbackSeconds))?Number(raw.playbackSeconds):DEFAULTS.playbackSeconds};
}
const EVENT='mid:composite-settings-changed';
/** One atomic canonical write precedes its optional old-client mirror. */
export function writeCompositeSettings(value:CompositeSettings){
 writeDurableStorageValue(COMPOSITE_SETTINGS_KEY,JSON.stringify({...value,updatedAt:Date.now()}));
 const layers:LayerSettings={observationsEnabled:value.observationsEnabled,showRadar:value.showRadar,highResolution:value.highResolution,
  showPrecipitationType:value.showPrecipitationType,showSatellite:value.showSatellite,showLightning:value.showLightning,
  showNowcastObjects:value.showNowcastObjects,showMotionOverlay:value.showMotionOverlay,showWarnings:value.showWarnings,modelLines:value.modelLines};
 try{writeDurableStorageValue(COMPOSITE_LAYERS_KEY,JSON.stringify(layers))}catch{/* legacy mirror not authoritative */}
 if(typeof window!=='undefined')window.dispatchEvent(new Event(EVENT));
}
/** Reads the last committed selection, not the component's stale mount snapshot. */
export function patchCompositeSettings(patch:Partial<CompositeSettings>){
 const next={...readCompositeSettings(),...patch};writeCompositeSettings(next);return next;
}
export function subscribeCompositeSettings(notify:()=>void){
 if(typeof window==='undefined')return()=>{};
 const storage=(event:StorageEvent)=>{if(event.key===COMPOSITE_SETTINGS_KEY||event.key===COMPOSITE_LAYERS_KEY)notify()};
 window.addEventListener(EVENT,notify);window.addEventListener('storage',storage);
 return()=>{window.removeEventListener(EVENT,notify);window.removeEventListener('storage',storage)};
}
