import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety';

export const FORECAST_DISPLAY_SETTINGS_KEY='mid:forecastDisplaySettings';

/** Explicit durable access also works when a browser rejects Storage method overrides. */
export function readForecastDisplaySettingsRaw(){return readDurableStorageValue(FORECAST_DISPLAY_SETTINGS_KEY)}

export function forecastDisplayRevision(raw:string|null){
 try{const value=Number(JSON.parse(raw||'{}').updatedAt);return Number.isFinite(value)&&value>0?value:0}catch{return 0}
}

/** Commit before React renders: closing/backgrounding the app cannot skip this write. */
export function persistForecastDisplaySettings<T extends object>(settings:T){
 const previous=forecastDisplayRevision(readForecastDisplaySettingsRaw());
 const raw=JSON.stringify({...settings,updatedAt:Math.max(Date.now(),previous+1)});
 writeDurableStorageValue(FORECAST_DISPLAY_SETTINGS_KEY,raw);
 return settings;
}

/** A remote snapshot with unrelated newer data must not undo a newer local choice. */
export function mergeForecastDisplaySettings(remote:string|undefined,local:string|null){
 if(local!==null&&forecastDisplayRevision(local)>forecastDisplayRevision(remote??null))return local;
 return remote;
}
