import {ensembles,forecast,radarNowcast,station,type EnsembleForecastBundle,type Location,type RadarNowcast,type Station,type Weather} from './weather'

const LOCATION_STORAGE_KEY='mid:lastLocation'
const FORECAST_DISPLAY_SETTINGS_KEY='mid:forecastDisplaySettings'
const ACTIVE_HORIZON_KEY='mid:forecastCockpit:activeHorizon'
const ENSEMBLE_MODULE_KEY='mid:module:ensemble:open'
const WEATHER_TWIN_SETTINGS_KEY='mid:weather-twin:settings:v1'
const STARTUP_PRELOAD_FORECAST_TIMEOUT_MS=6500
const STARTUP_PRELOAD_STATION_TIMEOUT_MS=7500
const STARTUP_PRELOAD_ENSEMBLE_TIMEOUT_MS=12000
const STARTUP_PRELOAD_RADAR_TIMEOUT_MS=9000
const STARTUP_PRELOAD_STATION_ENRICHMENT_TIMEOUT_MS=11000

type StartupPreload={
 key:string;
 startedAt:number;
 promise:Promise<Weather|null>;
 stationPromise:Promise<Station|null>|null;
 stationEnrichmentPromise:Promise<Station|null>|null;
 radarPromise:Promise<RadarNowcast|null>|null;
 ensemblePromise:Promise<EnsembleForecastBundle|null>|null;
 interfacePromise:Promise<void>;
 abort:()=>void;
}
let active:StartupPreload|null=null
function locationKey(location:Location){return`${Number(location.latitude).toFixed(5)}:${Number(location.longitude).toFixed(5)}`}
function readStartupLocation():Location|null{try{const raw=localStorage.getItem(LOCATION_STORAGE_KEY);if(!raw)return null;const location=JSON.parse(raw) as Location;return Number.isFinite(Number(location.latitude))&&Number.isFinite(Number(location.longitude))?location:null}catch{return null}}
function wantsStartupEnsemble(){try{const settings=JSON.parse(localStorage.getItem(FORECAST_DISPLAY_SETTINGS_KEY)||'{}'),twin=JSON.parse(localStorage.getItem(WEATHER_TWIN_SETTINGS_KEY)||'{}'),cockpit=settings?.presentationMode==='cockpit-tabs'||settings?.presentationMode==='cockpit-ribbons';return twin?.enabled!==false||cockpit||localStorage.getItem(ACTIVE_HORIZON_KEY)==='fourteen-day'||localStorage.getItem(ENSEMBLE_MODULE_KEY)==='1'}catch{return true}}
function delay(ms:number){return new Promise<void>(resolve=>window.setTimeout(resolve,ms))}
function constrainedStartupNetwork(){try{const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;return connection?.saveData===true||connection?.effectiveType==='slow-2g'||connection?.effectiveType==='2g'}catch{return false}}
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
 // Kritische Daten zuerst: Prognose startet sofort, Fast-Observation nach 35 ms und
 // Radar-/Niederschlagsabgleich kurz danach. Hyperlokale Vollanalyse, Ensemble und
 // nichtkritische UI-Chunks werden gestaffelt parallelisiert, damit mobile Verbindungen
 // nicht durch einen Start-Burst ausgebremst werden. Die Datenbasis bleibt unverändert.
 const stationRequest=startupRequest(STARTUP_PRELOAD_STATION_TIMEOUT_MS,async signal=>{await delay(35);if(signal.aborted)throw signal.reason;return station(location.latitude,location.longitude,location.country_code||location.country,location.elevation,location,signal,true,false)});
 const constrained=constrainedStartupNetwork();
 // Radar-/Niederschlagsabgleich ist unabhängig von der vollständigen Prognose und darf
 // deshalb bereits während deren Aufbau beginnen. Das verkürzt ausschließlich die
 // Wartezeit; Quelle, Auswertealgorithmus und Qualitätsregeln bleiben unverändert.
 const radarRequest=startupRequest(STARTUP_PRELOAD_RADAR_TIMEOUT_MS,async signal=>{await delay(constrained?210:85);if(signal.aborted)throw signal.reason;return radarNowcast(location.latitude,location.longitude,location.country_code||location.country,signal,true)});
 // Die vollständige hyperlokale Analyse startet nach dem schnellen Stationspfad schon
 // parallel zur Prognose. Auf Data-Saver/2G bleibt der bisherige sparsame Pfad erhalten.
 const stationEnrichmentRequest=!constrained?startupRequest(STARTUP_PRELOAD_STATION_ENRICHMENT_TIMEOUT_MS,async signal=>{await stationRequest.promise;await delay(70);if(signal.aborted)throw signal.reason;return station(location.latitude,location.longitude,location.country_code||location.country,location.elevation,location,signal,false,false)}):null;
 const ensembleRequest=ensemble?startupRequest(STARTUP_PRELOAD_ENSEMBLE_TIMEOUT_MS,async signal=>{await delay(constrained?650:440);if(signal.aborted)throw signal.reason;return ensembles(location.latitude,location.longitude,signal,'foreground')}):null;
 const interfacePromise=Promise.race([forecastRequest.promise,stationRequest.promise,radarRequest.promise,delay(700)]).then(()=>preloadInterfaceChunks(ensemble)),abort=()=>{forecastRequest.controller.abort();stationRequest.controller.abort();stationEnrichmentRequest?.controller.abort();radarRequest.controller.abort();ensembleRequest?.controller.abort()};
 active={key,startedAt:Date.now(),promise:forecastRequest.promise,stationPromise:stationRequest.promise,stationEnrichmentPromise:stationEnrichmentRequest?.promise??null,radarPromise:radarRequest.promise,ensemblePromise:ensembleRequest?.promise??null,interfacePromise,abort};return active
}
export function startupForecastForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.promise}
export function startupStationForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.stationPromise}
export function startupStationEnrichmentForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.stationEnrichmentPromise}
export function startupRadarForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.radarPromise}
export function startupEnsembleForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>45_000)return null;return active.ensemblePromise}
