import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['function EnsembleTemperatureWeatherOverlay','cellY=Math.max(plotTop+8,plotBottom-cellHeight-7)','hazardY=Math.max(plotTop+8,cellY-16)','function EnsemblePrecipShape','function EnsembleHazardShape'])if(!panel.includes(token))failures.push(`Overlay fehlt: ${token}`);
for(const token of ['.ensemble-temperature-weather-overlay{overflow:visible;pointer-events:none}', '.ensemble-mobile-tooltip-layer{position:fixed;'])if(!css.includes(token))failures.push(`Overlay-/Tooltip-CSS fehlt: ${token}`);
if(failures.length){console.error('Ensemble-Wetterband-/Tooltip-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Achsengebundenes Wetterband, Hazards und unclipped mobile Tooltips geprüft.');
