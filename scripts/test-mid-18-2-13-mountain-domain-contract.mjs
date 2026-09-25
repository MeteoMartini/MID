import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../src/mountainSports.ts',import.meta.url),'utf8');

assert.match(source,/minutely_15\?:Record<string,\(number\|string\|null\)\[]>/,'Bergwetter muss einen getrennten 15-Minuten-Datenkanal unterstützen.');
assert.match(source,/forecast_days:'7'/,'Bergwetter muss sieben lokale Prognosetage abrufen.');
assert.doesNotMatch(source,/forecast_hours:'72'/,'Der alte 72-h-Horizont darf nicht fortbestehen.');
assert.match(source,/forecast_minutely_15:'192'/,'Kurzfristdaten müssen bis 48 h als 15-Minuten-Kanal angefordert werden.');
assert.match(source,/minutely15Variables=\['precipitation','rain','showers','snowfall','snowfall_height','freezing_level_height','weather_code','cape','lightning_potential','is_day'\]/,'Der 15-Minuten-Kanal muss auf fachlich sinnvolle Kurzfristparameter begrenzt sein.');
assert.match(source,/sunshine_duration/,'Sonnenscheindauer muss für die 7-Tage-Bergübersicht verfügbar sein.');

assert.match(source,/localIsoToEpoch\(text,weather\.timezone\)/,'Lokale Bergwetterzeiten müssen DST-fest über die echte Zeitzone in Epoch umgerechnet werden.');
assert.match(source,/function completeHourlyAccumulation/,'Schneeakkumulation braucht eine Vollständigkeitsprüfung.');
assert.match(source,/valid===count\?sum:NaN/,'Unvollständige Schneeintervalle dürfen nicht als 0 cm ausgegeben werden.');
assert.match(source,/past24=completeHourlyAccumulation/,'Vergangene 24-h-Schneemenge muss denselben Vollständigkeitsvertrag nutzen.');
assert.match(source,/next48=completeHourlyAccumulation/,'48-h-Neuschnee muss denselben Vollständigkeitsvertrag nutzen.');

assert.match(source,/export type MountainDaySummary=/,'Zentrale Tageszusammenfassung für Bergwetter fehlt.');
assert.match(source,/export function mountainDayDates\(level:MountainLevelForecast\)/,'Zentrale lokale Tagesauswahl fehlt.');
assert.match(source,/\.slice\(0,7\)/,'Die Bergübersicht muss auf genau sieben lokale Tage begrenzt sein.');
assert.match(source,/function intervalIndicesForDate/,'Intervallgrößen müssen getrennt von Punktwerten einem lokalen Tag zugeordnet werden.');
assert.match(source,/String\(times\[index-1\].*slice\(0,10\)!==date/s,'Niederschlags-/Schneeintervalle müssen über den Intervallbeginn dem lokalen Tag zugeordnet werden.');
assert.match(source,/temperatureMin:temperatures\.min/,'Tagesminimum muss aus derselben Höhen-Zeitreihe abgeleitet werden.');
assert.match(source,/temperatureMax:temperatures\.max/,'Tagesmaximum muss aus derselben Höhen-Zeitreihe abgeleitet werden.');
assert.match(source,/dominantWindDirection:circularWindDirection\(level,pointIndices\)/,'Dominante Windrichtung muss aus derselben Höhen-Zeitreihe stammen.');
assert.match(source,/precipitationMm:precip\.value/,'Tagesniederschlag muss aus denselben Intervallen aggregiert werden.');
assert.match(source,/snowfallCm:snow\.value/,'Tagesneuschnee muss aus denselben Intervallen aggregiert werden.');
assert.match(source,/sunshineHours:Number\.isFinite\(sunshine\.value\)\?sunshine\.value\/3600:NaN/,'Sonnenscheindauer muss aus Intervallsekunden konsistent in Stunden überführt werden.');
assert.match(source,/snowfallLimitMin:snowfallLimits\.min/,'Schneefallgrenze muss in der Tageszusammenfassung erhalten bleiben.');
assert.match(source,/freezingLevelMin:freezing\.min/,'Nullgradgrenze muss getrennt von der Schneefallgrenze erhalten bleiben.');

console.log('MID 18.2.13 Bergwetter-Fachvertrag geprüft: 7 lokale Tage, DST-feste Zeiten, 15-Min-Kurzfristkanal, konsistente Tagesaggregate und keine falschen 0-cm-Schneewerte.');
