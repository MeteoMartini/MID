import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
for(const token of ['CloudRain','Compass','GaugeCircle','function finite(','function circularDelta('])assert.ok(!source.includes(token),`Ungenutzte Deklaration verblieben: ${token}`);
console.log('MID v0.9.7.1 Buildfix geprüft: fünf ungenutzte ForecastCockpit-Deklarationen entfernt.');
