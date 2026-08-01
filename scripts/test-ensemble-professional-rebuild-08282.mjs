import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['type ProfessionalEnsembleLayout','function professionalEnsembleLayout','function ResponsiveEnsembleTooltip','function EnsembleDateAxisTick','cellX=plotLeft+(slotIndex/dayCount)*plotWidth','cellRight=plotLeft+((slotIndex+1)/dayCount)*plotWidth','cellWidth=Math.max(1,cellRight-cellX)','professionalEnsembleLayout(compactTrendTooltip,exporting)','professionalEnsembleLayout(compact,exporting)','professionalEnsembleLayout(compactChart,exportingKind===\'precipitation\')'])if(!panel.includes(token))failures.push(`Professionelle Chart-Engine fehlt: ${token}`);
for(const token of ['professionelle, gemeinsame Ensemble-Chart-Engine','.ensemble-temp-plot,.ensemble-rain-plot,.ensemble-wind-plot{','.ensemble-pro-tooltip{','.ensemble-mobile-tooltip-layer{','.ensemble-date-axis-tick .weekday{'])if(!css.includes(token))failures.push(`Professionelles Chart-CSS fehlt: ${token}`);
if(failures.length){console.error('Professioneller Ensemble-Neuaufbau fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gemeinsame professionelle Ensemble-Chart-Engine für Temperatur, Niederschlag und Wind geprüft.');
