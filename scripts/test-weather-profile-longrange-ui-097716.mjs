import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [profile,trend,modern,styles,pkgText,baselineText]=await Promise.all([
  read('src/ForecastCockpit.tsx'),
  read('src/SubseasonalTrendPanel.tsx'),
  read('src/styles-src/30-modern.css'),
  read('src/styles.css'),
  read('package.json'),
  read('MID_BASELINE.json'),
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);

const versionParts=pkg.version.split('.').map(Number),atLeast097716=versionParts[0]>0||versionParts[1]>9||(versionParts[1]===9&&(versionParts[2]>77||(versionParts[2]===77&&(versionParts[3]??0)>=16)));
assert.ok(atLeast097716,'UI-Fix aus v0.9.77.16 muss in allen Folgereleases erhalten bleiben.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');

assert.ok(modern.includes('.selected-time-value-pill rect{fill:var(--mg-tooltip);'), '24-h-Wert-Pills müssen den theme-adaptiven Tooltip-Hintergrund verwenden.');
assert.ok(modern.includes('var(--mg-tooltip-border)'), '24-h-Wert-Pills brauchen den theme-adaptiven Tooltip-Rahmen.');
assert.ok(!modern.includes('var(--mg-bg)'), 'Nicht definierte --mg-bg-Referenzen dürfen im 24-h-Profil nicht verbleiben.');
assert.ok(!modern.includes('var(--mg-border)'), 'Nicht definierte --mg-border-Referenzen dürfen im 24-h-Profil nicht verbleiben.');
assert.ok(profile.includes('cy={extreme.item.tempY} r={3.4}'), 'Tmin/Tmax-Marker müssen deutlich kleiner sein.');
assert.ok(profile.includes('className="temperature-point active"')&&profile.includes('cy={selectedVisualPoint.tempY} r={3.0}'), 'Aktiver Temperaturpunkt darf Tmin/Tmax nicht mit einem großen Fokuspunkt überdecken.');

assert.ok(!trend.includes('<b>Modellstand:</b>'), 'Witterungstrend darf den Modellstand im Header nicht redundant wiederholen.');
assert.ok(!trend.includes('function modelRunSummary('), 'Redundante Modellstand-Zusammenfassung muss entfernt sein.');
assert.ok(trend.includes('Datenabruf {formatDateTime(data.fetchedAt)} UTC'), 'Datenabruf-/Cache-Transparenz muss erhalten bleiben.');
assert.ok(trend.includes('· Lauf ${formatModelRun(model.runInitialisationTime)} UTC'), 'Modelllauf muss weiterhin in den Modell-/Familien-Pills stehen.');

assert.ok(modern.includes('.long-range-chart{width:100%;min-width:0;overflow-x:hidden;'), 'Langfrist-Rauchfahnen dürfen horizontal nicht scrollen.');
assert.ok(modern.includes('.long-range-chart svg{display:block;width:100%;max-width:100%;min-width:0;height:auto}'), 'Langfrist-SVGs müssen auf die verfügbare Breite skalieren.');
assert.ok(modern.includes('.mountain-snowline-chart{width:100%;min-width:0;overflow-x:hidden;'), 'Langfrist-Schneelinien-Diagramm darf horizontal nicht scrollen.');
assert.ok(modern.includes('.mountain-snowline-chart svg{display:block;width:100%;max-width:100%;min-width:0;height:auto}'), 'Schneelinien-SVG muss responsiv auf die verfügbare Breite skalieren.');
assert.ok(!/\.long-range-chart[^\n]*overflow-x:auto/.test(modern), 'Langfristdiagramme dürfen keinen horizontalen Auto-Scroll mehr aktivieren.');
assert.ok(!/\.long-range-chart svg\{[^}]*min-width:(?:470|500|520)px/.test(modern), 'Mobile Langfristdiagramme dürfen keine feste Mindestbreite erzwingen.');
assert.ok(!/\.mountain-snowline-chart\{[^}]*overflow-x:auto/.test(modern), 'Schneelinien-Diagramm darf keinen horizontalen Auto-Scroll aktivieren.');
assert.ok(!/\.mountain-snowline-chart svg\{[^}]*min-width:(?:520|560)px/.test(modern), 'Schneelinien-Diagramm darf keine feste Mindestbreite erzwingen.');
assert.ok(!modern.includes('.chartscroll,.detail-scroll,.trend-scroll,.meteogram-scroll,.long-range-chart,.long-range-model-selector'), 'Langfristdiagramm darf nicht mehr als Touch-Scrollcontainer registriert sein.');

assert.ok(styles.includes('.selected-time-value-pill rect{fill:var(--mg-tooltip);'), 'Styles-Aggregat muss die Pill-Korrektur enthalten.');
assert.ok(styles.includes('.long-range-chart{width:100%;min-width:0;overflow-x:hidden;'), 'Styles-Aggregat muss die responsive Langfristdarstellung enthalten.');

console.log(`MID v${pkg.version}: 24-h-Pills, kleinere Temperaturmarker, Witterungstrend-Metadaten und scrollfreie Langfristdiagramme geprüft.`);
