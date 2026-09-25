import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/mountainSports.ts',import.meta.url),'utf8');

assert.match(source,/forecast_hours:'168'/,'Berg-/Wintersport muss sieben Tage bzw. 168 Stunden Höhenprognose laden.');
assert.match(source,/'sunshine_duration'/,'Sonnenstunden müssen aus der höhenbezogenen Stundenreihe ableitbar sein.');
assert.match(source,/function completeSnowfallWindowSum/,'Neuschnee braucht einen Vollständigkeitsvertrag statt Missing=0.');
assert.doesNotMatch(source,/Number\(snow\[index\]\)\|\|0/,'Fehlende Schneefallstunden dürfen niemals als 0 cm behandelt werden.');
assert.match(source,/function currentValue\(weather:MountainPointWeather,key:string\)\{const current=numeric/,'Nullwerte in aktuellen Höhenparametern dürfen nicht zu künstlichen 0-Werten werden.');
assert.match(source,/export function mountainDailySummaries\(level:MountainLevelForecast\)/,'Tageswerte müssen zentral aus exakt einer gewählten Höhenstufen-Zeitreihe ableitbar sein.');
assert.match(source,/export function mountainSevenDaySummaries\(level:MountainLevelForecast,now=Date\.now\(\)\)/,'Die UI braucht genau sieben lokale Kalendertage aus der gewählten Höhenzeitreihe.');
assert.match(source,/\.filter\(day=>day\.date>=start\)\.slice\(0,7\)/,'Die Bergwetter-Übersicht muss auf genau sieben aktuelle lokale Tage begrenzt sein.');
assert.match(source,/key!==['"]sunshine_duration['"]/,'Sonnenscheindauer darf als Stundenintervall geladen, aber nicht fälschlich als Current-Momentanwert angefordert werden.');
assert.match(source,/role:level\.role,elevation:level\.elevation,date/,'Tageswerte müssen Höhenrolle und Höhe explizit mitführen.');
assert.match(source,/mountainIntervalValue\(weather,'precipitation',index\)/,'Niederschlag muss als Intervallwert aggregiert werden.');
assert.match(source,/mountainIntervalValue\(weather,'snowfall',index\)/,'Schneefall muss als Intervallwert aggregiert werden.');
assert.match(source,/mountainSeriesValue\(weather,'temperature_2m',index\)/,'Temperatur muss als Punktwert aus derselben Höhenzeitreihe stammen.');
assert.match(source,/mountainSeriesValue\(weather,'wind_gusts_10m',index\)/,'Böen müssen in der Tagesaggregation derselben Höhenzeitreihe enthalten sein.');
assert.match(source,/snowfallLimitMedianM:mountainMedian\(snowLines\)/,'Schneefallgrenze muss getrennt von der Nullgradgrenze aus der Höhenzeitreihe ableitbar bleiben.');
assert.match(source,/freezingLevelMedianM:mountainMedian\(freezingLevels\)/,'Nullgradgrenze muss als eigener Parameter erhalten bleiben.');

console.log('MID 18.2.13 Bergwetter: 168-h-Höhenvertrag, Tages/Stunden-Kohärenz und Missing-Snow-Schutz geprüft.');
