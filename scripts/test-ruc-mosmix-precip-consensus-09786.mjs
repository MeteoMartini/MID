import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const worker=readFileSync(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8');
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));

for(const token of [
  'precipitation:Number.isFinite(precipitation)?Math.max(0,precipitation):undefined',
  'function rucRapidBaseWeight(leadHours)',
  'function rucPrecipitationConsensus(',
  'rapidAmount>anchorAmount+.12',
  'amountSupport=Number.isFinite(mosmixSupport)?anchorSupport*.35+mosmixSupport*.65:anchorSupport',
  'ein nasser RUC erhöht sein eigenes Niederschlagsgewicht nicht mehr',
  'RR1c-Niederschlagskonsens',
  'mosmixPrecipitationWeight',
  'rucPrecipitationSupport',
])assert.ok(worker.includes(token),`RUC/MOSMIX-Niederschlagsvertrag fehlt: ${token}`);
assert.ok(!worker.includes("else if(wet)weight=Math.min(.76,weight+.05)"),'Ein nasser RUC darf sein eigenes Niederschlagsgewicht nicht mehr erhöhen.');

function extractFunction(name){
 const marker=`function ${name}(`,start=worker.indexOf(marker);assert.ok(start>=0,`Funktion ${name} fehlt`);
 const open=worker.indexOf('{',start);let depth=0,end=-1;
 for(let i=open;i<worker.length;i++){
  const c=worker[i];if(c==='{')depth++;else if(c==='}'){depth--;if(depth===0){end=i+1;break}}
 }
 assert.ok(end>open,`Funktion ${name} konnte nicht extrahiert werden`);return worker.slice(start,end);
}
const source=`
function number(value){if(value===null||value===undefined||value==='')return undefined;const parsed=Number(value);return Number.isFinite(parsed)?parsed:undefined}
function clamp(value,minimum,maximum){return Math.max(minimum,Math.min(maximum,value))}
${extractFunction('blendRapidValue')}
${extractFunction('rucRapidBaseWeight')}
${extractFunction('rucRapidWeight')}
${extractFunction('rucPrecipitationAgreement')}
${extractFunction('rucPrecipitationConsensus')}
result={rucRapidBaseWeight,rucRapidWeight,rucPrecipitationConsensus};`;
const context={result:null};vm.createContext(context);vm.runInContext(source,context);const api=context.result;

assert.equal(api.rucRapidBaseWeight(5),.58,'+5 h behält den bisherigen meteorologischen Basisanteil.');
assert.equal(api.rucRapidWeight(5,{precipitation:2,cape:0}),.58,'Nässe allein darf den RUC-Anteil nicht erhöhen.');
assert.ok(Math.abs(api.rucRapidWeight(5,{precipitation:0,cape:800})-.68)<1e-9,'Konvektive Dynamik darf andere RUC-Parameter weiterhin stärken.');

const outlier=api.rucPrecipitationConsensus(5,{precipitation:.2},{precipitation:2.1,cape:0},{precipitation:.2},{probability:40},.9);
assert.ok(outlier.rapidWeight<.2,`Nasser RUC-Ausreißer muss deutlich gedämpft werden, erhalten: ${outlier.rapidWeight}`);
assert.ok(outlier.amount<.5,`Best Match + MOSMIX sollen den 2,1-mm-Ausreißer klar begrenzen; EPS stützt nur den Eintritt, erhalten: ${outlier.amount}`);
assert.ok(outlier.mosmixWeight>.2,'MOSMIX muss bei guter Punktqualität als lokaler DWD-Konsens wirksam sein.');

const supported=api.rucPrecipitationConsensus(5,{precipitation:1.2},{precipitation:1.5,cape:0},{precipitation:1.3},{probability:70},.9);
assert.ok(supported.rapidWeight>.4,'Ein von Best Match/MOSMIX/EPS gestützter RUC soll substantiell einfließen.');
assert.ok(supported.amount>1.2&&supported.amount<1.5,'Gestützter RUC soll als Konsens zwischen den Quellen landen.');

const dryCorrection=api.rucPrecipitationConsensus(5,{precipitation:1.2},{precipitation:.1,cape:0},{precipitation:.2},{probability:20},.9);
assert.equal(dryCorrection.rapidWeight,.58,'Trockener RUC wird nicht durch den Nass-Ausreißerschutz pauschal beschnitten.');
assert.ok(dryCorrection.amount<.6,'Ein übereinstimmendes trockeneres DWD-Signal darf die Leitprognose sinnvoll reduzieren.');

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen übereinstimmen.');
assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-ruc-mosmix-precip-consensus-09786.mjs'),'Baseline muss den neuen Niederschlagskonsens schützen.');
console.log('RUC/MOSMIX-Niederschlagskonsens geprüft: kein Nass-Selbstbonus, Ausreißerschutz, EPS-Stützung und DWD-RR1c-Konsens.');
