import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const [audit,fetcher,builder,pack,worker,fusion,extreme,weather,cockpit]=await Promise.all([
  read('MID_RUC_PARAMETER_AUDIT_0.9.73.11.md'),read('tools/ruc/fetch_and_build_ruc.py'),read('tools/ruc/build_ruc_bundle.py'),read('tools/ruc/ruc_pack.py'),read('worker-src/00-core-observations.js'),read('src/forecastFusion.ts'),read('worker-src/25-dach-extreme-outlook.js'),read('src/weather-src/00-types-models-search.tsfrag'),read('src/ForecastCockpit.tsx')
]);
for(const token of ['114 gelisteten Parametern','Natives Rapid-Niederschlagsprodukt 5 min 0…+6 h','Strahlung 15 min 0…+6 h','Stündliche Spezialdiagnostik 0…+14 h','Vertikale Scherung / SRH','Sonnenscheindauer'])assert.ok(audit.includes(token),`Audit contract missing: ${token}`);
for(const token of ["RAPID_REQUIRED=('TOT_PREC','CAPE_ML','CIN_ML')","'DBZ_CMAX'","'CAPE_MU'","'UH_MAX'","'ECHOTOPinM'","'HAIL_GSP'","'RAIN_GSP'","'SNOW_GSP'","'ASWDIR_S'","SPECIALIST_HOURLY_OPTIONAL=('VIS','CEILING','HZEROCL','SNOWLMT','CLCM','CLCH','T_G','H_SNOW')"])assert.ok(fetcher.includes(token),`Fetcher audit integration missing: ${token}`);
assert.ok(!fetcher.includes("'LAPSE_RATE','SRH','WSHEAR_U','WSHEAR_V'"),'Ambiguous lvt1 SRH/shear fields must remain deferred.');
for(const token of ['rapid-severe-15m.bin','rapid-solar-15m.bin','specialist-hourly.bin','rapid-phase-15m.bin','rapid-reflectivity-15m.bin','mid.dwd.ruc.rapid-extreme.v3'])assert.ok(builder.includes(token),`Builder audit product missing: ${token}`);
assert.ok(pack.includes("FieldSpec('visibility', 'm', 10.0)"),'Visibility must use a non-clipping 10 m int16 scale.');
for(const token of ['capeMu','uhMax','lpiMax','echoTopM','hailGsp','shortwaveDirect','rucCeilingM','rucFreezingLevelM','rucSnowlineM'])assert.ok(worker.includes(token)||fusion.includes(token),`Worker/client diagnostic missing: ${token}`);
assert.ok(extreme.includes('rucUhMax')&&extreme.includes('rucLpiMax')&&extreme.includes('rucEchoTopM'),'0–6 h extreme outlook must expose organized-convection RUC support.');
assert.ok(extreme.includes('rucGustKmh')&&extreme.includes('rucSnowlineMinM')&&extreme.includes('rucFreezingLevelMinM'),'6–14 h extreme outlook must expose scientifically useful hourly RUC state diagnostics.');
assert.ok(!worker.includes('sunshineDuration:solarValue')&&!fusion.includes('sunshineDuration:rapid'),'RUC solar diagnostics must not bypass the Sunshine-Duration-Contract.');
assert.ok(cockpit.includes('Zustandskern 1 h bis +14 h')&&cockpit.includes('Niederschlag 5 min bis +6 h'),'Visible model text must report the parameter-native RUC cadence.');
console.log('RUC parameter audit contract passed: native rapid products, specialist hourly diagnostics, deferred ambiguous vertical shear layers, and Sunshine contract protection.');
