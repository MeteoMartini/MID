import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [pkgRaw,forecastRows,mapFirst,modern,main]=await Promise.all([
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('src/midC18ForecastRows.css',root),'utf8'),
 readFile(new URL('src/midC18MapFirstWorkspace.css',root),'utf8'),
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/main.tsx',root),'utf8')
]);
const pkg=JSON.parse(pkgRaw);

assert.equal(pkg.version,'0.9.85.112','Desktop-/Map-Control-Fix gehört zu MID v0.9.85.112.');

assert.match(forecastRows,/\.cockpit-seven-grid,[\s\S]*grid-template-columns:minmax\(0,1fr\)!important;[\s\S]*grid-auto-flow:row!important;/,'7-Tage-ForecastRows müssen als vertikale Liste definiert bleiben.');
assert.match(modern,/\.cockpit-seven-grid>\.cockpit-day\{[\s\S]*grid-column:var\(--cockpit-day-column\);/,'Legacy-Spaltenzuweisung muss als bekannte Ausgangsregel weiterhin erkannt werden.');
assert.match(forecastRows,/\.cockpit-seven-grid>\.cockpit-day\.mid-forecast-row\{[\s\S]*grid-column:1!important;[\s\S]*grid-row:auto!important;/,'Desktop-Tageszeilen setzen die alte explizite 1…7-Spaltenzuweisung nicht zurück.');
assert.match(forecastRows,/\.cockpit-day-hourly-accordion\.mid-forecast-row-detail\{[\s\S]*grid-column:1!important;[\s\S]*grid-row:auto!important;/,'Inline-Tagesdetail muss im normalen Listenfluss direkt unter der gewählten Zeile bleiben.');
assert.ok(forecastRows.includes('overflow:visible!important')&&forecastRows.includes('scroll-snap-type:none!important'),'ForecastRows dürfen auf Desktop nicht wieder zum horizontalen Kartenkarussell werden.');

for(const token of [
 ".composite-focus-mode .maplibregl-ctrl-top-right{",
 "top:12px!important;",
 "right:max(12px,env(safe-area-inset-right))!important;",
 ".composite-focus-mode .maplibregl-ctrl-top-right>.maplibregl-ctrl{",
 "margin:0!important;",
 ".composite-focus-mode .maplibregl-ctrl-group button{",
 "width:44px!important;",
 "height:44px!important;",
 ".composite-focus-mode .composite-locate-button{",
 "top:110px!important;",
 ".composite-focus-mode .composite-focus-layer-control{",
 "top:164px!important;",
 ".composite-focus-mode .composite-focus-layer-trigger{",
 "min-width:44px!important;",
 "min-height:44px!important;"
]) assert.ok(mapFirst.includes(token),`Karten-Controlvertrag fehlt: ${token}`);

assert.ok(main.indexOf("import './midC18ForecastRows.css';")>main.indexOf("import './styles.css';"),'Forecast-Row-Fix muss nach der Basis-CSS geladen werden.');
assert.ok(main.indexOf("import './midC18MapFirstWorkspace.css';")>main.indexOf("import './midC18ForecastRows.css';"),'Map-Control-Fix muss im Map-first-Layer nach dem Forecast-Row-Layer liegen.');

console.log('MID v0.9.85.112: Kartencontrols ausgerichtet und Desktop-7-Tage-Rowfluss gegen implizite Zusatzspalten geschützt.');
