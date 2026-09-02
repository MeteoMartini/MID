import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [panel,comparison,pkgText,baselineText]=await Promise.all([
 read('src/LongRangePanel.tsx'),read('src/LongRangeModelComparison.tsx'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-long-range-single-model-fallback-097726.mjs';

assert.ok(panel.includes("models.length?<section className=\"long-range-overview\"")&&panel.includes("Saisontrend · ${singleModel?.family??models[0].family}"),'Der saisonale Langfristtrend muss bereits bei genau einem numerisch verfügbaren Modell gerendert werden.');
assert.ok(panel.includes("months={multiModel?tempCombined:models[0].months}")&&panel.includes("months={multiModel?precipCombined:models[0].months}"),'Bei nur einem Saisonmodell müssen dessen echte Temperatur- und Niederschlags-Rauchfahnen statt eines Hinweis-Kastens erscheinen.');
assert.ok(panel.includes("combined={multiModel}")&&panel.includes("Linie = Modell-/Ensemble-Mittel"),'Single-Model-Fallback muss die echte Modell-/Ensemble-Streuung klar vom Poor-Man’s-Ensemble unterscheiden.');
assert.ok(!panel.includes('Ein einzelnes Saisonmodell verfügbar:'),'Der fehlerauslösende reine Single-Model-Hinweiskasten darf den Langfristtrend nicht mehr ersetzen.');
assert.ok(comparison.includes('if(models.length<2||!months.length)return null;'),'Der gemeinsame Einzelmodellvergleich bleibt erst ab zwei Linien aktiv und erzeugt bei nur einer Quelle keine redundante zweite Grafik.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:long-range-single-model-fallback'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Neue Single-Model-Regression fehlt im Baseline-Vertrag.');
assert.ok(baseline.regressionTests?.includes(test),'Neue Single-Model-Regression fehlt in der Regressionliste.');
console.log(`MID v${pkg.version}: Saison-Langfristtrend bleibt bei nur einer numerisch verfügbaren Modellfamilie sichtbar.`);
