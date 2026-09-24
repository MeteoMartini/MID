import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [cockpit,astronomy,pkgRaw,baselineRaw]=await Promise.all([
  read('src/ForecastCockpit.tsx'),
  read('src/astronomy.ts'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),testPath='scripts/test-mid-18-2-10-now90-night-098598.mjs';
const versionAtLeast=(value,minimum)=>{const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length,4);i++){const av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv}return true};

assert.ok(versionAtLeast(pkg.version,'0.9.85.98'),'90-Minuten-Nachtkennzeichnung benötigt MID v0.9.85.98 oder neuer.');
assert.equal(baseline.releaseVersion,pkg.version,'Version und Baseline müssen übereinstimmen.');
assert.ok(astronomy.includes('export function solarTimelineWindow'),'Zentrale Solar-Geometrie fehlt.');

assert.ok(cockpit.includes('now90StartEpoch=Number(now90[0]?.precipitationIntervalStartEpoch??now90[0]?.epoch)'),'90-Minuten-Nachtgeometrie muss am realen ersten 15-Minuten-Intervall beginnen.');
assert.ok(cockpit.includes('now90EndEpoch=Number(now90.at(-1)?.precipitationIntervalEndEpoch??now90.at(-1)?.epoch)'),'90-Minuten-Nachtgeometrie muss bis zum realen letzten Intervallende reichen.');
assert.ok(cockpit.includes('solarTimelineWindow(now90StartEpoch,now90EndEpoch'),'90-Minuten-Skybar muss dieselbe zentrale Solar-Geometrie wie Aktuell/24 h verwenden.');
assert.ok(cockpit.includes('now90NightBands=now90Solar.nightBands.map'),'Nachtbereiche müssen aus der gemeinsamen Solar-Geometrie abgeleitet werden.');
assert.ok(cockpit.includes('mid-now90-night-${meteogramId}'),'Nachtverlauf benötigt eindeutige SVG-Verläufe.');
assert.ok(cockpit.includes('className="cockpit-now90-night-band"'),'90-Minuten-Skybar muss sichtbare Nachtflächen rendern.');
assert.ok(cockpit.includes('stopColor="var(--mg-night,#5b667c)"'),'Nachtfläche muss denselben MID-Nachtfarbvertrag wie Aktuell verwenden.');
assert.ok(cockpit.includes('<stop offset="14%"')&&cockpit.includes('<stop offset="86%"'),'Nachtfläche muss dieselbe weiche Ein-/Ausblendung wie Aktuell verwenden.');
const nightIndex=cockpit.indexOf('className="cockpit-now90-night-band"'),skyIndex=cockpit.indexOf('keyPrefix="now90-quarter"',nightIndex);
assert.ok(nightIndex>=0&&skyIndex>nightIndex,'Nachtfläche muss hinter den Skybar-/Quadratsegmenten liegen.');
assert.ok(cockpit.includes('height="16" fill={`url(#${band.gradientId})`} pointerEvents="none"'),'Nachtfläche darf weder Höhe noch Interaktion der 90-Minuten-Skybar verändern.');

for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
  assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
assert.ok((baseline.requiredFiles||[]).includes(testPath),`${testPath} fehlt in requiredFiles`);

console.log('MID 18.2.10: 90-Minuten-Skybar übernimmt die gemeinsame dezente Nachtstundenkennzeichnung aus Aktuell/24 h.');
