import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel,css]=await Promise.all([readFile(path.join(root,'src','App.tsx'),'utf8'),readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),readFile(path.join(root,'src','v078.css'),'utf8')]);
const failures=[];
for(const token of [
 "useEffect(()=>{if(!open)return;const dismiss=(event:PointerEvent)",
 "document.addEventListener('pointerdown',dismiss,true)",
 "document.addEventListener('keydown',escape)",
 "window.addEventListener('resize',update)",
 "window.addEventListener('scroll',update,true)",
 'createPortal(<div ref={layer}',
 'ensemble-help-toolbar',
 'label="14-Tage-Ensemble-Übersicht erklären"',
 'label="Temperaturtrend und Prognoseunsicherheit erklären"',
 'label="Niederschlagsdiagramm erklären"'
])if(!panel.includes(token))failures.push(`Portal-/Info-Funktion fehlt: ${token}`);
for(const token of [
 'mappedDays=mapDays(w),todayDate=localDateInZone(w.timezone),currentDay=mappedDays.find(day=>day.date===todayDate)??mappedDays[0]',
 'className="hero-day-range"',
 'Heute Tiefsttemperatur',
 '<small>Tmin</small>',
 '<small>Tmax</small>'
])if(!app.includes(token))failures.push(`Aktuelles Tagesintervall fehlt: ${token}`);
for(const token of ['.ensemble-portal-popover{position:fixed!important;right:auto!important;bottom:auto!important;z-index:6200!important','.hero-kicker-row{','.hero-day-range .min b{color:#63b4ff}', '.hero-day-range .max b{color:#ff8a67}'])if(!css.includes(token))failures.push(`Darstellungs-CSS fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Hilfe/Tagesintervall-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Hilfe und Tagesintervall geprüft: Body-Portale, Außenklick/Escape, responsive Positionierung sowie Tmin/Tmax sind geschützt.');
