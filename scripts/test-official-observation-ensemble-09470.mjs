import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgText,baselineText,weather,quality,app,worker,env,change]=await Promise.all([
 read('package.json'),read('MID_BASELINE.json'),read('src/weather.ts'),read('src/sourceQuality.ts'),read('src/App.tsx'),read('worker/metar-proxy.js'),read('.env.example'),read('CHANGELOG.md')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);
const versionParts=String(pkg.version).split('.').map(Number);
assert.ok(versionParts.length===4&&versionParts.every(Number.isFinite),'Ungültige MID-Version.');
const minimum=[0,9,47,0];
assert.ok(versionParts.some((value,index)=>value>minimum[index]&&versionParts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]))||versionParts.every((value,index)=>value===minimum[index]),'Der amtliche Beobachtungs-/Ensemblevertrag gilt ab MID v0.9.47.0.');
assert.equal(baseline.releaseVersion,pkg.version);

// Direkter DWD-SYNOP-Pfad und echter Bright-Sky-Rückfall.
assert.match(worker,/stationlist_synoptic_germany\.csv/);
assert.match(worker,/weather_reports\/poi\//);
assert.match(worker,/DWD SYNOP \/ OpenData POI/);
assert.match(worker,/direct\.length\?\[\]:brightSkyRows/);
assert.match(worker,/age>4\*3600000\|\|age<-45\*60000/);

// Country-aware amtliche Brokerpfade.
for(const token of ['SMHI MetObs','Finnish Meteorological Institute / Open Data','US National Weather Service / MADIS','Environment and Climate Change Canada / SWOB-GeoMet','AEMET OpenData','MeteoSwiss SwissMetNet','KNMI 10-min In-situ'])assert.ok(worker.includes(token),token);
assert.match(weather,/country:country/);
assert.match(worker,/country==='SE'/);
assert.match(worker,/country==='FI'/);
assert.match(worker,/country==='US'/);
assert.match(worker,/country==='CA'/);

// Straßenwetter ist spezialisierte Quelle und kein universeller Stationssieger.
assert.match(quality,/const ROAD_WEATHER:StationSourcePolicy=/);
assert.match(quality,/road&&\(field==='windSpeed'.*field==='precipitation'\)\)return\{quality:\.08/s);
assert.match(worker,/MID_DWD_ROAD_WEATHER_POINT_ENDPOINT/);
assert.match(worker,/sourceType.*road-weather|road-weather/);

// Parameterweise Herkunft bis zur Oberfläche.
assert.match(weather,/export type StationFieldSource=/);
assert.match(weather,/fieldSources\?:StationFieldSources/);
assert.match(weather,/stationFieldSourcesFromAnalysis/);
assert.match(app,/Messwertquellen/);
assert.match(app,/const fieldSourceInfo=.*if\(!fresh\)return undefined/);
assert.match(app,/amtliche Bodenbeobachtung/);
assert.match(app,/Straßenwetter/);

// HGEFS nur als Mean/Spread, Regionalensembles als Adaptermodelle mit Familiengruppen.
const fullModelBlock=weather.slice(weather.indexOf('const ensembleModels:'),weather.indexOf('type EnsembleMeanModel'));
const meanModelBlock=weather.slice(weather.indexOf('const meanModels:'),weather.indexOf("const ENSEMBLE_CACHE_PREFIX"));
assert.ok(!fullModelBlock.includes('ncep_hgefs025_ensemble_mean'),'HGEFS darf nicht als Full-Member-Modell geführt werden');
assert.ok(meanModelBlock.includes('ncep_hgefs025_ensemble_mean'));
assert.match(weather,/distributionMode:'mean-spread'/);
assert.match(weather,/memberCount:r\.model\.distributionMode==='mean-spread'\?0:rows\.length/);
assert.match(weather,/scenarios:EnsembleScenarioCluster\[\]=\[\]/);
assert.match(weather,/knmi_harmonie_arome_cy43_eps.*uwc-west-harmonie-eps.*maxDays:2\.5/);
assert.match(weather,/eccc_reps.*eccc-reps.*maxDays:3/);
assert.match(weather,/DIRECT_REGIONAL_ENSEMBLE_MODELS=new Set\(\['knmi_harmonie_arome_cy43_eps','eccc_reps'\]\)/);
assert.match(weather,/if\(directRegional\)throw/);
assert.match(worker,/MID_KNMI_HARMONIE_EPS_POINT_ENDPOINT/);
assert.match(worker,/MID_ECCC_REPS_POINT_ENDPOINT/);

// Kein neuer generischer Binärdecoder als Laufzeitabhängigkeit; Adaptervertrag dokumentiert.
for(const forbidden of ['eccodes','bufr-js','grib2-simple','wgrib'])assert.ok(!pkgText.toLowerCase().includes(forbidden),`unerwartete Decoder-Abhängigkeit: ${forbidden}`);
assert.match(env,/bewusst keine rohen BUFR-\/GRIB-Dateien/);
assert.match(change,/# MID v0\.9\.47\.0/);

console.log(`MID v${pkg.version}: amtlicher Beobachtungsbroker, Quellenherkunft und Ensemble-Adaptervertrag geprüft.`);
