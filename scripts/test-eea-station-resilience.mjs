import {readFile} from 'node:fs/promises';

const [worker,weather,airQuality,app]=await Promise.all([
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/airQuality.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "https://air.discomap.eea.europa.eu/arcgis/rest/services/AirQuality/AirQualityDownloadServiceEUMonitoringStations/MapServer/0/query",
 "https://eeha.discomap.eea.europa.eu/arcgis/rest/services/AirQuality/AirQualityDownloadServiceEUMonitoringStations/MapServer/0/query",
 "for(const endpoint of EEA_AIR_QUALITY_STATION_ENDPOINTS)for(const strategy of['distance','envelope'])",
 "'User-Agent':`MID/${WORKER_VERSION} EEA station lookup`",
 "sourceHost:host",
 "EEA-Messstationsdienst nicht erreichbar"
])if(!worker.includes(token))failures.push(`Worker-Resilienz fehlt: ${token}`);
if(worker.includes("const EEA_AIR_QUALITY_STATIONS='https://discomap.eea.europa.eu"))failures.push('Veralteter einzelner EEA-Host ist weiterhin alleinige Quelle.');
for(const token of [
 'EEA_STATION_DIRECT_ENDPOINTS',
 "const EEA_STATION_CACHE_KEY='mid:eea-station-cache:v2'",
 "for(const endpoint of EEA_STATION_DIRECT_ENDPOINTS)for(const strategy of['distance','envelope'] as const)",
 'directEeaAirQualityStation',
 'cachedEeaStation',
 'storeEeaStation'
])if(!weather.includes(token))failures.push(`Frontend-Fallback fehlt: ${token}`);
for(const token of ['cached?:boolean','sourceHost?:string','all-mandatory-pollutants','Messumfang: alle Pflichtschadstoffe'])if(!airQuality.includes(token))failures.push(`Stationsmetadaten fehlen: ${token}`);
for(const token of ['Zuletzt bestätigte Messreferenz','EEA-Dienst: {station.sourceHost}','EEA-Messstationsdienst derzeit nicht erreichbar'])if(!app.includes(token))failures.push(`AQI-Tooltip-Fallback fehlt: ${token}`);
if(failures.length){console.error('EEA-Stationsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('EEA-Stationssuche geprüft: aktuelle EEA-Hosts, Spiegelserver, Geometrie-Fallback, Browser-Rückfall und letzter erfolgreicher Stand sind vorhanden.');
