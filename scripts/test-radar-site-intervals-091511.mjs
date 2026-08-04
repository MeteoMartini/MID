import fs from 'node:fs';
const worker=fs.readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const weather=fs.readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const raster=fs.readFileSync(new URL('../src/RadolanRasterSource.ts',import.meta.url),'utf8');
for(const [name,ok] of [
 ['alle DWD-Zukunftsschritte',worker.includes('future=usable.filter(t=>t>now+90000)')&&!worker.includes('allFuture.filter')],
 ['exakte 5-Minuten-Punktserie',worker.includes('exactPointFrames')&&worker.includes("source!=='feature-info'" )],
 ['mehrphasige Standortintervalle',worker.includes('radarSiteIntervals')&&worker.includes('interruptionMinutes')],
 ['Nahbereich ist kein Standorttreffer',worker.includes('im direkten DWD-RV-Punkt-Nowcast kein Standorttreffer')&&app.includes('Echo nur im Umfeld, kein direkter Standorttreffer')],
 ['2-h-Summe nur Standort',app.includes('!segment.nearby&&segment.end>now')],
 ['Unterbrechungswortlaut',app.includes('nach kurzer Unterbrechung erneut')&&app.includes('mit Unterbrechungen bis')],
 ['RADOLAN-YW-Punktbeobachtung',weather.includes('nativeRadolanCurrentPoint')&&weather.includes('loadAndSampleRadolan')&&raster.includes('nearestWetKm')],
 ['OPERA nur Kontrollabgleich',weather.includes('OPERA CIRRUS-Kontrollabgleich')&&weather.includes('kein Ersatz für den DWD-Standortpunkt')],
 ['Umfeldecho begrenzt Wahrscheinlichkeit',app.includes('radarWeight=nearbyOnly?.72')&&app.includes('Math.min(probability,55)')]
]){if(!ok)throw new Error(`Regression fehlgeschlagen: ${name}`)}
console.log('Radar-Standortintervalle v0.9.15.11: OK');
