import {readFileSync} from 'node:fs';
const fail=[];const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
if(baseline.releaseVersion!==pkg.version)fail.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
for(const token of ['dayCount=Math.max(1,data.length)','cellSlotWidth=plotWidth/dayCount','slotIndex=clamp(Math.round(row.x),0,dayCount-1)','slotLeft=plotLeft+slotIndex*cellSlotWidth','centerX=Math.round((slotLeft+cellSlotWidth/2)*2)/2'])if(!panel.includes(token))fail.push(`Tageskästchen-Geometrie fehlt: ${token}`);
if(!/cellWidth=Math\.max\(10,cellSlotWidth-inset\*2\)/.test(panel))fail.push('Zusammenhängende Tageskästchenbreite fehlt.');
if(!/cellY=Math\.max\(plotTop\+10,plotBottom-cellHeight-cellLift\)/.test(panel))fail.push('Freiraum für die Datumsachse fehlt.');
if(!panel.includes("wrapperStyle={{zIndex:140,maxWidth:'calc(100vw - 12px)',overflow:'visible'}}"))fail.push('Tooltip-Z-Index-Anhebung fehlt.');
if(!panel.includes('fill="#ffd84a"'))fail.push('Kontrastreiches Gewittersymbol fehlt.');
if(!css.includes('MID v0.8.27.12 · vereinheitlichte Ensemble-Tagesachsen'))fail.push('Aktuelle CSS-Anpassungen fehlen.');
if(fail.length){console.error('MID Wetterband-Regression fehlgeschlagen:\n- '+fail.join('\n- '));process.exit(1)}
console.log('MID Tooltip-/Wetterband-Regression bestanden.');
