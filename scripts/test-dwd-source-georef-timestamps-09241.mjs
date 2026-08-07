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
  'DWD_IMAGE_GEO_AFFINE',
  'geoFromImagePoint',
  'formatCompactTimestamp(meta?.radarAt,timezone)',
  'formatCompactTimestamp(meta?.satelliteAt,timezone)',
  'Zeitstand · DWD-Produktseite'
])need('Radar',radar,token);
reject('Radar-Altfallback',radar,'||meta?.observedAt');
reject('Radar-Altabbildung',radar,'IMAGE_BOUNDS');
reject('Radar-Altabbildung',radar,'IMAGE_MAP_FRAME');
for(const token of [
  "DWD_PRECIPITATION_TYPE_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html'",
  'dwdPrecipitationTypeSourceTimesFromHtml',
  'Satdaten|Satellitendaten',
  'Radardaten\\s+Niederschlagsart',
  'radarAt:sourceTimes.radarAt',
  'satelliteAt:sourceTimes.satelliteAt',
  'Zeitstempel verbindlich aus der DWD-Produktseite'
])need('Worker-Zeitquelle',worker,token);
reject('Worker-Zeitfallback',worker,'radarAt:observedAt');
for(const token of [
  'border-radius:0!important',
  'background:transparent!important',
  '.dwd-precip-type-radar__marker i{display:none!important}'
])need('Marker ohne Kreis',styles,token);
const match=radar.match(/DWD_IMAGE_GEO_AFFINE=\{\s*x:\{lon:([-.\d]+),lat:([-.\d]+),bias:([-.\d]+)\},\s*y:\{lon:([-.\d]+),lat:([-.\d]+),bias:([-.\d]+)\}/s);
if(!match)failures.push('Affine DWD-Georeferenzierung ist nicht auslesbar.');
else{
  const [,ax,bx,cx,ay,by,cy]=match.map(Number),project=(lon,lat)=>({x:ax*lon+bx*lat+cx,y:ay*lon+by*lat+cy});
  const wiesbaden=project(8.2398,50.0782),koblenz=project(7.5889,50.3569),frankfurt=project(8.6821,50.1109);
  if(Math.abs(wiesbaden.x-.40775)>.006||Math.abs(wiesbaden.y-.51712)>.006)failures.push(`Wiesbaden-Anker außerhalb Kalibrierung: ${wiesbaden.x.toFixed(5)}/${wiesbaden.y.toFixed(5)}`);
  if(!(wiesbaden.x>koblenz.x&&wiesbaden.x<frankfurt.x))failures.push('Wiesbaden muss im DWD-Bild horizontal zwischen Koblenz und Frankfurt liegen.');
}
if(!baseline.includes('scripts/test-dwd-source-georef-timestamps-09241.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Quellzeit-/Georeferenzierungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Ortsanker, verbindliche Quellzeitstempel und kreisfreier Standortmarker erfolgreich geprüft.');
