import assert from 'node:assert/strict';
import {test} from 'node:test';
import {FIELDS,parseHourlyIndex,qualifyHorizon,readOriginalIndex} from './ruc_extended_directory_coverage.mjs';
const run='2026-11-23T08:00',observedAt='2026-11-23T09:30:00Z';
const directory='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/T_2M/r/2026-11-23T08:00/s/';
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
 assert.deepEqual(parseHourlyIndex(html,directory),[0,1]);
 assert.throws(()=>parseHourlyIndex('<a href="PT000H00M.grib2"></a><a href="PT000H00M.grib2"></a>',directory));
 assert.throws(()=>parseHourlyIndex('no hourly GRIB files',directory));
});
test('untrusted site bytes never authorizes extending beyond 900MB',()=>{
 assert.throws(()=>qualifyHorizon({run,observedAt,fieldHours:full(),siteBytes:900000001}));
 const v=qualifyHorizon({run,observedAt,fieldHours:full(),siteBytes:10000000});
 assert.equal(v.rawAppendWouldFit,true);assert.equal(v.siteBytesVerified,false);assert.equal(v.publicationAuthorized,false);
});
test('actual DWD absolute original URLs qualify; foreign, query and other-run hrefs are ignored',()=>{
 const html='<a href="'+directory+'PT000H00M.grib2">0</a><a href="'+directory+'PT027H00M.grib2">27</a>';
 assert.deepEqual(parseHourlyIndex(html,directory),[0,27]);
 const forged='<a href="https://elsewhere.example/'+directory+'PT000H00M.grib2">fake</a>';
 assert.throws(()=>parseHourlyIndex(forged,directory));
 const previous='<a href="'+directory.replace('T08:00','T07:00')+'PT000H00M.grib2">wrong run</a>';
 assert.throws(()=>parseHourlyIndex(previous,directory));
 assert.throws(()=>parseHourlyIndex(html,directory.replace('https://opendata.dwd.de','https://example.org')));
 assert.throws(()=>parseHourlyIndex('<a href="PT000H00M.grib2?redirect=yes">bad</a>',directory));
});

const url='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/T_2M/r/2026-11-23T08:00/s/';
const bytes=new TextEncoder().encode('ä test');
function fixture({headers={'content-length':String(bytes.length)},chunks=[bytes],status=200,redirected=false,target=url,fail=false}={}){
  let index=0;
  return {status,redirected,url:target,headers:new Headers(headers),body:new ReadableStream({pull(c){
    if(index<chunks.length)c.enqueue(chunks[index++]);else if(fail)c.error(Error('truncated'));else c.close();
  }})};
}
test('bounded original DWD reader accepts complete exact-length and chunked UTF-8',async()=>{
  assert.equal(await readOriginalIndex(fixture(),url),'ä test');
  assert.equal(await readOriginalIndex(fixture({headers:{'transfer-encoding':'chunked'},chunks:[bytes.slice(0,1),bytes.slice(1)]}),url),'ä test');
});
test('rejects untrusted status, URL, redirect, framing, encoding and truncation',async()=>{
  for(const options of [
    {status:206},{redirected:true},{target:url+'?other=1'},
    {headers:{}},{headers:{'content-length':'4, 4'}},{headers:{'content-length':'-1'}},
    {headers:{'content-length':'2000001'}},{headers:{'content-length':'1'}},
    {headers:{'content-length':String(bytes.length+1)}},
    {headers:{'content-length':String(bytes.length),'transfer-encoding':'chunked'}},
    {headers:{'content-length':String(bytes.length),'content-encoding':'gzip'}},
    {headers:{'transfer-encoding':'gzip, chunked'}},
    {headers:{'transfer-encoding':'chunked'},fail:true},
    {headers:{'transfer-encoding':'chunked'},chunks:[new Uint8Array(2_000_001)]},
    {headers:{'content-length':'1'},chunks:[Uint8Array.of(255)]},
  ])await assert.rejects(readOriginalIndex(fixture(options),url));
});

test('only actual href attributes are counted; comments, quoted lookalikes and inert content are ignored',()=>{
 const html='<a data-href="PT027H00M.grib2">fake</a><a title=\' href="PT026H00M.grib2"\'>fake</a><!-- <a href="PT025H00M.grib2">fake</a> --><script><a href="PT024H00M.grib2">fake</a></script><a HREF="PT000H00M.grib2">real</a>';
 assert.deepEqual(parseHourlyIndex(html,directory),[0]);
 assert.throws(()=>parseHourlyIndex('<a href="PT000H00M.grib2" href="PT001H00M.grib2">ambiguous</a>',directory));
 assert.throws(()=>parseHourlyIndex('<a data-href="PT000H00M.grib2">fake</a>',directory));
});
test('observation time must be explicit canonical UTC, independent of process timezone',()=>{
 for(const stamp of ['2026-11-23T09:30:00','2026-11-23T10:30:00+01:00','2026-11-23T09:30Z','2026-11-31T09:30:00Z','2026-11-23T09:30:00.01Z'])
  assert.throws(()=>qualifyHorizon({run,observedAt:stamp,fieldHours:full()}));
 assert.equal(qualifyHorizon({run,observedAt:'2026-11-23T09:30:00.000Z',fieldHours:full()}).ageMinutes,90);
});
