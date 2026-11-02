import {describe,expect,it} from 'vitest';
import {copernicusSnowTileIdentity,validateCopernicusSnowTile} from '../../src/copernicusSnowDelivery';
import {COPERNICUS_SNOW_COLLECTIONS} from '../../src/copernicusSnowObservation';
const key='a'.repeat(64),time=Date.parse('2026-11-02T12:00:00Z');
const base={
 schema:'mid.copernicus.alpine-snow-tile.v1',productionApproved:true,
 kind:'GFSC',collectionId:COPERNICUS_SNOW_COLLECTIONS.GFSC,productDayUtc:'2026-11-02',
 mapProjection:'EPSG:4326',reprojectionMethod:'nearest-neighbor',
 bounds:[[46.5,10.2],[47.8,11.4]],
 imagePath:'/snow/validated/'+key+'/fsc.png',imageSha256:key,
 compressedBytes:4000,sourceCogSha256:key,qaMaskSha256:key,
 qaFlagsDecoded:true,cloudsAndWaterTransparent:true,noDataTransparent:true,
 validZeroColorEncoded:true,maxPixelAcquisitionAgeDays:7,citation:'Copernicus Land Monitoring Service'
} as const;
const check=(diff:Record<string,unknown>={})=>validateCopernicusSnowTile({...base,...diff},time);
describe('Alpine Copernicus snow PNG publication admission',()=>{
 it('admits only explicitly QA-qualified immutable original source identity',()=>{
  expect(check().collectionId).toBe(COPERNICUS_SNOW_COLLECTIONS.GFSC);
  expect(check().maxPixelAcquisitionAgeDays).toBe(7);
 });
 it('re-admits a reused PNG when geography, QA, product kind or provenance changes',()=>{
  const identity=copernicusSnowTileIdentity(check());
  const variants=[
   {bounds:[[46.4,10.2],[47.8,11.4]]},
   {productDayUtc:'2026-11-01'},
   {qaMaskSha256:'b'.repeat(64)},
   {sourceCogSha256:'b'.repeat(64)},
   {kind:'FSC-OG',collectionId:COPERNICUS_SNOW_COLLECTIONS.FSC,maxPixelAcquisitionAgeDays:2},
   {noDataTransparent:false},
  ];
  for(const change of variants){
   const modified={...base,...change} as unknown as Parameters<typeof copernicusSnowTileIdentity>[0];
   expect(copernicusSnowTileIdentity(modified)).not.toBe(identity);
  }
 });
 it('rejects future, stale and nonexistent days',()=>{
  for(const d of ['2026-11-03','2026-10-25','2026-02-30'])
   expect(()=>check({productDayUtc:d})).toThrow();
 });
 it('rejects missing bitmask proof, fake dry pixels and resampled QA',()=>{
  for(const k of ['qaFlagsDecoded','cloudsAndWaterTransparent','noDataTransparent','validZeroColorEncoded'])
   expect(()=>check({[k]:false})).toThrow();
  expect(()=>check({reprojectionMethod:'bilinear'})).toThrow();
 });
 it('rejects unsafe external URLs and unsourced checksum references',()=>{
  for(const url of ['https://example.invalid/map.png','//evil.example/tile.png','/snow/../x.png','/snow/validated/123/file.png'])
   expect(()=>check({imagePath:url})).toThrow();
  for(const field of ['sourceCogSha256','qaMaskSha256','imageSha256'])
   expect(()=>check({[field]:'fake'})).toThrow();
  expect(()=>check({imagePath:'/snow/validated/'+'b'.repeat(64)+'/fsc.png'})).toThrow();
 });
 it('rejects out-of-region, swapped or undefined map georeferencing',()=>{
  for(const bounds of [[[48,12],[46,11]],[[0,0],[1,1]],[[45,8],[48,12]],[[46,11],[47,NaN]]])
   expect(()=>check({bounds})).toThrow();
 });
 it('keeps GFSC 7-day history distinct from FSC optical acquisition',()=>{
  expect(()=>check({kind:'FSC-OG',collectionId:COPERNICUS_SNOW_COLLECTIONS.FSC,maxPixelAcquisitionAgeDays:7})).toThrow();
  expect(check({kind:'FSC-TOC',collectionId:COPERNICUS_SNOW_COLLECTIONS.FSC,maxPixelAcquisitionAgeDays:2}).kind).toBe('FSC-TOC');
 });
 it('rejects unbounded image bytes and absent production declaration',()=>{
  for(const compressedBytes of [0,10000000,1.2,-1,NaN])expect(()=>check({compressedBytes})).toThrow();
  expect(()=>check({productionApproved:false})).toThrow();
 });
});
