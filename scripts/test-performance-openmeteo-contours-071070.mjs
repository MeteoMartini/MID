import {readFile} from 'node:fs/promises';
const [radar,weather,styles,worker]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "'ecmwf_ifs_europe_ensemble'",
 "'ecmwf_aifs_europe_ensemble'",
 "'ecmwf_ifs_europe_ensemble_mean'",
 "'ecmwf_aifs_europe_ensemble_mean'",
 "ENSEMBLE_CACHE_PREFIX='mid:ensemble:v6:'",
 'ENSEMBLE_FRESH_CACHE_MS=20*60*1000',
 'withoutGlobalEcmwfDuplicates',
 'selectedMeanModels(lat,lon)',
 'cache&&cache.ageMs<=ENSEMBLE_FRESH_CACHE_MS'
])if(!weather.includes(token))failures.push(`Open-Meteo-/Ensemble-Aktualisierung fehlt: ${token}`);
for(const token of [
 'DATE_TIME_FORMATTER_CACHE',
 'prepareContours(levels,type)',
 'pointAlongPrepared',
 "Pane name=\"mid-model-lines\"",
 'dominantModelFrame&&<Pane',
 "window.setInterval(load,60*60000)",
 "setTimeout(()=>{try{localStorage.setItem"
])if(!radar.includes(token))failures.push(`Komposit-/Performance-Optimierung fehlt: ${token}`);
if(radar.includes("modelFrameBlend.map(({frame,weight})"))failures.push('Modellkonturen werden weiterhin doppelt über mehrere Überblendframes gerendert.');
for(const token of ['.leaflet-mid-model-lines-pane','.mid-model-contour.halo','.mid-model-contour.foreground'])if(!styles.includes(token))failures.push(`Sichtbarkeits-CSS der Modellkonturen fehlt: ${token}`);
for(const token of ['cacheTtl:1800',"max-age=1800"])if(!worker.includes(token))failures.push(`Worker-Cache für Modellkonturen fehlt: ${token}`);
if(failures.length){console.error('Performance/Open-Meteo/Komposit-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Performance, Open-Meteo-Modellstand und sichtbare Isobaren/Isohypsen geprüft.');
