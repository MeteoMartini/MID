import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [worker,fusion,weather,extreme,env,pkg,baseline,contract]=await Promise.all([
 read('worker/metar-proxy.js'),read('src/forecastFusion.ts'),read('src/weather.ts'),read('worker-src/25-dach-extreme-outlook.js'),read('.env.example'),read('package.json'),read('MID_BASELINE.json'),read('MID_MODEL_SOURCE_CONTRACT.md')
]);
const version=JSON.parse(pkg).version,base=JSON.parse(baseline),testName='scripts/test-ruc-appwide-nowcast-0966711.mjs';
assert.equal(version,'0.9.67.11');
assert.equal(base.releaseVersion,version);
assert.ok(base.requiredRegressionTests?.includes(testName),'RUC-Appweit-Test fehlt im Baseline-Vertrag.');
for(const token of ["id:'icon_d2_ruc'","bbox:[-3.85,43.18,20.22,58.05]",'MID_DWD_RUC_POINT_ENDPOINT','applyRucRapidUpdateWeatherHours','rucRapidWeight','rucAppliedHours',"sourceRole:'rapid-update'"])assert.ok(worker.includes(token),`RUC-Fusionsvertrag fehlt: ${token}`);
for(const token of ['MID_DWD_RUC_EPS_POINT_ENDPOINT','fetchDwdRucEpsProbabilityAdapter','applyRucEpsProbabilityHours','rucEpsAppliedHours',"icon_d2_ruc_eps:{endpoint:'MID_DWD_RUC_EPS_POINT_ENDPOINT'"])assert.ok(worker.includes(token),`RUC-EPS-Vertrag fehlt: ${token}`);
assert.ok(weather.includes("id:'icon_d2_ruc_eps'"),'RUC-EPS fehlt im Ensemblemodellkatalog.');
assert.ok(weather.includes("variantGroup:'dwd-icon-d2-eps-rapid'"),'RUC-EPS/ICON-D2-EPS teilen keine Variantengruppe.');
assert.ok(weather.includes("shortRangeOnly:true"),'RUC-EPS ist nicht als Kurzfristadapter markiert.');
assert.ok(weather.includes("DIRECT_REGIONAL_ENSEMBLE_MODELS=new Set(['icon_d2_ruc_eps','knmi_harmonie_arome_cy43_eps','eccc_reps'])"),'Regionalensemble-Adapter sind nicht additiv erhalten.');
assert.ok(fusion.includes('windowMinutes=relevance.approaching?120:180'),'Nahe/stationäre KONRAD3D-Zellen fehlen in der kanonischen Nowcast-Korrektur.');
assert.ok(fusion.includes('electrified=lightning>=1'),'Gewitter-ohne-Blitz-Schutz fehlt.');
assert.ok(worker.includes('dwdKonrad3dRegionalSnapshot'),'Regionaler KONRAD3D/Meso-Snapshot fehlt.');
assert.ok(extreme.includes("typeof dwdKonrad3dRegionalSnapshot==='function'"),'Browser-/Worker-Grenze für regionalen KONRAD-Snapshot fehlt.');
assert.ok(extreme.includes("periodId!=='0-6'"),'KONRAD/Meso-Korrektur ist nicht auf 0–6 h begrenzt.');
for(const token of ['MID_DWD_RUC_POINT_ENDPOINT','MID_DWD_RUC_EPS_POINT_ENDPOINT'])assert.ok(env.includes(token),`${token} fehlt in .env.example.`);
for(const forbidden of ['eccodes','bufr-js','grib2-simple','wgrib'])assert.ok(!pkg.toLowerCase().includes(forbidden),`Worker-lastige Decoderabhängigkeit unerwartet: ${forbidden}`);
assert.ok(contract.includes('ICON-D2-RUC / RUC-EPS Kurzfristvertrag (MID v0.9.67.11)'));
console.log('MID v0.9.67.11: RUC/RUC-EPS appweit, Familienbudget, Kurzfrist-Ensemble sowie KONRAD3D/Meso-Nowcast mit Workerlast-Schutz geprüft.');
