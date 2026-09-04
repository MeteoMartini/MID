import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [cockpit,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse),
]);
const start=cockpit.indexOf('function SevenDayCurveOverview(');
const end=cockpit.indexOf(`
function cockpitDaySkyBarSegments(`);
assert.ok(start>=0&&end>start,'SevenDayCurveOverview konnte nicht isoliert werden.');
const curve=cockpit.slice(start,end);
for(const token of [
  'const nightBandTop=skyBarY-7,nightBandBottom=precipBase+8;',
  'y={nightBandTop}',
  'height={nightBandBottom-nightBandTop}',
  'className="night-band seven-day-curve-night-band"'
])assert.ok(curve.includes(token),`7-Tage-Nachtband-Vertrag fehlt: ${token}`);
const test='scripts/test-seven-day-curve-night-band-097841.mjs';
assert.ok(baseline.regressionTests?.includes(test),'Regressionstest fehlt in MID_BASELINE.json (regressionTests).');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Regressionstest fehlt in MID_BASELINE.json (requiredRegressionTests).');
console.log('7-Tage-Kurvenübersicht geprüft: Nachtbereich spannt jetzt auch unter Skybar und Niederschlagsachse.');
