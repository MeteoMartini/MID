import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');

const cockpit=read('src/ForecastCockpit.tsx');
const css=read('src/styles.css');
const pkg=JSON.parse(read('package.json'));
const baseline=JSON.parse(read('MID_BASELINE.json'));
const changelog=read('CHANGELOG.md');
const implementation=read('MID_IMPLEMENTATION_0.9.76.17.md');

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
assert.ok(changelog.includes('# v0.9.76.17'),'Changelog-Eintrag v0.9.76.17 fehlt.');
assert.ok(implementation.includes('kompaktere Seitenränder'),'Implementierungsnachweis dokumentiert die Kompaktanpassung nicht.');
assert.ok(!cockpit.includes('gleitend ab {profileWindowStartLabel}'),'Der selbsterklärende Gleitfenster-Schriftzug muss entfernt bleiben.');
assert.ok(!cockpit.includes('<em>{profileWindowStartLabel} bis {profileWindowEndLabel} Uhr</em>'),'Die überflüssige Kopf-Pille ist noch vorhanden.');
assert.ok(!cockpit.includes('profileWindowEndLabel'),'Entfernte Ende-Pille darf keine unbenutzte TypeScript-Konstante zurücklassen.');
assert.ok(cockpit.includes('chartPaddingLeft=compactProfile?60:chartViewportWidth<=860?70:82'),'Linker Diagrammrand wurde nicht kompakter ausgelegt.');
assert.ok(cockpit.includes('chartPaddingRight=compactProfile?24:chartViewportWidth<=860?28:34'),'Rechter Diagrammrand wurde nicht kompakter ausgelegt.');
assert.ok(cockpit.includes('className="profile-bottom-date"'),'Untere Zeitachse enthält keine ergänzende Tagesmarke.');
assert.ok(!cockpit.includes('cockpit-meteogram-pro__overlay calendar'),'Die dominante obere Kalenderachse ist noch eingeblendet.');
assert.ok(css.includes('.cockpit-weather-profile .cockpit-meteogram-pro__svg .night-band{opacity:.42;pointer-events:none}'),'Nachtstunden müssen wieder klar, aber dezent schraffiert sichtbar sein.');
assert.ok(css.includes('.cockpit-weather-profile .profile-bottom-date{'),'CSS für die kompaktere untere Tagesmarke fehlt.');
assert.ok(css.includes('.cockpit-weather-profile .profile-selected-time-tag rect{'),'CSS für die Uhrzeit an der blauen Auswahlachse fehlt.');
assert.ok(css.includes('.cockpit-weather-profile .profile-axis .axis-label{fill:var(--mg-muted);font:800 8px/1 Inter,ui-sans-serif,system-ui,sans-serif;font-variant-numeric:tabular-nums;paint-order:stroke fill;'),'Achsenbeschriftungen wurden nicht gegen Überdeckung gehärtet.');

console.log('24-h-Wetterprofil: Zeitpille entfernt, Seitenränder verdichtet, Achsen vereinheitlicht und Nachtmarkierung entschärft.');
