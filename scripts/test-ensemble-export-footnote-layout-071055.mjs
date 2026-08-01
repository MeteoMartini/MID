import {readFile} from 'node:fs/promises';
const [ensemble,styles]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8')]);
const failures=[];
for(const token of ['function EnsembleExportHeader','function EnsembleExportMeta({models,runs,selection}','className="ensemble-export-chart-body"','EnsembleExportHeader kind="temperature"','EnsembleExportHeader kind="precipitation"','EnsembleExportMeta models={models} runs={runs}','professionalEnsembleLayout(compact:boolean,exporting=false)','layout=professionalEnsembleLayout(compactTrendTooltip,exporting)','rainLayout=professionalEnsembleLayout(compactChart,exportingKind===\'precipitation\')'])if(!ensemble.includes(token))failures.push(`Ensemble-Export-Struktur fehlt: ${token}`);
if((ensemble.match(/className="ensemble-export-chart-body"/g)||[]).length<2)failures.push('Es müssen mindestens zwei Export-Chart-Wrapper vorhanden sein.');
for(const token of ['.ensemble-export-chart-body','.ensemble-export-footnote','.ensemble-chart-export.ensemble-exporting .ensemble-export-chart-body'])if(!styles.includes(token))failures.push(`Export-Styling fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Export-Fußnote/Layout fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Export geprüft: Fußnoten, Wrapper und gemeinsame professionelle Achsen- und Diagrammgeometrie sind vorhanden.');
