import {readFile} from 'node:fs/promises';

const [weather,worker,app,route,travel,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RouteWeatherPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/TravelPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'postcodes?:string[];icao?:string;',
 "const ICAO_LOCATION_CACHE_KEY='mid:icao-location-cache:v1';",
 'const ICAO_LOCATION_CACHE_TTL=30*86400000;',
 "fetchWorkerJson<Location&{error?:string}>('icao-location',{icao:code}",
 "looksLikeIcao=/^[A-Z]{4}$/.test(code)",
 'if(looksLikeIcao&&!exactPlace)',
 'icaoLocationRequests=new Map<string,Promise<Location|null>>()',
 "source:location.source||'NOAA AviationWeather / ICAO'"
])need('Gemeinsame Ortssuche',weather,token);

for(const token of [
 'async function icaoLocation(u)',
 "if(mode==='icao-location')",
 "'icao-location'",
 "source:'NOAA AviationWeather / ICAO'",
 "poiCategory:'Flughafen'",
 "cache-control':'public, max-age=2592000'"
])need('Worker-ICAO-Auflösung',worker,token);

for(const token of [
 'Ort, PLZ, ICAO, POI oder Favorit suchen',
 'ICAO {result.icao}',
 'ICAO-Ortssuche'
])need('Hauptsuche',app,token);
for(const token of ['Ort, PLZ oder ICAO suchen','item.icao?`${item.icao} · ${item.name}`'])need('Routenwettersuche',route,token);
for(const token of ['Ort, Region, Reiseziel oder ICAO','location.icao?`${location.icao} · ${location.name}`'])need('Reisewettersuche',travel,token);
need('Package-Test',pkg,'test:icao-location-search');
need('Baseline-Test',baseline,'scripts/test-icao-location-search-08193.mjs');

if(failures.length){console.error('ICAO-Ortssuche-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('ICAO-Ortssuche geprüft: gemeinsame Suche, 30-Tage-Cache, Worker-Auflösung und Darstellung in Haupt-, Routen- und Reisewettersuche vorhanden.');
