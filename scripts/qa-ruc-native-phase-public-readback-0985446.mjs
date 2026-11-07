// MID #683: bounded, read-only ORIGINAL DWD-RUC phase15 Pages readback.
// Runs only on trusted QA Draft #685; NEVER changes state or deploys.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const origin='https://www.midwx.app',base=origin+'/ruc/';
const rawFetch=globalThis.fetch;
const deadline=40000;
const started=Date.now();
const abort=new AbortController();
const deadlineTimer=setTimeout(()=>abort.abort(new Error('Original RUC public probe overall deadline')),deadline);
let networkRequests=0;
function phaseStamp(s){return Date.parse(/[zZ]$|[+-]\d\d:\d\d$/.test(String(s))?String(s):String(s)+'Z')}
const check=(condition,msg)=>{if(!condition)throw Error(msg)};

try{
 const m=await rawFetch(base+'latest.json',{headers:{Accept:'application/json','Cache-Control':'no-cache'},signal:abort.signal});
 check(m.ok,'RUC latest.json unavailable: HTTP '+m.status);
 const latestText=await m.text(),meta=JSON.parse(latestText);
 check(meta.schema==='mid.dwd.ruc.grid.v2','RUC schema mismatch');
 check(meta.storageProfile==='pages-lossless-v1'&&meta.migration?.productionEnabled===true,'RUC lossless production profile unavailable');
 check(Array.isArray(meta?.rapid?.phase15?.times)&&meta.rapid.phase15.times.length>=2,'RUC phase15 time axis missing');
 check(Number.isInteger(meta.pointCount)&&meta.pointCount>1000,'RUC original grid point count invalid');
 const runMs=phaseStamp(meta.run);
 check(Number.isFinite(runMs)&&Date.now()-runMs<4*3600000&&runMs<=Date.now()+90000,'RUC original run stale/future');
 const phase=meta.rapid.phase15;
 check(phase.recordBytes===phase.times.length*3*2,'RUC phase15 original record dimensions changed');
 check(phase.fields?.length===3&&phase.fields.every(f=>f.unit==='mm'),'RUC native phase unit contract drift');
 for(let i=1;i<phase.times.length;i++)check(phaseStamp(phase.times[i])-phaseStamp(phase.times[i-1])===15*60000,'RUC phase15 15-minute cadence broken');
 const eligible=phase.times.filter(t=>phaseStamp(t)<=Date.now()-60*1000);
 check(eligible.length>0,'No elapsed phase15 valid time published');
 const validTime=eligible.at(-1),targetMs=phaseStamp(validTime);
 const guardedFetch=async(input,init={})=>{
  const address=input instanceof Request?input.url:String(input),u=new URL(address);
  check(u.protocol==='https:'&&['www.midwx.app','midwx.app'].includes(u.hostname)&&u.pathname.startsWith('/ruc/'),'Network URL outside immutable public RUC readback allowlist');
  if(u.pathname.endsWith('/latest.json'))return new Response(latestText,{status:200,headers:{'content-type':'application/json'}});
  networkRequests++;
  check(networkRequests<=48,'RUC readback network request ceiling reached');
  check(!abort.signal.aborted,'RUC readback overall deadline expired');
  const options={...init,signal:AbortSignal.any([abort.signal,init?.signal].filter(Boolean))};
  const response=await rawFetch(u.toString(),options);
  check(response.ok,'RUC original object unavailable '+u.pathname+' HTTP '+response.status);
  const declared=Number(response.headers.get('content-length'));
  check(!Number.isFinite(declared)||declared<=12*1024*1024,'RUC original object over per-response safety limit');
  return response;
 };
 const source=fs.readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
  .replace(/export default\s*\{/,'const __workerDefault={')
  .replace(/^export \{[^\n]+\};?$/gm,'');
 const context=vm.createContext({
  console,URL,URLSearchParams,Headers,Request,Response,
  AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,
  ReadableStream,WritableStream,DecompressionStream,CompressionStream,Blob,
  crypto,setTimeout,clearTimeout,fetch:guardedFetch
 });
 vm.runInContext(source,context,{timeout:5000,filename:'worker/metar-proxy.js'});
 const lats=[50.8,50.85,50.9],lons=[7.05,7.1,7.15];
 const query='dwdRucStaticPhaseGrid('+JSON.stringify(lats)+','+JSON.stringify(lons)+','+targetMs+',{})';
 const output=await Promise.race([
  vm.runInContext(query,context,{timeout:5000}),
  new Promise((_,reject)=>abort.signal.addEventListener('abort',()=>reject(abort.signal.reason),{once:true}))
 ]);
 check(output!==null&&output.source==='DWD ICON-D2-RUC · native 15 min','No original RUC phase response for 3x3 sample');
 check(output.run===meta.run&&Date.parse(output.time)===targetMs,'RUC original run/validity lineage mismatch');
 check(output.total===9&&output.valid>0&&output.valid<=9,'Original RUC 3x3 native mask invalid');
 for(const field of ['rain','snowfallWaterEquivalent','graupelWaterEquivalent']){
  check(Array.isArray(output[field])&&output[field].length===9,'RUC phase grid field length invalid: '+field);
  for(const value of output[field])check(Number.isNaN(value)||Number.isFinite(value)&&value>=0,'RUC original field has invalid negative/nonfinite value '+field);
 }
 // Real spatial NoData admission: 6 outside-bbox locations must not
 // silently inherit phase from the three valid interior original grid cells.
 check(meta.grid.lonMin>-4.5&&meta.grid.lonMin+meta.grid.dx*(meta.grid.nx-1)<21,'Original-grid edge fixture no longer out of bounds');
 const edgeLons=[-4.5,7.1,21],edgeQuery='dwdRucStaticPhaseGrid('+JSON.stringify(lats)+','+JSON.stringify(edgeLons)+','+targetMs+',{})';
 const edge=await vm.runInContext(edgeQuery,context,{timeout:5000});
 check(edge&&edge.total===9&&edge.valid===3,'Original grid must retain only 3 genuine interior cells across mixed valid/outside domain');
 check(edge.run===meta.run&&Date.parse(edge.time)===targetMs,'Original edge grid mixed run or phase time');
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){
  const index=row*3+col;
  if(col!==1)for(const field of ['rain','snowfallWaterEquivalent','graupelWaterEquivalent'])
   check(Number.isNaN(edge[field][index]),'Outside original RUC grid was misrepresented as native '+field+' at '+index);
 }
 // 27-hour general RUC output never extends the actual 6-hour Phase15 horizon.
 const beyondMs=phaseStamp(phase.times.at(-1))+15*60000,readsBefore=networkRequests;
 const beyond=await vm.runInContext('dwdRucStaticPhaseGrid('+JSON.stringify(lats)+','+JSON.stringify(lons)+','+beyondMs+',{})',context,{timeout:5000});
 check(beyond===null&&networkRequests===readsBefore,'Expired RUC Phase15 performed original record reads or extended into hourly horizon');
 console.log('MID ORIGINAL RUC PHASE READBACK VERIFIED '+JSON.stringify({
  run:meta.run,validTime,storageProfile:meta.storageProfile,phaseHorizon15m:phase.times.length,
  originalPoints:meta.pointCount,gridPoints:output.total,validNativePoints:output.valid,edgeInteriorPoints:edge.valid,edgeOutOfBoundsNoData:6,noPhaseAfterSixHours:true,
  objectRequests:networkRequests,elapsedMs:Date.now()-started,
  source:output.source,classification:'Read-only runner sample; NOT Cloudflare Worker P95 or full-domain proof'
 }));
}catch(error){
 console.error('MID ORIGINAL RUC PHASE READBACK BLOCKED: '+String(error?.message||error));
 process.exitCode=1;
}finally{clearTimeout(deadlineTimer);abort.abort()}
