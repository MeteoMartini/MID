import test from 'node:test';
import assert from 'node:assert/strict';
import {dwdRucNativeFastPagesPointPayload} from '../../worker.js';
import {sha256hex} from '../../tools/ruc/ruc_fast_paged_point_shadow.mjs';
const run=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString().slice(0,16),start=Date.parse(run+'Z'),source='a'.repeat(64);
const names={'lookup.bin':[4,964*596],'deterministic.bin':[168,542040],'rapid-5m.bin':[146,542040],'rapid-15m.bin':[150,542040]};
const fields=[['temperature_2m','°C',.01,0],['dew_point_2m','°C',.01,0],['relative_humidity_2m','%',.1,0],
 ['pressure_msl','hPa',.1,0],['wind_speed_10m','kn',.01,0],['wind_direction_10m','°',.1,0],
 ['wind_gusts_10m','kn',.01,0],['precipitation','mm',.01,0],['cloud_cover','%',.1,0],
 ['cloud_cover_low','%',.1,0],['cape','J/kg',.1,0],['convective_inhibition','J/kg',.1,0]];
const axis=(minutes,count)=>Array.from({length:count},(_,i)=>new Date(start+minutes*i*60000).toISOString().slice(0,16));
async function fixture(){
 const pages={};const objects={};
 for(const [name,[unit,count]] of Object.entries(names)){
  const chunkCount=Math.ceil(count/512),parts=[];
  for(let i=0;i<chunkCount;i++){
   const cells=Math.min(512,count-i*512),key='fast/pages/'+run.replaceAll('-','').replaceAll(':','')+'/'+name.slice(0,-4)+'/'+String(i).padStart(4,'0')+'.bin';
   let hash=source;
   if(i===0){
    const data=new Uint8Array(cells*unit);
    if(name==='lookup.bin')new DataView(data.buffer).setUint32(0,0,true);
    if(name==='deterministic.bin'){new DataView(data.buffer).setInt16(0,-32768,true);new DataView(data.buffer).setInt16(2,0,true);new DataView(data.buffer).setInt16(4,221,true);}
    if(name==='rapid-5m.bin')new DataView(data.buffer).setInt16(2,123,true);
    if(name==='rapid-15m.bin')new DataView(data.buffer).setInt16(6,125,true);
    pages[key]=data;hash=await sha256hex(data);
   }
   parts.push({firstCell:i*512,cells,key,bytes:cells*unit,sha256:hash});
  }
  objects[name]={sourceSha256:source,bytesPerCell:unit,cellCount:count,parts};
 }
 const manifest={schema:'mid.ruc.fast-paged-shadow.v1',run,nativePoints:542040,chunkCells:512,
  sourceManifestSha256:source,sourceGribSha256:source,sourceNativeBytes:253804736,
  epsAvailable:false,productionEnabled:false,publicationAuthorized:false,realtimeConsumerEnabled:false,
  fields:fields.map(([name,unit,scale,offset])=>({name,unit,scale,offset})),
  grid:{nx:964,ny:596,nativePointCount:542040,latMin:48,lonMin:8,dx:.01,dy:.01},timeAxes:{hourly:axis(60,7),rapid5:axis(5,73),rapid15:axis(15,25)},objects};
 const raw=new TextEncoder().encode(JSON.stringify(manifest));
 return {raw,sha:await sha256hex(raw),pages,manifest};
}

const env=sha=>({MID_DWD_RUC_FAST_ENABLED:'true',MID_DWD_RUC_FAST_MANIFEST_SHA256:sha});
function mockPages(f,{manifest=f.raw,status=200,mutate=null}={}){
 const urls=[],old=globalThis.fetch;
 globalThis.fetch=async input=>{
  const u=String(input);urls.push(u);
  if(u==='https://www.midwx.app/ruc/fast/paged-shadow.json')return new Response(status===200?manifest:'',{status});
  const key=u.replace('https://www.midwx.app/ruc/',''),bytes=f.pages[key];
  if(!bytes)throw Error('Unmatched Fast Pages read: '+key);
  return new Response(mutate?mutate(key,bytes):bytes,{status:200});
 };
 return {urls,restore:()=>{globalThis.fetch=old}};
}
test('Fast consumer without a trusted release SHA is inert, no fetch',async()=>{
 const old=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('unexpected network')};
 try{
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,{}),null);
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,{MID_DWD_RUC_FAST_ENABLED:'true',MID_DWD_RUC_FAST_MANIFEST_SHA256:'bad'}),null);
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,{MID_DWD_RUC_FAST_ENABLED:'false',MID_DWD_RUC_FAST_MANIFEST_SHA256:'a'.repeat(64)}),null);
  assert.equal(calls,0);
 }finally{globalThis.fetch=old}
});
test('release-SHA-pinned Fast Pages point preserves 7/73/25 UTC, native zero vs NoData and EPS unavailable',async()=>{
 const f=await fixture(),m=mockPages(f);
 try{
  const p=await dwdRucNativeFastPagesPointPayload(48,8,env(f.sha));
  assert.ok(p);
  assert.equal(p.mid_ruc.epsAvailability,'unavailable');
  assert.equal(p.hourly.time.length,7);
  assert.equal(p.rapid.precip5.time.length,73);
  assert.equal(p.rapid.convection15.time.length,25);
  assert.deepEqual(p.hourly.time,axis(60,7),'native hourly UTC validity timeline must be exact');
  assert.deepEqual(p.rapid.precip5.time,axis(5,73),'native 5min UTC validity timeline must be exact');
  assert.deepEqual(p.rapid.convection15.time,axis(15,25),'native 15min UTC validity timeline must be exact');
  assert.equal(p.hourly.temperature_2m[0],null);
  assert.equal(p.hourly.dew_point_2m[0],0);
  assert.equal(p.rapid.precip5.precipitation[0],null);
  assert.equal(p.rapid.precip5.precipitation[1],1.23);
  assert.equal(p.rapid.convection15.precipitation[1],1.25);
  assert.equal(m.urls.length,5);
  assert.ok(m.urls.every(u=>u.startsWith('https://www.midwx.app/ruc/fast/')));
 }finally{m.restore()}
});
test('wrong externally issued SHA rejects otherwise valid manifest before chunk reads',async()=>{
 const f=await fixture(),m=mockPages(f);
 try{
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,env('f'.repeat(64))),null);
  assert.equal(m.urls.length,1);
 }finally{m.restore()}
});
test('missing Pages manifest is NoData, never a fabricated dry value',async()=>{
 const f=await fixture(),m=mockPages(f,{status:404});
 try{
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,env(f.sha)),null);
  assert.equal(m.urls.length,1);
 }finally{m.restore()}
});
test('expired native DWD run fails closed before native chunk I/O',async()=>{
 const f=await fixture();
 f.manifest.run=new Date(Date.now()-6*3600000).toISOString().slice(0,16);
 const b=new TextEncoder().encode(JSON.stringify(f.manifest)),sha=await sha256hex(b),m=mockPages(f,{manifest:b});
 try{
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,env(sha)),null);
  assert.equal(m.urls.length,1);
 }finally{m.restore()}
});
test('corrupted original native chunk fails SHA verification instead of returning dry values',async()=>{
 const f=await fixture(),m=mockPages(f,{mutate:(key,bytes)=>key.includes('/deterministic/')?bytes.map((v,i)=>i===0?v^1:v):bytes});
 try{
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,env(f.sha)),null);
  assert.ok(m.urls.length>=3);
 }finally{m.restore()}
});


const fastTrustReceipt=(sha,overrides={})=>({
 schema:'mid.ruc.fast-publisher-trust.v1',version:'0.9.85.498',
 repository:'MeteoMartini/MID',stableSha:'9fd872a789f4b158bc691d085589616c2c04f776',
 run,fastManifestSha256:sha,...overrides
});
const withR2Receipt=(receipt,calls={count:0})=>({
 MID_DWD_RUC_DATA:{get:async key=>{
  calls.count++;
  assert.equal(key,'ruc/fast/publisher-trust.v1.json');
  return receipt===null?null:{text:async()=>JSON.stringify(receipt)};
 }}
});
test('absent R2 Fast receipt uses a short negative cache without repeated object reads',async()=>{
 const m=mockPages({raw:new Uint8Array(0),pages:{}}),calls={count:0};
 try{
  const env=withR2Receipt(null,calls);
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,env),null);
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,env),null);
  assert.equal(calls.count,1);
  assert.equal(m.urls.length,0);
 }finally{m.restore()}
});
test('trusted R2 receipt automatically enables native Fast without public or manual digest binding',async()=>{
 const f=await fixture(),m=mockPages(f),calls={count:0};
 try{
  const payload=await dwdRucNativeFastPagesPointPayload(48,8,withR2Receipt(fastTrustReceipt(f.sha),calls));
  assert.ok(payload);
  assert.equal(payload.mid_ruc.fastManifestSha256,f.sha);
  assert.equal(payload.mid_ruc.epsAvailability,'unavailable');
  assert.equal(payload.hourly.temperature_2m[0],null);
  assert.equal(payload.hourly.dew_point_2m[0],0);
  assert.equal(m.urls.length,5);
  assert.equal(calls.count,1);
 }finally{m.restore()}
});
test('R2 receipt with valid SHA but a mismatched UTC run fails before chunks',async()=>{
 const f=await fixture(),m=mockPages(f);
 try{
  const otherRun=new Date(start-3600000).toISOString().slice(0,16);
  assert.notEqual(otherRun,run);
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,withR2Receipt(fastTrustReceipt(f.sha,{run:otherRun}))),null);
  assert.equal(m.urls.length,1);
 }finally{m.restore()}
});
test('untrusted or missing R2 receipt causes NoData before public Pages read',async()=>{
 const f=await fixture(),m=mockPages(f);
 try{
  for(const receipt of [
   null,
   fastTrustReceipt(f.sha,{version:'0.9.85.497'}),
   fastTrustReceipt(f.sha,{repository:'other/repo'}),
   fastTrustReceipt('not-a-sha'),
   fastTrustReceipt(f.sha,{stableSha:'z'.repeat(40)}),
   fastTrustReceipt(f.sha,{run:'not-a-run'})
  ]){
   const calls={count:0};
   assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,withR2Receipt(receipt,calls)),null);
   assert.equal(calls.count,1);
  }
  assert.equal(m.urls.length,0);
 }finally{m.restore()}
});
test('stale R2 trust proof cannot authorize a cached historic deterministic run',async()=>{
 const f=await fixture(),m=mockPages(f);
 try{
  const proof=fastTrustReceipt(f.sha,{run:new Date(Date.now()-6*3600000).toISOString().slice(0,13)+':00'});
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,withR2Receipt(proof)),null);
  assert.equal(m.urls.length,0);
 }finally{m.restore()}
});
test('explicitly disabled Fast binding prevents even trusted R2 read and Pages I/O',async()=>{
 const f=await fixture(),m=mockPages(f),calls={count:0};
 try{
  const e=withR2Receipt(fastTrustReceipt(f.sha),calls);
  e.MID_DWD_RUC_FAST_ENABLED='false';
  assert.equal(await dwdRucNativeFastPagesPointPayload(48,8,e),null);
  assert.equal(calls.count,0);
  assert.equal(m.urls.length,0);
 }finally{m.restore()}
});

import {readFileSync} from 'node:fs';

// Exercise the exact canonical source adapter without expanding the production
// Worker export surface; all provenance and network dependencies are stubbed.
const adapterText=readFileSync(new URL('../../worker-src/00-core-observations.js',import.meta.url),'utf8');
const adapterStart=adapterText.indexOf('async function fetchDwdRucPointAdapter(');
const adapterEnd=adapterText.indexOf('\nfunction rucEpsProbabilityRows(',adapterStart);
assert.ok(adapterStart>=0&&adapterEnd>adapterStart,'canonical RUC adapter is present');

function pointAdapterHarness({fullRun,fastRun,trustRun=fastRun,fastValid=true,fullFromStatic=false}={}){
 const calls={r2:0,static:0,trust:0,fast:0};
 const payload=(utc,maxHours)=>utc?{mid_ruc:{run:utc},maxHours}:null;
 const adapters={
  dwdRucR2PointPayload:async()=>{calls.r2++;return fullFromStatic?null:payload(fullRun,27)},
  dwdRucStaticPointPayload:async()=>{calls.static++;return fullFromStatic?payload(fullRun,27):null},
  dwdRucTrustedFastManifestSha:async()=>{calls.trust++;return trustRun===undefined?null:{sha:'a'.repeat(64),run:trustRun}},
  dwdRucNativeFastPagesPointPayload:async()=>{calls.fast++;return fastValid?payload(fastRun,6):null},
  parseDwdRucPointPayload:(entry,_model,apiId)=>({
   successful:Boolean(entry?.mid_ruc?.run),apiId,
   initialisationTime:entry?.mid_ruc?.run?new Date(entry.mid_ruc.run+'Z').toISOString():undefined,
   maxHours:entry?.maxHours,
   hours:Array.from({length:entry?.maxHours===6?7:28},()=>({precipitation:0})),
   rapid:entry?.rapid||{},
  }),
 };
 const build=new Function(...Object.keys(adapters),
  adapterText.slice(adapterStart,adapterEnd)+'\nreturn fetchDwdRucPointAdapter;');
 return {adapter:build(...Object.values(adapters)),calls};
}
test('newer externally trusted native 0–6h run supersedes an older full RUC source',async()=>{
 const fastRun=run,fullRun=new Date(start-3600000).toISOString().slice(0,16);
 const {adapter,calls}=pointAdapterHarness({fullRun,fastRun});
 const point=await adapter({},48,8,0,{});
 assert.equal(point.adapter,'MID_DWD_RUC_FAST_PAGES');
 assert.equal(point.maxHours,6);
 assert.equal(point.initialisationTime,new Date(start).toISOString());
 assert.equal(calls.fast,1);
});
test('full RUC run with same or newer UTC initialization retains full 27h horizon without Fast chunks',async()=>{
 for(const fullRun of [run,new Date(start+3600000).toISOString().slice(0,16)]){
  const {adapter,calls}=pointAdapterHarness({fullRun,fastRun:run});
  const point=await adapter({},48,8,0,{});
  assert.equal(point.adapter,'MID_DWD_RUC_DATA');
  assert.equal(point.maxHours,27);
  assert.equal(calls.fast,0);
  assert.equal(calls.trust,1);
 }
});
test('newer Fast corruption falls back to existing full RUC and independent Fast works without full source',async()=>{
 const oldRun=new Date(start-3600000).toISOString().slice(0,16);
 const invalid=pointAdapterHarness({fullRun:oldRun,fastRun:run,fastValid:false});
 assert.equal((await invalid.adapter({},48,8,0,{})).maxHours,27);
 assert.equal(invalid.calls.fast,1);
 const independent=pointAdapterHarness({fastRun:run});
 assert.equal((await independent.adapter({},48,8,0,{})).adapter,'MID_DWD_RUC_FAST_PAGES');
 assert.equal(independent.calls.fast,1);
});
test('explicit digest override rechecks native UTC before superseding full RUC',async()=>{
 const fullRun=run,oldRun=new Date(start-3600000).toISOString().slice(0,16);
 const {adapter,calls}=pointAdapterHarness({fullRun,fastRun:oldRun,trustRun:null});
 const point=await adapter({},48,8,0,{});
 assert.equal(point.maxHours,27);
 assert.equal(calls.fast,1);
});
