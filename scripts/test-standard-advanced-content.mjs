import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const portal=await readFile(path.join(root,'src','AppPortalPopover.tsx'),'utf8');
const flight=await readFile(path.join(root,'src','FlightMeteorologyPanel.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of [
 "const STANDARD_LAYOUT_INITIALIZED_KEY='mid:standardLayoutInitialized'",
 "collapseStoredStandardModules()",
 "localStorage.setItem('mid:forecastDetailsOpen','0')",
 "layoutMode==='advanced'&&<><CollapsibleModule",
 'title="Flugmeteorologie"',
 'title="Widget- und PNG-Generator"',
 'label="Quellen anzeigen"',
 'trigger={<><Info size={13}/><span>Quellen</span></>}',
])if(!app.includes(token))failures.push(`Erwartete Umsetzung fehlt: ${token}`);
for(const token of ["document.addEventListener('pointerdown',dismiss,true)","document.addEventListener('keydown',escape)",'anchorRef.current?.contains(target)||layerRef.current?.contains(target)','createPortal(<div ref={layerRef}'])if(!portal.includes(token))failures.push(`Gemeinsame Portalumsetzung fehlt: ${token}`);
for(const token of ['function CrossSectionFuture()','To be continued','title="Meteogramme"',"lazy(()=>import('./MeteogramPanel'))"])if(!flight.includes(token))failures.push(`Flugmeteorologie-Gruppierung fehlt: ${token}`);
if(flight.includes("import CrossSectionPanel from './CrossSectionPanel'")||flight.includes('<CrossSectionPanel/>'))failures.push('Cross Section ist trotz Pausierung weiterhin aktiv eingebunden.');

if(app.includes('Ortsname aus Geodatenbank'))failures.push('Der Hinweis „Ortsname aus Geodatenbank“ ist weiterhin sichtbar.');
if(app.includes('className="data-disclaimer"'))failures.push('Die Quellen werden weiterhin als dauerhaft sichtbarer Disclaimer ausgegeben.');
for(const token of ['.app>footer>.mode-info>button','.app>footer>.mode-info-popover'])if(!styles.includes(token))failures.push(`Quellen-Popover-CSS fehlt: ${token}`);

if(failures.length){console.error('Standard-/Erweitert-Inhaltsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Standard-/Erweitert-Inhalte geprüft: Erststartmodule sind eingeklappt, Flugmeteorologie mit aktivem Meteogramm und pausierter Cross Section sowie Widget/PNG bleibt dem erweiterten Modus vorbehalten, Quellen öffnen als schließbares Fußzeilen-Popover.');
