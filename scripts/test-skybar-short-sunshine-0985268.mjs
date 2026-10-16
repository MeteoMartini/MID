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
const {detailSkyBarHourCells:cells,detailSkyBarSegments:segments,detailSkyBarTimedSegments:timed,sunVisualShare}=load('src/detailSkyBar.ts');
for(const seconds of [900,3600])for(const cloud of [0,12.5,37.5,49.9,50,75,100])for(const share of [0,.01,.25,.5,.5001,1,null]){
 const start=Date.UTC(2026,9,15,6),sample={epoch:start,isDay:true,cloud,sunshineDuration:share===null?null:share*seconds,precipitation:0,precipitationIntervalStartEpoch:start,precipitationIntervalEndEpoch:start+seconds*1000};
 const cell=cells([sample])[0];assert.ok(cell.base,'Known daytime cloud cover must not disappear because accumulated sunshine is short');
 assert.equal(cell.base.color,cloud>=50?'#aeb3b9':'#ffc229');
 assert.equal(segments([sample],0,0,100,8).filter(s=>s.layer==='base').length,1);
 const clipped=timed([sample],start+1000,start+seconds*1000-1000,0,0,100,8).filter(s=>s.layer==='base');
 assert.equal(clipped.length,1);assert.equal(clipped[0].x1,0);assert.equal(clipped[0].x2,100);
 if(cloud<50&&share!==null&&share<=.5){assert.match(cell.base.title,/Wolkenlücken/);assert.match(cell.base.title,/Sonnenscheindauer/);assert.ok(!cell.base.title.includes('nicht verfügbar'));}
 assert.equal(cells([{...sample,isDay:false}])[0].base?.color??null,cloud>=50?'#aeb3b9':null,'Clear nights remain intentional gaps, not fabricated sunshine');
}
assert.equal(cells([{isDay:true,cloud:null,sunshineDuration:null}])[0].state,'unavailable');
assert.equal(cells([{isDay:true,cloud:null,sunshineDuration:0}])[0].base,null,'No invented clear sky when total cover is unknown');
assert.equal(sunVisualShare(.1,0),.1,'Physical sunshine duration remains unchanged');
console.log('Skybar: 98 cloud/sunshine/duration cases, night/Missing and clipped intervals passed.');
