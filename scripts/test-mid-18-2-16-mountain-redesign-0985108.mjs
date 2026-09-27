import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,mountain,conditions,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/mountainSports.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/currentConditions.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
]);

assert.doesNotMatch(app,/function MountainForecastMatrix\b|Höhenvergleich · (?:Winterprofil|Bergwetter) nach Höhenzone/,'Der abgelöste Höhenvergleich darf nicht mehr Teil der sichtbaren Bergwetter-UI sein.');
assert.match(app,/function MountainForecastLoading\(/,'Die Höhenprognose braucht eine sofortige strukturierte Ladeansicht.');
assert.match(app,/className="mountain-loading-skeleton"/,'Die sofortige Skeleton-Vorschau fehlt.');
assert.match(app,/function MountainHourlyForecast\(/,'Die stündliche Höhenprognose fehlt.');
assert.match(app,/className="mountain-hourly-grid"/,'Das 24-h-Höhenraster fehlt.');
assert.match(app,/className="mountain-level-picker"/,'Die Tal-/Mitte-/Berg-Auswahl fehlt.');
assert.match(app,/7-Tage-Überblick · \{level\.name\|\|mountainLevelLabel\(level\.role\)\}/,'Die kompakte 7-Tage-Höhenansicht fehlt.');
assert.match(app,/validateWindPair\(row\.wind,row\.gust\)/,'Stündlicher Wind/Böen-Pfad muss plausibilisiert bleiben.');
assert.match(app,/mountainNewSnowLabel\(level\.pastSnow24Cm\)/,'Rückblickender Neuschnee muss über den gemeinsamen Schneeformatvertrag laufen.');
assert.match(app,/Number\.isFinite\(level\.measuredSnowDepthCm\).*Number\.isFinite\(level\.modelSnowDepthCm\)/s,'Schneedecke muss Messung und Modell getrennt priorisieren.');
assert.match(mountain,/priority:'foreground'/,'Die sichtbare Höhen-Kernprognose muss Vordergrundpriorität besitzen.');
assert.match(mountain,/priority:'background'/,'Optionale Bergdiagnostik muss im Hintergrund bleiben.');
assert.match(styles,/\.mountain-hourly-scroll\{[^}]*overflow:auto/,'Das Stundenraster muss intern scrollen statt die Seite zu verbreitern.');
assert.match(styles,/MID 18\.2\.16 · ruhige Berg-\/Winter-Hierarchie/,'Die vereinheitlichte untere Berg-/Winter-Hierarchie fehlt.');
assert.match(styles,/\.mountain-avalanche-status>a\{[^}]*var\(--primary\)/,'Die amtliche Lawinenquelle darf ohne reale Gefahrenstufe keine künstliche Warnfarbe erzwingen.');
assert.match(conditions,/export function analysedCloudOktas\(percent:number\)/,'Die Semantik für kontinuierliche analysierte Bewölkung fehlt.');
assert.match(conditions,/if\(bounded>=100\)return 8/,'8\/8 muss bei analysierter Prozentbewölkung vollständiger Bedeckung vorbehalten bleiben.');

console.log('MID 18.2.16: stündliches Bergwetter, kompakte Höhenprognose, ruhige Winterhierarchie und analysierte Bewölkungssemantik geschützt.');
