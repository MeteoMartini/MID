/**
 * MID visibility/obscuration contract.
 *
 * Scientific basis:
 * - WMO: fog reduces horizontal visibility at the surface to < 1000 m.
 * - DWD ww=05: dry haze at RH <=79 % and visibility 1-5 km.
 * - DWD ww=10: humid haze/mist at RH >=80 % and visibility 1-8 km.
 * - DWD ww=11/12 and ww=40/41 are explicit shallow/patchy/vicinity fog
 *   exceptions where prevailing reported visibility may remain >1000 m.
 *
 * Model weather codes never override a contradictory, finite visibility.
 * Special fog geometry (shallow/patches/partial/vicinity) requires a trusted
 * operational observation and is never invented from model fields.
 */

export type VisibilityPhenomenonKind=
 'none'|'fog'|'freezing-fog'|'shallow-fog'|'fog-patches'|'partial-fog'|'vicinity-fog'|'mist'|'haze'|'restricted-visibility';

export type VisibilityPhenomenonSource='report'|'derived'|'model'|'none';

export type VisibilityPhenomenonResult={
 kind:VisibilityPhenomenonKind;
 label:string;
 displayCode?:number;
 source:VisibilityPhenomenonSource;
 explicit:boolean;
 visibilityConflict:boolean;
 humidity?:number;
};

export type VisibilityPhenomenonInput={
 visibility?:number;
 humidity?:number;
 temperature?:number;
 dewPoint?:number;
 weatherCode?:number;
 presentWeather?:string|number;
 trustPresentWeather?:boolean;
};

type ReportedVisibilityPhenomenon={
 kind:Exclude<VisibilityPhenomenonKind,'none'|'restricted-visibility'>;
 label:string;
 displayCode:number;
 geometryException:boolean;
};

function finite(value:unknown){const number=Number(value);return Number.isFinite(number)?number:undefined}
function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function derivedHumidity(temperature:unknown,dewPoint:unknown){
 const t=finite(temperature),td=finite(dewPoint);if(t===undefined||td===undefined)return undefined;
 const a=17.625,b=243.04;
 return clamp(100*Math.exp((a*td)/(b+td)-(a*t)/(b+t)),0,100);
}
export function effectiveVisibilityHumidity(input:Pick<VisibilityPhenomenonInput,'humidity'|'temperature'|'dewPoint'>){
 const direct=finite(input.humidity);return direct===undefined?derivedHumidity(input.temperature,input.dewPoint):clamp(direct,0,100);
}

function fromWw(code:number):ReportedVisibilityPhenomenon|undefined{
 if(code===5)return{kind:'haze',label:'Trockener Dunst',displayCode:5,geometryException:false};
 if(code===10)return{kind:'mist',label:'Feuchter Dunst',displayCode:10,geometryException:false};
 if(code===11)return{kind:'shallow-fog',label:'Bodennebel',displayCode:11,geometryException:true};
 if(code===12)return{kind:'fog-patches',label:'Bodennebel / Nebelbänke',displayCode:12,geometryException:true};
 if(code===40)return{kind:'vicinity-fog',label:'Nebel in der Umgebung',displayCode:40,geometryException:true};
 if(code===41)return{kind:'fog-patches',label:'Nebelschwaden / Nebelbänke',displayCode:41,geometryException:true};
 if(code>=42&&code<=47)return{kind:'fog',label:'Nebel',displayCode:code,geometryException:false};
 if(code===48||code===49)return{kind:'freezing-fog',label:'Reif-/gefrierender Nebel',displayCode:code,geometryException:false};
 return undefined;
}

export function parseReportedVisibilityPhenomenon(value:unknown):ReportedVisibilityPhenomenon|undefined{
 if(value===null||value===undefined)return undefined;
 const raw=String(value).trim().toUpperCase();if(!raw)return undefined;
 const numeric=/^(?:WW\s*[=:]?\s*)?(\d{1,2})$/.exec(raw);
 if(numeric)return fromWw(Number(numeric[1]));
 const compact=raw.replace(/\s+/g,'');
 // Order matters: every special fog token also contains "FG".
 if(/(?:^|[^A-Z])MIFG(?:$|[^A-Z])/.test(raw)||compact==='MIFG')return{kind:'shallow-fog',label:'Bodennebel',displayCode:11,geometryException:true};
 if(/(?:^|[^A-Z])BCFG(?:$|[^A-Z])/.test(raw)||compact==='BCFG')return{kind:'fog-patches',label:'Nebelbänke',displayCode:12,geometryException:true};
 if(/(?:^|[^A-Z])PRFG(?:$|[^A-Z])/.test(raw)||compact==='PRFG')return{kind:'partial-fog',label:'Partieller Nebel',displayCode:41,geometryException:true};
 if(/(?:^|[^A-Z])VCFG(?:$|[^A-Z])/.test(raw)||compact==='VCFG')return{kind:'vicinity-fog',label:'Nebel in der Umgebung',displayCode:40,geometryException:true};
 if(/(?:^|[^A-Z])FZFG(?:$|[^A-Z])/.test(raw)||compact==='FZFG')return{kind:'freezing-fog',label:'Gefrierender Nebel',displayCode:48,geometryException:false};
 if(/(?:^|[^A-Z])FG(?:$|[^A-Z])/.test(raw)||compact==='FG')return{kind:'fog',label:'Nebel',displayCode:45,geometryException:false};
 if(/(?:^|[^A-Z])BR(?:$|[^A-Z])/.test(raw)||compact==='BR')return{kind:'mist',label:'Feuchter Dunst',displayCode:10,geometryException:false};
 if(/(?:^|[^A-Z])HZ(?:$|[^A-Z])/.test(raw)||compact==='HZ')return{kind:'haze',label:'Trockener Dunst',displayCode:5,geometryException:false};
 return undefined;
}

function reportFitsVisibility(report:ReportedVisibilityPhenomenon,visibility:number|undefined){
 if(visibility===undefined)return true;
 if(report.geometryException)return true;
 if(report.kind==='fog'||report.kind==='freezing-fog')return visibility<1000;
 if(report.kind==='mist')return visibility>=1000&&visibility<=8000;
 if(report.kind==='haze')return visibility>=1000&&visibility<=5000;
 return true;
}

export function classifyVisibilityPhenomenon(input:VisibilityPhenomenonInput):VisibilityPhenomenonResult{
 const visibility=finite(input.visibility),humidity=effectiveVisibilityHumidity(input),code=Math.round(finite(input.weatherCode)??-1),modelFog=code>=40&&code<=49,modelFreezingFog=code===48||code===49;
 const report=input.trustPresentWeather?parseReportedVisibilityPhenomenon(input.presentWeather):undefined;
 let visibilityConflict=false;
 if(report){
  if(reportFitsVisibility(report,visibility))return{...report,source:'report',explicit:true,visibilityConflict:false,humidity};
  visibilityConflict=true;
 }
 const wet=humidity===undefined?(modelFog?true:undefined):humidity>=80;
 if(visibility!==undefined){
  if(visibility<1000){
   if(wet!==false){
    const freezing=modelFreezingFog;
    return{kind:freezing?'freezing-fog':'fog',label:freezing?'Reif-/gefrierender Nebel':'Nebel',displayCode:freezing?(code===49?49:48):(code>=42&&code<=47?code:45),source:modelFog?'model':'derived',explicit:false,visibilityConflict,humidity};
   }
   return{kind:'restricted-visibility',label:'Stark eingeschränkte Sicht · Ursache nicht als Nebel belegt',source:'derived',explicit:false,visibilityConflict,humidity};
  }
  if(visibility<=8000&&wet===true)return{kind:'mist',label:'Feuchter Dunst',displayCode:10,source:'derived',explicit:false,visibilityConflict,humidity};
  if(visibility<=5000&&wet===false)return{kind:'haze',label:'Trockener Dunst',displayCode:5,source:'derived',explicit:false,visibilityConflict,humidity};
  return{kind:'none',label:'Keine meteorologische Sichttrübung abgeleitet',source:'none',explicit:false,visibilityConflict,humidity};
 }
 if(modelFog){
  return{kind:modelFreezingFog?'freezing-fog':'fog',label:modelFreezingFog?'Reif-/gefrierender Nebel':'Nebel',displayCode:modelFreezingFog?(code===49?49:48):(code>=42&&code<=47?code:45),source:'model',explicit:false,visibilityConflict,humidity};
 }
 return{kind:'none',label:'Keine meteorologische Sichttrübung abgeleitet',source:'none',explicit:false,visibilityConflict,humidity};
}

export function visibilityPhenomenonIsFog(kind:VisibilityPhenomenonKind){
 return kind==='fog'||kind==='freezing-fog'||kind==='shallow-fog'||kind==='fog-patches'||kind==='partial-fog'||kind==='vicinity-fog';
}
