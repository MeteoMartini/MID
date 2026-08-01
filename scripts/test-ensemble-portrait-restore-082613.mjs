import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,styles]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8')]);
const failures=[];const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
for(const token of ['plotBottom=height-margin.bottom-xAxisHeight','dayCount=Math.max(1,data.length)','cellSlotWidth=plotWidth/dayCount','slotIndex=clamp(Math.round(row.x),0,dayCount-1)','slotLeft=plotLeft+slotIndex*cellSlotWidth','centerX=Math.round((slotLeft+cellSlotWidth/2)*2)/2','hazardY=Math.max(plotTop+8,cellY-20)'])need('Hochformat-Plotbindung',panel,token);
if(!/cellLift=xAxisHeight>=60\?Math\.max\(32,cellHeight\*2\.15\):Math\.max\(22,cellHeight\*1\.8\)/.test(panel))failures.push('Hochformat-Plotbindung: cellLift-Reserve fehlt.');
if(!/cellWidth=Math\.max\(10,cellSlotWidth-inset\*2\)/.test(panel))failures.push('Hochformat-Plotbindung: zusammenhängende Tageskästchen-Geometrie fehlt.');
for(const token of ['.ensemble-temp-chart-core,.ensemble-rain-chart-core,.ensemble-wind-chart-core{grid-template-rows:minmax(0,1fr) 42px!important','.ensemble-temperature-canvas,.ensemble-temperature-canvas .recharts-wrapper,.ensemble-temperature-canvas .recharts-surface{overflow:visible!important'])need('Hochformat-CSS',styles,token);
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
if(failures.length){console.error('Ensemble-Hochformat-Wiederherstellung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Hochformat geprüft: Tageskästchen bilden zusammenhängende Slots, Hilfslinien liegen mittig und die Achsenreserve bleibt frei.');
