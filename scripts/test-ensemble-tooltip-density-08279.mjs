import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const fails=[];
for(const token of ['sharedXAxisHeight=compactTrendTooltip?92:102','sharedChartHeight=exporting?336:360','cellSlotWidth=plotWidth/dayCount','cellWidth=Math.max(10,cellSlotWidth-inset*2)','cellLift=xAxisHeight>=60?Math.max(32,cellHeight*2.15):Math.max(22,cellHeight*1.8)'])if(!panel.includes(token))fails.push(`Panel fehlt: ${token}`);
for(const token of ['width:min(276px,calc(100vw - 16px))!important','padding:6px 7px!important','.compact-trend-tooltip.align-right{transform:translateX(calc(-100% + 14px))}','.ensemble-temp-chart-core,.ensemble-rain-chart-core,.ensemble-wind-chart-core{grid-template-rows:minmax(0,1fr) 42px!important'])if(!css.includes(token))fails.push(`CSS fehlt: ${token}`);
if(fails.length){console.error('MID Tooltip-/Achsen-Regression fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1)}
console.log('MID Tooltip-/Achsen-Regression bestanden.');
