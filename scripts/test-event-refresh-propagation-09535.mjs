import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [panel,app,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Der appweite Reload muss neben der Ortsvorhersage auch gespeicherte Events frisch anfordern.
assert.match(app,/function reloadDashboardAndEvents\(\)\{void load\(\);if\(eventCenterRecordCount>0\)window\.setTimeout\(\(\)=>window\.dispatchEvent\(new CustomEvent\(EVENT_CENTER_REFRESH_EVENT,/,'Appweiter Reload stößt keine Event-Aktualisierung an.');
assert.match(app,/reload=\{reloadDashboardAndEvents\}/,'Header verwendet weiterhin nur den Forecast-Reload.');
assert.match(app,/\{loc&&eventCenterRecordCount>0\?<Suspense fallback=\{null\}><MemoLazyEventPlanner backgroundOnly/,'Event-Hintergrundaktualisierung hängt weiterhin vom geladenen Forecast-Snapshot ab.');

// Langsame optionale Quellen dürfen den sichtbaren neuen Event-Stand nicht unbegrenzt blockieren.
assert.match(panel,/async function eventSourceWithin<T>\(parent:AbortSignal,timeoutMs:number,/,'Eventquellen besitzen keinen begrenzten Aktualisierungspfad.');
assert.match(panel,/eventSourceWithin\(signal,12000,sourceSignal=>bestMatchModelInfo/,'Modellmetadaten können den Event-Reload weiterhin unbegrenzt blockieren.');
assert.match(panel,/eventSourceWithin\(signal,26000,sourceSignal=>loadForecastFusion/,'Forecast-Fusion kann den Event-Reload weiterhin unbegrenzt blockieren.');
assert.match(panel,/eventSourceWithin\(signal,22000,\(\)=>eventEnsembleForecast\(location\.latitude,location\.longitude,eventDate,eventStartTime,eventEndTime,signal,forceFresh\)/,'Event-Ensemble kann den Event-Reload weiterhin unbegrenzt blockieren.');

// Erfolgreiche Aktualisierungen werden synchron in Ref und sichtbaren React-State übernommen.
assert.match(panel,/const records=upsertEventCenterRecord\(updated\)\s+savedEventsRef\.current=records\s+setSavedEvents\(records\)/,'Aktualisierte Events werden nicht synchron in den sichtbaren Zustand übernommen.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-refresh-propagation-09535.mjs'),'Event-Refresh-Propagation muss Required sein.');
console.log(`MID v${pkg.version}: Event-Reload-Propagation und Aktualisierungsrobustheit geprüft.`);
