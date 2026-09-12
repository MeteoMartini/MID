import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const test='scripts/test-shortterm-composite-readability-098467.mjs';
const features=readFileSync('src/styles-src/10-features.css','utf8');
const composite=readFileSync('src/styles-src/20-ensemble-composite.css','utf8');
const modern=readFileSync('src/styles-src/30-modern.css','utf8');
const aggregate=readFileSync('src/styles.css','utf8');
const shortTerm=readFileSync('src/ShortTermForecast.tsx','utf8');
const radar=readFileSync('src/RadarPanel.tsx','utf8');
const cockpit=readFileSync('src/ForecastCockpit.tsx','utf8');
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const baseline=JSON.parse(readFileSync('MID_BASELINE.json','utf8'));

for(const [source,marker] of [
 [features,'/* MID v0.9.84.67 · UI-Audit: Kurzfrist-/Komposit-Legenden lesbarer und touchfreundlicher */'],
 [composite,'/* MID v0.9.84.67 · UI-Audit: 90-Minuten-Nowcast und Kompositbedienung standardisiert */'],
 [modern,'/* MID v0.9.84.67 · UI-Audit: Kurzfrist-/24-h-Profil lesbarer ohne Verlust der Diagrammdichte */']
])assert.ok(source.includes(marker),`UI-Audit-Marker fehlt: ${marker}`);

for(const token of [
 '.short-term-header.forecast-entry-head>span>small{font-size:var(--mid-text-micro)}',
 '.short-term-thunder,.short-term-wind small,.short-term-precip small,.short-term-precip em{font-size:var(--mid-text-micro)}',
 '.short-term-detail>header button{width:36px;height:36px;min-width:36px;min-height:36px}',
 '.radarlegend-toggle,.radarlegend.compact.collapsed .radarlegend-toggle{min-height:40px!important}',
 '.cockpit-weather-profile__icon-toggle,.cockpit-weather-profile__icon-toggle.compact{min-width:40px!important;min-height:40px!important;width:40px!important;height:40px!important}'
])assert.ok(modern.includes(token),`Kaskadenabschluss fehlt: ${token}`);

for(const token of [
 '.nowcast-object-legend span{font-size:var(--mid-text-micro);line-height:1.25}',
 '.radarlegend-toggle small{font-size:var(--mid-text-micro)!important;line-height:1.15}',
 '.legend-active-chips em{font-size:var(--mid-text-micro);line-height:1.15}'
])assert.ok(features.includes(token),`Komposit-Legendenstandard fehlt: ${token}`);

for(const token of [
 '.cockpit-now90-weather{font-size:var(--mid-text-micro);line-height:1.25}',
 '.cockpit-now90-meta{font-size:var(--mid-text-micro)!important;line-height:1.2}',
 '.composite-view-tabs>button{min-height:44px}',
 '.composite-view-tabs small{font-size:var(--mid-text-micro)!important;line-height:1.2}',
 '.composite-switch.compact small{font-size:var(--mid-text-micro)!important;line-height:1.25!important}',
 '.composite-live-button{min-height:40px;font-size:var(--mid-text-xs)}',
 '.composite-site-summary article small,.composite-site-summary article span{font-size:var(--mid-text-micro);line-height:1.25}'
])assert.ok(composite.includes(token),`90-min-/Kompositstandard fehlt: ${token}`);

for(const token of [
 '.cockpit-hourly-day-marker{min-height:20px;font-size:var(--mid-text-micro);line-height:1.1}',
 '.cockpit-hourly-meta-row{font-size:var(--mid-text-micro);line-height:1.2}',
 '.cockpit-weather-profile__signals small{font-size:var(--mid-text-micro)}',
 '.cockpit-weather-profile .profile-lane-label{font-size:8.4px}',
 '.cockpit-weather-profile .profile-axis .axis-label,.cockpit-weather-profile .profile-axis .profile-scale-label{font-size:7.8px}',
 '.cockpit-weather-profile .wind-warning-threshold-label{font-size:6.6px}',
 '.cockpit-weather-profile .profile-bottom-time text{font-size:7.2px}'
])assert.ok(modern.includes(token),`Kurzfrist-/24-h-Lesbarkeitsstandard fehlt: ${token}`);

// Funktionsschutz: interaktive Kurzfrist-, Komposit- und Profilfunktionen bleiben im Produktionscode erhalten.
for(const token of [
 'className="card short-term-forecast"',
 'className="short-term-strip"',
 'onClick={()=>selectPoint(point.id)}'
])assert.ok(shortTerm.includes(token),`Kurzfristfunktion fehlt nach UI-Audit: ${token}`);
for(const token of [
 'className="composite-view-tabs"',
 'className="composite-layer-switches"',
 'className="composite-timeline-card"',
 'className={`composite-live-button${liveFollow?\' active\':\'\'}`}',
 'className={`radarlegend compact ${expanded?\'expanded\':\'collapsed\'}`}'
])assert.ok(radar.includes(token),`Kompositfunktion fehlt nach UI-Audit: ${token}`);
for(const token of [
 'className="cockpit-now90"',
 'className="cockpit-hourly-preview-shell"',
 'className="cockpit-meteogram-pro cockpit-weather-profile"',
 'className="cockpit-weather-profile__resolution"',
 'className="selected-time-values"'
])assert.ok(cockpit.includes(token),`Forecast-/Profilfunktion fehlt nach UI-Audit: ${token}`);

const parts=['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css']
 .map(name=>readFileSync(`src/styles-src/${name}`,'utf8')).join('');
assert.equal(aggregate,parts,'src/styles.css muss exakt aus den kanonischen Styles-Modulen erzeugt sein.');
assert.equal(pkg.scripts?.['test:shortterm-composite-readability'],`node ${test}`,'package.json: Kurzfrist-/Komposit-Lesbarkeitstest fehlt.');
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);

console.log(`MID v${pkg.version}: Kurzfrist, 90-Minuten, Komposit und 24-h-Profil sind lesbarer und funktionsgeschützt.`);
