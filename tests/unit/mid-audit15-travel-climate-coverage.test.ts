import {describe,expect,it} from 'vitest';
import {assessTravelClimateYears,assessTravelFieldCoverage} from '../../tools/audit/travelClimateCoverageEvidence';

describe('MID Audit 1.5 · climate field coverage, never missing-as-zero',()=>{
 it('keeps partial temperature and rainfall from claiming complete means or totals',()=>{
  const temperature=assessTravelFieldCoverage([20,NaN],'temperature');
  expect(temperature).toMatchObject({status:'partial',valid:1,total:2,completeMean:null,observedMean:20});
  const rain=assessTravelFieldCoverage([2,NaN],'nonnegative');
  expect(rain).toMatchObject({status:'partial',valid:1,total:2,completeSum:null,observedMean:2});
 });
 it('keeps true dry zero and untrimmed physical precipitation extremes',()=>{
  expect(assessTravelFieldCoverage([0,0],'nonnegative')).toMatchObject({status:'complete',completeSum:0,completeMean:0});
  expect(assessTravelFieldCoverage([2000,0],'nonnegative').completeSum).toBe(2000);
 });
 it('rejects negative rainfall but keeps unaffected valid samples',()=>{
  expect(assessTravelFieldCoverage([-999,2],'nonnegative')).toMatchObject({status:'partial',valid:1,completeSum:null,observedMean:2});
 });
 it('does not coerce null, numeric strings, booleans or JSON-null legacy caches to zero',()=>{
  const values=[null,'0',false,0];
  expect(assessTravelFieldCoverage(values,'nonnegative')).toMatchObject({valid:1,total:4,completeSum:null});
  expect(assessTravelFieldCoverage(JSON.parse(JSON.stringify([NaN,0])),'nonnegative').valid).toBe(1);
 });
 it('does not admit impossible probabilities or invent overcast WMO icons',()=>{
  expect(assessTravelFieldCoverage([101,99],'probability').status).toBe('partial');
  expect(assessTravelFieldCoverage([null,null],'wmo-code')).toMatchObject({status:'missing',completeMean:null});
  expect(assessTravelFieldCoverage([99,0],'wmo-code').status).toBe('complete');
 });
 it('does not count duplicate years or pretend 20 valid years are complete 30-year coverage',()=>{
  const rows=Array.from({length:20},(_,index)=>({year:1991+index,value:0}));
  expect(assessTravelClimateYears(rows,'nonnegative')).toMatchObject({status:'sufficient',complete:false,validYears:20});
  expect(assessTravelClimateYears([...rows,{year:1991,value:0}],'nonnegative'))
   .toMatchObject({status:'insufficient',validYears:19,conflictingYears:1});
 });
 it('reports original Feb 29 evidence as insufficient without fabricating 30 climate years',()=>{
  const rows=Array.from({length:8},(_,index)=>({year:1992+4*index,value:1}));
  expect(assessTravelClimateYears(rows,'nonnegative')).toMatchObject({status:'insufficient',validYears:8,referenceMean:null});
 });
 it('retains actual extremes and rejects missing climate-year values',()=>{
  expect(assessTravelClimateYears(Array.from({length:20},(_,index)=>({year:1991+index,value:index===0?2000:0})),'nonnegative'))
    .toMatchObject({status:'sufficient',referenceMean:100});
  expect(assessTravelClimateYears([{year:1991,value:null},{year:1992,value:-999}],'nonnegative'))
    .toMatchObject({status:'insufficient',validYears:0,referenceMean:null});
 });
});
