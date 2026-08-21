import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [cockpit,sourceStyles,builtStyles,pkgText,baselineText,implementation]=await Promise.all([
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('MID_IMPLEMENTATION_0.9.64.1.md',root),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-seven-day-inline-detail-sunshine-09641.mjs';

for(const token of [
 'visible.map((day,index)=>',
 '<Fragment key={day.date}><button',
 "style={{'--cockpit-day-column':index+1} as CSSProperties}",
 '</button>{isExpanded?<section className="cockpit-day-hourly-accordion"',
 'Math.max(0,Math.round(Number(day.sunshineDuration)/3600))',
 'className="cockpit-day-sun"',
 'Sonnenscheindauer ${sunshineHours} h'
])assert.ok(cockpit.includes(token),`Direktes Tagesdetail oder Sonnenstunden fehlen: ${token}`);

const marker='/* MID v0.9.64.1 · Tagesdetail folgt dem gewählten Tag; Sonnenscheindauer nutzt den vorhandenen Metadatenplatz. */';
for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const section=styles.slice(styles.lastIndexOf(marker));
 assert.ok(section.startsWith(marker),`${name}: v0.9.64.1-Vertrag fehlt oder wird überschrieben.`);
 for(const token of [
  '.cockpit-seven-grid>.cockpit-day{',
  'grid-column:var(--cockpit-day-column)',
  'grid-row:1',
  '.cockpit-seven-grid>.cockpit-day-hourly-accordion{',
  'grid-column:1/-1',
  'grid-row:2',
  '.cockpit-day-pop{',
  'display:flex',
  '.cockpit-day-sun{'
 ])assert.ok(section.includes(token),`${name}: Raster- oder Sonnenstundenvertrag unvollständig: ${token}`);
 const portrait=section.slice(section.indexOf('@media (orientation:portrait) and (max-width:900px)'));
 for(const token of [
  '.cockpit-seven-grid>.cockpit-day{',
  'grid-column:1!important',
  'grid-row:auto!important',
  '.cockpit-seven-grid>.cockpit-day-hourly-accordion{',
  'flex-direction:column'
 ])assert.ok(portrait.includes(token),`${name}: direktes Hochformat-Akkordeon unvollständig: ${token}`);
 assert.ok(!section.includes('min-height:'),`${name}: v0.9.64.1 darf die Kartenhöhe nicht vergrößern.`);
}

assert.equal(pkg.version,'0.9.64.1','Direktes Tagesdetail benötigt Wartungsrelease v0.9.64.1.');
assert.equal(pkg.scripts?.['test:seven-day-inline-detail-sunshine'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Verbindliche Baseline-Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regressionskatalog enthält den neuen Vertrag nicht.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.64.1.md'),'Implementierungsvertrag ist nicht als Pflichtdatei geschützt.');
for(const token of ['unmittelbar','darunter','Zuklappen','☀ x h','volle Stunden','Worker'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);

console.log(`${pkg.version}: Tagesdetail folgt dem gewählten Tag; Sonnenstunden bleiben gerundet und platzneutral.`);
