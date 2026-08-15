import {forecast,type Location,type Weather} from './weather'

const LOCATION_STORAGE_KEY='mid:lastLocation'
type StartupPreload={key:string;startedAt:number;promise:Promise<Weather|null>}
let active:StartupPreload|null=null
function locationKey(location:Location){return`${Number(location.latitude).toFixed(5)}:${Number(location.longitude).toFixed(5)}`}
function readStartupLocation():Location|null{try{const raw=localStorage.getItem(LOCATION_STORAGE_KEY);if(!raw)return null;const location=JSON.parse(raw) as Location;return Number.isFinite(Number(location.latitude))&&Number.isFinite(Number(location.longitude))?location:null}catch{return null}}
export function beginStartupDashboardPreload(){const location=readStartupLocation();if(!location||navigator.onLine===false)return null;const key=locationKey(location);if(active&&active.key===key&&Date.now()-active.startedAt<30_000)return active;const promise=forecast(location.latitude,location.longitude,undefined,{priority:'foreground',forceFresh:false,timeZone:location.timezone||(location.autolocated?Intl.DateTimeFormat().resolvedOptions().timeZone:undefined),elevation:location.elevation}).then(value=>value).catch(()=>null);active={key,startedAt:Date.now(),promise};return active}
export function startupForecastForLocation(location:Location){if(!active||active.key!==locationKey(location)||Date.now()-active.startedAt>30_000)return null;return active.promise}
