import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(a,t,x)=>{if(!t.includes(x))failures.push(`${a}: ${x}`)},forbid=(a,t,x)=>{if(t.includes(x))failures.push(`${a}: unerlaubt ${x}`)};
for(const token of ['function EnsembleTemperatureWeatherOverlay','dayCount=Math.max(1,data.length)','cellSlotWidth=plotWidth/dayCount','slotLeft=plotLeft+slotIndex*cellSlotWidth','centerX=Math.round((slotLeft+cellSlotWidth/2)*2)/2','hazardY=Math.max(plotTop+8,cellY-20)','<EnsemblePrecipShape','<EnsembleHazardShape','row.precipVisualLabel','% Best Match'])need('Wetterband/Tooltip',panel,token);
if(!/cellWidth=Math\.max\(10,cellSlotWidth-inset\*2\)/.test(panel))failures.push('Wetterband/Tooltip: zusammenhängende cellWidth-Geometrie fehlt.');
if(!/cellLift=xAxisHeight>=60\?Math\.max\(32,cellHeight\*2\.15\):Math\.max\(22,cellHeight\*1\.8\)/.test(panel))failures.push('Wetterband/Tooltip: cellLift-Reserve fehlt.');
if(!/cellY=Math\.max\(plotTop\+10,plotBottom-cellHeight-cellLift\)/.test(panel))failures.push('Wetterband/Tooltip: cellY-Reserve fehlt.');
for(const token of ['<ReferenceArea','<ReferenceDot','function EnsembleLegacyWeatherBand'])forbid('Wetterband/Tooltip',panel,token);
for(const token of ['width:min(276px,calc(100vw - 16px))!important','grid-template-columns:minmax(56px,.72fr) minmax(0,1fr) minmax(0,1fr)!important','.compact-trend-tooltip .tooltip-meta-line{grid-template-columns:max-content minmax(0,1fr)!important;gap:1px 6px!important;align-items:start}'])need('Tooltip-CSS',styles,token);
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(i=>`Parser: ${i.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-weather-overlay-tooltip'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-weather-overlay-tooltip-08268.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Wetterband-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Zusammenhängendes Sonne-/Wolkenband mit mittigen Tageshilfslinien, Niederschlagssymbolen, Hazardmarkern und verdichtetem Tooltip geprüft.');
