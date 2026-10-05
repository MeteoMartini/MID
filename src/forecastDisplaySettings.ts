export const FORECAST_DISPLAY_SETTINGS_KEY='mid:forecastDisplaySettings';

export function commitForecastDisplaySettings<T extends object>(
 update:T|((current:T)=>T),
 current:{current:T},
 storage:Pick<Storage,'setItem'>=localStorage
):T{
 const next=typeof update==='function'?(update as (current:T)=>T)(current.current):update;
 current.current=next;
 try{storage.setItem(FORECAST_DISPLAY_SETTINGS_KEY,JSON.stringify(next))}catch{}
 return next;
}

function parseSettingsRecord(raw:string|null|undefined):Record<string,unknown>|null{
 if(raw==null)return null;
 try{
  const value:unknown=JSON.parse(raw);
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
 }catch{return null}
}

export type LegacyForecastDisplayMerge={values:Record<string,string>;preservedLocal:boolean};

export function preserveLegacyForecastDisplaySettings(
 values:Record<string,string>,
 localRaw:string|null
):LegacyForecastDisplayMerge{
 const next={...values},remoteRaw=next[FORECAST_DISPLAY_SETTINGS_KEY];
 if(localRaw===null)return{values:next,preservedLocal:false};
 if(remoteRaw===undefined){next[FORECAST_DISPLAY_SETTINGS_KEY]=localRaw;return{values:next,preservedLocal:true}}
 const local=parseSettingsRecord(localRaw),remote=parseSettingsRecord(remoteRaw);
 if(!remote){if(local){next[FORECAST_DISPLAY_SETTINGS_KEY]=localRaw;return{values:next,preservedLocal:true}}return{values:next,preservedLocal:false}}
 if(local&&typeof remote.ecmwfTemperatureColors!=='boolean'&&typeof local.ecmwfTemperatureColors==='boolean'){
  next[FORECAST_DISPLAY_SETTINGS_KEY]=JSON.stringify({...remote,ecmwfTemperatureColors:local.ecmwfTemperatureColors});
  return{values:next,preservedLocal:true};
 }
 return{values:next,preservedLocal:false};
}
