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
assert.ok(tone.includes('Math.sqrt(Math.abs(signed))')&&tone.includes("const directional=kind==='min'?-response:response"),'Tmin und Tmax müssen die signierte Klimaabweichung empfindlich und gegenläufig innerhalb ihrer Farbfamilie abbilden.');
assert.ok(tone.includes('background:`color-mix(in srgb,${token}')&&tone.includes('border:`color-mix(in srgb,${token}'),'Tmin/Tmax müssen wieder kleine farbige Blau-/Rot-Kästchen mit klimaabhängiger Intensität verwenden.');
assert.ok(tone.includes("color:'var(--text)'"),'Aktuelle/stündliche Temperaturwerte müssen neutral in der Theme-Textfarbe erscheinen.');
assert.ok(tone.includes('void climateMin;void climateMax;'),'Stündliche Temperatur darf nicht mehr anhand klimatologischer Tmin/Tmax in Blau/Rot einsortiert werden.');
assert.ok(cockpit.includes('minTone=ecmwfTemperatureTone(day.min),maxTone=ecmwfTemperatureTone(day.max)')&&cockpit.includes('cockpit-legend-inline">Temperaturfarben: ECMWF-Skala'),'7-Tage-Ansicht muss die absolute ECMWF-Farbskala strukturell verwenden, ohne technische Supersession-Texte anzuzeigen.');
assert.ok(!cockpit.includes('in 7 Tagen keine Klimaabweichungen'),'Prompt-/Implementierungstext darf nicht in der sichtbaren 7-Tage-UI verbleiben.');
assert.ok(cockpit.includes('minTone=ecmwfTemperatureTone(item.bestMin),maxTone=ecmwfTemperatureTone(item.bestMax)'),'14-Tage-Ansicht muss Tmin/Tmax nun ebenfalls mit der absoluten ECMWF-Farbskala rendern.');
assert.ok(modern.includes('.selected-time-value-pill.temperature{color:var(--text)}'),'Auch der ausgewählte stündliche Temperaturwert im 24-h-Profil muss neutral bleiben.');
assert.ok(contract.includes('Blau/Rot bleibt ausschließlich den Tagesextrema Tmin/Tmax vorbehalten.'),'Verbindlicher Farbvertrag muss aktuelle Temperaturen von Tmin/Tmax trennen.');
assert.ok(contract.includes('kälter = kräftiger/dunkler')&&contract.includes('wärmer = kräftiger/dunkler')&&contract.includes('±0,5 bis ±1 K'),'Farbvertrag muss beide Klimaskalenrichtungen und die empfindlichere Reaktion kleiner Abweichungen schützen.');

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:attachment-hazard-temperature-colors'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Neue Regression fehlt im requiredRegressionTests-Vertrag.');
console.log(`MID v${pkg.version}: Gefahren-Popup sowie neutrale Kurzfrist- und absolute 7d/14d-ECMWF-Temperaturfarben geschützt.`);
