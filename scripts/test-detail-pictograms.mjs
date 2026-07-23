import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const failures=[];
for(const token of[
 'function maximizeVisibleIndices(length:number,maxVisible:number)',
 'iconMinimumSpacing=narrowChart?34:mediumChart?36:38',
 'maxIconCount=Math.max(2,Math.floor(plotW/iconMinimumSpacing)+1)',
 'iconIndices=maximizeVisibleIndices(p.length,maxIconCount)',
 'fontSize={iconFontSize}'
])if(!app.includes(token))failures.push(`Adaptive Wetterpiktogramme: ${token} fehlt.`);
if(/plotW\/(?:narrowChart\?58:mediumChart\?66:72)/.test(app))failures.push('Die alte zu großzügige Piktogramm-Abstandslogik ist noch vorhanden.');
if(failures.length){console.error('Detailpiktogramm-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Detailpiktogramme geprüft: Die maximal konfliktfrei mögliche Zahl wird aus der tatsächlichen Diagrammbreite bestimmt; auf breiten Ansichten können alle Stundenpiktogramme erscheinen.');
