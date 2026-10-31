import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const read=relative=>readFile(new URL('../'+relative,import.meta.url),'utf8');
const [helperSource,app,contract,pkgSource,baselineSource]=await Promise.all([
 read('src/precipitationAvailability.ts'),read('src/App.tsx'),read('MID_PRECIPITATION_INTERVAL_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const code=(await transform(helperSource,{loader:'ts',format:'esm',target:'es2022'})).code;
const h=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const rows=(start,values)=>values.map((amount,i)=>({start:start+i*3600000,end:start+(i+1)*3600000,amount}));
for(const value of [null,undefined,NaN,Infinity,-Infinity,'',false,-1,101,'0']){
 assert.equal(h.isAvailableProbability(value),false);
 assert.ok(Number.isNaN(h.maxCompleteProbability([0,value])));
}
for(const value of [null,undefined,NaN,Infinity,'',false,-1,'0']){
 assert.equal(h.isAvailablePrecipitation(value),false);
 assert.ok(Number.isNaN(h.sumCompletePrecipitation([0,value,2])));
}
assert.equal(h.isAvailableProbability(0),true);
assert.equal(h.isAvailableProbability(100),true);
assert.equal(h.maxCompleteProbability([0,15,100]),100);
assert.equal(h.sumCompletePrecipitation([0,0,0]),0);
const hours=rows(0,[0,.2,.4]);
assert.equal(h.completePrecipitationWindowCoverage(hours,0,3*3600000),true);
assert.equal(h.completePrecipitationWindowCoverage(hours,3600000,3*3600000),false);
assert.equal(h.completePrecipitationWindowCoverage(hours,0,2*3600000),false);
assert.equal(h.completePrecipitationWindowCoverage(hours,NaN,3*3600000),false);
assert.equal(h.completePrecipitationWindowCoverage([],0,3*3600000),false);
assert.equal(h.completePrecipitationWindowCoverage([hours[0],hours[2]],0,3*3600000),false);
assert.equal(h.completePrecipitationWindowCoverage([{start:0,end:4*3600000},{start:3*3600000,end:5*3600000}],0,5*3600000),false);
for(const length of [23,24,25])assert.equal(h.completePrecipitationWindowCoverage(rows(0,Array(length).fill(0)),0,length*3600000),true);
const points=[{x:0,y:0},{x:1,y:10},{x:2,y:NaN},{x:3,y:0},{x:4,y:75}];
assert.deepEqual(h.contiguousFinitePrecipitationSegments(points),[[points[0],points[1]],[points[3],points[4]]]);
for(const key of [
 "completeCoverage?sumCompletePrecipitation(group.map(hour=>hour[key])):Number.NaN",
 "completeCoverage?maxCompleteProbability(group.map(hour=>hour.probability)):Number.NaN",
 "completePrecipitationWindowCoverage(metricHours.map(hour=>({start:hour.epoch,end:hour.epoch+3600000})),detailAxis.start,detailAxis.end)",
 "const yProb=(v:unknown)=>isAvailableProbability(v)?",
 "contiguousFinitePrecipitationSegments(probabilityCurvePoints).map(monotoneSvgPath).join(' ')",
 "showProbability&&isAvailableProbability(currentHour.probability)&&<circle",
 "detailProbabilityLabel(currentHour.probability)",
 "isAvailablePrecipitation(currentHour.precipitation)?precipitationAmountLabel(currentHour):'Menge nicht verfügbar'"
 ])assert.ok(app.includes(key),'A3 not using shared NoData path: '+key);
assert.ok(!app.includes("probabilityPath=showProbability?monotoneSvgPath(probabilityCurvePoints)"));
assert.ok(!app.includes("total+Math.max(0,Number(hour[key])||0)"));
assert.ok(contract.includes('23-/25-Stunden-Tage'));
const pkg=JSON.parse(pkgSource),baseline=JSON.parse(baselineSource),name='scripts/test-design-a3-precipitation-integrity-0985387.mjs';
assert.equal(pkg.version,baseline.releaseVersion);
assert.equal(pkg.scripts['test:design-a3-nodata'],'node '+name);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(name));
console.log('MID A3 NoData: 23/24/25h, 3h completeness, interval/PoP/null safety');
