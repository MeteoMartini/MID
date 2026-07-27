import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
assert.match(css,/v0\.7\.105\.2 – Desktop-Layout der 7-Tage-Vorhersage gegen Überdeckung absichern/,'Desktop-Fix-Kommentar für die 7-Tage-Vorhersage fehlt');
assert.match(css,/@media\(min-width:1051px\)\{[\s\S]*?\.forecastrow\{[\s\S]*?grid-template-columns:78px minmax\(150px,178px\) minmax\(255px,1\.3fr\) minmax\(190px,\.9fr\) minmax\(125px,\.72fr\);/,'Desktop-Grid der 7-Tage-Vorhersage wurde nicht auf textfreundliche Spalten umgestellt');
assert.match(css,/@media\(min-width:1051px\)\{[\s\S]*?\.forecast-meta\{[\s\S]*?flex-wrap:wrap;/,'Meta-Zeile muss auf kleineren Desktops bei Bedarf umbrechen können');
assert.match(css,/@media\(min-width:1051px\)\{[\s\S]*?\.forecast-barwrap\{[\s\S]*?grid-template-columns:42px minmax\(118px,1fr\) 42px;/,'Temperaturbalken wurden für den Desktop-Fix nicht kompakter gefasst');
assert.match(css,/@media\(min-width:1320px\)\{[\s\S]*?\.forecast-meta\{[\s\S]*?flex-wrap:nowrap;/,'Große Desktopbreiten sollen die Metazeile weiterhin einzeilig halten');
console.log('Desktop-Layout der 7-Tage-Vorhersage geprüft: schmalere Temperaturbalken und textfreundliche Spalten aktiv.');
