import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [main,preload,app,guard,baselineRaw,pkgRaw]=await Promise.all([
 read('src/main.tsx'),read('src/startupPreload.ts'),read('src/App.tsx'),read('src/openMeteoGuard.ts'),read('MID_BASELINE.json'),read('package.json')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-startup-splash-preload-097843.mjs';
assert.ok(main.indexOf('const startupPreload=beginStartupDashboardPreload();')>=0,'Splash-Preload muss beim Start initialisiert werden.');
assert.ok(main.indexOf('const startupPreload=beginStartupDashboardPreload();')<main.indexOf('await timeout(initializeStorageSafety()'),'Netz-/Chunk-Preload muss parallel zu lokalen Startarbeiten beginnen, nicht erst danach.');
assert.ok(main.includes('startupPreload.stationPromise')&&main.includes('startupPreload.ensemblePromise'),'Schnell verfügbare Stations- und Ensemble-Daten dürfen innerhalb des bestehenden Splash-Budgets mitfertig werden.');
assert.ok(main.includes('wait(900)'),'Splash-Datenvorbereitung muss ein hartes kurzes Zeitbudget behalten.');
assert.ok(preload.includes("forecast(location.latitude,location.longitude,undefined,{priority:'foreground'"),'Best-Match-Prognose muss sofort als Foreground-Preload starten.');
assert.ok(preload.includes('const stationPromise=delay(120)'),'Stations-Schnellstart muss leicht versetzt erfolgen, um keinen Start-Burst zu erzeugen.');
assert.ok(preload.includes("const ensemblePromise=ensemble?delay(260).then(()=>ensembles(location.latitude,location.longitude,undefined,'foreground'))"),'Ensemble-Splashstart darf nur den begrenzten Foreground-/Bootstrap-Pfad verwenden.');
assert.ok(!preload.includes("ensembles(location.latitude,location.longitude,undefined,'normal')")&&!preload.includes("ensembles(location.latitude,location.longitude,undefined,'background')"),'Splash darf keine vollständige normale/background Memberfusion parallel erzwingen.');
assert.ok(preload.includes("jobs.push(import('./EnsemblePanel'))"),'Benötigter Ensemble-UI-Chunk muss im Splash vorgewärmt werden.');
assert.ok(preload.includes("WEATHER_TWIN_SETTINGS_KEY='mid:weather-twin:settings:v1'")&&preload.includes('twin?.enabled!==false'),'Der standardmäßig aktive Wetterzwilling muss den ohnehin nötigen Ensemble-Schnellstart bereits im Splash nutzen.');
for(const token of ['startupForecastForLocation','startupStationForLocation','startupEnsembleForLocation'])assert.ok(app.includes(token),`App muss den Splash-Promise teilen statt den Request zu duplizieren: ${token}`);
assert.ok(app.includes('if(value.bootstrap)scheduleRetry(2_000)'),'Die vollständige Ensemblefusion muss nach dem schnellen Bootstrap weiterhin zeitnah nachladen.');
assert.ok(guard.includes('const MAX_ACTIVE=2')&&guard.includes('const START_GAP_MS=220'),'Globaler Open-Meteo-Schutz mit maximal zwei aktiven Abrufen und Startabstand muss erhalten bleiben.');
assert.equal(pkg.scripts?.['test:startup-splash-preload'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.regressionTests?.includes(test)&&baseline.requiredRegressionTests?.includes(test),'Splash-Preload-Regression fehlt in der Baseline.');
console.log(`MID v${pkg.version}: Splash lädt Forecast, Station, Ensemble-Bootstrap und benötigte UI-Chunks ohne zusätzlichen Full-Ensemble-Burst vor.`);
