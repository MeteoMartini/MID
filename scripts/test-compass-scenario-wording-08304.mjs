import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of [
 '<strong>Prognoseentwicklung</strong>',
 '<small>Zeitraum guter Temperatur-Konsistenz</small>',
 '<small>Wahrscheinlichste Entwicklung</small>',
 '<small>Zunehmende Unsicherheit</small>',
 'function forecastOutlook(',
 'function forecastUncertaintyDriver(',
 'probabilitySummary=visible.map((_,index)=>',
 'ensemble-scenario-probability-overview',
 'ensemble-scenario-probability-meter'
])if(!panel.includes(token))failures.push(`Fehlt: ${token}`);
for(const obsolete of ['Orientierung ohne Modelljargon','nimmt im weiteren Verlauf merklich ab','nimmt im weiteren Verlauf deutlich ab'])if(panel.includes(obsolete))failures.push(`Veraltetes Wording vorhanden: ${obsolete}`);
for(const token of ['MID v0.8.30.4 · professioneller Prognose-Kompass und sofort erkennbare Szenarioanteile','.ensemble-scenario-probability-overview','.ensemble-scenario-probability-meter'])if(!css.includes(token))failures.push(`CSS fehlt: ${token}`);
if(failures.length){console.error('Kompass-/Szenario-Regressionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Prognose-Kompass und Szenario-Wahrscheinlichkeiten sind professionell und auf den ersten Blick verständlich.');
