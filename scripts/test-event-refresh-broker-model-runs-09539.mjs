import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,panel,refresh,center,sync,engine,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherRefresh.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Ein einziger UI-unabhängiger Broker ist der Owner aller gespeicherten Event-Neuberechnungen.
assert.match(app,/refreshAllEventWeather\(\{reason:'header',requestedAt\}\)/,'Header-Reload umgeht den zentralen Event-Broker.');
assert.match(app,/refreshAllEventWeather\(\{reason:'dashboard',requestedAt\}\)/,'Appweiter Reload umgeht den zentralen Event-Broker.');
assert.match(panel,/refreshAllEventWeather\(\{reason:refreshReason\(mode\),favoritesOnly\}\)/,'Event-Übersicht umgeht den zentralen Event-Broker.');
assert.match(panel,/refreshEventWeather\(currentSavedRecord\.id,\{reason:'detail'\}\)/,'Detail-Reload umgeht den zentralen Event-Broker.');
assert.doesNotMatch(app,/MemoLazyEventPlanner backgroundOnly/,'Event-Hintergrundlogik hängt weiterhin an einer versteckten EventPlanner-UI.');
assert.match(app,/useEffect\(\(\)=>startEventWeatherMonitor\(\),\[\]\)/,'Zentraler Event-Monitor startet nicht appweit.');

// Gleiche Events werden serialisiert; ein laufender älterer Request darf nicht später zurückschreiben.
assert.match(refresh,/const eventQueues=new Map<string,QueueEntry>\(\)/,'Per-Event-Queue fehlt.');
assert.match(refresh,/const previous=eventQueues\.get\(recordId\)\?\.promise\?\?Promise\.resolve\(true\)/,'Refresh-Queue übernimmt einen laufenden Vorgänger nicht.');
assert.match(refresh,/previous\.catch\(\(\)=>false\)\.then\(\(\)=>executeEventRefresh\(recordId,reason\)\)/,'Refresh-Queue serialisiert die Neuberechnungen nicht.');
assert.match(refresh,/REFRESH_TRANSACTION_TIMEOUT_MS=55\*1000/,'Ein blockierter Hintergrundrequest kann die Event-Queue weiterhin unbegrenzt sperren.');
assert.match(refresh,/controller\.abort\(new DOMException\('Event-Aktualisierung überschritt das Zeitlimit'/,'Die Transaktionsfrist bricht blockierte Event-Aktualisierungen nicht ab.');
assert.match(refresh,/const latest=readEventCenterRecords\(\)\.find\(item=>item\.id===recordId\)/,'Commit liest den aktuellen Record nicht erneut.');
assert.match(refresh,/if\(!refreshTransactionAllowsCommit\(latest\.plan,nextPlan\)\)return false/,'Eine ältere Refresh-Transaktion kann weiterhin einen neueren Eventplan überschreiben.');

// Manuelle Aufträge werden nur nach echtem vollständigem Erfolg quittiert.
assert.match(refresh,/if\(requestedAt>0&&failed===0&&refreshed===targets\.length\)completeEventCenterRefreshRequest\(requestedAt\)/,'Manueller Reload wird auch bei Teilfehlern als erledigt markiert.');
assert.match(refresh,/if\(options\.favoritesOnly\)targets=targets\.filter\(record=>record\.isFavorite\)/,'Favoriten-Sammelprüfung fehlt.');
assert.match(refresh,/if\(!manual&&!ids\)targets=targets\.slice\(0,BACKGROUND_BATCH_LIMIT\)/,'Automatische Eventläufe besitzen keine Lastgrenze.');
assert.match(refresh,/else if\(!options\.favoritesOnly&&!ids\)targets=targets\.slice\(0,20\)/,'Manuelle allgemeine Sammelläufe besitzen keine Sicherheitsgrenze.');
assert.match(refresh,/const forceFresh=isManualReason\(reason\)/,'Broker schützt den manuellen Fresh-Vertrag nicht.');
assert.match(engine,/loadForecastFusion\([^\n]+forceFresh\)/,'Event-Engine reicht Fresh-Refresh nicht an Forecast-Fusion weiter.');

// Modellstandsänderungen werden seit v0.9.53.18 passiv mit der nächsten stündlichen
// Event-Neuberechnung übernommen. Eigenständiges 5-Minuten-Metadatenpolling war die
// Ursache für den Request-Sturm ab v0.9.53.8 und darf nicht wieder eingeführt werden.
assert.match(refresh,/export function hasNewEventModelRun/,'Modelllaufvergleich für Plan-/Syncdiagnose fehlt.');
assert.match(refresh,/modelMonitoring:'passive-refresh'/,'Passive Modelllaufüberwachung ist nicht ausgewiesen.');
assert.match(refresh,/const EVENT_STALE_AFTER_MS=60\*60\*1000/,'Eventwetter wird nicht in einem schonenden Stundenintervall nachgeführt.');
assert.match(refresh,/const STALE_CHECK_MS=15\*60\*1000/,'Fällige Events werden nicht regelmäßig passiv geprüft.');
assert.doesNotMatch(refresh,/bestMatchModelInfo\(sample\.location/,'Eventmonitor pollt weiterhin Modellmetadaten je Eventort.');
assert.doesNotMatch(refresh,/const modelTimer=/,'5-Minuten-Modellpolling ist weiterhin aktiv.');
assert.doesNotMatch(refresh,/const forcedTimer=/,'Erzwungener 30-Minuten-Fullrefresh ist weiterhin aktiv.');
for(const token of ["window.addEventListener('pageshow',resume)","window.addEventListener('focus',resume)","window.addEventListener('online',resume)"])assert.ok(refresh.includes(token),`Resume-Überwachung fehlt: ${token}`);

// Persistenz und Geräte-Sync priorisieren die neuere Refresh-Transaktion; Modellrevision bleibt Provenienz/Tie-Breaker.
assert.match(center,/sourceRevisionAt\?:number;refreshStartedAt\?:number;refreshReason\?:string/,'EventPlan speichert keine Quellen-/Transaktionsfrische.');
assert.match(center,/export function compareEventPlanFreshness/,'Persistenz besitzt keinen gemeinsamen Frischevergleich.');
assert.match(center,/if\(a\.transactionAt!==b\.transactionAt\)return a\.transactionAt-b\.transactionAt;if\(a\.refreshedAt!==b\.refreshedAt\)return a\.refreshedAt-b\.refreshedAt;if\(a\.sourceRevision!==b\.sourceRevision\)return a\.sourceRevision-b\.sourceRevision/,'Persistenz priorisiert nicht die tatsächlich neuere Refresh-Transaktion.');
assert.match(sync,/function localEventPlanIsNewer/,'Geräte-Sync nutzt keinen Eventplan-Frischevergleich.');
assert.match(sync,/sourceRevisionAt/,'Geräte-Sync berücksichtigt die Modellquellenrevision nicht.');
assert.match(panel,/compareEventPlanFreshness\(active\.plan,current\)>=0/,'Geöffnete Eventdetails können weiterhin durch einen spät eintreffenden älteren UI-Snapshot zurückspringen.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-refresh-broker-model-runs-09539.mjs'),'v0.9.53.9 Event-Broker-Regression muss Required sein.');
console.log(`MID v${pkg.version}: zentraler Event-Refresh-Broker, dauerhafte Commits und Modelllaufüberwachung geprüft.`);
