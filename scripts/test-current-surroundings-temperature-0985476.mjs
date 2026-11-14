// #795: deterministic scientific admission tests for neighborhood model temperatures.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const helper=await readFile(new URL('../src/currentSurroundingsTemperature.ts',import.meta.url),'utf8');
const component=await readFile(new URL('../src/CurrentSurroundings.tsx',import.meta.url),'utf8');
const css=await readFile(new URL('../src/CurrentSurroundings.css',import.meta.url),'utf8');
const compiled=ts.transpileModule(helper,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
assert.equal(compiled.diagnostics?.length??0,0,'Pure temperature module should transpile without diagnostics');
const exports={};
runInNewContext(compiled.outputText,{exports,Date,Math,Number,Array,Object,String});
const {extractSurroundingsTemperatures:extract}=exports;
assert.equal(typeof extract,'function');
const at=Date.parse('2026-11-14T12:00:00Z');
const places=[{id:'Dorf:50.0:7.0',lat:50,lon:7},{id:'Dorf:50.1:7.1',lat:50.1,lon:7.1}];
const grid={
 modelId:'icon-d2',modelLabel:'DWD ICON-D2',referenceTime:'2026-11-14T09:00:00Z',
 lats:[50,50.1],lons:[7,7.1],frame:{time:'2026-11-14T12:00:00Z',temperature2m:[0,null,-3.5,14.2]}
};
const result=extract(grid,places,at);
assert.ok(result,'Valid original temperature field must work without any precipitation-phase metadata');
assert.deepEqual(JSON.parse(JSON.stringify(result.values)),{'Dorf:50.0:7.0':0,'Dorf:50.1:7.1':14.2},'Zero degree is a valid measurement; null must not become 0');
assert.equal(result.modelLabel,'DWD ICON-D2');
assert.equal(result.validTime,at);
assert.equal(result.runTime,Date.parse(grid.referenceTime));
assert.equal(extract(grid,[{id:'missing',lat:51,lon:10}],at),undefined,'Outside the grid means no data');
assert.equal(extract({...grid,stale:true},places,at),undefined,'Stale grid cannot supply current temperatures');
assert.equal(extract({...grid,error:'unavailable'},places,at),undefined);
assert.equal(extract({...grid,referenceTime:undefined},places,at),undefined,'Unknown model run has no admissible provenance');
assert.equal(extract({...grid,referenceTime:'2026-11-14T12:15:00Z'},places,at),undefined,'Future model run is implausible');
assert.equal(extract({...grid,modelAgeHours:18},places,at),undefined,'Old model is excluded');
assert.equal(extract({...grid,lats:[50]},places,at),undefined,'Short grid must fail closed');
assert.equal(extract({...grid,lats:[50,50.1,50.05],frame:{...grid.frame,temperature2m:[0,1,2,3,4,5]}},places,at),undefined,'Nonmonotonic axes rejected');
assert.equal(extract({...grid,frame:{...grid.frame,time:'2026-11-14T13:00:00Z'}},places,at),undefined,'Model valid time must match current request');
assert.equal(extract({...grid,frame:{...grid.frame,temperature2m:[0,1,2]}},places,at),undefined,'Incomplete temperature grid is unavailable');
assert.equal(extract({...grid,frame:{...grid.frame,temperature2m:[null,null,null,null]}},places,at),undefined,'All missing values must remain missing');
assert.doesNotMatch(component,/grid\.phaseSourceByCell|grid\.phaseValidTimeByCell/,'Temperature admission must not depend on precipitation-phase cell metadata');
assert.match(component,/extractSurroundingsTemperatures/);
assert.match(component,/temperatureTarget/,'Temperature requests must not wait for radar frames');
assert.doesNotMatch(css,/\.current-surroundings :is\(\.current-surroundings-site, \.current-surroundings-place\)[\s\S]{0,250}color:\s*white\s*;/,'White unbacked map labels are unsafe on snow');
console.log('MID #795 temperature provenance: 15 synthetic and source-contract checks passed.');
