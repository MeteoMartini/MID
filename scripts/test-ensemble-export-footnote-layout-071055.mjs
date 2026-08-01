import {readFile} from 'node:fs/promises';
const [ensemble,styles]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8')]);
const failures=[];
for(const token of ['function EnsembleExportHeader','function EnsembleExportMeta({models,runs,selection}','className="ensemble-export-chart-body"','EnsembleExportHeader kind="temperature"','EnsembleExportHeader kind="precipitation"','EnsembleExportMeta models={models} runs={runs}',"chartMargin=compactTrendTooltip?{top:10,right:8,left:1,bottom:60}:{top:14,right:26,left:10,bottom:60}","rainChartMargin=compactChart?{top:12,right:8,left:1,bottom:60}:{top:16,right:26,left:10,bottom:60}"])if(!ensemble.includes(token))failures.push(`Ensemble-Export-Struktur fehlt: ${token}`);
if((ensemble.match(/className="ensemble-export-chart-body"/g)||[]).length<2)failures.push('Es müssen mindestens zwei Export-Chart-Wrapper vorhanden sein.');
for(const token of ['.ensemble-export-chart-body','.ensemble-export-footnote','.ensemble-chart-export.ensemble-exporting .ensemble-export-chart-body'])if(!styles.includes(token))failures.push(`Export-Styling fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Export-Fußnote/Layout fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Export geprüft: Fußnoten, Wrapper und einheitliche 60-px-Achsenmargen sind vorhanden.');
