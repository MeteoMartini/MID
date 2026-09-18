import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [index,weatherMaps,styles,radar,app,pkg,publicChangelog]=await Promise.all([
 readFile(new URL('../index.html',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC14MapWorkspace.css',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../public/CHANGELOG.md',import.meta.url),'utf8')
]);
const releaseVersion=String(JSON.parse(pkg).version||'');

assert.ok(index.includes('<link rel="stylesheet" href="/src/midC14MapWorkspace.css">'),'C14 muss sein Karten-Layout global laden, damit Komposit und Wetterkarten denselben Arbeitsraum nutzen.');
for(const token of [
 'className="weather-maps-panel c14-map-workspace"',
 'className="weather-maps-primary-controls"',
 'className="weather-maps-map-stage"',
 'className="weather-maps-map-status"',
 'className="weather-maps-controls"',
 'className="weather-maps-live"',
 'className="weather-maps-advanced"',
 'className="weather-maps-meta-details"'
])assert.ok(weatherMaps.includes(token),`C14-Wetterkartenstruktur fehlt: ${token}`);
assert.ok(!weatherMaps.includes('<label><span>Zeitschritt</span>'),'Der Zeitschritt darf nicht zusätzlich zur gemeinsamen Zeitachse als dauerhaft sichtbares Auswahlfeld dupliziert werden.');
assert.ok(weatherMaps.includes("const goNearNow=()=>{setPlaying(false);if(times.length)setTimeIndex(preferredWeatherMapTimeIndex(times))}"),'Die Kartenzeitachse braucht einen belastbaren Jetzt-/Nächster-Termin-Sprung.');

for(const token of [
 '.modern-map-focus-shell',
 '.composite-focus-mode .composite-maplibre',
 '.weather-maps-panel.c14-map-workspace',
 '.weather-maps-primary-controls',
 '.weather-maps-map-stage',
 '.weather-maps-map-status',
 '.weather-maps-advanced',
 '.weather-maps-meta-details',
 'height:56svh!important',
 'height:52svh!important',
 '@media(max-width:850px) and (orientation:landscape)',
 'height:72svh!important',
 '@media(min-width:1025px)',
 '@media(prefers-reduced-motion:reduce)'
])assert.ok(styles.includes(token),`C14-Karten-/Responsive-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('Karten als Arbeitsraum statt Karten-/Control-Stapel'),'C14 muss die Map-first-Hierarchie als Designvertrag dokumentieren.');
assert.ok(!/(^|[;{\s])filter\s*:\s*blur\(/m.test(styles),'Fachliche Kartenflächen dürfen nicht mit CSS filter:blur verfremdet werden; backdrop-filter für Controls bleibt zulässig.');
assert.ok(radar.includes('className={`card composite-card${focusMode?\' composite-focus-mode\':\'\'}`}'),'Das bestehende Komposit muss weiterhin den dedizierten Fokusmodus verwenden.');
assert.ok(radar.includes('className="composite-timeline-card"'),'Radar, Satellit, Nowcast und Modelltermine müssen die bestehende gemeinsame Kartenzeitachse behalten.');
assert.ok(radar.includes('<details className="composite-advanced">'),'Erweiterte Kartenlayer müssen im Fokusmodus einklappbar bleiben.');
assert.ok(app.includes("const MODERN_MAP_MODULES:DashboardModuleId[]=['composite','weather-maps'];"),'Komposit und Wetterkarten müssen weiterhin derselben Karten-Navigation zugeordnet sein.');
assert.match(releaseVersion,/^0\.9\.85\.\d+$/,'C14 muss innerhalb der 0.9.85-Releasefolge gebaut werden.');
assert.ok(publicChangelog.startsWith(`# MID v${releaseVersion}`),`Der ausgelieferte Changelog muss mit der aktuellen Releaseversion v${releaseVersion} beginnen.`);

console.log(`MID-C14: Karten als map-first Arbeitsraum, eine Zeitachse, eingeklappte Sekundärsteuerung und Smartphone-/Tablet-/Desktop-Dichte für v${releaseVersion} geprüft.`);
