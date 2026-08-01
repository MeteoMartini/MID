import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const fails=[];
if(!/^0\.8\.(?:2[89]|[3-9]\d)\./.test(pkg.version))fails.push(`package.json: ${pkg.version}`);if(baseline.releaseVersion!==pkg.version)fails.push('Baseline-Version passt nicht zum Paket.');
for(const token of ['function useTemperatureAxisCenters','function resolvedEnsembleDayCenters','cellX=index===0?bandLeft:(centers[index-1]+centerX)/2','cellRight=index===dayCount-1?bandRight:(centerX+centers[index+1])/2','cellWidth=Math.max(1,cellRight-cellX)','centerX=centers[index]','bandClipId=`ensemble-weather-band-${clipPrefix}`','<ResponsiveEnsembleTooltip compact={compact}'])if(!panel.includes(token))fails.push(`Temperatur-Chart fehlt: ${token}`);
for(const token of ['professionelle, gemeinsame Ensemble-Chart-Engine','.ensemble-temp-plot,.ensemble-rain-plot,.ensemble-wind-plot{','.ensemble-mobile-tooltip-layer{','.ensemble-date-axis-tick .weekday{'])if(!css.includes(token))fails.push(`CSS fehlt: ${token}`);
if(fails.length){console.error('MID v0.8.28.0 Temperatur-Layout-Prüfung fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1)}
console.log('Professionelle Temperatur-Chart-Geometrie, Tagesleiste und mobile Tooltip-Engine geprüft.');
