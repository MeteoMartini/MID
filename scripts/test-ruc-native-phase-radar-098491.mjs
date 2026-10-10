import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {transform} from 'esbuild';
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
// Fresh Worker contexts prevent cached records from masking Missing regressions.
for(const [values,expected] of [
 [[100,250,-32768],[.1,.25,NaN]],
 [[-32768,0,-32768],[NaN,0,NaN]],
 [[0,0,0],[0,0,0]],
 [[-32768,-32768,-32768],null]
]){
 objects.set(`https://midwx.app/ruc/runs/${runKey}/rapid/phase15/0000.bin`,i16([0,0,0,...values,0,0,0,0,0,0]));
 const isolated=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,fetch:fakeFetch});
 vm.runInContext(raw,isolated,{timeout:5000});
 const result=await vm.runInContext(`dwdRucStaticPhaseGrid([50],[7],${now.getTime()},{})`,isolated,{timeout:5000});
 if(expected===null){assert.equal(result,null,'wholly missing cells must not pass phase coverage');continue;}
 assert.equal(result.valid,1);
 for(const [index,name] of ['rain','snowfallWaterEquivalent','graupelWaterEquivalent'].entries()){
  if(Number.isNaN(expected[index]))assert.ok(Number.isNaN(result[name][0]),`${name}: missing must not become zero`);
  else assert.equal(result[name][0],expected[index]);
 }
 const serialized=JSON.parse(JSON.stringify(result));
 assert.equal(serialized.graupelWaterEquivalent[0],Number.isNaN(expected[2])?null:expected[2]);
}
const overlay=fs.readFileSync('src/RadarModelPrecipTypeOverlay.tsx','utf8');
const finiteSource=overlay.match(/function finite\(value:unknown\)\{[^\n]+\}/)?.[0].replace('value:unknown','value');
assert.ok(finiteSource);const finite=vm.runInNewContext(`(${finiteSource})`);
for(const value of [null,undefined,'',' ',false,true,NaN,Infinity])assert.ok(Number.isNaN(finite(value)),'missing/non-numeric must not become a thermodynamic zero');
for(const value of [0,'0',-2,.1])assert.equal(finite(value),Number(value));
const phaseSource=overlay.slice(overlay.indexOf('function finite('),overlay.indexOf('function cellEchoSummary('));
const compiled=await transform(`${phaseSource}\nglobalThis.__phaseFor=phaseFor;`,{loader:'ts',target:'es2022'});
const phaseContext=vm.createContext({});vm.runInContext(compiled.code,phaseContext);
const missingFrame=Object.fromEntries(['temperature2m','relativeHumidity2m','wetBulbTemperature2m','weatherCode','precipitation','rain','showers','snowfall','snowfallHeight','freezingLevelHeight','elevation','rucRain','rucSnowfallWaterEquivalent','graupelWaterEquivalent'].map(name=>[name,[null]]));
missingFrame.weatherCode=[71];missingFrame.precipitation=[.1];
assert.equal(phaseContext.__phaseFor(missingFrame,0).phase,'uncertain','missing thermal/height values must not invent snow support');
assert.equal(phaseContext.__phaseFor({...missingFrame,weatherCode:[66]},0).phase,'uncertain','missing temperature must not support freezing');
assert.equal(phaseContext.__phaseFor({...missingFrame,temperature2m:[0],relativeHumidity2m:[90],snowfallHeight:[0],elevation:[100]},0).phase,'snow','actual zero Celsius remains valid cold support');
for(const token of ['rucGraupel>=.003','rucSnow>=.003&&rucRain>=.003','Schnee · ICON-D2-RUC','Regen · ICON-D2-RUC'])assert.ok(overlay.includes(token),`radar phase priority missing: ${token}`);
console.log('Native ICON-D2-RUC 15-min rain/snow/graupel phase decoder and radar-phase priority passed.');
