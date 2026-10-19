import {loadExtendedExtremeWeatherOutlook,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

const PREFIX='mid:extreme-outlook:';
const PAYLOAD_PREFIX=`${PREFIX}extended-payload:`;
const CACHE_KEY=`${PAYLOAD_PREFIX}v4`;
const WORKER_LIMIT_KEY=`${PREFIX}worker-limit-until:v1`;
const FRESH_MS=3*60*60*1000;
const STALE_MS=24*60*60*1000;

function storage(){try{return typeof localStorage==='undefined'?undefined:localStorage}catch{return undefined}}
function valid(value:unknown):value is ExtremeWeatherOutlook{const data=value as ExtremeWeatherOutlook|undefined,bounds=data?.grid?.bounds,coverage=Number(data?.quality?.dataCoveragePct??100);return Boolean(data&&data.scope==='Mitteleuropa'&&data.periods?.length&&data.cells?.length&&data.grid?.pointCount&&coverage>=60&&bounds&&bounds.west<=-3.84&&bounds.east>=20.2&&bounds.south<=43.2&&bounds.north>=57.99&&data.thresholds?.probability)}
function read(maxAgeMs:number){const s=storage();if(!s)return;const data=readStoredJsonCache<ExtremeWeatherOutlook>(s,CACHE_KEY,maxAgeMs);return valid(data)?data:undefined}
function write(value:ExtremeWeatherOutlook){const s=storage();if(s)writeStoredJsonCache(s,CACHE_KEY,value,[PAYLOAD_PREFIX],1,STALE_MS)}
function abortReason(signal?:AbortSignal){return signal?.reason instanceof Error?signal.reason:new DOMException('Vorgang abgebrochen.','AbortError')}
function aborted(signal?:AbortSignal){if(signal?.aborted)throw abortReason(signal)}
function errorText(error:unknown){return error instanceof Error?error.message:String(error||'')}
function dailyLimit(error:unknown){return/(?:daily api request limit exceeded|try again tomorrow|t[aä]gliches? (?:api-)?(?:anfrage|aufruf|request)[ -]?(?:limit|kontingent)|tageskontingent)/i.test(errorText(error))}
function limitUntil(){try{const value=Number(storage()?.getItem(WORKER_LIMIT_KEY));return Number.isFinite(value)&&value>Date.now()?value:0}catch{return 0}}
function rememberLimit(){const s=storage();if(!s)return;const now=new Date(),until=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1,0,15);try{s.setItem(WORKER_LIMIT_KEY,String(until))}catch{}}
function clearLimit(){try{storage()?.removeItem(WORKER_LIMIT_KEY)}catch{}}

// Kept as a tiny compatibility shim; the worker/cache path now lives in the stable main module.
export async function loadExtendedExtremeWeatherOutlookFallback(signal?:AbortSignal):Promise<ExtremeWeatherOutlook>{
 return loadExtendedExtremeWeatherOutlook(signal);
}
