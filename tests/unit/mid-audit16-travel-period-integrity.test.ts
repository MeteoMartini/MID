import {describe,expect,it} from 'vitest';
import {travelFieldStats,travelStrictBlend} from '../../src/travelPeriodIntegrity';
import {mediumDay} from '../../src/travelForecastFusion';
import type {Day,EnsembleDay} from '../../src/weather';
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
 it('rounds expected wet days only in presentation and retains the continuous expectation',()=>{
  const summary=summarizeTravelPeriod([point(1,{wetProbability:30}),point(2,{wetProbability:30})]);
  expect(summary.wetDaysExpected).toBeCloseTo(.6);
  expect(travelNarrative(summary,'dry',false)).toContain('rund 1 Niederschlagstage');
  const absent=summarizeTravelPeriod([point(1,{wetProbability:NaN}),point(2,{wetProbability:0})]);
  expect(travelNarrative(absent,'dry',false)).not.toMatch(/rund (?:NaN|0) Niederschlagstage/);
 });
 it('ranks real zero snow and excludes incomplete snow evidence instead of fabricating a score',()=>{
  const dataset:TravelClimateDataset={createdAt:0,latitude:0,longitude:0,timezone:'UTC',source:'fixture',referencePeriod:'1991–2020',snowDepthIncluded:true,days:{
   '01-01':{...base,key:'01-01',snowDepthMean:0,snowCoverProbability:0,snowfallMean:2000},
   '01-02':{...base,key:'01-02',snowDepthMean:0,snowCoverProbability:0,snowfallMean:2000},
   '01-03':{...base,key:'01-03',snowDepthMean:40,snowCoverProbability:100},
   '01-04':{...base,key:'01-04',snowDepthMean:40,snowCoverProbability:100}
  }};
  const results=bestTravelWindows(dataset,'2027-01-01','2027-01-04',2,'snow',{},3);
  expect(results[0]?.start).toBe('2027-01-03');
  expect(results.find(x=>x.start==='2027-01-01')?.score).toBe(0);
  dataset.days['01-03'].snowCoverProbability=NaN;
  expect(bestTravelWindows(dataset,'2027-01-03','2027-01-04',2,'snow')).toEqual([]);
  expect(travelNarrative(summarizeTravelPeriod([point(1,{snowfallMean:NaN}),point(2)]),'snow',true)).not.toMatch(/NaN|zusätzlich rund 0 cm Schnee/);
 });
 it('retains the >=1 mm climate event when operational probability thresholds differ',()=>{
  const climate={...base,wetProbability:50,precipitationMean:2};
  for(const pop of [0,12.5,75,100]){
   const ensemble={precipitationMean:8,precipitationProbability:pop,precipitationProbabilitySignificant:12.5} as EnsembleDay;
   const best={precipitation:7,probability:100,code:61} as Day;
   const result=mediumDay(climate,ensemble,best,0).day;
   expect(result.wetProbability).toBe(50);
   expect(result.precipitationMean).toBeCloseTo(7.64);
   expect(mediumDay(climate,undefined,best,0).day.wetProbability).toBe(50);
  }
  expect(climate.wetProbability).toBe(50);
  expect(mediumDay({...climate,wetProbability:0},undefined,{probability:100,code:61} as Day,0).day.wetProbability).toBe(0);
  expect(mediumDay({...climate,wetProbability:NaN},undefined,{probability:100,code:61} as Day,0).day.wetProbability).toBeNaN();
 });
 it('keeps climate expected counts distinct from probability of any event and marks stored evidence',()=>{
  const summary=summarizeTravelPeriod([point(1,{wetProbability:50}),point(2,{wetProbability:50})]);
  expect(summary.wetDaysExpected).toBe(1);
  expect(summary.wetDayBasis).toBe('climatology-ge1mm');
  const narrative=travelNarrative(summary,'dry',false,'Modellprognose + Klima');
  expect(narrative).toContain('Klimatologisch werden im Mittel rund 1 Niederschlagstage');
  expect(narrative).not.toContain('überwiegend trocken');
  const restored=JSON.parse(JSON.stringify(summary));
  expect(restored.wetDayBasis).toBe('climatology-ge1mm');
 });
 it('empty and overflowing aggregates are not physical zero',()=>{
  expect(summarizeTravelPeriod([]).precipitationTotal).toBeNaN();
  expect(travelFieldStats([{t:Number.MAX_VALUE},{t:Number.MAX_VALUE}],'t').sum).toBeNaN();
 });
});
