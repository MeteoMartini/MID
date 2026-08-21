import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [cockpit,styles,pkgText,baselineText]=await Promise.all([
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-seven-day-landscape-density-09632.mjs';

for(const token of [
 'className="cockpit-day-date"',
 'className="cockpit-day-weather-pair"',
 'className={`cockpit-day-regime ${regime}`}',
 'className="cockpit-day-temps"',
 'className="cockpit-day-temp-track"',
 'className="cockpit-day-rain"',
 'className={`cockpit-day-wind warning-${warning}`}',
 'className="cockpit-day-pop"',
 'className="cockpit-day-hourly-cue"'
])assert.ok(cockpit.includes(token),`7-Tage-Karte verliert Information: ${token}`);

const marker='/* MID v0.9.63.1 · sieben vollstaendige Tageskarten im Tablet-Querformat ohne Informationsverlust */';
const section=styles.slice(styles.lastIndexOf(marker));
assert.ok(section.startsWith(marker),'Landscape-Dichtevertrag fehlt oder wird von spaeteren Regeln ueberschrieben.');
for(const token of [
 '@media (orientation:landscape) and (min-width:840px) and (max-width:1300px)',
 'grid-template-columns:repeat(var(--cockpit-day-count),minmax(0,1fr))',
 'overflow-x:visible',
 'min-width:0!important',
 'grid-template-columns:minmax(0,1fr) auto',
 '.cockpit-day-rain b{',
 'white-space:normal!important',
 '.cockpit-day-wind small{',
 'overflow-wrap:break-word',
 '.cockpit-day-hourly-cue{',
 'grid-template-columns:auto minmax(0,1fr) auto'
])assert.ok(section.includes(token),`Landscape-Dichtevertrag unvollstaendig: ${token}`);

assert.equal(pkg.scripts?.['test:seven-day-landscape-density'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Verbindliche Baseline-Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regressionskatalog enthaelt den Nutzervertrag nicht.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');

console.log(`${pkg.version}: sieben vollstaendige 7-Tage-Karten im Tablet-Querformat ohne gekappte Informationen geschuetzt.`);
