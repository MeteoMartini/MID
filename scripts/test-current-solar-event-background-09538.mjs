import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,panel,eventCenter,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Aktuelles Wetter muss den Tag-/Nachtstatus am astronomischen Übergang selbst nachführen,
// statt bis zum nächsten Wetter-API-Reload am current.is_day-Snapshot festzuhalten.
assert.match(app,/\[solarNow,setSolarNow\]=useState\(\(\)=>Date\.now\(\)\)/,'Aktuelles Wetter besitzt keine laufende astronomische Zeitbasis.');
assert.match(app,/astronomy=astronomySummary\(w\).*sunriseAt=.*sunsetAt=.*currentIsDay=/s,'Tag-/Nachtstatus wird nicht aus aktuellem Sonnenauf- und -untergang abgeleitet.');
assert.match(app,/<WeatherPictogram code=\{currentWeatherCode\} day=\{currentIsDay\}/,'Hauptpiktogramm verwendet weiterhin den statischen API-is_day-Wert.');
assert.match(app,/recentSunshineDuration\(w,\{[^}]*isDay:currentIsDay\}\)/s,'Sonnenschein-Plausibilisierung verwendet nicht denselben astronomischen Tag-/Nachtstatus.');
assert.match(app,/document\.addEventListener\('visibilitychange',resume\).*window\.addEventListener\('focus',resume\)/s,'Astronomischer Status wird nach App-Rückkehr nicht sofort nachgeführt.');

// App-/Header-Reloads müssen persistent sein, damit ein lazy geladener Hintergrund-Owner
// den Auftrag auch dann ausführt, wenn der CustomEvent beim Klick noch keinen Listener hatte.
assert.match(eventCenter,/EVENT_CENTER_REFRESH_REQUEST_KEY='mid:event-center:refresh-request:v1'/,'Persistenter Event-Refresh-Auftrag fehlt.');
assert.match(eventCenter,/persistEventCenterRefreshRequest\(source:string\)/,'Event-Refresh-Aufträge werden nicht persistent vorgemerkt.');
assert.match(eventCenter,/pendingEventCenterRefreshRequest\(\):EventCenterRefreshRequest\|null/,'Hintergrundaktualisierung kann verpasste Reload-Aufträge nicht nachholen.');
assert.match(eventCenter,/completeEventCenterRefreshRequest\(requestedAt:number\)/,'Erledigte Reload-Aufträge werden nicht monoton quittiert.');
assert.match(app,/persistEventCenterRefreshRequest\('dashboard'\)/,'Top-Leisten-Reload persistiert den Event-Auftrag nicht.');
assert.match(app,/persistEventCenterRefreshRequest\('header'\)/,'Event-Center-Header persistiert den Event-Auftrag nicht.');

// Sichtbare und unsichtbare Refreshpfade teilen einen globalen, pro Event serialisierten Owner.
// Damit kann ein älterer Hintergrundrequest nicht nach einem manuellen Refresh zurückschreiben.
assert.match(panel,/const activeEventRefreshes=new Map<string,ManagedEventRefresh>\(\)/,'Pro-Event-Refresh-Koordination fehlt.');
assert.match(panel,/current\?\.controller\.abort/,'Ein überholter In-Flight-Refresh wird nicht abgebrochen.');
assert.match(panel,/managedEventRefreshCurrent\(record\.id,managed\)/,'Überholte Event-Requests können weiterhin committen.');
assert.match(panel,/const latest=readEventCenterRecords\(\)\.find\(item=>item\.id===record\.id\)\?\?record/,'Übersichtsrefresh baut weiterhin auf einem stale Record-Snapshot auf.');
assert.match(panel,/refreshStoredEvents\(false,false,'overview'\)/,'Übersicht-Button nutzt den koordinierten Fresh-Refresh nicht.');

// Hintergrundowner läuft unabhängig davon, ob die Event-Sektion geöffnet ist: Initiallauf,
// Resume/Focus/Online und regelmäßige Stale-Prüfung. Manuelle verpasste Aufträge gehen vor.
assert.match(panel,/const pending=pendingEventCenterRefreshRequest\(\);if\(pending\)void refresh\('manual',pending\.at\);else if\(isStale\(\)\)void refresh\('auto'\)/,'Initial-/Resume-Pfad priorisiert keinen persistenten manuellen Refresh.');
assert.match(panel,/window\.addEventListener\('online',resume\)/,'Event-Hintergrundaktualisierung reagiert nicht auf wiederhergestellte Verbindung.');
assert.match(panel,/window\.setInterval\(\(\)=>\{if\(document\.visibilityState!=='hidden'&&isStale\(\)\)void refresh\('auto'\)\},5\*60\*1000\)/,'Hintergrundowner prüft stale Events nicht regelmäßig unabhängig von der Event-Sektion.');
assert.match(panel,/if\(source==='manual'\)\{const pending=pendingEventCenterRefreshRequest\(\);if\(pending\)window\.setTimeout\(\(\)=>void refresh\('manual',pending\.at\),0\)\}/,'Während eines laufenden Refreshs eingegangene manuelle Reloads können verloren gehen.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-current-solar-event-background-09538.mjs'),'Neue Solar-/Event-Hintergrundregression muss Required sein.');
console.log(`MID v${pkg.version}: Sonnenauf-/untergang und Event-Refresh-Owner/Hintergrundaktualisierung geprüft.`);
