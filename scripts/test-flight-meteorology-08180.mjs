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
 'summary="Streckenbriefing · Meteogramme · Flughöhe/Zeiten"',
 '<MemoLazyFlightMeteorology'
])need('App-Integration',app,token);
for(const token of [
 "const LazyCrossSection=lazy(()=>import('./CrossSectionPanel'))",
 'title="Cross Section · Streckenbriefing"',
 'summary="Gefahren zwischen 2–8 Flugplätzen · Flughöhe · Start/Landung"',
 '<LazyCrossSection/>',
 'title="Meteogramme"',
 "const LazyMeteogram=lazy(()=>import('./MeteogramPanel'))"
])need('Flugmeteorologie-Gruppierung',flight,token);
if(flight.includes('CrossSectionFuture')||flight.includes('To be continued'))failures.push('Die reaktivierte Cross Section enthält noch den Pausen-Platzhalter.');
for(const token of [
 "const ROUTE_KEY='mid:flightCrossSection:route'",
 "fetchWorkerJson<CrossSectionData>('flight-cross-section'",
 'Streckenbriefing erstellen',
 'Wann und in welchem größeren Raum ist etwas zu erwarten?',
 'AMTLICHE / OPERATIVE SIGNALE',
 'Flughöhe',
 'Landung'
])need('Cross-Section-Streckenbriefing',cross,token);
if(cross.includes('CrossSectionGraphic')||cross.includes('html-to-image')||cross.includes('<svg'))failures.push('Die Cross Section enthält weiterhin die alte grafische Vertikalschnitt-Darstellung.');
for(const token of ['.flight-route-briefing{','.flight-route-hazard-list{','.flight-briefing-overview{','@media(max-width:860px)'])need('Streckenbriefing-Design',styles,token);
for(const token of [
 'const FLIGHT_CROSS_SECTION_ENABLED=true;',
 "mode==='flight-cross-section'",
 'flightOfficialBriefing(route,startTime.getTime(),endTime.getTime(),env)',
 "'flight-route-hazard-briefing'",
 "'freezing_level_height'",
 "'visibility'",
 "'cape'"
])need('Worker-Streckenbriefing',worker,token);
need('Package-Test',pkg,'test:flight-meteorology');
need('Baseline-Test',baseline,'scripts/test-flight-meteorology-08180.mjs');
for(const file of ['../src/FlightMeteorologyPanel.tsx','../src/CrossSectionPanel.tsx']){try{await stat(new URL(file,import.meta.url))}catch{failures.push(`Moduldatei fehlt: ${file}`)}}
if(failures.length){console.error('Flugmeteorologie-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Flugmeteorologie geprüft: Cross Section ist als textuelles Streckenbriefing mit Route, Flughöhe, Start/Landung, Modellgefahren und amtlichen Signalen reaktiviert.');
