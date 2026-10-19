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
const {detailSkyBarHourCells,detailSkyBarTimedSegments}=load('src/detailSkyBar.ts');
const epoch=Date.UTC(2026,9,19,18),interval=900000;
const sample=(code,fields={})=>({
 epoch,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+interval,
 isDay:true,cloud:80,code,precipitation:null,rain:null,showers:null,snowfall:null,...fields,
});
const title=hour=>detailSkyBarHourCells([hour])[0].precip?.title??null;
for(const code of [51,61,63,71,81,82,95]){
 const unknown=sample(code),label=title(unknown);
 assert.ok(label,`WMO code ${code} must preserve the precipitation phase, even without a total`);
 assert.match(label,/Gesamtmenge nicht verfügbar/,`WMO ${code}: missing must be visibly missing`);
 assert.ok(!/\b0(?:[.,]0)?\s*(?:mm|cm)(?:\/|\b)/.test(label),`WMO ${code}: must not fabricate 0 mm`);
 assert.match(label,new RegExp(`WMO-Wettercode ${code}`),'Original code must remain traceable');
 assert.equal(detailSkyBarTimedSegments([unknown],epoch,epoch+interval,0,0,100,8).filter(x=>x.layer==='precip').length,1);
}
const violent=detailSkyBarHourCells([sample(82)])[0].precip;
assert.equal(violent?.thicknessLevel,4,'Extreme official shower code must remain strong, not be silently smoothed');
for(const bad of [null,undefined,NaN,Infinity,-1,'',' ',false]){
 const label=title(sample(61,{precipitation:bad}));
 assert.match(label,/Gesamtmenge nicht verfügbar/,`Invalid amount ${String(bad)} remains NoData`);
 assert.ok(!/\b0(?:[.,]0)?\s*mm/.test(label));
}
for(const good of [0,0.04,1.25]){
 const label=title(sample(61,{precipitation:good}));
 assert.ok(label&&!label.includes('Gesamtmenge nicht verfügbar'),`Known amount ${good} must remain available`);
 if(good===0)assert.match(label,/0(?:[.,]0)?\s*mm/,`A real measured 0 remains a real 0`);
}
const partial=title(sample(3,{precipitation:null,rain:0.2}));
assert.ok(partial&&partial.includes('Gesamtmenge nicht verfügbar'),'A known rain component may signal precipitation, but must not impersonate the absent total');
assert.ok(!/\b0(?:[.,]0)?\s*mm/.test(partial));
for(const dry of [sample(3),sample(0),sample(3,{precipitation:NaN,rain:NaN,showers:NaN,snowfall:NaN})]){
 assert.equal(title(dry),null,'No observed amount or wet code must never fabricate precipitation');
}
assert.equal(detailSkyBarHourCells([sample(3,{cloud:null})])[0].state,'unavailable','Missing sky and precipitation is unavailable, not clear');
console.log('MID .300: WMO 51/61/63/71/81/82/95 and 15-minute NoData, invalid/real-zero amounts, lower-bound components, missing-night and extreme preservation OK.');
