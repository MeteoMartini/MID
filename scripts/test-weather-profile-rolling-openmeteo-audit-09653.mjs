import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [cockpit,styles,dwdWarnings,app,weatherTypes,weatherSpecialized,weatherMapping,workerCore,workerModels,meteogram,pkgRaw,baselineRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),
 read('src/styles.css'),
 read('src/dwdWarnings.ts'),
 read('src/App.tsx'),
 read('src/weather-src/00-types-models-search.tsfrag'),
 read('src/weather-src/10-observations-specialized.tsfrag'),
 read('src/weather-src/20-mapping-day-character.tsfrag'),
 read('worker-src/00-core-observations.js'),
 read('worker-src/20-composite-models.js'),
 read('src/MeteogramPanel.tsx'),
 read('package.json'),
 read('MID_BASELINE.json')
]);

// Das Profil ist ein gleitendes Zeitfenster, kein Kalenderstunden-Ausschnitt.
for(const token of [
 "const PROFILE_WINDOW_MS=24*60*60*1000",
 'const windowEnd=now+PROFILE_WINDOW_MS',
 '.filter(hour=>Number(hour.epoch)<=windowEnd).slice(0,26)',
 'chartStartEpoch=profileNow',
 'chartEndEpoch=profileNow+PROFILE_WINDOW_MS',
 'window.setInterval(()=>setProfileNow(Date.now()),30000)',
 "type ProfileResolution='1h'|'3h'",
 "return localStorage.getItem(PROFILE_RESOLUTION_KEY)==='3h'?'3h':'1h'",
 'localStorage.setItem(PROFILE_RESOLUTION_KEY,profileResolution)',
 "profileResolution==='3h'",
 "intervalLabel:'3 h'"
])assert.ok(cockpit.includes(token),`Gleitender 24-h-/Auflösungsvertrag fehlt: ${token}`);
assert.ok(!cockpit.includes('hours.slice(startIndex,startIndex+24)'),'Der alte Kalenderstunden-Ausschnitt darf nicht zurückkehren.');

// Getrennte, nicht überlappende Darstellungsbahnen und astronomische Orientierung.
for(const token of [
 'skyBandTop=50,cloudTop=101',
 'profile-window-labels',
 'profile-solar-marker',
 'sunriseEpoch',
 'sunsetEpoch',
 'className="night-band"',
 'y={78}',
 'const profileXForEpoch=(epoch:number)=>',
 'profileXForEpoch(event.epoch)',
 'y1={skyBandTop}',
 'weatherPictogramStep=',
 'className="day-separator"'
])assert.ok(cockpit.includes(token),`Zeit-/Solar-/Kollisionsvertrag fehlt: ${token}`);
assert.ok(72<78&&78+18<=101&&101<150,'Solartext, Wettersymbole, Wolkenbänder und Temperaturbahn müssen vertikal getrennt bleiben.');
for(const token of ['.profile-solar-marker text{','.profile-window-labels text{','.cockpit-meteogram-pro__svg .night-band{','@media (orientation:landscape) and (max-width:1180px) and (max-height:760px)','profile-chart profile-data'])assert.ok(styles.includes(token),`Responsive Profilgestaltung fehlt: ${token}`);

// Niederschlag: Menge und Wahrscheinlichkeit bleiben getrennte, beschriftete Größen.
for(const token of [
 'probabilityHeight=',
 'probabilityPath=',
 'className="probability-line"',
 'className="rain-bar"',
 'className="precipitation"',
 'Menge (mm)',
 'Wahrscheinlichkeit (%)',
 'shortTermPrecipitationDetail(selectedPoint)'
])assert.ok(cockpit.includes(token),`Niederschlagsdarstellung fehlt: ${token}`);

// Wolken: Gesamt nutzt die gemeinsame Tagesansicht-Skybar; H/M/L bleiben neutrale Graubänder ohne Prozentachse.
for(const token of [
 'data-mid-skybar="profile"',
 'profileSkyBarSegments=detailSkyBarSegments(',
 "className:'high'",
 "className:'mid'",
 "className:'low'",
 'className={`cloud-opacity-band ${row.className}`}',
 'Wolken gesamt / hoch / mittel / tief + UVI',
 'stopColor="var(--profile-cloud)"',
 'clamp(Number(hour.highCloud)||0,0,100)',
 'clamp(Number(hour.midCloud)||0,0,100)',
 'clamp(Number(hour.lowCloud)||0,0,100)'
])assert.ok(cockpit.includes(token),`Wolkenschichtvertrag fehlt: ${token}`);
assert.ok(!/Number\(hour\.(?:highCloud|midCloud|lowCloud)\)\s*\/\s*100/.test(cockpit),'Open-Meteo-Wolkenprozente dürfen im Datenmodell nicht nochmals durch 100 geteilt werden.');
assert.ok(!cockpit.includes('selected-cloud-values'),'Im Wolkenplot darf keine rechte Prozentwert-Achse erscheinen.');
assert.ok(!cockpit.includes('Wolken (%)'),'Die Wolkendarstellung bleibt ohne Prozentachse.');
assert.ok(!cockpit.includes("rows=[{key:'total',className:'total',y:cloudTop"),'Das alte Gesamtbewölkungs-Grauband darf nicht parallel zur gemeinsamen Skybar bestehen.');

// Die appweite DWD-Thermikpalette besitzt genau eine Quelle für Current und Cockpit.
for(const token of ['veryCold','cold','cool','slightlyCool','comfortable','slightlyWarm','warm','hot','veryHot'])assert.ok(dwdWarnings.includes(token),`DWD-Thermikfarbe fehlt: ${token}`);
assert.ok(app.includes("import {DWD_THERMAL_FEEL_COLORS"),'Current muss die zentrale DWD-Thermikpalette verwenden.');
assert.ok(cockpit.includes("import {DWD_THERMAL_FEEL_COLORS"),'Wetterprofil muss die zentrale DWD-Thermikpalette verwenden.');

// Open-Meteo-Audit: kanonische Felder und aktuelle Modell-Fallbacks bleiben erhalten.
for(const field of ['precipitation_probability','precipitation','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','pressure_msl','is_day','sunshine_duration'])assert.ok(weatherTypes.includes(field),`Open-Meteo-Stundenfeld fehlt: ${field}`);
for(const field of ['sunrise','sunset'])assert.ok(weatherTypes.includes(field),`Open-Meteo-Tagesfeld fehlt: ${field}`);
for(const token of ['rawProbability=n(w.hourly.precipitation_probability[i],0)','highCloud=n(w.hourly.cloud_cover_high?.[i],NaN)','midCloud=n(w.hourly.cloud_cover_mid?.[i],NaN)','pressure:n(w.hourly.pressure_msl?.[i],NaN)'])assert.ok(weatherMapping.includes(token),`Open-Meteo-Index-/Mappingvertrag fehlt: ${token}`);
for(const source of [weatherTypes,weatherSpecialized,workerCore,workerModels])assert.ok(source.includes('ukmo_seamless'),'Aktueller UKMO-Seamless-Fallback fehlt in einem Browser-/Worker-Vertrag.');
for(const token of ['ncep_gfs_global','ncep_hrrr_conus','ncep_nbm_conus'])assert.ok(weatherTypes.includes(token)&&workerCore.includes(token),`Aktuelle NOAA-Modellkennung fehlt: ${token}`);
for(const level of ['1000','925','850','700','500','300'])assert.ok(meteogram.includes(level),`Meteogramm-Druckniveau ${level} hPa fehlt.`);

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-weather-profile-rolling-openmeteo-audit-09653.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Neue Profil-/Open-Meteo-Prüfung muss im Baseline-Vertrag stehen.');
assert.ok(baseline.regressionTests.includes(test),'Neue Profil-/Open-Meteo-Prüfung muss im Release-Testlauf stehen.');
assert.ok(baseline.requiredFiles.includes(test),'Neue Profil-/Open-Meteo-Prüfung muss als Pflichtdatei geschützt sein.');
console.log(`MID v${pkg.version}: gleitendes 24-h-Profil, responsive Kollisionsfreiheit, DWD-Farben und Open-Meteo-Auditverträge geprüft.`);
