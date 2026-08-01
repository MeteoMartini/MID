import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
if(pkg.version!=='0.8.30.8')failures.push(`Version: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline: ${baseline.releaseVersion}`);
for(const token of ['function EnsembleExternalDateAxis(','grid-template-columns:repeat(var(--ensemble-day-count),minmax(0,1fr))','if(insideTooltip){dismiss();return}','className="ensemble-day-grid" horizontal={false} vertical','tick={false} height={18}','leftAxisWidth={rainLayout.leftAxisWidth+rainLayout.margin.left}','leftAxisWidth={layout.leftAxisWidth+layout.margin.left}'])if(!panel.includes(token)&&!css.includes(token))failures.push(`Fehlt: ${token}`);
for(const token of ['MID v0.8.30.8 · garantierte mobile Datumsachsen','.ensemble-rain-chart-core,','.ensemble-external-date-labels>span{','.ensemble-day-grid line{'])if(!css.includes(token))failures.push(`CSS fehlt: ${token}`);
if(failures.length){console.error('MID v0.8.30.8 Achsen-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.8.30.8 Achsen-/Tooltip-Prüfung bestanden.');
