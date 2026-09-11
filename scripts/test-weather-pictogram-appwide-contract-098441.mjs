import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(file)=>fs.readFileSync(file,'utf8');
const pictogram=read('src/WeatherPictogram.tsx');
const precipitation=read('src/precipitation.ts');
const phaseColor=read('src/precipitationPhaseColor.ts');
const app=read('src/App.tsx');
const weather=read('src/weather.ts');
const obs=read('src/weather-src/10-observations-specialized.tsfrag');
const types=read('src/weather-src/00-types-models-search.tsfrag');
const shortTerm=read('src/ShortTermForecast.tsx');
const eventEngine=read('src/eventWeatherEngine.ts');
const eventCenter=read('src/eventCenter.ts');
const eventPanel=read('src/EventPlannerPanel.tsx');
const route=read('src/routeWeather.ts');
const routePanel=read('src/RouteWeatherPanel.tsx');
const water=read('src/WaterSportsPanel.tsx');
const detail=read('src/detailPictograms.ts');
const period=read('src/periodWeatherVisual.ts');
const cockpit=read('src/ForecastCockpit.tsx');
const radar=read('src/RadarModelPrecipTypeOverlay.tsx');
const radarSymbols=read('src/precipitationTypeSymbols.ts');
const ensemble=read('src/EnsemblePanel.tsx');
const warnings=read('src/dwdWarnings.ts');
const meteogram=read('src/MeteogramPanel.tsx');
const standard=read('MID_WEATHER_PICTOGRAM_STANDARD.md');
const precipContract=read('MID_PRECIP_PICTOGRAM_SNOW_DEPTH_CONTRACT.md');
const colorContract=read('MID_PARAMETER_COLOR_CONTRACT.md');

// 1) WMO 96/99: neutral solid graupel/hail unless Present Weather resolves the phase.
assert.ok(pictogram.includes("if([96,99].includes(c))return'thunder-solid';"),'96/99 müssen ohne Zusatzsignal neutral als Graupel/Hagel gerendert werden.');
assert.ok(pictogram.includes("else if(has('TS')&&has('GS'))kind='thunder-graupel';")&&pictogram.includes("else if(has('TS')&&has('GR'))kind='thunder-hail';"),'Explizites TSGS/TSGR muss die feste Gewitterphase auflösen.');
assert.ok(radar.includes('explicitGraupelHail=[96,99]')&&radar.includes("phase:'graupel-hail'"),'Radar-/Kompositpfad muss 96/99 neutral halten.');
assert.ok(radarSymbols.includes("'graupel-hail'")&&radarSymbols.includes("label:'Graupel oder Hagel'"),'Radar-Symbolstandard braucht die neutrale feste Phase.');
assert.ok(radarSymbols.includes("'snow-stars':{label:'Vereinzelte Schneesterne'")&&radarSymbols.includes("'ice-crystals':{label:'Eisnadeln'")&&radarSymbols.includes("'ice-pellets':{label:'Eiskörner'"),'Radar-Symbolstandard muss 78/76/79 getrennt darstellen.');
assert.ok(radar.includes('explicitIceCrystals=code===76')&&radar.includes('explicitSnowStars=code===78')&&radar.includes('explicitIcePellets=code===79'),'Radar-/Modellphase muss 76/78/79 explizit getrennt halten.');
assert.ok(!radar.includes('Graupel / Eiskörner'),'Thermische Radarheuristik darf Graupel und Eiskörner nicht semantisch zusammenwerfen.');
assert.ok(ensemble.includes("if([96,99].includes(code))return'solid'"),'Ensemblepfad darf 96/99 nicht als reinen Hagel ausgeben.');

// 2) WMO 76/78/79 are distinct.
assert.ok(pictogram.includes("if(c===76)return'ice-crystals';")&&pictogram.includes("if(c===78)return'snow-stars';")&&pictogram.includes("if(c===79)return'ice-pellets';"),'76/78/79 müssen getrennte Piktogrammfamilien besitzen.');
assert.ok(precipitation.includes("76:'iceCrystals',77:'snowGrains',78:'snowStars',79:'icePellets'"),'Niederschlagskern muss 76/77/78/79 getrennt typisieren.');
assert.ok(phaseColor.includes("type==='snowStars'||type==='iceCrystals'||type==='icePellets'"),'Neue feste Sonderphasen müssen die hellblaue Schnee/Eis-Farbfamilie verwenden.');
assert.ok(app.includes("snowStars:{label:'Schneesterne'")&&app.includes("iceCrystals:{label:'Eisnadeln'")&&app.includes("icePellets:{label:'Eiskörner'"),'Detaillegende muss 78/76/79 vollständig kennen.');
assert.ok(meteogram.includes("snowStars:{short:'SN'")&&meteogram.includes("iceCrystals:{short:'IC'")&&meteogram.includes("icePellets:{short:'PL'"),'Meteogramm muss 78/76/79 vollständig kennen.');

// 3) 95/97: phase-aware but never infer rain from total precipitation alone.
assert.ok(precipitation.includes('const liquidSignal=Math.max(rainValue,showerValue)>=.01;'),'Gewitterphase darf flüssiges Signal nur aus explizitem Regen/Schauer ableiten.');
assert.ok(precipitation.includes("hasSnow&&liquidSignal?'TSRASN':hasSnow?'TSSN':liquidSignal?'TSRA':undefined"),'95/97 brauchen die phasenabhängige TSRA/TSSN/TSRASN-Brücke.');
assert.ok(!precipitation.includes('Math.max(total,rainValue,showerValue)>=.01'),'Gesamtmenge allein darf kein TSRA erzwingen.');
assert.ok(warnings.includes('liquidPrecipitation')&&!warnings.includes('[95,96,97,99].includes(code)&&precipitation'),'Warnlogik darf Gewitter-Gesamtmenge nicht pauschal als flüssig interpretieren.');

// 4) Present Weather from fresh observations reaches the shared renderer and main views.
assert.ok(types.includes('presentWeather?:string'),'Stationsmodell muss Present Weather tragen.');
assert.ok(obs.includes('function metarPresentWeather')&&obs.includes('presentWeather:metarPresentWeather(r)')&&obs.includes('function representativePresentWeather'),'Beobachtungspfad muss Present Weather dekodieren und repräsentativ weitergeben.');
assert.ok(app.includes('currentObservedPhenomenon')&&app.includes('synopticPhenomenonDescription')&&app.includes('phenomenon={currentObservedPhenomenon??currentPrecip.phenomenon}'),'Aktuelles Wetter muss frisches Present Weather an WeatherPictogram geben.');
for(const [name,source,token] of [['Kurzfrist',shortTerm,'weatherPhenomenon'],['Event-Engine',eventEngine,'weatherPhenomenon'],['Event-Center',eventCenter,'weatherPhenomenon'],['Event-UI',eventPanel,'weatherPhenomenon'],['Route',route,'phenomenon'],['Route-UI',routePanel,'phenomenon'],['Wasser',water,'phenomenon'],['Detail',detail,'phenomenon'],['Periode',period,'phenomenon'],['Cockpit',cockpit,'weatherPhenomenon']]){
 assert.ok(source.includes(token),`${name} verliert die appweite phenomenon-Information.`);
}

// 5) 91/92: shower after thunder, but not a current thunderstorm and no celestial body.
assert.ok(precipitation.includes("[91,92].includes(effectiveCode)?`${inflected} Regenschauer nach Gewitter`"),'91/92 müssen textlich als Schauer nach vorangegangenem Gewitter ausgewiesen werden.');
assert.ok(pictogram.includes('afterThunderShower')&&pictogram.includes('!afterThunderShower'),'91/92 müssen Sonne/Mond im Schauerpiktogramm unterdrücken.');

// 6) HZ/FU/DU/SA may share geometry, but labels/a11y must remain semantically distinct.
for(const token of ["if(has('HZ'))return","if(has('FU'))return","if(has('DU'))return","if(has('SA'))return"])assert.ok(pictogram.includes(token),`Present Weather fehlt: ${token}`);
for(const label of ['trockener Dunst','Rauch','Staub','Sand'])assert.ok(pictogram.includes(label),`Semantische Present-Weather-Beschreibung fehlt: ${label}`);
assert.ok(pictogram.includes('synopticPhenomenonDescription'),'Zentrale Present-Weather-Beschreibung fehlt.');

// App-wide text/color semantics and binding contract.
assert.ok(weather.includes("part.type==='snow'||part.type==='snowGrains'||part.type==='snowStars'||part.type==='iceCrystals'||part.type==='icePellets'"),'Tagescharakter muss alle festen Sonderphasen als feste Niederschlagsfamilie behandeln.');
assert.ok(weather.includes('[71,73,75,76,77,78,79]'),'Codefamilie muss 76/78/79 im Schneefamilienpfad halten.');
assert.ok(colorContract.includes('Gewitter/Graupel/Hagel = `--param-precipitation-storm`')&&colorContract.includes('Eisnadeln, vereinzelten Schneesternen und Eiskörnern'),'Parameterfarbvertrag muss die neuen festen Phasen ausdrücklich festschreiben.');
assert.ok(standard.startsWith('# MID Wetterpiktogramm-Standard 2.1')&&standard.includes('Verbindliche Präzisierung v0.9.84.41')&&standard.includes('Required Regression: `scripts/test-weather-pictogram-appwide-contract-098441.mjs`'),'Weather-Pictogram-Standard 2.1 muss den neuen appweiten Vertrag enthalten.');
assert.ok(precipContract.includes('WMO 96/99 zeigen ohne Zusatzinformation ein neutrales kombiniertes Graupel-/Hagelzeichen')&&precipContract.includes('76 **Eisnadeln**')&&precipContract.includes('Present-Weather-Weitergabe'),'Niederschlagspiktogramm-Vertrag muss die sechs Präzisierungen spiegeln.');

console.log('Weather pictogram app-wide contract v0.9.84.41: OK');
