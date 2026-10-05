import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readAppFeatureSources();
const css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');

assert.doesNotMatch(app,/function MountainForecastMatrix\b/,'Der abgelöste Höhenvergleich darf nicht als tote sichtbare UI-Komponente erhalten bleiben.');
assert.doesNotMatch(app,/Höhenvergleich · (?:Winterprofil|Bergwetter) nach Höhenzone/,'Der alte sichtbare Höhenvergleich muss vollständig entfernt sein.');
assert.match(app,/function MountainForecastLoading\(/,'Die Bergprognose braucht eine sofortige strukturierte Ladeansicht.');
assert.match(app,/className="mountain-loading-skeleton"/,'Das strukturierte Skeleton der Höhenprognose fehlt.');
assert.match(app,/function MountainHourlyForecast\(/,'Die neue stündliche Höhenprognose fehlt.');
assert.match(app,/className="mountain-hourly-scroll"/,'Die stündliche Höhenprognose braucht einen eigenen Scrollbereich.');
assert.match(app,/className="mountain-hourly-grid"/,'Das stündliche Höhenraster fehlt.');
assert.match(app,/className="mountain-level-picker"/,'Die Tal-/Mitte-/Berg-Auswahl fehlt.');
assert.match(app,/7-Tage-Überblick · \{level\.name\|\|mountainLevelLabel\(level\.role\)\} · \{Math\.round\(level\.elevation\)\} m ü\. NHN/,'Die kompakte Sieben-Tage-Prognose muss die gewählte Höhenstufe nennen.');
assert.match(css,/\.mountain-loading-skeleton\{/,'Styles für die sofortige Bergprognose-Vorschau fehlen.');
assert.match(css,/\.mountain-hourly-scroll\{[^}]*overflow:auto/,'Das stündliche Raster muss intern scrollen statt die Seite zu verbreitern.');
assert.match(css,/\.mountain-seven-day-row\{/,'Styles für die kompakten Tageszeilen fehlen.');

console.log('Berg-/Wintersport: alter Höhenvergleich entfernt; Skeleton, Höhenwahl, Stundenraster und kompakter 7-Tage-Vertrag geschützt.');
