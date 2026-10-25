import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,design,pkgRaw,baselineRaw]=await Promise.all([
  readFile('src/App.tsx','utf8'),
  readFile('src/MidDesign.tsx','utf8'),
  readFile('package.json','utf8'),
  readFile('MID_BASELINE.json','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-design-2-0-1-current-thread-scientific-098547.mjs';

assert.ok(app.includes("currentThreadSeries=currentFullHourWindow(hours,w.timezone,solarNow,12)"),'12-h-Reihe muss auf der aktuellen vollen lokalen Stunde verankert sein.');
assert.ok(app.includes("fullHourMinuteInZone(Number(hour.epoch),timezone,minuteFormatterCache)===0")&&app.includes("const minuteFormatterCache:{formatter?:Intl.DateTimeFormat}={};")&&app.includes("if(cache)cache.formatter=formatter"),'Minutengenaue Zwischenpunkte dürfen nicht in die +12-h-Differenz eingehen; die IANA-Stundenprüfung muss erhalten bleiben.');
assert.ok(app.includes("currentThreadTargetEpoch=currentThreadStartEpoch+12*3600000"),'Ziel muss exakt +12 volle Stunden sein.');
assert.ok(app.includes("currentThreadTemperatures=currentThreadSeries.map(hour=>Number(hour.temperature))"),'Ziel muss aus derselben hyperlokal korrigierten Reihe stammen.');
assert.ok(app.includes("currentThreadTrendLabel=currentTemperatureRangeLabel(currentThreadTemperatures)"),'MID244: Spanne aus allen tatsächlich angezeigten Stundenwerten.');
assert.ok(!app.includes("function currentTemperatureTrendSummary(values:number[])")&&!app.includes("danach ↗")&&!app.includes("danach ↘"),'Mehrphasige Trendtexte müssen entfernt sein.');
assert.ok(app.includes("minimumSpan={4}"),'Die Sparkline muss mindestens 4 K Darstellungsbereich verwenden, damit kleine Änderungen nicht übertrieben werden.');
assert.ok(app.includes("Taupunkt / Feuchte</small><b>{Math.round(dew)} °C</b><em>{Math.round(hum)} %</em>"),'Taupunkt muss primär, relative Feuchte sekundär bleiben.');

assert.ok(design.includes("minimumSpan=4"),'MidWeatherThread braucht einen wissenschaftlich konservativen Mindestbereich.');
assert.ok(design.includes("span=Math.max(Math.max(.1,minimumSpan),rawRange*1.18)"),'Vertikalskala muss kleine Temperaturspannen begrenzen.');
assert.ok(design.includes("guideY=y(first.value)"),'Referenzlinie muss dem aktuellen Wert entsprechen statt einer bedeutungslosen festen Mitte.');
assert.ok(design.includes("points.forEach((value,index)=>"),'Stundenlücken müssen explizit verarbeitet werden.');
assert.ok(design.includes("if(segment.length){segments.push(segment.join(' '));segment=[]}"),'Fehlende Stunden müssen die Linie unterbrechen statt visuell interpoliert zu werden.');
assert.ok(design.includes("segments.map((path,index)=><path"),'Getrennte reale Segmente müssen separat gerendert werden.');

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
console.log('MID Design 2.0.1 / D.2: 12-h-Temperaturtrend ist zeitlich ehrlich, hyperlokal konsistent und visuell nicht überzeichnet.');

// Actual production functions: complete native first hour, unchanged later live slots.
const {build}=await import('esbuild');
const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {pathToFileURL}=await import('node:url');
const dir=mkdtempSync(join(tmpdir(),'mid-current-hour-'));
try{
 await build({entryPoints:['src/ShortTermForecast.tsx'],outfile:join(dir,'forecast.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {buildCurrentHourPrecipitation,buildShortTermForecast}=await import(pathToFileURL(join(dir,'forecast.mjs')));
 for(const instant of ['2026-03-29T00:00Z','2026-03-29T01:00Z','2026-10-25T00:00Z','2026-10-25T01:00Z','2027-03-28T01:00Z','2027-10-31T01:00Z']){
  const start=Date.parse(instant),hours=Array.from({length:30},(_,i)=>({epoch:start+(i-1)*3600000,time:new Date(start+(i-1)*3600000).toISOString(),timezone:'Europe/Berlin',temperature:10,apparent:10,humidity:70,dewPoint:5,pressure:1010,wind:10,gust:20,direction:270,cloud:80,lowCloud:30,midCloud:30,highCloud:20,visibility:20000,isDay:true,precipitation:12,rain:12,showers:0,snowfall:0,probability:90,code:61,sunshineDuration:0}));
  for(const minute of [0,1,17,45,59]){
   const now=start+minute*60000,anchor={active:true,precipitation:0,precipitationMinutes:60};
   const before=JSON.stringify(hours),live=buildShortTermForecast([],hours,'Europe/Berlin',now,anchor),result=buildCurrentHourPrecipitation([],hours,'Europe/Berlin',now,start,anchor),first=result.filter(p=>Number(p.precipitationIntervalStartEpoch)<start+3600000);
   assert.equal(first[0].precipitationIntervalStartEpoch,start);assert.equal(first.at(-1).precipitationIntervalEndEpoch,start+3600000);
   assert.ok(Math.abs(first.reduce((n,p)=>n+p.precipitation,0)-12)<1e-8,'Whole running hour retains rain already elapsed');
   assert.deepEqual(result.filter(p=>Number(p.precipitationIntervalStartEpoch)>=start+3600000),live.filter(p=>Number(p.precipitationIntervalStartEpoch)>=start+3600000),'Future adjusted forecast is unchanged');
   assert.equal(JSON.stringify(hours),before,'Native source amounts remain immutable');
  }
 }
}finally{rmSync(dir,{recursive:true,force:true})}