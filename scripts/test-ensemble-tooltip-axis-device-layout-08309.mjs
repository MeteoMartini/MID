import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
function versionAtLeast(value,minimum){const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length,4);i++){const av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv}return true}
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const need=(scope,text,token)=>{if(!text.includes(token))failures.push(`${scope}: ${token}`)};
const forbid=(scope,text,token)=>{if(text.includes(token))failures.push(`${scope}: unerlaubt ${token}`)};
for(const token of [
  'onDismiss:()=>void',
  'title="Zum Schließen antippen"',
  'onClick={close}',
  'if(insideTooltip)return',
  'onDismiss={tooltip.dismiss}',
  'onDismiss={rainTooltip.dismiss}',
  'tooltipActive:suppressed?false:undefined',
  'active={desktop.finePointer?false:tooltip.tooltipActive}',
  'active={rainDesktop.finePointer?false:rainTooltip.tooltipActive}',
  'onClick={tooltip.prepareOpen}',
  'onClick={rainTooltip.prepareOpen}'
])need('Tooltip-Schließung',panel,token);
for(const token of [
  'tick={<EnsembleDateAxisTick data={data} compact={compact}/>}',
  'height={layout.xAxisHeight}',
  'tick={<EnsembleDateAxisTick data={d} compact={compactChart}/>}',
  'height={rainLayout.xAxisHeight}',
  '<span className="ensemble-rain-axis-title ensemble-rain-axis-title-bottom">Vorhersagetag</span>',
  '<span className="ensemble-wind-axis-title ensemble-wind-axis-title-bottom">Vorhersagetag</span>'
])need('Einheitliche X-Achse',panel,token);
for(const token of [
  'rain-vertical-${row.date}',
  'wind-vertical-${row.date}',
  'ensemble-major-grid-line vertical ensemble-front-grid-line'
])need('Tageshilfslinien',panel,token);
forbid('Einheitliche X-Achse',panel,'function EnsembleExternalDateAxis(');
for(const token of [
  'MID v0.8.30.9 · einheitliche Recharts-X-Achsen, sichere Tooltip-Schließung und sichtbare Tageslinien',
  '.ensemble-chart-export .chart.rain,',
  'height:auto!important;',
  'grid-template-rows:auto 30px!important;',
  'pointer-events:auto!important;',
  '@media(max-width:620px)'
])need('Geräte-/Formatlayout',css,token);

const deviceMatrix=[
 {name:'iPhone Hochformat 390 px',viewport:390,outer:34,left:34,right:38,minPlot:280,chartHeight:276,xAxisHeight:70},
 {name:'iPhone Querformat 844 px',viewport:844,outer:48,left:36,right:44,minPlot:680,chartHeight:292,xAxisHeight:66},
 {name:'Desktop 1366 px',viewport:1366,outer:72,left:36,right:44,minPlot:1200,chartHeight:292,xAxisHeight:66}
];
for(const device of deviceMatrix){const plotWidth=device.viewport-device.outer-device.left-device.right,plotHeight=device.chartHeight-device.xAxisHeight-22;if(plotWidth<device.minPlot)failures.push(`${device.name}: Plotbreite ${plotWidth}px < ${device.minPlot}px`);if(plotHeight<170)failures.push(`${device.name}: Plothoehe ${plotHeight}px zu klein`)}

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${ts.flattenDiagnosticMessageText(item.messageText,'\n')}`));
if(!versionAtLeast(pkg.version,'0.8.30.9'))failures.push(`package.json: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != package ${pkg.version}`);
if(failures.length){console.error('Ensemble-Tooltip-/Achsen-/Gerätelayout-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Tooltip-Schließung, einheitliche X-Achsen, Tageshilfslinien und Hoch-/Querformatverträge geprüft.');
