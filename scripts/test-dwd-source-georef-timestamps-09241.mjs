import {readFile} from 'node:fs/promises';
const [radar,worker,styles,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of ['formatDwdSourceTimestamp(meta?.radarAt)','formatDwdSourceTimestamp(meta?.satelliteAt)','<b>Radar</b>','<b>Sat</b>',"response.headers.get('x-mid-radar-at')","response.headers.get('x-mid-satellite-at')",'Originales DWD-Kombinationsbild · unverändert'])need('Quellzeiten UI',radar,token);
for(const token of ["DWD_PRECIPITATION_TYPE_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html'",'DWD_HYMECNG_ROOTS',"DWD_PRECIPITATION_TYPE_SATELLITE_INDEX='https://opendata.dwd.de/weather/satellite/clouds/TS/'",'radarAt=pageTimes.radarAt||','satelliteAt=pageTimes.satelliteAt||','DWD-Produktseite verbindlich; Fallback HymecNG + NWCSAF OpenData',"headers.set('x-mid-radar-at',sourceTimes.radarAt)","headers.set('x-mid-satellite-at',sourceTimes.satelliteAt)"])need('Worker-Zeitquelle',worker,token);
reject('Alter HG-Pfad',worker,"weather/radar/composite/hg/'");
for(const token of ['.dwd-precip-type-radar__source-image','background:color-mix'])need('Originalbild-CSS',styles,token);
if(!baseline.includes('scripts/test-dwd-source-georef-timestamps-09241.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Quellzeit-/Originalproduktprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Produktseiten-Zeitstempel sind an dieselbe Worker-Bildantwort wie das unveränderte Originalprodukt gebunden.');
