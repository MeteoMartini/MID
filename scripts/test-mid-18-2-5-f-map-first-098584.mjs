import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [radar,maps,synoptic,styles,main]=await Promise.all([
 read('src/RadarPanel.tsx'),
 read('src/WeatherMapsPanel.tsx'),
 read('src/SynopticPanel.tsx'),
 read('src/midC18MapFirstWorkspace.css'),
 read('src/main.tsx')
]);

// Radar/Satellit/Komposit: vorhandener gemeinsamer fachlicher Zeitvertrag bleibt unverändert.
for(const token of [
 "viewMode==='radar'",
 "viewMode==='satellite'",
 "viewMode==='synoptic'",
 'const timelineContract=useMemo',
 'buildAvailableCompositeTimeline(referenceSeconds,timelineContract,90)',
 'className="composite-timeline-card"',
 'className="radar-playback-buttons"',
 'className="composite-playback-speed"',
 'onClick={goLive}',
 'className="layer-opacity-controls"',
 'value={radarOpacity}',
 'value={satelliteOpacity}',
 'value={modelOpacity}'
])assert.ok(radar.includes(token),`F-Radar-/Kompositvertrag fehlt: ${token}`);

assert.ok(radar.includes('Langsam · 4,8 s')&&radar.includes('Normal · 2,4 s')&&radar.includes('Schnell · 1,2 s'),'Playback-Geschwindigkeit muss erhalten bleiben.');
assert.ok(radar.includes('Beobachtung')&&radar.includes('Nowcast')&&radar.includes('Modell'),'Beobachtung, Nowcast und Modell müssen fachlich getrennt bleiben.');
assert.ok(radar.includes('250-m-Radar und Warnkarte erscheinen nur im Live-Zustand'),'Live-only-Vertrag für hochauflösendes Radar/Warnkarte muss erhalten bleiben.');

// DWD-Modellkarten behalten ihre vorhandene Timeline und per Produkt gespeicherte Deckkraft.
for(const token of [
 "const SETTINGS_KEY='mid:weather-maps:v2'",
 'opacity:number',
 '[opacity,setOpacity]=useState(initial.opacity)',
 'preferredWeatherMapTimeIndex',
 'className="weather-maps-controls"',
 'className="weather-maps-playback"',
 'className="weather-maps-timeline"',
 'className="weather-maps-live"',
 'className="weather-maps-opacity"',
 'opacity={opacity/100}'
])assert.ok(maps.includes(token),`F-Modellkartenvertrag fehlt: ${token}`);

// Synoptik bleibt ein echtes Analyseprodukt ohne erfundene Playback-/Opacity-Steuerung.
assert.ok(synoptic.includes('className="synoptic-panel"'),'Synoptik-Arbeitsraum fehlt.');
assert.ok(synoptic.includes('Amtliche DWD-Bodenanalyse')&&synoptic.includes('Interaktive MID-Synoptik'),'Amtliche und interaktive Synoptik müssen erhalten bleiben.');
assert.ok(synoptic.includes('Isobaren, H/T, lesbare Stationsplots und objektive Modellfronten'),'Synoptische Fachdarstellung muss erhalten bleiben.');
assert.ok(!synoptic.includes('synoptic-playback-speed')&&!synoptic.includes('synoptic-opacity-slider'),'F darf keine künstliche Synoptik-Zeitachse oder Scheindeckkraft einführen.');

for(const token of [
 '.composite-card .radarmap',
 '.weather-maps-map-shell',
 '.synoptic-map-wrap',
 'min-height:clamp(300px,56vh,620px)!important',
 '.composite-timeline-card,.weather-maps-controls',
 '.layer-opacity-controls,.weather-maps-opacity',
 '.synoptic-reference-grid>.synoptic-map-panel',
 '@media(max-width:720px)',
 '@media(min-width:900px) and (orientation:landscape)',
 'env(safe-area-inset-bottom)',
 'prefers-reduced-motion'
])assert.ok(styles.includes(token),`F-Map-first-Regel fehlt: ${token}`);

assert.ok(styles.includes('order:1!important')&&styles.includes('.synoptic-reference-grid>.official-analysis{order:2!important'),'Interaktive Synoptik muss vor der amtlichen Referenz komponiert werden.');
assert.ok(styles.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),'Schmale Layerauswahl muss zweispaltig umbrechen.');
assert.ok(main.indexOf("import './midC18MapFirstWorkspace.css';")>main.indexOf("import './midC18ForecastRows.css';"),'F-Designlayer muss nach dem bisherigen Redesign geladen werden.');

console.log('MID v0.9.85.84 · Arbeitspaket F: map-first Radar/Satellit/Komposit/Modellkarten/Synoptik bei unveränderter Fachlogik geschützt.');
