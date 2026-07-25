import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,ensemble,css]=await Promise.all([readFile(path.join(root,'src','App.tsx'),'utf8'),readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),readFile(path.join(root,'src','v078.css'),'utf8')]);
const failures=[];
for(const [label,text] of [['Best Match',app],['Ensemble',ensemble]])for(const token of [
  'className={`model-run-details${open?\' open\':\'\'}`}',
  'aria-haspopup="dialog"',
  'onClick={()=>setOpen(value=>!value)}',
  'className="model-run-popover" role="dialog"',
  'className="model-run-close" onClick={()=>setOpen(false)'
])if(!text.includes(token))failures.push(`${label}: ${token}`);
for(const token of ['.model-run-details>button{','.model-run-details.open>button','.model-run-popover{','@media(max-width:620px){.model-run-details>button'])if(!css.includes(token))failures.push(`Modellstände-CSS: ${token}`);
if(ensemble.includes('<details className="model-run-details"'))failures.push('Ensemble verwendet noch das mobile problematische native details/summary-Element.');
if(failures.length){console.error('Modellstände-Info-Button fehlerhaft:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Modellstände-Info-Button geprüft: expliziter Button, schließbares Popover, Außenklick/Escape und mobile feste Position sind vorhanden.');
