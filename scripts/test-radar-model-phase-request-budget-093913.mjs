import {readFile} from 'node:fs/promises';
const [worker,overlay,data,baseline]=await Promise.all([
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse)
]);
const need=(label,text,token)=>{if(!text.includes(token))throw new Error(`${label}: ${token} fehlt.`)};
if(!baseline.requiredRegressionTests?.includes('scripts/test-radar-model-phase-request-budget-093913.mjs'))throw new Error('Request-Budget-Test fehlt im Baseline-Vertrag.');
need('Worker-Raster',worker,'const rows=13,cols=19');
need('Worker-Budget',worker,'requestBudget:{locations:count,batches,variables:8,modelPointRequests}');
need('Worker-Gesamtbudget',worker,'const phaseWallDeadlineMs=Date.now()+24000');
need('Worker-zeitgebundenes Teilbudget',worker,'const perRequestMs=Math.min(18000,Math.max(0,phaseWallDeadlineMs-Date.now()-750))');
need('Worker-48-/28-Aufrufgrenze',worker,'batches>=48||modelBatches>=28');
need('Gemeinsames Phasen-Fetch-Budget',worker,'MID_PHASE_EXTERNAL_SUBREQUEST_CAP=46');
need('Native Pages Fetch-Reserve',worker,'MID_PHASE_RUC_SUBREQUEST_CAP=30');
need('Native Lookup Reserve',worker,'MID_PHASE_LOOKUP_SUBREQUEST_CAP=14');
need('Pro-Invocation Budget',worker,'const phaseFetchBudget=midPhaseRequestBudget(phaseWallDeadlineMs)');
need('Native Pages Propagation',worker,'dwdRucStaticPhaseGrid(lats,lons,roundedMs,env,phaseFetchBudget)');
need('ICON Metadata Propagation',worker,'phaseModelMetadata(model,phaseWallDeadlineMs,phaseFetchBudget)');
need('Live Budget Zähler',worker,'phaseFetchBudget:{limit:phaseFetchBudget.limit');
need('Keine verborgenen Redirects',worker,"redirect:'manual'");

need('Worker-per-cell-400-Isolation',worker,'const left=await requestValid(indices.slice(0,half))');
need('Worker-NoData',worker,'fehlende Zellen bleiben NoData');
need('Worker-Sequenz',worker,'for(let offset=0;offset<remaining.length;offset+=120)');
if(/Promise\.all\(batches\.map\(batch=>fetchBatch/.test(worker))throw new Error('Phasenbatches werden wieder parallel abgefeuert.');
need('Worker-Rate-Limit',worker,'precipitationPhaseRateLimited');
need('Worker-Stale',worker,'precipitationPhaseStale');
need('Worker-Cache',worker,'cacheTtl:900');
need('Client-Stale',data,'lastWeatherPhaseGrid');
need('Overlay-Retry',overlay,'automatischer neuer Versuch in etwa 60 s');
if(worker.includes("const rows=35,cols=49")&&worker.indexOf('const rows=35,cols=49')>worker.indexOf('async function precipitationPhaseGridData'))throw new Error('Altes 1715-Punkte-Phasenraster ist noch aktiv.');
console.log('Niederschlagsart-Requestbudget geschützt: maximal 247 Phasenpunkte, sequenziell, Cache/Stale-Fallback und Retry.');
