import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx', import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css', import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json', import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json', import.meta.url),'utf8'));
const fails=[];const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,27,6],atLeastMinimum=parts.every((value,index)=>value===minimum[index])||parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]));
if(!atLeastMinimum)fails.push(`package.json liegt vor 0.8.27.6: ${pkg.version}`);if(baseline.releaseVersion!==pkg.version)fails.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
if(!panel.includes('sharedXAxisHeight=compactTrendTooltip?92:102'))fails.push('Temperatur-X-Achsenhöhe fehlt.');
if(!panel.includes('xAxisHeight={sharedXAxisHeight}'))fails.push('Temperaturcanvas erhält die gemeinsame X-Achsenhöhe nicht.');
if(!/cellLift=xAxisHeight>=60\?Math\.max\(32,cellHeight\*2\.15\):Math\.max\(22,cellHeight\*1\.8\)/.test(panel))fails.push('Anhebung der Wetterkacheln fehlt.');
if(!panel.includes('sharedChartHeight=exporting?336:360'))fails.push('Temperatur-Chart-Höhe fehlt.');
if(!css.includes('MID v0.8.27.12 · vereinheitlichte Ensemble-Tagesachsen'))fails.push('Aktueller CSS-Vertrag für Temperaturachse fehlt.');
if(fails.length){console.error('Regression fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1)}
console.log('MID Ensemble-Temperaturachsen-Regression bestanden.');
