import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [cockpit,sourceStyles,builtStyles,pkgText,baselineText,implementation]=await Promise.all([
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('MID_IMPLEMENTATION_0.9.64.0.md',root),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-seven-day-orientation-layout-09640.mjs';

for(const token of [
 'cockpit-day-weekday-short',
 'cockpit-day-weekday-long',
 'className="cockpit-day-rain-icon"',
 'className="cockpit-day-wind-sustained"',
 'className={`cockpit-day-regime ${regime}`}',
 "regime==='warm'?'Heiß':'Ruhig'",
 'precipitationCompactMeta',
 'compactGustLabel(day.gust,unit)',
 'cockpit-day-hourly-cue'
])assert.ok(cockpit.includes(token),`Orientierungsdarstellung verliert Inhalt oder Klassifizierung: ${token}`);

const marker='/* MID v0.9.64.0 · 7-Tage-Cockpit folgt der Geräteausrichtung: Zeilen im Hochformat, sieben Spalten im Querformat. */';
for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const section=styles.slice(styles.lastIndexOf(marker));
 assert.ok(section.startsWith(marker),`${name}: v0.9.64.0-Orientierungsvertrag fehlt oder wird überschrieben.`);
 const portrait=section.slice(section.indexOf('@media (orientation:portrait) and (max-width:900px)'),section.indexOf('@media (orientation:landscape) and (max-width:1300px)'));
 const landscape=section.slice(section.indexOf('@media (orientation:landscape) and (max-width:1300px)'));
 for(const token of [
  'grid-template-columns:minmax(0,1fr)',
  '"date icon regime temps"',
  '"date icon track track"',
  '"rain pop wind hourly"!important',
  '.cockpit-day-weekday-long{display:inline}',
  'overflow-x:visible',
  '.cockpit-day-wind-sustained{grid-area:sustained'
 ])assert.ok(portrait.includes(token),`${name}: Hochformat-Zeilenvertrag unvollständig: ${token}`);
 for(const token of [
  'grid-template-columns:repeat(var(--cockpit-day-count),minmax(0,1fr))',
  '"date icon"',
  '"regime regime"',
  '"rain rain"',
  '"wind wind"',
  '"hourly hourly"!important',
  'overflow-x:visible',
  '.cockpit-day-weekday-short{display:inline}',
  '.cockpit-day-wind-sustained{grid-area:sustained'
 ])assert.ok(landscape.includes(token),`${name}: Querformat-Spaltenvertrag unvollständig: ${token}`);
 for(const token of ['.cockpit-day-regime.wet{','showery{','sunny{','windy{','warm{','quiet{'])assert.ok(section.includes(token),`${name}: farbige Regimeklasse fehlt: ${token}`);
}

assert.match(pkg.version,/^0\.9\.64\.\d+$/,'Responsive Orientierungsdarstellung benötigt einen Release der Linie v0.9.64.x.');
assert.equal(pkg.scripts?.['test:seven-day-orientation-layout'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Verbindliche Baseline-Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regressionskatalog enthält den Orientierungsvertrag nicht.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.64.0.md'),'Implementierungsvertrag ist nicht als Pflichtdatei geschützt.');
for(const token of ['Hochformat','Querformat','Heiß','Ruhig','Worker'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);

console.log(`${pkg.version}: vollständige Hochformat-Zeilen, sieben Querformat-Spalten und farbige Wetterregime geschützt.`);
