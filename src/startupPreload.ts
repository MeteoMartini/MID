import {ensembles,forecast,station,type EnsembleForecastBundle,type Location,type Station,type Weather} from './weather'

const LOCATION_STORAGE_KEY='mid:lastLocation'
const FORECAST_DISPLAY_SETTINGS_KEY='mid:forecastDisplaySettings'
const ACTIVE_HORIZON_KEY='mid:forecastCockpit:activeHorizon'
const ENSEMBLE_MODULE_KEY='mid:module:ensemble:open'
const WEATHER_TWIN_SETTINGS_KEY='mid:weather-twin:settings:v1'

type StartupPreload={
 key:string;
 startedAt:number;
 promise:Promise<Weather|null>;
 stationPromise:Promise<Station|null>|null;
 ensemblePromise:Promise<EnsembleForecastBundle|null>|null;
 interfacePromise:Promise<void>;
}
let active:StartupPreload|null=null
function locationKey(location:Location){return`${Number(location.latitude).toFixed(5)}:${Number(location.longitude).toFixed(5)}`}
function readStartupLocation():Location|null{try{const raw=localStorage.getItem(LOCATION_STORAGE_KEY);if(!raw)return null;const location=JSON.parse(raw) as Location;return Number.isFinite(Number(location.latitude))&&Number.isFinite(Number(location.longitude))?location:null}catch{return null}}
function wantsStartupEnsemble(){try{const settings=JSON.parse(localStorage.getItem(FORECAST_DISPLAY_SETTINGS_KEY)||'{}'),twin=JSON.parse(localStorage.getItem(WEATHER_TWIN_SETTINGS_KEY)||'{}'),cockpit=settings?.presentationMode==='cockpit-tabs'||settings?.presentationMode==='cockpit-ribbons';return twin?.enabled!==false||cockpit||localStorage.getItem(ACTIVE_HORIZON_KEY)==='fourteen-day'||localStorage.getItem(ENSEMBLE_MODULE_KEY)==='1'}catch{return true}}
function delay(ms:number){return new Promise<void>(resolve=>window.setTimeout(resolve,ms))}
function preloadInterfaceChunks(ensemble:boolean){const jobs:Promise<unknown>[]=[];if(ensemble)jobs.push(import('./EnsemblePanel'));try{const last=localStorage.getItem('mid:last-dashboard-section:v1');if(last==='composite')jobs.push(import('./RadarPanel'))}catch{}return Promise.allSettled(jobs).then(()=>undefined)}
export function beginStartupDashboardPreload(){
 const location=readStartupLocation();if(!location||navigator.onLine===false)return null;
 const key=locationKey(location);if(active&&active.key===key&&Date.now()-active.startedAt<45_000)return active;
 const ensemble=wantsStartupEnsemble(),timeZone=location.timezone||(location.autolocated?Intl.DateTimeFormat().resolvedOptions().timeZone:undefined);
 const promise=forecast(location.latitude,location.longitude,undefined,{priority:'foreground',forceFresh:false,timeZone,elevation:location.elevation}).then(value=>value).catch(()=>null);
 // Kein Start-Burst: Prognose beginnt sofort; Stations- und Ensemble-Schnellstart
 // werden leicht versetzt, teilen sich danach aber mit App.tsx dieselben Promises.
 const stationPromise=delay(120).then(()=>station(location.latitude,location.longitude,location.country_code||location.country,location.elevation,location,undefined,true,false)).then(value=>value).catch(()=>null);
 const ensemblePromise=ensemble?delay(260).then(()=>ensembles(location.latitude,location.longitude,undefined,'foreground')).then(value=>value).catch(()=>null):null;
 const interfacePromise=preloadInterfaceChunks(ensemble);
 active={key,startedAt:Date.now(),promise,stationPromise,ensemblePromise,interfacePromise};return active
}
export function startupForecastForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.promise}
export function startupStationForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.stationPromise}
export function startupEnsembleForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.ensemblePromise}
