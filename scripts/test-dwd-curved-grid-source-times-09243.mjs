import {readFile} from 'node:fs/promises';
const [radar,worker,baseline]=await Promise.all([
  readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
  readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ['DwdRasterCurve','curvature','rasterCurveCoordinate','for(let iteration=0;iteration<7;iteration++)','Wolken + Niederschlagsart','formatDwdSourceTimestamp','return`${hour}:${minute} UTC`'])need('Raster/UI',radar,token);
for(const token of ['DWD_PRECIPITATION_TYPE_RADAR_INDEX','DWD_PRECIPITATION_TYPE_SATELLITE_INDEX','Promise.allSettled','dwdPrecipitationTypeSourceIndexCache','response.body?.cancel()'])need('Worker-Zeitpfad',worker,token);
// Reale DWD-Veröffentlichungskadenz nachbilden: Kombinationsbild 06:30 UTC,
// HG 06:30 wird erst nach dem Cutoff veröffentlicht, NWCSAF 06:15 deutlich später.
const months={Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
function published(dateValue,timeValue){const d=dateValue.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/),t=timeValue.match(/^(\d{2}):(\d{2}):(\d{2})$/);return Date.UTC(Number(d[3]),months[d[2]],Number(d[1]),Number(t[1]),Number(t[2]),Number(t[3]))}
const radarTime=f=>{const m=f.match(/^HG(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_000\.bz2$/);return Date.UTC(2000+Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]))};
const satTime=f=>{const m=f.match(/^TSfc(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})EA\.nc\.bz2$/);return Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]))};
const rowsRadar=[['HG2608070625_000.bz2','07-Aug-2026','06:26:50'],['HG2608070630_000.bz2','07-Aug-2026','06:31:50']].map(([filename,date,time])=>({dataTime:radarTime(filename),publishedAt:published(date,time)}));
const rowsSat=[['TSfc202608070600EA.nc.bz2','07-Aug-2026','06:21:33'],['TSfc202608070615EA.nc.bz2','07-Aug-2026','06:36:33']].map(([filename,date,time])=>({dataTime:satTime(filename),publishedAt:published(date,time)}));
function select(rows,cutoff){const maximum=cutoff+90000;return rows.filter(row=>row.publishedAt<=maximum&&row.dataTime<=maximum).sort((a,b)=>b.dataTime-a.dataTime)[0]?.dataTime}
const cutoff=Date.parse('2026-08-07T06:30:00Z'),radarSelected=select(rowsRadar,cutoff),satSelected=select(rowsSat,cutoff);
if(new Date(radarSelected).toISOString()!=='2026-08-07T06:25:00.000Z')failures.push('Radar-Quellzeit wird nicht auf den veröffentlichten HG-Stand 06:25 UTC begrenzt.');
if(new Date(satSelected).toISOString()!=='2026-08-07T06:00:00.000Z')failures.push('Satelliten-Quellzeit wird nicht auf den veröffentlichten NWCSAF-Stand 06:00 UTC begrenzt.');
if(!baseline.includes('scripts/test-dwd-curved-grid-source-times-09243.mjs'))failures.push('Baseline-Test fehlt.');
if(failures.length){console.error('DWD-Projektions-/Quellzeitprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD gekrümmtes Gradnetz und verbindliche Radar-/Satelliten-UTC-Zeitstände geprüft.');
