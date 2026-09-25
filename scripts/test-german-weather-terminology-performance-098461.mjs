import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pictogram=readFileSync('src/WeatherPictogram.tsx','utf8');
const weather=readFileSync('src/weather.ts','utf8');
const app=readFileSync('src/App.tsx','utf8');
const preload=readFileSync('src/startupPreload.ts','utf8');

const expectedObserved=[
 "Leichter Regenschauer","Mäßiger Regenschauer","Starker Regenschauer",
 "Leichter Schneeschauer","Mäßiger Schneeschauer","Starker Schneeschauer",
 "Leichter Schneeregenschauer","Mäßiger Schneeregenschauer","Starker Schneeregenschauer",
 "Leichter Graupelschauer","Mäßiger Graupelschauer","Starker Graupelschauer",
 "Leichter Hagelschauer","Mäßiger Hagelschauer","Starker Hagelschauer"
];
for(const token of expectedObserved)assert.ok(pictogram.includes(token),`Present-Weather-Bezeichnung fehlt: ${token}`);

for(const forbidden of [
 "Leichte Regenschauer","Mäßige Regenschauer","Starke Regenschauer",
 "Leichte Schneeschauer","Mäßige Schneeschauer","Starke Schneeschauer",
 "Leichte Graupelschauer","Mäßige Graupelschauer","Starke Graupelschauer",
 "Leichte Hagelschauer","Mäßige Hagelschauer","Starke Hagelschauer"
])assert.ok(!pictogram.includes(forbidden),`Grammatisch falscher zeitpunktbezogener Schauertext verblieben: ${forbidden}`);

for(const [code,label] of [
 [80,'Leichter Regenschauer'],[81,'Mäßiger bis starker Regenschauer'],[82,'Sehr starker Regenschauer'],
 [83,'Leichter Schneeregenschauer'],[84,'Mäßiger bis starker Schneeregenschauer'],
 [85,'Leichter Schneeschauer'],[86,'Mäßiger bis starker Schneeschauer'],
 [87,'Leichter Graupelschauer'],[88,'Mäßiger bis starker Graupelschauer'],
 [89,'Leichter Hagelschauer'],[90,'Mäßiger bis starker Hagelschauer']
])assert.ok(weather.includes(`${code}:'${label}'`),`DWD/WMO-ww ${code} muss fachlich/grammatisch ${label} heißen.`);

assert.ok(app.includes('currentVisibilityReport=currentObservedRaw?parseReportedVisibilityPhenomenon(currentObservedRaw):undefined'),'Sichtbezogene DWD-/METAR-Meldungen müssen vor allgemeinen Wettercodes fachlich klassifiziert werden.');
assert.ok(app.includes("parseObservedPresentWeather(currentObservedRaw,Boolean(currentVisibilityReport))"),'Numerisches DWD-SYNOP-ww muss über die eigene SYNOP-Codegrenze ausgewertet werden.');
assert.ok(!app.includes('currentObservedWeatherCode='),'Numerisches DWD-SYNOP-ww darf nicht direkt als Open-Meteo-/Forecast-Wettercode verwendet werden.');
assert.ok(!app.includes('label(currentObservedWeatherCode)'),'Numerisches DWD-SYNOP-ww darf nicht über die Forecast-label()-Codetabelle beschriftet werden.');

assert.ok(preload.includes('await delay(35)'),'Fast-Observation muss beim Start priorisiert werden.');
assert.ok(preload.includes('await delay(constrained?650:440)'),'Ensemble-Start muss hinter den kritischen Istwetter-/Radar-Pfad rücken und Data-Saver respektieren.');
assert.ok(preload.includes('radarRequest.promise,delay(700)]).then(()=>preloadInterfaceChunks(ensemble))'),'Nichtkritische Chunks müssen nach Forecast/Station oder spätestem Soft-Delay vorladen.');
assert.ok(app.includes('runFullStationAnalysis()},80)'),'Volle Hyperlokalanalyse muss nach dem Provisional-Pass zügig nachziehen.');

console.log('German weather terminology + quality-neutral startup performance contract: OK');
