import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const weather=readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const history=readFileSync(new URL('../src/radarHistory.ts',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
for(const token of [
 'onPointerDown={pointerDown}',
 'onPointerMove={pointerMove}',
 'timelineSegments',
 'nearbyOnly?Math.min(nearbyRate,scaleNearbyMarker(nearbyRate)):siteRate',
 'radar-nowcast-total',
 'radarHistory={radarHistoryInfo}',
 'radarNowcast(loc.latitude,loc.longitude,loc.country_code||loc.country,radarController.signal,true)',
 'station(loc.latitude,loc.longitude,loc.country_code||loc.country,loc.elevation??fw.elevation,loc,stationController.signal,true,forceFresh)'
])assert.ok(app.includes(token),`App-Funktion fehlt: ${token}`);
for(const token of ['radolan-history-meta','loadAndSampleRadolan','RadarHistory'])assert.ok(history.includes(token),`RADOLAN-Historie fehlt: ${token}`);
for(const token of ["mode==='radolan-history-meta'","mode==='radolan-history-file'","product:'RW'","product:'RY'","product:'SF'",'fastStations'])assert.ok(worker.includes(token),`Worker-Pfad fehlt: ${token}`);
assert.ok(worker.includes('\\\\d{10}'), 'RADOLAN-Dateimuster muss die Ziffernklasse im dynamischen RegExp erhalten');
assert.ok(weather.includes("fast:fast?1:0"),'Schneller Analysepfad fehlt');
assert.ok(css.includes('.radar-nowcast-scrubber')&&css.includes('touch-action:pan-y'),'Touch-Scrubber-CSS fehlt');
console.log('Radar-Scrubbing, progressive Analyse und RADOLAN-Rückschau geprüft.');
