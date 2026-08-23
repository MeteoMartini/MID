import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [stylesSource,styles,workerSource,workerAggregate,pkgRaw,baselineRaw,implementation]=await Promise.all([
 'src/styles-src/30-modern.css','src/styles.css','worker-src/40-aviation-router.js','worker/metar-proxy.js','package.json','MID_BASELINE.json','MID_IMPLEMENTATION_0.9.65.1.md'
].map(read));
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-release-hotfix-09651.mjs';
assert.equal(pkg.version,'0.9.65.1');
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test),'v0.9.65.1-Hotfix muss Baseline-regressionsgeschützt sein.');
for(const text of [workerSource,workerAggregate]){
 assert.ok(text.includes('export {pushThunderState,thunderPushBody};'),'Gewitter-Push-Testfunktionen müssen als benannte ESM-Exports erhalten bleiben.');
 assert.ok(text.includes('export {synopticUpstreamBearing};'),'Synoptische Richtungsfunktion muss als benannter ESM-Export erhalten bleiben.');
}
for(const text of [stylesSource,styles]){
 assert.ok(text.includes('min-width:var(--mid-ui-compact-touch)!important'),'Appweiter 36-px-Touchvertrag muss erhalten bleiben.');
 assert.ok(text.includes('.mode-info>button{min-width:0!important;min-height:0!important}'),'Sichtbare Info-Buttons dürfen auf Touch nicht auf 36 px anwachsen.');
 assert.ok(text.includes('.mode-info>button::before'),'Touchfläche muss über das layoutneutrale Pseudoelement getragen werden.');
}
assert.ok(implementation.includes('keine Wetter-, Warn-, Sync- oder Datenquellenfunktion'),'Hotfix-Dokumentation muss den Funktionsschutz festhalten.');
console.log('MID v0.9.65.1: Worker-Testexports und kompakte Info-Controls bei vollständig erhaltener Touchfläche geprüft.');
