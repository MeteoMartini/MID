import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,panel,eventCenter,refresh,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherRefresh.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

assert.match(app,/\[solarNow,setSolarNow\]=useState\(\(\)=>Date\.now\(\)\)/,'Aktuelles Wetter besitzt keine laufende astronomische Zeitbasis.');
assert.match(app,/astronomy=astronomySummary\(w\).*currentIsDay=astronomicalIsDayAt\(solarNow,/s,'Tag-/Nachtstatus wird nicht über die zentrale astronomische Sonnenauf-/untergangsgrenze abgeleitet.');
assert.match(app,/<WeatherPictogram code=\{currentWeatherCode\} day=\{currentIsDay\}/,'Hauptpiktogramm verwendet weiterhin den statischen API-is_day-Wert.');
assert.match(app,/recentSunshineDuration\(w,\{[^}]*isDay:currentIsDay\}\)/s,'Sonnenschein-Plausibilisierung verwendet nicht denselben astronomischen Tag-/Nachtstatus.');
assert.match(app,/document\.addEventListener\('visibilitychange',resume\).*window\.addEventListener\('focus',resume\)/s,'Astronomischer Status wird nach App-Rückkehr nicht sofort nachgeführt.');

assert.match(eventCenter,/EVENT_CENTER_REFRESH_REQUEST_KEY='mid:event-center:refresh-request:v1'/,'Persistenter Event-Refresh-Auftrag fehlt.');
assert.match(eventCenter,/persistEventCenterRefreshRequest\(source:string\)/,'Event-Refresh-Aufträge werden nicht persistent vorgemerkt.');
assert.match(eventCenter,/pendingEventCenterRefreshRequest\(\):EventCenterRefreshRequest\|null/,'Hintergrundaktualisierung kann verpasste Reload-Aufträge nicht nachholen.');
assert.match(eventCenter,/completeEventCenterRefreshRequest\(requestedAt:number\)/,'Erledigte Reload-Aufträge werden nicht monoton quittiert.');
assert.match(app,/persistEventCenterRefreshRequest\('dashboard'\)/,'Top-Leisten-Reload persistiert den Event-Auftrag nicht.');
assert.match(app,/persistEventCenterRefreshRequest\('header'\)/,'Event-Center-Header persistiert den Event-Auftrag nicht.');

// v0.9.53.8+ verlangt einen UI-unabhängigen, serialisierten Broker statt verstecktem EventPlanner-Owner.
assert.match(refresh,/const eventQueues=new Map<string,QueueEntry>\(\)/,'Pro-Event-Refresh-Warteschlange fehlt.');
assert.match(refresh,/previous\.catch\(\(\)=>false\)\.then\(\(\)=>executeEventRefresh/,'Refreshes desselben Events werden nicht strikt serialisiert.');
assert.match(refresh,/const latest=readEventCenterRecords\(\)\.find\(item=>item\.id===recordId\)/,'Überholte Record-Snapshots können weiterhin committen.');
assert.match(panel,/refreshStoredEvents\(false,false,'overview'\)/,'Übersicht-Button nutzt den zentralen Fresh-Refresh nicht.');
assert.doesNotMatch(app,/MemoLazyEventPlanner backgroundOnly/,'Hintergrundowner hängt weiterhin an einer versteckten React-Komponente.');

assert.match(refresh,/window\.addEventListener\('online',resume\)/,'Event-Hintergrundaktualisierung reagiert nicht auf wiederhergestellte Verbindung.');
assert.match(refresh,/window\.addEventListener\('pageshow',resume\)/,'Event-Hintergrundaktualisierung reagiert nicht auf PWA-/Seiten-Rückkehr.');
assert.match(refresh,/const staleTimer=window\.setInterval\(\(\)=>autoCatchup\('auto-stale'\),STALE_CHECK_MS\)/,'Hintergrundowner prüft stale Events nicht regelmäßig.');
assert.match(refresh,/runBackgroundNetworkTask\('event-weather-auto'/,'Automatische Eventupdates umgehen die zentrale Hintergrund-Netzwerkbremse.');
assert.match(refresh,/const forceFresh=isManualReason\(reason\)/,'Automatische Eventupdates erzwingen weiterhin ungebremste Fresh-Abrufe.');
assert.doesNotMatch(refresh,/const forcedTimer=/,'Der frühere 30-Minuten-Fullrefresh ist noch aktiv.');
assert.match(refresh,/void runPendingManualRequest\(\)/,'Persistente manuelle Reloads werden beim Start nicht priorisiert.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-current-solar-event-background-09538.mjs'),'Solar-/Event-Hintergrundregression muss Required sein.');
console.log(`MID v${pkg.version}: Sonnenauf-/untergang und zentraler Event-Hintergrundmonitor geprüft.`);
