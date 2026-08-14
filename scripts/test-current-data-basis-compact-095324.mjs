import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Release und Baseline müssen synchron sein.');
assert.match(app,/temperatureAndWindNearModel=.*!localTemperatureCorrectionSignificant&&!terrainWindCorrectionSignificant/,'Marginale Hyperlokalkorrekturen müssen als Modellnähe erkannt werden.');
assert.match(app,/temperatureAndWindNearModel\?<span>Temp\.\/Wind nahe Modell/,'Kompakte Modellnähe-Anzeige fehlt.');
assert.match(app,/localTemperatureCorrectionSignificant\?<span>ΔT/,'Relevante Temperaturkorrekturen müssen numerisch sichtbar bleiben.');
assert.match(app,/terrainWindCorrectionSignificant\?<span>Gelände-Wind/,'Relevante Windkorrekturen müssen numerisch sichtbar bleiben.');
for(const token of ['<strong>Datenbasis</strong>','<b>Modellhintergrund</b>','Messwertquellen','Keine ausreichend aktuelle Messwertquelle für diesen Parameter; Wert aus dem Modellhintergrund.','Kontext: {st.localContextSource}','Datenintervall','Gewicht'])assert.ok(app.includes(token),`Datenbasis-/Quelleninformation fehlt: ${token}`);
assert.ok(!app.includes('analysisModelSuffix'),'Der Modellhintergrund soll die kompakten Parameterzeilen nicht wieder überladen.');
assert.ok(!app.includes('windCorrectionSuffix'),'Marginale Gelände-Windkorrekturen sollen nicht in jeder Windkachel wiederholt werden.');
console.log(`MID v${pkg.version}: kompakte Hyperlokaldarstellung und vollständige Datenbasis-Infos geprüft.`);
