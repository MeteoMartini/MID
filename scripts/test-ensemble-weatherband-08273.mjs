import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['function useTemperatureAxisCenters','cellX=index===0?bandLeft:(centers[index-1]+centerX)/2','cellRight=index===dayCount-1?bandRight:(centerX+centers[index+1])/2','cellWidth=Math.max(1,cellRight-cellX)','centerX=centers[index]','ensemble-sky-strip-separator','ensemble-sky-strip-outline','<EnsemblePrecipShape cx={centerX}'])if(!panel.includes(token))failures.push(`Wetterband fehlt: ${token}`);
for(const token of ['.ensemble-temperature-weather-overlay .ensemble-sky-strip-separator{','.ensemble-temperature-weather-overlay .ensemble-sky-strip-outline{'])if(!css.includes(token))failures.push(`Wetterband-CSS fehlt: ${token}`);
if(panel.includes('cellWidth=Math.max(1,cellSlotWidth)'))failures.push('Veraltete konstante Zellbreite ist noch vorhanden.');
if(failures.length){console.error('Ensemble-Wetterband-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Achsgenaues, nahtloses Sonne-/Wolkenband mit Tageslinien in den Kästchenmitten geprüft.');
