import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const declaration=/function\s+radarClockRange\s*\(/;
if(declaration.test(source))throw new Error('Ungenutzte Hilfsfunktion radarClockRange ist erneut vorhanden.');
if(!/function\s+radarClock\s*\(/.test(source))throw new Error('Verwendete Radar-Zeitformatierung radarClock fehlt.');
console.log('✓ Radar-Metadaten-Buildfix v0.9.12.2');
