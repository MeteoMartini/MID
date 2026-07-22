import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

for(const token of [
 "const STANDARD_LAYOUT_INITIALIZED_KEY='mid:standardLayoutInitialized'",
 "collapseStoredStandardModules()",
 "localStorage.setItem('mid:forecastDetailsOpen','0')",
 "layoutMode==='advanced'&&<><CollapsibleModule",
 'title="Meteogramm"',
 'title="Widget- und PNG-Generator"',
 'label="Quellen anzeigen"',
 'trigger={<><Info size={13}/><span>Quellen</span></>}',
 "document.addEventListener('pointerdown',outside,true)",
 "document.addEventListener('touchstart',outside"
])if(!app.includes(token))failures.push(`Erwartete Umsetzung fehlt: ${token}`);

if(app.includes('Ortsname aus Geodatenbank'))failures.push('Der Hinweis „Ortsname aus Geodatenbank“ ist weiterhin sichtbar.');
if(app.includes('className="data-disclaimer"'))failures.push('Die Quellen werden weiterhin als dauerhaft sichtbarer Disclaimer ausgegeben.');
for(const token of ['.app>footer>.mode-info>button','.app>footer>.mode-info-popover'])if(!styles.includes(token))failures.push(`Quellen-Popover-CSS fehlt: ${token}`);

if(failures.length){console.error('Standard-/Erweitert-Inhaltsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Standard-/Erweitert-Inhalte geprüft: Erststartmodule sind eingeklappt, Meteogramm und Widget/PNG bleiben dem erweiterten Modus vorbehalten, Quellen öffnen als schließbares Fußzeilen-Popover.');
