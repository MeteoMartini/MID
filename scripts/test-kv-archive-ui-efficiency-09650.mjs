import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [styles,forecast,deviceSync,push,pkgText,baselineText]=await Promise.all([
 'src/styles-src/30-modern.css','src/forecastVerification.ts','src/deviceSync.ts','worker-src/30-push-events.js','package.json','MID_BASELINE.json'
].map(read));
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-kv-archive-ui-efficiency-09650.mjs';
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test),'v0.9.65.0-Regressionsschutz fehlt in der Baseline.');

// Info-Buttons behalten auf Touch ihre optische Größe; die Trefferfläche wächst layoutneutral über ein Pseudoelement.
assert.ok(styles.includes('/* MID v0.9.65.0 · Info-Button-Regressionsfix: sichtbare Dichte getrennt von Touchfläche */'));
assert.ok(styles.includes('.metrics article>header>.mode-info{margin-left:auto}'),'Info-Buttons der aktuellen Messwertkarten müssen rechts im Header stehen.');
assert.ok(styles.includes('.mode-info>button::before{content:"";position:absolute;inset:-7px;border-radius:999px}'),'Touchfläche der Info-Buttons muss layoutneutral vergrößert werden.');
const touchCleanup=styles.slice(styles.indexOf('/* MID v0.9.52.3'),styles.indexOf('/* MID v0.9.53.19'));
assert.ok(!/\.mode-info>button[^\{]*\{[^}]*min-width:36px!important/s.test(touchCleanup),'Info-Buttons dürfen nicht mehr sichtbar auf 36 px aufgeblasen werden.');

// Wetterzwilling erzeugt nur bei fachlich neuem Inhalt Archivänderungen.
for(const token of ['storeContentSignature','if(changed)saveStore(locationKey,store)','existingContent!==content','const changed=upsertObservation(store,row)','JSON.stringify(nextReferences)!==JSON.stringify(store.references)'])assert.ok(forecast.includes(token),`Wetterzwilling-No-op-Schutz fehlt: ${token}`);
assert.ok(forecast.includes("if(JSON.stringify(store.observations[index])===JSON.stringify(row))return false"),'Identische Beobachtungs-Slots müssen write-frei bleiben.');

// Geräte-Sync: Inhalts-Hash, Burst-Deduplizierung und 10-Minuten-Koaleszenz für Vollarchive.
for(const token of ['lastSnapshotSignature?:string','lastArchiveContentSignature?:string','portableSnapshotSignature','weatherTwinArchiveSignature','PORTABLE_SYNC_DEBOUNCE_MS=3000','ARCHIVE_SYNC_COALESCE_MS=10*60*1000','archiveChangeSuppressed','archiveDirty'])assert.ok(deviceSync.includes(token),`Geräte-/Archiv-Sparschutz fehlt: ${token}`);
assert.ok(deviceSync.includes("lastSnapshotSignature===signature&&latestBefore.lastSyncAt"),'Identische portable Snapshots müssen ohne Worker-Write beendet werden.');
assert.ok(deviceSync.includes("if(archiveTimer===undefined)archiveTimer=window.setTimeout(flushArchive,ARCHIVE_SYNC_COALESCE_MS)"),'Archivänderungen müssen in einem festen 10-Minuten-Fenster zusammengefasst werden.');
assert.ok(deviceSync.includes("Promise.allSettled([syncPortableDeviceState(),pullWeatherTwinArchive(config)])"),'Regulärer 2-Minuten-Abgleich darf das lokale Vollarchiv nicht mehr bei jedem Tick hochladen.');

// Scheduler-Index: 5-Minuten-Reaktionszeit bleibt, KV.list fällt im Normalbetrieb auf 4 Reconciliations/Tag.
for(const token of ["PUSH_SCHEDULE_INDEX_SCHEMA='mid-push-schedule-index-v2'","PUSH_SCHEDULE_INDEX_KEY='meta:push-schedule-index:v2'",'pushSubscriptionScheduleSource','pushScheduleIndexUpsert','pushScheduleIndexRemove','date.getUTCHours()%6===0',"schema:'mid.kv-operations-audit.v3'",'listOperationsPerDayCeiling'])assert.ok(push.includes(token),`Push-Scheduler-Index fehlt: ${token}`);
assert.ok(push.includes("const listed=await pushSubscriptionScheduleSource(env)"),'Cron-Scheduler nutzt weiterhin direkt KV.list statt Index.');
for(const essential of ['return 5','pushWeatherState','dwdKonrad3dNowcast','pushForecastState','ventilationAdvice','sendWebPush'])assert.ok(push.includes(essential),`Grundfunktionalität wurde beschnitten: ${essential}`);
assert.ok(push.includes('async function pushUnsubscribe'),'Push-Abmeldung muss als vorhandener Routerpfad tatsächlich implementiert sein.');

assert.ok(pkg.version.localeCompare('0.9.65.0',undefined,{numeric:true,sensitivity:'base'})>=0,'Fix benötigt mindestens v0.9.65.0.');
console.log(`MID v${pkg.version}: Info-UI, Wetterzwilling-No-op, Sync-Koaleszenz und Scheduler-Index regressionsgeschützt.`);
