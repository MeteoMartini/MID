import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [sync,eventCenter,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Ein neuer Event-Wetterstand darf bei Geräteabgleich nie durch denselben Event-Datensatz
// mit einer älteren Refresh-Transaktion zurückgesetzt werden. Modellrevision ist Provenienz
// und nur bei identischer Transaktionsfrische ein Tie-Breaker.
assert.match(sync,/const EVENT_CENTER_KEY='mid:event-center:v1'/,'Event-Center wird beim Geräteabgleich nicht gezielt geschützt.');
assert.match(sync,/function eventPlanRevision\(value:unknown\).*sourceRevision.*refreshedAt/s,'Event-Wetterstand besitzt keine mehrstufige Frischebewertung.');
assert.match(sync,/function localEventPlanIsNewer\(local:unknown,remote:unknown\)/,'Geräte-Sync besitzt keinen lexikographischen Eventplan-Frischevergleich.');
assert.match(sync,/if\(a\.transactionAt!==b\.transactionAt\)return a\.transactionAt>b\.transactionAt;if\(a\.refreshedAt!==b\.refreshedAt\)return a\.refreshedAt>b\.refreshedAt;return a\.sourceRevision>b\.sourceRevision/,'Geräte-Sync priorisiert nicht die tatsächlich neuere Refresh-Transaktion vor Modellmetadaten.');
assert.match(sync,/function mergeEventCenterSnapshots\(remoteRaw:string\|undefined,localRaw:string\|null\)/,'Event-Center-Snapshots werden nicht konfliktfest zusammengeführt.');
assert.match(sync,/localEventPlanIsNewer\(localItem,item\)/,'Neuere lokale Event-Pläne gewinnen nicht gegen ältere Remote-Pläne.');
assert.match(sync,/plan:localItem\.plan,change:localItem\.change/,'Beim Schutz eines neueren Event-Plans werden Plan und Änderungsbewertung nicht zusammen erhalten.');
assert.match(sync,/mergeEventCenterSnapshots\(values\[EVENT_CENTER_KEY\],localStorage\.getItem\(EVENT_CENTER_KEY\)\)/,'Snapshot-Anwendung nutzt den Event-Frischeabgleich nicht.');
assert.match(sync,/preservedLocalEvents/,'Geschützte lokale Event-Stände werden nach dem Merge nicht erkannt.');
assert.match(sync,/else if\(applied\.preservedLocalEvents\)await pushDeviceSync\(readDeviceSyncConfig\(\)\)/,'Ein geschützter lokaler Event-Stand wird nicht zurück in den Geräteverbund gespiegelt.');

assert.match(sync,/snapshot=await decryptSnapshot\(reply\.blob,config\.syncKey\),remoteTime=.*latestConfig=readDeviceSyncConfig\(\),localPending=Date\.parse\(latestConfig\.pendingChangedAt\|\|config\.pendingChangedAt/s,'Pull prüft nach der Netzantwort nicht erneut auf zwischenzeitliche lokale Änderungen.');
assert.match(sync,/await pushDeviceSync\(latestConfig\);return\{found:true,applied:false\}/,'Zwischenzeitlich neuere lokale Daten werden bei Pull nicht priorisiert.');
assert.match(sync,/latestConfig=readDeviceSyncConfig\(\);if\(latestConfig\.syncKey!==config\.syncKey\)return true/,'Push berücksichtigt keinen während des Uploads veränderten lokalen Zustand.');
assert.match(sync,/hasNewerPending=.*latestPending>snapshotTime/,'Push erkennt keine Änderungen, die nach Snapshot-Erstellung entstanden sind.');
assert.match(sync,/pendingChangedAt:hasNewerPending\?latestConfig\.pendingChangedAt:undefined/,'Push löscht einen neueren lokalen Pending-Stand.');

// Lokale Persistenz nutzt denselben Grundsatz: Refresh-Transaktion -> Abschlusszeit -> Quellenrevision als Tie-Breaker.
assert.match(eventCenter,/export function eventPlanFreshness\(plan:EventPlan\|null\|undefined\)/,'Lokaler Event-Store bewertet Planfrische nicht.');
assert.match(eventCenter,/export function compareEventPlanFreshness/,'Lokaler Event-Store besitzt keinen gemeinsamen Frischevergleich.');
assert.match(eventCenter,/compareEventPlanFreshness\(existing\.plan,record\.plan\)>0.*plan:existing\.plan,change:existing\.change/s,'Ein verspäteter lokaler Schreibvorgang kann weiterhin einen neueren Plan überschreiben.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-refresh-device-sync-09537.mjs'),'Event-Refresh-/Sync-Konflikttest muss Required sein.');
console.log(`MID v${pkg.version}: Event-Refresh bleibt gegenüber Geräte-Sync und verspäteten Schreibvorgängen monoton frisch.`);
