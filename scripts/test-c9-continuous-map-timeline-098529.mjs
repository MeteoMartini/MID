import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const source=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');

for(const token of [
 "forecasts:modelForecastTimes",
 "modelAtSelectedTime=selectedFrame?.phase==='forecast'",
 "visibleModelLines=modelLines==='off'&&modelAtSelectedTime?'both':modelLines",
 "phaseLabel=selectedFrame?.phase==='nowcast'?'Nowcast':selectedFrame?.phase==='forecast'?'Modell · Synoptik':'Beobachtung'",
 "visibleModelLines!=='off'&&usesNativeModelLines",
 "visibleModelLines!=='off'&&(dominantModelFrame||vectorIsoheightFrame||hasGridCenters)"
])assert.ok(source.includes(token),`MID-C9-Zeitkettenregel fehlt: ${token}`);

assert.ok(!source.includes("forecasts:modelLines==='off'?[]:modelForecastTimes"),'Modelltermine dürfen nicht von einer freiwilligen Live-Linienauswahl abhängen.');
console.log('MID-C9: bestätigte Modelltermine ergänzen die Kartenzeitachse und werden klar als Synoptik gekennzeichnet.');
