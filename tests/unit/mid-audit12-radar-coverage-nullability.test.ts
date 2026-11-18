import {describe,it,expect} from 'vitest';
import {radarFrameAvailable,radarForecastCoverage} from '../../src/radarCoverage';
import type {RadarNowcast,RadarNowcastFrame} from '../../src/weather';
const BASE=Date.parse('2026-11-18T12:00:00Z'),time=(index:number)=>new Date(BASE+index*300000).toISOString();
const frame=(index:number):RadarNowcastFrame=>({time:time(index),future:true,rate:1.2,amountMm:.1});
const radar=():RadarNowcast=>({source:'dwd',provider:'DWD RV',quality:'high',radarProbability:0,observedAt:time(0),summary:'QA',nowcastSeries:Array.from({length:24},(_,i)=>frame(i+1))});
describe('MID Audit 1.2 · NoData 5min Radar, explicit dry vs missing',()=>{
 it('preserves valid true dry zeros',()=>{
  expect(radarFrameAvailable({...frame(1),rate:0,amountMm:0})).toBe(true);
 });
 it('does not coerce null rates into dry evidence',()=>{
  expect(radarFrameAvailable({...frame(1),rate:null as unknown as number,amountMm:null as unknown as number})).toBe(false);
 });
 it('does not convert explicit null precipitation to a valid 5min amount',()=>{
  const a=radar();a.nowcastSeries![3].amountMm=null as unknown as number;
  expect(radarForecastCoverage(a).complete).toBe(false);
  expect(radarForecastCoverage(a).availableSlots).toBe(23);
 });
 it('does not discard already valid 120-minute complete amount',()=>{
  const c=radarForecastCoverage(radar());expect(c.complete).toBe(true);expect(c.partialAmountMm).toBe(2.4);
 });
 it('does not accept overlapping duplicate timestamps regardless of order',()=>{
  const a=radar();a.nowcastSeries!.push({...frame(1),rate:0,amountMm:0});
  const b=radar();b.nowcastSeries!.unshift({...frame(1),rate:0,amountMm:0});
  expect(radarForecastCoverage(a).complete).toBe(false);
  expect(radarForecastCoverage(b).complete).toBe(false);
 });
 it('does not count observation frames as future forecast slots',()=>{
  const a=radar();a.nowcastSeries![0].future=false;
  expect(radarForecastCoverage(a).complete).toBe(false);
 });
 it('does not manufacture observation origin from wall clock',()=>{
  const a=radar();delete a.observedAt;
  expect(radarForecastCoverage(a).complete).toBe(false);
 });
 it('retains legacy omitted-amount rate estimate without replacing explicit null',()=>{
  const a=radar();delete a.nowcastSeries![0].amountMm;
  expect(radarForecastCoverage(a).complete).toBe(true);
  expect(radarForecastCoverage(a).partialAmountMm).toBe(2.4);
 });
 it('protects against non-five-minute and oversized windows',()=>{
  expect(radarForecastCoverage(radar(),7).complete).toBe(false);
  expect(radarForecastCoverage(radar(),180).complete).toBe(false);
 });
});
