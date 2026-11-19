import test from 'node:test';
import assert from 'node:assert/strict';
import {readPagedFastPointShadow,sha256hex} from './ruc_fast_paged_point_shadow.mjs';
const run='2026-11-02T09:00',start=Date.parse(run+'Z'),source='a'.repeat(64);
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
   const cells=Math.min(512,count-i*512),key='fast/pages/20261102T0900/'+name.slice(0,-4)+'/'+String(i).padStart(4,'0')+'.bin';
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
  grid:{nx:964,ny:596,nativePointCount:542040},timeAxes:{hourly:axis(60,7),rapid5:axis(5,73),rapid15:axis(15,25)},objects};
 const raw=new TextEncoder().encode(JSON.stringify(manifest));
 return {raw,sha:await sha256hex(raw),pages,manifest};
}
test('four bounded chunks, authentic zero/NoData, distinct UTC validity and EPS',async()=>{
 const f=await fixture();let requests=[];
 const result=await readPagedFastPointShadow(f.raw,f.sha,async key=>{requests.push(key);return f.pages[key]},0);
 assert.equal(result.available,true);assert.equal(result.hours.length,7);assert.equal(result.rapid5Minutes.length,73);
 assert.equal(result.rapid15Minutes.length,25);assert.equal(result.modelRunUtc,'2026-11-02T09:00:00.000Z');
 assert.equal(result.hours[0].fields.temperature_2m,null);assert.equal(result.hours[0].fields.dew_point_2m,0);
 assert.equal(result.hours[0].fields.relative_humidity_2m,22.1);
 assert.equal(result.rapid5Minutes[0].precipitationMm,null);
 assert.equal(result.rapid5Minutes[1].precipitationMm,1.23);
 assert.equal(result.rapid15Minutes[1].precipitationMm,1.25);
 assert.equal(result.rapid15Minutes[1].validTimeUtc,'2026-11-02T09:15:00.000Z');
 assert.equal(result.epsAvailable,false);assert.equal(result.productionAuthorized,false);
 assert.equal(requests.length,4);assert.ok(requests.every(x=>f.pages[x].length<=512*168));
});
test('unknown manifest or corrupted chunk cannot be dry or zero',async()=>{
 const f=await fixture();
 await assert.rejects(readPagedFastPointShadow(f.raw,'b'.repeat(64),async key=>f.pages[key],0),/SHA admitted/);
 const bad=async key=>{const b=f.pages[key];return b.map((v,i)=>i===0?v^1:v)};
 await assert.rejects(readPagedFastPointShadow(f.raw,f.sha,bad,0),/chunk SHA/);
});
test('untrusted chunk URI, fake EPS, altered forecast cadence or activation rejected',async()=>{
 for(const mutate of [
 x=>x.objects['rapid-5m.bin'].parts[0].key='../untrusted.bin',
 x=>x.epsAvailable=true,
 x=>x.timeAxes.rapid5[1]='2026-11-02T09:20',
 x=>x.fields[7].scale=0.1,
 x=>x.productionEnabled=true
 ]){
  const f=await fixture();mutate(f.manifest);
  const raw=new TextEncoder().encode(JSON.stringify(f.manifest)),sha=await sha256hex(raw);
  await assert.rejects(readPagedFastPointShadow(raw,sha,async key=>f.pages[key],0));
 }
});
test('self-rehashed negative precipitation chunk is invalid even with matching SHA',async()=>{
 const f=await fixture();
 const chunk=f.manifest.objects['rapid-5m.bin'].parts[0],sourceChunk=f.pages[chunk.key];
 const altered=sourceChunk.slice();
 // Point 0, valid +5 minutes, int16 raw is the second 2-byte record.
 new DataView(altered.buffer).setInt16(2,-1,true);
 f.pages[chunk.key]=altered;
 chunk.sha256=await sha256hex(altered);
 const raw=new TextEncoder().encode(JSON.stringify(f.manifest));
 const digest=await sha256hex(raw);
 await assert.rejects(readPagedFastPointShadow(raw,digest,async key=>f.pages[key],0),
  /negative original Fast precipitation/);
});
test('missing native lookup is unavailable without extra fetches',async()=>{
 const f=await fixture(),key=f.manifest.objects['lookup.bin'].parts[0].key;
 const copy=f.pages[key].slice();new DataView(copy.buffer).setUint32(0,0xffffffff,true);f.pages[key]=copy;
 f.manifest.objects['lookup.bin'].parts[0].sha256=await sha256hex(copy);
 const raw=new TextEncoder().encode(JSON.stringify(f.manifest));
 let calls=0;const o=await readPagedFastPointShadow(raw,await sha256hex(raw),async path=>{calls++;return f.pages[path]},0);
 assert.equal(o.available,false);assert.equal(calls,1);
});


import {verifyPublicFastShadowReadback,fetchCanonicalPublicRucBytes}
 from './ruc_fast_public_site_admission.mjs';
import {FAST_POINTER_SCHEMA} from './ruc_fast_cas.mjs';
async function publicFixtures(){
 const f=await fixture(),fullRun='2026-11-02T08:00';
 const start=Date.parse(fullRun+'Z');
 const times=Array.from({length:28},(_,i)=>new Date(start+i*3600000).toISOString().slice(0,16));
 const original={schema:'mid.dwd.ruc.grid.v2',storageProfile:'pages-lossless-v1',
   run:fullRun,pointCount:542040,deterministic:{times},eps:{memberCount:20,times},epsSummary:{fields:['pop']}};
 const encoder=new TextEncoder(),bytes=encoder.encode(JSON.stringify(original));
 const pointer={schema:FAST_POINTER_SCHEMA,generation:1,stableSha:'d'.repeat(40),
   siteSha256:'a'.repeat(64),primaryManifestSha256:await sha256hex(bytes),
   fastManifestSha256:f.sha,primaryRun:fullRun,fastRun:run,
   horizonHours:6,epsAvailable:false,mode:'shadow',
   rootPrimaryNeverChanged:true,fullEps20Readmission:true};
 const read=async path=>path==='latest.json'?bytes:
   path==='fast/paged-shadow.json'?f.raw:f.pages[path];
 return {f,original,bytes,pointer,read};
}
test('public full 27h/EPS20 plus exact Fast 7h/5min/15min spot SHA verified, never release',async()=>{
 const {pointer,read}=await publicFixtures(),keys=[];
 const report=await verifyPublicFastShadowReadback(pointer,async key=>{
   keys.push(key);return read(key);
 },0);
 assert.equal(report.publicFilesReadbackShaVerified,6);
 assert.equal(report.nativeBinaryChunksVerified,4);
 assert.equal(report.epsOriginalMetadataMembers,20);
 assert.equal(report.fiveMinuteTerms,73);
 assert.equal(report.fifteenMinuteTerms,25);
 assert.equal(report.modelHourCount,7);
 assert.equal(report.shaBoundMetadataAndSampleVerified,true);
 assert.equal(report.actualPublicHttpReadback,false);
 for(const key of ['globalCasVerified','productionAuthorized','realClientAdoptionVerified',
                   'sixtyMinuteP95Verified','allPublicPagesObjectsVerified'])
   assert.equal(report[key],false);
 assert.equal(keys.length,8);
 assert.equal(new Set(keys).size,6);
});
test('public readback rejects forged shadow-to-active identity, missing EPS20 or source drift',async()=>{
 const {pointer,read,original,f,bytes}=await publicFixtures();
 for(const fake of [
  {...pointer,mode:'active'},
  {...pointer,primaryManifestSha256:'0'.repeat(64)},
  {...pointer,fastManifestSha256:'0'.repeat(64)},
  {...pointer,fastRun:'2026-11-02T10:00'},
  {...pointer,primaryRun:'2026-11-02T07:00'}
 ]){
  await assert.rejects(verifyPublicFastShadowReadback(fake,read,0));
 }
 const broken={...original,eps:{...original.eps,memberCount:19}};
 const raw=new TextEncoder().encode(JSON.stringify(broken));
 await assert.rejects(verifyPublicFastShadowReadback(
   {...pointer,primaryManifestSha256:await sha256hex(raw)},
   async key=>key==='latest.json'?raw:read(key),0),/EPS20/);
 const first=f.manifest.objects['lookup.bin'].parts[0];
 const tampered=f.pages[first.key].slice();tampered[0]^=1;
 await assert.rejects(verifyPublicFastShadowReadback(pointer,
   async key=>key===first.key?tampered:read(key),0),/chunk SHA/);
 await assert.rejects(verifyPublicFastShadowReadback(pointer,
   async key=>key==='latest.json'?new Uint8Array(0):read(key),0),/missing public Pages/);
 assert.ok(bytes.length>0);
});
test('public fetch forbids external paths, redirects, 404, oversized bodies and fake URLs',async()=>{
 await assert.rejects(fetchCanonicalPublicRucBytes('../admin'),/nonimmutable/);
 await assert.rejects(fetchCanonicalPublicRucBytes('fast/pages/20261102T0900/lookup/0000.bin?x=1'),/nonimmutable/);
 const respond=(body,status=200,url='https://midwx.app/ruc/latest.json')=>
   ({status,ok:status===200,url,headers:new Headers(),body:new Response(body).body});
 const good=new TextEncoder().encode('{"schema":"test"}');
 const bytes=await fetchCanonicalPublicRucBytes('latest.json',async()=>respond(good));
 assert.deepEqual(bytes,good);
 await assert.rejects(fetchCanonicalPublicRucBytes('latest.json',async()=>respond(good,404)),/HTTP result/);
 await assert.rejects(fetchCanonicalPublicRucBytes('latest.json',async()=>respond(good,200,'https://evil.example/ruc/latest.json')),/HTTP result/);
 await assert.rejects(fetchCanonicalPublicRucBytes('latest.json',async()=>({
  ...respond(good),headers:new Headers({'content-length':'999999999'})
 })),/Content-Length/);
 await assert.rejects(fetchCanonicalPublicRucBytes('latest.json',async()=>respond(new Uint8Array(8_000_001))),/overbudget/);
});

test('public post-readback detects changed full/Fast mutable manifests, despite verified chunks',async()=>{
 const {pointer,read,f}=await publicFixtures();
 let fullReads=0;
 await assert.rejects(verifyPublicFastShadowReadback(pointer,async key=>{
   if(key==='latest.json'&&++fullReads===2)return new TextEncoder().encode('{"tampered":true}');
   return read(key);
 },0),/full pointer changed during/);
 let fastReads=0;
 await assert.rejects(verifyPublicFastShadowReadback(pointer,async key=>{
   if(key==='fast/paged-shadow.json'&&++fastReads===2)return new TextEncoder().encode('{"tampered":true}');
   return read(key);
 },0),/Fast manifest changed during/);
 assert.ok(f.raw.length>0);
});
