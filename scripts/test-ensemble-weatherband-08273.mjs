import {readFileSync} from 'node:fs';
const fail=[];
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,27,3],atLeastMinimum=parts.every((value,index)=>value===minimum[index])||parts.some((value,index)=>value>minimum[index]&&parts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]));
if(!atLeastMinimum)fail.push(`package.json liegt vor 0.8.27.3: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)fail.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
if(!panel.includes('cellWidth=Math.max(12,Math.min(dayWidth*.8,dayWidth-4))'))fail.push('Kompakte Tageskästchen-Geometrie fehlt.');
if(!panel.includes('const centerX=Math.round((plotLeft+(row.x+.5)*dayWidth)*2)/2'))fail.push('Tageskästchen-Zentrierung fehlt.');
if(!panel.includes('cellY=Math.max(plotTop+8,plotBottom-cellHeight-cellLift)'))fail.push('Freiraum für die Datumsachse fehlt.');
if(!panel.includes("wrapperStyle={{zIndex:140,maxWidth:'calc(100vw - 16px)'}}"))fail.push('Tooltip-Z-Index-Anhebung fehlt.');
if(!panel.includes('fill="#ffd84a"'))fail.push('Neues Gewittersymbol fehlt.');
if(!css.includes('statische Tooltip-Ebene und buildstabile Wetterband-Ausgabe')&&!css.includes('stabil sichtbare Ensemble-Tooltips'))fail.push('CSS-Anpassungen fehlen.');
if(fail.length){
  console.error('MID v0.8.27.3 Regression fehlgeschlagen:\n- '+fail.join('\n- '));
  process.exit(1);
}
console.log('MID v0.8.27.3 Tooltip-/Wetterband-Regression bestanden.');
