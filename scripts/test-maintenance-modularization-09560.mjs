import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const concat=async paths=>(await Promise.all(paths.map(path=>readFile(new URL(path,root),'utf8')))).join('');
const [styles,weather,worker,rootWorker,app,sevenDay,analysisCache,thunderCache,pkgText,baselineText]=await Promise.all([
 readFile(new URL('src/styles.css',root),'utf8'),readFile(new URL('src/weather.ts',root),'utf8'),readFile(new URL('worker/metar-proxy.js',root),'utf8'),readFile(new URL('worker.js',root),'utf8'),readFile(new URL('src/App.tsx',root),'utf8'),readFile(new URL('src/SevenDayForecastSummary.tsx',root),'utf8'),readFile(new URL('src/analysisCache.ts',root),'utf8'),readFile(new URL('src/thunderPlaceCache.ts',root),'utf8'),readFile(new URL('package.json',root),'utf8'),readFile(new URL('MID_BASELINE.json',root),'utf8')
]);
const styleModules=await concat(['src/styles-src/00-foundation.css','src/styles-src/10-features.css','src/styles-src/20-ensemble-composite.css','src/styles-src/25-extreme-outlook.css','src/styles-src/30-modern.css']);
const weatherModules=await concat(['src/weather-src/00-types-models-search.tsfrag','src/weather-src/10-observations-specialized.tsfrag','src/weather-src/20-mapping-day-character.tsfrag','src/weather-src/30-ensemble-climate-hazards.tsfrag']);
const workerModules=await concat(['worker-src/00-core-observations.js','worker-src/05-knmi-eps-cache.js','worker-src/10-radar-nowcast.js','worker-src/20-composite-models.js','worker-src/25-dach-extreme-outlook.js','worker-src/30-push-events.js','worker-src/40-aviation-router.js']);
assert.equal(styles,styleModules,'styles.css weicht von den kanonischen Style-Modulen ab.');
assert.equal(weather,weatherModules,'weather.ts weicht von den kanonischen Weather-Modulen ab.');
assert.equal(worker,workerModules,'worker/metar-proxy.js weicht von den kanonischen Worker-Modulen ab.');
assert.equal(rootWorker,workerModules,'worker.js weicht vom kanonischen Worker-Aggregat ab.');
assert.ok(app.includes("from './SevenDayForecastSummary'"),'App bindet das ausgelagerte 7-Tage-Modul nicht ein.');
assert.ok(!app.includes("type SevenDayWeatherRegime='sunny'"),'7-Tage-Implementierung ist weiterhin monolithisch in App.tsx enthalten.');
assert.ok(sevenDay.includes('export function buildSevenDayForecastSummary'),'7-Tage-Auswertungsmodul fehlt.');
assert.ok(app.includes("from './analysisCache'"),'Analysecache ist nicht ausgelagert.');
assert.ok(analysisCache.includes('export function readAnalysisCacheEntry'),'Analysecache-Modul unvollständig.');
assert.ok(app.includes("from './thunderPlaceCache'"),'Gewitter-Ortscache ist nicht ausgelagert.');
assert.ok(thunderCache.includes('export async function resolveThunderPlace'),'Gewitter-Ortscache-Modul unvollständig.');
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-maintenance-modularization-09560.mjs';
assert.equal(pkg.scripts?.['test:maintenance-modularization'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test));
assert.ok(baseline.regressionTests?.includes(test));
console.log('Funktionsneutrale Modularisierung geprüft: Styles, weather.ts und Worker werden aus kanonischen Teilquellen bytegleich erzeugt; 7-Tage- und Cache-Logik sind aus App.tsx ausgelagert.');
