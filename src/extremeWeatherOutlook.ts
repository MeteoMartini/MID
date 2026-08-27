import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';
import {loadDirectDachExtremeOutlook} from './extremeWeatherOutlookDirect.generated.js';
import {fetchWorkerJson} from './workerClient';

export type ExtremeHazardKind='thunderstorm'|'rain'|'wind'|'snow'|'ice';
export type ExtremeHazardId='overall'|ExtremeHazardKind;

export type ExtremeOutlookSignal={
 intensity:1|2|3|4;
 intensityLabel:string;
 probability:number;
 probabilityBand:'P0'|'P1'|'P2'|'P3'|'P4';
 drivers:string[];
 subhazards:string[];
 metrics:Record<string,number|string|undefined>;
};

export type ExtremeOutlookCellPeriod={
 hazards:Partial<Record<ExtremeHazardKind,ExtremeOutlookSignal>>;
 probabilityFields?:Partial<Record<ExtremeHazardKind,[number,number,number,number]>>;
 dominant?:ExtremeHazardKind;
};

export type ExtremeOutlookCell={
 id:string;
 row:number;
 col:number;
 lat:number;
 lon:number;
 region:string;
 elevationM:number;
 periods:Record<string,ExtremeOutlookCellPeriod>;
};

export type ExtremeOutlookPeriod={
 id:string;
 label:string;
 startHour:number;
 endHour:number;
 start:string;
 end:string;
};

export type ExtremeOutlookThresholds={
 probability:{bands:Array<{id:string;min:number;max:number;label:string}>;overviewMin:number;hazardMin:number;extremeExceptionMin:number};
 intensity:{levels:Array<{id:number;label:string}>};
 rain:{unit:string;windows:number[];levels:Array<{intensity:number;values:Record<string,number>}>};
 wind:{unit:string;terrainBands:Array<{id:string;label:string;maxElevationM:number|null;levels:number[]}>};
 snow:{unit:string;windows:number[];terrainMultipliers:Record<string,number>;levels:Array<{intensity:number;values:Record<string,number>}>};
 ice:{unit:string;levels:Array<{intensity:number;value:number;durationHours?:number}>};
 thunderstorm:{capeJkg:number[];lapseRateKkm:number[];shearMs:number[];hailCm:number[];note:string};
};

export type ExtremeWeatherOutlook={
 scope:'Mitteleuropa';
 provider:string;
 model:string;
 modelRun?:string;
 checkedAt:string;
 version?:string;
 delivery?:'worker'|'browser-direct'|'local-cache';
 fallbackReason?:string;
 stale?:boolean;
 staleReason?:string;
 partial?:boolean;
 partialReason?:string;
 officialWarning:false;
 periods:ExtremeOutlookPeriod[];
 cells:ExtremeOutlookCell[];
 grid:{rows:number;cols:number;latStep:number;lonStep:number;pointCount:number;availablePointCount?:number;bounds:{south:number;west:number;north:number;east:number};analysisBounds?:{south:number;west:number;north:number;east:number}};
 thresholds:ExtremeOutlookThresholds;
 quality:{ensembleMembers:number;probabilityMethod:string;modelResolution:string;displayGrid:string;dataCoveragePct?:number;diagnosticCoveragePct:number;limitations:string[]};
 error?:string;
};

export type ResolvedExtremeSignal=ExtremeOutlookSignal&{hazard:ExtremeHazardKind};

export const EXTREME_HAZARDS:Array<{id:ExtremeHazardId;label:string;shortLabel:string;description:string}>=[
 {id:'overall',label:'Gesamtlage',shortLabel:'Gesamt',description:'Je Rasterfeld das stärkste Signal'},
 {id:'thunderstorm',label:'Gewitter',shortLabel:'Gewitter',description:'Konvektion, Hagel, Downburst und Gewitterregen'},
 {id:'rain',label:'Stark-/Dauerregen',shortLabel:'Regen',description:'1-, 6- und 24-Stunden-Niederschlag'},
 {id:'wind',label:'Sturm',shortLabel:'Sturm',description:'Böen mit höhenabhängiger Exposition'},
 {id:'snow',label:'Schnee',shortLabel:'Schnee',description:'Neuschnee in 6 und 24 Stunden'},
 {id:'ice',label:'Glätte/Eisregen',shortLabel:'Eisregen',description:'Gefrierender Niederschlag und Glatteiswirkung'}
];

export const EXTREME_INTENSITY_COLORS:Record<1|2|3|4,string>={1:'#f4d03f',2:'#f08a24',3:'#d9363e',4:'#8f174f'};
export const EXTREME_INTENSITY_LABELS:Record<1|2|3|4,string>={1:'Wettergefahr',2:'markante Wettergefahr',3:'Unwetterpotenzial',4:'extremes Unwetterpotenzial'};
export function extremeProbabilityBand(probability:number):ExtremeOutlookSignal['probabilityBand']{const rounded=Math.max(0,Math.min(100,Math.round(Number(probability)||0)));return rounded>=80?'P4':rounded>=60?'P3':rounded>=30?'P2':rounded>=10?'P1':'P0'}

const OUTLOOK_CACHE_PREFIX='mid:extreme-outlook:';
const OUTLOOK_PAYLOAD_PREFIX=`${OUTLOOK_CACHE_PREFIX}payload:`;
const OUTLOOK_CACHE_KEY=`${OUTLOOK_PAYLOAD_PREFIX}v5`;
const WORKER_LIMIT_KEY=`${OUTLOOK_CACHE_PREFIX}worker-limit-until:v1`;
const OUTLOOK_FRESH_MS=20*60*1000;
const OUTLOOK_STALE_MS=12*60*60*1000;

function browserStorage(){try{return typeof localStorage==='undefined'?undefined:localStorage}catch{return undefined}}
function validOutlook(value:unknown):value is ExtremeWeatherOutlook{const data=value as ExtremeWeatherOutlook|undefined,bounds=data?.grid?.bounds;const coverage=Number(data?.quality?.dataCoveragePct??100);return Boolean(data&&data.scope==='Mitteleuropa'&&Array.isArray(data.periods)&&data.periods.length&&Array.isArray(data.cells)&&data.cells.length&&data.grid?.pointCount&&coverage>=60&&bounds&&bounds.west<=-3.84&&bounds.east>=20.2&&bounds.south<=43.2&&bounds.north>=57.99&&data.thresholds?.probability)}
function readOutlookCache(maxAgeMs:number){const storage=browserStorage();if(!storage)return undefined;const value=readStoredJsonCache<ExtremeWeatherOutlook>(storage,OUTLOOK_CACHE_KEY,maxAgeMs);return validOutlook(value)?value:undefined}
function writeOutlookCache(value:ExtremeWeatherOutlook){const storage=browserStorage();if(!storage)return;writeStoredJsonCache(storage,OUTLOOK_CACHE_KEY,value,[OUTLOOK_PAYLOAD_PREFIX],2,OUTLOOK_STALE_MS)}
function errorText(error:unknown){return error instanceof Error?error.message:String(error||'unbekannter Fehler')}
function abortReason(signal?:AbortSignal){return signal?.reason instanceof Error?signal.reason:new DOMException('Vorgang abgebrochen.','AbortError')}
function throwIfAborted(signal?:AbortSignal){if(signal?.aborted)throw abortReason(signal)}
function dailyWorkerLimit(error:unknown){return/(?:daily api request limit exceeded|try again tomorrow|t[aä]gliches? (?:api-)?(?:anfrage|aufruf|request)[ -]?(?:limit|kontingent)|tageskontingent)/i.test(errorText(error))}
function storedWorkerLimitUntil(){try{const storage=browserStorage();if(!storage)return 0;const value=Number(storage.getItem(WORKER_LIMIT_KEY));return Number.isFinite(value)&&value>Date.now()?value:0}catch{return 0}}
function rememberWorkerLimit(){const storage=browserStorage();if(!storage)return;const now=new Date(),until=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1,0,15);try{storage.setItem(WORKER_LIMIT_KEY,String(until))}catch{}}
function clearWorkerLimit(){try{browserStorage()?.removeItem(WORKER_LIMIT_KEY)}catch{}}
function directFallbackReason(error:unknown,skipped=false){return skipped||dailyWorkerLimit(error)?'Das Tageskontingent des zentralen MID-Datenwegs ist erreicht. Die aktuelle Prognose wurde kostenfrei direkt im Browser aus ICON-D2-EPS und ICON-D2 berechnet.':'Der zentrale MID-Datenweg war vorübergehend nicht erreichbar. Die aktuelle Prognose wurde kostenfrei direkt im Browser aus ICON-D2-EPS und ICON-D2 berechnet.'}

export async function loadExtremeWeatherOutlook(signal?:AbortSignal):Promise<ExtremeWeatherOutlook>{
 throwIfAborted(signal);
 const fresh=readOutlookCache(OUTLOOK_FRESH_MS);if(fresh)return{...fresh,delivery:'local-cache'};
 const workerSkipped=storedWorkerLimitUntil()>Date.now();let workerError:unknown=workerSkipped?new Error('MID-Worker-Tageskontingent lokal vorgemerkt.'):undefined;
 if(!workerSkipped){
  try{
   const worker=await fetchWorkerJson<ExtremeWeatherOutlook>('dach-extreme-outlook',{}, {purpose:'general',signal,timeoutMs:48000,maxAgeMs:30*60*1000,staleIfErrorMs:6*60*60*1000,cacheKey:'dach-extreme-outlook:v5'});
   if(worker.error)throw new Error(worker.error);if(!validOutlook(worker))throw new Error('Der MID-Worker lieferte keinen vollständigen Mitteleuropa-Ausblick über das ICON-D2-Gebiet.');
   const result={...worker,delivery:'worker' as const};clearWorkerLimit();writeOutlookCache(result);return result;
  }catch(error){throwIfAborted(signal);workerError=error;if(dailyWorkerLimit(error))rememberWorkerLimit()}
 }
 try{
  const direct=await loadDirectDachExtremeOutlook(signal);throwIfAborted(signal);if(!validOutlook(direct))throw new Error('Der Direktabruf lieferte keinen vollständigen Mitteleuropa-Ausblick über das ICON-D2-Gebiet.');
  const result={...direct,delivery:'browser-direct' as const,fallbackReason:directFallbackReason(workerError,workerSkipped)};writeOutlookCache(result);return result;
 }catch(directError){
  throwIfAborted(signal);const stale=readOutlookCache(OUTLOOK_STALE_MS);if(stale)return{...stale,delivery:'local-cache',stale:true,staleReason:'Worker und Direktabruf sind vorübergehend nicht erreichbar; der letzte lokal gesicherte Ausblick wird weiter angezeigt.'};
  void workerError;void directError;throw new Error('Der zentrale MID-Datenweg und der kostenfreie Direktabruf von ICON-D2-EPS sind momentan nicht erreichbar. Bitte später erneut versuchen; ein vorhandener Ausblick wird künftig automatisch lokal als Ausfallsicherung vorgehalten.');
 }
}

export function extremeSignalForCell(cell:ExtremeOutlookCell,periodId:string,hazard:ExtremeHazardId):ResolvedExtremeSignal|null{
 const period=cell.periods?.[periodId];if(!period)return null;
 if(hazard!=='overall'){const signal=period.hazards?.[hazard];return signal?{...signal,hazard}:null}
 const entries=Object.entries(period.hazards||{}) as Array<[ExtremeHazardKind,ExtremeOutlookSignal]>;
 const selected=entries.sort((a,b)=>b[1].intensity-a[1].intensity||b[1].probability-a[1].probability)[0];
 return selected?{...selected[1],hazard:selected[0]}:null;
}

export function extremeSignalVisible(signal:ResolvedExtremeSignal|null,hazard:ExtremeHazardId,thresholds:ExtremeOutlookThresholds){
 if(!signal)return false;
 const minimum=hazard==='overall'?thresholds.probability.overviewMin:thresholds.probability.hazardMin;
 return signal.probability>=minimum||signal.intensity===4&&signal.probability>=thresholds.probability.extremeExceptionMin;
}

export function extremeProbabilityLevelsForCell(cell:ExtremeOutlookCell,periodId:string,hazard:ExtremeHazardId):[number,number,number,number]{
 const period=cell.periods?.[periodId],fields=period?.probabilityFields;
 if(fields){
  const values=hazard==='overall'?([0,1,2,3].map(index=>Math.max(0,...Object.values(fields).map(levels=>Number(levels?.[index])||0))) as [number,number,number,number]):fields[hazard];
  if(values){const monotone=[...values].map(value=>Math.max(0,Math.min(100,Number(value)||0))) as [number,number,number,number];for(let index=1;index<monotone.length;index++)monotone[index]=Math.min(monotone[index-1],monotone[index]);return monotone}
 }
 const signal=extremeSignalForCell(cell,periodId,hazard);if(!signal)return[0,0,0,0];
 return[1,2,3,4].map(level=>level<=signal.intensity?signal.probability:0) as [number,number,number,number];
}

export function extremeProbabilityOpacity(probability:number){return probability>=80?.82:probability>=60?.7:probability>=30?.54:probability>=10?.4:.3}

export function strongestExtremeRegions(data:ExtremeWeatherOutlook,periodId:string,hazard:ExtremeHazardId,limit=8){
 const regions=new Map<string,{cell:ExtremeOutlookCell;signal:ResolvedExtremeSignal}>();
 for(const cell of data.cells){const signal=extremeSignalForCell(cell,periodId,hazard);if(!extremeSignalVisible(signal,hazard,data.thresholds)||!signal)continue;const current=regions.get(cell.region);if(!current||signal.intensity>current.signal.intensity||signal.intensity===current.signal.intensity&&signal.probability>current.signal.probability)regions.set(cell.region,{cell,signal})}
 return [...regions.values()].sort((a,b)=>b.signal.intensity-a.signal.intensity||b.signal.probability-a.signal.probability).slice(0,limit);
}
