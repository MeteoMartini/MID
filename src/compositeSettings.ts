import {DEFAULT_RADAR_COLOR_TABLE,type RadarColorTableId} from './radarColorTables';

export type BasemapId='osm'|'positron'|'dark';
export type ModelLineMode='off'|'isobars'|'isoheights'|'both';
export type MotionTimeMode='absolute'|'relative';
export type CompositeSettings={basemap:BasemapId;showRadar:boolean;highResolution:boolean;showPrecipitationType:boolean;showSatellite:boolean;showLightning:boolean;showNowcastObjects:boolean;showMotionOverlay:boolean;motionTimeMode:MotionTimeMode;showWarnings:boolean;modelLines:ModelLineMode;radarOpacity:number;radarColorTable:RadarColorTableId;precipitationTypeOpacity:number;satelliteOpacity:number;lightningOpacity:number;warningOpacity:number;modelOpacity:number;mapOverlayOpacity:number};
export const COMPOSITE_SETTINGS_KEY='mid:composite-settings:v3';
export const COMPOSITE_LAYERS_KEY='mid:composite-layers:v3';
type BasemapTone={saturation?:number;contrast?:number;brightnessMin?:number;brightnessMax?:number;hueRotate?:number};
type CompositeBasemap={label:string;detail:string;url:string;attribution:string;tone?:BasemapTone};
const OSM_TILE_URL='https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION='&copy; OpenStreetMap-Mitwirkende';
export const COMPOSITE_BASEMAPS:Record<BasemapId,CompositeBasemap>={
 osm:{label:'OpenStreetMap',detail:'Standard · schlüsselfrei',url:OSM_TILE_URL,attribution:OSM_ATTRIBUTION},
 positron:{label:'Schlicht hell',detail:'OSM · schlüsselfrei',url:OSM_TILE_URL,attribution:OSM_ATTRIBUTION,tone:{saturation:-.9,contrast:-.08,brightnessMin:.18,brightnessMax:1}},
 dark:{label:'Schlicht dunkel',detail:'OSM · schlüsselfrei',url:OSM_TILE_URL,attribution:OSM_ATTRIBUTION,tone:{saturation:-1,contrast:.2,brightnessMin:0,brightnessMax:.48}}
};
export const MODEL_LINE_MODES:ModelLineMode[]=['off','isobars','isoheights','both'];

const DEFAULTS:CompositeSettings={basemap:'positron',showRadar:true,highResolution:false,showPrecipitationType:false,showSatellite:false,showLightning:false,showNowcastObjects:false,showMotionOverlay:true,motionTimeMode:'absolute',showWarnings:false,modelLines:'off',radarOpacity:76,radarColorTable:DEFAULT_RADAR_COLOR_TABLE,precipitationTypeOpacity:84,satelliteOpacity:58,lightningOpacity:92,warningOpacity:72,modelOpacity:70,mapOverlayOpacity:86};
const clamp=(value:number,minimum:number,maximum:number)=>Math.max(minimum,Math.min(maximum,value));
const storedNumber=(value:unknown,fallback:number)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):fallback;
type LayerSettings=Pick<CompositeSettings,'showRadar'|'highResolution'|'showPrecipitationType'|'showSatellite'|'showLightning'|'showNowcastObjects'|'showMotionOverlay'|'showWarnings'|'modelLines'>;

export function readCompositeSettings():CompositeSettings{
 try{
  const raw=JSON.parse(localStorage.getItem(COMPOSITE_SETTINGS_KEY)||'{}') as Partial<CompositeSettings>,layers=JSON.parse(localStorage.getItem(COMPOSITE_LAYERS_KEY)||'{}') as Partial<LayerSettings>,basemap=raw.basemap&&COMPOSITE_BASEMAPS[raw.basemap]?raw.basemap:DEFAULTS.basemap,showRadar=typeof layers.showRadar==='boolean'?layers.showRadar:typeof raw.showRadar==='boolean'?raw.showRadar:DEFAULTS.showRadar,highResolution=typeof layers.highResolution==='boolean'?layers.highResolution:raw.highResolution===true,showPrecipitationType=typeof layers.showPrecipitationType==='boolean'?layers.showPrecipitationType:typeof raw.showPrecipitationType==='boolean'?raw.showPrecipitationType:DEFAULTS.showPrecipitationType,selectedModelLines=layers.modelLines??raw.modelLines,modelLines=MODEL_LINE_MODES.includes(selectedModelLines as ModelLineMode)?selectedModelLines as ModelLineMode:DEFAULTS.modelLines,radarColorTable=DEFAULT_RADAR_COLOR_TABLE,motionTimeMode:MotionTimeMode=raw.motionTimeMode==='relative'?'relative':'absolute';
  return{basemap,showRadar,highResolution,showPrecipitationType,showSatellite:typeof layers.showSatellite==='boolean'?layers.showSatellite:typeof raw.showSatellite==='boolean'?raw.showSatellite:DEFAULTS.showSatellite,showLightning:typeof layers.showLightning==='boolean'?layers.showLightning:typeof raw.showLightning==='boolean'?raw.showLightning:DEFAULTS.showLightning,showNowcastObjects:typeof layers.showNowcastObjects==='boolean'?layers.showNowcastObjects:typeof raw.showNowcastObjects==='boolean'?raw.showNowcastObjects:DEFAULTS.showNowcastObjects,showMotionOverlay:typeof layers.showMotionOverlay==='boolean'?layers.showMotionOverlay:typeof raw.showMotionOverlay==='boolean'?raw.showMotionOverlay:DEFAULTS.showMotionOverlay,motionTimeMode,showWarnings:typeof layers.showWarnings==='boolean'?layers.showWarnings:typeof raw.showWarnings==='boolean'?raw.showWarnings:DEFAULTS.showWarnings,modelLines,radarOpacity:clamp(storedNumber(raw.radarOpacity,DEFAULTS.radarOpacity),15,100),radarColorTable,precipitationTypeOpacity:clamp(storedNumber(raw.precipitationTypeOpacity,DEFAULTS.precipitationTypeOpacity),20,100),satelliteOpacity:clamp(storedNumber(raw.satelliteOpacity,DEFAULTS.satelliteOpacity),15,100),lightningOpacity:clamp(storedNumber(raw.lightningOpacity,DEFAULTS.lightningOpacity),20,100),warningOpacity:clamp(storedNumber(raw.warningOpacity,DEFAULTS.warningOpacity),20,100),modelOpacity:clamp(storedNumber(raw.modelOpacity,DEFAULTS.modelOpacity),20,100),mapOverlayOpacity:clamp(storedNumber(raw.mapOverlayOpacity,DEFAULTS.mapOverlayOpacity),0,100)};
 }catch{return{...DEFAULTS}}
}

export function writeCompositeSettings(settings:CompositeSettings){
 const layers:LayerSettings={showRadar:settings.showRadar,highResolution:settings.highResolution,showPrecipitationType:settings.showPrecipitationType,showSatellite:settings.showSatellite,showLightning:settings.showLightning,showNowcastObjects:settings.showNowcastObjects,showMotionOverlay:settings.showMotionOverlay,showWarnings:settings.showWarnings,modelLines:settings.modelLines};
 localStorage.setItem(COMPOSITE_SETTINGS_KEY,JSON.stringify(settings));localStorage.setItem(COMPOSITE_LAYERS_KEY,JSON.stringify(layers));
}
