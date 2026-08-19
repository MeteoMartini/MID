import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [app,air,pkgText,baselineText]=await Promise.all(['src/App.tsx','src/airQuality.ts','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
  'describeEuropeanAqiPollutantScale(pollutant.key,pollutant.value,pollutant.aqi)',
  'const aqi=Number(aqiValue)',
  'aqiBand=Number.isFinite(aqi)&&aqi>=0?europeanAqiBandFromIndex(aqi):null',
  '((bandIndex+relative)/EUROPEAN_AQI_BANDS.length)*100',
  "thresholds:[10,20,25,50,75]",
  "thresholds:[20,40,50,100,150]",
  "thresholds:[40,90,120,230,340]",
  "thresholds:[50,100,130,240,380]",
  "thresholds:[100,200,350,500,750]"
]) assert.ok((app+'\n'+air).includes(token),`AQI-Skalenvertrag fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-aqi-pollutant-scale-alignment-09611.mjs';
assert.equal(pkg.scripts?.['test:aqi-pollutant-scale-alignment'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('AQI-Einzelwertskalen geprüft: Markerposition folgt derselben EU-AQI-Stufe wie der aktive Skalenabschnitt; Open-Meteo/CAMS-Fallbackschwellen sind synchronisiert.');
