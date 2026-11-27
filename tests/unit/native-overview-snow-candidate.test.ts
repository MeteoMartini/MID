import {describe,expect,it,vi} from 'vitest';
import type {NativeField,NativeIndex} from '../../src/nativeModelFields';
const evidence=vi.hoisted(()=>new WeakMap<object,string>());
vi.mock('../../src/nativeModelFields',async(importOriginal)=>{
 const actual=await importOriginal<typeof import('../../src/nativeModelFields')>();
 return {...actual,nativeVerifiedFrameIdentity:(field:object)=>evidence.get(field)};
});
import {nativeFrameIdentity} from '../../src/nativeModelFields';
import {nativeOverviewPlan,prepareNativeOverview,nativeOverviewCell} from '../../src/nativeOverviewFrame';
import {dwdSnowIntervalSwe,geometricSnowDepthCm,type SnowSourceField} from '../../src/nativeSnowMapValues';
const run='2026-11-27T00:00:00Z',time='2026-11-27T01:00:00Z';
const specs=[['cloud','%',20],['precipitation','mm/1 h',0],['pressure','hPa',1010],['temperature','°C',-2],['sigwx','WMO',71]] as const;
function fixture(){
 const index:NativeIndex={schema:'mid.icon-d2.fields.v1',run,products:{}};
 const fields:NativeField[]=specs.map(([kind,unit,value],i)=>{
  const ref={hour:1,time,file:kind+'.json',sha256:String(i+1).repeat(64),bytes:100,intervalHours:kind==='precipitation'?1:0};
  index.products[kind]={unit,frames:[ref]};
  const field:NativeField={schema:'mid.icon-d2.field.v1',kind,unit,run,time,scale:.1,lats:[50,51],lons:[7,8],values:[value*10,value*10,NaN,value*10],isobars:[]};
  evidence.set(field,nativeFrameIdentity(index,ref,kind));return field;
 });
 return {index,fields};
}
describe('original overview core – candidate, no UI admission',()=>{
 it('requires all five exact original identities and preserves values and arrays',()=>{
  const {index,fields}=fixture(),frame=prepareNativeOverview(index,time,fields)!;
  expect(frame.cloud).toBe(fields[0]);expect(frame.precipitation.values).toBe(fields[1].values);
  expect(nativeOverviewCell(frame,0)).toMatchObject({cloud:20,precipitation:0,pressure:1010,temperature:-2,weatherCode:71,time,model:'icon-d2'});
  expect(nativeOverviewCell(frame,2)).toBeNull();expect(nativeOverviewCell(frame,-1)).toBeNull();
  expect(nativeOverviewCell(frame,4)).toBeNull();
 });
 it('rejects stale/duplicate/missing refs, unsupported RUC and wrong interval',()=>{
  const {index,fields}=fixture();
  expect(nativeOverviewPlan({...index,schema:'mid.ruc.map-fields.v1',modelId:'icon-d2-ruc'},time)).toBeNull();
  expect(nativeOverviewPlan({...index,schema:'mid.icon-d2.native-fields.v2'},time)).toBeNull();
  expect(prepareNativeOverview(index,time,fields.slice(0,4))).toBeNull();
  const temp=index.products.temperature!;
  expect(nativeOverviewPlan({...index,products:{...index.products,temperature:{...temp,frames:[...temp.frames,...temp.frames]}}},time)).toBeNull();
  expect(nativeOverviewPlan(index,'2026-11-27T02:00:00Z')).toBeNull();
  index.products.precipitation!.frames[0].intervalHours=0;
  expect(nativeOverviewPlan(index,time)).toBeNull();
 });
 it('rejects an unverified clone, wrong grid and disjoint masks',()=>{
  const {index,fields}=fixture();
  expect(prepareNativeOverview(index,time,[...fields.slice(0,4),{...fields[4]}])).toBeNull();
  fields[4].lons=[7,9];expect(prepareNativeOverview(index,time,fields)).toBeNull();
  fields[4].lons=[7,8];fields[4].values=[NaN,NaN,71,NaN];
  expect(prepareNativeOverview(index,time,fields)).toBeNull();
 });
});
const end='2026-11-27T03:00:00Z';
function snow(model:SnowSourceField['model']='icon-d2'){
 const mk=(parameter:SnowSourceField['parameter'],t:string,hash:string,values:number[]):SnowSourceField=>({model,run,time:t,startTime:run,parameter,unit:'kg/m²',gridSha256:'a'.repeat(64),sourceSha256:hash.repeat(64),values:Float64Array.from(values)});
 return [mk('snow_gsp',time,'1',[2,0,NaN,10]),mk('snow_gsp',end,'2',[4,0,3,13]),mk('snow_con',time,'3',[1,0,0,1]),mk('snow_con',end,'4',[2,0,2,4])] as const;
}
describe('isolated original DWD snow arithmetic',()=>{
 it.each(['icon-d2','icon-eu','icon'] as const)('keeps interval SWE and true zero for %s',model=>{
  const f=snow(model),result=dwdSnowIntervalSwe(...f);
  expect(Array.from(result.values)).toEqual([3,0,NaN,6]);
  expect(result).toMatchObject({model,run,start:time,end,unit:'mm SWE'});
  expect(f[0].values[0]).toBe(2);
 });
 it('rejects reset even when another component grows or is missing',()=>{
  const f=snow();f[1].values[0]=1;f[3].values[0]=20;
  expect(()=>dwdSnowIntervalSwe(...f)).toThrow('negative Differenz');
  f[2].values[0]=NaN;expect(()=>dwdSnowIntervalSwe(...f)).toThrow('negative Differenz');
 });
 it('rejects different model/grid/units, invalid values and duplicate source identity',()=>{
  const f=snow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],model:'icon'},f[2],f[3])).toThrow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],gridSha256:'b'.repeat(64)},f[2],f[3])).toThrow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],unit:'m'},f[2],f[3])).toThrow();
  expect(()=>dwdSnowIntervalSwe(f[0],{...f[1],sourceSha256:f[0].sourceSha256},f[2],f[3])).toThrow();
  f[1].values[0]=Infinity;expect(()=>dwdSnowIntervalSwe(...f)).toThrow();
 });
 it('converts only geometric depth, preserving small values and missing',()=>{
  const f=snow()[0],depth:SnowSourceField={...f,parameter:'h_snow',unit:'m',startTime:f.time,values:Float64Array.from([0,.004,.12345,NaN])};
  expect(Array.from(geometricSnowDepthCm(depth))).toEqual([0,.4,12.345,NaN]);
  expect(()=>geometricSnowDepthCm(f)).toThrow();
 });
});
