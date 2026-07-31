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
const count=(text,token)=>(text.split(token).length-1);

for(const token of [
 '<Tooltip content={<TrendTooltip',
 '<Tooltip content={<RainTooltip',
 '<Tooltip content={<WindTooltip',
 'function EnsembleLegacyWeatherBand',
 '<PrecipitationGlyph type={precipType}',
 'ensemble-legacy-hazard-badges',
 'precipVisualType',
 'SunshineScaleLegend'
])need('Vollständige Ensemble-Funktion',panel,token);
if(count(panel,'<ComposedChart')!==3)failures.push(`Erwartet drei Ensemble-Diagramme, gefunden ${count(panel,'<ComposedChart')}.`);
if(count(panel,'ticks={data.map(row=>row.x)}')!==2||count(panel,'ticks={d.map(row=>row.x)}')!==1)failures.push('Die drei Diagramme verwenden nicht dieselbe Tages-Tickfolge.');
if(count(panel,"domain={[-.5,Math.max(.5,maxDayIndex+.5)]}")!==2||count(panel,"domain={[-.5,Math.max(.5,d.length-.5)]}")!==1)failures.push('Die drei Diagramme verwenden nicht dieselbe halbtägige Randdomäne.');
for(const token of [
 'width={compactTrendTooltip?40:58}',
 'width={compactChart?40:58}',
 'width={compact?40:58}',
 'const ENSEMBLE_RAIN_EXPORT_CHART_WIDTH=992;',
 'const ENSEMBLE_TEMP_EXPORT_CHART_WIDTH=992;',
 'const ENSEMBLE_WIND_EXPORT_CHART_WIDTH=992;'
])need('Vertikale Tagesausrichtung',panel,token);
for(const token of [
 'MID v0.8.26.12 · Ensemble-Optik v0.8.25.4 mit stabilem Recharts-3-Rahmen',
 '.ensemble-temp-chart-stage{',
 '.ensemble-legacy-weather-band{',
 'grid-template-columns:repeat(var(--ensemble-legacy-days),minmax(0,1fr));',
 'touch-action:pan-y;'
])need('Gemeinsame Plotgeometrie',styles,token);
for(const token of ['ResizeObserver','contentRect.width','width:size.width','height:size.height','responsive:false'])need('Recharts-3-Liveframe',frame,token);
if(frame.includes('ResponsiveContainer'))failures.push('Der Liveframe hängt erneut von ResponsiveContainer ab.');
if(panel.includes('accessibilityLayer'))failures.push('Die zusätzliche Recharts-DOM-Schicht bremst mobiles Scrollen erneut aus.');
if(panel.includes('useCartesianScale')||panel.includes('ZIndexLayer'))failures.push('Experimentelle Recharts-Skalenhooks sind wieder aktiv.');

const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);
if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`Parser: ${item.messageText}`));
const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline);
if(!parsedPackage.scripts?.['test:ensemble-legacy-functionality-alignment'])failures.push('Package-Testskript fehlt.');
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-legacy-functionality-alignment-08267.mjs'))failures.push('Baseline-Regression fehlt.');

if(failures.length){console.error('Ensemble-Funktions-/Ausrichtungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Tooltips, schlankes Wetter-/Niederschlagsband, Hazardmarker, flüssiger Recharts-3-Liveframe und gemeinsame Tagesgeometrie geprüft.');
