import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [cockpit,panel,travel,contract,pkgText,baselineText]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/TravelPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/travelPlanner.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_24H_PROFILE_STORY_AXIS_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

for(const token of [
 "if(row.id==='best_match')return'modellabhängig'",
 "return row.metadataUnavailable||row.fusionLoaded===true?'von Quelle nicht ausgewiesen':'nicht verfügbar'",
 '`Init ${cockpitInitialisationLabel(row)} · Quelle bereit ${cockpitAvailabilityLabel(row,timezone)}`'
])assert.ok(cockpit.includes(token),`Modellstand-Initvertrag fehlt: ${token}`);
assert.ok(!cockpit.includes("Init ${formatCockpitModelRunTime(row.initialisationTime)} · Quelle bereit ${formatCockpitAvailabilityTime(row.availabilityTime,timezone)}"),'Modellstand darf fehlende Init-Zeiten nicht mehr als Gedankenstrich ausgeben.');

for(const token of [
 "const visibleTemperatureExtreme=(kind:'max'|'min')=>",
 "temperatureExtremes=[visibleTemperatureExtreme('max'),visibleTemperatureExtreme('min')]",
 "label:`${Math.round(item.point.temperature)}°`",
 "Maximum':'Minimum'} im 24-Stunden-Fenster"
])assert.ok(cockpit.includes(token),`24-h-Extremvertrag fehlt: ${token}`);
assert.ok(!cockpit.includes("label:`T${kind}"),'Tmax/Tmin-Präfix darf nicht mehr direkt an der Kurve stehen.');
for(const token of ['rollenden 24-h-Fensters','ausschließlich der gerundete Wert','3-h-Anzeigemodus'])assert.ok(contract.includes(token),`24-h-Vertrag unvollständig: ${token}`);

for(const token of [
 "snowDepthRequired=mode==='flexible'&&(preference==='snow'||Number.isFinite(constraints.minSnowDepthCm))",
 "preference==='snow'&&!dataset.snowDepthIncluded",
 'Schneehöhe ist das Optimierungskriterium',
 'Kumulierter Schneefall wird separat zusätzlich ausgewiesen',
 "labelText={analysis.snowDepthIncluded?'Schneelage':'Schneefall'}",
 'Schneefall Σ ${number(active.summary.snowfallTotal)} cm'
])assert.ok(panel.includes(token),`Reisewetter-Schneelagevertrag fehlt: ${token}`);
assert.ok(travel.includes("case'snow':{const snowDepth=Number(summary.snowDepthMean);return Number.isFinite(snowDepth)?snowDepth*5+(summary.snowCoverDaysExpected??0)*2:-1e9;}"),'Schneeoptimierung muss Schneehöhe/Schneedeckendauer statt kumuliertem Schneefall bewerten.');
assert.ok(travel.includes('im Reisezeitraum fallen klimatologisch zusätzlich rund ${Math.round(summary.snowfallTotal)} cm Schnee'),'Kumulierter Schneefall muss als Zusatzinformation erhalten bleiben.');

const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-model-init-window-extrema-travel-snow-09765.mjs';
assert.equal(baseline.releaseVersion,pkg.version,'Baseline- und Paketversion müssen übereinstimmen.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),`${test} fehlt in requiredFiles.`);
console.log(`MID v${pkg.version}: Modell-Init, 24-h-Min/Max ohne Präfix und schneehöhenbasierte Reiseoptimierung geschützt.`);
