import {readFile} from 'node:fs/promises';

const [app,flight,worker,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/FlightMeteorologyPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ['summary="Meteogramme · Cross Section: To be continued"'])need('App',app,token);
for(const token of ['function CrossSectionFuture()','To be continued','Die Funktion ist vorerst deaktiviert','className="flight-future-feature"'])need('Future-Card',flight,token);
if(flight.includes("import CrossSectionPanel from './CrossSectionPanel'"))failures.push('CrossSectionPanel wird importiert.');
if(flight.includes('<CrossSectionPanel/>'))failures.push('CrossSectionPanel wird gerendert.');
for(const token of ['const FLIGHT_CROSS_SECTION_ENABLED=false;',"if(mode==='flight-cross-section'){if(!FLIGHT_CROSS_SECTION_ENABLED)","status:'to-be-continued'","},410,{'cache-control':'no-store'}"])need('Worker',worker,token);
if(worker.includes("'pressure-level-meteogram','flight-cross-section'"))failures.push('Cross Section bleibt im Health-Servicekatalog aktiv.');
need('Design',styles,'.flight-future-feature{');
need('Package',pkg,'test:flight-cross-section-paused');
need('Baseline',baseline,'scripts/test-flight-cross-section-paused-08183.mjs');
if(failures.length){console.error('Cross-Section-Pausierung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cross Section pausiert: kein Frontend-Import/-Render, sichtbares „To be continued“, Worker-Endpunkt ohne Upstream-Aufrufe gesperrt.');
