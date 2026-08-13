import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [portal,info,app,cockpit,event,styles,contract]=await Promise.all([
 read('src/AppPortalPopover.tsx'),read('src/AppInfoPopover.tsx'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('src/EventPlannerPanel.tsx'),read('src/styles.css'),read('MID_UI_ARCHITECTURE_CONTRACT.md')
]);
const failures=[];
for(const token of [
 "createPortal(<div ref={layerRef}",
 "document.addEventListener('pointerdown',dismiss,true)",
 "document.addEventListener('keydown',escape)",
 "window.addEventListener('resize',schedule",
 "window.addEventListener('scroll',schedule,scrollOptions)",
 "if(dy>72&&Math.abs(dy)>Math.abs(dx)*1.35)onClose()",
 "role={role}",
 "aria-label={ariaLabel}"
])if(!portal.includes(token))failures.push(`Gemeinsame Portalprimitive unvollständig: ${token}`);
for(const token of ["import {AppPortalPopover} from './AppPortalPopover';",'aria-haspopup="dialog"','<AppPortalPopover anchorRef={buttonRef}'])if(!info.includes(token))failures.push(`AppInfoHint folgt dem Portalvertrag nicht: ${token}`);
if(app.includes('function PortalPopover('))failures.push('App.tsx enthält wieder eine lokale generische PortalPopover-Kopie.');
for(const token of ["import {AppPortalPopover as PortalPopover} from './AppPortalPopover';","import {AppInfoHint as InfoHint} from './AppInfoPopover';"])if(!app.includes(token))failures.push(`App verwendet die gemeinsame UI-Primitive nicht: ${token}`);
if(cockpit.includes("import {createPortal} from 'react-dom'"))failures.push('ForecastCockpit besitzt erneut eine eigene generische Portal-Engine.');
for(const token of ["import {AppPortalPopover} from './AppPortalPopover';",'className="cockpit-model-run-popover"','className="consistency-popover consistency-popover-portal cockpit-consistency-popover"'])if(!cockpit.includes(token))failures.push(`ForecastCockpit ist nicht auf die gemeinsame Portalprimitive standardisiert: ${token}`);
for(const token of ['AppInfoHint label="Informationen zum Eventplaner"','AppInfoHint label="Informationen zum Stundenverlauf"'])if(!event.includes(token))failures.push(`Eventplaner verwendet die appweite Info-Logik nicht: ${token}`);
for(const token of ['--mid-ui-touch','--mid-ui-gap','--mid-ui-card-pad','--mid-ui-radius','.app-portal-popover{overscroll-behavior:contain'])if(!styles.includes(token))failures.push(`Verbindliche UI-Dichte-/Portalregel fehlt: ${token}`);
for(const token of ['eine Funktion – ein kanonischer Pfad','Standardprimitive ist `AppPortalPopover`','Kritische Information darf nie ausschließlich per Hover erreichbar sein','Die appweite Lokal-/Z-Zeit-Einstellung gilt auch für neue Sektionen','Regression als verbindliche Durchsetzung'])if(!contract.includes(token))failures.push(`UI-/Architekturvertrag unvollständig: ${token}`);

const allowedPortalFiles=new Set(['AppPortalPopover.tsx','App.tsx','EnsemblePanel.tsx']);
for(const name of await readdir(path.join(root,'src'))){
 if(!/\.tsx$/.test(name)||allowedPortalFiles.has(name))continue;
 const source=await read(`src/${name}`);
 if(source.includes("from 'react-dom'")&&source.includes('createPortal'))failures.push(`${name}: neue direkte createPortal-Nutzung statt gemeinsamer MID-Primitive.`);
}
const allowedGenericDismiss=new Set(['AppPortalPopover.tsx','useDismissibleLayer.ts','App.tsx','EnsemblePanel.tsx']);
for(const name of await readdir(path.join(root,'src'))){
 if(!/\.(ts|tsx)$/.test(name)||allowedGenericDismiss.has(name))continue;
 const source=await read(`src/${name}`);
 if(source.includes("document.addEventListener('pointerdown'")&&source.includes("document.addEventListener('keydown'"))failures.push(`${name}: generische Außenklick-/Escape-Logik muss über die MID-Primitive laufen.`);
}
if(failures.length){console.error('MID UI-/Architekturvertrag v0.9.50.0 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID UI-/Architekturvertrag v0.9.50.0: gemeinsame Popover-/Info-Primitive, neue-Code-Grenzen, Dichte-, Zeit-, Einheiten- und Sektionsregeln verbindlich geschützt.');
