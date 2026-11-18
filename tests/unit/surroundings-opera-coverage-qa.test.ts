import {describe,expect,it} from 'vitest';
import {summarizeSurroundingsOperaCoverage} from '../../src/surroundingsOperaCoverage';

describe('MID Karten #853: source-exact OPERA coverage is not dry weather',()=>{
 it('marks zero valid source cells as NoData, never as a dry radar frame',()=>{
  expect(summarizeSurroundingsOperaCoverage(0,32768)).toEqual({
   validPixels:0,totalPixels:32768,fraction:0,kind:'none',percentageLabel:'0 %'
  });
 });
 it('does not present a single covered pixel as a fully covered image',()=>{
  const coverage=summarizeSurroundingsOperaCoverage(1,32768);
  expect(coverage?.kind).toBe('partial');
  expect(coverage?.percentageLabel).toBe('< 0,1 %');
  expect(coverage?.validPixels).toBe(1);
 });
 it('never rounds a partial data extent up to complete coverage',()=>{
  const coverage=summarizeSurroundingsOperaCoverage(32767,32768);
  expect(coverage?.kind).toBe('partial');
  expect(coverage?.percentageLabel).toBe('99,9 %');
  expect(coverage?.fraction).toBeLessThan(1);
 });
 it('marks exact full coverage only when every OPERA raster cell is valid',()=>{
  expect(summarizeSurroundingsOperaCoverage(32768,32768)?.kind).toBe('complete');
  expect(summarizeSurroundingsOperaCoverage(32768,32768)?.percentageLabel).toBe('100 %');
 });
 it('preserves intermediate coverage without precipitation assumptions',()=>{
  const part=summarizeSurroundingsOperaCoverage(8192,32768);
  expect(part?.fraction).toBe(.25);
  expect(part?.kind).toBe('partial');
  expect(part?.percentageLabel).toBe('25,0 %');
  expect(Object.keys(part??{}).sort()).toEqual(['fraction','kind','percentageLabel','totalPixels','validPixels']);
 });
 it('fails closed on fractional, excessive, nonfinite or empty coverage',()=>{
  for(const [valid,total] of [[0,0],[1,0],[-1,50],[51,50],[.5,100],[1,NaN],[1,Infinity],[Infinity,100],[1,1.5]]){
   expect(summarizeSurroundingsOperaCoverage(valid,total)).toBeUndefined();
  }
 });
});
