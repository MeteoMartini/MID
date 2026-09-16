import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,css,extreme]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midDesign.css',import.meta.url),'utf8'),
 readFile(new URL('../src/ExtremeWeatherOutlookPanel.tsx',import.meta.url),'utf8')
]);

for(const token of ['function WarningEventTab(','warningEventIsRelevant(','warning-event-tab','warning-event-track','official-warning-${a.id}','mid-warning-${id}','warmCompositePanel','warmExtremeWeatherOutlook'])assert.ok(app.includes(token),`Warnereignis-Vertrag fehlt: ${token}`);
for(const token of ['.warning-event-tab','.warning-event-track','.warning-event-row','.warning-event-origin'])assert.ok(css.includes(token),`Warnereignis-Stil fehlt: ${token}`);
assert.ok(extreme.includes('Eintrittswahrscheinlichkeit'),'Kompakte Bezeichnung für die I-Stufen-Wahrscheinlichkeit fehlt.');
assert.ok(!extreme.includes('Überschreitungswahrscheinlichkeit {displayProbability} %'),'Die lange UI-Bezeichnung darf nicht mehr in der Regionskarte stehen.');
console.log('warning event tab contract ok');
