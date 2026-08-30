import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [source,component,baselineText]=await Promise.all([
 readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

for(const forbidden of [
 '.forecast-cockpit:has(.cockpit-fourteen-day) .cockpit-header',
 '.forecast-cockpit:has(.cockpit-fourteen-day) .cockpit-tabs',
 '.forecast-cockpit:has(.cockpit-fourteen-day) .cockpit-tab-icon',
 '.forecast-cockpit:has(.cockpit-fourteen-day) .cockpit-tab-copy>small',
 '.forecast-cockpit:has(.cockpit-fourteen-day) .cockpit-mini-ribbon',
 '.mode-cockpit-tabs:has(.cockpit-fourteen-day) .cockpit-tabs>button',
 '.mode-cockpit-ribbons:has(.cockpit-fourteen-day) .cockpit-tabs>button'
])assert.ok(!source.includes(forbidden),`14-Tage-Inhalt darf das Cockpit-Register nicht zustandsabhängig verändern: ${forbidden}`);

assert.ok(component.includes("mode==='cockpit-ribbons'?<MiniRibbon"),'Mini-Grafiken müssen im Ribbon-Modus für alle Horizonte aus demselben Registerpfad gerendert werden.');
assert.ok(component.includes('className={activeHorizon===horizon?\'active\':\'\'}'),'Aktiver Horizont darf nur den Selektionszustand des Registers ändern.');

const baseline=JSON.parse(baselineText),test='scripts/test-forecast-cockpit-register-invariance-09768.mjs';
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),`${test} fehlt in requiredFiles.`);
console.log('Prognose-Cockpit Register bleibt bei Kurzfrist/7/14 Tagen typografisch und grafisch invariant.');
