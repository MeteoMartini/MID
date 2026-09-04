import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [models,ensemble,aggregate,app,cockpit,styles,guard,pkgRaw,baselineRaw]=await Promise.all([
 read('src/weather-src/00-types-models-search.tsfrag'),
 read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),
 read('src/weather.ts'),
 read('src/App.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('src/styles-src/30-modern.css'),
 read('src/openMeteoGuard.ts'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-ensemble-rate-budget-sunshine-097837.mjs';
for(const source of [models,aggregate]){
 assert.ok(source.includes("const ENSEMBLE_FRESH_CACHE_MS=60*60*1000;"),'Finales Ensemble muss eine Stunde lokal frisch bleiben, um unnötige Wiederholungsabrufe zu vermeiden.');
 assert.ok(source.includes("const ensembleFullPriority=['ecmwf_ifs_europe_ensemble'")&&source.includes('function selectedFullEnsembleModels(lat:number,lon:number)'),'Vollensemble muss die langreichweitigen unabhängigen Modellfamilien zuerst laden.');
}
for(const source of [ensemble,aggregate]){
 assert.ok(source.includes('const ENSEMBLE_MODEL_TIMEOUT_MS=20_000;'),'Ein einzelnes Vollensemble-Modell darf den mobilen Nachladepfad nicht länger als 20 s blockieren.');
 assert.ok(source.includes('loadEnsembleUnits(selected,6,async model=>')&&source.includes('),signal,2);'),'Vollensemble muss auf sechs erfolgreiche Modellrouten und zwei gleichzeitige Abrufe begrenzt bleiben.');
 assert.ok(source.includes("priority==='background'||isOpenMeteoRateLimitError(error)"),'Hintergrundabrufe dürfen bei Fehlern keine zusätzliche direkte Wiederholung erzeugen.');
 assert.ok(source.includes('function ensembleVariableFallbackEligible(error:unknown)')&&source.includes('!ensembleVariableFallbackEligible(error)') ,'Variablenreduktion darf nur bei plausiblen Variablen-/Parameterfehlern zusätzliche Requests erzeugen.');
}
assert.ok(guard.includes('const MAX_ACTIVE=2;')&&guard.includes('const START_GAP_MS=220;'),'Globaler Open-Meteo-Guard muss bei zwei parallelen Requests und Startabstand bleiben.');
assert.ok(app.includes('if(value.bootstrap)scheduleRetry(2_000)'),'Nach sichtbarem Mean/Spread-Bootstrap muss die Vollfusion nach 2 s anlaufen.');
assert.ok(cockpit.includes('probabilityHours=displayHours.filter(hour=>hour.time.startsWith(day.date))')&&cockpit.includes('calendarDayHours=probabilityHours'),'PoP-Altvertrag und volle 24-h-Skybar müssen gleichzeitig erhalten bleiben.');
assert.ok(cockpit.includes('intensity=.42+ratio*.58')&&cockpit.includes('sun-base sun-ray')&&!cockpit.includes('activeRays=Math.round'),'Relative Sonne muss immer als vollständiges Achtstrahl-Symbol gezeichnet werden; Anteil wird nur über Intensität/Kernfüllung codiert.');
const sunCss=styles.slice(styles.indexOf('.cockpit-relative-sun{'),styles.indexOf('.cockpit-fourteen-sunshine>span'));assert.ok(sunCss.includes('.sun-ray{shape-rendering:geometricPrecision}')&&!sunCss.includes('vector-effect:non-scaling-stroke'),'Kleine Sonnensymbole dürfen nicht durch nicht skalierende, zu dicke Striche verzerrt werden.');
assert.equal(baseline.releaseVersion,pkg.version);assert.equal(baseline.version,pkg.version);
assert.equal(pkg.scripts?.['test:ensemble-rate-budget-sunshine'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'v0.9.78.37-Regression muss verpflichtend sein.');
console.log(`MID v${pkg.version}: schnelle Vollensemble-Nachladung mit Request-Budget sowie vollständige relative Sonnendarstellung geschützt.`);
