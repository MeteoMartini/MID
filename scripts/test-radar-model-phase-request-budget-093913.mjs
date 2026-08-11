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
need('Worker-Budget',worker,"requestBudget:{locations:coordinates.length,batches:Math.ceil(coordinates.length/batchSize),variables:fields.split(',').length}");
need('Worker-Sequenz',worker,'for(let start=0;start<coordinates.length;start+=batchSize)');
if(/Promise\.all\(batches\.map\(batch=>fetchBatch/.test(worker))throw new Error('Phasenbatches werden wieder parallel abgefeuert.');
need('Worker-Rate-Limit',worker,'precipitationPhaseRateLimited');
need('Worker-Stale',worker,'precipitationPhaseStale');
need('Worker-Cache',worker,'cacheTtl:900');
need('Client-Stale',data,'lastWeatherPhaseGrid');
need('Overlay-Retry',overlay,'automatischer neuer Versuch in etwa 60 s');
if(worker.includes("const rows=35,cols=49")&&worker.indexOf('const rows=35,cols=49')>worker.indexOf('async function precipitationPhaseGridData'))throw new Error('Altes 1715-Punkte-Phasenraster ist noch aktiv.');
console.log('Niederschlagsart-Requestbudget geschützt: maximal 247 Phasenpunkte, sequenziell, Cache/Stale-Fallback und Retry.');
