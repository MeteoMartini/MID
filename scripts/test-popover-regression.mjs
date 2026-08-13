import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,portal,panel,styles,v078]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','AppPortalPopover.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8'),
 readFile(path.join(root,'src','v078.css'),'utf8')
]);
const failures=[];
for(const token of [
 "createPortal(<div ref={layerRef}",
 "document.addEventListener('pointerdown',dismiss,true)",
 "document.addEventListener('keydown',escape)",
 "anchorRef.current?.contains(target)||layerRef.current?.contains(target)",
 "window.addEventListener('resize',schedule",
 "window.addEventListener('scroll',schedule,scrollOptions)",
 'if(!frame)frame=window.requestAnimationFrame(update)'
])if(!portal.includes(token))failures.push(`Gemeinsame globale Portal-Interaktion fehlt: ${token}`);
for(const token of [
 "import {AppPortalPopover as PortalPopover} from './AppPortalPopover';",
 'className="model-run-button"',
 'aria-label="Modellstände anzeigen"',
 'Initialisierung {formatModelRunTime',
 'verfügbar seit {formatAvailabilityTime'
])if(!app.includes(token))failures.push(`Globale Info-/Modellstände-Interaktion fehlt: ${token}`);
for(const token of [
 'function useEnsemblePortal(open:boolean',
 'ensemble-help-toolbar',
 'label="14-Tage-Ensemble-Übersicht erklären"',
 'label="Temperaturtrend und Prognoseunsicherheit erklären"',
 'label="Niederschlagsdiagramm erklären"',
 'className="model-run-popover ensemble-portal-popover"',
 'aria-label="Modellstände der Ensemble-Prognose"',
 "document.addEventListener('pointerdown',dismiss,true)",
 "buttonRef.current?.contains(target)||tooltipRef.current?.contains(target)",
 "if(event.key==='Escape')onClose()",
 "onClick={event=>{event.preventDefault();event.stopPropagation();onToggle()}}"
])if(!panel.includes(token))failures.push(`Ensemble-Interaktion fehlt: ${token}`);
for(const token of ['.ensemble-portal-popover{','z-index:6200!important','pointer-events:auto','.app-portal-popover{','.consistency-popover-portal{'])if(!(styles+v078).includes(token))failures.push(`Popover-CSS fehlt: ${token}`);
if(panel.includes('<details className="model-run-details"'))failures.push('Veralteter nativer Details-Button für Ensemble-Modellstände ist noch aktiv.');
if(app.includes('<details ref={ref} open={open} className="model-run-details"'))failures.push('Veralteter nativer Details-Button für Best-Match-Modellstände ist noch aktiv.');
if(failures.length){console.error('Popover-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Popover-Regression bestanden: gemeinsame App-Portalprimitive sowie Ensemble-Spezialtooltips schließen per Außenklick/Escape und bleiben viewportfest.');
