import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {verifiedCumulativeEnsembleRain,type CumulativeEnsembleDay} from '../../src/ensembleCumulativeSourceEvidence';

const days=(from='2026-11-01',count=7)=>Array.from({length:count},(_,i)=>
 new Date(Date.parse(from+'T00:00:00Z')+i*86400000).toISOString().slice(0,10));
const records=(dates:readonly string[],values:readonly number[]):CumulativeEnsembleDay[]=>
 dates.map((date,i)=>({date,precipitation:values[i],complete:{precipitation:true}}));
describe('MID Audit 1.2 · cumulative ensemble precipitation retains genuine gaps',()=>{
 it('retains a valid zero-rain event exactly as 0, not NoData',()=>{
  const dates=days();
  expect(verifiedCumulativeEnsembleRain(records(dates,[0,0,0,0,0,0,0]),new Set(dates))).toBe(0);
 });
 it('sums all seven genuine complete daily rainfall values',()=>{
  const dates=days();
  expect(verifiedCumulativeEnsembleRain(records(dates,[0,1,0,2,3,0,4]),new Set(dates))).toBe(10);
 });
 it('rejects incomplete hourly precipitation coverage even if daily amount appears numeric',()=>{
  const dates=days(),rows=records(dates,[0,1,2,3,4,5,6]);
  expect(verifiedCumulativeEnsembleRain([{...rows[0],complete:{precipitation:false}},...rows.slice(1)],new Set(dates))).toBeNull();
  expect(verifiedCumulativeEnsembleRain([{date:rows[0].date,precipitation:0},...rows.slice(1)],new Set(dates))).toBeNull();
 });
 it('rejects one missing source member day instead of inventing a dry day',()=>{
  const dates=days(),rows=records(dates,[0,1,2,3,4,5,6]).filter((_,i)=>i!==3);
  expect(verifiedCumulativeEnsembleRain(rows,new Set(dates))).toBeNull();
 });
 it('rejects NaN, null, undefined and other non-numeric source fields without zero coercion',()=>{
  const dates=days(),rows=records(dates,[0,1,2,3,4,5,6]);
  for(const value of [NaN,null,undefined,'0','',Infinity,-Infinity] as unknown[]){
   expect(verifiedCumulativeEnsembleRain([{...rows[0],precipitation:value as number},...rows.slice(1)],new Set(dates))).toBeNull();
  }
 });
 it('rejects negative precipitation without clamping the value to zero',()=>{
  const dates=days(),rows=records(dates,[0,1,-.01,3,4,5,6]);
  expect(verifiedCumulativeEnsembleRain(rows,new Set(dates))).toBeNull();
 });
 it('preserves true positive extremes without percentile clipping',()=>{
  const dates=days(),rows=records(dates,[0,0,0,5800,0,0,0]);
  expect(verifiedCumulativeEnsembleRain(rows,new Set(dates))).toBe(5800);
 });
 it('rejects duplicate day cells instead of double-counting rain',()=>{
  const dates=days(),rows=records(dates,[1,1,1,1,1,1,1]);
  expect(verifiedCumulativeEnsembleRain([rows[0],...rows],new Set(dates))).toBeNull();
 });
 it('rejects a missing date in the collective provider axis even if all supplied cells are finite',()=>{
  const dates=days(),gappy=[...dates.slice(0,3),...dates.slice(4)];
  expect(verifiedCumulativeEnsembleRain(records(gappy,[1,1,1,1,1,1]),new Set(gappy))).toBeNull();
 });
 it('rejects reordered or invalid calendar days including nonexistent Feb 29 in 2026',()=>{
  const dates=days();
  expect(verifiedCumulativeEnsembleRain(records(dates,Array(7).fill(0)),new Set([dates[1],dates[0],...dates.slice(2)]))).toBeNull();
  expect(verifiedCumulativeEnsembleRain([{date:'2026-02-29',precipitation:0}],new Set(['2026-02-29']))).toBeNull();
 });
 it('does not mistake extra future member cells for extra accumulated rainfall',()=>{
  const dates=days(),rows=records([...dates,...days('2026-11-08',2)],[1,1,1,1,1,1,1,300,500]);
  expect(verifiedCumulativeEnsembleRain(rows,new Set(dates))).toBe(7);
 });
 it('handles spring/autumn DST boundaries as real dated periods without assuming UTC+1 all year',()=>{
  for(const date of ['2026-03-25','2026-10-23']){
   const dates=days(date);
   expect(verifiedCumulativeEnsembleRain(records(dates,Array(7).fill(2)),new Set(dates))).toBe(14);
  }
 });
 it('fails closed if accumulated floating-point total overflows',()=>{
  const dates=days('2026-11-01',2);
  expect(verifiedCumulativeEnsembleRain(records(dates,[1e308,1e308]),new Set(dates))).toBeNull();
 });
 it('is deterministic, immutable, and separates independent ensemble members',()=>{
  const dates=days(),dry=Object.freeze(records(dates,Array(7).fill(0)).map(Object.freeze)),
   wet=Object.freeze(records(dates,Array(7).fill(4)).map(Object.freeze));
  for(let i=0;i<10;i++){
   expect(verifiedCumulativeEnsembleRain(dry,new Set(dates))).toBe(0);
   expect(verifiedCumulativeEnsembleRain(wet,new Set(dates))).toBe(28);
  }
 });
 it('is wired into both canonical and generated MID weather source without fallback zero',()=>{
  const source=readFileSync(new URL('../../src/weather-src/30-ensemble-climate-hazards.tsfrag',import.meta.url),'utf8');
  const aggregate=readFileSync(new URL('../../src/weather.ts',import.meta.url),'utf8');
  const expected="verifiedCumulativeEnsembleRain(memberDays,cumulativeTargetDates)";
  expect(source).toContain(expected);
  expect(aggregate).toContain(expected);
  expect(source).not.toContain("Number.isFinite(item.precipitation)?Math.max(0,item.precipitation):0");
  expect(aggregate).not.toContain("Number.isFinite(item.precipitation)?Math.max(0,item.precipitation):0");
 });
});
