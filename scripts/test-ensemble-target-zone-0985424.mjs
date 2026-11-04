import assert from 'node:assert/strict';
import {build,transformSync} from 'esbuild';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-ensemble-zone-'));
try{
 await build({stdin:{contents:readFileSync('src/weather.ts','utf8')+'\nexport {ensembleWeatherInTargetZone,parseModelMembers,eventMemberPrecipitationTotals,readEnsembleCache,writeEnsembleCache};',resolveDir:resolve('src'),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(dir,'weather.mjs'),logLevel:'silent'});
 const {ensembleWeatherInTargetZone:bind,parseModelMembers:parse,eventMemberPrecipitationTotals:event,providerIsoEpoch,localIsoEpoch,readEnsembleCache,writeEnsembleCache}=await import(pathToFileURL(join(dir,'weather.mjs')));
 for(const [zone,date,start,duration,complete] of [
  ['Europe/Berlin','2026-03-29','2026-03-27T00:00Z',23,true],
  ['Europe/Berlin','2026-10-25','2026-10-23T00:00Z',25,true],
  ['UTC','2026-03-29','2026-03-27T00:00Z',24,true],
  ['Asia/Kathmandu','2026-03-29','2026-03-27T00:00Z',24,false],
  ['Australia/Lord_Howe','2026-10-04','2026-10-02T00:00Z',23.5,false],
  ['Australia/Lord_Howe','2026-04-05','2026-04-03T00:00Z',24.5,false],
 ]){
  const time=Array.from({length:121},(_,i)=>new Date(Date.parse(start)+i*3600000).toISOString().slice(0,16));
  const hourly={time,temperature_2m:time.map(()=>10),temperature_2m_member01:time.map(()=>12),precipitation:time.map(()=>1),precipitation_member01:time.map(()=>2)};
  const source={latitude:50,longitude:7,timezone:'GMT',utc_offset_seconds:0,current:{},daily:{time:[]},hourly,_mid_source:'synthetic-original'};
  const before=JSON.stringify(source),w=bind(source,zone),result=parse(w,{id:'probe'});
  assert.equal(JSON.stringify(source),before,'Ingest must not mutate original data');
  assert.equal(w._mid_source,source._mid_source);
  if(zone!=='UTC')assert.deepEqual(w._mid_ensemble_source_time.time,time);
  for(let i=0;i<time.length;i++)assert.equal(providerIsoEpoch(w.hourly.time[i],w.timezone,w.utc_offset_seconds),Date.parse(time[i]+'Z'));
  const row=result.members.get('_control').find(row=>row.date===date),next=new Date(Date.parse(date+'T00:00Z')+86400000).toISOString().slice(0,10);
  const begin=localIsoEpoch(date+'T00:00',zone),end=localIsoEpoch(next+'T00:00',zone);
  assert.equal((end-begin)/3600000,duration,'Known actual civil-day duration');
  assert.equal(row.complete.temperature,complete);assert.equal(row.complete.precipitation,complete);
  const expected=time.map(t=>Date.parse(t+'Z')).filter(t=>t>begin&&t<=end).length;
  assert.equal(row.precipitation,expected,'End-stamped amounts retain actual UTC intervals');
  assert.equal(result.members.get('_member01').find(row=>row.date===date).precipitation,2*expected);
  // Local event window crosses a real midnight and may straddle a DST transition.
  const windowEnd=localIsoEpoch(next+'T03:00',zone),windowStart=localIsoEpoch(date+'T23:00',zone);
  assert.deepEqual(event(w,date,'23:00','03:00'),[(windowEnd-windowStart)/3600000,2*(windowEnd-windowStart)/3600000]);
  const crossingStart=localIsoEpoch(date+'T00:00',zone),crossingEnd=localIsoEpoch(date+'T04:00',zone);
  assert.deepEqual(event(w,date,'00:00','04:00'),[(crossingEnd-crossingStart)/3600000,2*(crossingEnd-crossingStart)/3600000]);
  const damaged=structuredClone(w),index=w.hourly.time.findIndex(t=>providerIsoEpoch(t)>crossingStart&&providerIsoEpoch(t)<=crossingEnd);
  damaged.hourly.precipitation[index]=null;damaged.hourly.precipitation_member01[index]=null;
  assert.deepEqual(event(damaged,date,'00:00','04:00'),[],'NoData cannot become dry zero or complete event');
  assert.equal(parse(damaged,{id:'probe'}).members.get('_control').find(row=>row.date===date).complete.precipitation,false);
  console.log(JSON.stringify({zone,date,expectedDayHours:duration,actualComplete:row.complete.precipitation,actualPrecipitation:row.precipitation,expectedPrecipitation:expected,memberCount:result.members.size,epochs:'exact',noData:'excluded',fractionalGrid:complete?'aligned':'conservatively incomplete'}));
 }
 const sourceFragment=readFileSync('src/weather-src/30-ensemble-climate-hazards.tsfrag','utf8');
 const start=sourceFragment.indexOf('async function fetchEnsembleWeather('),end=sourceFragment.indexOf('function pseudoModelFromMeanSpread(',start);
 assert.ok(start>=0&&end>start);
 const requestSource=transformSync(sourceFragment.slice(start,end),{loader:'ts',target:'es2022'}).code;
 const input={timezone:'GMT',utc_offset_seconds:0,hourly:{time:Array.from({length:24},(_,i)=>`2026-03-29T${String(i).padStart(2,'0')}:00`)}};
 let params;
 const request=new Function('ensembleDeadline','ENSEMBLE_MODEL_TIMEOUT_MS','ensembleVariablesForContract','DIRECT_REGIONAL_ENSEMBLE_MODELS','workerBaseCandidates','fetchWorkerJson','ensembleWeatherInTargetZone','ensembleVariableFallbackEligible',requestSource+';return fetchEnsembleWeather')(
 ()=>({signal:{aborted:false},cleanup(){},timedOut:()=>false}),1000,(_model,variables)=>variables,new Set(['icon_d2_ruc_eps']),()=>['test'],async(_endpoint,parameters)=>{params=parameters;return input},bind,()=>false);
 const response=await request(50,7,2,'icon_d2_ruc_eps',undefined,undefined,'normal','Europe/Berlin');
 assert.equal(params.timezone,'Europe/Berlin');assert.equal(response.timezone,'Europe/Berlin');assert.equal(response.hourly.time[0],'2026-03-29T00:00:00.000Z');
 await assert.rejects(request(50,7,2,'icon_d2_ruc_eps'),/Zielort-Zeitzone fehlt/);
 const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
 const day={precipitationProbabilityWindows:[],cumulativePrecipitationMean:1,cumulativePrecipitationLow:1,cumulativePrecipitationHigh:1,cumulativePrecipitationQ25:1,cumulativePrecipitationQ75:1};
 writeEnsembleCache(50,7,{days:Array(5).fill(day),models:[],runs:[]},'Europe/Berlin');
 assert.ok(readEnsembleCache(50,7,'Europe/Berlin'));assert.equal(readEnsembleCache(50,7,'UTC'),null);assert.equal(readEnsembleCache(50,7),null);
 console.log('PASS actual proxy request/ingest, missing destination metadata fails closed, derived cache bound to destination zone');
 assert.throws(()=>bind({timezone:'GMT'},'invalid/zone'),RangeError);
 console.log('PASS ensemble target-zone ingest: UTC instants, source provenance, 23/25h Berlin, Lord Howe 23.5/24.5h, Kathmandu, local events and NoData');
}finally{rmSync(dir,{recursive:true,force:true})}
