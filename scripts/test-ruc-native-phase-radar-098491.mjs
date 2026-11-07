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
const radarThermalSource=overlay.slice(overlay.indexOf('function radarBackedThermalPhase('),overlay.indexOf('function distanceKm('));
assert.ok(radarThermalSource.includes('function radarBackedThermalPhase('),'missing radar thermal classifier source');
const compiled=await transform(`${phaseSource}\n${radarThermalSource}\nglobalThis.__phaseFor=phaseFor;globalThis.__radarBackedThermalPhase=radarBackedThermalPhase;`,{loader:'ts',target:'es2022'});
const phaseContext=vm.createContext({});vm.runInContext(compiled.code,phaseContext);
const missingFrame=Object.fromEntries(['temperature2m','relativeHumidity2m','wetBulbTemperature2m','weatherCode','precipitation','rain','showers','snowfall','snowfallHeight','freezingLevelHeight','elevation','rucRain','rucSnowfallWaterEquivalent','graupelWaterEquivalent'].map(name=>[name,[null]]));
missingFrame.weatherCode=[71];missingFrame.precipitation=[.1];
assert.equal(phaseContext.__phaseFor(missingFrame,0).phase,'uncertain','missing thermal/height values must not invent snow support');
assert.equal(phaseContext.__phaseFor({...missingFrame,weatherCode:[66]},0).phase,'uncertain','missing temperature must not support freezing');
assert.equal(phaseContext.__phaseFor({...missingFrame,temperature2m:[0],relativeHumidity2m:[90],snowfallHeight:[0],elevation:[100]},0).phase,'snow','actual zero Celsius remains valid cold support');

const nativeAdmission=vm.runInContext('midRucPhaseEnough',context),nativeAmount=vm.runInContext('midPhaseAmount',context);
for(const [rain,snow,graupel,expected] of [
 [.1,NaN,NaN,true],[NaN,.1,NaN,true],[NaN,NaN,.1,true],
 [0,0,NaN,true],[0,0,0,true],[0,NaN,0,false],
 [NaN,NaN,NaN,false],[0,NaN,NaN,false],[-.1,NaN,NaN,false],
 [-.1,.2,NaN,true]
])assert.equal(nativeAdmission(rain,snow,graupel),expected,'native RUC single-field/zero/missing admission '+JSON.stringify([rain,snow,graupel]));
assert.ok(Number.isNaN(nativeAmount(-.1)),'negative original precipitation is invalid Missing');
assert.ok(Number.isNaN(nativeAmount(null)),'original Missing must not become dry 0');
assert.equal(nativeAmount(0),0,'original 0 must remain 0');
for(const [partial,expected] of [
 [{rucRain:[.1],rucSnowfallWaterEquivalent:[null],graupelWaterEquivalent:[null]},'rain'],
 [{rucRain:[null],rucSnowfallWaterEquivalent:[.2],graupelWaterEquivalent:[null]},'snow'],
 [{rucRain:[null],rucSnowfallWaterEquivalent:[null],graupelWaterEquivalent:[.3]},'graupel'],
 [{rucRain:[0],rucSnowfallWaterEquivalent:[0],graupelWaterEquivalent:[0]},'uncertain']
]){
 const frame={...missingFrame,weatherCode:[null],precipitation:[null],...partial};
 assert.equal(phaseContext.__phaseFor(frame,0,'dwd-icon-d2-ruc').phase,expected,'positive native single-field phase must not be replaced: '+expected);
}


const d2Phase=({rain=null,snowfall=null,precipitation=null,weatherCode=null,temperature=null}={})=>phaseContext.__phaseFor({...missingFrame,weatherCode:[weatherCode],rain:[rain],snowfall:[snowfall],precipitation:[precipitation],temperature2m:[temperature]},0,'dwd-icon-d2');
// Open-Meteo D2-15min: snowfall cm, rain mm; WW is often null. Positive native-interval
// fields remain classifiable without borrowing hourly temperature from another run.
assert.equal(d2Phase({snowfall:.02,rain:0,precipitation:.04}).phase,'snow','D2 snow without WW/thermal must stay snow');
assert.equal(d2Phase({snowfall:.02,rain:null,precipitation:.04}).phase,'snow','missing rain is not a zero and does not erase observed D2 snow');
assert.equal(d2Phase({snowfall:.02,rain:.2,precipitation:.3}).phase,'mixed','D2 mixed fields have different units and must not be numerically compared');
assert.equal(d2Phase({snowfall:0,rain:.2,precipitation:.2}).phase,'rain','D2 rain without WW/thermal must stay rain');
assert.equal(d2Phase({snowfall:null,rain:.2,precipitation:.2}).phase,'rain','missing snowfall is not zero, but does not erase D2 rain evidence');
assert.equal(d2Phase({snowfall:0,rain:0,precipitation:0}).phase,'uncertain','true dry zero cannot invent a rain/snow phase');
assert.equal(d2Phase({snowfall:null,rain:null,precipitation:null}).phase,'uncertain','missing D2 data cannot invent a phase');
assert.equal(d2Phase({snowfall:-.02,rain:0,precipitation:0}).phase,'uncertain','negative/invalid D2 snowfall cannot become snow');
assert.equal(d2Phase({snowfall:.02,rain:0,precipitation:.04,weatherCode:66}).phase,'uncertain','freezing code without cold support cannot be reinterpreted as plain snow');
assert.equal(d2Phase({snowfall:.02,rain:.2,precipitation:.3,weatherCode:71}).phase,'mixed','real rain+snow fields beat a derived snow-only WW code');
assert.equal(d2Phase({snowfall:.02,rain:0,precipitation:.04}).confidence,'mittel','D2 amount-only evidence must not claim high confidence');

const coldFrame={...missingFrame,weatherCode:[null],temperature2m:[-3],wetBulbTemperature2m:[-2],relativeHumidity2m:[92],precipitation:[.15],rain:[null],snowfall:[null],snowfallHeight:[100],elevation:[150]};
assert.equal(phaseContext.__phaseFor(coldFrame,0,'dwd-icon-eu').phase,'snow','cold, wet, echo-compatible snow must not be auto-labelled graupel without source evidence');
assert.equal(phaseContext.__phaseFor(coldFrame,0,'dwd-icon-global').phase,'snow','ICON global snow must not be upgraded to unverified graupel');
const strongEcho={covered:true,maxDbz:35,meanDbz:27,hits:9,maxRate:2};
const uncertainBase={phase:'uncertain',label:'Phase unbekannt',confidence:'eingeschränkt',modelEvidence:true};
assert.equal(phaseContext.__radarBackedThermalPhase(uncertainBase,{...coldFrame,snowfallHeight:[1200]},0,strongEcho).phase,'uncertain','35 dBZ and -2C wetbulb alone must never invent graupel');
assert.equal(phaseContext.__radarBackedThermalPhase(uncertainBase,coldFrame,0,strongEcho).phase,'snow','valid snow height/thermal evidence can still infer conservative snow');
const rucGraupelFrame={...missingFrame,rucRain:[0],rucSnowfallWaterEquivalent:[0],graupelWaterEquivalent:[.2]};
assert.equal(phaseContext.__phaseFor(rucGraupelFrame,0,'dwd-icon-d2-ruc').phase,'graupel','original native RUC graupel evidence must remain supported');
assert.equal(phaseContext.__phaseFor({...missingFrame,weatherCode:[87],precipitation:[.1]},0,'dwd-icon-eu').phase,'graupel','explicit WMO graupel code must remain supported');
assert.equal(phaseContext.__phaseFor({...missingFrame,weatherCode:[89],precipitation:[.1]},0,'dwd-icon-eu').phase,'hail','explicit WMO hail code must remain supported');



 // A cold FULL 13x19 (247-cell) original RUC phase grid must not execute
 // two serial chains of remote Pages records or burst without a cap.
 const manyLat=Array.from({length:13},(_,i)=>50+i*.1),manyLon=Array.from({length:19},(_,i)=>7+i*.1),manyTotal=13*19;
 const manyMeta={...meta,pointCount:manyTotal,grid:{latMin:50,lonMin:7,dx:.1,dy:.1,nx:19,ny:13},
  lookup:{dtype:'uint32-le',pages:{chunkRecords:1,chunkCount:manyTotal,recordBytes:4,prefix:`runs/${runKey}/lookup-bounded`}},
  rapid:{phase15:{...meta.rapid.phase15,pages:{chunkRecords:1,chunkCount:manyTotal,recordBytes:phaseRaw.byteLength,prefix:`runs/${runKey}/rapid/phase15-bounded`}}}};
 const manyObjects=new Map([['https://midwx.app/ruc/latest.json',new TextEncoder().encode(JSON.stringify(manyMeta))]]);
 const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
 for(let i=0;i<manyTotal;i++){
  manyObjects.set(`https://midwx.app/ruc/runs/${runKey}/lookup-bounded/${String(i).padStart(4,'0')}.bin`,u32(i===5?0xffffffff:i));
  manyObjects.set(`https://midwx.app/ruc/runs/${runKey}/rapid/phase15-bounded/${String(i).padStart(4,'0')}.bin`,i16([0,0,0,100+i,0,0,0,0,0,0,0,0]));
 }
 let inFlight=0,peakInFlight=0,nativeReadCalls=0;
 const manyFetch=async url=>{
  const value=manyObjects.get(String(url));
  if(!value)return new Response('not found',{status:404});
  if(String(url).endsWith('.bin')){
   nativeReadCalls++;inFlight++;peakInFlight=Math.max(peakInFlight,inFlight);
   try{await new Promise(resolve=>setTimeout(resolve,7))}finally{inFlight--}
  }
  return new Response(value,{status:200,headers:{'content-type':String(url).endsWith('.json')?'application/json':'application/octet-stream'}});
 };
 const manyContext=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,fetch:manyFetch});
 vm.runInContext(raw,manyContext,{timeout:5000,filename:'worker/metar-proxy.js'});
 const multi=await vm.runInContext(`dwdRucStaticPhaseGrid(${JSON.stringify(manyLat)},${JSON.stringify(manyLon)},${now.getTime()}, {})`,manyContext,{timeout:5000});
 assert.ok(multi&&multi.total===manyTotal&&multi.valid===manyTotal-1,'all genuine native cells except sentinel must remain valid');
 assert.ok(peakInFlight>=2&&peakInFlight<=8,'bounded original read concurrency required, observed '+peakInFlight);
 assert.equal(nativeReadCalls,manyTotal+(manyTotal-1),'original lookup and unique point payloads must be fetched once');
 for(let i=0;i<manyTotal;i++){
  if(i===5){assert.ok(Number.isNaN(multi.rain[i]),'native bitmap sentinel must remain Missing');continue}
  assert.ok(Math.abs(multi.rain[i]-(.1+i*.001))<1e-8,'original grid order and per-cell rain must survive concurrency');
  assert.equal(multi.snowfallWaterEquivalent[i],0,'original zero snow is a valid zero');
 }
 const beforeHorizonReads=nativeReadCalls;
 const beyond=await vm.runInContext(`dwdRucStaticPhaseGrid(${JSON.stringify(manyLat)},${JSON.stringify(manyLon)},${now.getTime()+2*60*60*1000}, {})`,manyContext,{timeout:5000});
 assert.equal(beyond,null,'no original phase beyond published 15min horizon');
 assert.equal(nativeReadCalls,beforeHorizonReads,'outside phase horizon must skip all native data IO');

for(const token of ['rucGraupel>=.003','rucSnow>=.003&&rucRain>=.003','Schnee · ICON-D2-RUC','Regen · ICON-D2-RUC'])assert.ok(overlay.includes(token),`radar phase priority missing: ${token}`);
for(const token of ["Original-RUC-Lauf","Open-Meteo-Metadatenlauf (Feldlauf nicht zellverifiziert)"])assert.ok(overlay.includes(token),"Unverified provider run must not masquerade as a native DWD original: "+token);
console.log('Native ICON-D2-RUC 15-min rain/snow/graupel phase decoder and radar-phase priority passed.');
