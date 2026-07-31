import {readFile} from 'node:fs/promises';
const [ensemble,frame,styles]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsembleChartFrame.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "const ENSEMBLE_EXPORT_WIDTH=1180",
 "const ENSEMBLE_RAIN_EXPORT_CHART_WIDTH=992",
 "const ENSEMBLE_TEMP_EXPORT_CHART_WIDTH=992",
 "const ENSEMBLE_WIND_EXPORT_CHART_WIDTH=992",
 "type EnsembleExportKind='temperature'|'precipitation'|'wind'",
 'function waitForStableExportChart',
 "target.querySelector('.ensemble-fixed-chart .recharts-wrapper')",
 'onExportingChange(kind)',
 '[exportingKind,setExportingKind]=useState<EnsembleExportKind|null>(null)',
 "compactTrendTooltip=exporting?false:viewportCompact",
 "compactChart=exportingKind==='precipitation'?false:viewportCompactChart",
 "EnsembleChartFrame exporting={exporting} height={exporting?282:310} exportWidth={ENSEMBLE_TEMP_EXPORT_CHART_WIDTH}",
 "EnsembleChartFrame exporting={exportingKind==='precipitation'} height={250} exportWidth={ENSEMBLE_RAIN_EXPORT_CHART_WIDTH}",
 "EnsembleChartFrame exporting={exporting} height={exporting?270:292} exportWidth={ENSEMBLE_WIND_EXPORT_CHART_WIDTH}"
])if(!ensemble.includes(token))failures.push(`Feste Export-Geometrie fehlt: ${token}`);
for(const token of ['export function EnsembleChartFrame','cloneElement(children,{width:exportWidth,height,responsive:false})','className="ensemble-fixed-chart"','className="ensemble-responsive-chart"','ResizeObserver','width:size.width','height:size.height','minHeight'])if(!frame.includes(token))failures.push(`Modularer Export-/Live-Frame fehlt: ${token}`);
if(frame.includes('ResponsiveContainer'))failures.push('Der Recharts-3-Livepfad darf nicht mehr vom kollabierenden ResponsiveContainer abhängen.');
if((ensemble.match(/isAnimationActive=\{false\}/g)||[]).length<16)failures.push('Nicht alle Ensemble-Flächen und -Linien sind für den Export animationsfrei.');
if((ensemble.match(/<EnsembleChartFrame/g)||[]).length!==3)failures.push('Temperatur-, Niederschlags- und Winddiagramm müssen jeweils genau einen festen Export-Frame verwenden.');
for(const token of [
 'MID v0.7.106.2 – feste Export-Geometrie für Ensemble-Diagramme',
 '.ensemble-chart-export.ensemble-exporting{',
 'contain:none!important',
 '.ensemble-chart-export.ensemble-exporting .ensemble-fixed-chart{',
 'width:1096px!important',
 'width:992px!important',
 'overflow:hidden'
])if(!styles.includes(token))failures.push(`CSS-Schutz der Export-Geometrie fehlt: ${token}`);
if(failures.length){console.error('Feste Ensemble-Export-Geometrie fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Exportgeometrie geprüft: modularer fester Plot auf Desktop/Mobil, kein Resize-Clip und keine laufende Recharts-Animation.');
