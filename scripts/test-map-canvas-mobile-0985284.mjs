import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const [radar,unified,native,weather,css,pkg,baseline,contour]=await Promise.all([
 read('src/RadarPanel.tsx'),read('src/UnifiedWeatherMap.tsx'),read('src/NativeModelMap.tsx'),
 read('src/WeatherMapsPanel.tsx'),read('src/midC14MapWorkspace.css'),
 read('package.json'),read('MID_BASELINE.json'),read('src/adaptiveModelContours.ts')
]);
assert.ok(radar.includes('className="composite-primary-layers" open={compactLayersOpen}'),'Kartenebenen/Modell müssen mobil einklappbar sein');
assert.ok(radar.includes('{unified?.controls}</div></details>'),'Alle Modellfunktionen müssen erreichbar bleiben');
assert.ok(radar.includes('className="composite-direct-time"'),'Direkte Terminwahl muss unverändert bleiben');
assert.ok(radar.includes('className="composite-timeline-card"'),'Gemeinsame Zeitachse muss erhalten bleiben');
assert.ok(radar.includes('onToggle={event=>setCompactLinesOpen(event.currentTarget.open)}')&&radar.includes('composite-line-toolbar-summary'),'Linienstile dürfen nicht permanent über der Karte liegen');
assert.ok(radar.includes('composite-map-status'),'Produkt-/Phasenstatus muss sichtbar bleiben');
assert.ok(radar.includes("modelLines==='isoheights'?'Isohypsen'"),'Konturen-Auswahl braucht kurze Bezeichnungen');
assert.ok(unified.includes('Isobaren · {modelLabel}')&&unified.includes('Isohypsen · gleicher Lauf und Termin'));
assert.ok(!unified.includes('MSL-Isobaren (hPa)'),'Keine Einheit im Isobaren-Schalter');
assert.ok(!unified.includes('500 hPa (gpdm) · gleicher Lauf'),'Keine Einheit im Isohypsen-Schalter');
assert.ok(native.includes('Isobaren · gleicher ICON-D2-Lauf und Termin'));
assert.ok(contour.includes("'text-field':['to-string',['get','level']]"),'Isobaren/Isohypsen werden direkt auf der Karte ohne Einheit an der Linie beschriftet');
assert.ok(radar.includes("return String(type==='isobars'?Math.round(level):Math.round(level/10))"),'Radar/Komposit-Konturen müssen ebenfalls nur numerische Linienbeschriftungen verwenden');
assert.ok(weather.includes('className="weather-maps-primary-controls"'));
assert.ok(weather.includes('className="weather-maps-advanced"')&&weather.includes('aria-label="Kartenbasis"'),'Kartenbasis bleibt verfügbar');
assert.ok(weather.indexOf('aria-label="Kartenbasis"')>weather.indexOf('className="weather-maps-advanced"'),'Kartenbasis ist sekundäre Steuerung');
for(const token of ['.composite-primary-layers','composite-line-toolbar:not([open])','height:72svh!important','weather-maps-map-status{position:static!important','orientation:landscape','min-height:44px!important','prefers-reduced-motion'])assert.ok(css.includes(token),'Responsive-Regel fehlt: '+token);
const p=JSON.parse(pkg),b=JSON.parse(baseline);
assert.equal(p.version,'0.9.85.284');assert.equal(b.releaseVersion,p.version);
assert.ok(b.requiredRegressionTests.includes('scripts/test-map-canvas-mobile-0985284.mjs'));
console.log('MID .284: Kartenfläche, kompakte Isolinien-Labels, Modellwahl, Zeitachse und Mobile-Controls geprüft.');
