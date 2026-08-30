import {fetchWorkerJson,workerBaseCandidates} from './workerClient';
import {loadAndSampleRadolan} from './RadolanRasterSource';

export type DwdRsAnchor={leadMinutes:60|120;amountMm:number;nearbyAmountMm:number;nearestWetKm?:number;source:'DWD RS';confidence:'high'|'medium'};
export type DwdRsCalibration={available:boolean;observedAt?:string;anchors:DwdRsAnchor[];provider:string;product:string;ageMinutes?:number;error?:string};

type DwdRsMeta={coverage?:boolean;provider?:string;product?:string;observedAt?:string;frames?:{leadMinutes:number;fileUrl:string}[];error?:string};

export async function loadDwdRsCalibration(lat:number,lon:number,signal?:AbortSignal):Promise<DwdRsCalibration>{
 if(!workerBaseCandidates('radar').length)return{available:false,anchors:[],provider:'DWD',product:'RS',error:'DWD-RS-Datenquelle derzeit nicht verfügbar.'};
 try{
  const meta=await fetchWorkerJson<DwdRsMeta>('rs-meta',{lat,lon,_ts:Date.now()},{purpose:'radar',signal,timeoutMs:11000,maxAgeMs:90000,staleIfErrorMs:360000,cacheKey:`rs-meta:${lat.toFixed(3)}:${lon.toFixed(3)}`});
  const observed=Date.parse(meta.observedAt||''),ageMinutes=Number.isFinite(observed)?Math.round((Date.now()-observed)/60000):undefined;
  if(!meta.coverage||!meta.frames?.length||!Number.isFinite(observed)||Math.abs(Number(ageMinutes))>40)return{available:false,observedAt:meta.observedAt,anchors:[],provider:meta.provider||'DWD',product:meta.product||'RS',ageMinutes,error:meta.error||'Kein frischer DWD-RS-Lauf.'};
  const selected=meta.frames.filter(frame=>frame.leadMinutes===60||frame.leadMinutes===120).slice(0,2),settled=await Promise.allSettled(selected.map(async frame=>{const sample=await loadAndSampleRadolan(frame.fileUrl,lat,lon,signal);if(!sample.covered)throw new Error(`RS +${frame.leadMinutes} min deckt den Standort nicht ab.`);return{leadMinutes:frame.leadMinutes as 60|120,amountMm:Number(sample.amountMm.toFixed(3)),nearbyAmountMm:Number(sample.nearbyAmountMm.toFixed(3)),nearestWetKm:sample.nearestWetKm,source:'DWD RS' as const,confidence:'high' as const}})),anchors=settled.flatMap(result=>result.status==='fulfilled'?[result.value]:[]).sort((a,b)=>a.leadMinutes-b.leadMinutes);
  return{available:anchors.length>0,observedAt:meta.observedAt,anchors,provider:meta.provider||'DWD',product:meta.product||'RS',ageMinutes,error:anchors.length?'':settled.map(result=>result.status==='rejected'?(result.reason instanceof Error?result.reason.message:String(result.reason)):'').filter(Boolean).join(' · ')};
 }catch(error){if(signal?.aborted)throw error;return{available:false,anchors:[],provider:'DWD',product:'RS',error:error instanceof Error?error.message:String(error)}}
}
