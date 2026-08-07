import {readFile} from 'node:fs/promises';
const [radar,cockpit,worker,styles,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};
for(const token of ["buildWorkerUrl(base,'dwd-precipitation-type-image'","response.headers.get('x-mid-radar-at')","response.headers.get('x-mid-satellite-at')",'Originales DWD-Kombinationsbild · unverändert','dwd-precip-type-radar__source-image','DWD-Originalprodukt · Standort'])need('DWD-Originalprodukt',radar,token);
for(const token of ["headers.set('x-mid-radar-at',sourceTimes.radarAt)","headers.set('x-mid-satellite-at',sourceTimes.satelliteAt)",'x-mid-observed-at,x-mid-radar-at,x-mid-satellite-at'])need('Worker-Zeitbindung',worker,token);
reject('Kein rekonstruierter Satellitenlayer',radar,'loadCompositeTimes');reject('Kein HymecNG-Ersatzbild',radar,'loadHymecNgMetadata');reject('Kein Leaflet-Ersatzbild',radar,'LazyDwdPrecipitationMap');
need('Source-CSS',styles,'.dwd-precip-type-radar__source-frame{');
const listIndex=cockpit.indexOf('className="cockpit-hourly-preview-shell"'),insightIndex=cockpit.indexOf('className="cockpit-short-insight-grid premium"');if(listIndex<0||insightIndex<0||insightIndex<listIndex)failures.push('Tageseckdaten stehen nicht unterhalb der 24-h-Liste.');
if(!baseline.includes('scripts/test-mid-09261-dwd-original-order.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Originalprodukt-/Tageseckdatenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Amtliches DWD-Originalprodukt mit an dieselbe Bildantwort gebundenen Zeitstempeln und Tageseckdaten unterhalb der 24-h-Liste geprüft.');
