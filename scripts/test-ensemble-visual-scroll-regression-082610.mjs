import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const [panel,frame,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsembleChartFrame.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 'function EnsembleWeatherStrip',
 'data.map(row=>',
 'className="ensemble-weather-cell"',
 '<EnsembleDayWeatherSymbol row={row}/>',
 '<EnsembleHazardBadges hazards={row.hazards}/>',
 '<PrecipitationGlyph type={precipType}',
 '</ComposedChart></EnsembleChartFrame><EnsembleWeatherStrip data={data} compact={compactTrendTooltip} exporting={exporting}/>',
 "'--ensemble-weather-days':String(Math.max(1,data.length))",
 "'--ensemble-weather-left':`${marginLeft+axisWidth}px`",
 "'--ensemble-weather-right':`${marginRight+rightReserve}px`"
])need('Wetterzeile',panel,token);
forbid('Wetterzeile',panel,'useCartesianScale');
forbid('Wetterzeile',panel,'ZIndexLayer');
forbid('Wetterzeile',panel,'accessibilityLayer');

for(const token of [
 '.ensemble-weather-strip{',
 'position:absolute;',
 'z-index:24;',
 'grid-template-columns:repeat(var(--ensemble-weather-days),minmax(0,1fr));',
 '.ensemble-day-hazards{position:absolute;',
 '.compact-trend-tooltip *{white-space:nowrap!important;',
 '.ensemble-chart-export{content-visibility:auto;',
 'touch-action:pan-y;',
 '.ensemble-responsive-chart{contain:layout style;'
])need('Darstellung/Performance',styles,token);
for(const token of ['ResizeObserver(entries=>','entry.contentRect.width','entry.contentRect.height'])need('Resize-Performance',frame,token);
forbid('Resize-Performance',frame,"window.addEventListener('orientationchange'");

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline);
if(!parsedPackage.scripts?.['test:ensemble-visual-scroll'])failures.push('Package-Testskript fehlt.');
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-visual-scroll-regression-082610.mjs'))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Ensemble-Darstellungs-/Scrollprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Wetterkästchen, Niederschlagssymbole, Hazardmarker, einzeiliger Tooltip und mobile Scrollentlastung geprüft.');
