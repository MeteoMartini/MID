import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['cellSlotWidth=plotWidth/dayCount','cellX=plotLeft+slotIndex*cellSlotWidth','cellWidth=Math.max(1,cellSlotWidth)','centerX=cellX+cellWidth/2','strokeWidth=".8"','<EnsemblePrecipShape cx={centerX}'])if(!panel.includes(token))failures.push(`Wetterband fehlt: ${token}`);
if(panel.includes('inset=Math.min('))failures.push('Alte Zwischenräume zwischen Tageskästchen sind noch vorhanden.');
if(failures.length){console.error('Ensemble-Wetterband-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Nahtloses Sonne-/Wolkenband mit Tageslinien in den Kästchenmitten geprüft.');
