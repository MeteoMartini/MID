import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const out=mkdtempSync(join(tmpdir(),'mid244-'));
const app=readFileSync('src/App.tsx','utf8'),helpers=app.slice(app.indexOf('function fullHourMinuteInZone('),app.indexOf('function Current('));
try{
 await build({stdin:{contents:`import {formatTemperatureRange}from'./src/weatherValueFormat';${helpers};export {currentFullHourWindow,currentTemperatureRangeLabel}`,resolveDir:process.cwd(),loader:'ts'},outfile:join(out,'range.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 await build({entryPoints:['src/ForecastChangeArchive.ts','src/modelRunChanges.ts'],outdir:out,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {currentFullHourWindow:window12,currentTemperatureRangeLabel:range}=await import(pathToFileURL(join(out,'range.mjs')));
 assert.equal(range([15,11,10,11,12]),'10–15 °C');assert.equal(range([12.1,12.3]),'12 °C');assert.equal(range([NaN]),'–');assert.equal(range([15,NaN,10]),'10–15 °C · unvollständig');
 const start=Date.parse('2026-10-25T00:00Z'),rows=Array.from({length:16},(_,i)=>({epoch:start+i*3600000,temperature:i===7?2:15,time:new Date(start+i*3600000).toISOString(),timezone:'Europe/Berlin'}));
 const normal=window12(rows,'Europe/Berlin',start+1200000);assert.equal(normal.length,13);assert.equal(normal.at(-1).epoch-start,12*3600000);assert.equal(range(normal.map(h=>h.temperature)),'2–15 °C');
 const gap=window12(rows.filter((_,i)=>i!==7),'Europe/Berlin',start);assert.equal(gap.length,13);assert.ok(Number.isNaN(gap[7].temperature));assert.equal(gap.at(-1).epoch,start+12*3600000);assert.match(range(gap.map(h=>h.temperature)),/unvollständig/);
 const values=new Map();globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,v)=>values.set(key,String(v))};
 const archive=await import(pathToFileURL(join(out,'ForecastChangeArchive.js'))),changes=await import(pathToFileURL(join(out,'modelRunChanges.js')));
 const location={id:1,name:'QA',latitude:50,longitude:7,timezone:'UTC'},dates=['2026-10-12','2026-10-13','2026-10-14'],times=Array.from({length:72},(_,i)=>new Date(Date.parse('2026-10-12T00:00Z')+i*3600000).toISOString().slice(0,16));
 const weather={latitude:50,longitude:7,elevation:40,timezone:'UTC',current:{},daily:{time:dates,temperature_2m_max:[15,17,18],temperature_2m_min:[8,9,10],precipitation_sum:[1,2,3],wind_speed_10m_max:[5,5,5],wind_gusts_10m_max:[10,10,10],wind_direction_10m_dominant:[0,0,0],precipitation_probability_max:[20,20,20],weather_code:[3,3,3],uv_index_max:[1,1,1]},hourly:{time:times,temperature_2m:Array(72).fill(15),precipitation:Array(72).fill(0),precipitation_probability:Array(72).fill(20),wind_speed_10m:Array(72).fill(5),wind_gusts_10m:Array(72).fill(10)}};
 for(const field of ['is_day','weather_code','dew_point_2m','cloud_cover','uv_index','relative_humidity_2m','apparent_temperature','rain','showers','snowfall','wind_direction_10m'])weather.hourly[field]=Array(72).fill(field==='relative_humidity_2m'?60:0);
 const now=Date.now;Date.now=()=>Date.parse('2026-10-12T10:00Z');
 try{
  assert.equal(archive.captureForecastInputs(location,weather).state,'stored');const key=changes.modelChangeLocationKey(location);assert.equal(changes.readModelChangeHistory(key).length,1);
  Date.now=()=>Date.parse('2026-10-13T10:00Z');assert.equal(archive.captureForecastInputs(location,weather).state,'unchanged');assert.equal(changes.readModelChangeHistory(key).length,1);assert.match(changes.readModelChangeCaptureStatus(key).checkedAt,/2026-10-13/);
  const updated={...weather,daily:{...weather.daily,temperature_2m_max:[19,22,18]}};archive.captureForecastInputs(location,updated);const history=changes.readModelChangeHistory(key);assert.equal(history.length,2);const report=changes.compareModelChangeSnapshots(history[0],history[1]);assert.ok(report.items.some(i=>i.metric==='tmax'&&i.delta===5));assert.ok(!report.items.some(i=>['confidence','spread','probability'].includes(i.metric)),'No invented ensemble values');
  const legacy={...history.at(-1),inputs:undefined,signature:'legacy-ensemble',runKey:'ensemble',days:history.at(-1).days.map(d=>({...d,confidence:60,spread:3,probability:30}))};
  changes.updateModelChangeRadar(key,legacy);assert.equal(archive.captureForecastInputs(location,updated).state,'unchanged','A legacy writer cannot reset or invalidate the automatic context');
  const legacyReport=changes.updateModelChangeRadar(key,{...legacy,signature:'legacy-next',days:legacy.days.map(d=>({...d,probability:70}))});assert.ok(legacyReport.items.some(i=>i.metric==='probability'),'Standalone ensemble revisions remain functional');
  assert.equal(changes.readModelChangeHistory(key).filter(row=>row.inputs?.context==='best-match-inputs').length,2);
  const b={...location,longitude:8};archive.captureForecastInputs(b,weather);assert.equal(changes.readModelChangeHistory(changes.modelChangeLocationKey(b)).length,1);assert.equal(changes.readModelChangeHistory(key).filter(row=>row.inputs?.context==='best-match-inputs').length,2);
  archive.captureForecastInputs(location,{...updated,_mid_core_proxy:{stale:true}});assert.equal(changes.readModelChangeHistory(key).filter(row=>row.inputs?.context==='best-match-inputs').length,2);assert.equal(changes.readModelChangeCaptureStatus(key).state,'stale');
  // Reload: read persisted JSON, not React state, then retain only the bounded six revisions.
  for(let i=0;i<9;i++){Date.now=()=>Date.parse('2026-10-13T11:00Z')+i*3600000;archive.captureForecastInputs(location,{...weather,daily:{...weather.daily,temperature_2m_max:[20+i,22,18]}})}assert.equal(changes.readModelChangeHistory(key).length,6);
  const stored=JSON.parse(values.get('mid:model-run-change-history:v2'));stored.locations.broken={days:'invalid'};stored.locations['50.00000:11.00000']={not:'a snapshot array'};values.set('mid:model-run-change-history:v2',JSON.stringify(stored));
  assert.equal(archive.captureForecastInputs({...location,longitude:11},weather).state,'stored','Malformed legacy location must not crash automatic capture or block healthy entries');assert.equal(changes.readModelChangeHistory(key).length,6,'Healthy archive survives repair');
  const epsLocation={...location,longitude:12},eps=dates.map(date=>({date,maxMean:16,minMean:8,maxLow:13,maxHigh:19,minLow:5,minHigh:11,modelCount:2,precipitationProbability:30})),runs=[{id:'qa-eps',label:'QA EPS',kind:'ensemble',initialisationTime:'2026-10-13T00:00Z'}];
  archive.captureForecastInputs(epsLocation,weather);archive.captureForecastInputs(epsLocation,weather,eps,runs);archive.captureForecastInputs(epsLocation,weather,eps.map(row=>({...row,precipitationProbability:80})),[{...runs[0],initialisationTime:'2026-10-13T06:00Z'}]);
  const epsHistory=changes.readModelChangeHistory(changes.modelChangeLocationKey(epsLocation));assert.ok(epsHistory.at(-1).days.every(row=>Number.isFinite(row.confidence)));assert.ok(changes.compareModelChangeSnapshots(epsHistory.at(-2),epsHistory.at(-1)).items.some(item=>item.metric==='probability'&&item.delta===50&&item.models.includes('QA EPS')),'Available ensemble inputs and runs are archived automatically without an extra request');
  const oldSet=localStorage.setItem;localStorage.setItem=()=>{throw new Error('Quota')};assert.equal(archive.captureForecastInputs({...location,longitude:9},weather).state,'error');localStorage.setItem=oldSet;
 }finally{Date.now=now}
 assert.match(app,/useForecastChangeArchive\(\{location:loc,weather:w,favorites,ensemble:ens,runs:ensembleRuns\}\)/);
 assert.doesNotMatch(readFileSync('src/PrognoseRadar.tsx','utf8'),/updateModelChangeRadar\(key/,'Disclosure must not own the writer');
}finally{rmSync(out,{recursive:true,force:true})}
console.log('MID244: full-window range, DST/gaps, automatic persisted inputs, 24h reread, two places, dedup, retention, missing ensemble and quota failure verified.');
if(process.env.GITHUB_ACTIONS==='true'||process.env.MID_BROWSER_QA==='1')execFileSync(process.execPath,['scripts/verify-forecast-archive-info-browser-0985244.mjs'],{stdio:'inherit',timeout:360000});
