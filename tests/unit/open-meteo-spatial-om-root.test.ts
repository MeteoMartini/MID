import {describe,expect,it} from 'vitest';
import {inspectOmRootIndexResponse,planOmRootIndexProbe,verifyOmTrailerResponse,planOmArrayDescriptorProbe,inspectOmArrayDescriptorResponse} from '../../src/openMeteoSpatialByteRange';
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
   variables:['cape','precipitation','snowfall_water_equivalent','geopotential_height_500hPa'],
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
  expect(spatialFrameCandidate(result.manifest,'geopotential_height_500hPa',raw.valid_times[1]).status).toBe('manifest-only');
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


describe('OM-v3 bounded array descriptor metadata (synthetic only)',()=>{
 const originalD2TrailerLocal=parseHex('4f4d03000000000048b76701000000002806000000000000');
 const candidate={
  status:'manifest-only' as const,model:'dwd_icon_d2' as const,
  referenceTime:'2026-11-09T06:00Z',validTime:'2026-11-09T07:00Z',
  variable:'geopotential_height_500hPa',accumulationHours:null,
 };
 const makeDescriptor=(field='geopotential_height_500hPa_extra')=>{
  // Format-layout fixture: length 104, numeric float-array (20), two
  // dimensions, 32-byte name. Not an original model cell/field descriptor.
  if(field.length!==32)throw Error('fixture must have 32-byte name');
  const a=new Uint8Array(104),v=new DataView(a.buffer);
  v.setUint8(0,20);v.setUint8(1,0);
  v.setUint16(2,field.length,true);v.setUint32(4,0,true);
  v.setBigUint64(8,32n,true);v.setBigUint64(16,4n,true);
  v.setBigUint64(24,2n,true);
  v.setFloat32(32,1,true);v.setFloat32(36,0,true);
  v.setBigUint64(40,3n,true);v.setBigUint64(48,4n,true);
  v.setBigUint64(56,2n,true);v.setBigUint64(64,2n,true);
  for(let i=0;i<field.length;i++)a[72+i]=field.charCodeAt(i);
  return a;
 };
 const context=async()=>{
  const trailer=await verifyOmTrailerResponse(
    rangeResponse(originalD2TrailerLocal,'bytes 23575920-23575943/23575944'));
  const rootPlan=planOmRootIndexProbe(candidate,trailer);
  if(!rootPlan.ok)throw Error(rootPlan.reason);
  const root=await inspectOmRootIndexResponse(
    rangeResponse(makeRootFixture(98),'bytes 23574344-23575919/23575944'),rootPlan.probe);
  if(!root.ok)throw Error(root.reason);
  const planned=planOmArrayDescriptorProbe(rootPlan.probe,root,0);
  if(!planned.ok)throw Error(planned.reason);
  return {planned,root,rootPlan};
 };
 it('plans only previously checked child-metadata spans on fixed source origin',async()=>{
  const {planned,root,rootPlan}=await context();
  expect(planned.probe.url).toBe(
    'https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2/2026/11/09/0600Z/2026-11-09T0700.om');
  expect(planned.probe.range).toBe('bytes=100-203');
  expect(planOmArrayDescriptorProbe(rootPlan.probe,root,98))
   .toEqual({ok:false,reason:'unverified-root-or-child'});
  expect(planOmArrayDescriptorProbe({...rootPlan.probe,url:'https://evil.invalid/a.om'},root,0))
   .toEqual({ok:false,reason:'unverified-root-or-child'});
  expect(planOmArrayDescriptorProbe(rootPlan.probe,{ok:false,reason:'bad'},0))
   .toEqual({ok:false,reason:'unverified-root-or-child'});
 });
 it('validates a synthetic numerical descriptor and preserves pixelValidated=false',async()=>{
  const {planned}=await context();
  const resp=rangeResponse(makeDescriptor(),'bytes 100-203/23575944');
  const out=await inspectOmArrayDescriptorResponse(resp,planned.probe);
  expect(out.ok).toBe(true);
  if(out.ok)expect(out.descriptor).toMatchObject({
   status:'descriptor-verified',
   name:'geopotential_height_500hPa_extra',dataTypeId:20,
   compressionId:0,dimensions:[3,4],chunks:[2,2],
   scaleFactor:1,addOffset:0,lutOffset:4,lutLength:32,
   pixelValidated:false,
  });
 });
 it('rejects 200/full-file responses before reading and rejects malformed ranges',async()=>{
  const {planned}=await context();
  let readCalled=false;
  const ignored=await inspectOmArrayDescriptorResponse({
   status:200,headers:new Headers(),arrayBuffer:async()=>{
    readCalled=true;return new ArrayBuffer(0);
   },
  },planned.probe);
  expect(ignored).toEqual({ok:false,reason:'range-not-honored'});
  expect(readCalled).toBe(false);
  expect(await inspectOmArrayDescriptorResponse(
    rangeResponse(makeDescriptor(),'bytes 0-103/23575944'),planned.probe))
   .toEqual({ok:false,reason:'invalid-or-unexposed-content-range'});
  expect(await inspectOmArrayDescriptorResponse(
    rangeResponse(makeDescriptor().slice(0,10),'bytes 100-203/23575944',{
     'content-length':'104',
    }),planned.probe))
   .toEqual({ok:false,reason:'wrong-range-length'});
 });
 it('fails closed on array type, codec, dimensions, index, packing and field name',async()=>{
  const {planned}=await context();
  const mutated=(fn:(v:DataView,b:Uint8Array)=>void)=>{
   const bytes=makeDescriptor();fn(new DataView(bytes.buffer),bytes);
   return rangeResponse(bytes,'bytes 100-203/23575944');
  };
  const cases:[Pick<Response,'status'|'headers'|'arrayBuffer'>,string][]=[
   [mutated(v=>v.setUint8(0,0)),'not-numeric-array'],
   [mutated(v=>v.setUint8(1,8)),'unknown-array-compression'],
   [mutated(v=>v.setUint16(2,255,true)),'invalid-array-metadata-shape'],
   [mutated(v=>v.setBigUint64(24,0n,true)),'invalid-array-metadata-shape'],
   [mutated(v=>v.setFloat32(32,NaN,true)),'invalid-array-packing-coefficients'],
   [mutated(v=>v.setBigUint64(16,200n,true)),'invalid-chunk-index-bounds'],
   [mutated(v=>v.setBigUint64(40,0n,true)),'invalid-array-grid-or-chunk-shape'],
   [mutated(v=>v.setBigUint64(56,10n,true)),'invalid-array-grid-or-chunk-shape'],
   [mutated((_v,b)=>{b[78]=47;}) ,'invalid-array-field-name'],
  ];
  for(const [response,reason] of cases){
   const x=await inspectOmArrayDescriptorResponse(response,planned.probe);
   expect(x).toEqual({ok:false,reason});
  }
 });
});


describe('real original OM-v3 cloud-cover descriptors (historical immutable evidence)',()=>{
 const captures=[
  {
   model:'dwd_icon_d2',valid:'2026-11-09T0700.om',
   uri:'https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2/2026/11/09/0600Z/2026-11-09T0700.om',
   total:23575944, rootOffset:23574344,
   childOffset:23561712,childLength:104,grid:[746,1215],
   lutOffset:23449648,lutLength:1185,
   hex:'1400100001000000a10400000000000030d065010000000002000000000000000000803f000000001500000000000000d885670100000000ea02000000000000bf0400000000000020000000000000002000000000000000636c6f75645f636f7665725f68696768',
  },
  {
   model:'dwd_icon_eu',valid:'2026-11-09T0700.om',
   uri:'https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_eu/2026/11/09/0300Z/2026-11-09T0700.om',
   total:33758848,rootOffset:33756800,
   childOffset:33740296,childLength:104,grid:[657,1377],
   lutOffset:33594321,lutLength:1245,
   hex:'1400100001000000dd04000000000000d19b00020000000002000000000000000000803f000000001500000000000000f0d50202000000009102000000000000610500000000000020000000000000002000000000000000636c6f75645f636f7665725f68696768',
  },
 ] as const;
 it('decodes two ORIGINAL S3 field descriptors, still never claims raster-pixel QA',async()=>{
  for(const capture of captures){
   const bytes=parseHex(capture.hex);
   expect(bytes.byteLength).toBe(capture.childLength);
   const probe={
    status:'planned-descriptor-only' as const,
    url:capture.uri,
    range:'bytes='+capture.childOffset+'-'+(capture.childOffset+capture.childLength-1),
    metadataOffset:capture.childOffset,
    metadataLength:capture.childLength,
    rootOffset:capture.rootOffset,
    totalBytes:capture.total,
   };
   const response=rangeResponse(bytes,
    'bytes '+capture.childOffset+'-'+(capture.childOffset+capture.childLength-1)+'/'+capture.total);
   const result=await inspectOmArrayDescriptorResponse(response,probe);
   expect(result.ok).toBe(true);
   if(!result.ok)throw Error(capture.model+': '+result.reason);
   expect(result.descriptor).toMatchObject({
    status:'descriptor-verified',
    name:'cloud_cover_high',dataTypeId:20,compressionId:0,
    dimensions:[...capture.grid],chunks:[32,32],
    scaleFactor:1,addOffset:0,
    lutOffset:capture.lutOffset,lutLength:capture.lutLength,pixelValidated:false,
   });
  }
 });

 it('does not reuse EU04 root/trailer offsets for EU07 despite the same model run',async()=>{
  // Two genuine snapshots from the SAME run have different total file sizes
  // and root offsets. Each file MUST be independently range-validated.
  const eu04={
   status:'planned-descriptor-only' as const,
   url:'https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_eu/2026/11/09/0300Z/2026-11-09T0400.om',
   metadataOffset:33740296,metadataLength:104,rootOffset:32901848,
   totalBytes:32903896,range:'bytes=33740296-33740399',
  };
  const validEu07=captures[1];
  const response=rangeResponse(parseHex(validEu07.hex),
   'bytes 33740296-33740399/33758848');
  expect(await inspectOmArrayDescriptorResponse(response,eu04))
   .toEqual({ok:false,reason:'invalid-descriptor-plan'});
  // Source-datetime-specific trailer is therefore mandatory; the 07Z
  // descriptor is not a substitute for any 04Z model-file readback.
 });
});
