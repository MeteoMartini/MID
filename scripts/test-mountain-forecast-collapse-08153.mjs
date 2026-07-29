import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');

const start=app.indexOf('function MountainForecastMatrix');
const end=app.indexOf('function MountainSki',start);
assert.ok(start>=0&&end>start,'MountainForecastMatrix muss vorhanden sein.');
const block=app.slice(start,end);

assert.match(block,/const\[open,setOpen\]=useState\(false\)/,'Der Höhenwetter-Verlauf muss standardmäßig eingeklappt sein.');
assert.match(block,/data\.season==='winter'\?'Winterprofil nach Höhenzone':'Bergwetter nach Höhenzone'/,'Sommer- und Wintertitel müssen erhalten bleiben.');
assert.match(block,/useEffect\(\(\)=>\{setOpen\(false\);setExpanded\(false\)\},\[data\.season\]\)/,'Ein Saisonwechsel muss die Höhenwetter-Matrix wieder einklappen.');
assert.match(block,/className="mountain-forecast-summary"/,'Die eingeklappte Höhenwetter-Zusammenfassung fehlt.');
assert.match(block,/aria-expanded=\{open\}/,'Der Öffnungszustand muss barrierearm ausgezeichnet sein.');
assert.match(block,/\{open&&<div className="mountain-forecast-content">/,'Die umfangreiche Höhenmatrix darf nur im geöffneten Zustand gerendert werden.');
assert.match(block,/Höhenwetter öffnen/,'Der Öffnungshinweis fehlt.');
assert.match(block,/Höhenwetter schließen/,'Der Schließhinweis fehlt.');

assert.match(css,/\.mountain-forecast-summary\{/,'Styles für die einklappbare Höhenwetter-Zusammenfassung fehlen.');
assert.match(css,/\.mountain-forecast-content\{/,'Styles für den geöffneten Höhenwetter-Inhalt fehlen.');
assert.match(css,/\.mountain-forecast-matrix\.open \.mountain-forecast-summary\{/,'Der geöffnete Zustand muss visuell getrennt sein.');

console.log('Berg-/Wintersport: Höhenwetter nach Höhenzone ist in Sommer und Winter standardmäßig eingeklappt.');
