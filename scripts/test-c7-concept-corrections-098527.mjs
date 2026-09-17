import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,shortTerm,composition,radar]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/midC7Composition.css',import.meta.url),'utf8'),
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8')
]);

assert.match(app,/id!==['"]short-term['"]&&array\.indexOf\(id\)===index/,'Die Kurzfrist darf nur dem Tab „Heute“ zugeordnet sein.');
assert.match(app,/initializeStorageSafety\(\)/,'Ein Quota-Fehler muss die vorhandene lokale Speicher-Recovery auslösen.');
assert.match(app,/if\(isQuotaExceededError\(reason\)\)\{setError\(['"]{2}\)/,'Ein Quota-Fehler darf nicht als Rohmeldung in die Hauptfläche gelangen.');
assert.match(shortTerm,/className="short-term-matrix"/,'Die Kurzfrist benötigt die zusammenhängende Zeitmatrix.');
assert.match(shortTerm,/Zeit<\/span><span>Wetter<\/span><span>Temperatur<\/span><span>Niederschlag<\/span><span>Wind/,'Die Matrix muss ihre feste Messhierarchie benennen.');
for(const token of ['grid-auto-flow:column','border-right:1px solid','box-shadow:none!important','scroll-snap-type:inline proximity']) assert.ok(composition.includes(token),`C7-Konzeptkorrektur fehlt: ${token}`);
assert.match(radar,/forecasts:modelForecastTimes/,'Die Kartenzeitachse muss vorhandene echte Modelltermine ohne Moduswechsel ergänzen.');
assert.doesNotMatch(radar,/forecasts:modelLines==='off'\?\[\]:modelForecastTimes/,'Modelltermine dürfen nicht von einer freiwilligen Live-Linienauswahl abhängen.');
assert.match(radar,/modelAtSelectedTime=selectedFrame\?\.phase==='forecast'/,'Ein Modellzeitpunkt muss fachlich als Modellzustand ausgewiesen werden.');

console.log('MID-C7 Konzeptkorrekturen: exklusive Navigation, Quota-Recovery und Kurzfrist-Zeitmatrix geprüft.');
