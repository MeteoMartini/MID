import test from 'node:test';
import assert from 'node:assert/strict';
import {readFastPointShadow,strictRun,validateFastShadow,inspectJointFullFastAxes} from './ruc_fast_cell_shadow.mjs';
const run='2026-11-02T08:00',pointCount=542040,sha='a'.repeat(64),stamp=new Date(run+'Z').getTime();
const timestamps=(step,n)=>Array.from({length:n},(_,i)=>new Date(stamp+step*60000*i).toISOString().slice(0,16));
const FIELDS=[['temperature_2m','°C',.01,0],['dew_point_2m','°C',.01,0],['relative_humidity_2m','%',.1,0],['pressure_msl','hPa',.1,0],['wind_speed_10m','kn',.01,0],['wind_direction_10m','°',.1,0],['wind_gusts_10m','kn',.01,0],['precipitation','mm',.01,0],['cloud_cover','%',.1,0],['cloud_cover_low','%',.1,0],['cape','J/kg',.1,0],['convective_inhibition','J/kg',.1,0]];
const specs={'deterministic.bin':168,'rapid-5m.bin':146,'rapid-15m.bin':150,'lookup.bin':16};
function pointer(){return {schema:'mid.ruc.fast-shadow-pointer.v1',run,horizonHours:6,eps:{availability:'unavailable'},nativePoints:pointCount,grid:{nativePointCount:pointCount,nx:2,ny:2},dataTimes:timestamps(60,7),rapid5Times:timestamps(5,73),rapid15Times:timestamps(15,25),fields:FIELDS.map(([name,unit,scale,offset])=>({name,unit,scale,offset})),objects:Object.fromEntries(Object.entries(specs).map(([name,per])=>[name,{key:'fast/runs/20261102T0800/'+name,bytes:name==='lookup.bin'?16:per*pointCount,sha256:sha}])),productionEnabled:false,publicationAuthorized:false,realtimeConsumerEnabled:false,consumerAdoptionVerified:false};}
class Fake{
 constructor(){this.requests=[];this.lookup=new Uint8Array(16);new DataView(this.lookup.buffer).setUint32(0,1,true);this.records={'deterministic.bin':new Int16Array(84),'rapid-5m.bin':new Int16Array(73),'rapid-15m.bin':new Int16Array(75)};this.records['deterministic.bin'][0]=-32768;this.records['deterministic.bin'][1]=0;this.records['deterministic.bin'][2]=221;this.records['rapid-5m.bin'][0]=0;this.records['rapid-5m.bin'][1]=123;this.records['rapid-15m.bin'][0]=0;this.records['rapid-15m.bin'][1]=221;}
 async get(key,{range}){this.requests.push({key,...range});const name=key.split('/').at(-1),bytes=name==='lookup.bin'?this.lookup:new Uint8Array(this.records[name].buffer);const data=bytes.slice(range.offset===0?0:range.offset-(name==='lookup.bin'?0:specs[name]),range.offset-(name==='lookup.bin'?0:specs[name])+range.length);return {arrayBuffer:async()=>data.buffer}}
}
test('axis/field/size/NoData-contract stable',()=>{validateFastShadow(pointer());assert.throws(()=>strictRun('2026-02-30T08:00'));assert.throws(()=>validateFastShadow({...pointer(),rapid5Times:timestamps(15,25)}));assert.throws(()=>validateFastShadow({...pointer(),productionEnabled:true}));assert.throws(()=>validateFastShadow({...pointer(),eps:{availability:'complete',members:20}}));});
test('returns missing as null not zero and never casts 0 to NoData',async()=>{const f=new Fake();const out=await readFastPointShadow(pointer(),f,{lookupIndex:0});assert.equal(out.validityHours[0].values.temperature_2m,null);assert.equal(out.validityHours[0].values.dew_point_2m,0);assert.equal(out.validityHours[0].values.relative_humidity_2m,22.1);assert.equal(out.modelRunUtc,'2026-11-02T08:00:00.000Z');assert.equal(out.rapid5Minutes[0].precipitationMm,null);assert.equal(out.rapid5Minutes[1].precipitationMm,1.23);assert.equal(out.rapid5Minutes[1].validTimeUtc,'2026-11-02T08:05:00.000Z');assert.equal(out.rapid15Minutes[1].validTimeUtc,'2026-11-02T08:15:00.000Z');assert.equal(out.rapid15Minutes[0].precipitationMm,null);assert.equal(out.epsAvailable,false);assert.equal(out.productionAuthorized,false);assert.equal(f.requests.length,4);assert.ok(f.requests.every(x=>x.length<=168));});
test('failed/outside lookup is unavailable, not a valid dry point',async()=>{const f=new Fake();new DataView(f.lookup.buffer).setUint32(0,0xffffffff,true);const out=await readFastPointShadow(pointer(),f,{lookupIndex:0});assert.equal(out.available,false);assert.equal(f.requests.length,1);});
test('lookup index outside native cells is error',async()=>{const f=new Fake();new DataView(f.lookup.buffer).setUint32(0,600000,true);await assert.rejects(readFastPointShadow(pointer(),f,{lookupIndex:0}),/native cell/);});
test('truncated binary Range is rejected not filled with zeros',async()=>{const f=new Fake();f.get=async()=>({arrayBuffer:async()=>new Uint8Array(3).buffer});await assert.rejects(readFastPointShadow(pointer(),f,{lookupIndex:0}),/truncated/);});
test('no R2 credentials/no lookup index rejected',async()=>{await assert.rejects(readFastPointShadow(pointer(),null,{lookupIndex:0}),/R2 binding/);await assert.rejects(readFastPointShadow(pointer(),new Fake(),{}),/lookup-grid/);});

test('full 27h+20EPS never replaced by different Fast run or truncated axis',()=>{
 const fullRun='2026-11-02T06:00'; const fullStamp=new Date(fullRun+'Z').getTime();
 const times=Array.from({length:28},(_,i)=>new Date(fullStamp+i*3600000).toISOString().slice(0,16));
 const full={schema:'mid.dwd.ruc.grid.v2',storageProfile:'pages-lossless-v1',run:fullRun,
   pointCount:542040,times,deterministic:{times},epsSummary:{times},eps:{memberCount:20,times}};
 const admitted=inspectJointFullFastAxes(full,pointer());
 assert.equal(admitted.fullEpsMembers,20);assert.equal(admitted.fastEpsMembers,0);
 assert.equal(admitted.fastModelRunUtc,'2026-11-02T08:00:00.000Z');
 assert.equal(admitted.productionAuthorized,false);
 assert.throws(()=>inspectJointFullFastAxes({...full,eps:{memberCount:19,times}},pointer()),/20-EPS/);
 assert.throws(()=>inspectJointFullFastAxes({...full,times:times.slice(1)},pointer()),/validity/);
 assert.throws(()=>inspectJointFullFastAxes({...full,run:'2026-11-02T01:00'},pointer()),/validity/);
 assert.throws(()=>inspectJointFullFastAxes({...full,run:'2026-11-02T01:00',times:Array.from({length:28},(_,i)=>new Date(fullStamp-5*3600000+i*3600000).toISOString().slice(0,16)),deterministic:{times:Array.from({length:28},(_,i)=>new Date(fullStamp-5*3600000+i*3600000).toISOString().slice(0,16))},epsSummary:{times:Array.from({length:28},(_,i)=>new Date(fullStamp-5*3600000+i*3600000).toISOString().slice(0,16))},eps:{memberCount:20,times:Array.from({length:28},(_,i)=>new Date(fullStamp-5*3600000+i*3600000).toISOString().slice(0,16))}},pointer()),/unrelated/);
});
