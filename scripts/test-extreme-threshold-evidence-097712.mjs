import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const worker=fs.readFileSync('worker-src/25-dach-extreme-outlook.js','utf8');
const direct=fs.readFileSync('src/extremeWeatherOutlookDirect.generated.js','utf8');
const areas=fs.readFileSync('src/extremeOutlookModelledAreas.ts','utf8');
const panel=fs.readFileSync('src/ExtremeWeatherOutlookPanel.tsx','utf8');

for(const [label,source] of [['worker',worker],['direct',direct]]){
  assert.ok(source.includes('function dachExtremeBestWindowEvidence(candidates,threshold,window)'),`${label}: probability-driving window helper missing`);
  assert.ok(source.includes("...dachExtremeEvidenceMetrics('rain',levelEvidence)"),`${label}: rain I1-I4 evidence missing`);
  assert.ok(source.includes("...dachExtremeEvidenceMetrics('snow',levelEvidence)"),`${label}: snow I1-I4 evidence missing`);
  assert.ok(source.includes("...dachExtremeEvidenceMetrics('wind',levelEvidence)"),`${label}: wind I1-I4 evidence missing`);
  assert.ok(source.includes("rainSpreadMm:Number((evidence?.spread||0).toFixed(1))"),`${label}: rain spread evidence missing`);
  assert.ok(source.includes("snowSpreadCm:Number((evidence?.spread||0).toFixed(1))"),`${label}: snow spread evidence missing`);
  assert.ok(source.includes("gustSpreadKmh:Number((evidence?.spread||0).toFixed(0))"),`${label}: wind spread evidence missing`);
  assert.ok(!source.includes('metricCandidates=[]'),`${label}: obsolete highest-mean evidence selector still present`);
  assert.ok(source.includes("rucEvidence=[null,null,null,null]"),`${label}: RUC level evidence missing`);
  assert.ok(source.includes("if(evidence&&number(rapid[index])>number(base[index]))"),`${label}: RUC may not overwrite evidence unless it drives the selected I-level`);
  assert.ok(source.includes("metrics.evidenceSource='ICON-D2-RUC'"),`${label}: RUC evidence source missing`);
  assert.ok(source.includes("rain:{unit:'mm',windows:[1,6,24],levels:[{intensity:1,values:{1:15,6:20,24:40}},{intensity:2,values:{1:25,6:35,24:60}},{intensity:3,values:{1:40,6:60,24:90}},{intensity:4,values:{1:60,6:90,24:140}}]}"),`${label}: rain I1-I4 threshold contract changed unexpectedly`);
}

assert.ok(areas.includes('metrics[`rain${levelKey}WindowHours`]'),'Contour rain threshold must use evidence of the contour intensity.');
assert.ok(areas.includes('metrics[`snow${levelKey}WindowHours`]'),'Contour snow threshold must use evidence of the contour intensity.');
assert.ok(areas.includes('metrics[`wind${levelKey}Mean`]'),'Contour wind signal must use evidence of the contour intensity.');
assert.ok(panel.includes("function evidenceSourceLabel"),'UI evidence-source label missing.');
assert.ok(panel.includes('EPS-Streuung Akkumulation'),'Rain EPS spread must be visible in detail.');
assert.ok(panel.includes('Überschreitungswahrscheinlichkeit'),'I/P relationship must be explicit in detail.');
assert.ok(panel.includes("`${signal.probability} % (${signal.probabilityBand}) für ≥ I${signal.intensity}`"),'Probability must explicitly refer to the displayed I-level.');


// Runtime regression for the screenshot class: the I-level probability may be driven by a
// different accumulation window than the largest mean. The displayed threshold and mean
// must use the probability-driving window, not the numerically largest accumulation.
let runtime=fs.readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,fetch:async()=>new Response('{}',{status:200})});
vm.runInContext(runtime,context,{timeout:5000,filename:'worker/metar-proxy.js'});
context.__ensemble={hourly:{precipitation:[14,3,0,0,0,0],precipitation_spread:[5,0,0,0,0,0]}};
context.__rain=vm.runInContext("dachExtremeAttachThresholdEvidence(dachExtremeRain(__ensemble,0,6,1900),'rain')",context,{timeout:1000});
assert.equal(context.__rain.signal.intensity,1,'Synthetic rain case must resolve to I1.');
assert.equal(context.__rain.signal.metrics.windowHours,1,'Displayed rain window must be the probability-driving 1-h window.');
assert.equal(context.__rain.signal.metrics.thresholdWindowHours,1,'Threshold window must match the evidence window.');
assert.equal(context.__rain.signal.metrics.thresholdMm,15,'I1 threshold must match the selected 1-h window.');
assert.equal(context.__rain.signal.metrics.rainMm,14,'Displayed EPS mean must come from the same evidence window.');
assert.equal(context.__rain.signal.metrics.rainSpreadMm,5,'Displayed EPS spread must come from the same evidence window.');

console.log('Extreme-weather threshold/evidence consistency regression passed.');
