import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(a,t,x)=>{if(!t.includes(x))failures.push(`${a}: ${x}`)};const forbid=(a,t,x)=>{if(t.includes(x))failures.push(`${a}: unerlaubt ${x}`)};
for(const token of ['plotBottom=height-margin.bottom-xAxisHeight','tickStep=data.length>1?plotWidth/Math.max(1,data.length-1):plotWidth','cellSlotWidth=data.length>1?tickStep:plotWidth','hazardY=Math.max(plotTop+8,cellY-20)','const centerX=Math.round(((data.length>1?plotLeft+row.x*tickStep:plotLeft+plotWidth/2))*2)/2'])need('Hochformat-Plotbindung',panel,token);
if(!/cellLift=xAxisHeight>=60\?Math\.max\(30,cellHeight\*2\.05\):Math\.max\(20,cellHeight\*1\.7\)/.test(panel))failures.push('Hochformat-Plotbindung: cellLift-Reserve fehlt.');
if(!/cellY=Math\.max\(plotTop\+10,plotBottom-cellHeight-cellLift\)/.test(panel))failures.push('Hochformat-Plotbindung: cellY-Reserve fehlt.');
if(!/cellWidth=Math\.max\(10,Math\.min\(cellSlotWidth\*\.54,cellSlotWidth-6\)\)/.test(panel))failures.push('Hochformat-Plotbindung: cellWidth-Geometrie fehlt.');
for(const token of ['<ReferenceArea','<ReferenceDot','function EnsembleLegacyWeatherBand'])forbid('Hochformat-Plotbindung',panel,token);
for(const token of ['width:min(276px,calc(100vw - 16px))!important','width:min(258px,calc(100vw - 14px))!important'])need('Tooltipgröße',styles,token);
for(const token of ['row.precipVisualLabel','% Best Match','P10–P90'])need('Tooltipinhalt',panel,token);
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(i=>`Parser: ${i.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-portrait-restore'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-portrait-restore-082613.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Hochformat-Wiederherstellung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Hochformat: kompakter Tooltip, sichtbare Datumsachse und achsenzentriertes Wetterband geprüft.');
