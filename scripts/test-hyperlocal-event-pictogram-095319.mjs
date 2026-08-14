import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,panel,styles,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,'0.9.53.19');
assert.equal(baseline.releaseVersion,'0.9.53.19');
assert.match(app,/Math\.abs\(localTemperatureCorrection\)>=\.2/,'Kompakte Temperaturkorrektur muss erst ab 0,2 K hervorgehoben werden.');
assert.match(app,/Math\.abs\(terrainWindCorrection\)>=1/,'Kompakte Gelände-Windkorrektur muss erst ab 1 % hervorgehoben werden.');
assert.match(app,/Temp\.\/Wind nahe Modell/,'Bei marginalen T-/Windkorrekturen muss die Modellnähe statt Scheingenauigkeit sichtbar sein.');
assert.match(app,/meteorologisch vernachlässigbar/,'Detailinfo muss kleine Temperaturkorrekturen fachlich einordnen.');
assert.match(app,/event-center-header-weather-icon[\s\S]*WeatherPictogram/,'Glockenliste muss vor jedem Event ein Wetterpiktogramm zeigen.');
assert.match(app,/day=\{summary\?\.isDay!==false\}/,'Glockenpiktogramm muss den gespeicherten Event-Tag-/Nachtstatus verwenden.');
assert.match(panel,/day=\{recordPlan\?\.summary\.isDay!==false\}/,'Event-Center-Übersicht muss denselben Tag-/Nachtstatus verwenden.');
assert.match(styles,/\.event-center-header-weather-icon/,'Piktogramm der Glockenliste muss kompakt gestaltet sein.');
console.log('MID v0.9.53.19 Hyperlokal-Signifikanz und Event-Glockenpiktogramm geprüft.');
