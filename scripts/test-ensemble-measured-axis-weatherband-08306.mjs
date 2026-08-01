import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
for(const token of [
 'function useTemperatureAxisCenters',
 ".recharts-xAxis .recharts-cartesian-axis-tick-line",
 'function resolvedEnsembleDayCenters',
 'cellX=index===0?bandLeft:(centers[index-1]+centerX)/2',
 'cellRight=index===dayCount-1?bandRight:(centerX+centers[index+1])/2',
 'centerX=centers[index]',
 'function EnsembleTemperatureVerticalGrid',
 '<EnsembleTemperatureVerticalGrid data={data}',
 'allowDecimals={false} allowDataOverflow tickLine'
])if(!panel.includes(token))failures.push(`Achsvermessung fehlt: ${token}`);
for(const obsolete of ['cellX=plotLeft+(slotIndex/dayCount)*plotWidth','centerX=plotLeft+((slotIndex+.5)/dayCount)*plotWidth'])if(panel.includes(obsolete))failures.push(`Veraltete theoretische Wetterband-Geometrie vorhanden: ${obsolete}`);
for(const token of ['MID v0.8.30.6 · achsvermessene Tageszentren und wieder sichtbare senkrechte Temperatur-Hilfslinien','.ensemble-temperature-grid-overlay{','.ensemble-temperature-grid-overlay line{'])if(!css.includes(token))failures.push(`Grid-CSS fehlt: ${token}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu Paket ${pkg.version}`);
if(failures.length){console.error('Achsvermessene Temperatur-Wetterleiste fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Temperatur-Tageszentren werden aus den real gerenderten X-Achsenmarken vermessen; Kästchen und senkrechte Hilfslinien teilen exakt dieselben Zentren.');
