import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [panel,fusion,weather,app,css,worker,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Ein explizites Event-Reload darf nicht die bereits gerenderte Ortsvorhersage erneut verwenden.
assert.match(panel,/buildPlan\([^\n]+signal:AbortSignal,forceFresh=false\)/,'Event-Plan besitzt keinen expliziten Fresh-Reload-Vertrag.');
assert.match(panel,/canonical=!forceFresh&&sameForecastLocation\(location,initialLocation\)&&canonicalHours\.length>0/,'Fresh-Reload kann weiterhin stale canonicalHours wiederverwenden.');
assert.match(panel,/buildPlan\(record\.location,record\.date,record\.startTime,record\.endTime,record\.environment,record\.activity,record\.title,controller\.signal,true\)/,'Gespeicherte Events erzwingen keine frische Neubewertung.');
assert.match(panel,/currentSavedRecord\?void analyseEvent\(undefined,true,true\):saveCurrentPlan\(false\)/,'Detail-Reload erzwingt keine frische Neubewertung.');
assert.match(panel,/setInterval\(\(\)=>\{void analyseEvent\(undefined,true,true\)\},AUTO_REFRESH_MS\)/,'Automatischer Event-Refresh verwendet weiterhin den alten Forecast-Snapshot.');

// Fusion und Event-Ensemble müssen ihre Client-Caches bei explizitem Reload umgehen.
assert.match(fusion,/forceRefresh\?null:readCache\(lat,lon,FRESH_MS\)/,'Forecast-Fusion umgeht den lokalen Fresh-Cache nicht.');
assert.match(fusion,/refresh:forceRefresh\?1:undefined/,'Forecast-Fusion signalisiert dem Worker keinen Fresh-Reload.');
assert.match(fusion,/cache:forceRefresh\?'no-store':'default'/,'Forecast-Fusion nutzt bei Fresh-Reload nicht no-store.');
assert.match(weather,/forceRefresh\?null:readEventEnsembleCache\(lat,lon,date,startTime,endTime,ENSEMBLE_FRESH_CACHE_MS\)/,'Event-Ensemble verwendet bei Fresh-Reload weiterhin den lokalen Cache.');

// Der Worker muss bei refresh=1 auch seinen Upstream-Cache umgehen.
assert.match(worker,/refresh=url\.searchParams\.get\('refresh'\)==='1'/,'Worker erkennt keinen expliziten Forecast-Fusion-Refresh.');
assert.match(worker,/fetchForecastFusionModels\(selected,lat,lon,elevation,env,refresh\)/,'Worker reicht den Refresh nicht an die Modellabfrage weiter.');
assert.match(worker,/fetchMosmixForecast\(lat,lon,elevation,country,refresh\)/,'Worker reicht den Refresh nicht an MOSMIX weiter.');
assert.match(worker,/cf:refresh\?\{cacheEverything:false\}:\{cacheTtl:1200,cacheEverything:true\}/,'Worker umgeht bei Fresh-Reload den 20-Minuten-Upstream-Cache nicht.');
assert.match(worker,/forceRefreshed:refresh/,'Worker diagnostiziert einen erzwungenen Refresh nicht.');

// Info-Button der hyperlokalen Analyse bleibt rechts im bestehenden Kartenraum.
assert.match(app,/className="current-analysis-trigger" label="Hyperlokale Analyse erklären"/,'Hyperlokaler Info-Trigger besitzt keine platzsparende Positionsklasse.');
assert.match(css,/\.hero aside>span>\.current-analysis-trigger\{position:absolute;top:50%;right:9px;/,'Hyperlokaler Info-Button ist nicht rechts im bestehenden Kartenraum positioniert.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-force-refresh-ui-09534.mjs'),'Fresh-Reload-Regression muss Required sein.');
console.log(`MID v${pkg.version}: Event-Fresh-Reload und platzsparender Hyperlokal-Info-Trigger geprüft.`);
