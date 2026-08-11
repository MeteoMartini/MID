import fs from 'node:fs';

const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const panel=fs.readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
const requireText=(source,text,label)=>{if(!source.includes(text))failures.push(label)};

requireText(panel,'className="trend-tooltip compact-trend-tooltip"','Temperatur-Ensemble-Tooltip-Klasse fehlt');
requireText(panel,'sunshine-tooltip-line single-value','Sonne-Metazeile fehlt');
requireText(panel,'precipitation-tooltip-line single-value','Niederschlag-Metazeile fehlt');
requireText(panel,'consistency-tooltip-line','Modelle-Metazeile fehlt');
requireText(css,'MID v0.9.41.2 · mobiles Temperatur-Ensemble-Tooltip','v0.9.41.2 Tooltip-Fix fehlt');
requireText(css,'grid-template-columns:76px minmax(0,1fr)!important','gemeinsame mobile Labelspalte fehlt');
requireText(css,'column-gap:8px!important','mobiler Abstand zwischen Label und Wert fehlt');
requireText(css,'white-space:nowrap!important','Metazeilen-Label darf nicht umbrechen');
requireText(css,'overflow-wrap:normal!important','Werte sollen nur kontrolliert umbrechen');
requireText(css,'word-break:normal!important','Werte dürfen nicht mitten im Wort getrennt werden');

const fixBlock=css.slice(css.indexOf('/* MID v0.9.41.2 · mobiles Temperatur-Ensemble-Tooltip'));
if(/\.compact-trend-tooltip\s*\{[^}]*\b(?:width|max-width|min-width|font-size|padding)\s*:/s.test(fixBlock))failures.push('Fix verändert Tooltip-Größe/Typografie, obwohl nur das Layout korrigiert werden soll');

if(failures.length){
 console.error('Mobiles Temperatur-Ensemble-Tooltip fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('MID v0.9.41.2: mobiles Temperatur-Ensemble-Tooltip hält Größe bei und richtet Sonne, Niederschlag und Modelle lesbar aus.');
