import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const fusion=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "const BRIGHTSKY_WEATHER='https://api.brightsky.dev/weather'",'async function fetchMosmixForecast',"family:'mosmix-postprocessing'",'distanceKm<=55','elevationDifferenceM<=450','quality>=.42','mosmixBase=horizon<=2?.52:horizon<=7?.42:0','confidence>=52','MOSMIX lokal','modelDays','version:9',"'dwd-mosmix-postprocessing'",'MOSMIX bleibt ein korreliertes DWD-Postprocessing',"family:'ecmwf-ifs'","family:'ecmwf-aifs'","independenceGroup:'ecmwf'"
])need('Worker-MOSMIX',worker,token);
for(const token of ['modelDays?:ForecastFusionDay[]','weatherHours?:ForecastWeatherBundleHour[]','applyForecastFusionModelDays','fusion?.mosmix?.applied','leadHours<=6?.18','leadHours>168','MOSMIX lokal'])need('Frontend-Fusion',fusion,token);
for(const token of ['fusionVerificationCandidates',"id:'mid_best_match_quality_model'","label:'Best Match geprüft ohne MOSMIX'",'applyForecastFusionHours(hours,days,fusedDays,forecastFusion)','days={displayDays}','hours={displayHours}'])need('App-Integration',app,token);
need('Kurzfrist-Badge',shortTerm,'<em>{sourceLabel}</em>');
if(worker.includes('precipitation=mosmixApplied?'))failures.push('MOSMIX darf Tagesniederschlag weiterhin nicht als eigenständige Leitprognose überschreiben.');
if(fusion.includes('precipStrength=Math.max')||fusion.includes('blendToward(next.precipitation,mosmix.precipitation'))failures.push('MOSMIX darf keine Stundenmenge erzeugen oder skalieren.');
for(const token of ['rucPrecipitationConsensus','precipitation:Number.isFinite(precipitation)?Math.max(0,precipitation):undefined','precipitationConsensusAvailable','RR1c-Niederschlagskonsens'])need('MOSMIX-Niederschlagskonsens',worker,token);
if(worker.includes('mosmixProbability(')||worker.includes('sunshineDuration:mosmixSunshineSeconds'))failures.push('MOSMIX darf weiterhin keine eigene Wettercode-/Sonnenschein-Leitprognose erzeugen.');
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,33,0];let atLeast=true;for(let i=0;i<minimum.length;i++){if((parts[i]??0)>minimum[i])break;if((parts[i]??0)<minimum[i]){atLeast=false;break}}
if(!atLeast)failures.push(`Version liegt vor 0.8.33.0: ${pkg.version}`);if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != ${pkg.version}`);if(!baseline.requiredRegressionTests?.includes('scripts/test-mosmix-adaptive-fusion-08330.mjs'))failures.push('Baseline enthält MOSMIX-Fusionstest nicht.');
if(failures.length){console.error('MID MOSMIX-/Modellbündel-Fusion fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MOSMIX bleibt korreliertes DWD-Postprocessing: Temperatur/Wind werden lokal nachkorrigiert; die stündliche Niederschlagsmenge dient ausschließlich als RR1c-Konsensanker gegen RUC-Ausreißer.');
