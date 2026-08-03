import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const weather=await readFile(new URL('../src/weather.ts',import.meta.url),'utf8');
assert.match(weather,/export type WindUnit='kn'\|'kmh'\|'ms'\|'mph'/,'Der zentrale WindUnit-Vertrag muss kn verwenden.');
assert.doesNotMatch(source,/formatWind\([^\n]*,['\"]kt['\"]\)/,'EnsemblePanel darf den reinen Anzeige-String kt nicht als WindUnit übergeben.');
assert.match(source,/formatWind\(row\.bestWind,'kn'\).*formatWind\(row\.bestGust,'kn'\)/s,'Wind- und Böenvorschau müssen die gültige interne Einheit kn verwenden.');
console.log('MID v0.9.5.1: Ensemble-Windvorschau verwendet den gültigen WindUnit-Vertrag kn; Anzeige bleibt kt.');
