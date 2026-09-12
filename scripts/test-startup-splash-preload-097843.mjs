import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [main,preload,app,guard,baselineRaw,pkgRaw]=await Promise.all([
 read('src/main.tsx'),read('src/startupPreload.ts'),read('src/App.tsx'),read('src/openMeteoGuard.ts'),read('MID_BASELINE.json'),read('package.json')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-startup-splash-preload-097843.mjs';
assert.ok(main.indexOf('let startupPreload=beginStartupDashboardPreload();')>=0,'Splash-Preload muss beim Start initialisiert werden.');
assert.ok(main.indexOf('let startupPreload=beginStartupDashboardPreload();')<main.indexOf('await timeout(initializeStorageSafety()'),'Netz-/Chunk-Preload muss parallel zu lokalen Startarbeiten beginnen, nicht erst danach.');
assert.ok(main.includes('startupPreload=beginStartupDashboardPreload()??startupPreload;'),'Nach lokaler Recovery muss der Splash-Preload den tatsächlich wiederhergestellten letzten Ort erneut abgleichen.');
assert.ok(main.includes('startupPreload.stationPromise')&&main.includes('startupPreload.ensemblePromise'),'Schnell verfügbare Stations- und Ensemble-Daten dürfen innerhalb des bestehenden Splash-Budgets mitfertig werden.');
assert.ok(main.includes('wait(900)'),'Splash-Datenvorbereitung muss ein hartes kurzes Zeitbudget behalten.');
assert.ok(preload.includes("startupRequest(STARTUP_PRELOAD_FORECAST_TIMEOUT_MS,signal=>forecast(location.latitude,location.longitude,signal,{priority:'foreground'"),'Best-Match-Prognose muss sofort als begrenzter, abbrechbarer Foreground-Preload starten.');
assert.ok(preload.includes('STARTUP_PRELOAD_STATION_TIMEOUT_MS=7500')&&preload.includes('await delay(40);if(signal.aborted)throw signal.reason'),'Stations-Schnellstart muss priorisiert, nur minimal versetzt und hart begrenzt erfolgen.');
assert.ok(preload.includes('STARTUP_PRELOAD_ENSEMBLE_TIMEOUT_MS=12000')&&preload.includes("await delay(420);if(signal.aborted)throw signal.reason;return ensembles(location.latitude,location.longitude,signal,'foreground')"),'Ensemble-Splashstart muss nach den kritischen Istwetterdaten folgen und den begrenzten, abbrechbaren Foreground-/Bootstrap-Pfad verwenden.');
assert.ok(!preload.includes("ensembles(location.latitude,location.longitude,undefined,'normal')")&&!preload.includes("ensembles(location.latitude,location.longitude,undefined,'background')"),'Splash darf keine vollständige normale/background Memberfusion parallel erzwingen.');
assert.ok(preload.includes('Promise.race([forecastRequest.promise,stationRequest.promise,delay(700)]).then(()=>preloadInterfaceChunks(ensemble))'),'Nichtkritische UI-Chunks dürfen den kritischen Forecast-/Stationsstart nicht mehr konkurrierend ausbremsen.');
assert.ok(preload.includes("jobs.push(import('./EnsemblePanel'))"),'Benötigter Ensemble-UI-Chunk muss im Splash vorgewärmt werden.');
assert.ok(preload.includes("WEATHER_TWIN_SETTINGS_KEY='mid:weather-twin:settings:v1'")&&preload.includes('twin?.enabled!==false'),'Der standardmäßig aktive Wetterzwilling muss den ohnehin nötigen Ensemble-Schnellstart bereits im Splash nutzen.');
for(const token of ['startupForecastForLocation','startupStationForLocation','startupEnsembleForLocation'])assert.ok(app.includes(token),`App muss den Splash-Promise teilen statt den Request zu duplizieren: ${token}`);
assert.ok(app.includes('if(value.bootstrap)scheduleRetry(2_000)'),'Die vollständige Ensemblefusion muss nach dem schnellen Bootstrap weiterhin zeitnah nachladen.');
assert.ok(guard.includes('const MAX_ACTIVE=2')&&guard.includes('const START_GAP_MS=220'),'Globaler Open-Meteo-Schutz mit maximal zwei aktiven Abrufen und Startabstand muss erhalten bleiben.');
assert.equal(pkg.scripts?.['test:startup-splash-preload'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.regressionTests?.includes(test)&&baseline.requiredRegressionTests?.includes(test),'Splash-Preload-Regression fehlt in der Baseline.');
console.log(`MID v${pkg.version}: Splash lädt Forecast, Station, Ensemble-Bootstrap und benötigte UI-Chunks ohne zusätzlichen Full-Ensemble-Burst vor.`);
