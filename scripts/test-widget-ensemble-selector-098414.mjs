import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const ensemble=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles-src/00-foundation.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const test='scripts/test-widget-ensemble-selector-098414.mjs';

assert.match(app,/type WidgetStoredSettings=\{schema:4;[^}]*ensembleMetric:EnsembleDisplayMetric/,'Persistenter Widget-Vertrag muss die Ensembleauswahl enthalten.');
for(const [value,label] of [['temperature','Temperatur'],['precipitation','Niederschlag'],['wind','Wind\/Böen']]){
  assert.match(app,new RegExp(`<option value="${value}">${label}<\\/option>`),`${label} fehlt in der Ensembleauswahl.`);
}
assert.match(app,/ensemblePanel\?\.\(ensembleMetric\)/,'Das Widget muss nur den ausgewählten Ensembleparameter anfordern.');
assert.match(app,/presentation="widget" widgetMetric=\{ensembleMetric\}/,'Die Auswahl muss bis zum Ensemble-Renderer weitergereicht werden.');
assert.match(ensemble,/presentation==='widget'\?` ensemble-widget-\$\{widgetMetric\}`/,'Der Ensemble-Renderer braucht eine eindeutige Widget-Parameterklasse.');
assert.match(ensemble,/presentation!=='widget'&&<><Title/,'Allgemeiner Ensemblekopf darf nicht im Widget erscheinen.');
assert.match(ensemble,/presentation!=='widget'&&<EnsembleMetricDeck/,'Übersichts-Pillen dürfen nicht im Widget erscheinen.');
assert.match(css,/\.ensemble-presentation-widget>\.ensemble-chart-export\{display:none\}/,'Nicht ausgewählte Ensemblegrafiken müssen verborgen bleiben.');
assert.match(css,/\.ensemble-widget-temperature>\.ensemble-chart-temperature[^}]*display:block/,'Temperaturauswahl muss das Temperaturdiagramm aktivieren.');
assert.match(css,/\.ensemble-widget-precipitation>\.ensemble-chart-precipitation[^}]*display:block/,'Niederschlagsauswahl muss das Niederschlagsdiagramm aktivieren.');
assert.match(css,/\.ensemble-widget-wind>\.ensemble-chart-wind\{display:block\}/,'Wind-/Böenauswahl muss das Winddiagramm aktivieren.');
assert.match(css,/\.ensemble-presentation-widget \.ensemble-export-footer\{display:none!important\}/,'Modellspezifische Exportmetadaten müssen im Widget verborgen bleiben.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Neuer Test fehlt im Baseline-Pflichtsatz.');
assert.equal(pkg.scripts?.['test:widget-ensemble-selector'],`node ${test}`,'Package-Testeintrag fehlt.');
console.log(`MID v${pkg.version}: getrennte Ensemble-Widgetauswahl, Ortskopf und reduzierte Exportdarstellung geprüft.`);
