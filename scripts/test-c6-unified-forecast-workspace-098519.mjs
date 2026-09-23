import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');

assert.ok(app.includes('const forecastCockpitEnabled=true;'),'Der gemeinsame Prognose-Arbeitsraum muss im obligatorischen MID-Redesign immer aktiv sein.');
assert.ok(app.includes("forecastCockpitAnchor=forecastCockpitEnabled?dashboardModuleSettings.order.find(id=>FORECAST_COCKPIT_MODULES.includes(id)&&dashboardModuleSettings.enabled[id])??null:null"),'Der Prognose-Arbeitsraum benötigt einen eindeutigen gemeinsamen Anker.');
assert.ok(app.includes("const cockpit=forecastCockpitEnabled&&FORECAST_COCKPIT_MODULES.includes(id)"),'Die Hauptnavigation muss alle drei Vorhersageziele auf den gemeinsamen Arbeitsraum leiten.');
assert.ok(app.includes("if(forecastCockpitEnabled&&FORECAST_COCKPIT_MODULES.includes(id))"),'Kurzfrist, 7 und 14 Tage dürfen im obligatorischen MID-Design nicht wieder als parallele Kartenstapel gerendert werden.');
assert.ok(app.includes('mode="cockpit-tabs"'),'MID Next benötigt einen eindeutigen Cockpitmodus ohne wirkungslose Darstellungspräferenz.');
assert.ok(!app.includes('forecastPresentationMode')&&!app.includes('forecast-presentation-settings'),'Obsolete Klassisch/Register/Ribbons-Auswahl darf nicht in den obligatorischen Workspace zurückkehren.');
assert.ok(app.includes("workspaceMode={navigationMode==='bottom-tabs'}"),'Der mobile Arbeitsraum darf keine zweite interne Horizontnavigation erzeugen.');
console.log('MID-C6 Schritt 4: gemeinsamer Prognose-Arbeitsraum für Kurzfrist, 7 und 14 Tage im obligatorischen MID-Design geprüft.');
