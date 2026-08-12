import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,pkgSource,baselineSource]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
assert.ok(app.includes("value:`${formatDecimalFixed(pressure,1)} hPa`"),'Luftdruckkarte formatiert den Wert nicht mit genau einer Nachkommastelle.');
assert.ok(app.includes("sourceFor(['pressure'],qffStationPressure,'Best Match')"),'Luftdruckquelle verwendet nicht die verständliche Bezeichnung Best Match.');
assert.ok(!app.includes('Best Match · pressure_msl'),'Technische Feldbezeichnung pressure_msl ist weiterhin sichtbar.');
assert.ok(!app.includes("value:`${Math.round(pressure)} hPa`"),'Luftdruckkarte rundet weiterhin auf ganze hPa.');
assert.ok(JSON.parse(pkgSource).scripts['test:pressure-card-display'],'Package-Skript für die Luftdruckkarten-Regression fehlt.');
assert.ok(JSON.parse(baselineSource).regressionTests.includes('scripts/test-pressure-card-display-083310.mjs'),'Baseline enthält die Luftdruckkarten-Regression nicht.');
console.log('Luftdruckkarte geprüft: eine Nachkommastelle und keine sichtbare API-Feldbezeichnung.');
