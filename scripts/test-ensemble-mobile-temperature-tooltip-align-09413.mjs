import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const panel=fs.readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
const req=(source,text,label)=>{if(!source.includes(text))failures.push(label)};
req(panel,'sunshine-tooltip-line single-value','Sonne-Metazeile fehlt');
req(panel,'precipitation-tooltip-line single-value','Niederschlag-Metazeile fehlt');
req(panel,'consistency-tooltip-line','Modelle-Metazeile fehlt');
req(css,'MID v0.9.41.3 · mobile Temperatur-Ensemble-Metazeilen rechtsbündig','v0.9.41.3 Tooltip-Ausrichtung fehlt');
const block=css.slice(css.indexOf('/* MID v0.9.41.3 · mobile Temperatur-Ensemble-Metazeilen rechtsbündig'));
req(block,'grid-template-columns:76px minmax(0,1fr)!important','gemeinsame Label-/Wertspalten fehlen');
req(block,'justify-self:end!important','Labels sind nicht rechtsbündig');
req(block,'text-align:right!important','Werte sind nicht rechtsbündig');
req(block,'white-space:nowrap!important','Metazeilen bleiben nicht in einer Zeile');
if(/\.compact-trend-tooltip\s*\{[^}]*(?:width|max-width|min-width|padding|font-size)\s*:/s.test(block))failures.push('Fix verändert die Tooltip-Gesamtgröße oder Typografie');
if(failures.length){console.error('Mobile Tooltip-Ausrichtung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.41.3: Sonne, Niederschlag und Modelle nutzen mobil gemeinsame Spalten und sind rechtsbündig ohne Größenänderung.');
