import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {aggregateCompleteSubseasonalWeek,hasCompleteSubseasonalWeek,hasConsecutiveSubseasonalDates,nativeSubseasonalNumber} from '../../src/subseasonalWeekIntegrity';
const days=(start:string,count=7)=>Array.from({length:count},(_,i)=>{
 const date=new Date(Date.parse(start+'T00:00:00Z')+i*86400000);
 return date.toISOString().slice(0,10);
});
describe('MID Audit 1.1 · only truly complete subseasonal weeks',()=>{
 it('preserves a real full seven-day precipitation total, including verified zero',()=>{
  expect(aggregateCompleteSubseasonalWeek([0,1,2,3,4,5,6],0,'sum','precipitation')).toBe(21);
  expect(aggregateCompleteSubseasonalWeek(Array(7).fill(0),0,'sum','precipitation')).toBe(0);
 });
 it('does not dilute a seven-day temperature mean by missing dates',()=>{
  expect(aggregateCompleteSubseasonalWeek([-7,-6,-5,-4,-3,-2,-1],0,'mean','temperature_min')).toBe(-4);
  expect(aggregateCompleteSubseasonalWeek([10,10,10,10,10,10],0,'mean','temperature_max')).toBeNull();
 });
 it('rejects seven-day precipitation totals with missing/interior NaN values',()=>{
  const a=[5,2,1,NaN,0,0,0],b=[5,2,1,undefined,0,0,0] as unknown as number[];
  expect(aggregateCompleteSubseasonalWeek(a,0,'sum','precipitation')).toBeNull();
  expect(aggregateCompleteSubseasonalWeek(b,0,'sum','precipitation')).toBeNull();
 });
 it('rejects an incomplete entire provider calendar, even when a later week looks complete',()=>{
  const dates=days('2026-11-01',46);
  expect(hasConsecutiveSubseasonalDates(dates)).toBe(true);
  expect(hasConsecutiveSubseasonalDates([dates[0],...dates.slice(2)])).toBe(false);
  expect(hasConsecutiveSubseasonalDates([...dates.slice(0,12),dates[11],...dates.slice(13)])).toBe(false);
 });
 it('does not accept a final four-day EC46 fragment as mm per week',()=>{
  const dates=days('2026-11-01',46);
  const starts:number[]=[];
  for(let start=14;start+7<=dates.length;start+=7)
   if(hasCompleteSubseasonalWeek(dates.slice(start,start+7)))starts.push(start+1);
  expect(starts).toEqual([15,22,29,36]);
  expect(aggregateCompleteSubseasonalWeek([1,2,3,4],0,'sum','precipitation')).toBeNull();
 });
 it('does not silently treat empty, string, null or booleans as actual zero',()=>{
  for(const raw of [null,undefined,'', '0',' ',false,NaN,Infinity,-Infinity])
   expect(Number.isNaN(nativeSubseasonalNumber(raw))).toBe(true);
  expect(nativeSubseasonalNumber(0)).toBe(0);
  expect(nativeSubseasonalNumber(-5)).toBe(-5);
 });
 it('retains real positive extreme rain without arbitrary clipping',()=>{
  const a=[0,0,4500,0,0,0,0];
  expect(aggregateCompleteSubseasonalWeek(a,0,'sum','precipitation')).toBe(4500);
  expect(aggregateCompleteSubseasonalWeek(a,0,'mean','precipitation')).toBeCloseTo(4500/7);
 });
 it('rejects physically invalid weekly input without disguising it as valid',()=>{
  expect(aggregateCompleteSubseasonalWeek([0,0,-1,0,0,0,0],0,'sum','precipitation')).toBeNull();
  expect(aggregateCompleteSubseasonalWeek([4,4,-1,4,4,4,4],0,'mean','wind')).toBeNull();
  expect(aggregateCompleteSubseasonalWeek([101,40,40,40,40,40,40],0,'mean','cloud')).toBeNull();
  expect(aggregateCompleteSubseasonalWeek([0,1000,1000,1000,1000,1000,1000],0,'mean','pressure')).toBeNull();
 });
 it('accepts dates across real 2026 DST spring and autumn without inventing a local 24h rule',()=>{
  expect(hasCompleteSubseasonalWeek(days('2026-03-26'))).toBe(true);
  expect(hasCompleteSubseasonalWeek(days('2026-10-23'))).toBe(true);
  expect(hasCompleteSubseasonalWeek(days('2026-12-29'))).toBe(true);
 });
 it('rejects missing, duplicated, out-of-order and impossible calendar days',()=>{
  expect(hasCompleteSubseasonalWeek(days('2026-03-26',6))).toBe(false);
  expect(hasCompleteSubseasonalWeek([...days('2026-03-26').slice(0,5),'2026-03-31','2026-04-02'])).toBe(false);
  expect(hasCompleteSubseasonalWeek(['2026-11-01','2026-11-02','2026-11-03','2026-11-03','2026-11-05','2026-11-06','2026-11-07'])).toBe(false);
  expect(hasCompleteSubseasonalWeek(['2026-02-29','2026-03-01','2026-03-02','2026-03-03','2026-03-04','2026-03-05','2026-03-06'])).toBe(false);
 });
 it('supports offset series windows only when every intended day exists',()=>{
  const a=[9,9,0,1,2,3,4,5,6];
  expect(aggregateCompleteSubseasonalWeek(a,2,'sum','precipitation')).toBe(21);
  expect(aggregateCompleteSubseasonalWeek(a,3,'sum','precipitation')).toBeNull();
  expect(aggregateCompleteSubseasonalWeek(a,-1,'sum','precipitation')).toBeNull();
 });
 it('requires seven climate-reference cells, never partial 1991–2020 normals',()=>{
  expect(aggregateCompleteSubseasonalWeek([0,0,0,0,0],0,'sum','precipitation')).toBeNull();
  expect(aggregateCompleteSubseasonalWeek([2,2,2,2,2,2,2],0,'mean','temperature_max')).toBe(2);
 });
 it('is deterministic, does not mutate observations and wires the QA guard into production source',()=>{
  const a=Object.freeze([0,3,1,0,4,0,0]);
  const before=JSON.stringify(a);
  for(let i=0;i<100;i++)expect(aggregateCompleteSubseasonalWeek(a,0,'sum','precipitation')).toBe(8);
  expect(JSON.stringify(a)).toBe(before);
  const source=readFileSync(new URL('../../src/SubseasonalTrendPanel.tsx',import.meta.url),'utf8');
  expect(source).toContain("hasCompleteSubseasonalWeek(time.slice(start,start+7))");
  expect(source).toContain("if(!hasConsecutiveSubseasonalDates(time))return weeks");
  expect(source).toContain("series.length===time.length");
  expect(source).toContain("aggregateCompleteSubseasonalWeek(");
  expect(source).toContain("samples.length===7");
 });
});
