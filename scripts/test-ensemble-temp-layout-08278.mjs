import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const fails=[];if(baseline.releaseVersion!==pkg.version)fails.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
for(const token of ["alignRight?' align-right'",'dayCount=Math.max(1,data.length)','cellSlotWidth=plotWidth/dayCount','slotIndex=clamp(Math.round(row.x),0,dayCount-1)','allowEscapeViewBox={{x:true,y:true}}',"chartMargin=compactTrendTooltip?{top:10,right:8,left:1,bottom:60}:{top:14,right:26,left:10,bottom:60}"])if(!panel.includes(token))fails.push(`Panel fehlt: ${token}`);
if(!panel.includes('sharedXAxisHeight=compactTrendTooltip?92:102'))fails.push('Gemeinsame Temperatur-X-Achsenreserve fehlt.');
if(!/cellWidth=Math\.max\(10,cellSlotWidth-inset\*2\)/.test(panel))fails.push('Zusammenhängende Tageskästchen fehlen.');
if(!/cellLift=xAxisHeight>=60\?Math\.max\(32,cellHeight\*2\.15\):Math\.max\(22,cellHeight\*1\.8\)/.test(panel))fails.push('Vertikale Freistellung fehlt.');
for(const token of ['MID v0.8.27.12 · vereinheitlichte Ensemble-Tagesachsen','.compact-trend-tooltip.align-right{transform:translateX(calc(-100% + 14px))}','.ensemble-temp-chart-core,.ensemble-rain-chart-core,.ensemble-wind-chart-core{grid-template-rows:minmax(0,1fr) 42px!important'])if(!css.includes(token))fails.push(`CSS fehlt: ${token}`);
if(fails.length){console.error('MID Ensemble-Temperaturlayout-Regression fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1)}
console.log('MID Temperaturband-/Tooltip-/Achsen-Regression bestanden.');
