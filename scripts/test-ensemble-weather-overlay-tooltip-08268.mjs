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
 'ensemble-legacy-weather-band${exporting',
 'data.map(row=>',
 'className="ensemble-legacy-weather-cell"',
 '<PrecipitationGlyph type={precipType}',
 'className="ensemble-legacy-hazard-badges"',
 '<EnsembleLegacyWeatherBand data={data} compact={compactTrendTooltip} exporting={exporting}/>',
 'compactPrecipitationTooltipLabel(row)',
 'title={title}'
])need('Sichtbares Ensemble-Wetterband',panel,token);
forbid('Sichtbares Ensemble-Wetterband',panel,'useCartesianScale');
forbid('Sichtbares Ensemble-Wetterband',panel,'ZIndexLayer');
forbid('Sichtbares Ensemble-Wetterband',panel,'<ReferenceArea');
forbid('Sichtbares Ensemble-Wetterband',panel,'<ReferenceDot');
forbid('Sichtbares Ensemble-Wetterband',panel,'function EnsembleDayWeatherSymbol');

for(const token of [
 'MID v0.8.26.12 · Ensemble-Optik v0.8.25.4 mit stabilem Recharts-3-Rahmen',
 '.ensemble-legacy-weather-band{',
 'grid-template-columns:repeat(var(--ensemble-legacy-days),minmax(0,1fr));',
 '.ensemble-legacy-weather-cell{',
 '.ensemble-legacy-hazard-badges{',
 '.compact-trend-tooltip .trend-tooltip-matrix>span,',
 'white-space:nowrap;'
])need('Tooltip-/Wetterband-CSS',styles,token);

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline);
if(!parsedPackage.scripts?.['test:ensemble-weather-overlay-tooltip'])failures.push('Package-Testskript fehlt.');
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-weather-overlay-tooltip-08268.mjs'))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Ensemble-Wetterband-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Schlanke Sonne-/Wolken-Kästchen, Niederschlagssymbolik, Hazardmarker und umbruchfreier Temperatur-Tooltip geprüft.');
