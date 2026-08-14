import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [panel,engine,refresh,fusion,weather,app,css,worker,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherRefresh.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Ein explizites Event-Reload darf nicht die bereits gerenderte Ortsvorhersage erneut verwenden.
assert.match(engine,/forceFresh\?:boolean/,'Event-Plan besitzt keinen expliziten Fresh-Reload-Vertrag.');
assert.match(engine,/canonicalActive=Boolean\(!forceFresh&&canonical&&sameForecastLocation/,'Fresh-Reload kann weiterhin stale canonicalHours wiederverwenden.');
assert.match(refresh,/const forceFresh=isManualReason\(reason\)/,'Broker unterscheidet manuelle Fresh-Reloads nicht von automatischer Hintergrundpflege.');
assert.match(refresh,/buildEventPlan\(\{location:record\.location[\s\S]*forceFresh\}\)/,'Event-Build übernimmt den manuellen Fresh-Status nicht.');
assert.match(panel,/refreshEventWeather\(currentSavedRecord\.id,\{reason:'detail'\}\)/,'Detail-Reload nutzt nicht den zentralen Fresh-Refresh.');
assert.doesNotMatch(refresh,/const forcedTimer=/,'Automatische Eventpflege darf keinen erzwungenen Full-Fresh-Timer mehr besitzen.');
assert.match(refresh,/isManualReason\(reason:EventWeatherRefreshReason\)/,'Manuelle Reload-Ursachen sind nicht explizit geschützt.');

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

assert.match(app,/className="current-analysis-trigger" label="Hyperlokale Analyse erklären"/,'Hyperlokaler Info-Trigger besitzt keine platzsparende Positionsklasse.');
assert.match(css,/\.hero aside>span>\.current-analysis-trigger\{position:absolute;top:50%;right:9px;/,'Hyperlokaler Info-Button ist nicht rechts im bestehenden Kartenraum positioniert.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-force-refresh-ui-09534.mjs'),'Fresh-Reload-Regression muss Required sein.');
console.log(`MID v${pkg.version}: zentraler Event-Fresh-Reload und platzsparender Hyperlokal-Info-Trigger geprüft.`);
