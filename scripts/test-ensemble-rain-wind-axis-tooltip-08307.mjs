import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,30,9],atLeast=parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]))||parts.every((value,index)=>value===minimum[index]);
if(!atLeast)failures.push(`Version liegt vor 0.8.30.9: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu ${pkg.version}`);
for(const token of [
 'height:exporting?300:compact?276:292',
 'xAxisHeight:compact?70:66',
 'y={compact?7:9}',
 'data-mid-ensemble-tooltip="true"',
 'data-mid-ensemble-tooltip-layer="true"',
 'if(insideTooltip)return',
 'onClick={close}',
 'tick={<EnsembleDateAxisTick data={data} compact={compact}/>}',
 'tick={<EnsembleDateAxisTick data={d} compact={compactChart}/>}',
 'height={layout.xAxisHeight}',
 'height={rainLayout.xAxisHeight}',
 'rain-vertical-${row.date}',
 'wind-vertical-${row.date}'
])if(!panel.includes(token))failures.push(`Quellvertrag fehlt: ${token}`);
if(panel.includes('function EnsembleExternalDateAxis('))failures.push('Veraltete externe Datumsachse ist noch aktiv.');
for(const token of [
 'MID v0.8.30.9 · einheitliche Recharts-X-Achsen, sichere Tooltip-Schließung und sichtbare Tageslinien',
 '.ensemble-rain-chart-core,',
 '.ensemble-wind-chart-core{',
 'pointer-events:auto!important;'
])if(!css.includes(token))failures.push(`CSS-Vertrag fehlt: ${token}`);
if(failures.length){console.error('MID Niederschlag-/Windachsen-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Native Hochformat-Zeitachsen, klickschließende Tooltips und sichtbare Tagesraster geprüft.');
