import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
for(const token of ['const ENSEMBLE_RAIN_EXPORT_CHART_WIDTH=992','const ENSEMBLE_TEMP_EXPORT_CHART_WIDTH=992','const ENSEMBLE_WIND_EXPORT_CHART_WIDTH=992','height:exporting?300:compact?252:282'])if(!panel.includes(token))failures.push(`Export-Geometrie fehlt: ${token}`);
const layoutUses=(panel.match(/professionalEnsembleLayout\(/g)||[]).length;if(layoutUses<4)failures.push('Alle drei Charts müssen dieselbe Layout-Engine verwenden.');
if(failures.length){console.error('Ensemble-Exportgeometrie-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Gleiche Exportbreiten und gemeinsame Chart-Höhe geprüft.');
