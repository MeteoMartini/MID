import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const concat=async(paths)=>{const parts=await Promise.all(paths.map(path=>readFile(new URL(path,root),'utf8')));return parts.join('')};
const styles=await concat(['src/styles-src/00-foundation.css','src/styles-src/10-features.css','src/styles-src/20-ensemble-composite.css','src/styles-src/25-extreme-outlook.css','src/styles-src/30-modern.css']);
await writeFile(new URL('src/styles.css',root),styles);
const weather=await concat(['src/weather-src/00-types-models-search.tsfrag','src/weather-src/10-observations-specialized.tsfrag','src/weather-src/20-mapping-day-character.tsfrag','src/weather-src/30-ensemble-climate-hazards.tsfrag']);
await writeFile(new URL('src/weather.ts',root),weather);
const extremeOutlookSource=await readFile(new URL('worker-src/25-dach-extreme-outlook.js',root),'utf8');
const worker=await concat(['worker-src/00-core-observations.js','worker-src/10-radar-nowcast.js','worker-src/20-composite-models.js','worker-src/25-dach-extreme-outlook.js','worker-src/30-push-events.js','worker-src/40-aviation-router.js']);
await writeFile(new URL('worker/metar-proxy.js',root),worker);
await writeFile(new URL('worker.js',root),worker);
const directPrelude=`/* Generated from worker-src/25-dach-extreme-outlook.js. Do not edit directly. */
import {guardedOpenMeteoFetch} from './openMeteoGuard';
import {MID_VERSION} from './version';

const OPEN_METEO_ENSEMBLE='https://ensemble-api.open-meteo.com/v1/ensemble';
const WORKER_VERSION=MID_VERSION;
let directRequestSignal;
function number(value){if(value===null||value===undefined||value==='')return undefined;const parsed=Number(value);return Number.isFinite(parsed)?parsed:undefined}
function clamp(value,minimum,maximum){return Math.max(minimum,Math.min(maximum,value))}
function openMeteoRows(data){return Array.isArray(data)?data:Array.isArray(data?.results)?data.results:[data]}
function directAbortReason(signal){return signal?.reason instanceof Error?signal.reason:new DOMException('Vorgang abgebrochen.','AbortError')}
async function fetchWithDeadline(url,init={},timeoutMs=22000){
 const controller=new AbortController(),parent=directRequestSignal,onAbort=()=>controller.abort(directAbortReason(parent)),timer=setTimeout(()=>controller.abort(new DOMException('Direktabruf-Zeitüberschreitung.','TimeoutError')),timeoutMs),headers=new Headers(init.headers||{}),{cf:unusedCf,...safeInit}=init;void unusedCf;headers.delete('User-Agent');
 if(parent?.aborted)onAbort();else parent?.addEventListener('abort',onAbort,{once:true});
 try{return await guardedOpenMeteoFetch(url,{...safeInit,headers,cache:'no-store',signal:controller.signal},{priority:'normal',maxRetries:0})}finally{clearTimeout(timer);parent?.removeEventListener('abort',onAbort)}
}
`;
const directEpilogue=`
export async function loadDirectDachExtremeOutlook(signal){
 if(signal?.aborted)throw directAbortReason(signal);
 directRequestSignal=signal;
 try{return{...await dachExtremeOutlookData('fallback'),version:MID_VERSION,delivery:'browser-direct'}}finally{if(directRequestSignal===signal)directRequestSignal=undefined}
}
`;
const directModule=directPrelude+extremeOutlookSource+directEpilogue;
await writeFile(new URL('src/extremeWeatherOutlookDirect.generated.js',root),directModule);
console.log(`Maintenance aggregates synchronized: styles ${styles.length} chars, weather ${weather.length} chars, worker ${worker.length} chars, direct outlook ${directModule.length} chars.`);
