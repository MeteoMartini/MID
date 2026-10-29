import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const raw=fs.readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
const ctx=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,crypto,setTimeout,clearTimeout,fetch:async()=>{throw Error('unexpected network')}});
vm.runInContext(raw,ctx,{timeout:5000});
const init=Math.floor(Date.now()/3600000)*3600000;
ctx.input=Array.from({length:29},(_,lead)=>({epoch:init+lead*3600000,time:new Date(init+lead*3600000).toISOString(),temperature:10,dewPoint:5,pressure:1010,wind:10,gust:15,direction:180,precipitation:1,rain:1,showers:0,snowfall:0,probability:60,cloud:50,lowCloud:30,humidity:70,cape:100,convectiveInhibition:20,code:61}));
ctx.ruc={id:'icon_d2_ruc',successful:true,run:new Date(init).toISOString(),hours:ctx.input.slice(0,28).map(h=>({...h,temperature:12,precipitation:2,rain:2}))};
const call=()=>vm.runInContext('applyRucRapidUpdateWeatherHours(input,[ruc],null,null)',ctx);
let out=call();
for(let lead=1;lead<27;lead++){assert.equal(out[lead].rucApplied,true,`native RUC lead +${lead} must contribute`);assert.ok(out[lead].rucWeight>0);assert.ok(out[lead].temperature>10);assert.ok(Number.isFinite(out[lead].precipitation));}
assert.equal(out[27].rucApplied,undefined,'existing deterministic taper ends at zero at +27; not evidence of full final-hour use');
assert.equal(out[28].rucApplied,undefined,'never extrapolate past native +27h');
ctx.ruc.run=new Date(init-6*3600000).toISOString();const freshHours=ctx.ruc.hours;ctx.ruc.hours=freshHours.map(h=>({...h,epoch:h.epoch-6*3600000}));assert.ok(call().every(h=>!h.rucApplied),'valid but stale run fails closed');ctx.ruc.hours=freshHours;
ctx.ruc.run=new Date(init).toISOString();ctx.ruc.hours=ctx.ruc.hours.slice(0,15);out=call();assert.equal(out[14].rucApplied,true);assert.equal(out[15].rucApplied,undefined,'short provider run is not extended');
console.log('PASS actual Worker RUC fusion: native leads +1..+26 contribute; +27 zero-weight boundary explicitly documented; no +28, short-run extrapolation or invalid-run contribution');
