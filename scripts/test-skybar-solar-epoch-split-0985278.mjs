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
const {detailSkyBarSolarSegments,detailSkyBarSegments,detailSkyBarTimedSegments}=load('src/detailSkyBar.ts');
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
for(const missingEpoch of [null,'']){
 const unknown={...beforeSunrise,epoch:missingEpoch};
 assert.deepEqual(render(unknown,[{startEpoch:start,endEpoch:sunrise}]),detailSkyBarSegments([unknown],0,0,100,8,[0]),'Missing cloud epoch must not be treated as zero or inferred from precipitation time');
}
// A verified night shorter than 0.65 SVG units must not be painted over.
const minuteNightStart=start+Math.round(30*60000*.17647),minuteNightEnd=start+Math.round(30*60000*.181818);
const narrowSample=sample(28,false,1260,{precipitationIntervalEndEpoch:start+30*60000});
const narrow=layer(render(narrowSample,[{startEpoch:minuteNightStart,endEpoch:minuteNightEnd}]),'base');
assert.equal(narrow.length,2,'A subpixel confirmed night must split the yellow segments');
assert.ok(narrow[0].x2<narrow[1].x1,'No yellow fill inside the narrow confirmed night span');
console.log('Skybar v0.9.85.278: exact solar epoch clipping, dawn/dusk, missing, polar night, precipitation, DST passed.');

// Current 12h uses a shared epoch axis, rather than a single normalized cell.
// Solar cuts must survive that mapping and the viewport's partial first slot.
const timed=(data,from=start,to=end,nights=[{startEpoch:sunset,endEpoch:end}])=>detailSkyBarTimedSegments([data],from,to,2,2,120,8,nights);
const timedEvening=layer(timed(sample(20,true,900)),'base');
assert.equal(timedEvening.length,1);
assert.equal(timedEvening[0].x1,2);assert.equal(timedEvening[0].x2,31);
assert.equal(layer(timed(sample(20,true,900),sunset,end),'base').length,0,'An entirely clipped daytime part must not become a full-width yellow band');
const clippedDawn=layer(timed(beforeSunrise,start+15*60000,end,[{startEpoch:start,endEpoch:sunrise}]),'base');
assert.equal(clippedDawn.length,1);assert.ok(Math.abs(clippedDawn[0].x1-(2+116/3))<1e-9);assert.equal(clippedDawn[0].x2,118);
for(const cloud of [0,49,50,100,null])for(const seconds of [900,3600])for(const shift of [Date.UTC(2026,2,29,0),Date.UTC(2026,9,25,0)]){
 const slot={...sample(cloud,true,0),epoch:shift,precipitationIntervalStartEpoch:shift,precipitationIntervalEndEpoch:shift+seconds*1000,precipitation:3,rain:3,code:61};
 const nights=[{startEpoch:shift+seconds*500,endEpoch:shift+seconds*1000}];
 const original=detailSkyBarTimedSegments([slot],shift,shift+12*3600000,2,2,120,8);
 const solar=detailSkyBarTimedSegments([slot],shift,shift+12*3600000,2,2,120,8,nights);
 assert.deepEqual(layer(solar,'precip'),layer(original,'precip'),'Solar base cannot alter precipitation geometry, amount, phase or intensity');
 for(const segment of solar){assert.ok(segment.x1>=2&&segment.x2<=118&&segment.x2>segment.x1);}
 if(cloud!==null&&cloud<50)assert.ok(layer(solar,'base').every(s=>s.x2<=2+116*(seconds/2)/(12*3600)+1e-9),'No yellow in confirmed night on the 12h axis');
 if(cloud===null)assert.equal(layer(solar,'base').length,0,'Unknown cloud and zero sunshine do not invent a base');
}
const app=readFileSync('src/App.tsx','utf8');
assert.ok(app.includes('detailSkyBarTimedSegments(currentThreadSkyBaseHours,currentThreadStartEpoch,currentThreadTargetEpoch,2,2,120,8,currentThreadSolar.nightBands)'), 'Current base must receive actual shared solar events');
assert.ok(app.includes('detailSkyBarTimedSegments(currentThreadSkyFine,currentThreadStartEpoch,currentThreadTargetEpoch,2,2,120,8).filter'), 'Current nowcast precipitation remains independent');
assert.ok(app.indexOf('currentThreadSolar=')<app.indexOf('currentThreadSkySegments='),'Solar context must be initialized before rendering');
console.log('Current 12h: solar mapping, clipped dawn/dusk, 15/60min, cloud/Missing, DST and unchanged precipitation passed.');
