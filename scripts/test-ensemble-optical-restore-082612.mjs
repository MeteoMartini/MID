import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const [panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 'function EnsembleLegacyWeatherBand',
 'height:13px;',
 'border-radius:2px;',
 '.ensemble-legacy-precip-glyph{display:block;width:17px;height:14px;',
 '.ensemble-legacy-hazard-badges{position:absolute;',
 'compactPrecipitationTooltipLabel(row)',
 'width:min(372px,calc(100vw - 16px));',
 'white-space:nowrap;'
])need('Optische Wiederherstellung',panel.includes(token)?panel:styles,token);
forbid('Optische Wiederherstellung',panel,'function EnsembleDayWeatherSymbol');
forbid('Optische Wiederherstellung',styles,'.ensemble-weather-strip{');
if(styles.includes('.ensemble-chart-export{content-visibility:auto'))failures.push('Optische Wiederherstellung: unerlaubtes Ensemble-content-visibility.');
if((panel.match(/<ComposedChart/g)??[]).length!==3)failures.push('Nicht alle drei Ensemble-Diagramme sind vorhanden.');
if((panel.match(/isAnimationActive=\{false\}/g)??[]).length<18)failures.push('Die Ensemble-Animationen sind nicht konsequent deaktiviert.');

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline);
if(!parsedPackage.scripts?.['test:ensemble-optical-restore'])failures.push('Package-Testskript fehlt.');
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-optical-restore-082612.mjs'))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Ensemble-Optik-v0.8.25.4-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Optik v0.8.25.4, vollständige Wetter-/Niederschlags-/Hazardebene und Scrollentlastung geprüft.');
