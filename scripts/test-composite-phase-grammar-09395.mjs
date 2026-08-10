import {readFile} from 'node:fs/promises';

const radar=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const overlay=await readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
const weatherMaps=await readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8');
const worker=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');

function assert(condition,message){if(!condition)throw new Error(message)}

// Composite precipitation type must have exactly one active implementation: observed OPERA echo + ICON-D2 phase.
assert(!/Hymec|hymec/.test(radar),'RadarPanel darf HymecNG nicht mehr als Niederschlagsart-Option, Import oder Fallback enthalten.');
assert(/precipitationTypeMode:'none'\|'radar-model'/.test(radar),'Niederschlagsart muss ausschließlich none/radar-model kennen.');
assert(/LazyRadarModelPrecipTypeOverlay/.test(radar)&&/Niederschlagsart · Radar\+ICON-D2/.test(radar),'Radar-/ICON-D2-Overlay und eindeutige Kennzeichnung fehlen.');
assert(!/Hagelsignal im Modell/.test(radar),'Ein unbestätigtes Modell-Hagelsignal darf nicht als Niederschlagsart-Legendenklasse erscheinen.');

assert(/loadOperaRasterData/.test(overlay)&&/loadWeatherPhaseGrid/.test(overlay),'Phasenlayer muss Beobachtungsradar und ICON-D2 gemeinsam verwenden.');
assert(/Math\.abs\(targetMs-operaMs\)>12\*60000/.test(overlay),'OPERA-Zeitabstand muss begrenzt sein.');
assert(/Math\.abs\(modelMs-targetMs\)>20\*60000/.test(overlay),'ICON-D2-Zeitabstand muss begrenzt sein.');
assert(/modelMs-referenceMs>5\*60\*60000/.test(overlay),'ICON-D2-Laufalter muss konservativ begrenzt sein.');
assert(/phase\.phase==='uncertain'\|\|phase\.confidence==='eingeschränkt'/.test(overlay),'Unsichere Phasen müssen transparent bleiben.');
assert(/subdivisions=1/.test(overlay),'Das Phasenraster darf keine künstliche optische Unterteilung vortäuschen.');
assert(!/phase:'hail'/.test(overlay),'Hagel darf ohne beobachtungsbasierte Phasenerkennung nicht als eigene Phase gerendert werden.');

assert(/loadWeatherPhaseGrid/.test(weatherMaps)&&/precipitation-phase-grid/.test(weatherMaps),'Eigener Phasenraster-Endpunkt fehlt.');
assert(/const rows=35,cols=49/.test(worker),'Phasenraster muss die verdichtete lokale Stichprobe 35×49 verwenden.');
for(const field of ['wet_bulb_temperature_2m','snowfall_height','freezing_level_height','weather_code','precipitation','rain','showers','snowfall'])assert(worker.includes(field),`Phasenrasterfeld fehlt: ${field}`);
assert(/valid<coordinates\.length\*\.9/.test(worker),'Unvollständige ICON-D2-Felder müssen abgelehnt werden.');
assert(/modelTimeMs-referenceMs>5\*60\*60000/.test(worker),'Worker muss zu alte ICON-D2-Läufe ablehnen.');

// Grammar protection for the generated 7-day prose.
assert(app.includes("mit einer möglichen Tropennacht"),'Tropennacht-Formulierung muss vollständig flektiert sein.');
assert(app.includes("wechselnd bewölkt mit sonnigen Abschnitten und überwiegend trocken"),'Mischwetter-Satz darf nicht mit „Am … mit …“ fragmentieren.');
assert(app.includes("${plural?'sind':'ist'} ${event} möglich"),'Nachtzusatz braucht ein finites Verb.');
assert(!app.includes("event.toLocaleLowerCase('de-DE')"),'Wetterereignisse wie Schauer dürfen nicht kleingeschrieben werden.');

console.log('Komposit-Phasenfusion und 7-Tage-Grammatik v0.9.39.5 geschützt.');
