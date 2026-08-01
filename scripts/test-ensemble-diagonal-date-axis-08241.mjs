import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['function EnsembleDateAxisTick(','className="ensemble-date-axis-tick"','className="weekday"','className="date"','textAnchor="end"','angle=compact?-34:-28','transform={`rotate(${angle})`}','professionalEnsembleLayout(compact:boolean,exporting=false)'])if(!panel.includes(token))failures.push(`Ensemble-Datumsachse fehlt: ${token}`);
const layoutUses=(panel.match(/professionalEnsembleLayout\(/g)||[]).length;if(layoutUses<4)failures.push(`Gemeinsame Chart-Engine wird zu selten verwendet: ${layoutUses}`);
if(failures.length){console.error('Ensemble-Datumsachsen-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Einheitliche leicht diagonale Ensemble-Tagesachse für alle Diagramme geprüft.');
