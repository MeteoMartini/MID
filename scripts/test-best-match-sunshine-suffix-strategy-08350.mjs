import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=fs.readFileSync(path.join(root,'worker','metar-proxy.js'),'utf8');
const fusionSource=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
const app=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');

for(const token of [
 'fetchForecastFusionModels',
 'forecastModelSeries',
 'parseForecastFusionModelPayload',
 'multiModelSuffixes',
 'modelSuffixes',
 'forecastModelSeriesEntry',
 'weatherBundleIssues',
 'selectWeatherRepair',
 "sourceRole:repaired?'repair':'best-match'",
 'Best Match bleibt für Kurzfrist, 7-Tage-Vorhersage',
 'suffixFields',
 'MOSMIX wird bewusst nur als lokales Postprocessing'
])assert.ok(worker.includes(token),`Best-Match-/Suffixstrategie fehlt im Worker: ${token}`);

for(const token of [
 'canonicalSunshineDaySeconds',
 'daylightSecondsFromLocalTimes',
 'Der Sunshine-Contract aggregiert jeden lokalen Kalendertag immer aus der vollständigen finalen Stundenreihe',
 'dailySunshineReference=day.sunshineDurationMeta?day.sunshineDurationMeta.dailyReferenceSeconds:day.sunshineDuration',
 "weatherBundleKind:repaired?'coherent-model':'best-match'",
 'repairedHours',
 'multiModelSuffixes',
 "const CACHE_PREFIX='mid:forecast-fusion:v9:'"
])assert.ok(fusionSource.includes(token),`Sonnenstunden-/Bündelvertrag fehlt im Frontend: ${token}`);
assert.ok(app.includes('Best Match · geprüft und lokal nachkorrigiert'),'7-Tage-Ansicht muss Best Match als Primärprognose benennen');
for(const token of [
 'applyLocalTwinForecastFromReport(fusedDays,twinForecastReport,radarAnalysis)',
 'applyLocalTwinHours(favoriteKey(loc),fusionHours,fusedDays,localTwinDays,radarAnalysis)'
])assert.ok(app.includes(token),`Lokale Nachkorrektur muss auf der bereits geprüften Best-Match-Prognose aufsetzen: ${token}`);
for(const token of ['<MemoCurrent key={id} w={w!} hours={displayHours} days={displayDays}','<MemoForecast key={`forecast:${layoutMode}:${layoutRevision}:${weatherTwinSettings.useAsMainForecast}`} days={displayDays} hours={displayHours}','<MemoLazyEnsembles data={ens} scenarios={ensembleScenarios} models={models} runs={modelStatusRuns} days={displayDays} hours={displayHours}','<Widget loc={loc!} days={displayDays} hours={displayHours}'])assert.ok(app.includes(token),`Sektion verwendet nicht die zentral abgeglichenen Sonnenstunden: ${token}`);

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{}
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-sunshine-best-match-'));
try{
 const executable=fusionSource
  .replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used')};")
 .replace("import {reconcileForecastPrecipitation} from './precipitation';",`const reconcileForecastPrecipitation=input=>({precipitation:Math.max(0,Number(input.precipitation)||0),rain:Math.max(0,Number(input.rain)||0),showers:Math.max(0,Number(input.showers)||0),snowfall:Math.max(0,Number(input.snowfall)||0),probability:Math.max(0,Math.min(100,Number(input.probability)||0)),code:Math.round(Number(input.code)||0),traceSuppressed:false});`)
  .replace("import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';","const readStoredJsonCache=()=>undefined;const writeStoredJsonCache=()=>false;")
  .replace("import {boundedSunshineSeconds,canonicalSunshineDaySeconds,daylightSecondsFromLocalTimes} from './sunshineDuration';",`const boundedSunshineSeconds=(value,maximum)=>value===null||value===undefined||value===''||!Number.isFinite(Number(value))?null:Math.min(Math.max(0,Number(maximum)||0),Math.max(0,Number(value)));const daylightSecondsFromLocalTimes=(sunrise,sunset)=>{const seconds=value=>{const match=String(value??'').match(/T(\\d{2}):(\\d{2})(?::(\\d{2}))?/);return match?Number(match[1])*3600+Number(match[2])*60+Number(match[3]||0):NaN},rise=seconds(sunrise),set=seconds(sunset);return Number.isFinite(rise)&&Number.isFinite(set)?Math.min(86400,set>=rise?set-rise:set+86400-rise):43200};const canonicalSunshineDaySeconds=({hourValues,dailyValue,daylightSeconds})=>{const valid=hourValues.map(value=>boundedSunshineSeconds(value,3600)),complete=hourValues.length>=18&&valid.every(value=>value!==null),daily=boundedSunshineSeconds(dailyValue,daylightSeconds),value=complete?Math.min(daylightSeconds,valid.reduce((sum,value)=>sum+value,0)):daily;return{valueSeconds:value,source:complete?'hourly':value===null?'missing':'daily-fallback',quality:complete?'consistent':value===null?'missing':'fallback',daylightSeconds,hourlySamples:valid.filter(value=>value!==null).length,expectedHourlySamples:hourValues.length,dailyReferenceSeconds:daily,deviationSeconds:complete&&daily!==null?value-daily:null}};`)
  .replace("import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'');
 const out=ts?ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'forecastFusion.ts',reportDiagnostics:true}):{outputText:stripTypeScriptTypes(executable,{mode:'transform'}),diagnostics:[]};
 const errors=(out.diagnostics||[]).filter(item=>item.category===ts?.DiagnosticCategory?.Error);
 assert.equal(errors.length,0,errors.map(item=>ts?.flattenDiagnosticMessageText(item.messageText,' ')??String(item.messageText)).join('\n'));
 const modulePath=path.join(tempDir,'forecastFusion.mjs');fs.writeFileSync(modulePath,out.outputText);const fusion=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);

 const originalNow=Date.now;Date.now=()=>Date.UTC(2026,7,2,18,22);
 try{
  const hour=(date,index,sunshineDuration=0)=>({time:`${date}T${String(index).padStart(2,'0')}:00`,epoch:Date.UTC(2026,7,Number(date.slice(-2)),index),timezone:'Europe/Berlin',temperature:20,apparent:20,humidity:60,dewPoint:12,pressure:1015,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:1,wind:5,gust:8,direction:180,cloud:25,lowCloud:5,uvIndex:0,visibility:10000,cape:0,sunshineDuration,isDay:index>=6&&index<=20});
  const day=(date,sunshineDuration)=>({date,code:1,max:25,min:14,sunshineDuration,precipitation:0,probability:0,wind:5,gust:8,direction:180,uvMax:5,sunrise:`${date}T06:00:00+02:00`,sunset:`${date}T21:00:00+02:00`});

  const currentHours=Array.from({length:24},(_,index)=>hour('2026-08-02',index,index>=19&&index<=21?2280:0)); // 1,9 h im verbleibenden Abendfenster
  const current=fusion.reconcileForecastDaysWithHours([day('2026-08-02',46800)],currentHours)[0];
  assert.equal(current.sunshineDuration,6840,'auch der aktuelle lokale Kalendertag muss bei vollständiger Stundenreihe aus genau diesen Stunden aggregiert werden');

  const futureBestMatchHours=Array.from({length:24},(_,index)=>({...hour('2026-08-03',index,index>=6&&index<18?3600:0),weatherBundleKind:'best-match'}));
  const futureBestMatch=fusion.reconcileForecastDaysWithHours([day('2026-08-03',46800)],futureBestMatchHours)[0];
  assert.equal(futureBestMatch.sunshineDuration,43200,'vollständige Best-Match-Stunden müssen unabhängig von einer Reparatur den lokalen Tageswert bilden');

  const futureRepairHours=futureBestMatchHours.map(item=>({...item,weatherBundleKind:'coherent-model'}));
  const futureRepair=fusion.reconcileForecastDaysWithHours([day('2026-08-03',46800)],futureRepairHours)[0];
  assert.equal(futureRepair.sunshineDuration,43200,'nach einer notwendigen kohärenten Bündelreparatur soll der Zukunftstag aus den finalen Stunden auf 12 h aggregieren');

  const incompleteHours=Array.from({length:12},(_,index)=>hour('2026-08-04',index+6,3600));
  const incomplete=fusion.reconcileForecastDaysWithHours([day('2026-08-04',46800)],incompleteHours)[0];
  assert.equal(incomplete.sunshineDuration,46800,'unvollständige Stundenabdeckung darf den vollständigen Best-Match-Tageswert nicht ersetzen');
 }finally{Date.now=originalNow}
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

console.log('Best Match, API-Suffixaudit und Sunshine-Contract geprüft: vollständige lokale Stunden bilden jeden Tageswert; Daily bleibt Fallback und Qualitätsreferenz.');
