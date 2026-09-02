import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [overlay,tone,cockpit,modern,contract,pkgText,baselineText]=await Promise.all([
 read('src/ExtremeOutlookAreaOverlay.tsx'),read('src/temperatureTone.ts'),read('src/ForecastCockpit.tsx'),read('src/styles-src/30-modern.css'),read('MID_PARAMETER_COLOR_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-attachment-hazard-temperature-colors-097715.mjs';

assert.ok(overlay.includes('EXTREME_HAZARDS'),'Gefahrenbezeichnungen müssen aus dem kanonischen Gefahrenkatalog stammen.');
assert.ok(overlay.includes('hazardLabel(area.signal.hazard)'),'Popup muss die tatsächlich repräsentierte Gefahr der Fläche ausgeben.');
assert.ok(!overlay.includes('Modellierte Gefahrenfläche'),'Generische Popup-Bezeichnung darf nicht mehr erscheinen.');

assert.ok(tone.includes("const token=kind==='max'?'var(--param-temperature-max)':'var(--param-temperature-min)'"),'Tmin/Tmax müssen in den kanonischen Blau-/Rotfamilien bleiben.');
assert.ok(tone.includes("return kind==='min'?1-scaled:clamp01(.14+scaled*.86)"),'Tmin und Tmax müssen die signierte Klimaabweichung gegenläufig in Sättigung abbilden.');
assert.ok(tone.includes("color:'var(--text)'"),'Aktuelle/stündliche Temperaturwerte müssen neutral in der Theme-Textfarbe erscheinen.');
assert.ok(tone.includes('void climateMin;void climateMax;'),'Stündliche Temperatur darf nicht mehr anhand klimatologischer Tmin/Tmax in Blau/Rot einsortiert werden.');
assert.ok(cockpit.includes('Tmin blau, Tmax rot · Sättigung = Abweichung vom jeweiligen Klimamittel.'),'7-Tage-Legende muss die neue Farblogik verständlich benennen.');
assert.ok(modern.includes('.selected-time-value-pill.temperature{color:var(--text)}'),'Auch der ausgewählte stündliche Temperaturwert im 24-h-Profil muss neutral bleiben.');
assert.ok(contract.includes('Blau/Rot bleibt ausschließlich den Tagesextrema Tmin/Tmax vorbehalten.'),'Verbindlicher Farbvertrag muss aktuelle Temperaturen von Tmin/Tmax trennen.');
assert.ok(contract.includes('deutlich kälter = sehr kräftig/dunkel')&&contract.includes('deutlich wärmer = sehr kräftig/dunkel'),'Farbvertrag muss beide Klimaskalenrichtungen schützen.');

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:attachment-hazard-temperature-colors'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Neue Regression fehlt im requiredRegressionTests-Vertrag.');
console.log(`MID v${pkg.version}: Gefahren-Popup sowie neutrale Kurzfrist- und klimabezogene Tmin/Tmax-Farbskalen geschützt.`);
