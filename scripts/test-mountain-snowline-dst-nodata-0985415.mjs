import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

const mountain=await readFile('src/mountainSports.ts','utf8'),view=await readFile('src/MountainWeather.tsx','utf8');
const begin=mountain.indexOf('export function snowLineUnixEpoch('),end=mountain.indexOf('function snowLineQuantile(',begin);
assert.ok(begin>0&&end>begin,'Production Unix-time and uncertainty helpers missing');
const snippet=mountain.slice(begin,end).replaceAll('export function ','function ');
const context={Number,Math,Date};vm.createContext(context);vm.runInContext(stripTypeScriptTypes(snippet),context);
const parse=value=>vm.runInContext('snowLineUnixEpoch('+JSON.stringify(value)+')',context);
for(const iso of ['2026-03-29T00:00:00Z','2026-03-29T01:00:00Z','2026-10-25T00:00:00Z','2026-10-25T01:00:00Z']){
 const second=Date.parse(iso)/1000;assert.equal(parse(second),Date.parse(iso));
 assert.ok(Number.isNaN(parse(String(second))),'Numeric strings are not verified provider Unix seconds');
}
for(const bad of ['2026-10-25T02:00:00',null,undefined,'',123,1712345678901,-10,'999999999999999999']){
 if(bad===undefined)continue;assert.ok(Number.isNaN(parse(bad)),'Invalid or fixed-offset ISO time must not be guessed: '+bad);
}
const axis=value=>vm.runInContext('snowLineUnixAxis('+JSON.stringify(value)+')',context);
assert.equal(JSON.stringify(axis([1792886400,1792890000])),JSON.stringify([1792886400000,1792890000000]));
for(const invalid of [[1792886400,1792886400],[1792890000,1792886400],['1792886400'],[null],[],['2026-10-25T00:00']])assert.equal(axis(invalid).length,0,'Invalid source-time axis rejected');
const horizon=value=>vm.runInContext('snowLineEnsembleHorizon('+JSON.stringify(value)+')',context);
for(const [days,key,value] of [[1.4,'forecast_hours','34'],[.5,'forecast_hours','12'],[7,'forecast_days','7'],[15,'forecast_days','14']]){
 const params=horizon(days);assert.equal(Object.keys(params).length,1,'Exactly one horizon parameter');assert.equal(params[key],value,'Open-Meteo horizon must be integer '+days);
}
for(const bad of [0,-1,'1.4',null,undefined,NaN,Infinity])assert.throws(()=>horizon(bad),/Ungültiger Ensemble-Prognosehorizont/);
assert.ok(!mountain.includes('forecast_days:String(Math.min(14,definition.maxDays))'),'Fractional forecast_days must not return');
assert.ok(mountain.includes('Object.entries(snowLineEnsembleHorizon(definition.maxDays))'),'Source request must use validated horizon');
const spread=(t,z,s,f,g=.0065)=>vm.runInContext('snowLinePhysicalSpread('+[t,z,s,f,g].map(x=>x===undefined?'undefined':JSON.stringify(x)).join(',')+')',context);
assert.equal(spread(0,0,null,null),0,'Genuine zero spread must remain zero');
assert.equal(spread(null,0,125,null),125,'Native snow spread is a valid fallback');
assert.equal(spread(0,null,null,110),110,'Native freezing spread is a valid fallback');
assert.ok(Number.isNaN(spread(null,0,null,null)),'Missing spread must never be zero');
assert.ok(Number.isNaN(spread(0,null,null,null)),'Partially missing spread must remain missing');
assert.ok(Number.isNaN(spread(-1,0,null,null)),'Negative raw spreads must not be invented');
assert.ok(mountain.includes("timezone:'auto',timeformat:'unixtime'"),'Snowline ensemble must request absolute Unix seconds');
assert.ok(mountain.includes('time:new Date(epoch).toISOString()'),'Public point time must be an unambiguous UTC timestamp');
assert.ok(!mountain.includes('snowLineTimeEpoch('),'Fixed-offset DST parser may not be used for this ensemble');
for(const token of [
 'completeBounds=familyRows.every','p10:completeBounds?snowLineQuantile(pseudo,.1):Number.NaN',
 'Ensemble-Spanne nicht verfügbar','Number.isFinite(point[low])&&Number.isFinite(point[high])',
 'Modellspanne nicht verfügbar (Datenlücke)','Modellspanne (Näherung)','p25:Number.NaN'
])assert.ok((mountain+'\n'+view).includes(token),'Missing/no-silent-zero contract '+token);
assert.ok(!view.includes('10–90 %'),'Synthetic pseudo-quantiles may not be labelled empirical 10–90 %');
const pkg=JSON.parse(await readFile('package.json','utf8')),base=JSON.parse(await readFile('MID_BASELINE.json','utf8'));
assert.equal(base.releaseVersion,pkg.version);
const self='scripts/test-mountain-snowline-dst-nodata-0985415.mjs';
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(base[key].includes(self),self+' missing from '+key);
console.log('MID mountain ensemble: DST-independent UTC Unix seconds; missing uncertainty stays a visual/data gap, real zero remains zero.');
