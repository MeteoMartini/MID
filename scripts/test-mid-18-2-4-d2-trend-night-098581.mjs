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

assert.ok(/^0\.9\.85\.(?:8[2-9]|9\d|\d{3,})$/.test(pkg.version),'D.2-Korrektur muss MID v0.9.85.82 oder neuer sein.');

assert.ok(app.includes('currentThreadSeries=currentFullHourWindow(hours,w.timezone,solarNow,12)'),'12-h-Trend muss an der aktuellen vollen lokalen Stunde beginnen.');
assert.ok(app.includes('fullHourMinuteInZone(Number(hour.epoch),timezone)===0'),'Nur volle lokale Stunden dürfen in den Trend eingehen.');
assert.ok(app.includes('currentThreadTargetEpoch=currentThreadStartEpoch+12*3600000'),'Ziel muss exakt zwölf volle Stunden nach dem Start liegen.');
assert.ok(app.includes('currentThreadTargetHour=currentThreadSeries.find(hour=>Number(hour.epoch)===currentThreadTargetEpoch)'),'Zielwert muss aus derselben hyperlokal korrigierten Stundenreihe stammen.');
assert.ok(app.includes('currentThreadTrendLabel=currentTemperatureDeltaLabel(Number(currentThreadSeries[0]?.temperature),Number(currentThreadTargetHour?.temperature))'),'Sichtbar sein darf nur T(+12 h) minus T(0 h) aus derselben Stundenreihe.');
assert.ok(!app.includes('function currentTemperatureTrendSummary(values:number[])')&&!app.includes('danach ↗')&&!app.includes('danach ↘')&&!app.includes('↕ wechselhaft'),'Mehrphasige Trendzusammenfassung muss entfernt bleiben.');
assert.ok(app.includes("<small>Temperaturdifferenz · +12 h</small><b>{currentThreadTrendLabel}</b>"),'Kopfzeile muss ausschließlich die +12-h-Differenz zeigen.');

assert.ok(astronomy.includes('export function solarTimelineWindow'),'Zentrale minutengenaue Solar-Geometrie fehlt.');
assert.ok(app.includes('solarTimelineWindow(currentThreadStartEpoch,currentThreadEndEpoch'),'Aktuelles Wetter muss die zentrale Solar-Geometrie verwenden.');
assert.ok(cockpit.includes('solarTimelineWindow(chartStartEpoch,chartEndEpoch'),'24-h-Profil muss dieselbe Solar-Geometrie verwenden.');
assert.ok(cockpit.includes('nightBandOpacity=.2'),'Nachtfläche im 24-h-Profil muss etwas deutlicher, aber weiterhin dezent bleiben.');

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

console.log('MID v0.9.85.82 D.2: volle hyperlokal korrigierte Stunden, exakt +12 h und etwas deutlichere gemeinsame Nachtgeometrie geschützt.');
