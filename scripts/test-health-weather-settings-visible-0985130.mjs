import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,css]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC18WorkPackageI.css',import.meta.url),'utf8')
]);

const healthSection='settings-health-weather-section';
assert.equal((app.match(/settings-health-weather-section/g)||[]).length,1,'Gesundheitswetter muss genau einmal als sichtbare Navigation-Sektion gerendert werden.');
assert.ok(app.includes(`section==='navigation'&&<section className="settings-section settings-health-weather-section"`),'Gesundheitswetter muss direkt an Inhalte & Navigation gebunden sein.');
assert.ok(app.includes('<span>Gesundheitswetter</span>')&&app.includes('>Pollenflug</strong>'),'Gesundheitswetter/Pollenflug-Beschriftung fehlt.');
assert.ok(app.includes('checked={pollenDisplaySettings.showPollenForecast}'),'Pollenflug-Schalter muss den persistierten Zustand anzeigen.');
assert.ok(app.includes('setPollenDisplaySettings(current=>({...current,showPollenForecast:event.target.checked}))'),'Pollenflug-Schalter muss ein-/ausschaltbar bleiben.');
assert.ok(!app.includes('settings-option-list settings-health-weather"><header className="settings-option-list-head"'),'Der alte, im ausgeblendeten Primärbereich verschachtelte Gesundheitswetter-Block darf nicht zurückkehren.');
assert.ok(css.includes('.settings-split-navigation>.settings-section:not(.settings-health-weather-section):not(.dashboard-module-settings)'),'Navigation darf weder Gesundheitswetter noch die Dashboard-Modulliste mit den generischen Settings-Sektionen ausblenden.');
assert.ok(css.includes('.settings-split-navigation>.settings-health-weather-section,.settings-split-navigation>.dashboard-module-settings{display:block!important}'),'Gesundheitswetter und Dashboard-Modulliste müssen in Inhalte & Navigation sichtbar sein.');
assert.ok(!css.includes('.settings-split-navigation>.settings-section:not(.settings-health-weather-section),'),'Die frühere höher spezifische Ausblendregel darf nicht zurückkehren.');
console.log('MID v0.9.85.130: sichtbare Gesundheitswetter-Sektion mit optionalem Pollenflug geschützt.');
