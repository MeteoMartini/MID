import {describe,expect,it} from 'vitest';
import {verifyTwinDailyAccumulation,type TwinPrecipitationInterval} from '../../src/twinPrecipitationPeriodEvidence';
const ms=(value:string)=>Date.parse(value);
const HOURLY=3600000;
const fullDay=(start:number,hours:number,amount=0):TwinPrecipitationInterval[]=>Array.from({length:hours},(_,i)=>({startMs:start+i*HOURLY,endMs:start+(i+1)*HOURLY,amountMm:amount,sourceId:'verified-gauge'}));
const window=(start:number,end:number)=>({startMs:start,endMs:end,sourceId:'verified-gauge',maxIntervalMs:HOURLY});

describe('MID Audit 1.1 · no false full-day rain from one incomplete sensor',()=>{
 it('admits real zero and valid 24-hour positive rainfall only with 24-hour interval coverage',()=>{
  const start=ms('2026-11-17T00:00:00Z'),end=start+24*HOURLY;
  expect(verifyTwinDailyAccumulation(window(start,end),fullDay(start,24))).toMatchObject({status:'complete',totalMm:0,expectedHours:24,intervals:24});
  expect(verifyTwinDailyAccumulation(window(start,end),fullDay(start,24,2))).toMatchObject({status:'complete',totalMm:48});
 });
 it('rejects the currently admitted 18-hour recording as incomplete 24-hour precipitation',()=>{
  const start=ms('2026-11-17T00:00:00Z'),end=start+24*HOURLY;
  expect(verifyTwinDailyAccumulation(window(start,end),fullDay(start,18))).toMatchObject({status:'incomplete',reason:'missing-period'});
  expect(verifyTwinDailyAccumulation(window(start,end),[])).toMatchObject({status:'incomplete',reason:'no-observed-intervals'});
 });
 it('supports exact real Europe/Berlin 23-hour spring and 25-hour autumn days',()=>{
  const spring=ms('2026-03-28T23:00:00Z'),springEnd=ms('2026-03-29T22:00:00Z');
  const autumn=ms('2026-10-24T22:00:00Z'),autumnEnd=ms('2026-10-25T23:00:00Z');
  expect(verifyTwinDailyAccumulation(window(spring,springEnd),fullDay(spring,23))).toMatchObject({status:'complete',expectedHours:23});
  expect(verifyTwinDailyAccumulation(window(autumn,autumnEnd),fullDay(autumn,25))).toMatchObject({status:'complete',expectedHours:25});
  expect(verifyTwinDailyAccumulation(window(autumn,autumnEnd),fullDay(autumn,24))).toMatchObject({status:'incomplete'});
 });
 it('rejects interior gaps, duplicate/overlapping periods and unsorted data',()=>{
  const start=ms('2026-11-17T00:00:00Z'),end=start+24*HOURLY,rows=fullDay(start,24);
  expect(verifyTwinDailyAccumulation(window(start,end),rows.filter((_,i)=>i!==8))).toMatchObject({status:'incomplete',reason:'missing-period'});
  expect(verifyTwinDailyAccumulation(window(start,end),[rows[0],rows[0],...rows.slice(1)])).toMatchObject({status:'invalid',reason:'overlapping-intervals'});
  expect(verifyTwinDailyAccumulation(window(start,end),[rows[1],rows[0],...rows.slice(2)])).toMatchObject({status:'incomplete'});
 });
 it('preserves true extreme values, rejects missing and negative observations',()=>{
  const start=ms('2026-11-17T00:00:00Z'),end=start+24*HOURLY,rows=fullDay(start,24);
  expect(verifyTwinDailyAccumulation(window(start,end),[{...rows[0],amountMm:2500},...rows.slice(1)])).toMatchObject({status:'complete',totalMm:2500});
  for(const value of [NaN,Infinity,-3,null,'0']){
   expect(verifyTwinDailyAccumulation(window(start,end),[{...rows[0],amountMm:value as number},...rows.slice(1)])).toMatchObject({status:'invalid'});
  }
 });
 it('does not mix gauges, accept out-of-window accumulations or conceal coarse gaps',()=>{
  const start=ms('2026-11-17T00:00:00Z'),end=start+24*HOURLY,rows=fullDay(start,24);
  expect(verifyTwinDailyAccumulation(window(start,end),[{...rows[0],sourceId:'other-device'},...rows.slice(1)])).toMatchObject({status:'invalid'});
  expect(verifyTwinDailyAccumulation(window(start,end),[{...rows[0],endMs:start+2*HOURLY},...rows.slice(2)])).toMatchObject({status:'invalid'});
  expect(verifyTwinDailyAccumulation(window(start,end),[{...rows[0],endMs:end+HOURLY}])).toMatchObject({status:'invalid'});
 });
 it('is pure and does not mutate the original source intervals',()=>{
  const start=ms('2026-11-17T00:00:00Z'),end=start+24*HOURLY,rows=Object.freeze(fullDay(start,24).map(row=>Object.freeze(row)));
  const before=JSON.stringify(rows);
  for(let i=0;i<10;i++)expect(verifyTwinDailyAccumulation(window(start,end),rows).status).toBe('complete');
  expect(JSON.stringify(rows)).toBe(before);
 });
});
