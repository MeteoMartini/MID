import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const raw=fs.readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
const now=new Date();now.setUTCSeconds(0,0);const run=new Date(now.getTime()-30*60000).toISOString(),runKey=run.replace(/[^0-9A-Za-z_-]/g,''),phaseTimes=[-15,0,15,30].map(min=>new Date(now.getTime()+min*60000).toISOString().slice(0,16));
const phaseFields=[{name:'rain',unit:'mm',scale:.001,offset:0},{name:'snowfall_water_equivalent',unit:'mm',scale:.001,offset:0},{name:'graupel_water_equivalent',unit:'mm',scale:.001,offset:0}];
const meta={schema:'mid.dwd.ruc.grid.v2',storageProfile:'pages-free-v1',run,generatedAt:new Date().toISOString(),times:[now.toISOString().slice(0,16),new Date(now.getTime()+3600000).toISOString().slice(0,16),new Date(now.getTime()+7200000).toISOString().slice(0,16),new Date(now.getTime()+10800000).toISOString().slice(0,16)],pointCount:1,grid:{latMin:50,lonMin:7,dx:.1,dy:.1,nx:1,ny:1},lookup:{dtype:'uint32-le',pages:{chunkRecords:1,chunkCount:1,recordBytes:4,prefix:`runs/${runKey}/lookup`}},rapid:{phase15:{dtype:'int16-le',layout:'point-time-field',times:phaseTimes,recordBytes:phaseTimes.length*phaseFields.length*2,fields:phaseFields,pages:{chunkRecords:1,chunkCount:1,recordBytes:phaseTimes.length*phaseFields.length*2,prefix:`runs/${runKey}/rapid/phase15`}}},pages:{profile:'pages-free-v1'}};
const i16=values=>{const b=new ArrayBuffer(values.length*2),v=new DataView(b);values.forEach((x,i)=>v.setInt16(i*2,x,true));return new Uint8Array(b)};
// point-time-field: at target index 1 => rain .100, snow .250, graupel .050 mm
const phaseRaw=i16([0,0,0,100,250,50,0,0,0,0,0,0]);
const objects=new Map([
 ['https://midwx.app/ruc/latest.json',new TextEncoder().encode(JSON.stringify(meta))],
 [`https://midwx.app/ruc/runs/${runKey}/lookup/0000.bin`,new Uint8Array([0,0,0,0])],
 [`https://midwx.app/ruc/runs/${runKey}/rapid/phase15/0000.bin`,phaseRaw]
]);
const fakeFetch=async input=>{const bytes=objects.get(String(input));return bytes?new Response(bytes,{status:200,headers:{'content-type':String(input).endsWith('.json')?'application/json':'application/octet-stream'}}):new Response('not found',{status:404})};
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,fetch:fakeFetch});
vm.runInContext(raw,context,{timeout:5000,filename:'worker/metar-proxy.js'});
context.__phase=await vm.runInContext(`dwdRucStaticPhaseGrid([50],[7],${now.getTime()},{})`,context,{timeout:5000});
assert.ok(context.__phase,'native RUC phase grid must be available');
assert.equal(context.__phase.source,'DWD ICON-D2-RUC · native 15 min');
assert.equal(context.__phase.valid,1);assert.equal(context.__phase.total,1);
assert.ok(Math.abs(context.__phase.rain[0]-.1)<1e-9);assert.ok(Math.abs(context.__phase.snowfallWaterEquivalent[0]-.25)<1e-9);assert.ok(Math.abs(context.__phase.graupelWaterEquivalent[0]-.05)<1e-9);
const overlay=fs.readFileSync('src/RadarModelPrecipTypeOverlay.tsx','utf8');
for(const token of ['rucGraupel>=.003','rucSnow>=.003&&rucRain>=.003','Schnee · ICON-D2-RUC','Regen · ICON-D2-RUC'])assert.ok(overlay.includes(token),`radar phase priority missing: ${token}`);
console.log('Native ICON-D2-RUC 15-min rain/snow/graupel phase decoder and radar-phase priority passed.');
