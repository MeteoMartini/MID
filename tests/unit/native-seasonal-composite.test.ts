import {describe,expect,it} from 'vitest';
import {seasonalMapKinds,seasonalMapFrames,seasonalPairValid,seasonalMaskedPrimary,seasonalMaskedSecondary} from '../../src/nativeSeasonalComposite';
import type {NativeField,NativeIndex,NativeFrameRef} from '../../src/nativeModelFields';
import {D2_FULL_DOMAIN_LEADS,D2_FULL_DOMAIN_KINDS,validateD2FullDomainIndex} from '../../src/nativeD2FullDomain';
const time='2026-11-09T07:00:00Z',run='2026-11-09T06:00:00Z';
const frame=(t=time,intervalHours=1):NativeFrameRef=>({hour:1,time:t,file:'precipitation-001.json',sha256:'a'.repeat(64),bytes:500,intervalHours});
const makeIndex=():NativeIndex=>({schema:'mid.icon-d2.fields.v1',run,products:{
 precipitation:{unit:'mm/1 h',frames:[frame()]},
 temperature:{unit:'°C',frames:[frame(time,0)]},
 gust:{unit:'km/h',frames:[frame(time,0)]},
}});
const field=(kind:NativeField['kind'],values:number[]=[0,1,NaN,2]):NativeField=>({
 schema:'mid.icon-d2.field.v1',run,time,kind,unit:kind==='temperature'?'°C':kind==='gust'?'km/h':'mm/1 h',
 scale:1,lats:[50,50.1],lons:[7,7.1],values,isobars:[],
});
describe('DWD ICON-D2 seasonal composites: fail-closed common native fields',()=>{
 it('binds each composite to its named original fields and 1h accumulation',()=>{
  expect(seasonalMapKinds('winter-berge')).toEqual({primary:'precipitation',secondary:'temperature'});
  expect(seasonalMapKinds('sommer-gewitter')).toEqual({primary:'precipitation',secondary:'gust'});
  expect(seasonalMapKinds('unknown')).toBeNull();
  expect(seasonalMapFrames(makeIndex(),'winter-berge')).toHaveLength(1);
  expect(seasonalMapFrames(makeIndex(),'sommer-gewitter')).toHaveLength(1);
  const native=makeIndex();native.schema='mid.icon-d2.native-fields.v2';
  expect(seasonalMapFrames(native,'winter-berge')).toHaveLength(1);
  expect(seasonalMapFrames(native,'sommer-gewitter')).toHaveLength(1);
  native.products.temperature!.frames=[frame(time,-1)];
  expect(seasonalMapFrames(native,'winter-berge')).toHaveLength(0);
  const i=makeIndex();i.products.precipitation!.frames=[frame(time,3)];
  expect(seasonalMapFrames(i,'winter-berge')).toHaveLength(0);
 });
 it('accepts the actually validated full-domain v2 index with zero-hour companions',()=>{
  const units={temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',thetae:'K',sigwx:'WMO',precipitation:'mm/1 h'} as const;
  const products=Object.fromEntries(D2_FULL_DOMAIN_KINDS.map(kind=>[kind,{
   unit:units[kind],
   frames:D2_FULL_DOMAIN_LEADS.map(hour=>({
    hour,time:new Date(Date.parse(run)+hour*3600_000).toISOString(),
    file:`${kind}-${String(hour).padStart(3,'0')}.bin`,
    sha256:'a'.repeat(64),bytes:500,encoding:'gzip-json',decodedBytes:500,
    intervalHours:kind==='precipitation'?1:0,
   })),
  }]));
  const v2=validateD2FullDomainIndex({
   schema:'mid.icon-d2.native-fields.v2',productionApproved:true,modelId:'icon-d2',
   sampling:'nearest-native-cell',nativePoints:542040,sourceInventorySha256:'b'.repeat(64),
   run,products,
  },Date.parse(run));
  expect(seasonalMapFrames(v2,'winter-berge')).toHaveLength(9);
  expect(seasonalMapFrames(v2,'sommer-gewitter')).toHaveLength(9);
  const invalid={...v2,products:{...v2.products,gust:{
   ...v2.products.gust!,frames:v2.products.gust!.frames.map((f,i)=>i===0?{...f,intervalHours:1}:f),
  }}};
  expect(()=>validateD2FullDomainIndex(invalid,Date.parse(run))).toThrow('original frame');
 });
 it('does not advertise a composite lacking a shared valid time, field or source unit',()=>{
  const i=makeIndex();i.products.temperature!.frames=[frame('2026-11-09T08:00:00Z')];
  expect(seasonalMapFrames(i,'winter-berge')).toEqual([]);
  expect(seasonalMapFrames(i,'sommer-gewitter')).toHaveLength(1);
  i.products.gust!.unit='kt';expect(seasonalMapFrames(i,'sommer-gewitter')).toEqual([]);
  i.schema='mid.ruc.map-fields.v1';expect(seasonalMapFrames(i,'winter-berge')).toEqual([]);
 });
 it('never pairs different model runs, times, model IDs, shapes or geolocation',()=>{
  const p=field('precipitation'),t=field('temperature');
  expect(seasonalPairValid('winter-berge',p,t,time)).toBe(true);
  expect(seasonalPairValid('winter-berge',p,{...t,run:'2026-11-09T03:00:00Z'})).toBe(false);
  expect(seasonalPairValid('winter-berge',p,{...t,time:'2026-11-09T08:00:00Z'})).toBe(false);
  expect(seasonalPairValid('winter-berge',p,{...t,modelId:'icon-d2-ruc'})).toBe(false);
  expect(seasonalPairValid('winter-berge',p,{...t,lons:[7,7.11]})).toBe(false);
  expect(seasonalPairValid('winter-berge',p,{...t,values:[0]})).toBe(false);
  expect(seasonalPairValid('winter-berge',p,t,'2026-11-09T08:00:00Z')).toBe(false);
 });
 it('retains true zero and masks NaN in either source, including extremes',()=>{
  const p=field('precipitation',[0,NaN,5,300]),t=field('temperature',[-2,2,NaN,NaN]);
  const primary=seasonalMaskedPrimary('winter-berge',p,t);
  const secondary=seasonalMaskedSecondary('winter-berge',p,t);
  expect(primary?.values[0]).toBe(0);
  expect(Number.isNaN(primary?.values[1])).toBe(true);
  expect(Number.isNaN(primary?.values[2])).toBe(true);
  expect(Number.isNaN(primary?.values[3])).toBe(true);
  expect(secondary?.values[0]).toBe(-2);
  expect(Number.isNaN(secondary?.values[1])).toBe(true);
  expect(Number.isNaN(secondary?.values[2])).toBe(true);
 });
 it('does not manufacture snow, lightning or a synthetic hazard value',()=>{
  const p=field('precipitation',[0,1,4,NaN]),g=field('gust',[10,40,80,90]);
  expect(seasonalMaskedPrimary('sommer-gewitter',p,g)?.kind).toBe('precipitation');
  expect(seasonalMaskedSecondary('sommer-gewitter',p,g)?.kind).toBe('gust');
  expect(seasonalMaskedPrimary('winter-berge',p,g)).toBeNull();
 });
});
