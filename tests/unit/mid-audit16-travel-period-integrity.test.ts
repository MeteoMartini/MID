import {describe,expect,it} from 'vitest';
import {travelFieldStats,travelStrictBlend} from '../../src/travelPeriodIntegrity';
import {summarizeTravelPeriod,travelNarrative,bestTravelWindows,type TravelClimateDay,type TravelDatePoint,type TravelClimateDataset} from '../../src/travelPlanner';
const base:TravelClimateDay={key:'01-01',maxMean:20,minMean:10,meanMean:15,maxP25:15,maxP75:25,minP25:8,minP75:12,precipitationMean:2,wetProbability:80,sunshineMeanHours:6,daylightMeanHours:10,windMaxMean:8,snowfallMean:0,cloudMean:40,weatherCode:3,years:30};
const point=(day:number,overrides:Partial<TravelClimateDay>={}):TravelDatePoint=>({...base,...overrides,date:'2027-01-'+String(day).padStart(2,'0')});
describe('Audit 1.6 travel interval integrity',()=>{
 for(const n of [2,14,42]){
  it('rejects missing without discarding unrelated fields, '+n+' days',()=>{
   const p=Array.from({length:n},(_,i)=>point(i+1));
   for(const value of [null,undefined,NaN,'0',false,Infinity,-1]){
    const rows=p.map(x=>({...x}));rows[0].precipitationMean=value as number;
    const summary=summarizeTravelPeriod(rows);
    expect(summary.coverage?.precipitationTotal).toEqual({valid:n-1,total:n});
    expect(summary.precipitationTotal).toBeNaN();expect(summary.avgMax).toBe(20);
   }
  });
 }
 it('does not convert cached JSON null or a missing baseline into zero',()=>{
  const rows=JSON.parse(JSON.stringify([point(1,{precipitationMean:NaN}),point(2,{precipitationMean:0})]));
  expect(summarizeTravelPeriod(rows).precipitationTotal).toBeNaN();
  expect(travelStrictBlend(null as unknown as number,10,.5)).toBeNaN();
  expect(travelStrictBlend(0,10,.5)).toBe(5);
 });
 it('retains real dry zeros, negative temperatures and extremes',()=>{
  const rows=[point(1,{precipitationMean:2000,maxMean:-40}),point(2,{precipitationMean:0,maxMean:0})];
  expect(summarizeTravelPeriod(rows).precipitationTotal).toBe(2000);
  expect(summarizeTravelPeriod(rows).avgMax).toBe(-20);
  expect(travelFieldStats([{rain:0},{rain:0}],'rain','nonnegative').sum).toBe(0);
 });
 it('omits unsupported narrative and invalid probability, preserves unaffected fields',()=>{
  const summary=summarizeTravelPeriod([point(1,{wetProbability:101,precipitationMean:NaN}),point(2,{wetProbability:0,precipitationMean:0})]);
  expect(summary.wetDaysExpected).toBeNaN();
  expect(travelNarrative(summary,'dry',false)).not.toMatch(/trocken|NaN/);
  expect(travelNarrative(summary,'dry',false)).toContain('Niederschlag');
 });
 it('does not rank an unassessable preference or active constraint',()=>{
  const dataset:TravelClimateDataset={createdAt:0,latitude:0,longitude:0,timezone:'UTC',source:'fixture',referencePeriod:'1991–2020',snowDepthIncluded:false,days:{'01-01':{...base,key:'01-01',precipitationMean:NaN},'01-02':{...base,key:'01-02',wetProbability:NaN}}};
  expect(bestTravelWindows(dataset,'2027-01-01','2027-01-02',2,'dry')).toEqual([]);
  expect(bestTravelWindows(dataset,'2027-01-01','2027-01-02',2,'warm',{maxWetDays:2})).toEqual([]);
 });
 it('empty and overflowing aggregates are not physical zero',()=>{
  expect(summarizeTravelPeriod([]).precipitationTotal).toBeNaN();
  expect(travelFieldStats([{t:Number.MAX_VALUE},{t:Number.MAX_VALUE}],'t').sum).toBeNaN();
 });
});
