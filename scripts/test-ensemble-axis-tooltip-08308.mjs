import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,30,9],atLeast=parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]))||parts.every((value,index)=>value===minimum[index]);
if(!atLeast)failures.push(`Version liegt vor 0.8.30.9: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline: ${baseline.releaseVersion}`);
for(const token of [
 'if(insideTooltip)return',
 'onClick={close}',
 'tick={<EnsembleDateAxisTick data={data} compact={compact}/>}',
 'tick={<EnsembleDateAxisTick data={d} compact={compactChart}/>}',
 'height={layout.xAxisHeight}',
 'height={rainLayout.xAxisHeight}',
 'rain-vertical-${row.date}',
 'wind-vertical-${row.date}'
])if(!panel.includes(token))failures.push(`Fehlt: ${token}`);
if(panel.includes('function EnsembleExternalDateAxis('))failures.push('Alte externe Datumsachse ist noch vorhanden.');
for(const token of ['MID v0.8.30.9 · einheitliche Recharts-X-Achsen, sichere Tooltip-Schließung und sichtbare Tageslinien','.ensemble-chart-export .chart.rain,','.ensemble-pro-tooltip{'])if(!css.includes(token))failures.push(`CSS fehlt: ${token}`);
if(failures.length){console.error('MID v0.8.30.9 Achsen-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.8.30.9 Achsen-/Tooltip-Prüfung bestanden.');
