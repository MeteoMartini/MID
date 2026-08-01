import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,frame,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/EnsembleChartFrame.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(a,t,x)=>{if(!t.includes(x))failures.push(`${a}: ${x}`)};const count=(t,x)=>t.split(x).length-1;
for(const token of ['<Tooltip content={<TrendTooltip','<Tooltip content={<RainTooltip','<Tooltip content={<WindTooltip','function EnsembleTemperatureWeatherOverlay','<EnsemblePrecipShape','<EnsembleHazardShape','precipVisualType','SunshineScaleLegend'])need('Vollständige Ensemble-Funktion',panel,token);
if(count(panel,'<ComposedChart')!==3)failures.push(`Erwartet drei Ensemble-Diagramme, gefunden ${count(panel,'<ComposedChart')}.`);
if(count(panel,'ticks={data.map(row=>row.x)}')!==2||count(panel,'ticks={d.map(row=>row.x)}')!==1)failures.push('Die drei Diagramme verwenden nicht dieselbe Tages-Tickfolge.');
if(count(panel,"domain={[-.5,Math.max(.5,maxDayIndex+.5)]}")!==2||count(panel,"domain={[-.5,Math.max(.5,d.length-.5)]}")!==1)failures.push('Die drei Diagramme verwenden nicht dieselbe halbtägige Randdomäne.');
for(const token of ['rightAxisWidth:compact?42:58','leftAxisWidth:compact?48:62','professionalEnsembleLayout(compactTrendTooltip,exporting)','professionalEnsembleLayout(compact,exporting)','professionalEnsembleLayout(compactChart,exportingKind===\'precipitation\')','const ENSEMBLE_RAIN_EXPORT_CHART_WIDTH=992;','const ENSEMBLE_TEMP_EXPORT_CHART_WIDTH=992;','const ENSEMBLE_WIND_EXPORT_CHART_WIDTH=992;'])need('Vertikale Tagesausrichtung',panel,token);
for(const token of ['.ensemble-temperature-canvas{position:relative;','.ensemble-temperature-weather-overlay.weather{z-index:3}','touch-action:pan-y;'])need('Gemeinsame Plotgeometrie',styles,token);
for(const token of ['ResizeObserver','contentRect.width','cloneElement(children,{width,height,responsive:false','style={{height,minHeight}}','responsive:false'])need('Recharts-3-Liveframe',frame,token);
if(frame.includes('ResponsiveContainer'))failures.push('Der Liveframe hängt erneut von ResponsiveContainer ab.');
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(i=>`Parser: ${i.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-legacy-functionality-alignment'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-legacy-functionality-alignment-08267.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Funktions-/Ausrichtungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Tooltips, Wetter-/Niederschlagsband, Hazardmarker und gemeinsame Tagesgeometrie geprüft.');
