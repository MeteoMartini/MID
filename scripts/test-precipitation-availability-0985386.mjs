import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
const source=readFileSync(new URL('../src/precipitationAvailability.ts',import.meta.url),'utf8');
const js=transformSync(source,{loader:'ts',format:'esm',target:'es2022'}).code;
const {isAvailablePrecipitation,isAvailableProbability,sumCompletePrecipitation,maxCompleteProbability,scaleAvailablePrecipitation,precipitationRateIfAvailable,inactivePrecipitationLabel}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(const bad of [null,undefined,NaN,Infinity,-Infinity,-.01,'','0']){assert.equal(isAvailablePrecipitation(bad),false);assert.ok(Number.isNaN(sumCompletePrecipitation([.4,bad,0])));assert.ok(Number.isNaN(scaleAvailablePrecipitation(bad,.5)));assert.ok(Number.isNaN(precipitationRateIfAvailable(bad,15)));assert.equal(inactivePrecipitationLabel(bad,0),'Niederschlagsdaten unvollständig')}
for(const bad of [null,undefined,NaN,-1,101,'0']){assert.equal(isAvailableProbability(bad),false);assert.ok(Number.isNaN(maxCompleteProbability([0,bad])));assert.equal(inactivePrecipitationLabel(0,bad),'Niederschlagsdaten unvollständig')}
assert.equal(sumCompletePrecipitation([0,0,0,0]),0);
assert.equal(sumCompletePrecipitation([0,.2,0,.3]),.5);
assert.equal(maxCompleteProbability([0,45,20]),45);
assert.equal(scaleAvailablePrecipitation(.8,.25),.2);
assert.equal(precipitationRateIfAvailable(.8,15),3.2);
assert.equal(inactivePrecipitationLabel(0,0),'Trocken');
assert.equal(inactivePrecipitationLabel(0,15),'Überwiegend trocken · 15 % Niederschlagswahrscheinlichkeit');
assert.equal(inactivePrecipitationLabel(.05,0),'Geringe Niederschlagsmenge');
for(const fraction of [NaN,-.1,1.1])assert.ok(Number.isNaN(scaleAvailablePrecipitation(1,fraction)));
const cockpit=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const ensemble=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
assert.ok(cockpit.includes('sumCompletePrecipitation(sorted.map(point=>point[key]))'));
assert.ok(cockpit.includes('maxCompleteProbability(sorted.map(point=>point.probability))'));
assert.equal(cockpit.split('scaleAvailablePrecipitation(hour.precipitation,fraction)').length-1,2);
assert.ok(!cockpit.includes('shownProbability=clamp(Number(hour.probability)||0,0,100)'));
assert.ok(ensemble.includes('label:inactivePrecipitationLabel(precipitation,probability)'));
assert.ok(ensemble.includes('Niederschlag möglich · ${amountSummary}'));
console.log('MID .386: Niederschlag/PoP NoData, Trace, Raten und 24h-/Ensemble-Consumer geprüft');
