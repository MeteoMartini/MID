// MID Data 1.2: explicit, bounded, read-only original-provider run-pinned RUC canary.
// No production activation, no persistent writes, no retries, no new credentials.
import {buildSingleRunUrl,qualifyRunPinnedRuc,validateRunMetadata} from './openmeteo_ruc_single_run_shadow.mjs';
export const META_URL='https://api.open-meteo.com/data/dwd_icon_d2_ruc_native/static/meta.json';
export async function runSingleRunCanary({lat,lon,nowMs,fetchJson}){
 if(typeof fetchJson!=='function')throw Error('read-only JSON fetch required');
 // Build URL from strictly validated coordinates before querying the provider.
 const preflightClock=nowMs===undefined?Date.now():nowMs;
 const preflightRun=new Date(preflightClock).toISOString().slice(0,13)+':00';
 buildSingleRunUrl({run:preflightRun,lat,lon});
 const metadata=await fetchJson(META_URL),init=metadata?.last_run_initialisation_time;
 if(!Number.isSafeInteger(init)||init<=0)throw Error('missing Open-Meteo RUC run metadata');
 const requestedRun=new Date(init*1000).toISOString().slice(0,16);
 // Reject inadmissible metadata before the weighted forecast call; recheck after it.
 validateRunMetadata({requestedRun,metadata,nowMs:nowMs===undefined?Date.now():nowMs});
 const url=buildSingleRunUrl({run:requestedRun,lat,lon});
 const payload=await fetchJson(url);
 const checkedAt=nowMs===undefined?Date.now():nowMs;
 const candidate=qualifyRunPinnedRuc({requestedRun,lat,lon,metadata,payload,nowMs:checkedAt});
 return{schema:'mid.ruc.openmeteo.runpin-canary.v1',checkedAt:new Date(checkedAt).toISOString(),
  model: candidate.modelId,run:candidate.requestedRun,provider:candidate.provider,
  originModel:candidate.originModel,expectedHours:candidate.expectedHours,
  maxCoreLeadHours:candidate.maxCoreLeadHours,fieldValidCounts:candidate.fieldValidCounts,
  fieldMissingCounts:candidate.fieldMissingCounts,sampledLocation:candidate.sampledLocation,
  providerRunPinned:true,nativeDwdGribVerified:false,epsAvailable:false,
  commercialUseAuthorized:false,publicationAuthorized:false};
}
async function boundedJson(url){
 if(url!==META_URL&&!url.startsWith('https://single-runs-api.open-meteo.com/v1/forecast?'))
  throw Error('provider URL not allowlisted');
 const maxBytes=url===META_URL?32768:131072;
 const response=await fetch(url,{signal:AbortSignal.timeout(14000),redirect:'error',cache:'no-store',
  headers:{Accept:'application/json','User-Agent':'MID-Data-RUC-runpin-QA/1.0'}});
 if(!response.ok)throw Error('original provider HTTP '+response.status);
 if(!String(response.headers.get('content-type')||'').toLowerCase().includes('json'))throw Error('provider unexpected content type');
 if(!response.body)throw Error('provider empty response stream');
 const reader=response.body.getReader(),pieces=[];let total=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;
  if(total>maxBytes){await reader.cancel().catch(()=>{});throw Error('provider response exceeds strict byte budget')}pieces.push(value)}}
 finally{reader.releaseLock()}
 const bytes=new Uint8Array(total);let offset=0;
 for(const piece of pieces){bytes.set(piece,offset);offset+=piece.byteLength}
 try{return JSON.parse(new TextDecoder().decode(bytes))}catch{throw Error('provider invalid JSON')}
}
if(process.argv[1]?.endsWith('/openmeteo_ruc_single_run_canary.mjs')){
 if(process.argv.length!==4)throw Error('usage: node tools/ruc/openmeteo_ruc_single_run_canary.mjs <latitude> <longitude>');
 const lat=Number(process.argv[2]),lon=Number(process.argv[3]);
 const report=await runSingleRunCanary({lat,lon,fetchJson:boundedJson});
 process.stdout.write(JSON.stringify(report)+'\n');
}
