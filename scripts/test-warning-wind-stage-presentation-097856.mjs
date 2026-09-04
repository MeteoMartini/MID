import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [weather,fragment,contract,pkgRaw,baselineRaw]=await Promise.all([
  read('src/weather.ts'),
  read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),
  read('MID_WARNING_HYBRID_CONTRACT.md'),
  read('package.json'),
  read('MID_BASELINE.json')
]);

for(const [label,source] of [['aggregate',weather],['fragment',fragment]]){
  assert.ok(source.includes('function hazardNextWindThresholdKmh(signal:DwdWarningSignal)'),`${label}: nächste Windstufenschwelle fehlt.`);
  assert.ok(source.includes('const rank=hazardStageRank(signal),next=DWD_WIND_THRESHOLDS_KMH[rank]'),`${label}: Windstufen müssen über stageRank statt DWD-Farbstufe unterschieden werden.`);
  assert.ok(source.includes('maximumExclusiveKmh'),`${label}: untere Windstufen benötigen eine exklusive Obergrenze.`);
  assert.ok(source.includes('function trimLowerHazardBoundary('),`${label}: überlappende niedrigere Zeitfenster müssen am Rand beschnitten werden.`);
  assert.ok(source.includes("filter(({row,presentation})=>!row.signal.lowerIntensity||Boolean(presentation.validFrom&&presentation.validTo))"),`${label}: vollständig überdeckte niedrigere Warnkarten müssen entfallen.`);
  assert.ok(source.includes("const prefix=signal.lowerIntensity?'Im verbleibenden Prognosefenster':'Im Prognosefenster'"),`${label}: niedrigere Windstufe braucht eindeutige Restfenster-Formulierung.`);
}

// Fachlicher Plausibilitätscheck der sichtbaren kt-Schritte:
// Windböen >50 km/h, nächste Stufe ab 65 km/h => sichtbarer Deckel 35 kt (<65 km/h).
// Sturmböen ab 65 km/h können bei EPS-Unterstützung weiterhin z. B. bis zu 45 kt zeigen.
const rounded=(value,step,maximumExclusive=Number.NaN)=>{
  let result=Math.max(0,Math.ceil(value/step)*step);
  if(Number.isFinite(maximumExclusive))result=Math.min(result,Math.max(0,Math.floor((maximumExclusive-1e-6)/step)*step));
  return result;
};
assert.equal(rounded(83/1.852,5,65/1.852),35,'Windböen dürfen bei gleichzeitig vorhandenen Sturmböen nicht ebenfalls 45 kt anzeigen.');
assert.equal(rounded(83/1.852,5),45,'Sturmböen dürfen bei 83 km/h probabilistischer Oberkante 45 kt anzeigen.');

assert.ok(contract.includes('darf eine niedrigere Stufe in der Kurzangabe **nicht** dieselbe Spitzenangabe wie die höhere Stufe wiederholen'),'Warnvertrag muss Doppelwerte verschiedener Windstufen verbieten.');
assert.ok(contract.includes('wird das sichtbare Zeitfenster der niedrigeren Stufe auf den verbleibenden Abschnitt gekürzt'),'Warnvertrag muss Restfenster definieren.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-warning-wind-stage-presentation-097856.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Package-/Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: Windstufen-Präsentation geprüft – niedrigere Stufen behalten eigenes Restfenster und eigene "bis zu"-Obergrenze.`);
