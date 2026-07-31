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
 'function EnsembleLegacyWeatherBand',
 'data.map(row=>',
 'className="ensemble-legacy-weather-cell"',
 'className="ensemble-legacy-hazard-badges"',
 '<PrecipitationGlyph type={precipType}',
 '<EnsembleLegacyWeatherBand data={data} compact={compactTrendTooltip} exporting={exporting}/>',
 "'--ensemble-legacy-days':String(Math.max(1,data.length))",
 "'--ensemble-legacy-left':`${marginLeft+leftAxis}px`",
 "'--ensemble-legacy-right':`${marginRight+rightAxis}px`"
])need('Wetterband',panel,token);
forbid('Wetterband',panel,'useCartesianScale');
forbid('Wetterband',panel,'ZIndexLayer');
forbid('Wetterband',panel,'accessibilityLayer');

for(const token of [
 '.ensemble-legacy-weather-band{',
 'position:absolute;',
 'grid-template-columns:repeat(var(--ensemble-legacy-days),minmax(0,1fr));',
 '.ensemble-legacy-hazard-badges{position:absolute;',
 'touch-action:pan-y;',
 '.ensemble-responsive-chart{position:relative;'
])need('Darstellung/Performance',styles,token);
if(styles.includes('.ensemble-chart-export{content-visibility:auto'))failures.push('Darstellung/Performance: unerlaubtes Ensemble-content-visibility.');
for(const token of ['ResizeObserver(entries=>','entry.contentRect.width','entry.contentRect.height'])need('Resize-Performance',frame,token);
forbid('Resize-Performance',frame,"window.addEventListener('orientationchange'");

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline);
if(!parsedPackage.scripts?.['test:ensemble-visual-scroll'])failures.push('Package-Testskript fehlt.');
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-visual-scroll-regression-082610.mjs'))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Ensemble-Darstellungs-/Scrollprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Schlankes Ensemble-Wetterband, Niederschlagssymbole, Hazardmarker, einzeiliger Tooltip und mobile Scrollentlastung geprüft.');
