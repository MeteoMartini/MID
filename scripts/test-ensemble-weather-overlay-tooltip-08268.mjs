import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(a,t,x)=>{if(!t.includes(x))failures.push(`${a}: ${x}`)};const forbid=(a,t,x)=>{if(t.includes(x))failures.push(`${a}: unerlaubt ${x}`)};
for(const token of ['function EnsembleTemperatureWeatherOverlay','cellX=centerX-dayWidth*.46','cellWidth=dayWidth*.92','cellY=plotBottom-cellHeight','hazardY=Math.max(plotTop+8,cellY-16)','<EnsemblePrecipShape','<EnsembleHazardShape','row.precipVisualLabel','% Best Match'])need('Wetterband/Tooltip',panel,token);
for(const token of ['<ReferenceArea','<ReferenceDot','function EnsembleLegacyWeatherBand'])forbid('Wetterband/Tooltip',panel,token);
for(const token of ['width:min(336px,calc(100vw - 24px));','width:min(286px,calc(100vw - 24px));','grid-template-columns:minmax(72px,.85fr) minmax(0,1fr) minmax(0,1fr);','.compact-trend-tooltip .tooltip-meta-line span,.compact-trend-tooltip .tooltip-meta-block span{line-height:1.22;white-space:normal;'])need('Tooltip-CSS',styles,token);
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(i=>`Parser: ${i.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-weather-overlay-tooltip'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-weather-overlay-tooltip-08268.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Wetterband-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Tagesgenaues Sonne-/Wolkenband am unteren Plotrand, Niederschlagssymbole, Hazardmarker und Tooltip-Größe wie v0.8.25.4 geprüft.');
