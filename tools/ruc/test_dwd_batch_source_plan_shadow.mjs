import test from "node:test";
import assert from "node:assert/strict";
import {planDwdBatch,sourceKey,checkedRun} from "./dwd_batch_source_plan_shadow.mjs";
const mk=()=>planDwdBatch({iconD2Run:"2026110306",rucRun:"2026110307"});
test("regular ICON-D2 map and totals share exactly ten cumulative source requests",()=>{
 const p=mk();
 assert.equal(p.byConsumer["regular-map"],99);
 assert.equal(p.byConsumer["regular-totals"],5);
 assert.equal(p.overlaps.filter(x=>x.consumers.includes("regular-totals")).length,5);
 assert.equal(p.overlaps.filter(x=>x.model==="icon-d2").reduce((a,v)=>a+v.consumers.length-1,0),10);
});
test("RUC 27h PMSL/CLCT have 56 identical native source references",()=>{
 const p=mk();
 assert.equal(p.byConsumer["ruc-core"],28*12);
 assert.equal(p.byConsumer["ruc-synoptic"],28*2);
 assert.equal(p.overlaps.filter(x=>x.model==="icon-d2-ruc").length,56);
});
test("planned requests and distinct source keys are exact and informational",()=>{
 const p=mk();assert.equal(p.requestedReferences,496);
 assert.equal(p.uniqueSourceKeys,430);assert.equal(p.duplicateReferences,66);
 assert.equal(p.productionEligible,false);
});
test("native ICON-D2-RUC and remapped regular ICON-D2 must never share a key",()=>{
 const base={model:"icon-d2",run:"2026110306",grid:"germany_regular-lat-lon",parameter:"pmsl",level:null,hour:6,stepSemantics:"instant"};
 assert.notEqual(sourceKey(base),sourceKey({...base,model:"icon-d2-ruc",grid:"native-icosahedral"}));
});
test("run, level, accumulation vs interval identity must never be collapsed",()=>{
 const base={model:"icon-d2",run:"2026110306",grid:"germany_regular-lat-lon",parameter:"tot_prec",level:null,hour:6,stepSemantics:"accum-from-run"};
 assert.notEqual(sourceKey(base),sourceKey({...base,run:"2026110309"}));
 assert.notEqual(sourceKey(base),sourceKey({...base,level:850}));
 assert.notEqual(sourceKey(base),sourceKey({...base,stepSemantics:"interval-1h"}));
});
test("invalid UTC runs and non-3h regular ICON-D2 cycles fail closed",()=>{
 assert.throws(()=>checkedRun("2026023006"));
 assert.throws(()=>checkedRun("2026110307Z"));
 assert.throws(()=>planDwdBatch({iconD2Run:"2026110307",rucRun:"2026110307"}));
});
test("RUC and regular products never mix even at same clock initialization",()=>{
 const p=planDwdBatch({iconD2Run:"2026110306",rucRun:"2026110306"});
 assert.equal(p.duplicateReferences,66);
 assert.equal(p.overlaps.filter(x=>new Set(x.consumers).size>2).length,0);
});
