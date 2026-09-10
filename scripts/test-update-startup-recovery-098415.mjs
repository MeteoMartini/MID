import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [main,preload,app,pwa,updater,serviceWorker,legacyWorker,deviceSync,weather,weatherFragment,skybar,precipitation,shortTerm,forecastFusion,contract,pkgRaw,baselineRaw]=await Promise.all([
  'src/main.tsx','src/startupPreload.ts','src/App.tsx','src/pwa.ts','src/v078.ts','public/service-worker.js','public/sw.js','src/deviceSync.ts','src/weather.ts','src/weather-src/00-types-models-search.tsfrag','src/detailSkyBar.ts','src/precipitation.ts','src/ShortTermForecast.tsx','src/forecastFusion.ts','MID_UPDATE_STARTUP_RECOVERY_CONTRACT.md','package.json','MID_BASELINE.json'
].map(read));
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-update-startup-recovery-098415.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Package und Baseline müssen denselben Release tragen.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of [test,'MID_UPDATE_STARTUP_RECOVERY_CONTRACT.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);
assert.ok(baseline.protectedFiles?.includes('MID_UPDATE_STARTUP_RECOVERY_CONTRACT.md'),'Update-/Startvertrag ist nicht geschützt.');

// Preload: all data promises are genuinely abortable and bounded.
for(const token of ['STARTUP_PRELOAD_FORECAST_TIMEOUT_MS=6500','STARTUP_PRELOAD_STATION_TIMEOUT_MS=7500','STARTUP_PRELOAD_ENSEMBLE_TIMEOUT_MS=12000','function startupRequest<T>','active?.abort()'])assert.ok(preload.includes(token),`Start-Preload-Schutz fehlt: ${token}`);
assert.ok(preload.includes("forecast(location.latitude,location.longitude,signal,{priority:'foreground'")&&preload.includes("ensembles(location.latitude,location.longitude,signal,'foreground')"),'Start-Preloads reichen den AbortSignal nicht bis zum Wetterabruf durch.');

// Core forecast: direct and worker fallback may fail, but neither may hang forever.
for(const token of ['linkedTimeoutSignal(signal,6500)','linkedTimeoutSignal(signal,11000)','timeoutMs:7000'])assert.ok(weather.includes(token),`Core-Forecast-Zeitgrenze fehlt: ${token}`);
assert.ok(weatherFragment.includes('linkedTimeoutSignal(signal,6500)')&&weatherFragment.includes('linkedTimeoutSignal(signal,11000)'),'Generiertes weather.ts und kanonisches Fragment laufen auseinander.');

// Foreground network gate must be released on a terminal request, not success-only.
assert.ok(app.includes("finally{finishRequest('forecast',forecastController);if(id===seq.current)markForegroundNetworkReady()}"),'Fehlerhafter Core-Forecast kann die globale Hintergrundbremse festhalten.');
assert.ok(!app.includes('setW(fw);markForegroundNetworkReady()'),'Foreground-Freigabe ist wieder nur an den Erfolgszweig gekoppelt.');

// A waiting update is staged only in its own cache. It must not rewrite shared
// active-cache metadata or take control before explicit activation.
assert.equal(serviceWorker,legacyWorker,'Primärer und Legacy-Service-Worker weichen ab.');
const install=serviceWorker.match(/self\.addEventListener\('install',[\s\S]*?\);\nself\.addEventListener\('activate'/)?.[0]||'';
assert.ok(install.includes('await cacheShell(CACHE)'),'Neue Shell wird nicht vollständig vorbereitet.');
assert.ok(!install.includes('prepareUpdate()')&&!install.includes('skipWaiting()'),'Installieren eines Updates verändert bereits aktive Cache-/Controllerzustände.');
const message=serviceWorker.match(/self\.addEventListener\('message',[\s\S]*?self\.addEventListener\('push'/)?.[0]||'';
assert.ok(message.includes("case'SKIP_WAITING':case'MID_ACTIVATE_UPDATE':await prepareUpdate()")&&message.includes('await self.skipWaiting()'),'Explizite kontrollierte Update-Aktivierung fehlt.');
const prepare=serviceWorker.match(/async function prepareUpdate\(\)\{[\s\S]*?\}\nasync function useCurrentCache/)?.[0]||'';
assert.ok(prepare.includes('pending:{targetVersion:VERSION')&&!prepare.includes('workerVersion:VERSION,activeCache:CACHE'),'Wartender Worker schaltet den gemeinsam verwendeten aktiven Cache bereits vor seinem Controllerwechsel um.');
assert.ok(serviceWorker.includes("else if(meta.pending?.targetVersion===VERSION){next={...meta,workerVersion:VERSION,activeCache:CACHE,mode:'updating'}"),'Aktiver Cache wird nicht atomar im Activate-Schritt des neuen Workers umgeschaltet.');
assert.ok(serviceWorker.includes("case'MID_USE_CURRENT':{await useCurrentCache()"),'Expliziter Rückfall-Ausgang kann die aktuelle Version nicht mehr aktivieren.');
assert.ok(serviceWorker.includes('if(retryNewerRollback||validatedUpdate)await navigateClientsForUpdate()'),'Aktivierter Worker navigiert offene Clients nicht kontrolliert.');

// Page updater: trust a real controllerchange; do not assume timeout means success.
assert.ok(updater.includes('new Promise<boolean>')&&updater.includes('timer=window.setTimeout(()=>done(false),timeoutMs)'),'Controllerwechsel kann einen Timeout fälschlich als erfolgreiche Aktivierung behandeln.');
assert.ok(updater.includes('if(activated)return;'),'Nach realem Controllerwechsel darf die Seite keine zweite konkurrierende Navigation mehr auslösen.');
assert.ok(!updater.includes('if(activated)await new Promise<void>(resolve=>window.setTimeout(resolve,2600))'),'Veraltetes zeitgesteuertes Doppel-Navigationsfenster ist wieder vorhanden.');


// Update health must prove that the weather data path is usable. A mere React
// paint is not enough to retire the rollback cache.
assert.ok(app.includes("window.dispatchEvent(new CustomEvent('mid:core-data-ready'"),'Kernprognose meldet keinen belastbaren Daten-Ready-Zustand.');
assert.ok(main.includes('waitForCoreDataReady(20_000)')&&main.includes('const pendingVersion=status?.pendingVersion,appVersion=status?.appVersion;')&&main.includes('pendingVersion!==undefined&&appVersion!==undefined&&pendingVersion===appVersion')&&main.includes('rollbackPendingMidUpdate()'),'20-s-Gesundheitswächter für ein pending Update fehlt oder der nullable Update-Status wird nicht TS7-sicher auf skalare Werte reduziert.');
assert.ok(main.includes("if(navigator.onLine===false){")&&main.includes("window.addEventListener('online',()=>{void signalHealthy()"),'Offline darf ein pending Update nicht ohne Kernwetterdaten als gesund markieren.');
assert.ok(!main.includes('coreReady||navigator.onLine===false'),'Offline wird fälschlich wieder als positiver Datenpfad-Healthcheck behandelt.');
assert.ok(main.indexOf('await markMidNativeRuntimeReady()')<main.indexOf('waitForCoreDataReady(20_000)'),'Nativer Splashscreen hängt fälschlich von einem Netzwerk-Erfolg ab.');
assert.ok(pwa.includes("requestWorker({type:'MID_ROLLBACK_IF_PENDING'},6000)"),'Pending-Update kann aus dem Laufzeitwächter nicht gezielt zurückgerollt werden.');

// Cached shell navigation must win over a half-open network after a bounded
// attempt, otherwise the freshly updated PWA/WKWebView can look frozen.
for(const token of ['async function fetchRuntimeWithTimeout','MID-Netzwerkabruf hat das Zeitlimit überschritten',"fetchRuntimeWithTimeout(request,{cache:'no-store'},8000)","fetchRuntimeWithTimeout(request,{cache:'no-store'},30000)"])assert.ok(serviceWorker.includes(token),`Service-Worker-Laufzeitbudget fehlt: ${token}`);
assert.ok(serviceWorker.includes("if(request.mode==='navigate'){const indexUrl=")&&serviceWorker.includes('if(page)return page;'),'Aktiver Controller kann wieder eine neue Server-index.html vor der kontrollierten Worker-Aktivierung einschleusen.');
assert.ok(serviceWorker.includes("const canonical=new URL(url.pathname.endsWith('/version.json')?'./version.json':'./manifest.webmanifest'")&&serviceWorker.includes('cache.put(canonical,response.clone())'),'Versionschecks erzeugen wieder pro Cache-Buster einen neuen Cache-Eintrag.');
assert.ok(updater.includes('function boundedNativeFetch')&&updater.includes('function boundedRegistrationUpdate')&&updater.includes('boundedNativeFetch(url')&&updater.includes('await boundedRegistrationUpdate(registration)'),'Versionsprüfung beziehungsweise registration.update() kann weiterhin unbegrenzt warten.');

// First paint must precede expensive long-term history maintenance.
const renderAt=main.indexOf('ReactDOM.createRoot(root).render'),compactAt=main.indexOf('scheduleIdle(()=>{void compactForecastVerificationLocalStorage()'),archiveAt=main.indexOf('scheduleIdle(()=>{void restoreWeatherTwinArchiveDeferred()');
assert.ok(renderAt>=0&&compactAt>renderAt&&archiveAt>renderAt,'Große Wetterzwilling-/Archivarbeiten blockieren wieder den ersten Render.');
assert.ok(main.includes('await timeout(restoreDeviceSyncState(),6500)'),'Kleiner portabler Gerätestand ist nicht mehr startbegrenzt.');

// Device sync: each operation has a total fallback budget; archive refreshes are not
// triggered every time visibility/focus pulses occur.
for(const token of ['DEVICE_SYNC_REQUEST_TIMEOUT_MS=6000','ARCHIVE_SYNC_REQUEST_TIMEOUT_MS=18000','deadline=Date.now()+timeoutMs','ARCHIVE_VISIBILITY_MIN_INTERVAL_MS=30*60*1000','restoreWeatherTwinArchiveDeferred'])assert.ok(deviceSync.includes(token),`Gerätesync-Schutz fehlt: ${token}`);
assert.ok(deviceSync.includes('Date.now()-lastArchiveVisibilitySyncAt>=ARCHIVE_VISIBILITY_MIN_INTERVAL_MS'),'Langzeitarchiv wird beim Sichtbarwerden wieder ungezügelt neu geladen.');

// Service-worker update checks are deduplicated across load/focus/visibility pulses.
for(const token of ['let updatePromise:Promise<void>|null=null','UPDATE_EVENT_THROTTLE_MS=30_000','if(updatePromise)return','window.setInterval(()=>update(true),15*60*1000)'])assert.ok(pwa.includes(token),`PWA-Update-Deduplizierung fehlt: ${token}`);

// Meteorological regression discovered by the same audit: no invented fourth
// continuous-rain class; snow and showers use their DWD-relevant intensity bases.
assert.ok(!precipitation.includes('amount<15')&&!precipitation.includes('amount>=15')&&!precipitation.includes('rateMmh>=15'),'Niederschlagslogik führt wieder eine erfundene vierte Dauerregenklasse ein.');
for(const token of ['tenMinuteMm=rateMmh/6',"return result(4,'sehr stark'",'snowRateCmh<=.5','snowRateCmh<=4','WMO/DWD-Code','precipitationSampleIntervalSeconds'])assert.ok(precipitation.includes(token),`Typabhängige Niederschlagsintensität fehlt: ${token}`);
assert.ok(skybar.includes('precipitationIntensityDescriptor(parts.type,amount,snowfall,intervalSeconds,parts.displayCode)'),'Skybar nutzt nicht die zentrale Intensitätsklassifikation.');
assert.ok(weather.includes('intervalSeconds:15*60')&&forecastFusion.includes('intervalSeconds:15*60')&&shortTerm.includes('intervalSeconds:intervalMinutes*60'),'15-min-Niederschlag wird nicht vor der WMO/DWD-Intensitätsklassifikation auf sein tatsächliches Zeitintervall bezogen.');

for(const phrase of ['wartender Service Worker','harte Zeitgrenzen','ersten sichtbaren Render','terminalen Erfolg oder Fehler','Dauerregen','nutzbaren Kernprognose','8-s-Budget'])assert.ok(contract.includes(phrase),`Vertrag unvollständig: ${phrase}`);
console.log(`MID v${pkg.version}: Update-Aktivierung, Start-Timeouts, Foreground-Freigabe, Deferred Work, Sync-/PWA-Deduplizierung und typabhängige Skybar-Intensitäten geprüft.`);
