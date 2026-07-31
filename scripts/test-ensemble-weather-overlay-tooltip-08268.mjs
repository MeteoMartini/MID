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
 'ZIndexLayer,useCartesianScale',
 'function EnsembleWeatherDayLayer',
 'function EnsembleWeatherLayer',
 '<ZIndexLayer zIndex={1800}>',
 "useCartesianScale({x:row.x-.46,y:0},0,'sky')",
 'className="ensemble-sky-box"',
 '<EnsembleSkyGlyph',
 '<PrecipitationGlyph',
 '<EnsembleHazardShape',
 '<EnsembleWeatherLayer data={data}/>',
 'compactPrecipitationTooltipLabel(row)',
 'title={row.precipVisualLabel}'
])need('Sichtbare Recharts-3-Wetterebene',panel,token);
forbid('Sichtbare Recharts-3-Wetterebene',panel,'<ReferenceArea');
forbid('Sichtbare Recharts-3-Wetterebene',panel,'<ReferenceDot');

for(const token of [
 'MID v0.8.26.9 · sichtbare Ensemble-Wetterlage und umbruchfreier Temperatur-Tooltip',
 '.ensemble-weather-layer,.ensemble-weather-day-layer{pointer-events:none}',
 '.ensemble-sky-box{shape-rendering:geometricPrecision',
 '.compact-trend-tooltip .trend-tooltip-matrix>span,',
 'white-space:nowrap;',
 'text-overflow:ellipsis'
])need('Tooltip-/Wetterebenen-CSS',styles,token);

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline);
if(!parsedPackage.scripts?.['test:ensemble-weather-overlay-tooltip'])failures.push('Package-Testskript fehlt.');
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-weather-overlay-tooltip-08268.mjs'))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Ensemble-Wetterebenen-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Sonne-/Wolken-Kästchen, Niederschlagssymbolik, Hazardmarker und umbruchfreier Temperatur-Tooltip geprüft.');
