import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,modern,styles,pkgRaw,lockRaw,baselineRaw,gitignore,packer,implementation]=await Promise.all([
 read('src/App.tsx'),read('src/styles-src/30-modern.css'),read('src/styles.css'),read('package.json'),read('package-lock.json'),
 read('MID_BASELINE.json'),read('.gitignore'),read('tools/release/create_professional_zip.py'),read('MID_IMPLEMENTATION_0.9.78.28.md')
]);
const pkg=JSON.parse(pkgRaw),lock=JSON.parse(lockRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-maintenance-cleanup-097828.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.78.28'));
assert.equal(baseline.releaseVersion,pkg.version);

const schedulerStart=app.indexOf('const location={latitude:w.latitude,longitude:w.longitude,elevation:w.elevation,timezone:w.timezone}');
const schedulerEnd=app.indexOf('const c=w.current',schedulerStart);
assert.ok(schedulerStart>=0&&schedulerEnd>schedulerStart,'Leichter Sonnenfenster-Scheduler fehlt.');
const scheduler=app.slice(schedulerStart,schedulerEnd);
assert.ok(scheduler.includes('solarDaylightWindowAt(Date.now(),location)'),'Scheduler nutzt nicht das gecachte Sonnenfenster.');
assert.ok(!scheduler.includes('astronomySummary('),'Scheduler berechnet weiterhin jede Minute die vollständige Astronomie.');
assert.ok(app.includes('astronomy=useMemo(()=>astronomySummary(w,new Date(solarNow))'),'Astronomie-Tagesdetail ist nicht memoisiert.');
assert.ok(app.includes('astronomyHour=Math.floor(solarNow/3600000)'),'Stündliche Aktualität des Astronomie-Tagesdetails fehlt.');

const touchToken='.cockpit-weather-profile__resolution button,';
assert.ok(modern.includes(touchToken)&&styles.includes(touchToken),'Zeitauflösungs-Schalter fehlen im Grobzeiger-Touchvertrag.');

for(const name of await readdir(new URL('../',import.meta.url)))assert.ok(!name.endsWith('.tsbuildinfo'),`Veraltetes TypeScript-Buildartefakt verblieben: ${name}`);
assert.match(gitignore,/^\*\.tsbuildinfo$/m,'TypeScript-Buildartefakte sind nicht ignoriert.');
assert.match(packer,/"\.tsbuildinfo"/,'Professional-Packer schließt TypeScript-Buildartefakte nicht aus.');
assert.match(gitignore,/^artifacts\/$/m,'Generierte Prüfartefakte sind nicht ignoriert.');
assert.match(packer,/"artifacts"/,'Professional-Packer schließt generierte Prüfartefakte nicht aus.');

assert.equal(pkg.dependencies?.['maplibre-gl'],'6.7.0');
assert.equal(lock.packages?.['node_modules/maplibre-gl']?.version,'6.7.0');
for(const name of ['@capacitor/core','@capacitor/ios'])assert.equal(pkg.dependencies?.[name],'8.5.1');
assert.equal(pkg.devDependencies?.['@capacitor/cli'],'8.5.1');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const token of ['33 exakt redundante CSS-Regeln','MapLibre GL JS 6.7.0','Capacitor 8.5.1','Branch-Schutz','keine fachliche Workeränderung'])assert.ok(implementation.includes(token),`Implementierungsnachweis fehlt: ${token}`);
console.log(`MID v${pkg.version}: Wartungsbereinigung, Astronomie-CPU-Pfad, iPhone-Touchziele und kompatible Plattform-/Kartenpatches geprüft.`);
