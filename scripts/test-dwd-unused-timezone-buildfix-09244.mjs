import {readFile} from 'node:fs/promises';
const [radar,baseline]=await Promise.all([readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];
if(radar.includes("timezone=location.timezone||'Europe/Berlin'"))failures.push('Ungenutzte lokale timezone-Variable ist wieder vorhanden.');
if(!radar.includes('formatDwdSourceTimestamp(meta?.radarAt)'))failures.push('Radar-Zeitstempel verwendet nicht mehr den an das Originalbild gebundenen DWD-Produktseitenstand.');
if(!radar.includes('formatDwdSourceTimestamp(meta?.satelliteAt)'))failures.push('Satelliten-Zeitstempel verwendet nicht mehr die an das Originalbild gebundene DWD-UTC-Quellzeit.');
if(!baseline.includes('scripts/test-dwd-unused-timezone-buildfix-09244.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Zeitstempel-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-Zeitstempel-Buildfix geprüft: keine ungenutzte timezone-Variable und Bildantwort-gebundene UTC-Zeitstände.');
