import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {validateMapAuditPng,selectMapAuditFrame,MAP_AUDIT_MAX_IMAGE_BYTES} from './weather-map-audit-admission.mjs';

const now=Date.parse('2026-11-23T08:00:00Z');
const at=(h)=>new Date(now+h*3600000).toISOString();
const run=at(-2);
const layer='dwd:Icon_reg025_fd_sl_T2M';
const product={layer,times:[at(-1),at(2),at(120),at(250)],referenceTimes:[run],elevations:[]};
let p=selectMapAuditFrame({layer,metadata:product,entry:{timeCount:4,referenceCount:1},now});
assert.equal(p.ok,true);assert.equal(p.time,at(2),'near-term forecast rather than furthest available time');assert.equal(p.run,run);
const accumulation='dwd:Icon_reg025_fd_sl_TOTPREC06H';
p=selectMapAuditFrame({layer:accumulation,metadata:{...product,layer:accumulation,times:[at(1),at(5),at(8),at(160)]},entry:{timeCount:4,referenceCount:1},now});
assert.equal(p.time,at(5),'6-hour total must start only after 6-hour accumulated window from model run');
assert.equal(p.windowHours,6);
assert.deepEqual(selectMapAuditFrame({layer,metadata:{...product,referenceTimes:[]},entry:{timeCount:1},now}),{ok:false,reason:'unverified-model-run'});
assert.deepEqual(selectMapAuditFrame({layer,metadata:{layer,times:[],referenceTimes:[]},entry:{timeCount:0,referenceCount:0,status:'listed'},now}),{ok:false,reason:'unverified-model-run'},'a listed model product without dimensions must fail closed');
assert.equal(selectMapAuditFrame({layer,metadata:{...product,times:[]},entry:{timeCount:0,referenceCount:1,status:'listed'},now}).reason,'no-admissible-valid-time','run alone is insufficient without a forecast validity time');
assert.equal(selectMapAuditFrame({layer,metadata:{...product,layer:'wrong'},entry:{timeCount:1},now}).reason,'metadata-layer-mismatch');
const obs='dwd:Gewitterzellen';
p=selectMapAuditFrame({layer:obs,metadata:{layer:obs,times:[at(-.1)],referenceTimes:[],elevations:[]},entry:{timeCount:1},now});
assert.equal(p.ok,true);assert.equal(p.run,undefined,'NowCastMIX does not invent a deterministic reference time');
assert.equal(selectMapAuditFrame({layer:obs,metadata:{layer:obs,times:[],referenceTimes:[]},entry:{timeCount:0,status:'listed'},now}).reason,'no-admissible-valid-time','a time-free nowcast is not an observed frame');
assert.equal(selectMapAuditFrame({layer,metadata:{...product,times:[at(250)]},entry:{timeCount:1},now}).reason,'no-admissible-valid-time');

const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
function crc(bytes){let c=0xffffffff;for(const v of bytes)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function be(n){const b=Buffer.alloc(4);b.writeUInt32BE(n);return b}
function chunk(type,data=Buffer.alloc(0)){const s=Buffer.concat([Buffer.from(type),data]);return Buffer.concat([be(data.length),s,be(crc(s))])}
function png(width=256,height=256){const hdr=Buffer.alloc(13);hdr.writeUInt32BE(width);hdr.writeUInt32BE(height,4);hdr[8]=8;hdr[9]=6;const row=Buffer.alloc(width*4+1);const pixels=Buffer.concat(Array.from({length:height},()=>row));return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',hdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND')])}
const good=png();assert.equal(validateMapAuditPng(good).ok,true);
assert.equal(validateMapAuditPng(good).proof,'png-decoded-structure-only','a decoded transport is not a meteorological observation');
assert.equal(validateMapAuditPng(png(512,256)).reason,'png-unexpected-dimensions');
assert.equal(validateMapAuditPng(good.subarray(0,20)).ok,false);
assert.equal(validateMapAuditPng(good.subarray(0,-12)).reason,'png-missing-end-or-pixels');
const damaged=Buffer.from(good);damaged[29]^=1;assert.equal(validateMapAuditPng(damaged).reason,'png-crc-mismatch');
const signature=Buffer.from([137,80,78,71,13,10,26,10]),header=good.subarray(16,29);
const invalidZlib=Buffer.concat([signature,chunk('IHDR',header),chunk('IDAT',Buffer.from('not-zlib')),chunk('IEND')]);
assert.equal(validateMapAuditPng(invalidZlib).reason,'png-invalid-idat-stream','a CRC-valid body with invalid compressed data is rejected');
const invalidFilterPixels=Buffer.alloc(256*(256*4+1));invalidFilterPixels[0]=5;
const invalidFilter=Buffer.concat([signature,chunk('IHDR',header),chunk('IDAT',deflateSync(invalidFilterPixels)),chunk('IEND')]);
assert.equal(validateMapAuditPng(invalidFilter).reason,'png-invalid-scanline-filter','a decompressible but invalid scanline is rejected');
assert.equal(validateMapAuditPng(Buffer.alloc(MAP_AUDIT_MAX_IMAGE_BYTES+1)).reason,'png-byte-budget-or-truncation');
assert.equal(validateMapAuditPng(Buffer.alloc(67)).reason,'not-png');
console.log('Map audit QA: run/time/accumulation/PNG wire-structure assertions passed; no meteorological NoData claim.');

// Run the real audit entrypoint through a fully mocked MID Worker, confirming
// zero external HTTP requests, exact run/time forwarding and JSON statuses.
const savedFetch=globalThis.fetch,savedLog=console.log,savedBase=process.env.MID_MAP_AUDIT_BASE;
const calls=[],logs=[];
try{
 process.env.MID_MAP_AUDIT_BASE='https://www.midwx.app/api/mid-worker';
 const current=Date.now(),actualRun=new Date(current-2*3600000).toISOString(),actualTime=new Date(current+3600000).toISOString();
 globalThis.fetch=async (input)=>{
  const url=new URL(String(input));assert.equal(url.origin,'https://www.midwx.app','audit never accesses unknown external origins');
  calls.push(url);
  const mode=url.searchParams.get('mode');
  if(mode==='weather-map-catalog')return Response.json({schema:'mid.weather-map-catalog.v1',checkedAt:new Date(current).toISOString(),version:'0.9.85.511',providers:{dwd:'verified',geomet:'verified'},layers:{[layer]:{status:'listed',timeCount:2,referenceCount:1},'GDPS_15km_TotalCloudCover':{status:'absent'}}});
  if(mode==='weather-map-metadata')return Response.json({...product,referenceTimes:[actualRun],times:[actualTime,new Date(current+180*3600000).toISOString()]});
  if(mode==='weather-map-wms'){
   assert.equal(url.searchParams.get('layers'),layer);
   assert.equal(url.searchParams.get('time'),actualTime);
   assert.equal(url.searchParams.get('dim_reference_time'),actualRun);
   assert.equal(url.searchParams.get('width'),'256');
   return new Response(good,{status:200,headers:{'content-type':'image/png'}});
  }
  throw Error('Unexpected additional network request: '+mode);
 };
 console.log=(...args)=>logs.push(args.join(' '));
 await import('./audit-weather-map-live.mjs?mock-end-to-end');
 const report=JSON.parse(logs.at(-1));
 assert.equal(report.complete,true);
 assert.equal(report.scanned,2);assert.equal(report.verifiedPng,1);
 assert.equal(report.results[0].probe,'valid-png-response');
 assert.equal(report.results[0].modelRun,actualRun);
 assert.equal(report.evidenceScope.includes('NOT'),true);
 assert.equal(report.results[1].probe,'not-in-current-capabilities');
 assert.equal(calls.length,3,'one catalog + one metadata + one image; no extra requests');
}finally{globalThis.fetch=savedFetch;console.log=savedLog;if(savedBase===undefined)delete process.env.MID_MAP_AUDIT_BASE;else process.env.MID_MAP_AUDIT_BASE=savedBase;}
console.log('Map audit E2E: real entrypoint successfully audited two allowlisted layers with a mocked Worker and zero network calls.');
