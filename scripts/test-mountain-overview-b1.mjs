import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [entry,styles,app]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC18WorkPackageB1MountainOverview.css',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
]);

const baseStyles=entry.indexOf("import './styles.css'");
const previousMountainStyles=entry.indexOf("import './midC18WorkPackageAForecastRows.css'");
const overviewStyles=entry.indexOf("import './midC18WorkPackageB1MountainOverview.css'");
assert.ok(baseStyles>=0&&previousMountainStyles>baseStyles&&overviewStyles>previousMountainStyles,
 'Die B1-Styles müssen nach den allgemeinen und bisherigen Forecast-Styles geladen werden.');

assert.ok(styles.includes('.mountain-ski .mountain-forecast-overview'),
 'Die neuen Regeln müssen auf die aktive Bergübersicht begrenzt sein.');
assert.match(styles,/\.mountain-seven-day-row\s*\{[^}]*border-radius:\s*9px/s,
 'Die kompakten Tageszeilen sollen visuell als zusammengehörige Tabellenzeilen erscheinen.');
assert.match(styles,/\.mountain-day-toggle\s*\{[^}]*min-height:\s*59px/s,
 'Die Tageszusammenfassung benötigt ihre kompakte Zeilenhöhe.');
assert.match(styles,/grid-template-areas:[\s\S]*?"wind wind precip precip"/,
 'Auf schmalen Ansichten müssen Wind und Niederschlag als getrennte Gruppen angeordnet sein.');
assert.match(styles,/\.mountain-period-table-scroll\s*\{[^}]*overflow-x:\s*auto/s,
 'Die Intervalltabelle muss bei schmalen Ansichten intern horizontal scrollbar bleiben.');
assert.match(styles,/\.mountain-period-grid\s*\{[^}]*min-width:\s*680px/s,
 'Die Intervallwerte müssen in einer kompakten, spaltenorientierten Tabelle lesbar bleiben.');
assert.match(styles,/\.mountain-day-snow-value\.mountain-snow-heavy[\s\S]*?background:/,
 'Starker Schneefall braucht eine eigenständige Intensitätsdarstellung.');
assert.doesNotMatch(styles,/\.mountain-precip-(?:trace|light|moderate|heavy)\s*\{/,
 'Die B1-Styles dürfen die bestehende Flüssigniederschlags-Farbskala nicht überschreiben.');

const overview=app.slice(app.indexOf('function MountainForecastOverview'),app.indexOf('function MountainLevel'));
assert.ok(overview.includes('<MountainForecastDayRow'),
 'Die kompakte Gestaltung muss auf dem tatsächlich aktiven Sieben-Tage-Weg liegen.');
assert.ok(overview.includes('<table className="mountain-period-grid"'),
 'Die geöffnete Tagesansicht muss weiterhin die semantische Intervalltabelle verwenden.');
assert.match(overview,/mountain-day-precip-rain \$\{precipClass\}/,
 'Der Tagesregen muss seine bestehende Niederschlags-Intensitätsklasse behalten.');
assert.match(overview,/mountain-day-snow-value \$\{snowClass\}/,
 'Der Neuschnee muss weiterhin seine separate Schnee-Intensitätsklasse erhalten.');

console.log('Bergübersicht B1: kompakte Tageszeilen, responsive Intervalltabelle und getrennte Regen-/Schneestile geprüft.');