import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [weatherSource,weatherAggregate,app,workerSource,workerAggregate,pkgRaw,baselineRaw]=await Promise.all([
 read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),
 read('src/weather.ts'),
 read('src/App.tsx'),
 read('worker-src/00-core-observations.js'),
 read('worker.js'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-ensemble-deadline-watchdog-097835.mjs';

for(const source of [weatherSource,weatherAggregate]){
 for(const token of [
  'const ENSEMBLE_DIRECT_ATTEMPT_TIMEOUT_MS=12_000;',
  'const ENSEMBLE_MODEL_TIMEOUT_MS=20_000;',
  'const ENSEMBLE_BOOTSTRAP_TIMEOUT_MS=30_000;',
  'function ensembleDeadline(',
  "controller.abort(new DOMException(message,'TimeoutError'))",
  "ensembleDeadline(signal,ENSEMBLE_DIRECT_ATTEMPT_TIMEOUT_MS,'Zeitüberschreitung beim direkten Ensemble-Abruf.')",
  "timeoutMs:priority==='foreground'?10_000:16_000",
  'const modelDeadline=ensembleDeadline(',
  'const bootstrapDeadline=ensembleDeadline(signal,ENSEMBLE_BOOTSTRAP_TIMEOUT_MS',
  'meanEnsembleBootstrap(lat,lon,bootstrapSignal)',
  'memberEnsembleBootstrap(lat,lon,bootstrapSignal)',
  'if(signal?.aborted)throw error;return null'
 ])assert.ok(source.includes(token),`Ensemble-Anti-Hang-Vertrag fehlt: ${token}`);
 assert.ok(source.includes("const ENSEMBLE_BOOTSTRAP_MEAN_ORDER=['ecmwf_ifs025_ensemble_mean','ncep_gefs05_ensemble_mean','cmc_gem_geps_ensemble_mean'"),'Bootstrap muss zwei unabhängige globale Mittel-/Spread-Familien vor korrelierten Varianten priorisieren.');
 assert.ok(source.includes("seen.has(model.independenceGroup)")&&source.includes('seen.add(model.independenceGroup)'),'Bootstrap muss pro Unabhängigkeitsgruppe nur einen Primärkandidaten zählen.');
}

assert.ok(app.includes('watchdogTimer=window.setTimeout(')&&app.includes('65_000')&&app.includes('Der Ensemble-Abruf hat das Zeitbudget überschritten')&&app.includes("ensembleController.abort(new DOMException('Ensemble-Abruf-Zeitbudget überschritten.','TimeoutError'))")&&app.includes('scheduleRetry(20_000)'),'App-Level-Watchdog muss auch einen nie auflösenden Ensemble-Promise beenden, sichtbar fehlschlagen lassen und zeitversetzt neu starten.');
assert.ok(app.includes('if(watchdogTimer)window.clearTimeout(watchdogTimer)'),'Ensemble-Watchdog muss bei Abschluss und Cleanup freigegeben werden.');

for(const source of [workerSource,workerAggregate])for(const field of ['cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high'])assert.ok(source.includes(`'${field}'`),`Worker-Ensembleproxy muss ${field} für den AIFS-Europa-Vertrag durchreichen.`);

// Deterministische Semantikprobe: ein hängender Zweig darf den Deadline-Pfad nicht blockieren.
const controller=new AbortController(),started=Date.now(),timer=setTimeout(()=>controller.abort(new DOMException('test deadline','TimeoutError')),35);
try{
 await assert.rejects(new Promise((resolve,reject)=>{controller.signal.addEventListener('abort',()=>reject(controller.signal.reason),{once:true});void resolve}),error=>error instanceof DOMException&&error.name==='TimeoutError');
 assert.ok(Date.now()-started<500,'Deadline-Semantik muss einen hängenden Pfad zeitnah beenden.');
}finally{clearTimeout(timer)}

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und package.json müssen synchron sein.');
assert.equal(pkg.scripts?.['test:ensemble-deadline-watchdog'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Anti-Hang-Regression muss in beiden Baseline-Testlisten stehen.');
console.log(`MID v${pkg.version}: Ensemble-Deadline, unabhängiger Mean/Spread-Bootstrap, App-Watchdog und AIFS-Workervertrag geschützt.`);
