import {fetchWorkerJson} from './workerClient';
import {loadAndSampleRadolan} from './RadolanRasterSource';

export type RadarHistoryProduct={
 mode:'single'|'sum';
 product:'RW'|'RY'|'SF';
 adjusted:boolean;
 label:string;
 observedAt:string;
 frames:{time:string;fileUrl:string}[];
};

type RadarHistoryMeta={
 coverage:boolean;
 provider:string;
 hour?:RadarHistoryProduct|null;
 day?:RadarHistoryProduct|null;
 license?:string;
 diagnostics?:Record<string,unknown>;
 error?:string;
};

export type RadarHistory={
 coverage:boolean;
 observedAt?:string;
 lastHourMm?:number;
 last24hMm?:number;
 hourProduct?:'RW'|'RY';
 dayProduct?:'SF';
 hourAdjusted?:boolean;
 dayAdjusted?:boolean;
 hourCompleteness?:number;
 provider:string;
 sourceText:string;
 diagnostics?:Record<string,unknown>;
};

const cache=new Map<string,{time:number;value:RadarHistory}>();
function key(lat:number,lon:number){return`${lat.toFixed(3)}:${lon.toFixed(3)}`}
function validAmount(value:number){return Number.isFinite(value)?Math.max(0,Math.min(500,value)):undefined}
async function sampleProduct(product:RadarHistoryProduct,lat:number,lon:number,signal?:AbortSignal){
 const frames=product.frames??[];
 if(!frames.length)return{amount:undefined,completeness:0};
 let cursor=0,successful=0,total=0;
 const workers=Array.from({length:Math.min(4,frames.length)},async()=>{while(cursor<frames.length){const frame=frames[cursor++];try{const sample=await loadAndSampleRadolan(frame.fileUrl,lat,lon,signal);if(sample.covered){successful++;total+=sample.amountMm}}catch(error){if(signal?.aborted)throw error}}});
 await Promise.all(workers);
 return{amount:successful?validAmount(total):undefined,completeness:frames.length?successful/frames.length:0};
}

export async function radarHistory(lat:number,lon:number,signal?:AbortSignal):Promise<RadarHistory|null>{
 const cacheKey=key(lat,lon),cached=cache.get(cacheKey);if(cached&&Date.now()-cached.time<5*60000)return cached.value;
 const meta=await fetchWorkerJson<RadarHistoryMeta>('radolan-history-meta',{lat,lon,_ts:Date.now()},{purpose:'radar',signal,timeoutMs:9000});
 if(!meta.coverage||(!meta.hour&&!meta.day))return null;
 const [hourResult,dayResult]=await Promise.allSettled([meta.hour?sampleProduct(meta.hour,lat,lon,signal):Promise.resolve({amount:undefined,completeness:0}),meta.day?sampleProduct(meta.day,lat,lon,signal):Promise.resolve({amount:undefined,completeness:0})]);
 const hour=hourResult.status==='fulfilled'?hourResult.value:{amount:undefined,completeness:0},day=dayResult.status==='fulfilled'?dayResult.value:{amount:undefined,completeness:0},observedAt=[meta.hour?.observedAt,meta.day?.observedAt].filter(Boolean).sort().at(-1),parts=[] as string[];
 if(meta.hour)parts.push(`${meta.hour.product}${meta.hour.adjusted?' angeeicht':' nicht angeeicht'}`);
 if(meta.day)parts.push(`${meta.day.product}${meta.day.adjusted?' angeeicht':' nicht angeeicht'}`);
 const value:RadarHistory={coverage:true,observedAt,lastHourMm:hour.amount,last24hMm:day.amount,hourProduct:meta.hour?.product as 'RW'|'RY'|undefined,dayProduct:meta.day?.product as 'SF'|undefined,hourAdjusted:meta.hour?.adjusted,dayAdjusted:meta.day?.adjusted,hourCompleteness:hour.completeness,provider:meta.provider||'DWD RADOLAN',sourceText:parts.length?`DWD RADOLAN · ${parts.join(' · ')}`:'DWD RADOLAN',diagnostics:{...(meta.diagnostics||{}),hourCompleteness:hour.completeness,hourError:hourResult.status==='rejected'?String(hourResult.reason):undefined,dayError:dayResult.status==='rejected'?String(dayResult.reason):undefined}};
 cache.set(cacheKey,{time:Date.now(),value});return value;
}
