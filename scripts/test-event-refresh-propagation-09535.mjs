import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [panel,engine,refresh,app,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherRefresh.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Der appweite Reload muss die gespeicherten Events direkt und awaitbar über denselben Broker aktualisieren.
assert.match(app,/async function reloadDashboardAndEvents\(\)[\s\S]*refreshAllEventWeather\(\{reason:'dashboard',requestedAt\}\)/,'Appweiter Reload stößt keine direkt bestätigte Event-Aktualisierung an.');
assert.match(app,/reload=\{reloadDashboardAndEvents\}/,'Header verwendet weiterhin nur den Forecast-Reload.');
assert.doesNotMatch(app,/MemoLazyEventPlanner backgroundOnly/,'Event-Hintergrundaktualisierung hängt weiterhin an einer versteckten UI-Instanz.');
assert.match(app,/useEffect\(\(\)=>startEventWeatherMonitor\(\),\[\]\)/,'App startet keinen UI-unabhängigen Event-Wettermonitor.');

// Langsame optionale Quellen dürfen die dauerhafte Event-Aktualisierung nicht unbegrenzt blockieren.
assert.match(engine,/async function eventSourceWithin<T>\(parent:AbortSignal,timeoutMs:number,/,'Eventquellen besitzen keinen begrenzten Aktualisierungspfad.');
assert.match(engine,/eventSourceWithin\(signal,12000,sourceSignal=>bestMatchModelInfo/,'Modellmetadaten können den Event-Reload weiterhin unbegrenzt blockieren.');
assert.match(engine,/eventSourceWithin\(signal,26000,sourceSignal=>loadForecastFusion/,'Forecast-Fusion kann den Event-Reload weiterhin unbegrenzt blockieren.');
assert.match(engine,/eventSourceWithin\(signal,22000,\(\)=>eventEnsembleForecast\(location\.latitude,location\.longitude,eventDate,eventStartTime,eventEndTime,signal,forceFresh\)/,'Event-Ensemble kann den Event-Reload weiterhin unbegrenzt blockieren.');

// Service commitet immer gegen den neuesten gespeicherten Record, nicht gegen einen alten React-Snapshot.
assert.match(refresh,/const latest=readEventCenterRecords\(\)\.find\(item=>item\.id===recordId\)/,'Event-Refresh commitet weiterhin gegen einen stale Snapshot.');
assert.match(refresh,/upsertEventCenterRecord\(\{\.\.\.latest,updatedAt:Date\.now\(\),plan:nextPlan,change\}\)/,'Aktualisierte Events werden nicht unmittelbar persistent gespeichert.');
assert.match(panel,/refreshAllEventWeather\(\{reason:refreshReason\(mode\),favoritesOnly\}\)/,'Event-Übersicht nutzt nicht denselben zentralen Refreshpfad.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-refresh-propagation-09535.mjs'),'Event-Refresh-Propagation muss Required sein.');
console.log(`MID v${pkg.version}: UI-unabhängiger Event-Reload und persistente Propagation geprüft.`);
