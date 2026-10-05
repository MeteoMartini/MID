import {readPresentationEntrySources} from './lib/presentationEntrySources.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [styles,main,pkgRaw,baselineRaw]=await Promise.all([
 read('src/midC18MapAndSevenDayAlignment.css'),
 readPresentationEntrySources(),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const patch=Number(String(pkg.version).split('.').at(-1));
assert.ok(Number.isFinite(patch)&&patch>=112,'Map-/7-Tage-Alignment muss ab MID v0.9.85.112 erhalten bleiben.');

assert.ok(main.includes("import './midC18MapAndSevenDayAlignment.css';"),'Der neue responsive Alignment-Layer muss geladen werden.');
for(const token of [
 '--mid-map-control-top',
 '--mid-map-control-right',
 'width:44px!important',
 'height:44px!important',
 '.composite-locate-button',
 '.composite-focus-layer-trigger',
 'grid-template-columns:repeat(7,minmax(0,1fr))!important',
 'padding-left:calc(6% + 13.2px)!important',
 'padding-right:calc(1.4285714% + 14.5714px)!important',
 'grid-column:1/-1!important'
])assert.ok(styles.includes(token),`Responsive Alignment-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('@media (max-width:850px), (pointer:coarse)'),'Touch-/Mobilvertrag für Kartensteuerung fehlt.');
assert.ok(styles.includes('@media(min-width:1101px) and (orientation:landscape)'),'Desktopvertrag für 7-Tage-Zeilen fehlt.');

for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
 assert.ok((baseline[key]||[]).includes('scripts/test-mid-18-2-20-map-seven-day-alignment-0985112.mjs'),`scripts/test-mid-18-2-20-map-seven-day-alignment-0985112.mjs fehlt in ${key}`);
}
for(const file of ['scripts/test-mid-18-2-20-map-seven-day-alignment-0985112.mjs','src/midC18MapAndSevenDayAlignment.css','MID_MAP_SEVEN_DAY_ALIGNMENT_0.9.85.112.md']){
 assert.ok((baseline.requiredFiles||[]).includes(file),`${file} fehlt in requiredFiles`);
}

console.log(`${pkg.version}: mobile Kartensteuerung und Desktop-7-Tage-Ausrichtung geschützt.`);
