import {describe,expect,it} from 'vitest';
import {applyHyperlocalForecastHours,type ForecastLocalAnchor,type ForecastLocalAnchorField} from '../../src/forecastFusion';
import type {Hour} from '../../src/weather';

const now=Date.UTC(2026,10,28,12);
function hour(overrides:Partial<Hour>={}):Hour{
 return {time:new Date(now).toISOString(),epoch:now,timezone:'GMT',temperature:15,apparent:14,humidity:60,dewPoint:7,pressure:1010,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:2,wind:5,gust:9,direction:350,cloud:50,lowCloud:20,uvIndex:0,visibility:10000,cape:0,liftedIndex:0,sunshineDuration:null,isDay:true,...overrides};
}
function anchor(key:ForecastLocalAnchorField,value:unknown):ForecastLocalAnchor{
 return {active:true,observed:{[key]:true},[key]:value} as ForecastLocalAnchor;
}
describe('hyperlocal field-specific forecast retention (#1045)',()=>{
 const singleFields=[['humidity',70],['dewPoint',9],['pressure',1015],['gust',13],['direction',10],['lowCloud',35],['wind',0]] as const;
 it.each(singleFields)('retains the independent %s correction',(key,value)=>{
  const base=hour(),input=[base],result=applyHyperlocalForecastHours(input,anchor(key,value),now);
  expect(result).not.toBe(input);
  expect(result[0][key]).toBeCloseTo(value);
  expect(result[0].localAdjustment).toBeGreaterThan(0);
  expect(result[0].temperature).toBe(base.temperature);
 });
 it.each([null,undefined,NaN,Infinity,'',false,'0'])('rejects invalid pressure anchor %s without a synthetic zero',value=>{
  const input=[hour()];expect(applyHyperlocalForecastHours(input,anchor('pressure',value),now)).toBe(input);
 });
 it('does not derive a pressure residual from a missing model reference',()=>{
  const base=hour(),ref=hour({pressure:null as unknown as number});
  expect(applyHyperlocalForecastHours([base],anchor('pressure',1015),now,[ref])[0].pressure).toBe(1010);
 });
 it('preserves a missing target field instead of converting it to a plausible value',()=>{
  const base=hour({pressure:null as unknown as number});
  expect(applyHyperlocalForecastHours([base],anchor('pressure',1015),now,[hour()])[0].pressure).toBeNull();
 });
 it('keeps absent gust missing during an independent humidity correction',()=>{
  const base=hour({gust:null as unknown as number});
  expect(applyHyperlocalForecastHours([base],anchor('humidity',70),now)[0].gust).toBeNull();
 });
 it('uses the shortest circular directional residual across north',()=>{
  const base=hour({direction:359});
  expect(applyHyperlocalForecastHours([base],anchor('direction',1),now)[0].direction).toBeCloseTo(1);
 });
 it('preserves identity with no valid observed evidence',()=>{
  const input=[hour()];expect(applyHyperlocalForecastHours(input,{active:true,observed:{pressure:false},pressure:1020},now)).toBe(input);
 });
 it('does not extend the gust-only correction beyond the existing horizon',()=>{
  const base=hour({epoch:now+120*60000,time:new Date(now+120*60000).toISOString()});
  expect(applyHyperlocalForecastHours([base],anchor('gust',13),now,[hour()])[0]).toBe(base);
 });
});
