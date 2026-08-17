import {readFile} from 'node:fs/promises';

const radar=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const overlay=await readFile(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
const weatherMaps=await readFile(new URL('../src/WeatherMapsData.ts',import.meta.url),'utf8');
const worker=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const sevenDay=await readFile(new URL('../src/SevenDayForecastSummary.tsx',import.meta.url),'utf8');

function assert(condition,message){if(!condition)throw new Error(message)}

// Composite precipitation type must have exactly one active implementation: observed OPERA echo + dynamically selected Rapid/Regional model phase.
assert(!/Hymec|hymec/.test(radar),'RadarPanel darf HymecNG nicht mehr als Niederschlagsart-Option, Import oder Fallback enthalten.');
assert(/precipitationTypeMode:'none'\|'radar-model'/.test(radar),'Niederschlagsart muss ausschließlich none/radar-model kennen.');
assert(/LazyRadarModelPrecipTypeOverlay/.test(radar)&&/Niederschlagsart-Symbole · Radar \+ Rapid-\/Regionalmodell/.test(radar),'Radar-/Rapidmodell-Symboloverlay und eindeutige Kennzeichnung fehlen.');
assert(!/Hagelsignal im Modell/.test(radar),'Ein unbestätigtes Modell-Hagelsignal darf nicht als Niederschlagsart-Legendenklasse erscheinen.');

assert(/loadOperaRasterData/.test(overlay)&&/loadWeatherPhaseGrid/.test(overlay),'Phasenlayer muss Beobachtungsradar und dynamisches Regionalmodell gemeinsam verwenden.');
assert(/Math\.abs\(targetMs-operaMs\)>12\*60000/.test(overlay),'OPERA-Zeitabstand muss begrenzt sein.');
assert(/maxTimeDelta=grid\.stale\?45\*60000:20\*60000/.test(overlay),'Modell-Zeitabstand muss für Frisch- und Ersatzfelder begrenzt sein.');
assert(/Number\(grid\.modelAgeHours\)>16/.test(overlay),'Modell-Laufalter muss zusätzlich im Frontend begrenzt sein.');
assert(/phase\.confidence==='eingeschränkt'\)continue/.test(overlay),'Unsichere Phasen müssen ausgeblendet bleiben.');
assert(/HtmlMarker/.test(overlay)&&!/GeoJsonLayers|fill-opacity/.test(overlay),'Niederschlagsarten müssen als kleine Symbole statt als flächige Rasterpolygone erscheinen.');
assert(/asSymbolPhase\(phase\.phase\)/.test(overlay),'Nur explizit freigegebene nichtflüssige bzw. gemischte Phasen dürfen Symbole erhalten.');
assert(/explicitHail=\[96,99\]\.includes\(code\)/.test(overlay)&&/explicitSnowGrains=\[77\]\.includes\(code\)/.test(overlay)&&/phase:'graupel'/.test(overlay),'Hagel, Schneekörner und konservativ abgeleitete Graupel/Eiskörner müssen aus beobachtungsnahen Signalen ableitbar sein.');
assert(/if\(!typed\|\|phase\.confidence==='eingeschränkt'\)continue/.test(overlay),'Reiner flüssiger Niederschlag und unsichere Phasen dürfen kein zusätzliches Symbol erhalten.');

assert(/loadWeatherPhaseGrid/.test(weatherMaps)&&/precipitation-phase-grid/.test(weatherMaps),'Eigener Phasenraster-Endpunkt fehlt.');
assert(/const rows=13,cols=19/.test(worker),'Phasenraster muss das rate-limit-sichere lokale 13×19-Raster verwenden.');
for(const field of ['wet_bulb_temperature_2m','snowfall_height','freezing_level_height','weather_code','precipitation','rain','snowfall'])assert(worker.includes(field),`Phasenrasterfeld fehlt: ${field}`);
assert(/fields='[^']+'/.test(worker)&&/frame\.showers\.push\(0\)/.test(worker),'Schauer dürfen für die Phasenklassifikation ohne eigenen API-Kanal neutral belegt werden.');
assert(/valid<coordinates\.length\*\.9/.test(worker),'Unvollständige Modellfelder müssen abgelehnt werden.');
assert(/maxRunAgeMs=model\.rapidUpdate\?Math\.max\(5\*3600000/.test(worker),'Worker muss Rapid-Update-Läufe konservativ nach Laufalter begrenzen.');

// Grammar protection for the generated 7-day prose.
assert(sevenDay.includes("mit einer möglichen Tropennacht"),'Tropennacht-Formulierung muss vollständig flektiert sein.');
assert(sevenDay.includes("wechselnd bewölkt mit sonnigen Abschnitten und überwiegend trocken"),'Mischwetter-Satz darf nicht mit „Am … mit …“ fragmentieren.');
assert(sevenDay.includes("${plural?'sind':'ist'} ${event} möglich"),'Nachtzusatz braucht ein finites Verb.');
assert(!sevenDay.includes("event.toLocaleLowerCase('de-DE')"),'Wetterereignisse wie Schauer dürfen nicht kleingeschrieben werden.');

console.log('Komposit-Phasenfusion, Rate-Limit-Schutz und 7-Tage-Grammatik geschützt.');
