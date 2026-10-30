// Read-only, bounded WMS delivery audit. Run from a trusted environment with
// MID_MAP_AUDIT_BASE=https://mid-data-proxy.midwx.workers.dev/ node scripts/audit-weather-map-live.mjs
// No report is promoted to production or used to delete products automatically.
import {setTimeout as sleep} from 'node:timers/promises';

const base=new URL(process.env.MID_MAP_AUDIT_BASE||'https://mid-data-proxy.midwx.workers.dev/');
if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('Audit requires a credential-free HTTPS Worker root');
const max=Math.min(90,Math.max(1,Number.parseInt(process.env.MID_MAP_AUDIT_LIMIT||'50',10)||50));
const queries=[],results=[];
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
function bbox(){
 const p=(lon,lat)=>[6378137*lon*Math.PI/180,6378137*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
 const a=p(5,46),b=p(16,56);return[a[0],a[1],b[0],b[1]].join(',');
}
function png(buf){
 return buf.length>=24&&buf[0]===137&&buf[1]===80&&buf[2]===78&&buf[3]===71&&buf[4]===13&&buf[5]===10&&buf[6]===26&&buf[7]===10;
}
const capResponse=await get(endpoint('weather-map-catalog'));
if(!capResponse.ok)throw Error('MID Worker catalog HTTP '+capResponse.status);
const cap=await capResponse.json();
if(cap.schema!=='mid.weather-map-catalog.v1')throw Error('Unknown MID map catalog schema');
for(const [layer,entry] of Object.entries(cap.layers||{})){
 if(results.length>=max)break;
 const row={layer,catalog:entry.status,provider:layer.startsWith('GDPS_')?'geomet':'dwd',checkedAt:cap.checkedAt,probe:'not-tested'};
 if(entry.status!=='listed'){row.probe='not-in-current-capabilities';results.push(row);continue}
 try{
  const metaResponse=await get(endpoint('weather-map-metadata',{layer}));
  if(!metaResponse.ok)throw Error('metadata HTTP '+metaResponse.status);
  const m=await metaResponse.json();
  if(m.layer!==layer)throw Error('provider layer mismatch');
  const times=Array.isArray(m.times)?m.times:[],runs=Array.isArray(m.referenceTimes)?m.referenceTimes:[],levels=Array.isArray(m.elevations)?m.elevations:[];
  row.timeCount=times.length;row.runCount=runs.length;row.levelCount=levels.length;
  const forecast=Boolean(entry.timeCount)||Boolean(entry.referenceCount);
  const params={service:'WMS',request:'GetMap',version:'1.1.1',layers:layer,styles:'',format:'image/png',transparent:'true',srs:'EPSG:3857',bbox:bbox(),width:256,height:256,...(times.length?{time:times.at(-1)}:{}),...(runs.length?{dim_reference_time:runs.at(-1)}:{}),...(levels.length?{elevation:levels[0]}:{})};
  if(forecast&&(!times.length||!runs.length)){row.probe='unverified-time-or-run';results.push(row);continue}
  const response=await get(endpoint('weather-map-wms',{provider:row.provider,...params}));
  const bytes=new Uint8Array(await response.arrayBuffer());
  row.http=response.status;row.bytes=bytes.length;row.probe=response.ok&&png(bytes)?'valid-png-response':'invalid-image-or-http';
  // A valid PNG may legitimately be all transparent (dry NowCast / no storms).
  // Therefore it is NEVER interpreted as a nonempty meteorological field.
 }catch(error){row.probe='provider-or-transport-error';row.reason=String(error instanceof Error?error.message:error).slice(0,160)}
 results.push(row);
 await sleep(200);
}
const summary={schema:'mid.weather-map-live-audit.v1',version:cap.version,checkedAt:new Date().toISOString(),providers:cap.providers,scanned:results.length,totalAdvertised:Object.keys(cap.layers||{}).length,
 verifiedPng:results.filter(x=>x.probe==='valid-png-response').length,invalidImage:results.filter(x=>x.probe==='invalid-image-or-http').length,unknown:results.filter(x=>['provider-or-transport-error','unverified-time-or-run'].includes(x.probe)).length,
 note:'Read-only center-Europe 256px sample; PNG alone does not prove nonempty signal, full native model coverage, all levels or lead times. No product is removed from this report automatically.',results};
console.log(JSON.stringify(summary,null,2));
