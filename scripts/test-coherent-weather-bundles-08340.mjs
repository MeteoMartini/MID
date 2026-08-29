import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {inlineSunshineDurationContract} from './sunshine-duration-regression-helper.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=fs.readFileSync(path.join(root,'worker','metar-proxy.js'),'utf8');
const fusionSource=fs.readFileSync(path.join(root,'src','forecastFusion.ts'),'utf8');
const precipitationSource=fs.readFileSync(path.join(root,'src','precipitation.ts'),'utf8');
const verification=fs.readFileSync(path.join(root,'src','forecastVerification.ts'),'utf8');
const app=fs.readFileSync(path.join(root,'src','App.tsx'),'utf8');

for(const token of [
 'FORECAST_FUSION_HOURLY',
 'fetchForecastFusionModels',
 'forecastModelSeries',
 'repairAuthorityCandidates',
 'weatherBundleIssues',
 'coherentWeatherHours',
 'multiModelSuffixes',
 'modelSuffixes',
 'suffixFields',
 'Best Match bleibt die kohärente Basis',
 'MOSMIX lokal',
 "family:'ecmwf-ifs'","family:'ecmwf-aifs'","independenceGroup:'ecmwf'"
])assert.ok(worker.includes(token),`Worker-Horizont-/Bündelvertrag fehlt: ${token}`);
assert.ok(!worker.includes("family:'aifs'"),'IFS und AIFS dürfen nicht als unabhängige ECMWF-Familien doppelt gewichtet werden');
assert.ok(worker.includes('MOSMIX wird bewusst nur als lokales Postprocessing'),'MOSMIX-Parametergrenze fehlt');
assert.ok(!worker.includes('mosmixProbability('),'MOSMIX darf keine Niederschlagswahrscheinlichkeit in den Postprocessing-Pfad tragen');
for(const token of [
 'ForecastWeatherBundleHour',
 'weatherHours?:ForecastWeatherBundleHour[]',
 "weatherBundleKind:repaired?'coherent-model':'best-match'",
 'Der Wetter-/Niederschlagszustand bleibt vollständig',
 'Eine Tagesaggregation darf keine bislang nicht vorhandene Niederschlagsstunde',
 'canonicalSunshineDaySeconds',
 'boundedSunshineSeconds(weather.sunshineDuration,3600)',
 'relativeHumidityFromTemperatureDewPoint'
])assert.ok(fusionSource.includes(token),`Frontend-Bündelvertrag fehlt: ${token}`);
assert.ok(!fusionSource.includes('distributeDailyPrecipitationDeficit'),'Tagesmengen dürfen keine künstlichen Stunden erzeugen');
for(const token of ['ein gemeinsames Wetterbündel','const weatherRepresentative=','verschiebt keine Regenwahrscheinlichkeit über den gesamten Tag'])assert.ok(verification.includes(token),`Wetterzwilling-Bündelvertrag fehlt: ${token}`);
assert.ok(app.includes('Wetter-/Niederschlagsbündel:'),'Stundenansicht muss die konkrete Wetterquelle transparent ausweisen');
for(const token of ['WEAK_FORECAST_AMOUNT_MAX_MM=.35','deterministicSignalMinimumProbability','sky-contradiction','phaseAdjusted'])assert.ok(precipitationSource.includes(token),`physikalischer Konsistenzvertrag fehlt: ${token}`);

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{}
const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-coherent-weather-'));
try{
 const precipOut=ts?ts.transpileModule(precipitationSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'precipitation.ts',reportDiagnostics:true}):{outputText:stripTypeScriptTypes(precipitationSource,{mode:'transform'}),diagnostics:[]};
 const precipErrors=(precipOut.diagnostics||[]).filter(item=>item.category===ts?.DiagnosticCategory?.Error);assert.equal(precipErrors.length,0,precipErrors.map(item=>ts?.flattenDiagnosticMessageText(item.messageText,' ')??String(item.messageText)).join('\n'));
 const precipPath=path.join(tempDir,'precipitation.mjs');fs.writeFileSync(precipPath,precipOut.outputText);
 const precip=await import(`${pathToFileURL(precipPath).href}?v=${Date.now()}`);
 const distant=precip.reconcileForecastPrecipitation({precipitation:.1,rain:.1,probability:10,code:61,cloud:45,lowCloud:10,cape:40,sunshineDuration:2600,isDay:true,leadHours:120});
 assert.equal(distant.precipitation,0,'Tag-5-Spur 0,1 mm/10 % darf nicht als deterministischer Regen erscheinen');
 assert.equal(distant.probability,10,'probabilistische Rohinformation bleibt sichtbar');
 const convective=precip.reconcileForecastPrecipitation({precipitation:.4,rain:.05,showers:.35,probability:35,code:61,cloud:55,lowCloud:15,cape:350,sunshineDuration:1800,isDay:true,leadHours:96});
 assert.ok([80,81,82].includes(convective.code),'aufgelockerte konvektive Lage wird als Schauer statt Dauerregen klassifiziert');
 const stratiform=precip.reconcileForecastPrecipitation({precipitation:.4,rain:.4,probability:35,code:61,cloud:95,lowCloud:85,humidity:94,sunshineDuration:0,isDay:true,leadHours:96});
 assert.equal(stratiform.code,61,'geschlossene feuchte Schichtbewölkung darf Regen tragen');

 const executable=inlineSunshineDurationContract(fusionSource)
 .replace("import {fetchWorkerJson} from './workerClient';","const fetchWorkerJson=async()=>{throw new Error('not used')};")
 .replace("import {reconcileForecastPrecipitation} from './precipitation';",`const reconcileForecastPrecipitation=input=>{const precipitation=Math.max(0,Number(input.precipitation)||0),rain=Math.max(0,Number(input.rain)||0),showers=Math.max(0,Number(input.showers)||0),snowfall=Math.max(0,Number(input.snowfall)||0),probability=Math.max(0,Math.min(100,Number(input.probability)||0)),code=Math.round(Number(input.code)||0),wet=[51,53,55,56,57,61,63,65,66,67,68,69,71,73,75,77,80,81,82,83,84,85,86,95,96,97,99].includes(code),lead=Math.max(0,Number(input.leadHours)||0),minimum=lead<=24?10:lead<=72?15:20,weak=Math.max(precipitation,rain,showers,snowfall)<=.35,suppress=(wet||precipitation>=.01||rain>=.01||showers>=.01||snowfall>=.01)&&(probability<=5||weak&&probability<minimum);return suppress?{precipitation:0,rain:0,showers:0,snowfall:0,probability,code:3,traceSuppressed:true}:{precipitation,rain,showers,snowfall,probability,code,traceSuppressed:false}};`)
  .replace("import {readStoredJsonCache,writeStoredJsonCache} from './cachePolicy';","const readStoredJsonCache=()=>undefined;const writeStoredJsonCache=()=>false;")
  .replace("import type {Day,Hour,RadarNowcast,ThunderstormNowcast} from './weather';",'');
 const fusionOut=ts?ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'forecastFusion.ts',reportDiagnostics:true}):{outputText:stripTypeScriptTypes(executable,{mode:'transform'}),diagnostics:[]};
 const fusionErrors=(fusionOut.diagnostics||[]).filter(item=>item.category===ts?.DiagnosticCategory?.Error);assert.equal(fusionErrors.length,0,fusionErrors.map(item=>ts?.flattenDiagnosticMessageText(item.messageText,' ')??String(item.messageText)).join('\n'));
 const fusionPath=path.join(tempDir,'forecastFusion.mjs');fs.writeFileSync(fusionPath,fusionOut.outputText);const fusion=await import(`${pathToFileURL(fusionPath).href}?v=${Date.now()}`);
 const originalNow=Date.now,now=Date.UTC(2026,7,2,17,0);Date.now=()=>now;
 try{
  const epoch=now+12*3600000,date=new Date(epoch).toISOString().slice(0,10),baseHour={time:new Date(epoch).toISOString().slice(0,16),epoch,timezone:'Europe/Berlin',temperature:20,apparent:20,humidity:70,dewPoint:14,pressure:1015,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:2,wind:5,gust:8,direction:180,cloud:55,lowCloud:20,uvIndex:0,visibility:10000,cape:20,sunshineDuration:1800,isDay:true,weatherSourceId:'best_match',weatherSourceLabel:'Open-Meteo Best Match',weatherBundleKind:'best-match'};
  const day={date,code:2,max:24,min:14,sunshineDuration:36000,precipitation:0,probability:0,wind:5,gust:8,direction:180,uvMax:5};
  const result=fusion.applyForecastFusionHours([baseHour],[day],[day],{active:true,days:[],sources:[],schema:'mid.forecast-fusion.v1',version:4,generatedAt:new Date(now).toISOString(),summary:'',strategy:'',hours:[{time:baseHour.time,epoch,temperature:18,dewPoint:30,humidity:100,pressure:1018,precipitation:5,probability:95,wind:4,gust:7}],weatherHours:[{time:baseHour.time,epoch,precipitation:0,rain:0,showers:0,snowfall:0,probability:12,code:1,cloud:35,lowCloud:10,cape:0,sunshineDuration:2400,sourceId:'icon_d2',sourceLabel:'DWD ICON-D2',sourceFamily:'dwd'}],mosmix:{available:true,applied:true,quality:.9}})[0];
  assert.equal(result.precipitation,0,'MOSMIX-Niederschlag darf das kohärente ICON-Bündel nicht überschreiben');
  assert.equal(result.probability,12,'Wahrscheinlichkeit muss aus demselben Wetterbündel stammen');
  assert.equal(result.code,1);assert.equal(result.cloud,35);assert.equal(result.weatherSourceId,'icon_d2');
  assert.notEqual(result.temperature,baseHour.temperature,'MOSMIX darf Temperatur qualitätsgesichert nachkorrigieren');
  assert.ok(result.dewPoint<=result.temperature,'Taupunkt darf nach lokaler Nachkorrektur die Temperatur nicht überschreiten');
  assert.ok(result.humidity>=0&&result.humidity<=100,'relative Feuchte bleibt aus Temperatur und Taupunkt physikalisch konsistent');
 }finally{Date.now=originalNow}
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}
console.log('Best-Match-zentrierte Wetterbündel geprüft: API-Suffixe, gezielte Reparatur, keine Parameterkreuzung und physikalisch konsistente Regen-/Schauerphase.');
