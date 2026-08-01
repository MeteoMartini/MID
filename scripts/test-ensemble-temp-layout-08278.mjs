import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const fails=[];
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,27,10],atLeastMinimum=parts.every((value,index)=>value===minimum[index])||parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]));
if(!atLeastMinimum)fails.push(`package.json liegt vor 0.8.27.10: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)fails.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
for(const token of ['alignRight?\' align-right\'','tickStep=data.length>1?plotWidth/Math.max(1,data.length-1):plotWidth','cellSlotWidth=data.length>1?tickStep:plotWidth','allowEscapeViewBox={{x:true,y:true}}','chartMargin=compactTrendTooltip?{top:10,right:8,left:1,bottom:62}:{top:14,right:26,left:10,bottom:62}'])if(!panel.includes(token))fails.push(`Panel fehlt: ${token}`);
if(!/xAxisHeight=compact\?96:106/.test(panel))fails.push('Erhöhte X-Achsenreserve fehlt.');
if(!/cellWidth=Math\.max\(10,Math\.min\(cellSlotWidth\*\.54,cellSlotWidth-6\)\)/.test(panel))fails.push('Schmalere und tageszentrierte Wetterkästchen fehlen.');
if(!/cellLift=xAxisHeight>=60\?Math\.max\(30,cellHeight\*2\.05\):Math\.max\(20,cellHeight\*1\.7\)/.test(panel))fails.push('Zusätzliche vertikale Freistellung fehlt.');
for(const token of ['MID v0.8.27.10 · verdichtetes Ensemble-Tooltip, freie Temperatur-X-Achse und direktere Touch-Interaktion','.compact-trend-tooltip.align-right{transform:translateX(calc(-100% + 14px))}','.ensemble-temp-axis-title-bottom{align-items:flex-start!important;padding-top:12px!important;min-height:42px;line-height:1.05}'])if(!css.includes(token))fails.push(`CSS fehlt: ${token}`);
if(!/\.ensemble-temp-chart-core\{grid-template-rows:minmax\(0,1fr\) 42px!important;overflow:visible\}/.test(css))fails.push('CSS fehlt: finale Ensemble-X-Achsenhöhe 42px mit overflow');
if(fails.length){console.error('MID v0.8.27.10 Regression fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1);}
console.log('MID v0.8.27.10 Temperaturband-/Tooltip-Regression bestanden.');
