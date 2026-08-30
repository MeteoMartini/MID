import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const fusion=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const verification=readFileSync(new URL('../src/forecastVerification.ts',import.meta.url),'utf8');
const weather=readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "if(mode==='forecast-fusion')return forecastFusionResponse(u,env);",
 "'adaptive-priority-forecast-fusion'",
 'FORECAST_FUSION_HOURLY',
 "id:'icon_d2'",
 "id:'icon_eu'",
 "id:'ecmwf_ifs'",
 "id:'ecmwf_aifs'",
 "family:'ecmwf-ifs'",
 "family:'ecmwf-aifs'",
 "independenceGroup:'ecmwf'",
 'fetchForecastFusionModels',
 'weatherBundleIssues',
 'coherentWeatherHours',
 'version:9',
 "schema:'mid.forecast-fusion.v1'",
 'Best Match bleibt die kohärente Basis',
 'suffixFields',
 'MOSMIX wird bewusst nur als lokales Postprocessing'
])need('Worker-Fusion',worker,token);
for(const token of [
 'const FRESH_MS=35*60*1000',
 'ForecastWeatherBundleHour',
 'weatherHours?:ForecastWeatherBundleHour[]',
 'applyForecastFusionDays',
 'applyForecastFusionHours',
 'reconcileForecastDaysWithHours',
 "weatherBundleKind:repaired?'coherent-model':'best-match'",
 'Der Wetter-/Niederschlagszustand bleibt vollständig',
 'leadHours>168',
 'Best Match geprüft',
 '% Modellvergleich'
])need('Frontend-Fusion',fusion,token);
for(const token of [
 'requestIdleCallback',
 'isInputPending',
 'loadForecastFusion(',
 'twinForecastActive?localTwinDays:fusedDays',
 'finalizeForecastHours',
 "id:'mid_best_match_quality'",
 'Best Match · geprüft und lokal nachkorrigiert',
 'Wetter-/Niederschlagsbündel:'
])need('App-Integration',app,token);
for(const token of ['applyOperationalNowcastHours','applyConvectiveNowcastHours','reconcileCurrentTemperatureObservation','reconcileForecastHoursWithDays'])need('Gemeinsame Endstufe',fusion,token);
for(const token of [
 'weatherSourceId',
 'weatherSourceLabel',
 "weatherSourceId:'best_match',weatherSourceLabel:'Open-Meteo Best Match',weatherBundleKind:'best-match' as const"
])need('Best-Match-Herkunft',weather,token);
for(const token of [
 'additional:AdditionalForecastPrediction[]=[]',
 'ein gemeinsames Wetterbündel',
 'const weatherRepresentative=',
 'weatherCode:Number.isFinite(weather.weatherCode)',
 'Best Match bleibt auch bei aktivem Wetterzwilling das vollständige Wetterbündel'
])need('Verifikation',verification,token);
const setWeather=app.indexOf('setW(fw);'),fusionEffect=app.indexOf('loadForecastFusion(');
if(setWeather<0||fusionEffect<0||fusionEffect<setWeather)failures.push('Mehrquellen-Fusion darf die erste Best-Match-Darstellung nicht blockieren.');
if(worker.includes("family:'aifs'"))failures.push('ECMWF AIFS darf nicht als unabhängige Modellfamilie zusätzlich zu IFS übergewichtet werden.');
if(fusion.includes('distributeDailyPrecipitationDeficit'))failures.push('Tagesmengen dürfen nicht auf künstlich erzeugte Stunden verteilt werden.');
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,32,0];
let atLeast=true;for(let i=0;i<minimum.length;i++){if((parts[i]??0)>minimum[i])break;if((parts[i]??0)<minimum[i]){atLeast=false;break}}
if(!atLeast)failures.push(`Version liegt vor 0.8.32.0: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != ${pkg.version}`);
if(!baseline.requiredRegressionTests?.includes('scripts/test-priority-forecast-fusion-08320.mjs'))failures.push('Baseline enthält Fusionstest nicht.');
if(failures.length){console.error('MID kohärente Prioritätsfusion fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID nutzt eine nicht blockierende Best-Match-Hauptprognose mit suffixgeprüfter Bündelreparatur und lokaler Nachkorrektur.');
