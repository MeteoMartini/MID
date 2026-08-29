import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [app,modules,panel,overlay,modelledAreas,data,styles,workerSource,worker,router,buildScript,pkgText,baselineText,implementation]=await Promise.all([
 read('src/App.tsx'),read('src/dashboardModules.ts'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/extremeOutlookModelledAreas.ts'),read('src/extremeWeatherOutlook.ts'),read('src/styles.css'),read('worker-src/25-dach-extreme-outlook.js'),read('worker/metar-proxy.js'),read('worker-src/40-aviation-router.js'),read('scripts/build-maintenance-aggregates.mjs'),read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.66.0.md')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-dach-extreme-outlook-09660.mjs';

const versionParts=String(pkg.version).split('.').map(Number);
assert.ok(versionParts[0]>0||versionParts[1]>9||versionParts[2]>66||versionParts[2]===66&&(versionParts[3]??0)>=0,`Release ${pkg.version} liegt vor dem DACH-Ausblick 0.9.66.0.`);
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:dach-extreme-outlook'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test));
assert.ok(baseline.regressionTests?.includes(test));

assert.ok(modules.includes("|'extreme-outlook'"));
assert.ok(modules.includes("{id:'extreme-outlook',label:'Extremwetter-Ausblick'"));
assert.ok(modules.indexOf("id:'warnings'")<modules.indexOf("id:'extreme-outlook'")&&modules.indexOf("id:'extreme-outlook'")<modules.indexOf("id:'short-term'"),'Mitteleuropa-Ausblick muss direkt nach Warnungen und vor Kurzfrist liegen.');
assert.ok(app.includes("lazy(()=>import('./ExtremeWeatherOutlookPanel'))"));
assert.ok(app.includes("case'extreme-outlook'"));
assert.ok(app.includes('id="extreme-outlook"'));
assert.ok(app.includes('className="extreme-outlook-gate"'));
assert.ok(app.includes('<ViewportGate'));
assert.ok(app.includes('unit={unit}'));
assert.ok(app.includes('timezone={displayTimezone}'));

for(const token of ["'overall'","'thunderstorm'","'rain'","'wind'","'snow'","'ice'",'overviewMin:number','hazardMin:number','extremeExceptionMin:number','timeoutMs:48000','staleIfErrorMs:6*60*60*1000'])assert.ok(data.includes(token),`Client-Datenvertrag fehlt: ${token}`);
for(const token of ['formatDwdWindValue','formatDisplayDateTime','displayTimeLabel','aria-pressed','role="img"','MapFitBounds','GeoJsonLayers','MID Extremwetter-Ausblick · Mitteleuropa','Eigene MID-Prognose','keine amtliche Warnung','Schwellen, Parameter und Methodik','signalMetricSummary(signal,unit)'])assert.ok(panel.includes(token),`Oberflächenvertrag fehlt: ${token}`);
for(const token of ['HtmlMarker','areas.map(area=>','Modellierte Gefahrenfläche'])assert.ok(overlay.includes(token),`Flächengebundener Kartenmarker fehlt: ${token}`);
for(const token of ['buildExtremeOutlookContourSet','displayContours','overlapsStronger'])assert.ok(modelledAreas.includes(token),`Flächengebundene Konturauswahl fehlt: ${token}`);
for(const token of ['.extreme-main-grid{','.extreme-map{','.extreme-map-legend{','.extreme-region-list{','.extreme-threshold-table','@media(max-width:480px)'])assert.ok(styles.includes(token),`Responsive Mitteleuropa-CSS fehlt: ${token}`);

for(const token of [
 "models','dwd_icon_d2_eps_ensemble_mean'","models','dwd_icon_d2'",'ensembleMembers:20',"id:'0-6'","id:'6-12'","id:'12-24'","id:'24-48'",'overviewMin:40','hazardMin:10','extremeExceptionMin:5',
 "values:{1:15,6:20,24:40}","values:{1:60,6:90,24:140}",'levels:[70,90,110,140]','levels:[90,110,140,170]',"values:{6:5,24:10}","values:{6:30,24:50}","value:.1","value:.5","value:2,durationHours:3","value:5",'hailCm:[1,2,5,10]',
 'cape,cape_spread','convective_inhibition','temperature_500hPa','temperature_850hPa','relative_humidity_700hPa','wind_speed_850hPa','wind_direction_850hPa','wind_speed_500hPa','wind_direction_500hPa','lightning_potential','updraft','freezing_level_height','wet_bulb_temperature_2m',
 'dachExtremeShear','dachExtremeRolling','dachExtremeBelow','CAPE is evaluated only together with CIN','officialWarning:false','stale:true'
])assert.ok(workerSource.includes(token),`Worker-Fachvertrag fehlt: ${token}`);
assert.ok(router.includes("mode==='dach-extreme-outlook'"));
assert.ok(router.includes("'dach-extreme-outlook'"));
assert.ok(worker.includes("async function dachExtremeOutlookData(profile='full',env={})"));
assert.ok(worker.includes("mode==='dach-extreme-outlook'"));
assert.ok(buildScript.includes("'worker-src/25-dach-extreme-outlook.js'"));
assert.ok(buildScript.includes("'src/styles-src/25-extreme-outlook.css'"));

assert.ok(implementation.includes('keine Einzelparameter-Auslöser'));
assert.ok(implementation.includes('Wind wird ausschließlich über den zentralen MID-Formatter'));
assert.ok(implementation.includes('Lokal-/Z-Zeit-Einstellung'));
assert.ok(!panel.includes("signalMetricSummary(signal,'kmh')"),'Karten-Popups dürfen die appweite Windeinheit nicht umgehen.');
assert.ok(!panel.includes('amtliche Warnfläche'),'Eigene Prognose und amtliche Warnungen müssen getrennt bleiben.');

console.log('Mitteleuropa-Extremwetter-Ausblick geprüft: Dashboard, MapLibre-UI, Zeit-/Einheitenvertrag, P-/I-Schwellen, EPS-Worker, Mehrparameter-Gewitterdiagnostik, Cache und Dokumentation sind vollständig verdrahtet.');
