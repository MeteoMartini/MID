import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');

assert.ok(app.includes("const forecastCockpitEnabled=navigationMode==='bottom-tabs'||forecastPresentationMode!=='classic';"),'MID Next muss den gemeinsamen Prognose-Arbeitsraum unabhängig von der gespeicherten klassischen Prognoseansicht aktivieren.');
assert.ok(app.includes("forecastCockpitAnchor=forecastCockpitEnabled?dashboardModuleSettings.order.find(id=>FORECAST_COCKPIT_MODULES.includes(id)&&dashboardModuleSettings.enabled[id])??null:null"),'Der Prognose-Arbeitsraum benötigt einen eindeutigen gemeinsamen Anker.');
assert.ok(app.includes("const cockpit=forecastCockpitEnabled&&FORECAST_COCKPIT_MODULES.includes(id)"),'Die Hauptnavigation muss alle drei Vorhersageziele auf den gemeinsamen Arbeitsraum leiten.');
assert.ok(app.includes("if(forecastCockpitEnabled&&FORECAST_COCKPIT_MODULES.includes(id))"),'Kurzfrist, 7 und 14 Tage dürfen im MID-Next-Modus nicht wieder als parallele Kartenstapel gerendert werden.');
assert.ok(app.includes("mode={forecastPresentationMode==='classic'?'cockpit-tabs':forecastPresentationMode}"),'MID Next benötigt auch bei klassischer gespeicherter Präferenz einen gültigen Cockpitmodus.');
assert.ok(app.includes("workspaceMode={navigationMode==='bottom-tabs'}"),'Der mobile Arbeitsraum darf keine zweite interne Horizontnavigation erzeugen.');
console.log('MID-C6 Schritt 4: gemeinsamer Prognose-Arbeitsraum für Kurzfrist, 7 und 14 Tage geprüft.');
