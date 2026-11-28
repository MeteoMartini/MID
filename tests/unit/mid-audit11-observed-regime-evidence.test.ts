import {describe,expect,it} from 'vitest';
import {hasTwinObservedDryEvidence,twinObservedRainState} from '../../src/twinObservedRainEvidence';

describe('MID Audit 1.1 · observed precipitation is not fabricated dry',()=>{
 it('rejects missing, nonnumeric, negative and invalid reference rainfall',()=>{
  for(const value of [undefined,null,NaN,Infinity,-Infinity,-0.001,'0','',false,{},[]]){
   expect(twinObservedRainState(value,0.1)).toBe('unknown');
   expect(hasTwinObservedDryEvidence(value,0.1)).toBe(false);
   expect(hasTwinObservedDryEvidence(value,0.2)).toBe(false);
  }
 });
 it('retains genuine zero and subthreshold trace rainfall',()=>{
  expect(twinObservedRainState(0,0.1)).toBe('dry');
  expect(twinObservedRainState(0.0999,0.1)).toBe('dry');
  expect(hasTwinObservedDryEvidence(0,0.2)).toBe(true);
 });
 it('compares strict thresholds without rounding',()=>{
  expect(twinObservedRainState(0.1,0.1)).toBe('wet');
  expect(twinObservedRainState(0.19999,0.2)).toBe('dry');
  expect(twinObservedRainState(0.2,0.2)).toBe('wet');
 });
 it('does not cap finite positive extremes',()=>{
  for(const value of [25,250,5000,100000])
   expect(twinObservedRainState(value,0.1)).toBe('wet');
 });
 it('rejects invalid or ambiguous dry thresholds',()=>{
  for(const threshold of [NaN,Infinity,-Infinity,-1,0]){
   expect(twinObservedRainState(0,threshold)).toBe('unknown');
   expect(hasTwinObservedDryEvidence(0,threshold)).toBe(false);
  }
 });
 it('is deterministic and does not change the reference observation',()=>{
  const payload={precipitation:null,gust:45,max:12,min:1};
  const before=JSON.stringify(payload);
  for(let i=0;i<1000;i++){
   expect(twinObservedRainState(payload.precipitation,0.1)).toBe('unknown');
   expect(hasTwinObservedDryEvidence(payload.precipitation,0.2)).toBe(false);
  }
  expect(JSON.stringify(payload)).toBe(before);
 });
});
