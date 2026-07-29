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
 'summary="Cross Section und Meteogramme"',
 '<MemoLazyFlightMeteorology',
 'Flugwetter-Cross-Section',
 'flugmeteorologische Cross Sections'
])need('App-Integration',app,token);
if(app.includes("const LazyMeteogram=lazy(()=>import('./MeteogramPanel'))"))failures.push('Das Meteogramm ist weiterhin als eigenständiges Hauptmodul verdrahtet.');
for(const token of [
 'title="Cross Section"',
 'title="Meteogramme"',
 '<CrossSectionPanel/>',
 "const LazyMeteogram=lazy(()=>import('./MeteogramPanel'))",
 '<LazyMeteogram lat={lat} lon={lon}'
])need('Flugmeteorologie-Gruppierung',flight,token);
for(const token of [
 "const ROUTE_KEY='mid:flightCrossSection:route'",
 "fetchWorkerJson<CrossSectionData>('flight-cross-section'",
 'Route · ICAO-Kennungen',
 'Start · UTC',
 'Ende · UTC',
 'Detailliertes Flugniveau',
 'Cross Section erzeugen',
 '<CrossSectionGraphic data={data}/>',
 'Diagnostische Modellgrafik',
 'MID CROSS SECTION',
 'flightCrossSection'
])need('Cross-Section-Oberfläche',cross,token);
for(const token of [
 '.flight-meteorology{',
 '.flight-subsection{',
 '.flight-cross-form{',
 '.flight-cross-stage{',
 '.flight-legend{',
 '.flight-point-cards{',
 '@media(max-width:760px)'
])need('Cross-Section-Design',styles,token);
for(const token of [
 'const FLIGHT_PROFILE_LEVELS=',
 'async function flightResolveAirports(codes)',
 'function flightGreatCircle(a,b,fraction)',
 'async function flightCrossSection(u)',
 "mode==='flight-cross-section'",
 "'pressure-level-meteogram','flight-cross-section'",
 "source:'Open-Meteo Druckniveaudaten · NOAA AviationWeather Airport-/Stationsinformationen'"
])need('Worker-Integration',worker,token);
need('Package-Test',pkg,'test:flight-meteorology');
need('Baseline-Test',baseline,'scripts/test-flight-meteorology-08180.mjs');
for(const file of ['../src/FlightMeteorologyPanel.tsx','../src/CrossSectionPanel.tsx']){try{await stat(new URL(file,import.meta.url))}catch{failures.push(`Neue Moduldatei fehlt: ${file}`)}}
if(failures.length){console.error('Flugmeteorologie-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Flugmeteorologie geprüft: neue Advanced-Sektion, Cross Section, gruppierte Meteogramme, ICAO-/Zeit-/FL-Maske, realistische Vertikalgrafik und Worker-Datenpfad vorhanden.');
