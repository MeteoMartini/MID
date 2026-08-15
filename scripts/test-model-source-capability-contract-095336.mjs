import fs from 'node:fs';
const weather=fs.readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const worker=fs.readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const cockpit=fs.readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const contract=fs.readFileSync(new URL('../MID_MODEL_SOURCE_CONTRACT.md',import.meta.url),'utf8');
const setup=fs.readFileSync(new URL('../MID_REGIONAL_ENSEMBLE_ADAPTER_SETUP.md',import.meta.url),'utf8');
const required=[
 ['success-driven loader',/loadEnsembleUnits\(selected,8/],
 ['ECMWF IFS variant fallback',/variantGroup:'ecmwf-ifs-ens-native-global'/],
 ['ECMWF AIFS variant fallback',/variantGroup:'ecmwf-aifs-ens-native-global'/],
 ['adapter status',/'adapter-not-configured'/],
 ['active metadata placeholder',/Modell aktiv · Laufmetadaten derzeit nicht abrufbar/],
 ['AIGEFS mean reserve',/ncep_aigefs025_ensemble_mean/],
 ['UKMO mean reserve',/ukmo_global_ensemble_mean_20km/],
 ['MeteoSwiss mean reserve',/meteoswiss_icon_ch1_ensemble_mean/],
 ['BOM mean reserve',/bom_access_global_ensemble_mean/]
];
for(const [label,re] of required)if(!re.test(weather))throw new Error(`weather.ts fehlt: ${label}`);
if(/withoutGlobalEcmwfDuplicates/.test(weather))throw new Error('ECMWF-Globalvarianten werden weiterhin vor dem Abruf entfernt.');
if(!/ensemble-capabilities/.test(worker)||! /regionalEnsembleCapabilities/.test(worker))throw new Error('Worker-Capability-Diagnose fehlt.');
if(!/Adapter fehlt/.test(cockpit)||!/Fallback/.test(cockpit)||!/Laufmetadaten derzeit nicht abrufbar/.test(cockpit))throw new Error('Cockpit-Quellenstatus unvollständig.');
if(!/Adapter fehlt/.test(app)||!/Reserve/.test(app))throw new Error('App-Modellstatus unvollständig.');
if(!/Success-driven statt slot-driven/.test(contract)||!/Laufmetadaten/.test(contract))throw new Error('Modellquellenvertrag unvollständig.');
if(!/MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT/.test(setup)||!/MID_ECCC_REPS_POINT_ENDPOINT/.test(setup))throw new Error('Adapter-Setup unvollständig.');
console.log('MID v0.9.53.36 model-source capability contract: OK');
