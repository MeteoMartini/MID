import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const minimum=[0,8,28,1],parts=String(pkg.version).split('.').map(Number),atLeast=parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]))||parts.every((value,index)=>value===minimum[index]);
if(!atLeast)failures.push(`Version liegt vor 0.8.28.1: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu ${pkg.version}.`);
for(const token of [
 'function useDismissibleChartTooltip()',
 'trigger="click"',
 'isAnimationActive={false}',
 'cursor={false}',
 'active={tooltip.dismissed?false:undefined}',
 'active={rainTooltip.dismissed?false:undefined}',
 'onPointerDownCapture={tooltip.reopen}',
 'onPointerDownCapture={rainTooltip.reopen}',
 "row.precipVisualLabel.replace(/\\s*Best Match/g,'')",
 'angle=compact?-34:-28',
 'leftAxisWidth={layout.leftAxisWidth}',
 'rightAxisWidth={layout.rightAxisWidth}'
])if(!panel.includes(token))failures.push(`Ensemble-Interaktion/Layout fehlt: ${token}`);
for(const token of [
 'MID v0.8.28.1 · kompakte, breite Ensemble-Diagramme und reaktionsschnelle Klick-Tooltips',
 '.trend-legend,.wind-legend,.rain-legend{',
 'backdrop-filter:none!important',
 'grid-template-columns:minmax(58px,.82fr) minmax(48px,.7fr) minmax(48px,.7fr)!important',
 '.ensemble-temp-chart-core,.ensemble-rain-chart-core,.ensemble-wind-chart-core{'
])if(!css.includes(token))failures.push(`Ensemble-CSS fehlt: ${token}`);
if(failures.length){console.error('MID v0.8.28.1 Ensemble-Interaktions-/Layoutprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kompakte gemeinsame Ensemble-Geometrie, Klick-Tooltips und Outside-Dismiss geprüft.');
