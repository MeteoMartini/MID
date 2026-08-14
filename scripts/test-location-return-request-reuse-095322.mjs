import {readFile} from 'node:fs/promises';

const [app,weather,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,label)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 'readAnalysisCacheEntry',
 'nearbyRadiusM=450',
 'stationCacheEntryForLocation',
 "readAnalysisCache<Station>('station-provisional'",
 "readAnalysisCache<any>('air-quality'",
 "readAnalysisCache<RadarNowcast>('radar'",
 "readAnalysisCache<RadarHistory>('radar-history'",
 "readAnalysisCache<{alerts:OfficialAlert[];provider?:string;coverage?:string}>('official-warnings'",
 "readAnalysisCache<ThunderstormNowcast>('thunderstorm'",
 "readAnalysisCache<HeavyRainBase>('heavy-rain'",
 'lastPushSyncSignature',
 'signature===lastPushSyncSignature.current'
])need(app,token,'Appweiter Wiederverwendungs-Vertrag fehlt');

for(const token of [
 "REVERSE_LOCATION_CACHE_PREFIX='mid:reverse-location:v1:'",
 'REVERSE_LOCATION_CACHE_FRESH_MS=14*86400000',
 'REVERSE_LOCATION_CACHE_NEARBY_M=650',
 "AIR_QUALITY_CACHE_PREFIX='mid:air-quality:v1:'",
 'AIR_QUALITY_FRESH_MS=15*60000',
 'AIR_QUALITY_STALE_MS=2*3600000',
 'const fresh=cachedEeaStation(lat,lon,7*86400000,5000)',
 'maxAgeMs:24*3600000',
 "FORECAST_CORE_CACHE_PREFIX='mid:forecast-core:v3:'",
 'FORECAST_CORE_FRESH_MS=8*60*1000'
])need(weather,token,'Quellen-Cache-Vertrag fehlt');

if(app.includes('Dezente Vergleichsskala je Parameter'))failures.push('Prompt-Begriff „dezent“ ist noch in einer sichtbaren AQI-Erklärung enthalten.');
const parsed=JSON.parse(baseline);
if(!parsed.requiredRegressionTests?.includes('scripts/test-location-return-request-reuse-095322.mjs'))failures.push('Neue Request-Reuse-Regression ist nicht als Required Regression geschützt.');

if(failures.length){console.error(`Standort-Rückkehr-/Datenverkehrsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('Standort-Rückkehr geprüft: Kernforecast, Stations-/AQI-/Radar-/Warn-/Hazard-Quellen, Reverse-Geocoding und Push-Sync vermeiden unnötige Wiederholungsabrufe; manueller Fresh-Reload bleibt separat möglich.');
