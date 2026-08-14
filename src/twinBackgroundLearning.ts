import {ensembles,forecast,mapDays,mapHours,type EnsembleDay,type Location} from './weather';
import {recordForecastCapture,refreshForecastReferences,restoreForecastVerificationArchive} from './forecastVerification';
import {isOpenMeteoRateLimitError} from './openMeteoGuard';

const LAST_SUCCESS_PREFIX='mid:twin-background-success:';
const LAST_ATTEMPT_PREFIX='mid:twin-background-attempt:';
const STATUS_KEY='mid:twin-background-status';
const SUCCESS_COOLDOWN_MS=6*3600000;
const FAILURE_COOLDOWN_MS=45*60000;
const BETWEEN_FAVORITES_MS=3500;

export type TwinBackgroundLearningStatus={
 running:boolean;
 total:number;
 completed:number;
 succeeded:number;
 failed:number;
 current?:string;
 lastRunAt?:number;
 message:string;
};

function locationKey(location:Location){return`${Number(location.latitude).toFixed(5)}:${Number(location.longitude).toFixed(5)}`}
function locationLabel(location:Location){return location.name||`${Number(location.latitude).toFixed(3)}°, ${Number(location.longitude).toFixed(3)}°`}
function readNumber(key:string){try{const value=Number(localStorage.getItem(key));return Number.isFinite(value)?value:0}catch{return 0}}
function writeNumber(key:string,value:number){try{localStorage.setItem(key,String(value))}catch{}}
function removeKey(key:string){try{localStorage.removeItem(key)}catch{}}
function writeStatus(status:TwinBackgroundLearningStatus){try{localStorage.setItem(STATUS_KEY,JSON.stringify(status))}catch{};window.dispatchEvent(new CustomEvent('mid:twin-background-learning',{detail:status}))}
export function readTwinBackgroundLearningStatus():TwinBackgroundLearningStatus{try{const parsed=JSON.parse(localStorage.getItem(STATUS_KEY)||'{}') as Partial<TwinBackgroundLearningStatus>;return{running:Boolean(parsed.running),total:Number(parsed.total)||0,completed:Number(parsed.completed)||0,succeeded:Number(parsed.succeeded)||0,failed:Number(parsed.failed)||0,current:parsed.current,lastRunAt:Number(parsed.lastRunAt)||undefined,message:String(parsed.message||'Noch kein Favoritenabgleich durchgeführt.')}}catch{return{running:false,total:0,completed:0,succeeded:0,failed:0,message:'Noch kein Favoritenabgleich durchgeführt.'}}}
function due(location:Location,now:number){const key=locationKey(location),success=readNumber(`${LAST_SUCCESS_PREFIX}${key}`),attempt=readNumber(`${LAST_ATTEMPT_PREFIX}${key}`);if(success&&now-success<SUCCESS_COOLDOWN_MS)return false;if(attempt&&now-attempt<FAILURE_COOLDOWN_MS)return false;return true}
function abortError(){return new DOMException('Abgebrochen','AbortError')}
async function delay(ms:number,signal?:AbortSignal){if(signal?.aborted)throw abortError();await new Promise<void>((resolve,reject)=>{let settled=false,timer=0;const cleanup=()=>signal?.removeEventListener('abort',abort),finish=(fn:()=>void)=>{if(settled)return;settled=true;cleanup();fn()},abort=()=>{window.clearTimeout(timer);finish(()=>reject(abortError()))};timer=window.setTimeout(()=>finish(resolve),ms);signal?.addEventListener('abort',abort,{once:true})})}

export async function learnWeatherTwinsForFavorites(locations:Location[],activeLocationKey?:string,signal?:AbortSignal){
 const now=Date.now(),seen=new Set<string>(),queue=locations.filter(location=>{const key=locationKey(location);if(seen.has(key)||key===activeLocationKey||!Number.isFinite(location.latitude)||!Number.isFinite(location.longitude))return false;seen.add(key);return due(location,now)}),status:TwinBackgroundLearningStatus={running:true,total:queue.length,completed:0,succeeded:0,failed:0,lastRunAt:now,message:queue.length?`${queue.length} Favoriten werden nacheinander aktualisiert.`:'Alle Favoriten sind bereits aktuell.'};writeStatus(status);if(!queue.length){writeStatus({...status,running:false,message:'Alle Favoriten sind bereits aktuell.'});return status}
 for(const location of queue){
  if(signal?.aborted)throw abortError();const key=locationKey(location),label=locationLabel(location);writeNumber(`${LAST_ATTEMPT_PREFIX}${key}`,Date.now());status.current=label;status.message=`Wetterzwilling für ${label} wird aktualisiert.`;writeStatus({...status});
  try{
   await restoreForecastVerificationArchive(key);
   const weather=await forecast(location.latitude,location.longitude,signal,{priority:'background'}),learningLocation:Location={...location,timezone:weather.timezone||location.timezone,elevation:Number.isFinite(location.elevation)?location.elevation:weather.elevation},days=mapDays(weather),hours=mapHours(weather);
   let ensembleDays:EnsembleDay[]=[];try{ensembleDays=(await ensembles(location.latitude,location.longitude,signal,'background')).days}catch(error){if(isOpenMeteoRateLimitError(error))throw error;ensembleDays=[]}
   recordForecastCapture(key,days,ensembleDays,learningLocation,hours);
   try{await refreshForecastReferences(key,learningLocation,signal)}catch(error){if(isOpenMeteoRateLimitError(error))throw error}
   writeNumber(`${LAST_SUCCESS_PREFIX}${key}`,Date.now());status.succeeded++;
  }catch(error){if(signal?.aborted){removeKey(`${LAST_ATTEMPT_PREFIX}${key}`);throw error}status.failed++;if(isOpenMeteoRateLimitError(error)){status.completed++;const deferred=Math.max(0,status.total-status.completed);const finalStatus={...status,running:false,current:undefined,lastRunAt:Date.now(),message:`Wetterdienst schützt vor zu vielen Abrufen. ${deferred?`${deferred} Favoriten werden später weitergeführt.`:'Der Favoritenabgleich wird später erneut versucht.'}`};writeStatus(finalStatus);return finalStatus}}
  status.completed++;status.message=`${status.completed} von ${status.total} Favoriten verarbeitet.`;writeStatus({...status});
  if(status.completed<status.total)await delay(BETWEEN_FAVORITES_MS,signal);
 }
 const finalStatus={...status,running:false,current:undefined,lastRunAt:Date.now(),message:status.failed?`${status.succeeded} Favoriten aktualisiert, ${status.failed} vorübergehend nicht erreichbar.`:`Alle ${status.succeeded} Favoriten wurden aktualisiert.`};writeStatus(finalStatus);return finalStatus;
}
