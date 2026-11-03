import test from "node:test";
import assert from "node:assert/strict";
import {DOMAIN_RULES,auditManifest,compareRunSet} from "./openmeteo_spatial_shadow.mjs";
const NOW=new Date("2026-11-03T08:45:00Z");
function fixture(model,mode="latest",cut=0){
 const {minutes,leadMinutes,fields}=DOMAIN_RULES[model];
 const t0=Date.parse("2026-11-03T07:00:00Z");
 return {completed:mode==="latest",reference_time:"2026-11-03T07:00:00Z",
 last_modified_time:"2026-11-03T07:48:00Z",
 valid_times:Array.from({length:leadMinutes/minutes+1-cut},(_,i)=>new Date(t0+i*minutes*60000).toISOString().slice(0,16)+"Z"),
 variables:[...fields]};
}
test("hourly native has 28 independent valid times, never production eligibility",()=>{
 const a=auditManifest("dwd_icon_d2_ruc_native",fixture("dwd_icon_d2_ruc_native"),"latest",NOW);
 assert.equal(a.validTimeCount,28);assert.equal(a.full27hAxis,true);assert.equal(a.productionEligible,false);
 assert.equal(a.fullNative542040GridProven,false);
});
test("15-minute native has 109 independent valid times; no invented 5m data",()=>{
 const a=auditManifest("dwd_icon_d2_ruc_native_15min",fixture("dwd_icon_d2_ruc_native_15min"),"latest",NOW);
 assert.equal(a.validTimeCount,109);assert.equal(a.full27hAxis,true);assert.equal(a.nativeTimestepMinutes,15);
});
test("in-progress is identifiable, not a completed full run",()=>{
 const a=auditManifest("dwd_icon_d2_ruc_native",fixture("dwd_icon_d2_ruc_native","in-progress",3),"in-progress",NOW);
 assert.equal(a.completed,false);assert.equal(a.full27hAxis,false);assert.equal(a.metadataValid,true);
});
test("latest must claim completed=true",()=>{
 const a=auditManifest("dwd_icon_d2_ruc_native",fixture("dwd_icon_d2_ruc_native","in-progress"),"latest",NOW);
 assert.ok(a.errors.includes("latest_not_completed"));
});
test("time duplicates are rejected",()=>{
 const f=fixture("dwd_icon_d2_ruc_native");f.valid_times[2]=f.valid_times[1];
 const a=auditManifest("dwd_icon_d2_ruc_native",f,"latest",NOW);
 assert.ok(a.errors.includes("duplicate_valid_time"));assert.equal(a.full27hAxis,false);
});
test("gaps invalidate full native time axis",()=>{
 const f=fixture("dwd_icon_d2_ruc_native");f.valid_times.splice(7,1);
 const a=auditManifest("dwd_icon_d2_ruc_native",f,"latest",NOW);
 assert.equal(a.full27hAxis,false);assert.equal(a.axisGaps.length,1);
});
test("field absent is explicit missing, not numerical zero",()=>{
 const f=fixture("dwd_icon_d2_ruc_native");f.variables.pop();
 const a=auditManifest("dwd_icon_d2_ruc_native",f,"latest",NOW);
 assert.equal(a.missingExpectedFields.length,1);assert.equal(a.productionEligible,false);
});
test("different model cycles block common batch",()=>{
 const f=fixture("dwd_icon_d2_ruc_native_15min");f.reference_time="2026-11-03T06:00:00Z";
 const result=compareRunSet([auditManifest("dwd_icon_d2_ruc_native",fixture("dwd_icon_d2_ruc_native"),"latest",NOW),
 auditManifest("dwd_icon_d2_ruc_native_15min",f,"latest",NOW)]);
 assert.equal(result.sameReferenceRun,false);assert.equal(result.productionEligible,false);
});
test("invalid and non-UTC timestamps rejected",()=>{
 const f=fixture("dwd_icon_d2_ruc_native");f.reference_time="2026-11-03T07:00:00+01:00";
 const a=auditManifest("dwd_icon_d2_ruc_native",f,"latest",NOW);
 assert.ok(a.errors.includes("invalid_utc_reference_time"));
});
test("future last-modified timestamp rejected",()=>{
 const f=fixture("dwd_icon_d2_ruc_native");f.last_modified_time="2026-11-04T08:48:00Z";
 const a=auditManifest("dwd_icon_d2_ruc_native",f,"latest",NOW);
 assert.ok(a.errors.includes("modification_in_future"));
});
test("stale run reported, not silently treated as fresh",()=>{
 const f=fixture("dwd_icon_d2_ruc_native");
 const a=auditManifest("dwd_icon_d2_ruc_native",f,"latest",new Date("2026-11-03T15:00:00Z"));
 assert.ok(a.warnings.includes("mid_four_hour_run_age_exceeded"));
});
test("malformed source domain rejected",()=>{
 assert.throws(()=>auditManifest("unapproved",fixture("dwd_icon_d2_ruc_native"),"latest",NOW));
});

test("official RUC pressure-level variable suffix hPa remains valid; arbitrary mixed-case rejected",()=>{
 const f=fixture("dwd_icon_d2_ruc_native");
 f.variables.push("temperature_850hPa","relative_humidity_1000hPa");
 const a=auditManifest("dwd_icon_d2_ruc_native",f,"latest",NOW);
 assert.equal(a.metadataValid,true);
 const corrupted=fixture("dwd_icon_d2_ruc_native");corrupted.variables.push("Wind_Gust_10m");
 assert.ok(auditManifest("dwd_icon_d2_ruc_native",corrupted,"latest",NOW).errors.includes("invalid_variable_name"));
});
