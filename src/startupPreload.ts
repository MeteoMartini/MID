import {ensembles,forecast,station,type EnsembleForecastBundle,type Location,type Station,type Weather} from './weather'

const LOCATION_STORAGE_KEY='mid:lastLocation'
const FORECAST_DISPLAY_SETTINGS_KEY='mid:forecastDisplaySettings'
const ACTIVE_HORIZON_KEY='mid:forecastCockpit:activeHorizon'
const ENSEMBLE_MODULE_KEY='mid:module:ensemble:open'
const WEATHER_TWIN_SETTINGS_KEY='mid:weather-twin:settings:v1'
const STARTUP_PRELOAD_FORECAST_TIMEOUT_MS=6500
const STARTUP_PRELOAD_STATION_TIMEOUT_MS=7500
const STARTUP_PRELOAD_ENSEMBLE_TIMEOUT_MS=12000

type StartupPreload={
 key:string;
 startedAt:number;
 promise:Promise<Weather|null>;
 stationPromise:Promise<Station|null>|null;
 ensemblePromise:Promise<EnsembleForecastBundle|null>|null;
 interfacePromise:Promise<void>;
 abort:()=>void;
}
let active:StartupPreload|null=null
function locationKey(location:Location){return`${Number(location.latitude).toFixed(5)}:${Number(location.longitude).toFixed(5)}`}
function readStartupLocation():Location|null{try{const raw=localStorage.getItem(LOCATION_STORAGE_KEY);if(!raw)return null;const location=JSON.parse(raw) as Location;return Number.isFinite(Number(location.latitude))&&Number.isFinite(Number(location.longitude))?location:null}catch{return null}}
function wantsStartupEnsemble(){try{const settings=JSON.parse(localStorage.getItem(FORECAST_DISPLAY_SETTINGS_KEY)||'{}'),twin=JSON.parse(localStorage.getItem(WEATHER_TWIN_SETTINGS_KEY)||'{}'),cockpit=settings?.presentationMode==='cockpit-tabs'||settings?.presentationMode==='cockpit-ribbons';return twin?.enabled!==false||cockpit||localStorage.getItem(ACTIVE_HORIZON_KEY)==='fourteen-day'||localStorage.getItem(ENSEMBLE_MODULE_KEY)==='1'}catch{return true}}
function delay(ms:number){return new Promise<void>(resolve=>window.setTimeout(resolve,ms))}
function preloadInterfaceChunks(ensemble:boolean){const jobs:Promise<unknown>[]=[];if(ensemble)jobs.push(import('./EnsemblePanel'));try{const last=localStorage.getItem('mid:last-dashboard-section:v1');if(last==='composite')jobs.push(import('./RadarPanel'))}catch{}return Promise.allSettled(jobs).then(()=>undefined)}
function startupRequest<T>(timeoutMs:number,run:(signal:AbortSignal)=>Promise<T>){
 const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(new DOMException('Startvorladung hat ihr Zeitlimit erreicht.','TimeoutError')),timeoutMs);
 const promise=run(controller.signal).then(value=>value).catch(()=>null).finally(()=>window.clearTimeout(timer));
 return{controller,promise};
}
export function beginStartupDashboardPreload(){
 const location=readStartupLocation();if(!location||navigator.onLine===false)return null;
 const key=locationKey(location);if(active&&active.key===key&&Date.now()-active.startedAt<45_000)return active;
 active?.abort();
 const ensemble=wantsStartupEnsemble(),timeZone=location.timezone||(location.autolocated?Intl.DateTimeFormat().resolvedOptions().timeZone:undefined);
 const forecastRequest=startupRequest(STARTUP_PRELOAD_FORECAST_TIMEOUT_MS,signal=>forecast(location.latitude,location.longitude,signal,{priority:'foreground',forceFresh:false,timeZone,elevation:location.elevation}));
 // Kritische Daten zuerst: Prognose startet sofort, die Fast-Observation folgt nach
 // 40 ms. Ensemble und nichtkritische UI-Chunks werden etwas später gestartet, damit
 // mobile Verbindungen nicht durch einen Start-Burst die Istwetter-/Hyperlokal-Anzeige
 // ausbremsen. Die Datenbasis selbst bleibt unverändert vollständig.
 const stationRequest=startupRequest(STARTUP_PRELOAD_STATION_TIMEOUT_MS,async signal=>{await delay(40);if(signal.aborted)throw signal.reason;return station(location.latitude,location.longitude,location.country_code||location.country,location.elevation,location,signal,true,false)});
 const ensembleRequest=ensemble?startupRequest(STARTUP_PRELOAD_ENSEMBLE_TIMEOUT_MS,async signal=>{await delay(420);if(signal.aborted)throw signal.reason;return ensembles(location.latitude,location.longitude,signal,'foreground')}):null;
 const interfacePromise=Promise.race([forecastRequest.promise,stationRequest.promise,delay(700)]).then(()=>preloadInterfaceChunks(ensemble)),abort=()=>{forecastRequest.controller.abort();stationRequest.controller.abort();ensembleRequest?.controller.abort()};
 active={key,startedAt:Date.now(),promise:forecastRequest.promise,stationPromise:stationRequest.promise,ensemblePromise:ensembleRequest?.promise??null,interfacePromise,abort};return active
}
export function startupForecastForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.promise}
export function startupStationForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.stationPromise}
export function startupEnsembleForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.ensemblePromise}
