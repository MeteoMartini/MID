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
