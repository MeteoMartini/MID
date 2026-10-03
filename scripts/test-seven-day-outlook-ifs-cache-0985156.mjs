import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const aggregate=fs.readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
const icon=JSON.parse(fs.readFileSync('scripts/fixtures/icon-seamless-outlook-20261003-20.json','utf8'));
const ifs=JSON.parse(fs.readFileSync('scripts/fixtures/ecmwf-ifs-gust-20261003-20.json','utf8'));
const saved=new Map(),calls=[];
function context(){const c=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,caches:{default:{async match(r){return saved.get(r.url)?.clone()},async put(r,v){saved.set(r.url,v.clone())}}},fetch:async()=>new Response('{}')});vm.runInContext(aggregate,c,{timeout:5000});return c}
const c=context();c.__mock=async input=>{const u=new URL(input);calls.push(u);const fixture=u.searchParams.get('models')==='ecmwf_ifs025'?ifs:icon;assert.equal(u.searchParams.get('forecast_hours'),'169');return u.searchParams.get('latitude').split(',').map(()=>structuredClone(fixture))};vm.runInContext('dachExtremeFetchJson=__mock',c);
const result=await vm.runInContext('dachExtendedExtremeOutlookData()',c);
assert.equal(result.periods.length,5);assert.ok(result.periods.every(p=>p.endHour<=168));
for(const cell of result.cells){const p=cell.periods['144-168'];assert.ok(p.probabilityFields.wind);assert.ok(p.probabilityFields.rain);assert.ok(p.probabilityFields.snow);assert.equal(p.probabilityFields.thunderstorm,undefined);assert.equal(p.probabilityFields.ice,undefined)}
assert.ok(calls.some(u=>u.searchParams.get('models')==='ecmwf_ifs025'&&u.searchParams.get('hourly')==='wind_gusts_10m'));
c.__ifs=ifs;const stats=vm.runInContext('dachExtendedMemberStatistics(__ifs,51)',c);assert.ok(stats.hourly.wind_gusts_10m.every(Number.isFinite));
const few=structuredClone(ifs);for(const k of Object.keys(few.hourly))if(/_member(4[0-9]|50)$/.test(k))few.hourly[k]=Array(169).fill(null);c.__few=few;
assert.equal(vm.runInContext('dachExtendedMemberStatistics(__few,51).hourly.wind_gusts_10m[150]',c),null,'40/51 cannot yield an assessment');few.hourly.wind_gusts_10m_member40=ifs.hourly.wind_gusts_10m_member40;assert.ok(Number.isFinite(vm.runInContext('dachExtendedMemberStatistics(__few,51).hourly.wind_gusts_10m[150]',c)),'41/51 sufficient');
// Missing/misaligned alternate model is a per-hazard data gap, never an all-clear.
for(const failure of ['missing','time']){c.__mock=async input=>{const u=new URL(input);let f=structuredClone(icon);if(u.searchParams.get('models')==='ecmwf_ifs025'){if(failure==='missing')throw Error('unavailable');f=structuredClone(ifs);f.hourly.time[0]='2026-10-03T21:00'}return u.searchParams.get('latitude').split(',').map(()=>f)};vm.runInContext('dachExtremeOutlookCache.clear();dachExtremeFetchJson=__mock',c);const r=await vm.runInContext('dachExtendedExtremeOutlookData()',c);assert.equal(r.periods.length,5);assert.equal(r.cells[0].periods['144-168'].probabilityFields.wind,undefined)}
// A cold isolate must reuse the computed product without re-requesting ensembles.
c.__result={...result,checkedAt:new Date().toISOString()};vm.runInContext('dachExtendedExtremeOutlookData=async()=>__result',c);await vm.runInContext("dachExtendedCachedOutlook(new Request('https://mid.example/?_mid_version=156'))",c);
const cold=context();vm.runInContext("dachExtendedExtremeOutlookData=async()=>{throw Error('Daily API request limit exceeded')}",cold);const hit=await vm.runInContext("dachExtendedCachedOutlook(new Request('https://mid.example/?mode=x&_mid_version=157'))",cold);assert.equal(hit.cells.length,result.cells.length);assert.equal(hit.stale,undefined);
for(const [age,allowed]of[[7,true],[25,false]]){saved.clear();const payload={...result,checkedAt:new Date(Date.now()-age*3600000).toISOString()};saved.set('https://mid.example/mid-cache/extreme-extended-v4',Response.json(payload));if(allowed){const r=await vm.runInContext("dachExtendedCachedOutlook(new Request('https://mid.example/'))",cold);assert.equal(r.stale,true)}else await assert.rejects(vm.runInContext("dachExtendedCachedOutlook(new Request('https://mid.example/'))",cold),/Daily API/)}
console.log('Day 3–7: actual ICON/IFS data, 41/51 boundary, full-day and aligned-time requirement, missing gusts, cold-isolate cache and 24h expiry verified.');
