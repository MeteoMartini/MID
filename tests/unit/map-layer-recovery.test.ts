import {describe,expect,it} from 'vitest';
import {RASTER_TILE_MAX_RETRIES,COMPOSITE_METADATA_MAX_RETRIES,rasterTileRetryDelayMs,compositeMetadataRetryDelayMs,shouldRefreshMapMetadataOnResume,isCompositeTimesFailureWithoutFrames} from '../../src/mapLayerRecovery';

describe('MID Karten: WMS recovery ohne ungebundene Requests',()=>{
 it('begrenzt Tile-Retries und steigt exponentiell',()=>{
  expect(RASTER_TILE_MAX_RETRIES).toBe(3);
  expect([0,1,2,3].map(rasterTileRetryDelayMs)).toEqual([1500,3000,6000,null]);
  expect([-1,1.5,Number.NaN,Number.POSITIVE_INFINITY].map(rasterTileRetryDelayMs)).toEqual([null,null,null,null]);
 });
 it('wiederholt fehlgeschlagene Radar/Sat-Metadaten endlich, nicht endlos',()=>{
  expect(COMPOSITE_METADATA_MAX_RETRIES).toBe(4);
  expect([0,1,2,3,4].map(compositeMetadataRetryDelayMs)).toEqual([10_000,20_000,40_000,60_000,null]);
  expect([-1,NaN,Infinity].map(compositeMetadataRetryDelayMs)).toEqual([null,null,null]);
 });
 it('bewahrt gültige Originalzeiten bei HTTP-200-Teilfehler',()=>{
  expect(isCompositeTimesFailureWithoutFrames({error:'upstream unavailable',satelliteDay:[],dwdRadar:[]})).toBe(true);
  expect(isCompositeTimesFailureWithoutFrames({errors:['EUMETSAT failed'],satelliteDayProduct:{times:['2026-11-02T09:00:00Z']}})).toBe(false);
  expect(isCompositeTimesFailureWithoutFrames({errors:['Radar failed'],dwdRadar:['2026-11-02T09:05:00Z']})).toBe(false);
  expect(isCompositeTimesFailureWithoutFrames({satelliteDay:[],dwdRadar:[]})).toBe(false);
  expect(isCompositeTimesFailureWithoutFrames(null)).toBe(true);
 });
 it('holt bei App-Resume nur nach genügend Alter neu',()=>{
  expect(shouldRefreshMapMetadataOnResume(31_000,0,true)).toBe(true);
  expect(shouldRefreshMapMetadataOnResume(29_999,0,true)).toBe(false);
  expect(shouldRefreshMapMetadataOnResume(30_000,0,false)).toBe(false);
  expect(shouldRefreshMapMetadataOnResume(60_000,40_000,true)).toBe(false);
  expect(shouldRefreshMapMetadataOnResume(NaN,0,true)).toBe(false);
 });
});
