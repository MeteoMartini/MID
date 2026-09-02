import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [weather,airQuality,meteogram,worker,contracts]=await Promise.all([
 read('src/weather.ts'),read('src/airQuality.ts'),read('src/MeteogramPanel.tsx'),read('worker/metar-proxy.js'),read('scripts/check-api-contracts.mjs')
]);

// Open-Meteo-Fix 07.08.2026: AIFS Europe Ensemble muss Cloud-/Niederschlagsskalen plausibilisieren.
for(const token of ["ecmwf_aifs_europe_ensemble","cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high","aifsEuropeEnsembleContractValid","value<0||value>100","value<0||value>500"])assert.ok(weather.includes(token),`AIFS-Europe-Audit fehlt: ${token}`);
assert.match(weather,/ensembleVariablesForContract\(modelId,rawVariables\)/);

// Météo-France-Migration 04.08.2026: aktuelle AROME/ARPEGE-IDs, Seamless-Fallback und Wetterbündelfelder.
for(const token of ['meteofrance_arome_france_hd_15min','meteofrance_arome_france_15min','meteofrance_arome_france_hd','meteofrance_arome_france','meteofrance_seamless','meteofrance_arpege_europe','meteofrance_arpege_world'])assert.ok(weather.includes(token)||worker.includes(token),`Météo-France-Vertrag fehlt: ${token}`);
assert.ok(!weather.includes("meteofrance_arome_france0025"),'Veralteter AROME-Modellalias darf nicht mehr der Primärvertrag sein.');
for(const token of ['precipitation','wind_speed_10m','cloud_cover','sunshine_duration'])assert.ok(worker.includes(token),`Météo-France-Wetterbündelfeld fehlt: ${token}`);

// JMA-Migration 13.08.2026: MSM/GSM/Seamless + lokaler Best-Match-/Höhen-/Pressure-Level-Pfad.
for(const token of ['jma_msm','jma_gsm','jma_seamless']){assert.ok(weather.includes(token),`JMA-Modell fehlt in weather.ts: ${token}`);assert.ok(worker.includes(token),`JMA-Modell fehlt im Worker: ${token}`)}
assert.match(meteogram,/effectiveMeteogramModel\(model:string,lat:number,lon:number\).*jma_seamless/);
assert.match(worker,/effectiveMeteogramModel\(requested,lat,lon\).*jma_seamless/);
assert.match(meteogram,/url\.searchParams\.set\('elevation'/);
for(const level of ['1000','925','850','700','500','300','250','200','150','100'])assert.ok(meteogram.includes(level),`JMA-Druckniveau ${level} hPa fehlt.`);

// EU-AQI 14.08.2026: 0/20/40/60/80/100-Indexbänder, pollutantenspezifische Indizes und stündliche PM-Reihe.
assert.ok(airQuality.includes('EUROPEAN_AQI_INDEX_THRESHOLDS=[20,40,60,80,100]'));
for(const token of ['european_aqi_pm2_5','european_aqi_pm10','european_aqi_nitrogen_dioxide','european_aqi_ozone','european_aqi_sulphur_dioxide'])assert.ok(weather.includes(token)&&airQuality.includes(token),`EU-AQI-Teilindex fehlt: ${token}`);
assert.match(weather,/hourly:\[\.\.\.pollutantAqi,\.\.\.pollutants\]\.join\(','\)/);
for(const token of ["thresholds:[10,20,25,50,75]","thresholds:[20,40,50,100,150]","thresholds:[40,90,120,230,340]","thresholds:[50,100,130,240,380]","thresholds:[100,200,350,500,750]"])assert.ok(airQuality.includes(token),`EU-AQI-Konzentrationsschwelle fehlt: ${token}`);

// Min-/Max-Aggregationsmetadaten: MID bleibt JSON-basiert; der Online-Vertrag prüft die beiden Aggregationen getrennt.
assert.ok(!weather.toLowerCase().includes('flatbuffers'),'MID darf wegen des Open-Meteo-Metadatenfixes keinen FlatBuffers-Laufzeitpfad einführen.');
for(const token of ['temperature_2m_min','temperature_2m_max',"models:'ecmwf_ifs'","forecast_hours:'24'",'ECMWF IFS native 3h Min/Max'])assert.ok(contracts.includes(token),`Min-/Max-Vertragscheck fehlt: ${token}`);

// Bereits verbindliche Begleitregressionen: Astronomie und DWD ICON.
for(const token of ['moonrise','moonset','moon_phase'])assert.ok(contracts.includes(token),`Mond-API-Vertrag fehlt: ${token}`);
for(const token of ['dwd_icon_d2','dwd_icon_eu','dwd_icon'])assert.ok(weather.includes(token),`DWD-ICON-Vertrag fehlt: ${token}`);
assert.ok(weather.includes("country==='DE'?['dwd_icon_d2'"),'DWD ICON-D2 muss in Deutschland hyperlokal Vorrang behalten.');

console.log('Open-Meteo-Update-Audit 17.08.2026 geprüft: AIFS Europe, Météo-France, JMA, EU-AQI, Min/Max-Metadaten, Mond und DWD ICON.');
