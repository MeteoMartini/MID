import fs from 'node:fs';
import vm from 'node:vm';
const baseline=JSON.parse(fs.readFileSync('MID_BASELINE.json','utf8'));
for(const key of ['requiredRegressionTests','regressionTests'])if(!baseline[key]?.includes('scripts/test-ruc-storage-health-09692.mjs'))throw new Error(`RUC health test missing from ${key}`);
if(!baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.69.2.md'))throw new Error('RUC 0.9.69.2 implementation evidence missing from baseline');
const raw=fs.readFileSync('worker/metar-proxy.js','utf8')
 .replace(/export default\s*\{/,'const __workerDefault={')
 .replace(/^export \{[^\n]+\};?$/gm,'');
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,crypto,setTimeout,clearTimeout,fetch:async()=>{throw new Error('network not expected')}});
vm.runInContext(raw,context,{timeout:5000,filename:'worker/metar-proxy.js'});
const now=new Date();now.setUTCMinutes(0,0,0);
const prefix='runs/health-run',keys={lookup:`${prefix}/lookup.bin`,deterministic:`${prefix}/deterministic.bin`,epsSummary:`${prefix}/eps-summary.bin`,eps:`${prefix}/eps-members.bin`};
const meta={schema:'mid.dwd.ruc.grid.v2',run:now.toISOString(),generatedAt:new Date().toISOString(),times:Array.from({length:15},(_,i)=>new Date(now.getTime()+i*3600000).toISOString().slice(0,16)),pointCount:542040,grid:{latMin:43,lonMin:-4,dx:.02,dy:.02,nx:100,ny:100},lookup:{key:keys.lookup},deterministic:{key:keys.deterministic,recordBytes:360},epsSummary:{key:keys.epsSummary,recordBytes:180},eps:{key:keys.eps,recordBytes:600,memberCount:20,scale:.01}};
const bucket=(payload,missing='')=>({
 async get(key){if(key!=='latest.json')return null;const data=new TextEncoder().encode(JSON.stringify(payload));return{text:async()=>new TextDecoder().decode(data),arrayBuffer:async()=>data.buffer}},
 async head(key){return key===missing?null:{key,size:1}}
});
context.__freshEnv={MID_DWD_RUC_DATA:bucket(meta)};
context.__health=await vm.runInContext('dwdRucR2Health(__freshEnv)',context,{timeout:5000});
if(!context.__health.configured||!context.__health.ready||!context.__health.fresh||!context.__health.schemaValid)throw new Error(`fresh RUC health not ready: ${JSON.stringify(context.__health)}`);
if(context.__health.pointCount!==542040||context.__health.epsMemberCount!==20||context.__health.timeCount!==15)throw new Error('RUC health metadata mismatch');
if(Object.values(context.__health.objectsPresent).some(value=>value!==true))throw new Error('RUC health failed object head checks');
for(const forbidden of ['bucket','token','credential','secret','url'])if(Object.keys(context.__health).some(key=>key.toLowerCase().includes(forbidden)))throw new Error(`RUC health leaks infrastructure field: ${forbidden}`);

const stale={...meta,run:new Date(now.getTime()-8*3600000).toISOString()};context.__staleEnv={MID_DWD_RUC_DATA:bucket(stale)};
context.__stale=await vm.runInContext('dwdRucR2Health(__staleEnv)',context,{timeout:5000});
if(context.__stale.ready||context.__stale.fresh||!context.__stale.configured)throw new Error('stale RUC run must be configured but not ready/fresh');
context.__missingEnv={MID_DWD_RUC_DATA:bucket(meta,keys.epsSummary)};
context.__missing=await vm.runInContext('dwdRucR2Health(__missingEnv)',context,{timeout:5000});
if(context.__missing.ready||context.__missing.objectsPresent.epsSummary!==false)throw new Error('missing RUC object must fail readiness');
context.__unconfigured=await vm.runInContext('dwdRucR2Health({})',context,{timeout:5000});
if(context.__unconfigured.configured||context.__unconfigured.ready)throw new Error('unconfigured RUC health contract mismatch');

context.__response=await vm.runInContext("__workerDefault.fetch(new Request('https://worker.invalid/?mode=ruc-health'),__freshEnv)",context,{timeout:5000});
context.__body=await context.__response.json();
if(context.__response.status!==200||context.__response.headers.get('cache-control')!=='no-store'||!context.__body.ready||context.__body.version===undefined)throw new Error('ruc-health route contract mismatch');
console.log('RUC storage health runtime contract OK');
