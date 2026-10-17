import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const fusionSource=readFileSync('src/forecastFusion.ts','utf8'),app=readFileSync('src/App.tsx','utf8');
assert.ok(fusionSource.includes('fullCalendarDayHourlyPrecipitationCoverage(day.date,timezone,relevant,hours)'), 'Full-day totals require actual 23/24/25h coverage and the next accumulated endpoint');
assert.ok(!fusionSource.includes('futureFraction=(hour:Hour)'), 'Day must not become just the remainder from now');
assert.ok(fusionSource.includes('completeCoverage?sum(\'precipitation\'):day.precipitation'), 'Incomplete day must preserve canonical daily source');
assert.ok(fusionSource.includes('minimumExpectedHours:completeCoverage?relevant.length:26'), 'Incomplete sunshine hours must not masquerade as full-day coverage');
assert.ok(app.includes('currentThreadSkyBaseHours=precipitationPresentationHours(hours)'), 'Current base Skybar needs the complete native model hour');
assert.ok(app.includes('currentThreadSkySegments=detailSkyBarTimedSegments(currentThreadSkyBaseHours'), 'Base sky must not be clipped to future-only precipitation series');
assert.ok(app.includes('detailSkyBarTimedSegments(currentThreadSkyFine'), 'Quarter-hour precipitation overlay remains independent');
const root=mkdtempSync(join(tmpdir(),'mid-day-285-'));
try {
 await build({stdin:{contents:"export{fullCalendarDayHourlyPrecipitationCoverage}from'./src/fullCalendarForecastDay';export{reconcileForecastDaysWithHours}from'./src/forecastFusion';export{daySkybarCalendarWindow}from'./src/daySkybarTimeline';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',packages:'external',outfile:join(root,'tests.mjs'),loader:{'.css':'empty'},define:{'import.meta.env':'{}'},logLevel:'silent'});
 const {fullCalendarDayHourlyPrecipitationCoverage:full,reconcileForecastDaysWithHours:reconcile,daySkybarCalendarWindow:windowFor}=await import(pathToFileURL(join(root,'tests.mjs')));
 const step=3600000;
 const rows=(date,timezone)=>{const w=windowFor(date,timezone);assert.ok(w);const make=epoch=>({epoch,precipitation:0});const raw=Array.from({length:(w.endEpoch-w.startEpoch)/step+1},(_,i)=>make(w.startEpoch+i*step));return {w,raw,display:raw.slice(0,-1)}};
 for(const [date,timezone,count] of [['2026-10-17','Europe/Berlin',24],['2026-03-29','Europe/Berlin',23],['2026-10-25','Europe/Berlin',25]]){
  const {raw,display}=rows(date,timezone);assert.equal(display.length,count);assert.equal(full(date,timezone,display,raw),true,`fully covered ${count}h day with valid zero must pass`);
  assert.equal(full(date,timezone,display.slice(1),raw),false,'missing first hour');
  assert.equal(full(date,timezone,display.slice(0,-1),raw),false,'missing final hour');
  assert.equal(full(date,timezone,display,raw.slice(0,-1)),false,'missing next midnight accumulation');
  assert.equal(full(date,timezone,[...display.slice(1),display[1]],raw),false,'repeated hour cannot replace missing hour');
  assert.equal(full(date,timezone,display,raw.map((h,i)=>i===3?{...h,precipitation:null}:h)),false,'null is never zero');
  assert.equal(full(date,timezone,display,raw.map((h,i)=>i===3?{...h,precipitation:NaN}:h)),false,'NaN is never zero');
  for(const invalid of ['', ' ', false, true, undefined, -1, Infinity, '0']){
   assert.equal(full(date,timezone,display,raw.map((h,i)=>i===3?{...h,precipitation:invalid}:h)),false,`invalid raw amount ${String(invalid)}`);
   assert.equal(full(date,timezone,display.map((h,i)=>i===3?{...h,precipitation:invalid}:h),raw),false,`invalid visible amount ${String(invalid)}`);
  }
  assert.equal(full(date,timezone,display.map((h,i)=>i===3?{...h,precipitation:NaN}:h),raw),false,'visible missing must not become zero during aggregation');
  assert.equal(full(date,timezone,display,[...raw,raw[3]]),false,'duplicate raw accumulation must not silently override a sample');
 }
 const previous=Date.now;
 try{
  Date.now=()=>Date.UTC(2026,9,17,17,45);
  const day={date:'2026-10-17',max:18,min:5,precipitation:12,rain:12,showers:0,snowfall:0,probability:95,code:63,sunshineDuration:8400,sunrise:'2026-10-17T06:00',sunset:'2026-10-17T18:00',weatherSourceId:'best_match',weatherSourceLabel:'Open-Meteo Best Match'};
  const hour=epoch=>({epoch,time:new Date(epoch).toISOString().slice(0,16),timezone:'UTC',temperature:12,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:3,cloud:80,isDay:false,sunshineDuration:null});
  const future=[hour(Date.UTC(2026,9,17,18)),hour(Date.UTC(2026,9,17,19)),hour(Date.UTC(2026,9,17,20))];
  const partial=reconcile([day],future)[0];
  assert.equal(partial.precipitation,12,'past morning rain must not vanish at 17:45');
  assert.equal(partial.rain,12);
  assert.equal(partial.code,63,'completed morning weather still belongs to the calendar day');
  assert.equal(partial.weatherSourceId,'best_match','partial hourly source must not impersonate a full daily product');
  const {raw}=rows('2026-10-17','UTC'),all=raw.map(h=>({...hour(h.epoch),precipitation:0}));
  all[3]={...all[3],precipitation:12,rain:12,probability:95,code:63};
  const complete=reconcile([day],all)[0];
  assert.ok(complete.precipitation>=11.99,'genuine early rain must survive late in day even with complete hourly coverage');
 }finally{Date.now=previous}
 console.log('MID .285: complete 23/24/25h local days, no missing-to-zero, full-day rain after 17:45, current model-hour Skybar with independent nowcast.');
}finally{rmSync(root,{recursive:true,force:true})}
