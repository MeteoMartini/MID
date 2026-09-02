import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [subseasonal,panel,comparison,seasonal,tone,cockpit,styles,pkgText,baselineText]=await Promise.all([
 read('src/SubseasonalTrendPanel.tsx'),read('src/LongRangePanel.tsx'),read('src/LongRangeModelComparison.tsx'),read('src/seasonalForecast.ts'),read('src/temperatureTone.ts'),read('src/ForecastCockpit.tsx'),read('src/styles.css'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-trend-seasonal-temperature-ui-097725.mjs';

assert.ok(subseasonal.includes("return 'temperature';")&&subseasonal.includes("catch{return 'temperature';}"),'Witterungstrend muss ohne gültigen Speicherwert Temperatur als Standard wählen.');
assert.ok(subseasonal.includes("localStorage.getItem('mid:subseasonal-trend:metric')")&&subseasonal.includes("localStorage.setItem('mid:subseasonal-trend:metric',metric)"),'Der zuletzt gewählte Witterungstrend-Parameter muss dauerhaft gespeichert werden.');
assert.ok(panel.includes('Poor-Man’s-Ensemble')&&panel.includes('eine Stimme je numerisch verfügbarem unabhängigen Modellsystem'),'Season muss alle tatsächlich geladenen Modellsysteme gleichgewichtet als Poor-Man’s-Ensemble zusammenführen.');
assert.ok(comparison.includes('series:ModelSeries[]=models.map')&&comparison.includes('EINZELMODELLE GEMEINSAM')&&comparison.includes('alle verfügbaren numerischen Modelle'),'Alle verfügbaren numerischen Saisonmodelle müssen zusätzlich gemeinsam in einem Diagramm erscheinen.');
assert.ok(!panel.includes('C3S-Vergleich')&&!panel.includes('Numerische Saisonmodelle')&&!panel.includes('long-range-gateway-status')&&!panel.includes('mid:long-range:selected-model'),'Unnötige Katalog-/Status-/Einzelmodell-Kästchen müssen aus der Season-Hauptansicht entfernt sein.');
assert.ok(seasonal.includes('freshModels.push(...c3s.models)')&&seasonal.includes('const freshDeduped=preferredIndependentModels(freshModels)'),'Alle verfügbaren numerischen Quellen müssen in den unabhängigen Modellsystem-Pool einfließen.');
assert.ok(tone.includes('Math.sqrt(Math.abs(signed))')&&tone.includes('backgroundShare=')&&tone.includes('borderShare='),'Kleine Tmin/Tmax-Klimaabweichungen müssen über deutlich reagierende farbige Kästchen sichtbar sein.');
assert.ok(cockpit.includes('Temperaturen nach ECMWF-Farbskala · in 7 Tagen keine Klimaabweichungen.'),'7-Tage-Legende muss die ab v0.9.78.1 gültige ECMWF-Supersession erklären.');
assert.ok(cockpit.includes('cockpit-fourteen-temps')&&cockpit.includes('dailyTemperatureTone(item.bestMin,item.climateMin'), '14-Tage-Ansicht muss die frühere Klimaabweichungs-Kästchenlogik weiterhin verwenden.');
assert.ok(styles.includes('--model-series-1:')&&styles.includes('.long-range-model-overlay-chart'),'Das gemeinsame Modell-Diagramm braucht ein theme-fähiges Serienfarbsystem und responsive Styles.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:trend-seasonal-temperature-ui'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Neue Regression fehlt im Baseline-Vertrag.');
assert.ok(baseline.regressionTests?.includes(test),'Neue Regression fehlt in der Regressionliste.');
console.log(`MID v${pkg.version}: Witterungstrend-Persistenz, Season-Poor-Man’s-Ensemble/Modelloverlay und Tmin/Tmax-Kästchen geschützt.`);
