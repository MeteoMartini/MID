import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles,rowStyles,cockpit,publicChangelog,packageJson]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC12ForecastRedesign.css',import.meta.url),'utf8'),
 readFile(new URL('../src/midC18ForecastRows.css',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../public/CHANGELOG.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const releaseVersion=JSON.parse(packageJson).version;

assert.ok(main.includes("import './midC11TodayRedesign.css';\nimport './midC12ForecastRedesign.css';"),'C12 muss nach dem Heute-Redesign geladen werden.');
for(const token of [
 'className="cockpit-seven-grid"',
 'className={`cockpit-day mid-forecast-row regime-${regime}',
 'className="cockpit-day-hourly-accordion mid-forecast-row-detail"',
 'className="cockpit-fourteen-grid"',
 'className={`cockpit-fourteen-card mid-forecast-row regime-${item.regime}',
 'className="cockpit-focus-card fourteen mid-forecast-row-detail"',
 'data-cockpit-horizontal-scroll="true"'
])assert.ok(cockpit.includes(token),`Vorhersage-Grundstruktur fehlt: ${token}`);

for(const token of [
 '.forecast-cockpit.modern-workspace',
 '.modern-forecast-horizons',
 '.cockpit-seven-grid',
 '.cockpit-seven-grid>.cockpit-day',
 '.cockpit-day-hourly-accordion',
 '.cockpit-fourteen-grid',
 '.cockpit-fourteen-card',
 '.cockpit-focus-card.fourteen',
 'grid-auto-flow:column!important',
 'scroll-snap-type:x proximity!important',
 '@media(max-width:1024px)',
 '@media(max-width:900px) and (orientation:portrait)',
 '@media(max-width:850px)',
 '@media(max-width:430px)',
 '@media(max-width:850px) and (orientation:landscape)',
 'env(safe-area-inset-bottom)',
 'prefers-reduced-motion'
])assert.ok(styles.includes(token),`C12-Konzeptregel fehlt: ${token}`);

assert.ok(styles.includes('one forecast workspace, not a deck of equal cards'),'Vorhersage muss als ein Arbeitsraum statt als Kartenstapel dokumentiert sein.');
assert.ok(styles.includes('curve is the dominant visualization'),'7-Tage-Verlauf muss die visuelle Hierarchie anführen.');
assert.ok(styles.includes('contiguous columns'),'14-Tage-Tage müssen als zusammenhängende Spalten gestaltet sein.');
assert.ok(styles.includes('Selected 14-day detail is a low information band'),'14-Tage-Auswahl darf keine zweite gleichgewichtete Hero-Karte erzeugen.');
for(const token of ['.mid-forecast-row','.mid-forecast-row-detail','grid-auto-flow:row!important','@media(max-width:720px)'])assert.ok(rowStyles.includes(token),`E-Forecast-Row-Regel fehlt: ${token}`);
assert.ok(main.indexOf("import './midC18ForecastRows.css';")>main.indexOf("import './midC12ForecastRedesign.css';"),'Arbeitspaket E muss den historischen C12-Kartenlayer zuletzt übersteuern.');
assert.ok(/\.cockpit-seven-grid>\.cockpit-day\.active\{[\s\S]*?box-shadow:inset 0 3px 0 var\(--primary\)!important/.test(styles),'Gewählter 7-Tage-Tag muss eindeutig markiert sein.');
assert.ok(/\.cockpit-fourteen-card\.active\{[\s\S]*?box-shadow:inset 0 3px 0 var\(--primary\)!important/.test(styles),'Gewählter 14-Tage-Tag muss eindeutig markiert sein.');
assert.ok(!styles.includes('filter:blur('),'Fachliche Prognoseflächen dürfen nicht durch dekorative Unschärfe beeinträchtigt werden.');
assert.ok(main.includes('const target=`${import.meta.env.BASE_URL}CHANGELOG.md`'),'Der In-App-Changelog muss auf die mit dem Release ausgelieferte aktuelle Datei zeigen.');
assert.ok(main.includes('pointChangelogLinkToBundledRelease();'),'Der In-App-Changelog-Link muss nach dem React-Start aktiviert werden.');
assert.ok(publicChangelog.startsWith(`# MID v${releaseVersion}`),`Der ausgelieferte Changelog muss mit der aktuellen Releaseversion v${releaseVersion} beginnen.`);
assert.ok(publicChangelog.includes('# MID v0.9.85.31')&&publicChangelog.includes('# MID v0.9.85.30'),'Der externe Changelog darf die unmittelbar vorherigen Redesign-Schritte nicht auslassen.');

console.log(`MID-C12/E: zusammenhängender Prognose-Arbeitsraum mit gemeinsamer 7-/14-Tage-Row und aktuellem In-App-Changelog für v${releaseVersion} geprüft.`);
