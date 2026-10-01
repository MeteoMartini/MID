import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [startup,weather,worker,app]=await Promise.all([
 readFile(new URL('../src/startupPreload.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
]);

assert.match(startup,/await delay\(constrained\?120:20\)/,'Radar-Preload muss auf normalen Verbindungen praktisch sofort starten.');
assert.match(weather,/maxAgeMs:fast\?45000:0/,'Der Fast-Path braucht einen kurzen stabilen In-Memory-Cache.');
assert.match(weather,/staleIfErrorMs:fast\?120000:0/,'Bei einem kurzen Upstream-Hänger darf der letzte Fast-Path kurz weiterverwendet werden.');
assert.match(weather,/radar-nowcast-fast:\$\{stage\}:\$\{params\.lat\.toFixed\(3\)\}:\$\{params\.lon\.toFixed\(3\)\}:\$\{params\.country\}/,'Der Fast-Cache-Key darf nicht durch _ts entwertet werden.');
assert.match(worker,/if\(fast\)\{precise=\{rate:validRadarRate\(sample\.center\)\?\?0,source:'map-fast'\}\}else\{try\{precise=await dwdPointRate\(query\.base,query\.layer,lat,lon,time,sample\.center,false\)\}/,'Der schnelle DWD-Pfad muss die bereits geladene Rasterprobe verwenden und darf nicht pro Frame zusätzlich GetFeatureInfo abwarten.');
assert.match(app,/showProbabilityTimeline&&radar&&radarSignalDetected\(radar\)&&<RadarNowcastTimeline/,'Die Radar-Nowcast-Grafik darf weiterhin nur bei erkanntem Radar-/Umfeldsignal erscheinen.');

console.log('Radar-Startpfad v0.9.85.131: Fast-Rasterpfad, Kurzcache und Echo-Gate verifiziert.');

assert.match(app,/const fastPreview=Boolean\(\(radar\.diagnostics as any\)\?\.fast\);if\(fastPreview\)return/,'Eine unvollständige Schnellserie darf nicht als vollständige 5-Minuten-Radarreihe gezeichnet werden.');
assert.match(app,/5-Minuten-Auswertung wird vervollständigt/,'Die Schnellansicht muss den noch unvollständigen Radarstatus transparent benennen.');
assert.match(app,/constrainedNetwork\?180:40/,'Die Vollanalyse muss unmittelbar nach dem Fast-Signal nachgeladen werden.');
assert.match(worker,/offset\+=12\).*missing\.slice\(offset,offset\+12\)/s,'Exakte 5-Minuten-Punktwerte sollen in größeren parallelen Paketen nachgeladen werden.');
