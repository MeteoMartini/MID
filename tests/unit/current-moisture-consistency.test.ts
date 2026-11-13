import {describe,it,expect} from 'vitest';
import {reconcileCurrentMoisture,dwdDewPointFromHumidity,dwdHumidityFromDewPoint} from '../../src/currentMoistureConsistency';
const station={temperatureOrigin:'station',humidityOrigin:'station',dewPointOrigin:'station'} as const;
describe('MID current dew-point thermodynamics (DWD 6.3)',()=>{
 it('repairs screenshot Rheidt -1 °C / +1 °C / 95% without clipping the source',()=>{
  const source={...station,temperature:-1,dewPoint:1,relativeHumidity:95};
  const result=reconcileCurrentMoisture(source);
  expect(result.source).toBe('calculated');expect(result.reason).toBe('reported-conflict');
  expect(result.dewPoint).toBeGreaterThan(-1.8);expect(result.dewPoint).toBeLessThan(-1.6);
  expect(result.dewPoint).toBeLessThanOrEqual(source.temperature);
  expect(Math.round(result.dewPoint!)).toBe(-2);
  expect(source.dewPoint).toBe(1);
  expect(result.expectedHumidityFromReported).toBeGreaterThan(100);
 });
 it('retains coherent sensor triples and saturation without changing their true values',()=>{
  expect(reconcileCurrentMoisture({...station,temperature:-1,dewPoint:-1.7,relativeHumidity:95}).source).toBe('reported');
  expect(reconcileCurrentMoisture({...station,temperature:5,dewPoint:5,relativeHumidity:100}).dewPoint).toBe(5);
  expect(dwdDewPointFromHumidity(-1,100)).toBe(-1);
 });
 it('uses DWD cold inversion when air is above zero but dew point below zero',()=>{
  const dew=dwdDewPointFromHumidity(1,50);
  expect(dew).toBeLessThan(0);
  expect(dwdHumidityFromDewPoint(1,dew)).toBeCloseTo(50,7);
 });
 it('detects mismatched RH even when reported dew point is below air temperature',()=>{
  const x=reconcileCurrentMoisture({...station,temperature:8,dewPoint:0,relativeHumidity:97});
  expect(x.source).toBe('calculated');expect(x.dewPoint).toBeGreaterThan(7);
 });
 it('does not accept a model dew point as a co-located station measurement',()=>{
  const x=reconcileCurrentMoisture({...station,dewPointOrigin:'model',temperature:0,dewPoint:-1,relativeHumidity:97});
  expect(x.source).toBe('calculated');expect(x.reason).toBe('source-mix');expect(x.mixedSources).toBe(true);
 });
 it('fails closed for age-skewed temperature and humidity instead of inventing a value',()=>{
  const x=reconcileCurrentMoisture({...station,temperature:0,dewPoint:5,relativeHumidity:94,
   temperatureEpochMs:1_000_000,humidityEpochMs:1_000_000+31*60_000});
  expect(x.dewPoint).toBeUndefined();expect(x.reason).toBe('time-mismatch');
 });
 it('does not convert null, NaN, empty, invalid RH or a genuine zero RH to dew=0',()=>{
  for(const bad of [null,undefined,'',NaN,101,-1]){
   expect(reconcileCurrentMoisture({...station,temperature:-1,dewPoint:1,relativeHumidity:bad}).dewPoint).toBeUndefined();
  }
  const zero=reconcileCurrentMoisture({...station,temperature:2,dewPoint:null,relativeHumidity:0});
  expect(zero.relativeHumidity).toBe(0);expect(zero.dewPoint).toBeUndefined();
  expect(dwdDewPointFromHumidity(-1,0)).toBeUndefined();
  expect(reconcileCurrentMoisture({...station,temperature:null,dewPoint:2,relativeHumidity:80}).dewPoint).toBeUndefined();
 });
 it('always keeps a finite presented dew point below or equal to presented temperature',()=>{
  for(let t=-45;t<=45;t+=3)for(const rh of [1,5,40,75,95,99.9,100]){
   const dp=dwdDewPointFromHumidity(t,rh);
   expect(dp).toBeDefined();expect(dp!).toBeLessThanOrEqual(t);
   expect(Math.round(dp!)).toBeLessThanOrEqual(Math.round(t));
   expect(dwdHumidityFromDewPoint(t,dp!)).toBeCloseTo(rh,5);
  }
 });
});
