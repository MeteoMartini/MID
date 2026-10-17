import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript-strada'),cache=new Map();
function load(path){
 if(cache.has(path))return cache.get(path);
 const module={exports:{}};cache.set(path,module.exports);
 const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const localRequire=id=>id.startsWith('.')?load(new URL(id+'.ts',new URL(path,'file://'+process.cwd()+'/')).pathname):require(id);
 vm.runInNewContext('(function(require,module,exports){'+js+'\n})',{console})(localRequire,module,module.exports);
 return module.exports;
}
const {detailSkyBarSolarSegments,detailSkyBarSegments}=load('src/detailSkyBar.ts');
const start=Date.UTC(2026,9,16,6),end=start+3600000,sunrise=start+1800000,sunset=start+15*60000;
const sample=(cloud,isDay,sunshineDuration=0,additional={})=>({
 epoch:start,precipitationIntervalStartEpoch:start,precipitationIntervalEndEpoch:end,
 cloud,isDay,sunshineDuration,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0,...additional
});
const render=(data,nightBands,positions=[0])=>detailSkyBarSolarSegments([data],0,0,100,8,positions,nightBands);
const layer=(segments,what)=>segments.filter(s=>s.layer===what);
const beforeSunrise=sample(20,false,0);
assert.equal(layer(detailSkyBarSegments([beforeSunrise],0,0,100,8), 'base').length,0,'Legacy whole-night interval remains uncolored');
const dawn=layer(render(beforeSunrise,[{startEpoch:start,endEpoch:sunrise}]),'base');
assert.equal(dawn.length,1,'Known daytime cloud hole must appear after the verified sunrise');
assert.equal(dawn[0].color,'#ffc229');assert.equal(dawn[0].x1,50);assert.equal(dawn[0].x2,100);
assert.match(dawn[0].title,/Wolkenlücken/);assert.doesNotMatch(dawn[0].title,/Sonnenscheindauer · 100 %/);
const evening=layer(render(sample(20,true,2700),[{startEpoch:sunset,endEpoch:end}]),'base');
assert.equal(evening.length,1);assert.equal(evening[0].x1,0);assert.equal(evening[0].x2,25);
assert.equal(evening[0].color,'#ffc229','No yellow after the actual sunset');
const gray=layer(render(sample(70,true,0),[{startEpoch:sunset,endEpoch:end}]),'base');
assert.equal(gray.length,2,'Verified cloud cover remains visible by day and night');
assert.equal(gray[0].color,'#aeb3b9');assert.equal(gray[1].color,'#aeb3b9');
assert.equal(gray[0].x2,25);assert.equal(gray[1].x1,25);
const rainy=sample(20,false,0,{precipitation:3,rain:3,code:61});
assert.deepEqual(layer(render(rainy,[{startEpoch:start,endEpoch:sunrise}]),'precip'),layer(detailSkyBarSegments([rainy],0,0,100,8),'precip'),'Solar clipping must never move, alter or split accumulated precipitation');
assert.equal(layer(render(sample(null,true,null),[{startEpoch:sunset,endEpoch:end}]),'base').length,0,'No fabricated sky from missing cover and sunshine');
assert.equal(layer(render(sample(0,true,1800),[{startEpoch:start,endEpoch:end}]),'base').length,0,'Complete polar night cannot display model sunshine');
assert.deepEqual(render(beforeSunrise,[]),detailSkyBarSegments([beforeSunrise],0,0,100,8,[0]),'Unknown solar events must not change existing output');
const noTimes={...beforeSunrise,epoch:undefined,precipitationIntervalStartEpoch:undefined,precipitationIntervalEndEpoch:undefined};
assert.deepEqual(render(noTimes,[{startEpoch:start,endEpoch:sunrise}]),detailSkyBarSegments([noTimes],0,0,100,8,[0]),'No inferred or invented epoch when data has no valid timestamps');
// Absolute epoch slots, not nominal 24-hour calendar bins, also remain correct
// around German DST changes (23- and 25-hour local calendar days).
for(const date of [Date.UTC(2026,2,29,1),Date.UTC(2026,9,25,1)]){
 const s=sample(10,false,0,{epoch:date,precipitationIntervalStartEpoch:date,precipitationIntervalEndEpoch:date+3600000});
 const parts=layer(render(s,[{startEpoch:date,endEpoch:date+30*60000}]),'base');
 assert.equal(parts.length,1);assert.equal(parts[0].x1,50);assert.equal(parts[0].x2,100);
}
for(const missingEpoch of [null,'']){\n const unknown={...beforeSunrise,epoch:missingEpoch};\n assert.deepEqual(render(unknown,[{startEpoch:start,endEpoch:sunrise}]),detailSkyBarSegments([unknown],0,0,100,8,[0]),'Missing cloud epoch must not be treated as zero or inferred from precipitation time');\n}\nconsole.log('Skybar v0.9.85.278: exact solar epoch clipping, dawn/dusk, missing, polar night, precipitation, DST passed.');
