import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [worker,client,panel,contract,source,sw,sw2,baselineRaw]=await Promise.all([
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/pushNotifications.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/PushSettingsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_NOTIFICATION_RELIABILITY_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_SOURCE_OF_TRUTH.md',import.meta.url),'utf8'),
 readFile(new URL('../public/service-worker.js',import.meta.url),'utf8'),
 readFile(new URL('../public/sw.js',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const baseline=JSON.parse(baselineRaw);
for(const route of ["mode==='push-status'","mode==='push-test'"])assert.ok(worker.includes(route),`Workerroute fehlt: ${route}`);
assert.ok(worker.includes("PUSH_SCHEDULER_HEARTBEAT_KEY='meta:push-scheduler:v1'"),'Scheduler-Heartbeat fehlt.');
assert.match(worker,/runPushSchedule[\s\S]{0,1800}do\{const listed=await env\.MID_PUSH_SUBSCRIPTIONS\.list[\s\S]{0,500}while\(!complete&&cursor\)/,'Scheduler muss KV paginiert vollständig lesen.');
assert.doesNotMatch(worker,/function validPushFavorites\(value\)[\s\S]{0,300}slice\(0,24\)/,'Push-Favoriten dürfen nicht still auf 24 gekappt werden.');
assert.match(worker,/minutely_15',CORE_FORECAST_MINUTELY/,'Niederschlags-Push muss die kanonischen 15-Minuten-Felder einschließlich Wahrscheinlichkeit anfordern.');
assert.match(worker,/pushWeatherState[\s\S]{0,1800}reconcileForecastPrecipitation\(/,'Niederschlags-Push muss zentrale Reconciliation verwenden.');
assert.match(worker,/minutes>45/,'Niederschlagsvorwarnung muss bis 45 Minuten prüfen.');
assert.match(worker,/triggerActive=result\.active&&!old\.precipitationActive&&!old\.rainEventKey/,'Vorwarnung und Beginn desselben Ereignisses müssen dedupliziert werden.');
assert.match(client,/serverRegistered:boolean;schedulerHealthy:boolean/,'Clientstatus muss Worker und Scheduler unterscheiden.');
assert.match(client,/workerPost<WorkerReply>\('push-status'/,'Client muss echten Workerstatus prüfen.');
assert.match(client,/sendPushTestNotification/,'Ende-zu-Ende-Testfunktion fehlt.');
assert.match(panel,/Registrierung reparieren/,'UI-Reparaturpfad für verlorene Workerregistrierung fehlt.');
assert.match(panel,/Test senden/,'UI-Testmitteilung fehlt.');
assert.ok(sw.includes("addEventListener('push'")&&sw2.includes("addEventListener('push'"),'Beide Service Worker müssen Push empfangen.');
for(const token of ['„Aktiv“ bedeutet Ende-zu-Ende funktionsfähig','Ende-zu-Ende-Test','Keine stillen Regelverluste','Scheduler-Beobachtbarkeit'])assert.ok(contract.includes(token),`Push-Vertrag fehlt: ${token}`);
assert.ok(source.includes('MID_NOTIFICATION_RELIABILITY_CONTRACT.md'),'Source-of-Truth muss Push-Vertrag referenzieren.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-push-reliability-095330.mjs'),'Push-Reliability muss Required Regression sein.');
console.log('MID Push: Ende-zu-Ende-Status, Testsendung, Scheduler-Heartbeat und robuste Niederschlagserkennung geprüft.');
