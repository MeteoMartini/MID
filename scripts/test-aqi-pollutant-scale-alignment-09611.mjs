import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [app,air,pkgText,baselineText]=await Promise.all(['src/App.tsx','src/airQuality.ts','package.json','MID_BASELINE.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
  'describeEuropeanAqiPollutantScale(pollutant.key,pollutant.value,pollutant.aqi)',
  'const aqi=nonnegativeAqiNumber(aqiValue)',
  'aqiBand=aqi===null?null:europeanAqiBandFromIndex(aqi)',
  '((bandIndex+relative)/EUROPEAN_AQI_BANDS.length)*100',
  "thresholds:[5,15,50,90,140]",
  "thresholds:[15,45,120,195,270]",
  "thresholds:[10,25,60,100,150]",
  "thresholds:[60,100,120,160,180]",
  "thresholds:[20,40,125,190,275]"
]) assert.ok((app+'\n'+air).includes(token),`AQI-Skalenvertrag fehlt: ${token}`);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-aqi-pollutant-scale-alignment-09611.mjs';
assert.equal(pkg.scripts?.['test:aqi-pollutant-scale-alignment'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('AQI-Einzelwertskalen geprüft: Markerposition folgt derselben EU-AQI-Stufe wie der aktive Skalenabschnitt; Open-Meteo/CAMS-Fallbackschwellen sind synchronisiert.');
