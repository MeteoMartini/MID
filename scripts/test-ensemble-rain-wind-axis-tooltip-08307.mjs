import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,30,8],atLeast=parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]))||parts.every((value,index)=>value===minimum[index]);
if(!atLeast)failures.push(`Version liegt vor 0.8.30.8: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu ${pkg.version}`);
for(const token of [
 'height:exporting?300:compact?276:292',
 'xAxisHeight:compact?70:66',
 'y={compact?7:9}',
 'data-mid-ensemble-tooltip="true"',
 'data-mid-ensemble-tooltip-layer="true"',
 "node.matches('[data-mid-ensemble-tooltip],[data-mid-ensemble-tooltip-layer]')",
 'if(insideTooltip){dismiss();return}',
 'function EnsembleExternalDateAxis(',
 'className="ensemble-day-grid" horizontal={false} vertical',
 'tick={false} height={18}'
])if(!panel.includes(token))failures.push(`Quellvertrag fehlt: ${token}`);
for(const token of [
 'MID v0.8.30.8 · garantierte mobile Datumsachsen, klickschließende Tooltips und echte Tagesraster',
 '.ensemble-rain-chart-core .recharts-surface,',
 '.ensemble-wind-chart-core .recharts-surface{',
 '.ensemble-external-date-axis{',
 '.ensemble-day-grid line{',
 'pointer-events:auto!important;'
])if(!css.includes(token))failures.push(`CSS-Vertrag fehlt: ${token}`);
if(failures.length){
  console.error('MID Niederschlag-/Windachsen-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Garantierte Hochformat-Zeitachsen, klickschließende Tooltips und echte Tagesraster geprüft.');
