import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const ensemble=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const dismissible=await readFile(path.join(root,'src','useDismissibleLayer.ts'),'utf8');
const failures=[];

for(const token of ["type LayoutMode='standard'|'advanced'","return stored==='advanced'||stored==='full'?'advanced':'standard'",'Standardmodus','Erweiterter Modus','mode-${layoutMode}','function InfoHint','function ModeExplanation',"advancedMode={layoutMode==='advanced'}"]){
 if(!app.includes(token))failures.push(`Ansichtsmodus fehlt: ${token}`);
}
if(app.includes("layoutMode==='full'")||app.includes("layoutMode==='compact'"))failures.push('Alte Modusabfragen compact/full sind noch aktiv.');
for(const token of ['.mode-info-popover','.mode-standard .hazards>small','.mode-explanation','.app>footer>.mode-info-popover'])if(!styles.includes(token))failures.push(`Modus-CSS fehlt: ${token}`);
for(const source of [app,ensemble])if(!source.includes("useDismissibleLayer(ref,open,()=>setOpen(false))"))failures.push(`Gemeinsame Außenklick-Schließlogik fehlt in ${source===app?'App':'Ensemble'}.`);
for(const token of ["document.addEventListener('pointerdown',onPointerDown,true)","document.addEventListener('keydown',onKeyDown)",'ref.current?.contains(event.target as Node)'])if(!dismissible.includes(token))failures.push(`Gemeinsame Außenklick-Schließlogik unvollständig: ${token}`);
if(!ensemble.includes('advancedMode:boolean')||!ensemble.includes('ModeExplanation advanced={advancedMode}'))failures.push('Ensemble-Erklärungen unterscheiden Standard- und erweiterten Modus nicht.');
if(!app.includes('compactMode advancedMode='))failures.push('Die 7-Tage-Detailansicht bleibt nicht in beiden Modi einklappbar.');

if(failures.length){console.error('Ansichtsmodus-/Popover-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ansichtsmodi geprüft: Standard ist Erststartmodus, Erweitert ergänzt technische Erklärungen bei weiterhin einklappbaren Modulen; Info- und Modellstände-Popover schließen per Pointer-Außenklick und Escape.');
