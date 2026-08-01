import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(a,t,x)=>{if(!t.includes(x))failures.push(`${a}: ${x}`)};const forbid=(a,t,x)=>{if(t.includes(x))failures.push(`${a}: unerlaubt ${x}`)};
for(const token of ['function EnsembleTemperatureWeatherOverlay','tickStep=data.length>1?plotWidth/Math.max(1,data.length-1):plotWidth','cellSlotWidth=data.length>1?tickStep:plotWidth','hazardY=Math.max(plotTop+8,cellY-20)','<EnsemblePrecipShape','<EnsembleHazardShape','row.precipVisualLabel','% Best Match'])need('Wetterband/Tooltip',panel,token);
if(!/cellWidth=Math\.max\(10,Math\.min\(cellSlotWidth\*\.54,cellSlotWidth-6\)\)/.test(panel))failures.push('Wetterband/Tooltip: cellWidth-Geometrie fehlt.');
if(!/cellLift=xAxisHeight>=60\?Math\.max\(30,cellHeight\*2\.05\):Math\.max\(20,cellHeight\*1\.7\)/.test(panel))failures.push('Wetterband/Tooltip: cellLift-Reserve fehlt.');
if(!/cellY=Math\.max\(plotTop\+10,plotBottom-cellHeight-cellLift\)/.test(panel))failures.push('Wetterband/Tooltip: cellY-Reserve fehlt.');
for(const token of ['<ReferenceArea','<ReferenceDot','function EnsembleLegacyWeatherBand'])forbid('Wetterband/Tooltip',panel,token);
for(const token of ['width:min(276px,calc(100vw - 16px))!important','grid-template-columns:minmax(56px,.72fr) minmax(0,1fr) minmax(0,1fr)!important','.compact-trend-tooltip .tooltip-meta-line{grid-template-columns:max-content minmax(0,1fr)!important;gap:1px 6px!important;align-items:start}'])need('Tooltip-CSS',styles,token);
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(i=>`Parser: ${i.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-weather-overlay-tooltip'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-weather-overlay-tooltip-08268.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Wetterband-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Tagesgenaues Sonne-/Wolkenband mit freier Datumsachse, Niederschlagssymbole, Hazardmarker und verdichteter Tooltip geprüft.');
