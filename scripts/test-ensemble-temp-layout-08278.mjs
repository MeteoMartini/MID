import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const fails=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,27,8],atLeastMinimum=parts.every((value,index)=>value===minimum[index])||parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]));
if(!atLeastMinimum)fails.push(`package.json liegt vor 0.8.27.8: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)fails.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
if(!panel.includes("alignRight?' align-right':''"))fails.push('Dynamische Rechtsausrichtung des Tooltips fehlt.');
if(!panel.includes("cellWidth=Math.max(11,Math.min(dayWidth*.66,dayWidth-6))"))fails.push('Schmalere und visuell zentrierte Wetterkästchen fehlen.');
if(!panel.includes("xAxisHeight=compact?74:78"))fails.push('Vergrößerte X-Achsenreserve fehlt.');
if(!css.includes('MID v0.8.27.8 · robuste Temperaturband-Geometrie und rechts sichere Tooltips'))fails.push('CSS-Absicherung für Tooltip/Temperaturband fehlt.');
if(!css.includes('.compact-trend-tooltip.align-right{transform:translateX(calc(-100% + 26px))}'))fails.push('Tooltip-Rechtsausrichtung per CSS fehlt.');
if(fails.length){console.error('MID v0.8.27.8 Regression fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1);}
console.log('MID v0.8.27.8 Temperaturband-/Tooltip-Regression bestanden.');
