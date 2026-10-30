import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{transformSync}from'esbuild';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const compiled=transformSync(read('src/ensembleCumulativeDisplay.ts'),{loader:'ts',format:'esm',target:'es2022'}).code;
const {ensembleCumulativeRainStep:step}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const base={bestPrecipitation:0,cumulativePrecipitationLow:0,cumulativePrecipitationHigh:0,cumulativePrecipitationQ25:0,cumulativePrecipitationQ75:0,cumulativePrecipitationMean:0};
const zero=step(base,0,0);
for(const name of ['bestPrecipitation','precipitationLow','precipitationHigh','precipitationQ25','precipitationQ75','precipitationMean'])assert.equal(zero[name],0,'real dry value must remain zero: '+name);
const missing=step({...base,bestPrecipitation:NaN,cumulativePrecipitationLow:null,cumulativePrecipitationHigh:undefined,cumulativePrecipitationQ25:null,cumulativePrecipitationQ75:undefined,cumulativePrecipitationMean:null},12,1);
for(const name of ['bestPrecipitation','precipitationLow','precipitationHigh','precipitationQ25','precipitationQ75','precipitationMean'])assert.ok(Number.isNaN(missing[name]),'never turn missing into 0: '+name);
assert.equal(missing.cumulativeLowPlot,undefined);
assert.equal(missing.cumulativeBandPlot,undefined);
assert.equal(missing.cumulativeQ25Plot,undefined);
assert.equal(missing.precipitationErrorRange,undefined);
const next=step({...base,bestPrecipitation:3,cumulativePrecipitationLow:8,cumulativePrecipitationHigh:20,cumulativePrecipitationQ25:10,cumulativePrecipitationQ75:18,cumulativePrecipitationMean:14},missing.bestPrecipitation,2);
assert.ok(Number.isNaN(next.bestPrecipitation),'unknown daily amount prevents future reconstructed best-match totals');
assert.equal(next.precipitationLow,8,'independent cumulative ensemble can resume with valid data');
assert.equal(next.precipitationHigh,20);
assert.equal(next.precipitationMean,14);
assert.deepEqual(next.precipitationErrorRange,[6,6]);
assert.equal(next.cumulativeQBandPlot,8);
const partial=step({...base,cumulativePrecipitationLow:5,cumulativePrecipitationHigh:10,cumulativePrecipitationQ25:null,cumulativePrecipitationQ75:null},0,2);
assert.ok(Number.isNaN(partial.precipitationQ25));
assert.equal(partial.cumulativeQ25Plot,undefined);
const outside=step({...base,cumulativePrecipitationLow:10,cumulativePrecipitationHigh:20,cumulativePrecipitationQ25:25,cumulativePrecipitationQ75:30},0,1);
assert.equal(outside.precipitationQ25,20,'P25 never exceeds certified upper interval bound');
assert.equal(outside.precipitationQ75,20,'P75 never exceeds certified upper interval bound');
assert.equal(outside.cumulativeQBandPlot,0,'no inverted quartile area');
const below=step({...base,cumulativePrecipitationLow:10,cumulativePrecipitationHigh:20,cumulativePrecipitationQ25:1,cumulativePrecipitationQ75:5},0,1);
assert.equal(below.precipitationQ25,10);
assert.equal(below.precipitationQ75,10);
const beyond=step({...base,cumulativePrecipitationLow:5,cumulativePrecipitationHigh:10,cumulativePrecipitationQ25:6,cumulativePrecipitationQ75:9},0,8);
assert.equal(beyond.cumulativeQ25Plot,undefined,'quartiles limited to days 1–7');
const component=read('src/EnsemblePanel.tsx');
assert.ok(component.includes('ensembleCumulativeRainStep(row,bestTotal,index)'));
assert.ok(component.includes('rainValues=rainChartData.flatMap'));
for(const name of ['climateMax','climateMin','bestMax','bestMin']){
 const start=component.indexOf('dataKey="'+name+'"');assert.ok(start>=0,name+' exists');
 assert.ok(component.slice(start,start+450).includes('connectNulls={false}'),name+' must not bridge missing');
}
for(const name of ['meanKey','bestKey']){
 const start=component.indexOf('dataKey={'+name+'}');assert.ok(start>=0,name+' exists');
 assert.ok(component.slice(start,start+420).includes('connectNulls={false}'),name+' must not bridge missing');
}
console.log('MID 14d cumulative precipitation and visible data-gap contract passed');
