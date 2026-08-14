import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [center,refresh,sync,panel,app,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherRefresh.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

// Root cause of the stuck 13.08. refresh: a successful newer transaction must never be rejected
// only because an optional model-metadata response reports an older/partial source revision.
assert.match(center,/transactionAt:startedAt\|\|refreshedAt/,'Eventplan besitzt keine transaktionsbasierte Frischeachse.');
assert.match(center,/if\(a\.transactionAt!==b\.transactionAt\)return a\.transactionAt-b\.transactionAt;if\(a\.refreshedAt!==b\.refreshedAt\)return a\.refreshedAt-b\.refreshedAt;if\(a\.sourceRevision!==b\.sourceRevision\)return a\.sourceRevision-b\.sourceRevision/,'Event-Store priorisiert weiterhin Modellmetadaten vor einem später gestarteten Fresh-Reload.');
assert.doesNotMatch(refresh,/sourceAllowsCommit/,'Veralteter modellrevisionsdominierter Commit-Guard ist noch aktiv.');
assert.match(refresh,/refreshTransactionAllowsCommit\(previous:EventPlan\|null\|undefined,next:EventPlan\)/,'Transaktionsbasierter Commit-Guard fehlt.');
assert.match(refresh,/return !previous\|\|compareEventPlanFreshness\(previous,next\)<=0/,'Commit-Guard verwendet nicht die gemeinsame Transaktionsfrische.');

// Ein Reload darf erst als Erfolg gemeldet werden, wenn genau ein neuerer Stand aus dem persistenten Store
// zurückgelesen werden kann. Dadurch werden LocalStorage-/Sync-Konflikte nicht mehr als Erfolg kaschiert.
assert.match(refresh,/upsertEventCenterRecord\(\{\.\.\.latest,updatedAt:Date\.now\(\),plan:nextPlan,change\}\)/,'Fresh-Plan wird nicht persistent geschrieben.');
assert.match(refresh,/const persisted=readEventCenterRecords\(\)\.find\(item=>item\.id===recordId\)\?\.plan,persistedFreshness=eventPlanFreshness\(persisted\)/,'Reload liest den persistenten Plan nach dem Commit nicht erneut ein.');
assert.match(refresh,/persistedFreshness\.transactionAt>=startedAt&&compareEventPlanFreshness\(persisted,nextPlan\)>=0/,'Reload bestätigt einen alten persistenten Stand weiterhin fälschlich als Erfolg.');

// Geräte-Sync folgt exakt derselben Regel; Quellenrevision entscheidet nur noch bei gleichem Refreshstand.
assert.match(sync,/return\{transactionAt:startedAt\|\|refreshedAt,sourceRevision:/,'Geräte-Sync besitzt keine transaktionsbasierte Eventfrische.');
assert.match(sync,/if\(a\.transactionAt!==b\.transactionAt\)return a\.transactionAt>b\.transactionAt;if\(a\.refreshedAt!==b\.refreshedAt\)return a\.refreshedAt>b\.refreshedAt;return a\.sourceRevision>b\.sourceRevision/,'Geräte-Sync kann einen neueren manuellen Reload noch durch ältere Transaktionen zurücksetzen.');

// UI und Hintergrundmonitor bleiben an denselben Broker gekoppelt.
assert.match(panel,/compareEventPlanFreshness\(active\.plan,current\)>=0/,'Geöffnete Details übernehmen den persistent neueren Stand nicht.');
assert.match(app,/refreshAllEventWeather\(\{reason:'header',requestedAt\}\)/,'Topbar-Reload umgeht den zentralen Broker.');
assert.match(app,/refreshAllEventWeather\(\{reason:'dashboard',requestedAt\}\)/,'Appweiter Reload umgeht den zentralen Broker.');
assert.match(refresh,/modelMonitoring:'passive-refresh'/,'Event-Monitor übernimmt Modelländerungen nicht mehr über die passive regelmäßige Neuberechnung.');
assert.doesNotMatch(refresh,/const modelTimer=/,'Transaktionsschutz darf nicht wieder mit aggressivem Modellpolling gekoppelt werden.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-refresh-transaction-authority-095311.mjs'),'Transaktionsfrische-Regression muss Required sein.');
console.log(`MID v${pkg.version}: Event-Fresh-Reload ist transaktionsautoritativ, persistent bestätigt und syncfest.`);
