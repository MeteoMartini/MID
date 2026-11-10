import {describe,expect,it} from 'vitest';
import {captureSpatialEvidence} from '../../src/openMeteoSpatialEvidenceCapture';
import {verifySpatialRangeReceipt} from '../../src/openMeteoSpatialRangeProof';
import type {FrameResult} from '../../src/openMeteoSpatialManifest';

const frame:FrameResult={status:'manifest-only',model:'dwd_icon_eu',
 referenceTime:'2026-11-09T03:00:00Z',validTime:'2026-11-09T04:00:00Z',
 variable:'temperature_2m',accumulationHours:null};
const payload=Uint8Array.from(Array.from({length:64},(_,i)=>i));
payload.set([0x4f,0x4d,0x03],0);
const response=(data=payload,status=206,range='bytes 0-63/300000')=>({
 status,headers:new Headers({'content-range':range,'content-length':String(data.length),
  'content-type':'application/octet-stream'}),
 arrayBuffer:async()=>Uint8Array.from(data).buffer,
});
describe('MID spatial research HTTP range capture',()=>{
 it('captures actual bytes and a replayable receipt, never a publication permit',async()=>{
  const result=await captureSpatialEvidence(frame,'header',response(),'2026-11-09T05:00:00Z');
  expect(result.ok).toBe(true);
  if(result.ok){
   expect(result.receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
   expect(result.bytes).toEqual(payload);
   expect(result.receipt.file).toBe('dwd_icon_eu/2026/11/09/0300Z/2026-11-09T0400.om');
   expect(result.publicationApproved).toBe(false);
   expect((await verifySpatialRangeReceipt(frame,result.receipt,result.bytes)).ok).toBe(true);
  }
 });
 it('rejects HTTP-200 fallback before reading an unbounded body',async()=>{
  let reads=0;
  const r={...response(payload,200),arrayBuffer:async()=>{reads++;return payload.buffer}};
  expect(await captureSpatialEvidence(frame,'header',r,'2026-11-09T05:00:00Z'))
   .toEqual({ok:false,reason:'range-not-honored'});
  expect(reads).toBe(0);
 });
 it('rejects inconsistent range metadata and byte lengths',async()=>{
  expect(await captureSpatialEvidence(frame,'header',response(payload,206,'bytes 1-64/300000'),'2026-11-09T05:00:00Z'))
   .toEqual({ok:false,reason:'unqualified-range'});
  const truncated=payload.slice(0,63);
  expect(await captureSpatialEvidence(frame,'header',response(truncated),'2026-11-09T05:00:00Z'))
   .toEqual({ok:false,reason:'invalid-response-headers'});
  const corrupted=payload.slice();corrupted[0]=0;
  expect(await captureSpatialEvidence(frame,'header',response(corrupted),'2026-11-09T05:00:00Z'))
   .toEqual({ok:false,reason:'invalid-om-boundary-magic'});
 });
 it('rejects noncanonical, backdated and expired capture timestamps',async()=>{
  for(const date of ['2026-11-09T02:00:00Z','2026-11-18T05:00:00Z','2026-11-09T05:00:00+00:00']){
   expect(await captureSpatialEvidence(frame,'header',response(),date))
    .toEqual({ok:false,reason:'unqualified-capture-time'});
  }
 });
});
