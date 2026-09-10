import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const cockpit=await readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const css=await readFile(new URL('../src/styles-src/00-foundation.css',import.meta.url),'utf8');
const tone=await readFile(new URL('../src/temperatureTone.ts',import.meta.url),'utf8');

assert.match(app,/type WidgetStoredSettings=\{schema:5;[^}]*ecmwfTemperatureColors:boolean/,'Widget-Einstellung für ECMWF-Temperaturfarben fehlt.');
assert.match(app,/ecmwfTemperatureColors:true,view:'cards'/,'ECMWF-Farben sollen bei neuen Standard-Exporten aktiv sein.');
assert.match(app,/ECMWF-Temperaturfarben/,'ECMWF-Farben sind nicht in der sichtbaren Exportliste auswählbar.');
assert.match(app,/setEcmwfTemperatureColors/,'ECMWF-Farbauswahl ist nicht interaktiv.');
assert.match(app,/ecmwfTemperatureColors:true}:stored/,'Feste Standard-Export-URLs müssen die ECMWF-Temperaturfarben ebenfalls verwenden.');
assert.match(app,/temperature-colors-ecmwf/,'Exportfläche trägt keine eindeutige ECMWF-Farbklasse.');
assert.match(app,/widget-temp-ecmwf/,'Kompakte Tageskarten wenden die ECMWF-Farbe nicht auf Tmin\/Tmax an.');
assert.match(app,/ecmwfTemperatureColors=\{ecmwfTemperatureColors\}/,'Kurvenexport erhält die Temperaturfarben-Auswahl nicht.');
assert.match(cockpit,/ecmwfTemperatureColors=true/,'Kurvenübersicht schützt das bisherige ECMWF-Farbverhalten nicht als Standard.');
assert.match(cockpit,/stopColor=\{ecmwfTemperatureColors\?ecmwfTemperatureColor\(point\.value\):'var\(--param-temperature\)'\}/,'Kurvenlinie reagiert nicht auf die Export-Farbauswahl.');
assert.match(css,/\.weatherwidget\.modern\.compact \.widgetmeta-wind>b\{flex-wrap:nowrap!important;white-space:nowrap/,'Windzeile kann weiterhin umbrechen.');
assert.match(css,/\.weatherwidget\.modern\.compact \.widgetmeta-wind>small\{flex-wrap:nowrap!important;white-space:nowrap/,'Böenzeile kann weiterhin umbrechen.');
assert.match(css,/\.widget-temp-ecmwf\{[^}]*border:1px solid var\(--widget-temp-border\)[^}]*background:var\(--widget-temp-background\)[^}]*color:var\(--widget-temp-color\)/s,'ECMWF-Temperaturwerte besitzen keine lesbare Badge-Darstellung.');
assert.match(css,/\.weatherwidget\.modern\.compact\.dark \.widgettemps \.widget-temp-ecmwf\{color:color-mix/s,'Dark-Mode-Kontrast für ECMWF-Temperaturwerte fehlt.');
assert.match(tone,/const ECMWF_TEMPERATURE_STOPS/,'Zentrale wertbasierte ECMWF-Temperaturpalette fehlt.');

console.log('MID v0.9.84.20: Widget-Wind bleibt exakt zweizeilig; ECMWF-Temperaturfarben sind optional, persistent, kontrastiert und in Standard-Exporten aktiv.');
