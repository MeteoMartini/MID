import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=await readFile(path.join(root,'worker','metar-proxy.js'),'utf8');
const weather=await readFile(path.join(root,'src','weather.ts'),'utf8');
const failures=[];

for(const token of [
  'function awcMetarBboxes(',
  'box(lat0,lon0,lat1,lon1)',
  "api.searchParams.set('hours','3')",
  'latestMetarRows(',
  'visibility:r.visib??r.visibility??r.visibility_statute_mi',
  "provider:'NOAA AviationWeather / METAR-WMO'"
])if(!worker.includes(token))failures.push(`Worker-METAR-Logik fehlt: ${token}`);

if(worker.includes("bbox=[lon-dLon,lat-dLat,lon+dLon,lat+dLat]"))failures.push('Worker verwendet weiterhin die vertauschte lon/lat-Reihenfolge.');

for(const token of [
  'function awcMetarBbox(',
  'return[Math.max(-89.9,lat-dLat),Math.max(-180,lon-dLon),Math.min(89.9,lat+dLat),Math.min(180,lon+dLon)]',
  'hours=3&bbox=',
  'metarRadiusKm=inGermany?140:220',
  'metarStations(lat,lon,metarRadiusKm,signal)'
])if(!weather.includes(token))failures.push(`Frontend-METAR-Logik fehlt: ${token}`);

if(weather.includes('hoursBeforeNow=2&bbox='))failures.push('Frontend nutzt weiterhin den alten zweistündigen METAR-Abruf.');

const helperStart=worker.indexOf('function awcMetarBboxes(');
const helperEnd=worker.indexOf('\nfunction metarReportTime',helperStart);
if(helperStart<0||helperEnd<0)failures.push('awcMetarBboxes konnte nicht funktional getestet werden.');
else{
  const helperSource=worker.slice(helperStart,helperEnd);
  const awcMetarBboxes=Function(`${helperSource}; return awcMetarBboxes;`)();
  const santiago=awcMetarBboxes(-33.45,-70.66,140)[0].split(',').map(Number);
  if(!(santiago[0]<-34&&santiago[0]>-35&&santiago[1]<-71&&santiago[1]>-73))failures.push(`Santiago-BBox ist nicht lat/lon-sortiert: ${santiago.join(',')}`);
  const paris=awcMetarBboxes(48.8566,2.3522,140)[0].split(',').map(Number);
  if(!(paris[0]>47&&paris[0]<48&&paris[1]>0&&paris[1]<1))failures.push(`Paris-BBox ist nicht lat/lon-sortiert: ${paris.join(',')}`);
  if(awcMetarBboxes(0,179.5,220).length!==2)failures.push('Datumsgrenzen-BBox wird nicht auf zwei Anfragen aufgeteilt.');
}

if(failures.length){
  console.error('Globale METAR-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Globale METAR-Abfrage geprüft: AWC-Bounding-Box ist lat/lon-sortiert, aktueller 3-h-Abruf aktiv, internationale Suchweite erweitert und Sichtweite wird übernommen.');
