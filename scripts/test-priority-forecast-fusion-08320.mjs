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
 "if(mode==='forecast-fusion')return forecastFusionResponse(u);",
 "'adaptive-priority-forecast-fusion'",
 "id:'icon_d2'",
 "id:'ecmwf_ifs'",
 "id:'ecmwf_aifs'",
 "id:'gfs'",
 "tier:1",
 "tier:2",
 "tier:3",
 "tier:4",
 'families>=3&&confidence>=48',
 'capFusionFamilyWeights',
 'weightedMedian',
 'safeFusionValue(anchor.max',
 "schema:'mid.forecast-fusion.v1'"
])need('Worker-Fusion',worker,token);
for(const token of [
 'const FRESH_MS=35*60*1000',
 'applyForecastFusionDays',
 'applyForecastFusionHours',
 'applyOperationalNowcastHours',
 'applyConvectiveNowcastHours',
 "source==='model'"
])need('Frontend-Fusion',fusion,token);
for(const token of [
 'requestIdleCallback',
 'isInputPending',
 'loadForecastFusion(',
 'twinForecastActive?localTwinDays:fusedDays',
 'applyOperationalNowcastHours',
 'applyConvectiveNowcastHours',
 "id:'mid_priority_fusion'",
 'MID Mehrquellen-Prognose · qualitätsgewichtet'
])need('App-Integration',app,token);
need('Verifikation',verification,'additional:AdditionalForecastPrediction[]=[]');
if(!app.includes("label:'MID Prioritätsfusion'")&&!app.includes("'MID Prioritätsfusion + MOSMIX':'MID Prioritätsfusion'"))failures.push('App-Integration: MID Prioritätsfusion-Label fehlt.');
need('Modelllaufinfo',weather,"id:'ecmwf_aifs025_single'");
const setWeather=app.indexOf('setW(fw);'),fusionEffect=app.indexOf('loadForecastFusion(');
if(setWeather<0||fusionEffect<0||fusionEffect<setWeather)failures.push('Mehrquellen-Fusion darf die erste Best-Match-Darstellung nicht blockieren.');
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,32,0];
let atLeast=true;for(let i=0;i<minimum.length;i++){if((parts[i]??0)>minimum[i])break;if((parts[i]??0)<minimum[i]){atLeast=false;break}}
if(!atLeast)failures.push(`Version liegt vor 0.8.32.0: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != ${pkg.version}`);
if(!baseline.requiredRegressionTests?.includes('scripts/test-priority-forecast-fusion-08320.mjs'))failures.push('Baseline enthält neuen Fusionstest nicht.');
if(failures.length){console.error('MID Prioritätsfusion fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID Prioritäten 1–4 sind als nicht blockierende, robuste und verifizierbare Mehrquellen-Fusion integriert.');
