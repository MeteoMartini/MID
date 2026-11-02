import {describe,expect,it} from 'vitest';
import {D2_FULL_DOMAIN_KINDS,D2_FULL_DOMAIN_LEADS,validateD2FullDomainIndex,validateD2FullDomainField,verifyNativeD2IndexTransport} from '../../src/nativeD2FullDomain';
import {createHash} from 'node:crypto';
import {nativeAt,nativeMapScale} from '../../src/nativeModelFields';
import type {NativeFieldKind} from '../../src/nativeModelFields';
const run='2026-11-02T03:00:00+00:00',now=Date.parse('2026-11-02T12:00:00Z');
const sha='a'.repeat(64);
const products=Object.fromEntries(D2_FULL_DOMAIN_KINDS.map((kind:NativeFieldKind)=>[kind,{
 unit:({temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',thetae:'K',sigwx:'WMO',precipitation:'mm/1 h'} as Record<NativeFieldKind,string>)[kind],
 frames:D2_FULL_DOMAIN_LEADS.map(h=>({hour:h,time:new Date(Date.parse(run)+h*3600000).toISOString(),
 file:kind+'-'+String(h).padStart(3,'0')+'.bin',sha256:sha,bytes:9000,decodedBytes:200000,
 encoding:'gzip-json',intervalHours:kind==='precipitation'?1:0}))
}]));
const index={schema:'mid.icon-d2.native-fields.v2',productionApproved:true,modelId:'icon-d2',
 sampling:'nearest-native-cell',nativePoints:542040,sourceInventorySha256:sha,run,products};
describe('D2 full 542040-cell source client admission',()=>{
 it('SHA-binds the native index bytes to the actual approved RUC Pages pointer',async()=>{
  const binary=new TextEncoder().encode(JSON.stringify(index));
  const bytes=binary.buffer as ArrayBuffer;
  const indexSha256=createHash('sha256').update(binary).digest('hex');
  const pointer={indexSha256,indexBytes:binary.byteLength};
  await expect(verifyNativeD2IndexTransport(bytes,pointer)).resolves.toBeUndefined();
  await expect(verifyNativeD2IndexTransport(bytes,{...pointer,indexBytes:binary.byteLength+1})).rejects.toThrow(/index bytes/);
  await expect(verifyNativeD2IndexTransport(bytes,{...pointer,indexSha256:'a'.repeat(64)})).rejects.toThrow(/SHA256/);
  await expect(verifyNativeD2IndexTransport(bytes,{indexSha256,indexBytes:undefined})).rejects.toThrow(/index bytes/);
  const modified=new TextEncoder().encode(JSON.stringify({...index,productionApproved:false}));
  await expect(verifyNativeD2IndexTransport(modified.buffer as ArrayBuffer,pointer)).rejects.toThrow();
 });

 it('admits only a full 9 × 8 attested native original axis',()=>{
  expect(validateD2FullDomainIndex(index,now).products.precipitation?.frames).toHaveLength(9);
 });
 it('rejects missing fields, repeated leads and stale forecasts',()=>{
  expect(()=>validateD2FullDomainIndex({...index,products:{temperature:products.temperature}},now)).toThrow();
  const broken={...products,pressure:{...(products.pressure as object),frames:[...(products.pressure as {frames:any[]}).frames.slice(0,8),(products.pressure as {frames:any[]}).frames[0]]}};
  expect(()=>validateD2FullDomainIndex({...index,products:broken},now)).toThrow();
  expect(()=>validateD2FullDomainIndex(index,Date.parse('2026-11-05T12:00:00Z'))).toThrow();
 });
 it('does not accept pilot-only transport or false SHA provenance',()=>{
  expect(()=>validateD2FullDomainIndex({...index,productionApproved:false},now)).toThrow();
  expect(()=>validateD2FullDomainIndex({...index,sourceInventorySha256:'source'},now)).toThrow();
 });
 it('preserves missing and true zero without inferring a dry hour',()=>{
  const ix=validateD2FullDomainIndex(index,now),h=ix.products.precipitation!.frames[0];
  const lats=Array.from({length:470},(_,i)=>44+i*.025);
  const lons=Array.from({length:805},(_,i)=>0+i*.025);
  const values=new Array<number|null>(lats.length*lons.length).fill(5);
  values[0]=0;values[1]=null;
  const field={schema:'mid.icon-d2.native-field.v2',productionApproved:true,
   modelId:'icon-d2',sampling:'nearest-native-cell',sourceInventorySha256:sha,
   nativePoints:542040,run,time:h.time,leadHours:1,kind:'precipitation',unit:'mm/1 h',
   scale:.1,lats,lons,values,isobars:[],centers:[],negativePackingUncertainNoDataCells:1};
  const out=validateD2FullDomainField(field,ix,h,'precipitation');
  expect(out.values[0]).toBe(0);expect(Number.isNaN(out.values[1])).toBe(true);
  expect(out.values[2]).toBe(5);
  expect(nativeAt(out,lats[0],lons[0])).toBe(0);
  expect(nativeAt(out,lats[0],lons[1])).toBeNull();
  expect(nativeAt(out,lats[0],lons[2])).toBe(.5);
  expect(nativeAt(out,70,20)).toBeNull();
  expect(nativeMapScale(out,'absolute')).toBeDefined();
  expect(()=>validateD2FullDomainField({...field,negativePackingUncertainNoDataCells:2},ix,h,'precipitation')).toThrow(/packing-uncertainty/);
  // A forged index cannot claim more uncertainty-masked pixels than actual nulls.
  expect(()=>validateD2FullDomainField({...field,values:values.map(v=>v===null?0:v)},ix,h,'precipitation')).toThrow(/packing-uncertainty/);
  expect(()=>validateD2FullDomainField({...field,productionApproved:false},ix,h,'precipitation')).toThrow();
  expect(()=>validateD2FullDomainField({...field,lats:[47,47.025,47.05]},ix,h,'precipitation')).toThrow();
 });
});
