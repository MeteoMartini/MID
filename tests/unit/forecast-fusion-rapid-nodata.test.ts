import {describe,expect,it} from 'vitest';
import {finalizeForecastMinute15,type ForecastFusionRapidMinute15} from '../../src/forecastFusion';
import type {Minute15} from '../../src/weather';

const now=Date.UTC(2026,10,11,12),epoch=now+15*60_000;
const minute={
 epoch,time:new Date(epoch).toISOString(),temperature:12,
 precipitation:.4,rain:.4,showers:0,snowfall:0,probability:32,
 code:61,cloud:80,lowCloud:50,humidity:75,isDay:true,sunshineDuration:0,
} as Minute15;
const output=(rapid?:ForecastFusionRapidMinute15)=>finalizeForecastMinute15(
 [minute],[],[],{now,rucRapidMinutes15:rapid?[rapid]:[]},
)[0];
const diagnostic={time:new Date(epoch).toISOString(),epoch,cape:1600,convectiveInhibition:8,peakRateMmh:34,dbzCmax:55,nativePrecipitationSeconds:300};

describe('RUC diagnostics with native quarter-amount NoData',()=>{
 it('uses independent convective evidence without inventing rain or snow amounts',()=>{
  const original=output(),withEvidence=output({...diagnostic,precipitation:undefined});
  expect(withEvidence.precipitation).toBeCloseTo(original.precipitation);
  expect(withEvidence.rain).toBeCloseTo(original.rain);
  expect(withEvidence.showers).toBeCloseTo(original.showers);
  expect(withEvidence.snowfall).toBeCloseTo(original.snowfall);
  expect(withEvidence.probability).toBeCloseTo(original.probability);
  expect(withEvidence.code).toBe(95);
  // Signal strength is not calibrated precipitation probability, even for
  // an explicit WMO storm code derived from an MID-owned model diagnosis.
 });
 it.each([undefined,-1,Number.NaN] as const)('keeps a missing %s amount unknown, never as dry evidence',precipitation=>{
  const original=output(),candidate=output({...diagnostic,precipitation,peakRateMmh:0,dbzCmax:0,cape:0});
  expect(candidate.precipitation).toBeCloseTo(original.precipitation);
  expect(candidate.probability).toBeCloseTo(original.probability);
 });
 it('continues treating a valid native zero as measured dry evidence',()=>{
  const original=output(),candidate=output({...diagnostic,precipitation:0,peakRateMmh:0,dbzCmax:0,cape:0});
  expect(candidate.precipitation).toBeLessThan(original.precipitation);
 });
});
