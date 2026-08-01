import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const fails=[];
if(!panel.includes('xAxisHeight=compact?96:106'))fails.push('erhöhte X-Achsenreserve fehlt');
if(!panel.includes('height={exporting?336:372}'))fails.push('erhöhte Temperatur-Chart-Höhe fehlt');
if(!panel.includes('cellWidth=Math.max(10,Math.min(cellSlotWidth*.54,cellSlotWidth-6))'))fails.push('schmalere Wetterkästchen fehlen');
if(!panel.includes('cellLift=xAxisHeight>=60?Math.max(30,cellHeight*2.05):Math.max(20,cellHeight*1.7)'))fails.push('zusätzliche vertikale Freistellung fehlt');
for(const token of ['width:min(276px,calc(100vw - 16px))!important','padding:6px 7px!important','.compact-trend-tooltip.align-right{transform:translateX(calc(-100% + 14px))}']) if(!css.includes(token)) fails.push(`CSS fehlt: ${token}`);
if(!/\.ensemble-temp-chart-core\{grid-template-rows:minmax\(0,1fr\) 42px!important;overflow:visible\}/.test(css)) fails.push('CSS fehlt: finale Ensemble-X-Achsenhöhe 42px mit overflow');
if(fails.length){
  console.error('MID v0.8.27.10 Tooltip-/Achsen-Regression fehlgeschlagen:\n- '+fails.join('\n- '));
  process.exit(1);
}
console.log('MID v0.8.27.10 Tooltip-/Achsen-Regression bestanden.');
