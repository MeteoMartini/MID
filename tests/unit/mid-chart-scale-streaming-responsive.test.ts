import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {niceChartScale,calendarMonthLabel,chartLabelVisible} from '../../src/chartScale';

const source=readFileSync(new URL('../../src/chartScale.ts',import.meta.url),'utf8');

// Historical finite-array algorithm as a parity oracle, not a production fallback.
function previousChartScale(values:number[],includeZero=false){
 const valid=values.filter(Number.isFinite);
 let low=valid.length?Math.min(...valid):0,high=valid.length?Math.max(...valid):1;
 if(includeZero){low=Math.min(0,low);high=Math.max(0,high)}
 const span=Math.max(.5,high-low),raw=span/4,power=10**Math.floor(Math.log10(raw));
 const fraction=raw/power,step=([1,2,2.5,5,10].find(value=>value>=fraction)??10)*power;
 low=Math.floor((low-step*.1)/step)*step;
 high=Math.ceil((high+step*.1)/step)*step;
 if(includeZero&&valid.every(value=>value>=0))low=0;
 const ticks=Array.from({length:Math.round((high-low)/step)+1},(_,index)=>Number((low+index*step).toPrecision(12)));
 let decimals=0;
 while(decimals<6&&Math.abs(step*10**decimals-Math.round(step*10**decimals))>1e-8)decimals++;
 return{low,high,step,ticks,decimals};
}

describe('MID chart-axis performance, mobile labels and meteorological scale parity',()=>{
 it('preserves every original axis/zero/tick/precision result for normal and NoData series',()=>{
  const series=[
   [],[Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY],
   [-5,13],[0,.43],[-.14,.55],[990,1034],[3,3],
   [-20,-20],[0,0],[Number.NaN,0,2.5],[Number.POSITIVE_INFINITY,-3,5],
   [1e-7,2e-7,Number.NaN],[50000,60000],[Number.NEGATIVE_INFINITY,1,8],
  ];
  for(const values of series){
   for(const includeZero of [false,true]){
    expect(niceChartScale(values,includeZero)).toEqual(previousChartScale(values,includeZero));
   }
  }
 });
 it('handles long, dense traces without spreading or allocating an extrema copy',()=>{
  const values=Array.from({length:200000},(_,index)=>index%1000===0?Number.NaN:index%2===0?-65.25:72.5);
  const result=niceChartScale(values,true);
  expect(result.low).toBeLessThanOrEqual(-65.25);
  expect(result.high).toBeGreaterThanOrEqual(72.5);
  expect(result.ticks.every(Number.isFinite)).toBe(true);
  expect(values[1]).toBe(72.5);
  expect(values[2]).toBe(-65.25);
  expect(source).not.toContain('Math.min(...valid)');
  expect(source).not.toContain('Math.max(...valid)');
  expect(source).toContain('for(const value of values)');
 });
 it('preserves compact/full UTC calendar labeling over DST, year and leap boundaries',()=>{
  const dates=['2026-03-29','2026-10-25','2026-12-31','2027-01-01','2028-02-29'];
  const original=new Intl.DateTimeFormat('de-DE',{month:'short',year:'2-digit',timeZone:'UTC'});
  for(const date of dates){
   expect(calendarMonthLabel(date)).toBe(date.slice(5,7)+'/'+date.slice(2,4));
   expect(calendarMonthLabel(date,false)).toBe(original.format(new Date(date.slice(0,7)+'-15T12:00:00Z')));
  }
  expect(source.split('new Intl.DateTimeFormat(')).toHaveLength(2);
  expect(source).toContain('fullMonthFormatter??=');
 });
 it('preserves responsive axis label density without adding labels at tight widths',()=>{
  for(const [count,width,labelWidth] of [[14,180,80],[14,300,80],[7,200,64],[3,150,64]]){
   const shown=Array.from({length:count},(_,i)=>i).filter(i=>chartLabelVisible(i,count,width,labelWidth));
   expect(shown[0]).toBe(0);
   expect(shown.length).toBeLessThanOrEqual(Math.ceil(width/labelWidth)+1);
   expect(shown.every((index,i)=>i===0||index>shown[i-1])).toBe(true);
  }
 });
});
