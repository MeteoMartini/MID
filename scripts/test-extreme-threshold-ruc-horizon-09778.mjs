import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [extreme,builder,core,panel,areas,contract]=await Promise.all([
 read('worker-src/25-dach-extreme-outlook.js'),
 read('tools/ruc/build_ruc_bundle.py'),
 read('worker-src/00-core-observations.js'),
 read('src/ExtremeWeatherOutlookPanel.tsx'),
 read('src/extremeOutlookModelledAreas.ts'),
 read('MID_DWD_RUC_PIPELINE_CONTRACT.md')
]);

// I1-I4 threshold contract for every hazard family.
for(const token of [
 "rain:{unit:'mm',windows:[1,6,24],levels:[{intensity:1,values:{1:15,6:20,24:40}},{intensity:2,values:{1:25,6:35,24:60}},{intensity:3,values:{1:40,6:60,24:90}},{intensity:4,values:{1:60,6:90,24:140}}]}",
 "levels:[70,90,110,140]",
 "levels:[80,100,125,155]",
 "levels:[90,110,140,170]",
 "snow:{unit:'cm',windows:[6,24]",
 "{intensity:4,values:{6:30,24:50}}",
 "ice:{unit:'mm glaze equivalent',levels:[{intensity:1,value:.1},{intensity:2,value:.5},{intensity:3,value:2,durationHours:3},{intensity:4,value:5}]}",
 "capeJkg:[400,800,1500,2500]",
 "lapseRateKkm:[5.5,6,6.5,7]",
 "shearMs:[5,10,15,22]"
])assert.ok(extreme.includes(token),`I1-I4 threshold contract missing: ${token}`);

// P-class boundaries are exact and remain separate from I intensity.
assert.ok(extreme.includes("function dachExtremeProbabilityBand(probability){return probability>=80?'P4':probability>=60?'P3':probability>=30?'P2':probability>=10?'P1':'P0'}"),'P0-P4 boundary mapping changed unexpectedly.');
assert.ok(panel.includes('P1–P4 bezeichnet die Wahrscheinlichkeit, dass die jeweils dargestellte I-Stufe erreicht oder überschritten wird.'),'UI must explain that P and I describe different dimensions.');

// Period windows must never borrow precipitation/snow from the previous outlook period.
assert.ok(extreme.includes('const first=endIndex-windowHours+1;if(first<start)continue;'),'Rolling hazard windows must remain inside the selected outlook period.');

// A subthreshold deterministic RUC value may not manufacture a high I probability.
assert.ok(extreme.includes('if(!Number.isFinite(value)||!Number.isFinite(threshold)||value<threshold)return 0;'),'RUC support must be zero below the actual I threshold.');
assert.ok(!extreme.includes('Math.max(0,18*ratio)'),'Legacy subthreshold pseudo-probability must stay removed.');
assert.ok(extreme.includes('coverage>=5.9?dachExtremeRucSupportProbability(total,level.values[6]):0'),'6-h RUC thresholds require almost complete six-hour coverage.');
assert.ok(extreme.includes('dachExtremeRucSupportProbability(max1,level.values[1])'),'Rain RUC support must evaluate the real 1-h threshold.');

// Full RUC model run: native rapid +0–6, hourly core +6–12 and +12–14; nothing after +14.
for(const token of ["('0-6',0,6)","('6-12',6,12)","('12-14',12,14)","'schema':'mid.dwd.ruc.rapid-extreme.v3'","'horizonHours':14"])assert.ok(builder.includes(token),`RUC v3 period contract missing: ${token}`);
assert.ok(core.includes("'mid.dwd.ruc.rapid-extreme.v3'"),'Worker reader must accept rapid-extreme v3.');
assert.ok(extreme.includes('dachExtremeRucPeriodForOutlook'),'Extreme outlook must select RUC support by temporal overlap.');
assert.ok(extreme.includes("ICON-D2-RUC 0–14 h (Rapid 0–6 h)")&&extreme.includes('model:modelLabel'),'Visible model lineage must expose RUC coverage only when RUC data are actually present.');
assert.ok(contract.includes('Im UI-Zeitraum +12–24 h darf RUC deshalb ausschließlich die reale Teilabdeckung +12–14 h stützen'),'Contract must forbid pretending RUC covers all of +12–24 h.');
assert.ok(contract.includes('+24–48 h bleibt vollständig beim ICON-D2-/EPS-Pfad'),'RUC must not leak into +24–48 h.');

// UI must compare the displayed model metric with the exact I-level threshold.
for(const token of ['I${signal.intensity}','Intensitätsschwelle','Modellsignal Akkumulation','thresholdMetricsForContour','thresholdProbability'])assert.ok(panel.includes(token)||areas.includes(token),`Threshold-vs-model UI integrity missing: ${token}`);
assert.ok(areas.includes('metrics:thresholdMetricsForContour(data,representative.metric.signal,contour.intensity,contour.probability)'),'Contour intensity rewrites must also rewrite threshold evidence.');

console.log('Extreme-weather I/P threshold and full-run RUC horizon regression passed.');
