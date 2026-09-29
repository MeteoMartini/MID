import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [css,design,app,cockpit,pkgRaw,baselineRaw,contract]=await Promise.all([
 read('src/midDesign.css'),
 read('src/MidDesign.tsx'),
 read('src/App.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('package.json'),
 read('MID_BASELINE.json'),
 read('MID_DARK_NIGHT_BANDS_0.9.85.125.md')
]);

assert.ok(css.includes('--mid-night-band-opacity:.2'),'Light-Design muss bei 0,20 Nachtband-Deckkraft bleiben.');
assert.ok(css.includes("[data-theme='dark']")&&css.includes('--mid-night-band-opacity:.32'),'Dark-Design muss eine deutlichere, aber weiterhin dezente Nachtband-Deckkraft von 0,32 besitzen.');

for(const source of [design,app,cockpit]){
 assert.ok(source.includes('var(--mid-night-band-opacity,.2)'), 'Gemeinsame Night-Band-Variable muss in allen zentralen Skybar-/Profilpfaden verwendet werden.');
}
assert.ok(!design.includes('stopOpacity=".2"'),'MidWeatherThread darf Nachtband-Deckkraft nicht mehr hart codieren.');
assert.ok(!app.includes('stopOpacity=".2"'),'Aktuell-Skybar darf Nachtband-Deckkraft nicht mehr hart codieren.');
assert.ok(cockpit.includes("const nightBandOpacity='var(--mid-night-band-opacity,.2)'"),'ForecastCockpit muss denselben Theme-Vertrag für Now90 und 24-h-Profil verwenden.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,'0.9.85.125');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
 assert.ok((baseline[key]||[]).includes('scripts/test-mid-18-2-24-dark-night-band-0985116.mjs'),`scripts/test-mid-18-2-24-dark-night-band-0985116.mjs fehlt in ${key}`);
}
for(const file of ['scripts/test-mid-18-2-24-dark-night-band-0985116.mjs','MID_DARK_NIGHT_BANDS_0.9.85.125.md']){
 assert.ok((baseline.requiredFiles||[]).includes(file),`${file} fehlt in requiredFiles`);
}
assert.ok(contract.includes('Dark-Design')&&contract.includes('0,32'),'Designvertrag muss die Theme-spezifische Nachtkennzeichnung dokumentieren.');

console.log('MID v0.9.85.125: deutlichere Nachtstundenkennzeichnung im Dark-Design geschützt.');
