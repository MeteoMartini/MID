import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,styles,contract]=await Promise.all([
  read('src/App.tsx'),
  read('src/styles-src/30-modern.css'),
  read('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md')
]);

assert.match(app,/label:'Aktuell'[\s\S]*label:'Heute'[\s\S]*label:'Vorhersage'[\s\S]*label:'Karten'/,'Die fünfteilige C3-Hauptnavigation ist nicht vollständig definiert.');
assert.ok(!app.includes("{id:'warnings',label:'Warnungen',icon:<AlertTriangle size={21}/>,candidates:['warnings']}"),'Warnungen bleiben fälschlich ein sechstes Bottom-Bar-Ziel.');
assert.match(app,/\{id:'current',label:'Aktuell',[\s\S]*?candidates:\['current','warnings','extreme-outlook','ventilation'\]\}/,'Warnungen und aktuelle Gefahren müssen im Hauptkontext Aktuell bleiben, statt die Bottom-Bar auf Mehr umzuschalten.');
assert.match(app,/className=\{`place-warning-status \$\{warningStatus\.tone\}`\}/,'Der Warnlage-Status fehlt im Ortskopf.');
assert.match(app,/onClick=\{\(\)=>navigateToDashboardSection\('warnings'\)\}/,'Der Warnlage-Status führt nicht direkt in die Warnübersicht.');
assert.match(app,/officialError[\s\S]*Amtliche Quelle derzeit nicht erreichbar/,'Eine amtliche Quellenstörung wird im Ortskopf nicht explizit gezeigt.');
assert.match(styles,/MID-C3 · Schritt 1/,'Der C3-Navigationsvertrag fehlt im modernen Stylesheet.');
assert.match(styles,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/,'Die Bottom-Bar ist nicht auf fünf gleich breite Ziele begrenzt.');
assert.match(contract,/Aktuell · Heute · Vorhersage · Karten · Mehr/,'Der Navigationsvertrag benennt nicht die fünf C3-Ziele.');
console.log('MID-C3 Schritt 1: fünf Ziele und antippbarer Warnstatus im Ortskopf geschützt.');
