import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');

assert(!app.includes('arrivalWindow.replace'), 'Die fehleranfällige Uhrzeitbereich-Formatierung darf nicht mehr verwendet werden.');
assert(!app.includes('zwischen ${arrivalWindow.replace(\'–\',\' und \')} Uhr'), 'Doppeltes „Uhr“ muss ausgeschlossen sein.');
assert(app.includes('Möglicher Standorttreffer zwischen ${arrivalStart} und ${arrivalEnd} Uhr'), 'Der Standorttreffer muss als sauberer Zeitbereich formuliert werden.');
assert(app.includes('className="precip-now-source-row"'), 'Die kompakte sichtbare Radarquelle fehlt.');
assert(app.includes('Technische Radardetails anzeigen'), 'Technische Radardetails müssen hinter einem Info-Element liegen.');
assert(app.includes('<small>2-h-Summe</small><strong>{radarAmountLabel(forecastAmount)} mm</strong>'), 'Die hervorgehobene 2-h-Summe fehlt.');
assert(styles.includes('.precip-now-source-row'), 'Styles für die kompakte Radarquelle fehlen.');
assert(styles.includes('.radar-nowcast-title .radar-nowcast-total'), 'Styles für die hervorgehobene 2-h-Summe fehlen.');

console.log('Radar-Nowcard v0.9.12.1: OK');
