import {readFile} from 'node:fs/promises';
const [weather,app,thunder,worker,styles]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "const ensemblePriority=",
 "slice(0,8)",
 "settledMapLimited(selected,2",
 "fetchWorkerJson<Weather&{error?:string}>('ensemble-proxy'",
 "temperature_2m_spread,precipitation,precipitation_spread",
 "pseudoModelFromMeanSpread",
 "ENSEMBLE_CACHE_PREFIX='mid:ensemble:v3:'",
 "lokaler letzter erfolgreicher Stand"
])if(!weather.includes(token))failures.push(`Ensemble-Recovery fehlt: ${token}`);
for(const token of [
 "if(mode==='ensemble-proxy')return openMeteoEnsembleProxy(u)",
 "if(mode==='model-meta')return openMeteoModelMeta(u)",
 "bestForecast=forecasts.reduce((best,row)=>!best||row.distanceKm<best.distanceKm",
 "centerApproaching=Boolean(bestForecast&&bestForecast.distanceKm+2<currentDistanceKm)",
 "isApproaching:centerApproaching"
])if(!worker.includes(token))failures.push(`Worker-/KONRAD-Korrektur fehlt: ${token}`);
for(const token of [
 "centerGetsCloser=Number.isFinite(currentDistance)&&Number.isFinite(forecastDistance)&&forecastDistance+2<currentDistance",
 "Gewitterzelle zieht voraussichtlich vorbei",
 "und damit nicht näher"
])if(!thunder.includes(token))failures.push(`Gewitter-Plausibilisierung fehlt: ${token}`);
for(const token of [
 "radar-nowcast-yaxis",
 "radar-nowcast-events",
 "max. ${formatDecimalFixed(peak,1)} mm/h",
 "ca. ${formatDecimalFixed(amount,2)} mm",
 "5–15-minütig"
])if(!app.includes(token))failures.push(`Nowcast-Auflösung fehlt: ${token}`);
for(const token of ['.radar-nowcast-yaxis','.radar-nowcast-events','.radar-nowcast-grid.half'])if(!styles.includes(token))failures.push(`Nowcast-CSS fehlt: ${token}`);
if(failures.length){console.error('Ensemble-/Gewitter-/Nowcast-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Recovery, KONRAD3D-Zellzentrumprüfung und hochaufgelöster Radar-Nowcast geprüft.');
