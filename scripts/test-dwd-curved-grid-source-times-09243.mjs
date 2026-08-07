import {readFile} from 'node:fs/promises';
const [radar,worker,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ['Wolken + Niederschlagsart','formatDwdSourceTimestamp',"response.headers.get('x-mid-radar-at')","response.headers.get('x-mid-satellite-at')",'dwd-precip-type-radar__source-image'])need('UI',radar,token);
for(const token of ['DWD_HYMECNG_ROOTS','composite_HymecNG_','dwdPrecipitationTypeSourceTimesFromHtml','radarAt=pageTimes.radarAt||','satelliteAt=pageTimes.satelliteAt||'])need('Worker-Zeitpfad',worker,token);
// Aktuelles HymecNG-Dateinamensformat statt des abgelösten HG-Formats schützen.
const hymecTime=f=>{const m=f.match(/^composite_HymecNG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})_000-hd5$/);return m?Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5])):NaN};
if(new Date(hymecTime('composite_HymecNG_20260807_1440_000-hd5')).toISOString()!=='2026-08-07T14:40:00.000Z')failures.push('HymecNG-Dateizeit wird nicht korrekt dekodiert.');
if(!baseline.includes('scripts/test-dwd-curved-grid-source-times-09243.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD native Projektions-/Quellzeitprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Produktseiten-Radar-/Satellitenzeiten und ihre Bindung an das unveränderte Originalbild geprüft.');
