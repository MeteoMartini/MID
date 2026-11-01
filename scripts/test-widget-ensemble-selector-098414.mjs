import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript-strada';

const app=readAppFeatureSources();
const ensemble=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles-src/00-foundation.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const test='scripts/test-widget-ensemble-selector-098414.mjs';

assert.match(app,/type WidgetStoredSettings=\{schema:5;[^}]*ensembleMetric:EnsembleDisplayMetric/,'Persistenter Widget-Vertrag muss die Ensembleauswahl enthalten.');
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
// Test actual persisted settings parser/patch implementation, not only UI strings.
const widgetSource=readFileSync(new URL('../src/WidgetGenerator.tsx',import.meta.url),'utf8');
const start=widgetSource.indexOf('function storedWidgetSettings()'),end=widgetSource.indexOf('function Widget(');
assert.ok(start>0&&end>start,'Widget settings implementation must be discoverable');
const fragment=widgetSource.slice(start,end),moduleSource=`
type WidgetDayCount=3|4|5|6|7;
type EnsembleDisplayMetric='temperature'|'precipitation'|'wind';
type WidgetView='cards'|'curve'|'ensemble';
type WidgetStoredSettings={schema:5;days:WidgetDayCount;dark:boolean;showWind:boolean;showRain:boolean;showSkybar:boolean;showSunshine:boolean;showHazards:boolean;ecmwfTemperatureColors:boolean;view:WidgetView;ensembleMetric:EnsembleDisplayMetric};
const WIDGET_SETTINGS_STORAGE_KEY='mid:0.7.1:widget-settings',WIDGET_DAY_OPTIONS=[3,4,5,6,7] as const;
${fragment}
(globalThis as any).__widgetCheck={storedWidgetSettings,patchStoredWidgetSettings};
`;
const transpiled=ts.transpileModule(moduleSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const store=new Map(),events=[],context={Event:class{constructor(type){this.type=type}},window:{dispatchEvent(event){events.push(event.type)}},localStorage:{
 getItem(key){return store.get(key)??null},
 setItem(key,value){store.set(key,value)}
}};
vm.runInNewContext(transpiled,context);
const check=context.__widgetCheck,key='mid:0.7.1:widget-settings';
assert.ok(check?.storedWidgetSettings&&check?.patchStoredWidgetSettings,'Real settings functions must compile and execute');
store.set(key,JSON.stringify({schema:5,days:5,dark:false,showRain:false,view:'ensemble',ensembleMetric:'wind'}));
check.patchStoredWidgetSettings({showWind:false});
let saved=JSON.parse(store.get(key));
assert.equal(saved.dark,false);assert.equal(saved.showRain,false);assert.equal(saved.showWind,false);
assert.equal(saved.days,5);assert.equal(saved.ensembleMetric,'wind');assert.equal(saved.view,'ensemble');
assert.ok(events.includes('mid:widget-settings-changed'),'Same-tab change must notify parallel controls');
store.set(key,JSON.stringify({...saved,days:3,view:'curve'}));
check.patchStoredWidgetSettings({showSkybar:false});
saved=JSON.parse(store.get(key));
assert.equal(saved.days,3,'Later device/tab value must not be lost to a stale initial snapshot');
assert.equal(saved.view,'curve');assert.equal(saved.showSkybar,false);
store.set(key,JSON.stringify({schema:2,days:4,showRain:false,dark:false}));
assert.equal(check.storedWidgetSettings().showRain,false,'Legacy false preference must migrate without becoming true');
const oldSet=context.localStorage.setItem;
context.localStorage.setItem=()=>{throw new Error('QuotaExceededError')};
assert.doesNotThrow(()=>check.patchStoredWidgetSettings({dark:true}),'Storage denial must not crash widget UI');
context.localStorage.setItem=oldSet;
assert.ok(widgetSource.includes("if(!urlExport)patchStoredWidgetSettings(patch)"),'URL-only renders must never mutate durable user settings');
assert.ok(widgetSource.includes("window.addEventListener('storage',onStorage)"),'Cross-tab edits must refresh active widget');
assert.ok(!widgetSource.includes('useEffect(()=>{if(urlExport)return;try{localStorage.setItem(WIDGET_SETTINGS_STORAGE_KEY'),'Mount/unmount may not overwrite newer device state with defaults');
console.log(`MID v${pkg.version}: getrennte Ensemble-Widgetauswahl, Ortskopf und reduzierte Exportdarstellung geprüft.`);
