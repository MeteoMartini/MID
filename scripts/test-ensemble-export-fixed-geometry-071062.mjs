import {readFile} from 'node:fs/promises';
const [ensemble,styles]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "const ENSEMBLE_EXPORT_PLOT_WIDTH=1096",
 "type EnsembleExportKind='temperature'|'precipitation'",
 'function StableChartFrame',
 'cloneElement(children,{width:exportWidth,height})',
 'function waitForStableExportChart',
 "target.querySelector('.ensemble-fixed-chart .recharts-wrapper')",
 'onExportingChange(kind)',
 '[exportingKind,setExportingKind]=useState<EnsembleExportKind|null>(null)',
 "compactTrendTooltip=exporting?false:viewportCompact",
 "compactChart=exportingKind==='precipitation'?false:viewportCompactChart",
 "StableChartFrame exporting={exporting} height={exporting?282:310} exportWidth={ENSEMBLE_TEMP_EXPORT_CHART_WIDTH}",
 "StableChartFrame exporting={exportingKind==='precipitation'} height={250} exportWidth={ENSEMBLE_RAIN_EXPORT_CHART_WIDTH}"
])if(!ensemble.includes(token))failures.push(`Feste Export-Geometrie fehlt: ${token}`);
if((ensemble.match(/isAnimationActive=\{false\}/g)||[]).length<16)failures.push('Nicht alle Ensemble-Flächen und -Linien sind für den Export animationsfrei.');
if((ensemble.match(/<StableChartFrame/g)||[]).length!==2)failures.push('Temperatur- und Niederschlagsdiagramm müssen jeweils genau einen festen Export-Frame verwenden.');
for(const token of [
 'MID v0.7.106.2 – feste Export-Geometrie für Ensemble-Diagramme',
 '.ensemble-chart-export.ensemble-exporting{',
 'contain:none!important',
 '.ensemble-chart-export.ensemble-exporting .ensemble-fixed-chart{',
 'width:1096px!important',
 'width:1000px!important',
 'overflow:hidden'
])if(!styles.includes(token))failures.push(`CSS-Schutz der Export-Geometrie fehlt: ${token}`);
if(failures.length){console.error('Feste Ensemble-Export-Geometrie fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Exportgeometrie geprüft: fester Plot auf Desktop/Mobil, kein Resize-Clip und keine laufende Recharts-Animation.');
