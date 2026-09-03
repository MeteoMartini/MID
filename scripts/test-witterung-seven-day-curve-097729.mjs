import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [trend,cockpit,styleSource,styleAggregate,longRange,seasonal,audit,pkgRaw,baselineRaw]=await Promise.all([
 read('src/SubseasonalTrendPanel.tsx'),read('src/ForecastCockpit.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),
 read('src/LongRangePanel.tsx'),read('src/seasonalForecast.ts'),read('MID_LONG_RANGE_SOURCE_EXPANSION_0.9.77.29.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-witterung-seven-day-curve-097729.mjs';

assert.ok(trend.includes('const TREND_SOURCE_TIMEOUT_MS=12000')&&trend.includes('const TREND_CLIMATE_TIMEOUT_MS=4500'),'Witterungs-Quellbudgets fehlen.');
assert.ok(trend.includes('withBoundedAbort(signal,TREND_SOURCE_TIMEOUT_MS')&&trend.includes('withBoundedAbort(signal,TREND_CLIMATE_TIMEOUT_MS'),'Witterungsquellen/Klimatologie müssen separat begrenzt sein.');
assert.ok(trend.includes('const CACHE_MAX_AGE_MS=36*60*60*1000'),'Witterung braucht 36-h-Stale-Fallback.');
assert.ok(trend.includes('Klimatologie lädt im Hintergrund weiter.')&&trend.includes('.catch(()=>[])'),'Fehlende/frische Klimatologie darf Modellwerte nicht blockieren.');

assert.ok(cockpit.includes('function smoothCurvePath(')&&cockpit.includes('function SevenDayCurveOverview('),'Neue 7-Tage-Kurvenübersicht fehlt.');
assert.ok(cockpit.includes('<SevenDayCurveOverview days={visible}')&&cockpit.indexOf('<SevenDayCurveOverview days={visible}')<cockpit.indexOf('<div className="cockpit-seven-grid"'),'Kurvenübersicht muss oberhalb der kompakten Tageskarten liegen.');
for(const token of ['seven-day-temperature-gradient','ecmwfTemperatureTone(day.min','ecmwfTemperatureTone(day.max','WeatherPictogram','rainItems=hourly.map','halfDayTicks=Array.from','nightBands=(()=>{','seven-day-curve-night-band','segmentRx=Math.min(999,segment.strokeWidth/2,segmentWidth/2)','verbundener Wetterstreifen'])assert.ok(cockpit.includes(token),`Kurvenübersicht unvollständig: ${token}`);
const curve=cockpit.slice(cockpit.indexOf('function SevenDayCurveOverview('),cockpit.indexOf('\nfunction cockpitDaySkyBarSegments('));
assert.ok(!curve.includes('seven-day-curve-temperature-band')&&!curve.includes('P25–P75')&&!curve.includes('interpolateTemperatureBand(')&&!curve.includes('smoothBandPath('),'P25–P75 muss aus der 7-Tage-Kurvenübersicht ersatzlos entfernt sein.');
for(const token of ['.seven-day-curve-overview','.seven-day-curve-days','.seven-day-curve-temperature-line','.seven-day-curve-rainbar','.seven-day-curve-night-band{',':root[data-theme=light] .seven-day-curve-night-band{','@media(max-width:390px)']){
 assert.ok(styleSource.includes(token),`Responsive Designquelle fehlt: ${token}`);assert.ok(styleAggregate.includes(token),`Style-Aggregat fehlt: ${token}`);
}

assert.ok(longRange.includes('keine EPS-Mitglieder zwingend')&&longRange.includes('Einzellauf / deterministisch')&&longRange.includes('DWD Subseasonal EPISODES'),'Nicht-EPS-/DWD-Langfristvertrag fehlt in der UI-Methodik.');
assert.ok(seasonal.includes('Ensemblemitglieder sind dafür nicht zwingend')&&seasonal.includes('regionaler Downscaling-/Qualitätsanker'),'Nicht-EPS-/DWD-Langfristvertrag fehlt im Datenvertrag.');
for(const token of ['kein EPS','DWD Subseasonal EPISODES','keine zweite EC46-Stimme','DWD GCFS2.2 = unabhängige saisonale DWD-Linie','WMO Lead Centre','APCC'])assert.ok(audit.includes(token),`Langfrist-Quellenaudit unvollständig: ${token}`);

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:witterung-seven-day-curve'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Neue Regression muss in beiden Baseline-Testlisten stehen.');
assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-climate-delta-badges-097728.mjs')&&baseline.regressionTests?.includes('scripts/test-climate-delta-badges-097728.mjs'),'v0.9.77.28 Klimadelta-Regression darf nicht aus dem Pflichtvertrag fehlen.');
console.log(`MID v${pkg.version}: Witterung-Timeout-Fallback, Nicht-EPS-Langfristvertrag und verfeinerte 7-Tage-Kurvenübersicht geschützt.`);
