import {readFile,stat} from 'node:fs/promises';

const [app,flight,cross,styles,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/FlightMeteorologyPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/CrossSectionPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "const LazyFlightMeteorology=lazy(()=>import('./FlightMeteorologyPanel'))",
 'id="flight-meteorology" title="Flugmeteorologie"',
 'summary="Meteogramme · Cross Section: To be continued"',
 '<MemoLazyFlightMeteorology'
])need('App-Integration',app,token);
if(app.includes('Flugwetter-Cross-Section')||app.includes('flugmeteorologische Cross Sections'))failures.push('Deaktivierte Cross-Section wird weiterhin als aktive Datenquelle/Funktion ausgewiesen.');
if(app.includes("const LazyMeteogram=lazy(()=>import('./MeteogramPanel'))"))failures.push('Das Meteogramm ist weiterhin als eigenständiges Hauptmodul verdrahtet.');
for(const token of [
 'function CrossSectionFuture()',
 'Cross Section',
 'To be continued',
 'Die Funktion ist vorerst deaktiviert',
 'title="Meteogramme"',
 "const LazyMeteogram=lazy(()=>import('./MeteogramPanel'))",
 '<LazyMeteogram lat={lat} lon={lon}'
])need('Flugmeteorologie-Gruppierung',flight,token);
if(flight.includes("import CrossSectionPanel from './CrossSectionPanel'"))failures.push('Das aktive Flugmeteorologie-Modul importiert CrossSectionPanel weiterhin.');
if(flight.includes('<CrossSectionPanel/>'))failures.push('CrossSectionPanel wird weiterhin gerendert.');
for(const token of [
 "const ROUTE_KEY='mid:flightCrossSection:route'",
 "fetchWorkerJson<CrossSectionData>('flight-cross-section'",
 '<CrossSectionGraphic data={data}/>',
 'MID CROSS SECTION'
])need('Archivierter Cross-Section-Code',cross,token);
for(const token of [
 '.flight-meteorology{',
 '.flight-subsection{',
 '.flight-future-feature{',
 '.flight-cross-stage{',
 '@media(max-width:760px)'
])need('Cross-Section-Design',styles,token);
for(const token of [
 'const FLIGHT_CROSS_SECTION_ENABLED=false;',
 "status:'to-be-continued'",
 "mode==='flight-cross-section'",
 'if(!FLIGHT_CROSS_SECTION_ENABLED)'
])need('Worker-Deaktivierung',worker,token);
if(worker.includes("'pressure-level-meteogram','flight-cross-section'"))failures.push('Health-Endpunkt weist Cross Section weiterhin als aktiven Dienst aus.');
need('Package-Test',pkg,'test:flight-meteorology');
need('Baseline-Test',baseline,'scripts/test-flight-meteorology-08180.mjs');
for(const file of ['../src/FlightMeteorologyPanel.tsx','../src/CrossSectionPanel.tsx']){try{await stat(new URL(file,import.meta.url))}catch{failures.push(`Moduldatei fehlt: ${file}`)}}
if(failures.length){console.error('Flugmeteorologie-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Flugmeteorologie geprüft: Meteogramme bleiben aktiv; Cross Section ist als „To be continued“ sichtbar, aus dem aktiven Frontendpfad entfernt und serverseitig ohne Upstream-Abrufe gesperrt.');
