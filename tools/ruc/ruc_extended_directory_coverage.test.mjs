import assert from 'node:assert/strict';
import {test} from 'node:test';
import {FIELDS,parseHourlyIndex,qualifyHorizon} from './ruc_extended_directory_coverage.mjs';
const run='2026-11-23T08:00',observedAt='2026-11-23T09:30:00Z';
function full(){return Object.fromEntries(FIELDS.map(f=>[f,Array.from({length:28},(_,i)=>i)]));}
test('28 advertised leads for all 12 DWD fields; 273188160 extra raw bytes; no unauthorized publication',()=>{
 const r=qualifyHorizon({run,observedAt,fieldHours:full(),siteBytes:805025405});
 assert.equal(r.candidateHorizonHours,27);assert.equal(r.additionalDeterministicRawBytes,273188160);
 assert.equal(r.rawAppendWouldFit,false);assert.equal(r.epsRequired,false);assert.equal(r.gribAdmitted,false);assert.equal(r.publicationAuthorized,false);
});
test('missing lead in one mandatory field clips the contiguous common horizon',()=>{
 const x=full();x.CLCL.splice(14,1);
 assert.equal(qualifyHorizon({run,observedAt,fieldHours:x}).candidateHorizonHours,13);
});
test('no extension when only original 0..6h is listed',()=>{
 const x=Object.fromEntries(FIELDS.map(f=>[f,Array.from({length:7},(_,i)=>i)]));
 const r=qualifyHorizon({run,observedAt,fieldHours:x});assert.equal(r.candidateHorizonHours,6);assert.equal(r.additionalDeterministicRawBytes,0);
});
test('no EPS field is used and malformed/incomplete directory inventory fails closed',()=>{
 for(const bad of [[1,1],[-1],[0,999],null,[]]){const x={...full(),CAPE_ML:bad};assert.throws(()=>qualifyHorizon({run,observedAt,fieldHours:x}));}
});
test('stale, future, malformed timestamps are rejected',()=>{
 for(const stamp of ['2026-11-23T12:10:00Z','2026-11-23T07:54:00Z','invalid'])
  assert.throws(()=>qualifyHorizon({run,observedAt:stamp,fieldHours:full()}));
 assert.throws(()=>qualifyHorizon({run:'2026-11-23T08:30',observedAt,fieldHours:full()}));
});
test('HTML listing reader accepts only hourly signed DWD-style filenames',()=>{
 const html='<a href="PT000H00M.grib2">0</a><a href="PT001H00M.grib2">1</a><a href="PT002H15M.grib2">15m</a>';
 assert.deepEqual(parseHourlyIndex(html),[0,1]);
 assert.throws(()=>parseHourlyIndex('<a href="PT000H00M.grib2"></a><a href="PT000H00M.grib2"></a>'));
 assert.throws(()=>parseHourlyIndex('no hourly GRIB files'));
});
test('untrusted site bytes never authorizes extending beyond 900MB',()=>{
 assert.throws(()=>qualifyHorizon({run,observedAt,fieldHours:full(),siteBytes:900000001}));
 const v=qualifyHorizon({run,observedAt,fieldHours:full(),siteBytes:10000000});
 assert.equal(v.rawAppendWouldFit,true);assert.equal(v.siteBytesVerified,false);assert.equal(v.publicationAuthorized,false);
});
