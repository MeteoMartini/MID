import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,app,tone,styleSource,styleAggregate,colorContract,sourceOfTruth,pkgRaw,baselineRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/App.tsx'),read('src/temperatureTone.ts'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('MID_PARAMETER_COLOR_CONTRACT.md'),read('MID_SOURCE_OF_TRUTH.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-seven-day-ecmwf-hourly-09781.mjs';
for(const token of ['ECMWF_TEMPERATURE_STOPS','export function ecmwfTemperatureColor','export function ecmwfTemperatureTone'])assert.ok(tone.includes(token),`ECMWF-Temperaturskala fehlt: ${token}`);
for(const token of [
 'hourly=hours.filter(hour=>visibleDateIndex.has(hour.time.slice(0,10)))',
 'hourPosition=(hour:Hour)',
 'rainItems=hourly.map(hour=>({hour,amount:precipitationParts(hour).total}))',
 'halfDayTicks=Array.from({length:visible.length*2+1}',
 "{hour%24===12?'12':'00'}",
 'seven-day-curve-temperature-halo',
 'stopColor={ecmwfTemperatureColor(point.value)}',
 'minTone=ecmwfTemperatureTone(day.min),maxTone=ecmwfTemperatureTone(day.max)',
 'Temperaturfarben: ECMWF-Skala',
 'nightBands=(()=>{',
 'seven-day-curve-night-band'
])assert.ok(cockpit.includes(token),`7-Tage-Kurvenkonzept unvollständig: ${token}`);
assert.ok(!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('dailyTemperatureAnomalyLabel(minTone.anomaly)'),'7-Tage-Cockpit darf keine Tmin-Klimaabweichung mehr anzeigen.');
assert.ok(!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('dailyTemperatureAnomalyLabel(maxTone.anomaly)'),'7-Tage-Cockpit darf keine Tmax-Klimaabweichung mehr anzeigen.');
const forecastRows=app.slice(app.indexOf('const forecastRowContents='),app.indexOf(' useEffect(()=>',app.indexOf('const forecastRowContents=')));
assert.ok(forecastRows.includes('minTone=ecmwfTemperatureTone(d.min),maxTone=ecmwfTemperatureTone(d.max)'),'Klassische 7-Tage-Karten müssen ECMWF-Farbton verwenden.');
assert.ok(!forecastRows.includes('<small>Min</small>')&&!forecastRows.includes('<small>Max</small>'),'Klassische 7-Tage-Karten zeigen seit v0.9.78.4 nur noch die Tmin/Tmax-Werte ohne zusätzliche Min/Max-Labels.');
assert.ok(!forecastRows.includes('dailyTemperatureAnomalyLabel'),'Klassische 7-Tage-Karten dürfen keine Klimadelta-Beschriftung anzeigen.');
for(const token of ['.seven-day-curve-temperature-halo','.seven-day-curve-time-label','.seven-day-curve-day-label','.seven-day-curve-night-band{',':root[data-theme=light] .seven-day-curve-night-band{','min-height:194px']){assert.ok(styleSource.includes(token),`7-Tage-Stylequelle fehlt: ${token}`);assert.ok(styleAggregate.includes(token),`7-Tage-Styleaggregat fehlt: ${token}`)}
for(const token of ['ersetzt für die 7-Tage-Ansicht','keine Abweichungen zum Klimamittel','absoluten 2-m-Temperatur','gemeinsame Stundenachse'])assert.ok(colorContract.includes(token),`Farbvertrag unvollständig: ${token}`);
assert.ok(sourceOfTruth.includes('7-Tage-Stundenkurve')&&sourceOfTruth.includes('Die 14-Tage-Klimaabweichungslogik bleibt bestehen.'),'Source of Truth muss die 7d-Supersession und den 14d-Erhalt festschreiben.');
assert.equal(pkg.scripts?.['test:seven-day-ecmwf-hourly'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'7-Tage-ECMWF-Stundenkurve fehlt in Baseline.');
assert.ok(!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('<small>Min</small>')&&!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('<small>Max</small>'),'7-Tage-Cockpit zeigt keine zusätzlichen Min/Max-Labels.');
const curve=cockpit.slice(cockpit.indexOf('function SevenDayCurveOverview('),cockpit.indexOf('\nfunction cockpitDaySkyBarSegments('));
assert.ok(!curve.includes('seven-day-curve-temperature-band')&&!curve.includes('P25–P75'),'7-Tage-Kurve darf kein P25–P75-Band mehr enthalten.');
console.log(`MID v${pkg.version}: 7-Tage-Kurve mit Stundenachse, themefester Nachtmarkierung, Wetterstreifen, stündlichem Niederschlag und lesbaren ECMWF-Farben geschützt.`);
