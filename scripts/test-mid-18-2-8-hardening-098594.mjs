import fs from 'node:fs';

const read=path=>fs.readFileSync(path,'utf8');
const cadence=read('tools/ruc/native_cadence.py');
const fetcher=read('tools/ruc/fetch_and_build_ruc.py');
const builder=read('tools/ruc/build_ruc_bundle.py');
const fusion=read('src/forecastFusion.ts');
const detail=read('src/detailThunderRisk.ts');
const app=read('src/App.tsx');
const short=read('src/ShortTermForecast.tsx');
const cockpit=read('src/ForecastCockpit.tsx');
const pictogram=read('src/WeatherPictogram.tsx');
const broker=read('src/refreshBroker.ts');
const worker=read('src/workerClient.ts');

const checks=[
 ['RUC T_2M hourly',cadence.includes('"T_2M": 3600')],
 ['RUC CLCT hourly',cadence.includes('"CLCT": 3600')],
 ['RUC VIS 15 min',cadence.includes('"VIS": 900')],
 ['RUC CEILING 15 min',cadence.includes('"CEILING": 900')],
 ['RUC CAPE_ML 15 min',cadence.includes('"CAPE_ML": 900')],
 ['RUC CAPE_MU hourly',cadence.includes('"CAPE_MU": 3600')],
 ['CAPE_MU not rapid 15 fetch',!/RAPID_OPTIONAL_15=.*CAPE_MU/.test(fetcher)],
 ['CIN_MU not rapid 15 fetch',!/RAPID_OPTIONAL_15=.*CIN_MU/.test(fetcher)],
 ['CAPE_MU not severe 15 pack',!/SEVERE_PARAM_MAP=.*CAPE_MU/.test(builder)],
 ['Rapid thunder exposes signal score',fusion.includes('signalScore:percent')],
 ['Detail thunder names score semantics',detail.includes('not a calibrated event probability')],
 ['Current thunder UI uses Signal /100',app.includes('Signal ${thunderSignalScore}/100')],
 ['Mountain thunder UI uses signal wording',app.includes('<small>Gewittersignal · 6 h</small>')],
 ['Hourly tooltip no thunder pseudo-probability',!app.includes('Gewitterrisiko {Math.round(currentThunderRisk.percent)} %')],
 ['Short-term thunder UI no pseudo-probability',short.includes('Signal {Math.round(Number(point.thunderPercent))}/100')],
 ['Cockpit thunder UI uses signal score',cockpit.includes('Signal ${score}/100')],
 ['Dry pictogram reconciles cloud cover',pictogram.includes('dryCloudProfileKind')],
 ['Shared refresh broker present',broker.includes('subscribeRefreshChannel')&&broker.includes("window.addEventListener('focus',onFocus)")],
 ['App uses shared refresh broker',app.includes("from './refreshBroker'")&&app.includes('subscribeRefreshChannel({key:')],
 ['Worker request coalescing present',worker.includes('workerInflightRequests')&&worker.includes('fetchWorkerJsonUncoalesced')],
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++}
if(failed)process.exit(1);
console.log(`MID 18.2.8 Hardening: ${checks.length}/${checks.length} Verträge erfüllt.`);
