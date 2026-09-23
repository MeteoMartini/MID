import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,sourceStyles,builtStyles,rowStyles,pkgText,baselineText,implementation]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('src/midC18ForecastRows.css'),read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.78.9.md')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-fourteen-day-orientation-layout-09642.mjs';

for(const token of [
 'data-cockpit-horizontal-scroll="false"',
 'className={`cockpit-fourteen-card mid-forecast-row regime-${item.regime}',
 'data-regime={item.regimeText}',
 '<WeatherPictogram code={item.weatherCode}',
 'cockpit-fourteen-skybar',
 'cockpit-fourteen-compact-meta',
 '<CockpitConsistencyPill',
 'mid-forecast-row-detail compact'
])assert.ok(cockpit.includes(token),`14-Tage-Datenintegration unvollständig: ${token}`);
const fourteen=cockpit.slice(cockpit.indexOf('function FourteenDayHorizon'),cockpit.indexOf('function MiniRibbon'));
assert.equal((fourteen.match(/data-mid-skybar="fourteen-row"/g)||[]).length,1,'Aktueller 14-Tage-Vertrag muss genau eine Skybar je Tageszeile verwenden.');
assert.ok(!fourteen.includes('cockpit-fourteen-detail-skybar'),'Aktueller 14-Tage-Vertrag darf keine zweite Detail-Skybar enthalten.');

const desktopMarker='/* MID v0.9.78.9 · Desktop-Lock: lesbare 14-Tage-Karten statt Tablet-Mikrolayout. */';
for(const token of [
 '.cockpit-fourteen-card.mid-forecast-row',
 '.cockpit-fourteen-skybar',
 '.cockpit-fourteen-temp-track',
 '.cockpit-focus-card.fourteen.mid-forecast-row-detail',
 'grid-auto-flow:row!important',
 '@media(max-width:1100px)',
 '@media(max-width:720px)'
])assert.ok(rowStyles.includes(token),`E-14-Tage-Zeilenvertrag fehlt: ${token}`);
assert.ok(!rowStyles.includes('grid-auto-flow:column!important'),'E darf das alte horizontale Kartenkarussell nicht fortschreiben.');

for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const tabletStart=styles.indexOf('@media (orientation:landscape) and (max-width:1024px)');
 assert.ok(tabletStart>=0,`${name}: 7×2-Tablet-Querformat bis 1024 px fehlt.`);
 const tablet=styles.slice(tabletStart,styles.indexOf('}',tabletStart)+15000);
 assert.ok(tablet.includes('grid-template-columns:repeat(7,minmax(0,1fr))!important'),`${name}: 7×2-Tablet-Layout fehlt.`);
 const desktopStart=styles.lastIndexOf(desktopMarker);
 assert.ok(desktopStart>=0,`${name}: v0.9.78.9-Desktop-Lock fehlt.`);
 const desktop=styles.slice(desktopStart);
 for(const token of [
  '@media (min-width:1025px)',
  'grid-template-columns:repeat(14,minmax(224px,224px))!important',
  'grid-auto-columns:224px',
  'overflow-x:auto!important',
  'scroll-snap-type:x proximity',
  'width:224px!important',
  'min-width:224px!important',
  'min-height:270px',
  'grid-template-areas:"header" "temperature" "precipitation" "sunshine" "wind"!important',
  'grid-template-areas:"heading consistency" "regime regime" "temps temps"!important',
  'font-size:9.5px!important',
  'height:8px!important'
 ])assert.ok(desktop.includes(token),`${name}: Desktop-Kartenvertrag fehlt: ${token}`);
 assert.ok(!desktop.includes('font-size:clamp(4.'),`${name}: Desktop darf keine 4–6-px-Tablet-Mikroschrift verwenden.`);
}

assert.equal(pkg.scripts?.['test:fourteen-day-orientation-layout'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Verbindliche Baseline-Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regressionskatalog enthält den Vertrag nicht.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.78.9.md'),'Aktueller Desktop-/Icon-Umsetzungsnachweis ist nicht geschützt.');
for(const token of ['Weather Icon System 2.0','224 px','1024','horizontal','Desktop','visueller Form-Lock'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);

console.log(`${pkg.version}: historischer 14-Tage-Layoutvertrag erhalten; Arbeitspaket E übersteuert ihn mit responsiven Prognosezeilen.`);
