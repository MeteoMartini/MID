import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [pkg,baseline,intervals,shortTerm,cockpit,water,app]=await Promise.all([
 readFile(new URL('package.json',root),'utf8').then(JSON.parse),
 readFile(new URL('MID_BASELINE.json',root),'utf8').then(JSON.parse),
 readFile(new URL('src/precipitationIntervals.ts',root),'utf8'),
 readFile(new URL('src/ShortTermForecast.tsx',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/WaterSportsPanel.tsx',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
]);

assert.equal(pkg.version,baseline.releaseVersion,'Package und Baseline müssen synchron sein.');
assert.equal(pkg.version,baseline.version,'Legacy-Baseline-Version muss synchron sein.');
assert.ok(intervals.includes('export function precipitationPresentationHours('),'Zentraler Stunden-Slotadapter fehlt.');
assert.ok(intervals.includes('export function precipitationPresentationMinutes15('),'Zentraler 15-Minuten-Slotadapter fehlt.');
assert.ok(shortTerm.includes('precipitationIntervalStartEpoch=previousIntervalEnd'),'Kurzfrist muss den sichtbaren Slotbeginn explizit führen.');
assert.ok(shortTerm.includes('base=interpolatedHour(hours,precipitationIntervalStartEpoch)'),'Punktparameter müssen am sichtbaren Slotbeginn verankert bleiben.');
assert.ok(shortTerm.includes('timeLabel:clock(precipitationIntervalStartEpoch,timezone)'),'Sichtbare Kurzfristzeit muss der Beginn des Zukunftsintervalls sein.');
assert.ok(cockpit.includes('precipitationPresentationHours(hours).filter(hour=>hour.epoch<windowEnd&&hour.epoch+HOUR_MS>now)'),'24-h-Profil muss die vorwärts gerichteten sichtbaren Niederschlagsslots verwenden.');
assert.ok(water.includes('const precipitationDisplayHours=useMemo(()=>precipitationPresentationHours(hours),[hours])'),'Wassersport muss denselben sichtbaren Slotvertrag verwenden.');
assert.ok(app.includes('isDay:astronomicalIsDayAt(slotStart.epoch'),'Höhenwetter muss den astronomischen Status am sichtbaren Slotbeginn bestimmen.');

// Alte Regressionen transpilierten forecastFusion.ts isoliert. Seit der zentrale
// Präsentationsadapter ausgelagert ist, müssen solche Harnesses diesen Import
// bewusst isolieren; sonst testen sie nicht ihren Fachbereich, sondern scheitern
// schon an einem fehlenden Temp-Modul.
const scriptNames=(await readdir(new URL('scripts/',root))).filter(name=>name.startsWith('test-')&&name.endsWith('.mjs'));
const missing=[];
for(const name of scriptNames){
 const source=await readFile(new URL(`scripts/${name}`,root),'utf8');
 const isolatedFusion=source.includes("import {fetchWorkerJson} from './workerClient';")&&source.includes('forecastFusion');
 if(isolatedFusion&&!source.includes("import {precipitationPresentationHours} from './precipitationIntervals';"))missing.push(name);
}
assert.deepEqual(missing,[],`Isolierte forecastFusion-Regressionsharnesses ohne precipitationIntervals-Isolation: ${missing.join(', ')}`);

const test='scripts/test-precipitation-forward-slot-regression-compat-097848.mjs';
assert.ok(baseline.regressionTests?.includes(test),'Neue Kompatibilitätsregression fehlt in regressionTests.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Neue Kompatibilitätsregression fehlt in requiredRegressionTests.');
console.log(`MID v${pkg.version}: Forward-Slot-Vertrag und isolierte forecastFusion-Regressionsharnesses sind kompatibel geschützt.`);
