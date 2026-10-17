import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const app=readFileSync('src/App.tsx','utf8'),fusion=readFileSync('src/forecastFusion.ts','utf8'),raw=readFileSync('src/weather-src/20-mapping-day-character.tsfrag','utf8');
assert.match(app,/currentThreadSkyFullHours=hours\.filter\(hour=>Number\.isFinite\(hour\.epoch\)/,'current hour requires actual full-slot models, not a now-clipped proxy');
assert.match(app,/currentThreadSkySegments=detailSkyBarTimedSegments\(currentThreadSkyBaseHours,currentThreadStartEpoch/);
assert.match(app,/xEndPositions=\{currentThreadSkyXEndPositions\}/);
assert.doesNotMatch(fusion,/futureRelevant=relevant\.filter/,'a calendar day must not be replaced by the remaining fraction');
assert.match(fusion,/daySkybarUnavailableRanges\(relevant,dayWindow\)\.length===0/,'18 samples do not prove complete calendar coverage');
assert.match(raw,/minimumExpectedHours:firstHourPresent&&lastHourPresent/,'partial daily sunshine cannot masquerade as a full day');

const dir=mkdtempSync(join(tmpdir(),'mid-calendar-current-'));
try{
 await build({stdin:{contents:"export{reconcileForecastDaysWithHours}from'./src/forecastFusion';export{daySkybarCalendarWindow}from'./src/daySkybarTimeline';export{detailSkyBarTimedSegments}from'./src/detailSkyBar';",resolveDir:process.cwd()},outfile:join(dir,'qa.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent',loader:{'.css':'empty'}});
 const {reconcileForecastDaysWithHours,daySkybarCalendarWindow,detailSkyBarTimedSegments}=await import(pathToFileURL(join(dir,'qa.mjs')));
 const zone='Europe/Berlin',date='2026-10-17',window=daySkybarCalendarWindow(date,zone),h=3600000;
 assert.equal((window.endEpoch-window.startEpoch)/h,24);
 const local=epoch=>new Intl.DateTimeFormat('sv-SE',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(epoch).replace(' ','T');
 const hours=Array.from({length:24},(_,i)=>({epoch:window.startEpoch+i*h,time:local(window.startEpoch+i*h),timezone:zone,temperature:10,precipitation:i===2?2:0,rain:i===2?2:0,showers:0,snowfall:0,probability:i===2?80:0,cloud:25,code:i===2?61:1,isDay:i>=7&&i<=18,sunshineDuration:i>=8&&i<12?3600:0}));
 const day={date,code:61,min:5,max:15,precipitation:2,rain:2,showers:0,snowfall:0,probability:80,sunshineDuration:14400,sunrise:date+'T07:30',sunset:date+'T18:30'};
 const dateNow=Date.now;
 try{
  Date.now=()=>Date.parse('2026-10-17T15:30:00Z'); // 17:30 local
  const full=reconcileForecastDaysWithHours([day],hours)[0];
  assert.ok(full.precipitation>=1.9,'rain at 02:00 persists in the 17:30 calendar-day total');
  const partial=reconcileForecastDaysWithHours([day],hours.slice(6))[0];
  assert.equal(partial.precipitation,2,'incomplete 18-hour future coverage cannot replace the daily sum');
  assert.equal(partial.sunshineDuration,14400,'daily sunshine fallback retains elapsed sunshine');
 }finally{Date.now=dateNow}
 const start=window.startEpoch+9*h,now=start+45*60000,end=start+12*h;
 const sample={...hours[9],epoch:start,precipitationIntervalStartEpoch:start,precipitationIntervalEndEpoch:start+h,cloud:90};
 const fullBar=detailSkyBarTimedSegments([sample],start,end,2,2,120,8).find(row=>row.layer==='base');
 assert.ok(fullBar&&Math.abs(fullBar.x1-2)<.001,'the model-hour segment starts at the beginning of the current hour, not 09:45');
 assert.ok(fullBar.x2>fullBar.x1,'the current full-hour interval is retained');
 for(const [d,expected]of [['2026-03-29',23],['2026-10-25',25]]){const w=daySkybarCalendarWindow(d,zone);assert.equal((w.endEpoch-w.startEpoch)/h,expected)}
 console.log('MID .284: complete current hour, past rain and sunshine in full day, no fake 18-hour day, 23/25h DST windows.');
}finally{rmSync(dir,{recursive:true,force:true})}
