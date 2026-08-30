import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [fusion,cockpit,app,contract,styleSource,baselineText,pkgText]=await Promise.all([
 readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_24H_PROFILE_STORY_AXIS_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);

for(const token of [
 'completeCoverage&&Number.isFinite(hourlyMax)?hourlyMax',
 'completeCoverage&&Number.isFinite(hourlyMin)?hourlyMin',
 'reconcileForecastDaysWithHours(baseDisplayDays,displayHours)',
 'days={displayDays}',
 'hours={displayHours}'
])assert.ok(fusion.includes(token)||app.includes(token),`Kanonischer Tmax/Tmin-Vertrag fehlt: ${token}`);

for(const token of [
 'const profileTemperatureSource=profileHourlyPoints.filter',
 'const temperatureCurvePoints=profileTemperatureSource.map',
 "const visibleTemperatureExtreme=(dateValue:string,kind:'max'|'min')=>",
 'const temperatureExtremes=chartDayBands.flatMap',
 'const actualPath=buildShortTermChartPath(temperatureCurvePoints.map',
 "label:`T${kind} ${Math.round(target)}°`",
 'Math.abs(item.point.temperature-target)>.11',
 'className={`temperature-extreme ${extreme.kind}`',
 '<circle cx={extreme.item.x} cy={extreme.item.tempY}',
 '<text x={extreme.item.x}'
])assert.ok(cockpit.includes(token),`24-h-Tmax/Tmin-Kurvenmarkierung fehlt: ${token}`);

for(const token of ['Tmax','Tmin','displayHours','displayDays','3-h-Anzeigemodus'])assert.ok(contract.includes(token),`24-h-Vertrag dokumentiert Temperatur-Extrema nicht vollständig: ${token}`);
for(const token of ['.cockpit-weather-profile .temperature-extreme circle{','.cockpit-weather-profile .temperature-extreme.max{color:','.cockpit-weather-profile .temperature-extreme.min{color:'])assert.ok(styleSource.includes(token),`Tmax/Tmin-Stil fehlt: ${token}`);

const baseline=JSON.parse(baselineText),version=JSON.parse(pkgText).version,test='scripts/test-temperature-canonical-extrema-09751.mjs';
assert.equal(baseline.releaseVersion,version,'Baseline- und Paketversion müssen übereinstimmen.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),`${test} fehlt in requiredFiles.`);
console.log(`MID v${version}: appweit kanonische Tmax/Tmin und sichtbare 24-h-Kurvenmarken in 1-h/3-h geschützt.`);
