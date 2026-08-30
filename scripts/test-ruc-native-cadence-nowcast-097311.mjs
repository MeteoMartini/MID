import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const [fetcher,builder,pack,pages,worker,fusion,app,extreme,weather,cockpit]=await Promise.all([
 read('tools/ruc/fetch_and_build_ruc.py'),read('tools/ruc/build_ruc_bundle.py'),read('tools/ruc/ruc_pack.py'),read('tools/ruc/prepare_ruc_pages.py'),read('worker-src/00-core-observations.js'),read('src/forecastFusion.ts'),read('src/App.tsx'),read('worker-src/25-dach-extreme-outlook.js'),read('src/weather-src/00-types-models-search.tsfrag'),read('src/ForecastCockpit.tsx')
]);
for(const token of ["RAPID_REQUIRED=('TOT_PREC','CAPE_ML','CIN_ML')","mode=='rapid-precip'","lead<=rapid_limit and lead%5==0","mode=='rapid15'","lead<=rapid_limit and lead%15==0","RAPID_OPTIONAL_15=('DBZ_CMAX','CAPE_MU','CIN_MU','LPI','LPI_MAX','UH_MAX','UH_MAX_LOW','UH_MAX_MED','ECHOTOPinM','HAIL_GSP','LAPSE_RATE','W_CTMAX','VORW_CTMAX','RAIN_GSP','SNOW_GSP','GRAU_GSP','ASOB_S','ASWDIR_S','ASWDIFD_S')"])assert.ok(fetcher.includes(token),`Fetcher native-cadence contract missing: ${token}`);
assert.ok(fetcher.includes("SPECIALIST_HOURLY_OPTIONAL=('VIS','CEILING','HZEROCL','SNOWLMT','CLCM','CLCH','T_G','H_SNOW')"),'Specialist hourly RUC products must be staged without becoming hard requirements.');
assert.ok(!fetcher.includes("'SRH','WSHEAR_U','WSHEAR_V'"),'SRH/WSHEAR must not be auto-staged before their DWD lvt1 layer semantics are explicitly selected.');
for(const token of ["rapid5_times=rapid_targets(a.run,5,6)","rapid15_times=rapid_targets(a.run,15,6)","rapid-5m.bin","rapid-15m.bin","rapid-extreme.json","rapid-reflectivity-15m.bin","rapid-severe-15m.bin","rapid-solar-15m.bin","specialist-hourly.bin","rapid-phase-15m.bin"])assert.ok(builder.includes(token),`Builder rapid contract missing: ${token}`);
for(const token of ['RAPID_5M_FIELDS','RAPID_15M_FIELDS','REFLECTIVITY_15M_FIELDS','SEVERE_15M_FIELDS','SOLAR_15M_FIELDS','SPECIALIST_HOURLY_FIELDS','PHASE_15M_FIELDS'])assert.ok(pack.includes(token),`Wire spec missing: ${token}`);
assert.ok(pages.includes("meta.get('rapid')")&&pages.includes('rapid-extreme.json'),'Pages-free publication must include required rapid products.');
for(const token of ['dwdRucStaticRapidPayload','rucRapidMinute15Rows','rapidMinutes15','nativePrecipitationSeconds','dwdRucRapidExtremeSnapshot'])assert.ok(worker.includes(token),`Worker rapid integration missing: ${token}`);
assert.ok(fusion.includes('rucRapidMinutes15?:ForecastFusionRapidMinute15[]'),'Client fusion must accept canonical RUC rapid 15-minute rows.');
assert.ok(fusion.indexOf('const rucRapid=nearestForecastHour')<fusion.indexOf('const radarBlend=blendRadarAtTarget'),'RUC model rapid data must be applied before radar so observed radar retains priority.');
assert.ok(app.includes('rucRapidMinutes15:forecastFusion?.rapidMinutes15'),'Canonical displayMinutes15 must receive RUC rapid rows.');
assert.ok(extreme.includes('dachExtremeApplyRucRapid')&&extreme.includes("periodId!=='0-6'")&&extreme.includes('ICON-D2-RUC 5-min Niederschlag'),'Extreme outlook must use RUC rapid support only in 0–6 h.');
assert.ok(cockpit.includes('Niederschlag 5 min bis +6 h')&&cockpit.includes('Konvektion/Reflektivität 15 min bis +6 h'),'Model text must expose parameter-native cadence.');
assert.ok(weather.includes('fehlende Temperatur-, Wind-, Druck- oder Wolkenzwischenwerte werden nicht interpoliert'),'Model text must reject fabricated high-frequency state fields.');
console.log('RUC native cadence/nowcast contract passed: 5-min precipitation through +6 h, 15-min convection/severe/solar diagnostics, hourly state core, radar-priority and 0–6 h extreme support.');
