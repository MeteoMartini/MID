import {describe,expect,it} from 'vitest';
import type {CompositeProduct,CompositeProductTimes} from '../../src/CompositeData';
import {selectSurroundingsSatelliteOriginal} from '../../src/surroundingsSatelliteOriginal';

const now=Date.parse('2026-11-16T15:30:00.000Z');
const product=(layer:string,times:Array<string|number>,extras:Partial<CompositeProduct>={}):CompositeProduct=>({
 provider:'eumetsat',layer,label:layer,times,...extras
});
const catalog=(rgb?:CompositeProduct,ir?:CompositeProduct):Pick<CompositeProductTimes,'satelliteRgbProduct'|'satelliteIrProduct'>=>({
 satelliteRgbProduct:rgb,satelliteIrProduct:ir
});

describe('MID Karten #853: original satellite source time and RGB/IR fallback',()=>{
 it('prefers RGB only when its own native time matches the selected target',()=>{
  const rgb=product('mtg_fd:rgb_geocolour',['2026-11-16T15:25:00Z']);
  const ir=product('mtg_fd:ir_105',['2026-11-16T15:25:00Z']);
  const found=selectSurroundingsSatelliteOriginal(catalog(rgb,ir),now,now,0);
  expect(found).toEqual({product:rgb,time:now-5*60_000,spectrum:'RGB'});
 });
 it('selects the IR original if RGB is present but has no matching original',()=>{
  const rgb=product('mtg_fd:rgb_geocolour',['2026-11-16T15:00:00Z']);
  const ir=product('mtg_fd:ir_105',['2026-11-16T15:25:00Z']);
  expect(selectSurroundingsSatelliteOriginal(catalog(rgb,ir),now,now,0))
   .toEqual({product:ir,time:now-5*60_000,spectrum:'IR'});
 });
 it('rejects an RGB product explicitly marked stale or temporally unverified',()=>{
  const ir=product('mtg_fd:ir_105',['2026-11-16T15:25:00Z']);
  for(const extras of [{fresh:false},{timeVerified:false}]){
   const rgb=product('mtg_fd:rgb_geocolour',['2026-11-16T15:25:00Z'],extras);
   expect(selectSurroundingsSatelliteOriginal(catalog(rgb,ir),now,now,0)?.spectrum).toBe('IR');
  }
 });
 it('does not turn nowcast radar steps into fictitious future satellite originals',()=>{
  const future=product('mtg_fd:rgb_geocolour',['2026-11-16T15:45:00Z']);
  expect(selectSurroundingsSatelliteOriginal(catalog(future,future),now+15*60_000,now,1)).toBeUndefined();
  expect(selectSurroundingsSatelliteOriginal(catalog(future,future),now+15*60_000,now,-1)).toBeUndefined();
 });
 it('normalizes original epoch-seconds and disallows sources outside tolerance',()=>{
  const valid=now-5*60_000;
  const ir=product('mtg_fd:ir_105',[valid/1000]);
  expect(selectSurroundingsSatelliteOriginal(catalog(undefined,ir),now,now,0)?.time).toBe(valid);
  expect(selectSurroundingsSatelliteOriginal(catalog(undefined,ir),now+4*60_000,now,0)).toBeUndefined();
 });
 it('does not invent images or use unknown layers or unverified temporal values',()=>{
  const invalid=product('  ',['2026-11-16T15:25:00Z']);
  expect(selectSurroundingsSatelliteOriginal(catalog(invalid),now,now,0)).toBeUndefined();
  expect(selectSurroundingsSatelliteOriginal(catalog(undefined,product('ir',['n/a'])),now,now,0)).toBeUndefined();
  expect(selectSurroundingsSatelliteOriginal(catalog(),now,now,0)).toBeUndefined();
  expect(selectSurroundingsSatelliteOriginal(undefined,now,now,0)).toBeUndefined();
  expect(selectSurroundingsSatelliteOriginal(catalog(undefined,product('ir',['2026-11-16T15:25:00Z'])),NaN,now,0)).toBeUndefined();
 });
 it('keeps the chosen source reference instead of silently relabeling IR as RGB',()=>{
  const ir=product('mtg_fd:ir_105',['2026-11-16T15:25:00Z'],{provider:'dwd'});
  const found=selectSurroundingsSatelliteOriginal(catalog(undefined,ir),now,now,0);
  expect(found?.product.provider).toBe('dwd');
  expect(found?.product.layer).toBe('mtg_fd:ir_105');
  expect(found?.spectrum).toBe('IR');
 });
});
