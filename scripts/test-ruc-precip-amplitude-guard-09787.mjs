import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const worker=readFileSync(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8');
const fusion=readFileSync(new URL('../src/forecastFusion.ts',import.meta.url),'utf8');
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const test='scripts/test-ruc-precip-amplitude-guard-09787.mjs';

for(const token of [
 'RUC-EPS stützt das EINTRETEN von Niederschlag, nicht dessen deterministische',
 'amountSupport=Number.isFinite(mosmixSupport)?anchorSupport*.35+mosmixSupport*.65:anchorSupport',
 'overshootPenalty=1/(1+(overshoot/overshootScale)*.75)',
 'convectiveFactor=convective?.85:1',
 'rucPrecipitationOvershootRatio',
 'localPrecipitationReferenceMm',
])assert.ok(worker.includes(token),`Mengen-Amplitudenschutz fehlt: ${token}`);
for(const token of ['rucPrecipitationOvershootRatio?:number','localPrecipitationReferenceMm?:number'])assert.ok(fusion.includes(token),`Frontend-Diagnosevertrag fehlt: ${token}`);

function extractFunction(name){
 const marker=`function ${name}(`,start=worker.indexOf(marker);assert.ok(start>=0,`Funktion ${name} fehlt`);
 const open=worker.indexOf('{',start);let depth=0,end=-1;
 for(let i=open;i<worker.length;i++){const c=worker[i];if(c==='{')depth++;else if(c==='}'){depth--;if(depth===0){end=i+1;break}}}
 assert.ok(end>open,`Funktion ${name} konnte nicht extrahiert werden`);return worker.slice(start,end);
}
const source=`
function number(value){if(value===null||value===undefined||value==='')return undefined;const parsed=Number(value);return Number.isFinite(parsed)?parsed:undefined}
function clamp(value,minimum,maximum){return Math.max(minimum,Math.min(maximum,value))}
${extractFunction('blendRapidValue')}
${extractFunction('rucRapidBaseWeight')}
${extractFunction('rucPrecipitationAgreement')}
${extractFunction('rucPrecipitationConsensus')}
result=rucPrecipitationConsensus;`;
const context={result:null};vm.createContext(context);vm.runInContext(source,context);const consensus=context.result;

const wetOutlier=consensus(3,{precipitation:.2},{precipitation:2.1,cape:800},{precipitation:.2},{probability:80},.9);
assert.ok(wetOutlier.amount<.5,`Hohe EPS-PoP darf 2,1-mm-RUC-Ausreißer nicht mengenmäßig hochhalten: ${wetOutlier.amount}`);
assert.ok(wetOutlier.rapidWeight<.2,`RUC-Mengenanteil bleibt bei starkem Overshoot zu hoch: ${wetOutlier.rapidWeight}`);
assert.ok(wetOutlier.overshootRatio>4,'Overshoot-Diagnose muss den deutlichen Mengenüberschuss sichtbar machen.');
assert.equal(wetOutlier.localReference,.2,'Lokale Mengenreferenz muss bei übereinstimmendem Best Match/MOSMIX 0,2 mm bleiben.');

const supported=consensus(3,{precipitation:1.2},{precipitation:1.5,cape:800},{precipitation:1.3},{probability:70},.9);
assert.ok(supported.amount>1.25&&supported.amount<1.45,`Gut gestützter RUC darf nicht trockengeglättet werden: ${supported.amount}`);
assert.ok(supported.rapidWeight>.5,'Gut gestützter konvektiver RUC soll substantiell bleiben.');

const highEpsOnly=consensus(5,{precipitation:.2},{precipitation:3,cape:800},{precipitation:.2},{probability:70},.9);
assert.ok(highEpsOnly.amount<.55,`EPS-Eintrittsstützung darf keine extreme RUC-Mengenamplitude legitimieren: ${highEpsOnly.amount}`);

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.78.7.md'),'Umsetzungsnachweis v0.9.78.7 fehlt.');
console.log('RUC-Niederschlags-Amplitudenschutz geprüft: EPS trennt Eintritt von Menge, Overshoot wird kontinuierlich gedämpft, gestützter RUC bleibt erhalten.');
