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

assert.ok(app.includes("currentObservedWeatherCode=currentObservedRaw&&/^\\d{1,2}$/.test(currentObservedRaw)?Number(currentObservedRaw):undefined"),'Numerisches DWD-SYNOP-ww muss als Wettercode erkannt werden.');
assert.ok(app.includes('currentWeatherLabel=label(currentObservedWeatherCode)'),'Numerisches DWD-SYNOP-ww muss den zentralen deutschen DWD/WMO-Text verwenden.');
assert.ok(app.includes('weatherPictogramIntensity(currentObservedWeatherCode)'),'Numerisches SYNOP-ww muss auch die passende Piktogrammintensität setzen.');

assert.ok(preload.includes('await delay(40)'),'Fast-Observation muss beim Start priorisiert werden.');
assert.ok(preload.includes('await delay(420)'),'Ensemble-Start muss hinter den kritischen Istwetterpfad rücken.');
assert.ok(preload.includes('delay(700)]).then(()=>preloadInterfaceChunks(ensemble))'),'Nichtkritische Chunks müssen nach Forecast/Station oder spätestem Soft-Delay vorladen.');
assert.ok(app.includes('runFullStationAnalysis()},80)'),'Volle Hyperlokalanalyse muss nach dem Provisional-Pass zügig nachziehen.');

console.log('German weather terminology + quality-neutral startup performance contract: OK');
