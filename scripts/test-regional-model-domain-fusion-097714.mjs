import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [weatherFragment,workerCore,composite,modelContract]=await Promise.all([
 readFile(new URL('../src/weather-src/00-types-models-search.tsfrag',import.meta.url),'utf8'),
 readFile(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8'),
 readFile(new URL('../worker-src/20-composite-models.js',import.meta.url),'utf8'),
 readFile(new URL('../MID_MODEL_SOURCE_CONTRACT.md',import.meta.url),'utf8')
]);

for(const token of [
 "id:'meteoswiss_icon_ch1'.*bbox:[3,43,18,50]",
 "id:'meteoswiss_icon_ch2'.*bbox:[3,43,18,50]",
 "id:'geosphere_arome_austria'.*bbox:[8,45,18,50]",
 "id:'chmi_aladin_cz_1km'.*bbox:[11,47,20,52]",
 "id:'meteofrance_arome_france_hd'.*bbox:[-8,40,13,53]",
 "id:'meteofrance_arome_france'.*bbox:[-8,40,13,53]",
 "id:'knmi_harmonie_arome_netherlands'.*bbox:[-2,48,12,56]",
 "id:'ukmo_uk_deterministic_2km'.*bbox:[-12,48,4,62]",
 "id:'dmi_harmonie_arome_europe'.*resolutionKm:2.*bbox:[-15,35,32,72]"
]) assert.match(weatherFragment,new RegExp(token.replaceAll('[','\\[').replaceAll(']','\\]')));

assert.match(weatherFragment,/function candidateApplies\([^\n]+\{\n if\(candidate\.bbox\)/,'App-Modellstand muss vorhandene BBox vor Länderfallback auswerten.');
assert.match(workerCore,/function fusionModelApplies\(model,lat,lon,country\)\{if\(model\.anchor\)return true;if\(model\.bbox\)/,'Worker-Fusion muss vorhandene BBox vor Länderfallback auswerten.');
assert.match(workerCore,/id:'meteoswiss_icon_ch1'.*independenceGroup:'meteoswiss-icon'.*bbox:\[3,43,18,50\]/);
assert.match(workerCore,/id:'meteoswiss_icon_ch2'.*independenceGroup:'meteoswiss-icon'.*bbox:\[3,43,18,50\]/);
assert.match(workerCore,/id:'geosphere_arome'.*maxDays:2\.5.*bbox:\[8,45,18,50\]/);
assert.match(workerCore,/id:'dmi_harmonie'.*independenceGroup:'uwc-west-harmonie'.*maxDays:2\.5.*resolutionKm:2.*bbox:\[-15,35,32,72\]/);
assert.match(workerCore,/id:'knmi_harmonie_europe'.*independenceGroup:'uwc-west-harmonie'/);
assert.match(composite,/id:'dmi-harmonie'.*resolutionKm:2.*maxHours:60/);
assert.doesNotMatch(composite,/id:'dmi-harmonie'.*resolutionKm:(?:2\.5|5\.5)/);

const fnSource=workerCore.match(/function fusionModelApplies\(model,lat,lon,country\)\{[^\n]+\}/)?.[0];
assert.ok(fnSource,'fusionModelApplies konnte nicht extrahiert werden.');
const fusionModelApplies=Function(`${fnSource}; return fusionModelApplies;`)();
const swiss={bbox:[3,43,18,50],countries:['CH']};
const austria={bbox:[8,45,18,50],countries:['AT']};
const hrrr={bbox:[-130,20,-60,55],countries:['US','CA']};
assert.equal(fusionModelApplies(swiss,48.58,7.75,'FR'),true,'ICON-CH soll innerhalb seines Modellgebiets grenzüberschreitend nutzbar sein.');
assert.equal(fusionModelApplies(swiss,46.8,25,'CH'),false,'Ländercode darf eine vorhandene Modell-BBox nicht überstimmen.');
assert.equal(fusionModelApplies(austria,48.14,11.58,'DE'),true,'AROME Austria soll im abgedeckten süddeutschen Raum als Regionalquelle gelten.');
assert.equal(fusionModelApplies(hrrr,70,-100,'CA'),false,'HRRR darf nicht pauschal ganz Kanada nur wegen des Ländercodes abdecken.');

assert.match(modelContract,/Reales Modellgebiet vor Ländergrenze/);
assert.match(modelContract,/UWC-West/);
console.log('Regionale Modellgebiete, grenzüberschreitende Nutzung und Unabhängigkeitsgruppen geprüft.');
