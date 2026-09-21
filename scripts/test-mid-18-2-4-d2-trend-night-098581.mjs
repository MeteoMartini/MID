import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,design,astronomy,cockpit,pkgRaw,baselineRaw]=await Promise.all([
  read('src/App.tsx'),
  read('src/MidDesign.tsx'),
  read('src/astronomy.ts'),
  read('src/ForecastCockpit.tsx'),
  read('package.json'),
  read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-4-d2-trend-night-098581.mjs';

assert.equal(pkg.version,'0.9.85.81','D.2 muss MID v0.9.85.81 sein.');

assert.ok(app.includes('const currentThreadTemperatures=currentThreadSeries.map(hour=>Number(hour.temperature))'),'12-h-Trend muss die kanonische lokal angepasste Stundenreihe verwenden.');
assert.ok(!app.includes('index===0&&Number.isFinite(temp)?temp:Number(hour.temperature)'),'Ein isolierter beobachteter Startwert darf nicht mehr in eine anders angepasste Trendreihe gemischt werden.');
for(const token of [
  'function currentTemperatureTrendSummary(values:number[])',
  'danach ↗',
  'danach ↘',
  "↕ wechselhaft",
  'currentThreadTrendLabel=currentTemperatureTrendSummary(currentThreadTemperatures)'
]) assert.ok(app.includes(token),`Verlaufssummary fehlt: ${token}`);

assert.ok(astronomy.includes('export function solarTimelineWindow'),'Zentrale minutengenaue Solar-Geometrie fehlt.');
assert.ok(app.includes('solarTimelineWindow(currentThreadStartEpoch,currentThreadEndEpoch'),'Aktuelles Wetter muss die zentrale Solar-Geometrie verwenden.');
assert.ok(cockpit.includes('solarTimelineWindow(chartStartEpoch,chartEndEpoch'),'24-h-Profil muss dieselbe Solar-Geometrie verwenden.');
assert.ok(cockpit.includes('nightBandOpacity=.16'),'Nachtfläche im 24-h-Profil muss dezent bleiben.');

for(const token of [
  'export type MidWeatherThreadNightBand',
  'nightBands=[]',
  'mid-weather-thread-night-bands',
  'var(--mg-night,#5b667c)'
]) assert.ok(design.includes(token),`Nachtband-Vertrag fehlt: ${token}`);

assert.ok(app.includes('nightBands={currentThreadNightBands}'),'12-h-Temperaturkurve muss Nachtbereiche erhalten.');
assert.ok(app.includes('current-thread-night-band'),'Skybar muss dieselbe Nachtkennzeichnung hinter den Wetterdaten erhalten.');
assert.ok(app.includes('keyPrefix="current-12h"'),'Stündliche Skybar-Fachlogik muss unangetastet bleiben.');

for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
  assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
assert.ok((baseline.requiredFiles||[]).includes(testPath),`${testPath} fehlt in requiredFiles`);

console.log('MID v0.9.85.81 D.2: konsistente hyperlokale Trendreihe, mehrphasige Verlaufssummary und gemeinsame dezente Nachtgeometrie geschützt.');
