import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['function EnsembleDateAxisTick(','className="ensemble-date-axis-tick"','className="weekday"','className="date"','textAnchor="middle"','professionalEnsembleLayout(compact:boolean,exporting=false)'])if(!panel.includes(token))failures.push(`Ensemble-Datumsachse fehlt: ${token}`);
if(panel.includes('rotate(${angle})')||panel.includes('angle=compact?'))failures.push('Veraltete diagonale Datumsachse ist noch vorhanden.');
const layoutUses=(panel.match(/professionalEnsembleLayout\(/g)||[]).length;if(layoutUses<4)failures.push(`Gemeinsame Chart-Engine wird zu selten verwendet: ${layoutUses}`);
if(failures.length){console.error('Ensemble-Datumsachsen-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Einheitliche zweizeilige Ensemble-Tagesachse ohne diagonale Überlagerung geprüft.');
