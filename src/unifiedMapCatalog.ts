import type {NativeFieldKind,NativeIndex,NativeFrameRef} from './nativeModelFields';
import {UNIFIED_WMS_PARAMETERS,unifiedWmsChoices} from './unifiedWmsCatalog';

export const UNIFIED_MAP_PARAMETERS:{id:string;label:string;detail:string}[]=[
 {id:'temperature',label:'Temperatur · 2 m',detail:'Momentanwert'},
 {id:'precipitation',label:'Niederschlag · 1 h',detail:'Stundensumme bis zum Rastertermin'},
 {id:'totals',label:'Niederschlagssumme',detail:'6 / 12 / 24 / 48 h ab Modelllaufstart'},
 {id:'observed',label:'Gefallener Niederschlag',detail:'RADOLAN · vollständige Messstunden'},
 {id:'wind',label:'Wind · 10 m',detail:'Mittelwind'},
 {id:'gust',label:'Böen · 10 m',detail:'Maximum im bestätigten Modellintervall'},
 {id:'cloud',label:'Gesamtbewölkung',detail:'Bedeckungsgrad'},
 {id:'pressure',label:'Bodendruck · MSL',detail:'Auf Meereshöhe reduzierter Druck'},
 {id:'thetae',label:'ThetaE · 850 hPa',detail:'Luftmassen und barokline Zonen; keine analysierten Fronten'},
 {id:'sigwx',label:'Signifikantes Wetter',detail:'WMO-Modellwettercode; keine amtliche Warnung'},
 ...UNIFIED_WMS_PARAMETERS
];
export type UnifiedParameter=typeof UNIFIED_MAP_PARAMETERS[number]['id'];
export function unifiedModelForParameter(parameter:UnifiedParameter){return parameter==='observed'?'radolan':'icon-d2'}
export function availableUnifiedParameters(index:NativeIndex|null,hasTotals:boolean,hasObserved:boolean){
 return UNIFIED_MAP_PARAMETERS.filter(p=>p.id==='totals'?hasTotals:p.id==='observed'?hasObserved:Boolean(index?.products[p.id as NativeFieldKind]?.frames.length)||unifiedWmsChoices().some(c=>c.parameter===p.id));
}
/** Both selectors use this single verified capability matrix. */
export function unifiedSources(parameter:string,index:NativeIndex|null,hasTotals:boolean,hasObserved:boolean):{id:string;label:string}[]{
 const native=parameter==='observed'?hasObserved?{id:'radolan',label:'DWD RADOLAN · Messanalyse'}:null:parameter==='totals'?hasTotals?{id:'icon-d2',label:'DWD ICON-D2'}:null:index?.products[parameter as NativeFieldKind]?.frames.length?{id:'icon-d2',label:'DWD ICON-D2'}:null;
 return [...new Map([...(native?[native]:[]),...unifiedWmsChoices().filter(c=>c.parameter===parameter).map(c=>({id:c.model.id,label:c.model.label}))].map(c=>[c.id,c])).values()];
}
/** Never manufacture an interpolated model frame. The actual term is always labelled. */
export function nearestUnifiedTime(times:string[],target:number){
 if(!Number.isFinite(target))return undefined;
 const nearest=times.filter(time=>Number.isFinite(Date.parse(time))).reduce<string|undefined>((best,time)=>!best||Math.abs(Date.parse(time)-target)<Math.abs(Date.parse(best)-target)?time:best,undefined);
 return nearest&&Math.abs(Date.parse(nearest)-target)<=90*60000?nearest:undefined;
}
export function nearestUnifiedFrame(frames:NativeFrameRef[],target:number){
 if(!Number.isFinite(target))return undefined;
 const nearest=frames.reduce<NativeFrameRef|undefined>((best,next)=>!best||Math.abs(Date.parse(next.time)-target)<Math.abs(Date.parse(best.time)-target)?next:best,undefined);
 return nearest&&Math.abs(Date.parse(nearest.time)-target)<=90*60000?nearest:undefined;
}
export const UNIFIED_MAP_SETTINGS_KEY='mid:unified-map:v1';
export type UnifiedMapSettings={enabled:boolean;parameter:UnifiedParameter;opacity:number;isobars:boolean;hours:number;modelId:string;level:number;selectionMode:'parameter'|'model'};
export function readUnifiedMapSettings():UnifiedMapSettings{
 const defaults:UnifiedMapSettings={enabled:false,parameter:'temperature',opacity:68,isobars:false,hours:24,modelId:'icon-d2',level:500,selectionMode:'parameter'};
 try{const d=JSON.parse(localStorage.getItem(UNIFIED_MAP_SETTINGS_KEY)||'null');if(!d)return defaults;return{enabled:d.enabled===true,parameter:UNIFIED_MAP_PARAMETERS.some(p=>p.id===d.parameter)?d.parameter:defaults.parameter,opacity:Number.isFinite(d.opacity)?Math.min(100,Math.max(15,d.opacity)):68,isobars:d.isobars===true,hours:[1,6,12,24,48].includes(d.hours)?d.hours:24,modelId:['icon-d2','icon-eu','icon','icon-eps','aicon','radolan'].includes(d.modelId)?d.modelId:'icon-d2',level:Number.isFinite(d.level)?d.level:500,selectionMode:d.selectionMode==='model'?'model':'parameter'}}catch{return defaults}
}
