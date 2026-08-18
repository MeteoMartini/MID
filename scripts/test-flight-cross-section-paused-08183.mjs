import {readFile} from 'node:fs/promises';

const [app,flight,cross,worker,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/FlightMeteorologyPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/CrossSectionPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
need('App',app,'summary="Streckenbriefing · Meteogramme · Flughöhe/Zeiten"');
for(const token of ["lazy(()=>import('./CrossSectionPanel'))",'title="Cross Section · Streckenbriefing"','<LazyCrossSection/>'])need('Reaktivierung',flight,token);
if(flight.includes('To be continued')||flight.includes('flight-future-feature'))failures.push('Pausenkarte ist trotz Reaktivierung noch vorhanden.');
for(const token of ['Streckenbriefing erstellen','Wann und wo ist etwas zu erwarten?','AMTLICHE / OPERATIVE SIGNALE'])need('Briefing',cross,token);
if(cross.includes('CrossSectionGraphic')||cross.includes('PNG')||cross.includes('flight-cross-stage'))failures.push('Grafischer Cross-Section-Vertrag ist wieder aktiv.');
for(const token of ['const FLIGHT_CROSS_SECTION_ENABLED=true;',"flightCrossSection(u,env)","'flight-route-hazard-briefing'"])need('Worker',worker,token);
need('Design',styles,'.flight-route-briefing{');
need('Package',pkg,'test:flight-cross-section-paused');
need('Baseline',baseline,'scripts/test-flight-cross-section-paused-08183.mjs');
if(failures.length){console.error('Cross-Section-Reaktivierung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cross Section reaktiviert: kein Diagramm, sondern zeit-/höhenbezogenes Streckenbriefing mit Modell- und ICAO-Gefahren.');
