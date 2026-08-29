import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [lifecycle,runtime,main,persistence,storage,weatherFrag,weather,app,styleSource,styles,contract,installWorkflow]=await Promise.all([
 read('src/runtimeLifecycle.ts'),read('src/runtimePlatform.ts'),read('src/main.tsx'),read('src/persistence.ts'),read('src/storageSafety.ts'),read('src/weather-src/00-types-models-search.tsfrag'),read('src/weather.ts'),read('src/App.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('MID_RUNTIME_LIFECYCLE_OFFLINE_CONTRACT.md'),read('ci/github/workflows/install-mid.yml')
]);

assert.match(runtime,/mid:native-app-state/,'Der native Capacitor-App-State muss in den gemeinsamen Kern gemeldet werden.');
assert.match(lifecycle,/persistStateNow\(\)/,'Suspend muss den unabhängigen Persistenz-Snapshot anstoßen.');
assert.match(lifecycle,/flushStorageSafetyMirror\(1400\)/,'Suspend muss bereits wartende Durable-Storage-Spiegelwrites best-effort flushen.');
assert.match(storage,/export async function flushStorageSafetyMirror/,'Storage-Safety benötigt einen expliziten Lifecycle-Flush.');
for(const token of ["'native-inactive'","'native-active'","'pagehide'","'pageshow'","'visibility-hidden'","'visibility-visible'","'online'","'offline'"])assert.ok(lifecycle.includes(token),`Lifecycle-Signal fehlt: ${token}`);
assert.match(lifecycle,/document\.dispatchEvent\(new Event\('visibilitychange'\)\)/,'Native Resume muss bestehende gemeinsame Sichtbarkeits-Refreshpfade aktivieren.');
assert.ok(!lifecycle.includes('localStorage.clear(')&&!persistence.includes('localStorage.clear(')&&!storage.includes('localStorage.clear('),'Lifecycle-/Persistenzpfade dürfen lokale Nutzerdaten nie pauschal löschen.');
assert.ok(main.indexOf('startRuntimeLifecycleBridge()')>main.indexOf('startPersistenceBridge()'),'Lifecycle-Bridge muss nach der Persistenz-Bridge starten.');
assert.ok(main.indexOf('startRuntimeLifecycleBridge()')>main.indexOf('startDeviceSyncBridge()'),'Lifecycle-Bridge muss nach dem Geräte-Sync-Bridge-Setup starten.');

for(const source of [weatherFrag,weather]){
 assert.match(source,/offline=typeof navigator!==['"]undefined['"]&&navigator\.onLine===false/,'Forecast muss Offline vor dem Netzpfad erkennen.');
 assert.match(source,/if\(offline\)\{if\(cached\)return cachedForecastResult\(cached,'offline-local-cache'\);throw new Error\('Offline:/,'Offline muss sofort Cache oder verständlichen Fehler liefern.');
 assert.match(source,/cached:true,stale:entry\.age>FORECAST_CORE_FRESH_MS,ageMs:entry\.age/,'Offline-/Fallback-Forecast muss Cachealter diagnostisch tragen.');
 assert.ok(source.indexOf('if(offline)')<source.indexOf("const useDirectFirst"),'Offline-Short-Circuit muss vor dem ersten Netzwerkpfad liegen.');
}
assert.match(app,/MID_RUNTIME_RESUME_EVENT/,'App muss den gemeinsamen Resume-Event auswerten.');
assert.match(app,/window\.addEventListener\('online',online\)/,'Bei Netzrückkehr muss die App automatisch neu laden.');
assert.match(app,/void load\(\{forceFresh\}\)/,'Resume-/Online-Refresh muss den bestehenden gemeinsamen Forecast-Loader verwenden.');
assert.match(app,/runtime-offline-banner/,'Die App braucht einen sichtbaren Offline-Status.');
assert.match(app,/Gespeicherter Wetterstand · Stand/,'Offline-Anzeige muss die Standzeit des lokalen Wetterstands nennen.');
assert.match(styleSource,/html\[data-theme='dark'\] \.runtime-offline-banner/,'Offline-Status muss im Dark Mode kontrastiert sein.');
assert.ok(styles.includes('.runtime-offline-banner'),'Aggregierte Styles müssen den Offline-Status enthalten.');
assert.match(contract,/keinen Endlos-Ladezustand/i,'Der verbindliche Vertrag muss das Offline-Fehlerverhalten festhalten.');
assert.match(installWorkflow,/\.\/node_modules\/\.bin\/cap copy ios/,'Release-CI muss den geprüften Vite-Build in die iOS-WebView-Hülle kopieren.');
assert.ok(installWorkflow.indexOf('./node_modules/.bin/cap copy ios')>installWorkflow.indexOf('npm run verify'),'Capacitor-iOS-Copy darf erst nach erfolgreichem Browser-/Regressionsbuild laufen.');
assert.match(installWorkflow,/ios\/App\/App\/public\/version\.json/,'Release-CI muss die iOS-Web-Bundle-Version gegen die Paketversion prüfen.');
console.log('runtime lifecycle/offline resume regression passed');
