import test from "node:test";
import assert from "node:assert/strict";
import { spatialObjectUrl,selectedSpatialTimes,probeSpatialRange } from "./openmeteo_spatial_byte_shadow.mjs";
const ref="2026-11-03T07:00Z";
const step=i=>new Date(Date.parse(ref)+i*60000).toISOString().slice(0,16)+"Z";
const fixture={
 reference_time:ref,
 valid_times:Array.from({length:28},(_,i)=>step(i*60))
};
const domain="dwd_icon_d2_ruc_native";
function rangeResponse({
 status=206,range="bytes 0-63/4096",length="64",byteCount=64
}={}){
 return new Response(new Uint8Array(byteCount),{status,headers:{
   "content-range":range,"content-length":length,
   "etag":"\"test-etag\"",
   "access-control-allow-origin":"*"
 }});
}
test("immutable exact-run S3 path is constructed from allowlisted domain and UTC manifest",()=>{
 assert.equal(spatialObjectUrl(domain,fixture,step(60)),
 "https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2_ruc_native/2026/11/03/0700Z/2026-11-03T0800.om");
});
test("step 0 omitted when selecting samples because backward accumulations are undefined",()=>{
 assert.deepEqual(selectedSpatialTimes(fixture),[step(60),step(780),step(1620)]);
});
test("path traversal and arbitrary domains rejected",()=>{
 assert.throws(()=>spatialObjectUrl("../bad",fixture,step(60)));
 assert.throws(()=>spatialObjectUrl(domain,fixture,"2026-11-03T09:00Z?secret=x"));
});
test("unknown time and separate run rejected",()=>{
 assert.throws(()=>spatialObjectUrl(domain,fixture,step(1800)));
 assert.throws(()=>spatialObjectUrl(domain,{...fixture,reference_time:"2026-11-03T06:00Z"},step(60)));
});
test("valid native 64-byte HTTP 206 range is verified but never production eligible",async()=>{
 let calls=0;
 const p=await probeSpatialRange(domain,fixture,step(60),async(url,options)=>{
  calls++;assert.equal(options.headers.Range,"bytes=0-63");
  assert.equal(options.redirect,"error");
  assert.ok(url.endsWith("2026-11-03T0800.om"));
  return rangeResponse();
 });
 assert.equal(calls,1);assert.equal(p.objectTotalBytes,4096);
 assert.equal(p.first64BytesSha256.length,64);assert.equal(p.productionEligible,false);
 assert.equal(p.fullContentSha256Proven,false);
 assert.equal(p.dwdOriginalGridAndValuesProven,false);
});
test("whole-object HTTP 200 is not silently downloaded or accepted",async()=>{
 await assert.rejects(probeSpatialRange(domain,fixture,step(60),async()=>rangeResponse({status:200})),/Byte-range/);
});
test("missing or inconsistent range rejected",async()=>{
 for(const conf of [{range:"bytes 1-64/4096"},{range:"bytes 0-63/*"},{length:"65"}]){
   await assert.rejects(probeSpatialRange(domain,fixture,step(60),async()=>rangeResponse(conf)));
 }
});
test("truncated and oversized body rejected",async()=>{
 for(const byteCount of [63,65]){
   await assert.rejects(probeSpatialRange(domain,fixture,step(60),async()=>rangeResponse({byteCount})));
 }
});
test("missing object cannot be treated as available",async()=>{
 await assert.rejects(probeSpatialRange(domain,fixture,step(60),async()=>new Response(null,{status:404})),/Byte-range/);
});
test("no time-axis samples -> fail closed",()=>{
 assert.throws(()=>selectedSpatialTimes({valid_times:[]}));
});
