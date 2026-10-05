import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,app,tone,styleSource,styleAggregate,colorContract,sourceOfTruth,pkgRaw,baselineRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/App.tsx'),read('src/temperatureTone.ts'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('MID_PARAMETER_COLOR_CONTRACT.md'),read('MID_SOURCE_OF_TRUTH.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-seven-day-ecmwf-hourly-09781.mjs';
// MID-C15 deliberately restores the OPTIONAL palette. Check behavior, not only
// the presence of legacy gradient stops that CSS can override.
const loadTs=async source=>import('data:text/javascript;base64,'+Buffer.from((await transform(source,{loader:'ts',format:'esm'})).code).toString('base64'));
const tones=await loadTs(tone);
for(const value of [-15,0,10,25,40])for(const kind of ['min','max']){
 assert.equal(tones.parameterTemperatureTone(value,kind,false).color,kind==='min'?'var(--param-temperature-min)':'var(--param-temperature-max)');
 assert.deepEqual(tones.parameterTemperatureTone(value,kind,true),tones.ecmwfTemperatureTone(value));
}
const storedSource=app.match(/^function storedForecastDisplaySettings.*$/m)?.[0];
assert.ok(storedSource,'Persisted forecast settings parser exists.');
const parser=(await transform(storedSource,{loader:'ts'})).code;
const readStored=new Function('readForecastDisplaySettingsRaw','DEFAULT_FORECAST_DISPLAY_SETTINGS','normalizeConfidenceDisplayMode',parser+';return storedForecastDisplaySettings()');
for(const value of [undefined,false,true,'true',1]){
 const restored=readStored(()=>JSON.stringify({ecmwfTemperatureColors:value}),{ecmwfTemperatureColors:false},()=> 'signal');
 assert.equal(restored.ecmwfTemperatureColors,value===true,'Only the explicit saved boolean enables ECMWF.');
}
assert.ok(app.includes('checked={forecastDisplaySettings.ecmwfTemperatureColors}'),'The saved option is user-selectable.');
assert.ok(cockpit.includes('ecmwfTemperatureColors?temperaturePoints.map'),'Curve uses actual hourly values when the palette is enabled.');
assert.ok(cockpit.includes('id={`seven-day-temperature-gradient-${curveId}`}'),'Multiple app/widget instances cannot share gradient IDs.');
const lineSource=await read('src/parameterLineStyle.ts'),lines=await loadTs(lineSource);
for(const role of ['temperature','apparent','dewpoint','pressure','probability','wind','gust']){
 const spec=lines.parameterLineStyle(role);
 assert.equal(spec.strokeLinecap,'round');assert.equal(spec.strokeLinejoin,'round');assert.ok(spec.strokeWidth>0);
 for(const source of [app,cockpit])assert.ok(source.includes(`style={parameterLineStyle('${role}')}`),`${role} must use the common rendered line contract in both consumers.`);
}
for(const token of ['ECMWF_TEMPERATURE_STOPS','export function ecmwfTemperatureColor','export function ecmwfTemperatureTone'])assert.ok(tone.includes(token),`ECMWF-Temperaturskala fehlt: ${token}`);
for(const token of [
 'hourly=(presentationReady?hours:precipitationPresentationHours(hours)).filter(hour=>visibleDateIndex.has(hour.time.slice(0,10)))',
 'hourPosition=(hour:Hour)',
 'amount:Math.max(parts.total,direct,components)',
 'halfDayTicks=Array.from({length:visible.length*2+1}',
 "{hour%24===12?'12':'00'}",
 'seven-day-temperature-quantiles',
 'stopColor="var(--param-temperature)"',
 'ecmwfTemperatureColors=false',
 "minTone=parameterTemperatureTone(day.min,'min'),maxTone=parameterTemperatureTone(day.max,'max')",
 'Tmin blau · Tmax rot',
 'nightBands=(()=>{',
 'seven-day-curve-night-band'
])assert.ok(cockpit.includes(token),`7-Tage-Kurvenkonzept unvollständig: ${token}`);
assert.ok(!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('dailyTemperatureAnomalyLabel(minTone.anomaly)'),'7-Tage-Cockpit darf keine Tmin-Klimaabweichung mehr anzeigen.');
assert.ok(!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('dailyTemperatureAnomalyLabel(maxTone.anomaly)'),'7-Tage-Cockpit darf keine Tmax-Klimaabweichung mehr anzeigen.');
const forecastRows=app.slice(app.indexOf('const forecastRowContents='),app.indexOf(' useEffect(()=>',app.indexOf('const forecastRowContents=')));
assert.ok(forecastRows.includes("minTone=parameterTemperatureTone(d.min,'min',ecmwfTemperatureColors),maxTone=parameterTemperatureTone(d.max,'max',ecmwfTemperatureColors)"),'Klassische 7-Tage-Karten müssen ECMWF-Farbton verwenden.');
assert.ok(!forecastRows.includes('<small>Min</small>')&&!forecastRows.includes('<small>Max</small>'),'Klassische 7-Tage-Karten zeigen seit v0.9.78.4 nur noch die Tmin/Tmax-Werte ohne zusätzliche Min/Max-Labels.');
assert.ok(!forecastRows.includes('dailyTemperatureAnomalyLabel'),'Klassische 7-Tage-Karten dürfen keine Klimadelta-Beschriftung anzeigen.');
for(const token of ['.cockpit-day-wind small.calm','.seven-day-curve-time-label','.seven-day-curve-day-label','.seven-day-curve-night-band{',':root[data-theme=light] .cockpit-meteogram-pro,:root[data-theme=light] .seven-day-curve-overview{','min-height:0!important']){assert.ok(styleSource.includes(token),`7-Tage-Stylequelle fehlt: ${token}`);assert.ok(styleAggregate.includes(token),`7-Tage-Styleaggregat fehlt: ${token}`)}
for(const token of ['ersetzt für die 7-Tage-Ansicht','keine Abweichungen zum Klimamittel','absoluten 2-m-Temperatur','gemeinsame Stundenachse'])assert.ok(colorContract.includes(token),`Farbvertrag unvollständig: ${token}`);
assert.ok(sourceOfTruth.includes('7-Tage-Stundenkurve')&&sourceOfTruth.includes('Die 14-Tage-Klimaabweichungslogik bleibt bestehen.'),'Source of Truth muss die 7d-Supersession und den 14d-Erhalt festschreiben.');
assert.equal(pkg.scripts?.['test:seven-day-ecmwf-hourly'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'7-Tage-ECMWF-Stundenkurve fehlt in Baseline.');
assert.ok(!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('<small>Min</small>')&&!cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('\nfunction ensembleSeries(')).includes('<small>Max</small>'),'7-Tage-Cockpit zeigt keine zusätzlichen Min/Max-Labels.');
const curve=cockpit.slice(cockpit.indexOf('function SevenDayCurveOverview('),cockpit.indexOf('\nfunction cockpitDaySkyBarSegments('));
assert.ok(!curve.includes('seven-day-curve-temperature-band')&&curve.includes('row.epoch===hour.epoch')&&curve.includes('quantilePaths.map')&&curve.includes('P25–P75'),'7-Tage-Kurve verwendet nur echte zeitgleiche stündliche P25–P75-Quantile, keine erfundenen Tagesbänder.');
console.log(`MID v${pkg.version}: 7-Tage-Kurve mit Stundenachse, themefester Nachtmarkierung, Wetterstreifen, stündlichem Niederschlag und lesbaren ECMWF-Farben geschützt.`);

