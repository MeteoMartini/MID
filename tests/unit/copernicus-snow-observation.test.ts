import {describe,expect,it} from 'vitest';
import {COPERNICUS_SNOW_COLLECTIONS,qualifyCopernicusSnowSample,type CopernicusSnowSample} from '../../src/copernicusSnowObservation';
const now=Date.parse('2026-11-02T12:00:00Z');
const source:CopernicusSnowSample={kind:'FSC-OG',fractionRaw:0,qualityRaw:0,qaFlagsRaw:0,productDayUtc:'2026-11-02'};
const decode=(changes:Partial<CopernicusSnowSample>={})=>qualifyCopernicusSnowSample({...source,...changes},now);
describe('CLMS FSC/GFSC original UINT8 snow cover contract (read-only)',()=>{
 it('retains an actual 0% as snow-free, not missing, and never snow depth',()=>{
  const p=decode();
  expect(p.fractionPercent).toBe(0);
  expect(p.status).toBe('observed');
  expect(p.snowDepthCm).toBeNull();
  expect(p.newSnowCm).toBeNull();
  expect(p.forecast).toBe(false);
  expect(p.productionApproved).toBe(false);
 });
 it('separates on-ground FSC, canopy FSC and seven-day GFSC composites',()=>{
  const f=decode(),canopy=decode({kind:'FSC-TOC'}),gap=decode({kind:'GFSC',fractionRaw:100,qualityRaw:3});
  expect(f.collectionId).toBe(COPERNICUS_SNOW_COLLECTIONS.FSC);
  expect(canopy.collectionId).toBe(f.collectionId);
  expect(gap.collectionId).toBe(COPERNICUS_SNOW_COLLECTIONS.GFSC);
  expect(gap.spatialResolutionM).toBe(60);
  expect(gap.compositeWindowDays).toBe(7);
  expect(gap.fractionPercent).toBe(100);
  expect(gap.qualityClass).toBe(3);
 });
 it('does not transform cloud/water/unknown quality/NoData into zero',()=>{
  for(const fractionRaw of [205,210,255,null]){
   const p=qualifyCopernicusSnowSample({...source,fractionRaw},now);
   expect(p.fractionPercent).toBeNull();
   expect(p.status).not.toBe('observed');
  }
  for(const qualityRaw of [null,4,205,255]){
   expect(qualifyCopernicusSnowSample({...source,fractionRaw:42,qualityRaw},now).fractionPercent).toBeNull();
  }
  expect(qualifyCopernicusSnowSample({...source,qaFlagsRaw:undefined},now).fractionPercent).toBeNull();
 });
 it('rejects non-UINT8, future dates and invalid UTC product days',()=>{
  for(const fractionRaw of [NaN,Infinity,-1,2.5,'0',false]){
   expect(()=>qualifyCopernicusSnowSample({...source,fractionRaw},now)).toThrow();
  }
  for(const productDayUtc of ['2026-11-03','2026-10-20','2026-02-30','2026-11-02T00:00:00Z']){
   expect(()=>qualifyCopernicusSnowSample({...source,productDayUtc},now)).toThrow();
  }
 });
 it('exposes only the product day, never invents a GFSC pixel acquisition UTC',()=>{
  const a=qualifyCopernicusSnowSample({...source,kind:'GFSC',fractionRaw:65,qaFlagsRaw:128,productDayUtc:'2026-11-01'},now);
  expect(a.observationTimePrecision).toBe('day-or-older');
  expect(a.qaFlagsRaw).toBe(128);
  expect(a.productAgeDays).toBeGreaterThan(1);
  expect(a.compositeWindowDays).toBe(7);
  expect(a.productionApproved).toBe(false);
 });
 it('keeps original source hashes optional, not invented',()=>{
  expect(decode().sourceSha256).toBeNull();
  expect(()=>qualifyCopernicusSnowSample({...source,assetSha256:'fake'},now)).toThrow();
  const sha='a'.repeat(64);
  expect(qualifyCopernicusSnowSample({...source,assetSha256:sha},now).sourceSha256).toBe(sha);
 });
});
