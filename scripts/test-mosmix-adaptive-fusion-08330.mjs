import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const fusion=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "const BRIGHTSKY_WEATHER='https://api.brightsky.dev/weather'",
 'async function fetchMosmixForecast',
 "family:'mosmix-postprocessing'",
 'distanceKm<=55',
 'elevationDifferenceM<=450',
 'quality>=.42',
 "horizon<=10?.24:0",
 'confidence>=52',
 'MOSMIX zählt wegen gemeinsamer ICON-/IFS-Basis nicht als zusätzliche unabhängige Modellfamilie',
 'modelDays',
 'version:3',
 "'dwd-mosmix-postprocessing'"
])need('Worker-MOSMIX',worker,token);
for(const token of [
 'modelDays?:ForecastFusionDay[]',
 'applyForecastFusionModelDays',
 'fusion?.mosmix?.applied',
 'leadHours<=6?.18',
 'leadHours>240',
 'precipStrength=(leadHours<=6?.06',
 "MID Mehrquellen${fusion.mosmix?.applied?' + MOSMIX':''}"
])need('Frontend-Fusion',fusion,token);
for(const token of [
 'fusionVerificationCandidates',
 "id:'mid_priority_fusion_model'",
 "label:'MID Prioritätsfusion ohne MOSMIX'",
 'applyForecastFusionHours(hours,days,fusedDays,forecastFusion)',
 'days={displayDays}',
 'hours={displayHours}',
 'forecastSourceLabel={!twinForecastActive&&forecastFusion?.active?forecastFusionLabel(forecastFusion):undefined}'
])need('App-Integration',app,token);
need('Kurzfrist-Badge',shortTerm,'<em>{sourceLabel}</em>');
if(worker.includes("families=new Set([...nonAnchor.map(row=>row.family),'mosmix-postprocessing'])"))failures.push('MOSMIX darf nicht als unabhängige Modellfamilie gezählt werden.');
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,33,0];let atLeast=true;for(let i=0;i<minimum.length;i++){if((parts[i]??0)>minimum[i])break;if((parts[i]??0)<minimum[i]){atLeast=false;break}}
if(!atLeast)failures.push(`Version liegt vor 0.8.33.0: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != ${pkg.version}`);
if(!baseline.requiredRegressionTests?.includes('scripts/test-mosmix-adaptive-fusion-08330.mjs'))failures.push('Baseline enthält MOSMIX-Fusionstest nicht.');
if(failures.length){console.error('MID MOSMIX-/Kurzfrist-/14-Tage-Fusion fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MOSMIX ist als qualitätsgesicherte Punkt-Nachkorrektur in Kurzfrist, 7-Tage und 14-Tage integriert und separat verifizierbar.');
