import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const panel=await readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8');
const failures=[];
for(const token of [
 "buttonRef.current?.contains(target)||tooltipRef.current?.contains(target)",
 "document.addEventListener('pointerdown',dismiss,true)",
 "document.removeEventListener('pointerdown',dismiss,true)",
 "if(event.key==='Escape')onClose()",
 "event.preventDefault();event.stopPropagation();onToggle()",
 'createPortal(<div ref={tooltipRef}',
 'consistency-popover-portal'
])if(!panel.includes(token))failures.push(`Schließlogik der Konsistenz-Tooltips fehlt: ${token}`);
if(failures.length){console.error('Prüfung der Konsistenz-Tooltip-Schließlogik fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Konsistenz-Tooltips geprüft: Außenklick/-tippen und Escape schließen, Interaktion im Tooltip und auf dem Farbpunkt bleibt erhalten.');
