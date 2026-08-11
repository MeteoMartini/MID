import {readFile} from 'node:fs/promises';
const [panel,worker,baseline]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)},reject=(where,text,token)=>{if(text.includes(token))failures.push(`${where}: unerwünscht ${token}`)};
// Historische Workerdiagnose darf für spätere Daten-/Parseranalyse bestehen, aber nicht im Komposit aktiviert werden.
for(const token of [
 "const DWD_HYMECNG_LATEST='composite_HymecNG_LATEST_000-hd5'",
 "const DWD_HG_LATEST='HG_LATEST_000.bz2'",
 "sourceMode:'latest-hdf5'",
 "legacyHgAvailable",
 "if(mode==='dwd-hymecng-meta')"
])need('Worker-HymecNG-Diagnose',worker,token);
for(const token of ['Hymec','hymec'])reject('RadarPanel',panel,token);
need('RadarPanel',panel,"precipitationTypeMode:'none'|'radar-model'");
need('RadarPanel',panel,'OPERA-CIRRUS-Echomaske + frischestes geeignetes Rapid-/Regionalmodell als radar-/modellgestützte Phasenklassifikation');
need('Baseline',baseline,'scripts/test-hymecng-direct-latest-hg-fallback-09384.mjs');
if(failures.length){console.error('HymecNG-Diagnose/Radar-Modell-Exklusivität fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('HymecNG ist nur noch diagnostischer Worker-Altpfad; die Komposit-Niederschlagsart bleibt exklusiv OPERA + ICON-D2.');
