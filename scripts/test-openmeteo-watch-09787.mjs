import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [subseasonal,seasonal,weather,water,contract,baseline]=await Promise.all([
  readFile(new URL('../src/SubseasonalTrendPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/seasonalForecast.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/weather.tsfrag',import.meta.url),'utf8'),
  readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../MID_OPEN_METEO_WATCH_2026-09-03.md',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

for(const token of ['temperature_2m_max','temperature_2m_min','precipitation_sum','pressure_msl_mean','cloud_cover_mean','wind_speed_10m_mean'])
  assert.ok(subseasonal.includes(token),`Witterungstrend-Feld fehlt: ${token}`);
for(const forbidden of ['dew_point_2m_mean','surface_temperature_anomaly_gt0','precipitation_sot90','precipitation_efi','temperature_2m_sot10','temperature_2m_sot90'])
  assert.ok(!subseasonal.includes(`api:'${forbidden}'`),`Korrigiertes Open-Meteo-Feld wird unerwartet operativ im Witterungstrend interpretiert: ${forbidden}`);
for(const token of ["'temperature_2m_mean'","'temperature_2m_anomaly'","'precipitation_mean'","'precipitation_anomaly'"])
  assert.ok(seasonal.includes(token),`Saisonaler Kernvertrag fehlt: ${token}`);
assert.ok(weather.includes("'wave_period','wave_peak_period'"),'Marinevertrag muss wave_period und wave_peak_period getrennt anfordern.');
assert.ok(water.includes("metric(marine,'wavePeriod')")===false,'Marine-UI darf keine erfundene camelCase-wavePeriod-Metadatenkopplung enthalten.');
assert.ok(water.includes("metric(marine,'wave_peak_period')"),'Marine-UI muss wave_peak_period separat lesen.');
assert.ok(weather.includes('https://api.open-meteo.com/v1/elevation?'),'MID muss die Open-Meteo-Elevation-API nutzen.');
assert.ok(!weather.includes('lat < 0 ? Int(lat) - 1'),'Der alte upstream fehlerhafte südliche DEM-Indexalgorithmus darf in MID nicht dupliziert werden.');
assert.ok(!weather.toLowerCase().includes('0..<51'),'MID darf keine Swift-artige feste GloFAS-51-Memberannahme replizieren.');
for(const hash of ['1ee749460f68e83f02485ab79f328c5a4bccd504','833fbb57525834bd577894bcbcfc1342c209cf71','05176417d08df50de7c715de40e325a567550f4c','e3e55ba86a69ffa4eae2ec5358833cac32a91e2d'])
  assert.ok(contract.includes(hash),`Open-Meteo-Watch-Upstreamanker fehlt: ${hash}`);
const parsed=JSON.parse(baseline);
assert.equal(parsed.releaseVersion,'0.9.78.7','Baseline muss auf die zusammengeführte Version v0.9.78.7 zeigen.');
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-openmeteo-watch-09787.mjs'),'Watch-Regression fehlt in requiredRegressionTests.');
assert.ok(parsed.requiredFiles.includes('MID_OPEN_METEO_WATCH_2026-09-03.md'),'Watch-Vertrag fehlt in requiredFiles.');
console.log('Open-Meteo Watch 2026-09-03 geprüft: EC46/Marine/GloFAS/DEM/Météo-France-Upstreamdelta ist mit dem parallelen v0.9.78.6-Niederschlagszweig konsolidiert.');
