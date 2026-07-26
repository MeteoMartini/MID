import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel,styles]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8')
]);
const failures=[];
for(const token of [
 "createPortal(<span ref={layerRef}",
 "document.addEventListener('pointerdown',dismiss,true)",
 "document.addEventListener('keydown',escape)",
 "anchorRef.current?.contains(target)||layerRef.current?.contains(target)",
 "window.addEventListener('resize',update)",
 "window.addEventListener('scroll',update,true)",
 'className="model-run-button"',
 'aria-label="Modellstände anzeigen"',
 'Initialisierung {formatModelRunTime',
 'verfügbar seit {formatAvailabilityTime'
])if(!app.includes(token))failures.push(`Globale Info-/Modellstände-Interaktion fehlt: ${token}`);
for(const token of [
 'ensemble-help-toolbar',
 'label="14-Tage-Ensemble-Übersicht erklären"',
 'label="Temperaturtrend und Prognoseunsicherheit erklären"',
 'label="Niederschlagsdiagramm erklären"',
 'className="model-run-button"',
 'aria-label="Modellstände anzeigen"',
 "document.addEventListener('pointerdown',dismiss,true)",
 "buttonRef.current?.contains(target)||tooltipRef.current?.contains(target)",
 "if(event.key==='Escape')onClose()",
 "onClick={event=>{event.preventDefault();event.stopPropagation();onToggle()}}"
])if(!panel.includes(token))failures.push(`Ensemble-Interaktion fehlt: ${token}`);
for(const token of [
 '.ensemble-portal-popover{',
 'z-index:6200!important',
 'pointer-events:auto!important',
 '.app-portal-popover{',
 '.consistency-popover-portal{'
])if(!styles.includes(token))failures.push(`Popover-CSS fehlt: ${token}`);
if(panel.includes('<details ref={ref} open={open} className="model-run-details"'))failures.push('Veralteter nativer Details-Button für Ensemble-Modellstände ist noch aktiv.');
if(app.includes('<details ref={ref} open={open} className="model-run-details"'))failures.push('Veralteter nativer Details-Button für Best-Match-Modellstände ist noch aktiv.');
if(failures.length){console.error('Popover-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Popover-Regression bestanden: Info-Buttons, Modellstände und Konsistenzpunkte verwenden Body-Portale, Außenklick und Escape; Interaktionen im geöffneten Inhalt bleiben erhalten.');
