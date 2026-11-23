// Read-only, bounded WMS delivery audit. Execute only from an authorized
// network/CI environment; it never triggers GitHub workflows or production writes.
// Default probes the actual canonical production same-origin Worker route.
// Example: MID_MAP_AUDIT_LIMIT=50 node scripts/audit-weather-map-live.mjs
// PNG transport admission is NOT proof of meteorological coverage or WebGL pixels.
import {setTimeout as sleep} from 'node:timers/promises';
import {MAP_AUDIT_MAX_IMAGE_BYTES,selectMapAuditFrame,validateMapAuditPng} from './weather-map-audit-admission.mjs';

const base=new URL(process.env.MID_MAP_AUDIT_BASE||'https://www.midwx.app/api/mid-worker');
if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('Audit requires a credential-free HTTPS Worker endpoint');
const max=Math.min(90,Math.max(1,Number.parseInt(process.env.MID_MAP_AUDIT_LIMIT||'50',10)||50));
const results=[];
function endpoint(mode,params={}){
 const url=new URL(base);
 url.searchParams.set('mode',mode);
 for(const [key,value] of Object.entries(params))if(value!==undefined&&value!==null&&value!=='')url.searchParams.set(key,String(value));
 return url;
}
async function get(url){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
 try{return await fetch(url,{signal:controller.signal,headers:{Accept:'application/json,image/png'}})}finally{clearTimeout(timer)}
}
async function boundedBytes(response){
 const length=Number(response.headers.get('content-length'));
 if(Number.isFinite(length)&&length>MAP_AUDIT_MAX_IMAGE_BYTES){await response.body?.cancel().catch(()=>{});throw Error('PNG response exceeds image byte budget')}
 const reader=response.body?.getReader();if(!reader)throw Error('Image response body missing');
 const chunks=[];let size=0;
 let timedOut=false;const timer=setTimeout(()=>{timedOut=true;void reader.cancel().catch(()=>{})},12000);
 try{
  for(;;){const{done,value}=await reader.read();if(done)break;
   size+=value.length;
   if(size>MAP_AUDIT_MAX_IMAGE_BYTES){await reader.cancel();throw Error('PNG stream exceeds image byte budget')}
   chunks.push(value);
  }
 }finally{clearTimeout(timer);reader.releaseLock()}
 if(timedOut)throw Error('PNG body read timeout');
 const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length}return bytes;
}
function bbox(){
 const p=(lon,lat)=>[6378137*lon*Math.PI/180,6378137*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
 const a=p(5,46),b=p(16,56);return[a[0],a[1],b[0],b[1]].join(',');
}
const capResponse=await get(endpoint('weather-map-catalog'));
if(!capResponse.ok)throw Error('MID Worker catalog HTTP '+capResponse.status);
const cap=await capResponse.json();
if(cap.schema!=='mid.weather-map-catalog.v1'||!cap.providers||typeof cap.providers!=='object'||!cap.layers||typeof cap.layers!=='object'||!Number.isFinite(Date.parse(cap.checkedAt||'')))throw Error('Unknown/incomplete MID map catalog');
const observedAt=Date.now(),providerStates=Object.fromEntries(['dwd','geomet'].map(id=>[id,cap.providers[id]||'unchecked']));
for(const [layer,entry] of Object.entries(cap.layers)){
 if(results.length>=max)break;
 const row={layer,catalog:entry?.status||'unknown',provider:layer.startsWith('GDPS_')?'geomet':'dwd',checkedAt:cap.checkedAt,probe:'not-tested'};
 if(providerStates[row.provider]!=='verified'){row.probe='provider-unchecked';results.push(row);continue}
 if(entry?.status!=='listed'){row.probe='not-in-current-capabilities';results.push(row);continue}
 try{
  const metaResponse=await get(endpoint('weather-map-metadata',{layer}));
  if(!metaResponse.ok)throw Error('metadata HTTP '+metaResponse.status);
  const m=await metaResponse.json();
  if(m.layer!==layer||m.error)throw Error('provider layer/metadata mismatch');
  row.timeCount=Array.isArray(m.times)?m.times.length:0;
  row.runCount=Array.isArray(m.referenceTimes)?m.referenceTimes.length:0;
  row.levelCount=Array.isArray(m.elevations)?m.elevations.length:0;
  const picked=selectMapAuditFrame({layer,metadata:m,entry,now:observedAt});
  if(!picked.ok){row.probe='unverified-time-or-run';row.reason=picked.reason;results.push(row);continue}
  row.validTime=picked.time||null;row.modelRun=picked.run||null;row.level=picked.elevation??null;row.accumulationHours=picked.windowHours;
  const params={service:'WMS',request:'GetMap',version:'1.1.1',layers:layer,styles:'',format:'image/png',transparent:'true',srs:'EPSG:3857',bbox:bbox(),width:256,height:256,...(picked.time?{time:picked.time}:{}),...(picked.run?{dim_reference_time:picked.run}:{}),...(picked.elevation!==undefined?{elevation:picked.elevation}:{})};
  const response=await get(endpoint('weather-map-wms',{provider:row.provider,...params}));
  row.http=response.status;row.workerVersion=response.headers.get('x-mid-worker-version')||null;row.contentType=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(!response.ok){row.probe='invalid-image-or-http';row.reason='GetMap HTTP '+response.status;await response.body?.cancel();results.push(row);await sleep(200);continue}
  if(row.contentType!=='image/png'){row.probe='invalid-image-or-http';row.reason='non-PNG response';await response.body?.cancel();results.push(row);await sleep(200);continue}
  const admitted=validateMapAuditPng(await boundedBytes(response));
  row.bytes=admitted.bytes??null;row.dimensions=admitted.ok?[admitted.width,admitted.height]:null;
  row.probe=admitted.ok?'valid-png-response':'invalid-image-or-http';
  if(!admitted.ok)row.reason=admitted.reason;
  // Valid PNG may be all transparent or georeferenced incorrectly. Never report
  // an original meteorological field, dry weather or rendered MapLibre pixels.
 }catch(error){row.probe='provider-or-transport-error';row.reason=String(error instanceof Error?error.message:error).slice(0,160)}
 results.push(row);
 await sleep(200);
}
const tested=results.filter(x=>x.probe==='valid-png-response').length;
const summary={schema:'mid.weather-map-live-audit.v2',version:cap.version,checkedAt:new Date().toISOString(),source:{origin:base.origin,path:base.pathname},providers:providerStates,scanned:results.length,totalAdvertised:Object.keys(cap.layers).length,
 complete:results.length===Object.keys(cap.layers).length&&Object.values(providerStates).every(x=>x==='verified')&&results.every(x=>['valid-png-response','not-in-current-capabilities'].includes(x.probe)),
 verifiedPng:tested,invalidImage:results.filter(x=>x.probe==='invalid-image-or-http').length,unknown:results.filter(x=>['provider-unchecked','provider-or-transport-error','unverified-time-or-run'].includes(x.probe)).length,
 evidenceScope:'WMS PNG decoded structure only, NOT an original field / pixel / coverage / model quality / browser GPU proof',
 note:'Bounded sequential 256px WMS transport probe; missing weather must not be treated as zero. Full native DWD/RUC/IFS/GFS, MapLibre and iOS QA require distinct tests.',results};
console.log(JSON.stringify(summary,null,2));
