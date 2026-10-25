import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript-strada';
const js=ts.transpileModule(fs.readFileSync('src/forecastFusionRefresh.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {createForecastFusionRefresh}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve()};
function harness(load){let visible=true,online=true,next=0,calls=0;const timers=new Map(),applied=[];const loop=createForecastFusionRefresh({load:signal=>{calls++;return load(signal)},apply:value=>applied.push(value),available:()=>visible&&online,setTimer:(fn,delay)=>{timers.set(++next,{fn,delay});return next},clearTimer:id=>timers.delete(id)});return{loop,timers,applied,get calls(){return calls},visible:v=>visible=v,online:v=>online=v,async tick(){assert.equal(timers.size,1);const [id,t]=[...timers][0];timers.delete(id);t.fn();await flush()}}}
const good={sources:[{id:'ruc',usedInCanonical:true,usedHours:13}]};
// Initial hidden/offline starts cannot strand the loop after foreground/network recovery.
for(const state of ['visible','online']){const h=harness(async()=>good);h[state](false);h.loop.resume();assert.equal(h.timers.size,0);h[state](true);h.loop.resume();await h.tick();assert.deepEqual(h.applied,[good]);h.loop.stop();assert.equal(h.timers.size,0)}
// A missing response and rejected fetch retry with backoff; success carries the real proof unchanged.
let attempt=0;const h=harness(async()=>{attempt++;if(attempt===1)return null;if(attempt===2)throw Error('timeout');return good});h.loop.resume();await h.tick();assert.equal([...h.timers.values()][0].delay,5000);await h.tick();assert.equal([...h.timers.values()][0].delay,15000);await h.tick();assert.deepEqual(h.applied,[good]);assert.equal([...h.timers.values()][0].delay,300000);h.loop.stop();
// Repeated resume events coalesce, in-flight work is not duplicated, late responses cannot update a new location.
let resolve,signal;const late=harness(s=>{signal=s;return new Promise(r=>resolve=r)});late.loop.resume();late.loop.resume();await late.tick();late.loop.resume();assert.equal(late.calls,1);assert.equal(late.timers.size,0);late.loop.stop();assert.equal(signal.aborted,true);resolve(good);await flush();assert.equal(late.applied.length,0);assert.equal(late.timers.size,0);
// Background pauses timers, a queued callback cannot start a request while offline.
const paused=harness(async()=>good);paused.loop.resume();paused.visible(false);paused.loop.pause();assert.equal(paused.timers.size,0);paused.visible(true);paused.loop.resume();paused.online(false);await paused.tick();assert.equal(paused.calls,0);paused.online(true);paused.loop.resume();await paused.tick();assert.equal(paused.calls,1);paused.loop.stop();
const failing=harness(async()=>null);failing.loop.resume();for(const delay of [5000,15000,60000,300000]){await failing.tick();assert.equal([...failing.timers.values()][0].delay,delay)}failing.loop.stop();
console.log('Fusion resume: hidden/offline recovery, backoff, coalescing, cleanup and real usage metadata passed.');
// Execute the real UI adapters: availability alone never manufactures an ingestion claim.
const cockpit=fs.readFileSync('src/ForecastCockpit.tsx','utf8');
const adapterTs=cockpit.slice(cockpit.indexOf('function modelStatusKey('),cockpit.indexOf('function cockpitModelRunDetail('))+'\nexport {fusionBestRows,modelUsageLabel};';
const adapterJs=ts.transpileModule(adapterTs,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {fusionBestRows,modelUsageLabel}=await import('data:text/javascript;base64,'+Buffer.from(adapterJs).toString('base64'));
const metadata={runs:[{id:'icon_d2_ruc',label:'DWD RUC',initialisationTime:'2026-10-25T20:00:00Z'}]};
const fallback=fusionBestRows(metadata,null,'short');assert.equal(fallback.length,1);assert.notEqual(modelUsageLabel(fallback[0]),'Eingeflossen');assert.match(fallback[0].usageDetail,/nicht verifiziert/);
const confirmed=fusionBestRows(metadata,{sources:[{id:'icon_d2_ruc',label:'DWD RUC',successful:true,usedInCanonical:true,usedHours:13,initialisationTime:'2026-10-25T19:00:00Z'}]},'short');assert.equal(modelUsageLabel(confirmed[0]),'Eingeflossen');assert.equal(confirmed[0].initialisationTime,'2026-10-25T19:00:00Z');assert.equal(confirmed[0].usedHours,13);
console.log('Actual cockpit adapter: provider availability differs from proven ingestion, with exact used run preserved.');
