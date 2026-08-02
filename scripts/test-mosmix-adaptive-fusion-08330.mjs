import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const fusion=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "const BRIGHTSKY_WEATHER='https://api.brightsky.dev/weather'",'async function fetchMosmixForecast',"family:'mosmix-postprocessing'",'distanceKm<=55','elevationDifferenceM<=450','quality>=.42','mosmixBase=horizon<=2?.52:horizon<=7?.42:0','confidence>=52','MOSMIX erzeugt keinen Niederschlag','modelDays','version:4',"'dwd-mosmix-postprocessing'",'MOSMIX wird bewusst nur als lokales Postprocessing',"family:'ecmwf'"
])need('Worker-MOSMIX',worker,token);
for(const token of ['modelDays?:ForecastFusionDay[]','weatherHours?:ForecastWeatherBundleHour[]','applyForecastFusionModelDays','fusion?.mosmix?.applied','leadHours<=6?.18','leadHours>168','MOSMIX Temperatur/Wind'])need('Frontend-Fusion',fusion,token);
for(const token of ['fusionVerificationCandidates',"id:'mid_priority_fusion_model'","label:'MID Prioritätsfusion ohne MOSMIX'",'applyForecastFusionHours(hours,days,fusedDays,forecastFusion)','days={displayDays}','hours={displayHours}'])need('App-Integration',app,token);
need('Kurzfrist-Badge',shortTerm,'<em>{sourceLabel}</em>');
if(worker.includes('mosmixPrecipStrength')||worker.includes('precipitation=mosmixApplied?'))failures.push('MOSMIX darf Tagesniederschlag nicht mehr parametrisch verändern.');
if(fusion.includes('precipStrength=Math.max')||fusion.includes('blendToward(next.precipitation,mosmix.precipitation'))failures.push('MOSMIX darf keine Stundenmenge erzeugen oder skalieren.');
if(worker.includes('mosmixProbability(')||worker.includes('sunshineDuration:mosmixSunshineSeconds'))failures.push('MOSMIX darf keine Niederschlags-, Wahrscheinlichkeits- oder Sonnenscheinfelder in den Postprocessing-Pfad tragen.');
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,33,0];let atLeast=true;for(let i=0;i<minimum.length;i++){if((parts[i]??0)>minimum[i])break;if((parts[i]??0)<minimum[i]){atLeast=false;break}}
if(!atLeast)failures.push(`Version liegt vor 0.8.33.0: ${pkg.version}`);if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != ${pkg.version}`);if(!baseline.requiredRegressionTests?.includes('scripts/test-mosmix-adaptive-fusion-08330.mjs'))failures.push('Baseline enthält MOSMIX-Fusionstest nicht.');
if(failures.length){console.error('MID MOSMIX-/Modellbündel-Fusion fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MOSMIX ist ausschließlich als qualitätsgesicherte Temperatur-/Wind-Nachkorrektur eingebunden; Niederschlag und Himmelszustand bleiben im kohärenten Modellbündel.');
