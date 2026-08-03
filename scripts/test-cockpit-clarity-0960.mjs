import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),cockpit=readFileSync(new URL('src/ForecastCockpit.tsx',root),'utf8'),css=readFileSync(new URL('src/styles.css',root),'utf8');
for(const token of ['regularShortTermPoints','cockpit-now90','cockpit-inline-toggle','WeatherPictogram code={point.code}','cockpit-day-regime','regimeLabel(regime)','formatDecimalFixed(day.precipitation,1)} mm','cockpit-fourteen-row'])assert.ok(cockpit.includes(token),`Klarheitsbaustein fehlt: ${token}`);
assert.ok(!cockpit.includes('Blaue Balken: Niederschlag'),'Nicht zum Diagramm passende Balkenerklärung darf nicht mehr erscheinen.');
assert.ok(!cockpit.includes('cockpit-short-legend'),'Die veraltete Kurzfristlegende darf nicht mehr gerendert werden.');
assert.ok(!cockpit.includes('cockpit-phase-line'),'Die uneindeutige 7-Tage-Phasenleiste darf nicht mehr gerendert werden.');
for(const token of ['.cockpit-now90','.cockpit-inline-toggle','.cockpit-day-regime','.cockpit-fourteen-row'])assert.ok(css.includes(token),`Klarheits-CSS fehlt: ${token}`);
console.log('MID v0.9.7.0 Cockpit-Klarheit geprüft: 90-Minuten-Blick, 3h/1h-Umschaltung, klare 7-/14-Tage-Parameter.');
