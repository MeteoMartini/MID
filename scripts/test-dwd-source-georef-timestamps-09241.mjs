import {readFile} from 'node:fs/promises';
const [radar,worker,styles,baseline]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of [
  'DWD_RASTER_LONGITUDE_CURVES',
  'DWD_RASTER_LATITUDE_CURVES',
  'geoFromImagePoint',
  'formatDwdSourceTimestamp(meta?.radarAt)',
  'formatDwdSourceTimestamp(meta?.satelliteAt)',
  '<b>Radar</b>',
  '<b>Sat</b>',
  'Zeitstand · DWD-Quelldaten'
])need('Radar',radar,token);
reject('Radar-Altfallback',radar,'||meta?.observedAt');
reject('Radar-Altabbildung',radar,'IMAGE_BOUNDS');
reject('Radar-Altabbildung',radar,'IMAGE_MAP_FRAME');
for(const token of [
  "DWD_PRECIPITATION_TYPE_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html'",
  "DWD_PRECIPITATION_TYPE_RADAR_INDEX='https://opendata.dwd.de/weather/radar/composite/hg/'",
  "DWD_PRECIPITATION_TYPE_SATELLITE_INDEX='https://opendata.dwd.de/weather/satellite/clouds/TS/'",
  'dwdSourceIndexEntries',
  'dwdSourceIndexTimeForCutoff',
  'dwdPrecipitationTypeSourceIndexes',
  'radarAt:sourceTimes.radarAt',
  'satelliteAt:sourceTimes.satelliteAt',
  'Verbindliche UTC-Zeitstände der DWD-Quelldaten'
])need('Worker-Zeitquelle',worker,token);
reject('Worker-Zeitfallback',worker,'radarAt:observedAt');
for(const token of [
  'border-radius:0!important',
  'background:transparent!important',
  '.dwd-precip-type-radar__marker i{display:none!important}'
])need('Marker ohne Kreis',styles,token);
if(!baseline.includes('scripts/test-dwd-source-georef-timestamps-09241.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Quellzeit-/Georeferenzierungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Quellzeitstempel aus HG/NWCSAF, gekrümmtes Gradnetz und kreisfreier Standortmarker erfolgreich geprüft.');
