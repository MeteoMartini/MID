import {readFile} from 'node:fs/promises';
const [ensemble,styles]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 'function EnsembleExportHeader',
 'function EnsembleExportMeta({models,runs,selection}',
 'className="ensemble-export-chart-body"',
 'EnsembleExportHeader kind="temperature"',
 'EnsembleExportHeader kind="precipitation"',
 'EnsembleExportMeta models={models} runs={runs}',
 "chartMargin=compactTrendTooltip?{top:10,right:8,left:1,bottom:32}:{top:14,right:26,left:10,bottom:36}",
 "rainChartMargin=compactChart?{top:10,right:8,left:1,bottom:32}:{top:16,right:26,left:10,bottom:36}"
])if(!ensemble.includes(token))failures.push(`Ensemble-Export-Struktur fehlt: ${token}`);
if((ensemble.match(/className="ensemble-export-chart-body"/g)||[]).length<2)failures.push('Es müssen zwei Export-Chart-Wrapper vorhanden sein.');
for(const token of ['.ensemble-export-chart-body','.ensemble-export-footnote','.ensemble-chart-export.ensemble-exporting .ensemble-export-chart-body'])if(!styles.includes(token))failures.push(`Export-Styling fehlt: ${token}`);
const tempStart=ensemble.indexOf('<div ref={temperatureExportRef} className="ensemble-chart-export">');
if(tempStart>=0){
 const tempEnd=ensemble.indexOf('<div ref={rainExportRef} className="ensemble-chart-export">',tempStart);
 const block=ensemble.slice(tempStart,tempEnd>0?tempEnd:undefined);
 const chartPos=block.indexOf('className="ensemble-export-chart-body"');
 const footPos=block.indexOf('<EnsembleExportMeta models={models} runs={runs}');
 if(!(chartPos>=0&&footPos>chartPos))failures.push('Temperatur-Export muss Metadaten als Fußnote unter dem Diagramm rendern.');
}
if(failures.length){
 console.error('Ensemble-Export-Fußnote/Layout fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Ensemble-Export geprüft: Fußnote unter Diagramm, Export-Wrapper vorhanden, Margen exportstabil angepasst.');
