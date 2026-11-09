import {describe,expect,it} from 'vitest';
import {verifySpatialRangeReceipt} from '../../src/openMeteoSpatialRangeProof';
import type {FrameResult} from '../../src/openMeteoSpatialManifest';

// Synthetic bytes test the *proof mechanism*, NOT an original DWD/Open-Meteo decode.
const frame:FrameResult={status:'manifest-only',model:'dwd_icon_d2',
 referenceTime:'2026-11-09T06:00:00Z',validTime:'2026-11-09T07:00:00Z',
 variable:'cloud_cover_high',accumulationHours:null};
const bytes=Uint8Array.from(Array.from({length:64},(_,i)=>i));
const sha=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(b))),
 v=>v.toString(16).padStart(2,'0')).join('');
const receipt=async()=>({model:'dwd_icon_d2',run:'2026-11-09T06:00:00Z',valid:'2026-11-09T07:00:00Z',
 field:'cloud_cover_high',file:'dwd_icon_d2/2026/11/09/0600Z/2026-11-09T0700.om',
 capturedUtc:'2026-11-09T08:00:00Z',kind:'header',
 start:0,end:63,totalBytes:23575944,httpStatus:206,
 contentRange:'bytes 0-63/23575944',contentLength:64,
 contentType:'application/octet-stream',sha256:await sha(bytes)});
describe('MID research-only original byte-range capture integrity',()=>{
 it('cryptographically checks provided synthetic bytes but never approves publication',async()=>{
  const result=await verifySpatialRangeReceipt(frame,await receipt(),bytes);
  expect(result.ok).toBe(true);
  if(result.ok){expect(result.rangeSha256).toBe(await sha(bytes));
   expect(result.publicationApproved).toBe(false);
   expect(result.wholeFileAttested).toBe(false);
   expect(result.nativeDwdParityVerified).toBe(false);}
 });
 it('refuses tampering, missing digest, hash spoofing, and missing bytes',async()=>{
  const altered=Uint8Array.from(bytes);altered[0]^=1;
  expect(await verifySpatialRangeReceipt(frame,await receipt(),altered))
   .toEqual({ok:false,reason:'sha256-mismatch'});
  expect(await verifySpatialRangeReceipt(frame,{...await receipt(),sha256:'a'.repeat(64)},bytes))
   .toEqual({ok:false,reason:'sha256-mismatch'});
  for(const hash of ['',null,undefined,'F'.repeat(64),'0'.repeat(63)]){
   expect(await verifySpatialRangeReceipt(frame,{...await receipt(),sha256:hash},bytes))
    .toEqual({ok:false,reason:'invalid-bytes-or-digest'});
  }
  expect(await verifySpatialRangeReceipt(frame,await receipt(),bytes.subarray(0,63)))
   .toEqual({ok:false,reason:'invalid-bytes-or-digest'});
 });
 it('refuses run/valid/model/field/path cross-contamination',async()=>{
  const r=await receipt();
  for(const mutation of [{run:'2026-11-09T03:00:00Z'},{valid:'2026-11-09T08:00:00Z'},
    {model:'dwd_icon_eu'},{field:'precipitation'},
    {file:'dwd_icon_eu/2026/11/09/0600Z/2026-11-09T0700.om'},
    {file:'../secrets.om'}]){
   expect(await verifySpatialRangeReceipt(frame,{...r,...mutation},bytes))
    .toEqual({ok:false,reason:'model-run-valid-field-file-mismatch'});
  }
 });
 it('rejects HTTP 200, mismatched exact range, length and content-type',async()=>{
  const r=await receipt();
  for(const mutation of [{httpStatus:200},{contentRange:'bytes 0-63/*'},
    {contentRange:'bytes 0-63/23575945'},{contentLength:65},{contentType:'text/plain'}]){
   expect(await verifySpatialRangeReceipt(frame,{...r,...mutation},bytes))
    .toEqual({ok:false,reason:'response-range-metadata-mismatch'});
  }
 });
 it('caps file/range bounds and enforces header/trailer offsets',async()=>{
  for(const mutation of [{start:-1},{start:64,end:63},{totalBytes:300000000},{end:23575944}]){
   expect(await verifySpatialRangeReceipt(frame,{...await receipt(),...mutation},bytes))
    .toEqual({ok:false,reason:'invalid-or-oversized-byte-range'});
  }
  expect(await verifySpatialRangeReceipt(frame,{...await receipt(),start:1,end:64,
    contentRange:'bytes 1-64/23575944'},bytes))
   .toEqual({ok:false,reason:'invalid-header-range'});
 });
 it('requires canonical capture time inside source retention window',async()=>{
  for(const capturedUtc of ['2026-11-09T05:00:00Z','2026-11-17T08:00:00Z',
    '2026-11-09T25:00:00Z','2026-11-09T08:00:00+01:00']){
   expect(await verifySpatialRangeReceipt(frame,{...await receipt(),capturedUtc},bytes))
    .toEqual({ok:false,reason:'unqualified-capture-time'});
  }
 });
 it('rejects unavailable frames and receipts without actual bytes',async()=>{
  expect(await verifySpatialRangeReceipt({status:'unavailable',reason:'NoData'},await receipt(),bytes))
   .toEqual({ok:false,reason:'frame-unqualified'});
  expect(await verifySpatialRangeReceipt(frame,null,bytes))
   .toEqual({ok:false,reason:'invalid-receipt'});
 });
});
