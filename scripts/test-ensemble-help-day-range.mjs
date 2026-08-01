import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel,css,v078]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8'),
 readFile(path.join(root,'src','v078.css'),'utf8')
]);
const failures=[];
for(const token of [
 "document.addEventListener('pointerdown',dismiss,true)",
 "document.addEventListener('keydown',escape)",
 "window.addEventListener('resize',schedule,{passive:true})",
 "window.addEventListener('scroll',schedule,scrollOptions)",
 "setStyle(current=>current.left===next.left&&current.top===next.top",
 'createPortal(',
 'ensemble-help-toolbar',
 'label="14-Tage-Ensemble-Übersicht erklären"',
 'label="Temperaturtrend und Prognoseunsicherheit erklären"',
 'label="Niederschlagsdiagramm erklären"',
 'ⓘ Modellstände',
 'Initialisierung {formatModelRunTime',
 'verfügbar seit {formatAvailabilityTime'
])if(!panel.includes(token))failures.push(`Ensemble-Hilfe/Modellstände fehlt: ${token}`);
for(const token of [
 'currentDay=mappedDays.find(day=>day.date===todayDate)??mappedDays[0]',
 'className="hero-day-range"',
 'Heute Tiefsttemperatur',
 '<small>Tmin</small>',
 '<small>Tmax</small>'
])if(!app.includes(token))failures.push(`Aktuelles Tagesintervall fehlt: ${token}`);
for(const token of ['.ensemble-portal-popover{','.hero-kicker-row{','.hero-day-range .min b{color:','.hero-day-range .max b{color:'])if(!(css+v078).includes(token))failures.push(`Darstellungs-CSS fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Hilfe/Tagesintervall-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Hilfe und Tagesintervall geprüft: Body-Portale, Außenklick/Escape, Modellstände sowie Tmin/Tmax sind geschützt.');
