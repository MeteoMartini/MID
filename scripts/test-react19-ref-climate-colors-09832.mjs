import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,ensemble,radar,dismissible,climate,foundation,modern]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/useDismissibleLayer.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ClimatePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles-src/00-foundation.css',import.meta.url),'utf8'),
 readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8'),
]);

assert.ok(app.includes('forecastRateRetryRef=useRef<number|undefined>(undefined)'), 'React 19: useRef benötigt einen Initialwert.');
assert.ok(!app.includes('forecastRateRetryRef=useRef<number|undefined>()'), 'Alter React-18-useRef-Aufruf darf nicht zurückkehren.');
assert.ok(ensemble.includes('RefObject<HTMLDivElement | null>'), 'Ensemble-Refs müssen React-19-nullfähig typisiert sein.');
assert.ok(ensemble.includes('RefObject<HTMLElement | null>'), 'Portal-Refs müssen React-19-nullfähig typisiert sein.');
assert.ok(!ensemble.includes('RefObject<HTMLDivElement>'), 'Nicht-nullfähiger Ensemble-Ref-Vertrag ist unter React 19 unzulässig.');
assert.ok(!ensemble.includes('RefObject<HTMLElement>'), 'Nicht-nullfähiger Portal-Ref-Vertrag ist unter React 19 unzulässig.');
assert.ok(dismissible.includes("Pick<RefObject<T | null>, 'current'>"), 'Dismissible-Layer muss nullable RefObject.current akzeptieren.');
assert.ok(radar.includes('useDismissibleLayer(focusLayersRef'), 'Radar nutzt weiterhin den zentralen Dismissible-Layer.');

assert.ok(foundation.includes('--param-temperature-max-climate:var(--param-temperature-max)'), 'Klima-Tmax muss den kanonischen MID-Tmax-Farbtoken verwenden.');
assert.ok(climate.includes('className={`climate-windrose mode-${mode}`}'), 'Windrose braucht Wind-/Böen-Modusklasse für semantische Farben.');
assert.ok(climate.includes('className="wind-value"'), 'Klimawindwerte brauchen den MID-Wind-Farbtoken-Hook.');
assert.ok(climate.includes('className="climate-summary-detail gust-value"'), 'Klimaböen brauchen den MID-Böen-Farbtoken-Hook.');
assert.ok(modern.includes('.climate-wind-switch button.wind.active{color:var(--param-wind)}'), 'Wind-Umschalter muss MID-Windfarbe nutzen.');
assert.ok(modern.includes('.climate-wind-switch button.gust.active{color:var(--param-gust)}'), 'Böen-Umschalter muss MID-Böenfarbe nutzen.');
assert.ok(modern.includes('.climate-windrose.mode-gust .climate-wind-center{fill:var(--param-gust)!important}'), 'Böenwindrose muss MID-Böenfarbe nutzen.');

console.log('MID React-19-Ref-Freigabefix und Klima-Farbvertrag geprüft.');
