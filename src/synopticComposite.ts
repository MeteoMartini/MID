import type {WeatherMapMetadata} from './WeatherMapsData';
import {unifiedWmsFillStyle,unifiedWmsLineStyle} from './unifiedMapPresentation';
export const SYNOPTIC_COMPONENTS=[
 {layer:'dwd:Icon_reg025_fd_pl_T',level:850,label:'Temperatur · 850 hPa',fill:true},
 {layer:'dwd:Icon_reg025_fd_pl_GH',level:500,label:'Geopotentielle Höhe · 500 hPa',fill:false},
 {layer:'dwd:Icon_reg025_fd_sl_PMSL',level:undefined,label:'Bodendruck · MSL',fill:false}
] as const;
/** A composite must share model, initialization and valid time in every component. */
export function synopticCompositePlan(metadata:WeatherMapMetadata[],target:number){
 if(metadata.length!==SYNOPTIC_COMPONENTS.length)return null;
 const components=SYNOPTIC_COMPONENTS.map((component,index)=>{
  const data=metadata[index];
  if(data.layer!==component.layer||data.error||component.level!==undefined&&!data.elevations.includes(component.level))return null;
  const style=component.fill?unifiedWmsFillStyle(data,component.level):unifiedWmsLineStyle(data,component.level);
  return style?{...component,style,data}:null;
 });
 if(components.some(c=>!c))return null;
 const valid=components.filter((c):c is NonNullable<typeof c>=>Boolean(c));
 const common=(key:'times'|'referenceTimes')=>[...new Set(valid[0].data[key])].filter(t=>Number.isFinite(Date.parse(t))&&valid.every(c=>c.data[key].some(v=>Date.parse(v)===Date.parse(t)))).sort((a,b)=>Date.parse(a)-Date.parse(b));
 const run=common('referenceTimes').at(-1),times=common('times').filter(t=>run&&Date.parse(t)>=Date.parse(run));
 const time=times.reduce<string|undefined>((best,t)=>!best||Math.abs(Date.parse(t)-target)<Math.abs(Date.parse(best)-target)?t:best,undefined);
 if(!run||!time||!Number.isFinite(target)||Math.abs(Date.parse(time)-target)>90*60000)return null;
 return {run,time,times,components:valid.map(({data,...component})=>component)};
}
