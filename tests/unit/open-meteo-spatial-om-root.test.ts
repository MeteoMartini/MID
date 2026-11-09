import {describe,expect,it} from 'vitest';
import {inspectOmRootIndexResponse,planOmRootIndexProbe,verifyOmTrailerResponse} from '../../src/openMeteoSpatialByteRange';
import {qualifySpatialManifest,spatialFrameCandidate} from '../../src/openMeteoSpatialManifest';
import type {OmRootIndexProbe} from '../../src/openMeteoSpatialByteRange';

const parseHex = (hex:string):Uint8Array =>
  Uint8Array.from(hex.match(/.{2}/g)??[],pair=>Number.parseInt(pair,16));
const originalD2Trailer = parseHex('4f4d03000000000048b76701000000002806000000000000');
const originalEuTrailer = parseHex('4f4d030000000000d80af60100000000e807000000000000');

function rangeResponse(
 bytes:Uint8Array, contentRange:string, overrides:Record<string,string>={},
 status=206,
):Pick<Response,'status'|'headers'|'arrayBuffer'>{
 const headers=new Headers({
  'content-range':contentRange,
  'content-length':String(bytes.byteLength),
  'content-type':'application/octet-stream',
  ...overrides,
 });
 return {status,headers,arrayBuffer:async()=>Uint8Array.from(bytes).buffer as ArrayBuffer};
}

function makeRootFixture(childCount:number,firstSize=104):Uint8Array{
 const out=new Uint8Array(8+16*childCount);
 const view=new DataView(out.buffer);
 view.setUint8(0,0); // root is a container, not a decoded array
 view.setUint8(1,4);
 view.setUint32(4,childCount,true);
 for(let i=0;i<childCount;i++){
  view.setBigUint64(8+i*8,BigInt(i===0?firstSize:103),true);
  view.setBigUint64(8+childCount*8+i*8,BigInt(100+200*i),true);
 }
 return out;
}

describe('Open-Meteo spatial OM-v3 metadata-only safety gates',()=>{
 it('does not confuse declared model fields with decoded pixels or fabricate first-run precipitation',()=>{
  const raw={
   completed:true,
   reference_time:'2026-11-09T06:00:00Z',
   last_modified_time:'2026-11-09T07:22:54Z',
   valid_times:['2026-11-09T06:00Z','2026-11-09T07:00Z'],
   variables:['cape','precipitation','snowfall_water_equivalent'],
  };
  const result=qualifySpatialManifest(raw,'dwd_icon_d2');
  expect(result.ok).toBe(true);
  if(!result.ok)throw Error(result.reason);
  const first=spatialFrameCandidate(result.manifest,'precipitation',raw.valid_times[0]);
  expect(first).toEqual({status:'unavailable',reason:'initial-accumulation-unavailable'});
  const second=spatialFrameCandidate(result.manifest,'precipitation',raw.valid_times[1]);
  expect(second.status).toBe('manifest-only');
  if(second.status==='manifest-only')expect(second.accumulationHours).toBe(1);
  expect(result.manifest.status).toBe('manifest-only');
 });

 it('checks real D2 and EU trailer pointer evidence with explicit non-pixel status',async()=>{
  const d2=await verifyOmTrailerResponse(rangeResponse(originalD2Trailer,'bytes 23575920-23575943/23575944'));
  const eu=await verifyOmTrailerResponse(rangeResponse(originalEuTrailer,'bytes 32903872-32903895/32903896'));
  expect(d2).toMatchObject({ok:true,totalBytes:23575944,metadataOffset:23574344,metadataLength:1576,pixelValidated:false});
  expect(eu).toMatchObject({ok:true,totalBytes:32903896,metadataOffset:32901848,metadataLength:2024,pixelValidated:false});
 });

 it('validates D2 root-index bounds using only original prefix and SYNTHETIC child references',async()=>{
  const trailer=await verifyOmTrailerResponse(rangeResponse(originalD2Trailer,'bytes 23575920-23575943/23575944'));
  const candidate={
   status:'manifest-only' as const,model:'dwd_icon_d2' as const,
   referenceTime:'2026-11-09T06:00Z',validTime:'2026-11-09T07:00Z',
   variable:'cape',accumulationHours:null,
  };
  const planned=planOmRootIndexProbe(candidate,trailer);
  expect(planned.ok).toBe(true);
  if(!planned.ok)throw Error(planned.reason);
  expect(planned.probe.url).toBe('https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2/2026/11/09/0600Z/2026-11-09T0700.om');
  expect(planned.probe.range).toBe('bytes=23574344-23575919');
  const bytes=makeRootFixture(98);
  expect([...bytes.slice(0,16)]).toEqual([...parseHex('00040000620000006800000000000000')]);
  const actual=await inspectOmRootIndexResponse(rangeResponse(bytes,'bytes 23574344-23575919/23575944'),planned.probe);
  expect(actual.ok).toBe(true);
  if(actual.ok){
   expect(actual.childCount).toBe(98);
   expect(actual.children).toHaveLength(98);
   expect(actual.pixelValidated).toBe(false);
  }
 });

 it('retains the independently observed EU root shape without asserting a real root decode',async()=>{
  const trailer=await verifyOmTrailerResponse(rangeResponse(originalEuTrailer,'bytes 32903872-32903895/32903896'));
  const candidate={
   status:'manifest-only' as const,model:'dwd_icon_eu' as const,
   referenceTime:'2026-11-09T03:00Z',validTime:'2026-11-09T04:00Z',
   variable:'cape',accumulationHours:null,
  };
  const planned=planOmRootIndexProbe(candidate,trailer);
  expect(planned.ok).toBe(true);
  if(!planned.ok)throw Error(planned.reason);
  const bytes=makeRootFixture(126,108);
  expect([...bytes.slice(0,8)]).toEqual([...parseHex('000400007e000000')]);
  const verified=await inspectOmRootIndexResponse(rangeResponse(bytes,'bytes 32901848-32903871/32903896'),planned.probe);
  expect(verified.ok).toBe(true);
  if(verified.ok)expect(verified.childCount).toBe(126);
 });

 it('rejects full responses before reading the body; bad bounds and overlap fail closed',async()=>{
  const trailer=await verifyOmTrailerResponse(rangeResponse(originalD2Trailer,'bytes 23575920-23575943/23575944'));
  const candidate={
   status:'manifest-only' as const,model:'dwd_icon_d2' as const,
   referenceTime:'2026-11-09T06:00Z',validTime:'2026-11-09T07:00Z',
   variable:'cape',accumulationHours:null,
  };
  const planned=planOmRootIndexProbe(candidate,trailer);
  if(!planned.ok)throw Error(planned.reason);
  let readCalled=false;
  const denied=await inspectOmRootIndexResponse({
   status:200,headers:new Headers(),arrayBuffer:async()=>{
    readCalled=true;return new ArrayBuffer(0);
   },
  },planned.probe);
  expect(denied).toEqual({ok:false,reason:'range-not-honored'});
  expect(readCalled).toBe(false);
  const root=makeRootFixture(98);
  expect(await inspectOmRootIndexResponse(rangeResponse(root,'bytes 0-1575/23575944'),planned.probe))
   .toEqual({ok:false,reason:'invalid-or-unexposed-content-range'});
  const broken=Uint8Array.from(root);
  new DataView(broken.buffer).setBigUint64(8+98*8+8,150n,true);
  expect(await inspectOmRootIndexResponse(rangeResponse(broken,'bytes 23574344-23575919/23575944'),planned.probe))
   .toEqual({ok:false,reason:'overlapping-child-metadata'});
  const forged={...planned.probe,metadataLength:23575944} as OmRootIndexProbe;
  expect(await inspectOmRootIndexResponse(rangeResponse(root,'bytes 23574344-23575919/23575944'),forged))
   .toEqual({ok:false,reason:'invalid-root-index-plan'});
 });
});
