import {describe,expect,it} from 'vitest';
import {assessMidSourceStamp,summarizeMidDisplayStamps,type MidSourceStamp} from '../../src/sourceTimeIntegrityEvidence';
const now=Date.parse('2026-11-18T00:00:00Z'),H=3600000;
const f=(overrides:Partial<MidSourceStamp>={}):MidSourceStamp=>({
 sourceId:'dwd/icon-d2',fieldId:'temperature-2m',unit:'K',product:'forecast',
 cell:'instant',provenance:'provider-native',
 modelRunAt:'2026-11-17T21:00:00Z',
 validAt:'2026-11-19T00:00:00Z',
 receivedAt:'2026-11-17T22:05:00Z',sourceAgeBudgetMs:4*H,...overrides
});
describe('MID Audit 1.1 · time provenance and absolute accumulation windows',()=>{
 it('accepts a future forecast valid time but assesses freshness using model run, not download time',()=>{
  const row=assessMidSourceStamp(f(),now);
  expect(row).toMatchObject({integrity:'verified',freshness:'within-budget',reason:'time-structure-verified'});
  expect(row.validAtMs).toBe(Date.parse('2026-11-19T00:00:00Z'));
 });
 it('never declares an old run fresh merely because it was just downloaded',()=>{
  const row=assessMidSourceStamp(f({modelRunAt:'2026-11-17T10:00:00Z',receivedAt:'2026-11-17T23:59:00Z'}),now);
  expect(row).toMatchObject({integrity:'verified',freshness:'over-budget'});
  expect(assessMidSourceStamp(f({sourceAgeBudgetMs:undefined}),now).freshness).toBe('unknown');
 });
 it('rejects a rain sum without authentic original accumulation bounds',()=>{
  const rain=f({cell:'sum',fieldId:'rain',unit:'mm'});
  expect(assessMidSourceStamp(rain,now)).toMatchObject({integrity:'incomplete',reason:'missing-native-interval'});
  expect(assessMidSourceStamp({...rain,periodStartAt:'2026-11-18T23:00:00Z',periodEndAt:'2026-11-19T00:00:00Z'},now).integrity).toBe('verified');
  expect(assessMidSourceStamp({...rain,periodStartAt:'2026-11-18T23:00:00Z',periodEndAt:'2026-11-19T01:00:00Z'},now)).toMatchObject({integrity:'contradictory',reason:'invalid-interval-or-end-stamp'});
 });
 it('rejects unknown provenance, invalid time zones, impossible dates and offsetless timestamps',()=>{
  expect(assessMidSourceStamp(f({provenance:'derived'}),now).integrity).toBe('incomplete');
  expect(assessMidSourceStamp(f({modelRunAt:'2026-11-17T21:00:00'}),now).integrity).toBe('incomplete');
  for(const validAt of ['2026-02-30T10:00:00Z','2026-11-19T00:00:00+15:00','2026-11-19T24:00:00Z','2026-11-19']){
   expect(assessMidSourceStamp(f({validAt}),now).integrity).toBe('incomplete');
  }
 });
 it('rejects run and source publication after original browser receipt',()=>{
  expect(assessMidSourceStamp(f({modelRunAt:'2026-11-17T23:00:00Z'}),now)).toMatchObject({integrity:'contradictory',reason:'run-after-forecast-or-receipt'});
  expect(assessMidSourceStamp(f({receivedAt:'2026-11-18T00:06:00Z'}),now)).toMatchObject({integrity:'contradictory',reason:'receipt-in-future'});
  expect(assessMidSourceStamp(f({publishedAt:'2026-11-17T22:06:00Z'}),now)).toMatchObject({integrity:'contradictory',reason:'inconsistent-publication-time'});
 });
 it('accepts true DST-offset absolute instants but refuses made-up period semantics',()=>{
  const stamp='2026-10-25T02:30:00+02:00';
  const other='2026-10-25T02:30:00+01:00';
  const a=assessMidSourceStamp(f({product:'observation',modelRunAt:undefined,validAt:stamp,receivedAt:'2026-10-25T03:35:00+01:00'}),now);
  const b=assessMidSourceStamp(f({product:'observation',modelRunAt:undefined,validAt:other,receivedAt:'2026-10-25T03:35:00+01:00'}),now);
  expect(a.integrity).toBe('verified');
  expect(b.integrity).toBe('verified');
  expect(b.validAtMs!-a.validAtMs!).toBe(H);
  expect(assessMidSourceStamp(f({periodStartAt:stamp}),now)).toMatchObject({integrity:'contradictory',reason:'instant-with-period'});
 });
 it('separates official-warning issuance from forecast-cycle freshness',()=>{
  const warning=assessMidSourceStamp(f({product:'official-warning',modelRunAt:undefined,issuedAt:'2026-11-17T20:00:00Z',validAt:'2026-11-19T00:00:00Z',sourceAgeBudgetMs:H}),now);
  expect(warning).toMatchObject({integrity:'verified',freshness:'unknown'});
  expect(assessMidSourceStamp(f({product:'official-warning',modelRunAt:undefined,issuedAt:undefined}),now).integrity).toBe('incomplete');
 });
 it('does not present source frishness when provider budget is missing',()=>{
  const rows=[{usedInDisplay:true,product:'forecast' as const,audit:assessMidSourceStamp(f({sourceAgeBudgetMs:undefined}),now)}];
  expect(summarizeMidDisplayStamps(rows,15*60000).band).toBe('unverified-freshness');
 });
 it('flags mixed actually displayed product times without mixing official warnings',()=>{
  const a=assessMidSourceStamp(f(),now);
  const b=assessMidSourceStamp(f({validAt:'2026-11-19T01:00:00Z',sourceId:'ecmwf/ifs'}),now);
  const warning=assessMidSourceStamp(f({product:'official-warning',modelRunAt:undefined,issuedAt:'2026-11-17T20:00:00Z',validAt:'2026-11-20T05:00:00Z'}),now);
  expect(summarizeMidDisplayStamps([
   {usedInDisplay:true,product:'forecast',audit:a},
   {usedInDisplay:true,product:'forecast',audit:b},
   {usedInDisplay:true,product:'official-warning',audit:warning},
   {usedInDisplay:false,product:'forecast',audit:assessMidSourceStamp(f({validAt:'2026-11-30T00:00:00Z'}),now)},
  ],15*60000)).toMatchObject({band:'mixed',checked:3,comparable:2,validSpanMs:H});
  expect(summarizeMidDisplayStamps([{usedInDisplay:true,product:'forecast',audit:a}],15*60000).band).toBe('current');
 });
 it('gives contradictions, missing evidence and stale fields explicit precedence',()=>{
  const stale=assessMidSourceStamp(f({modelRunAt:'2026-11-17T10:00:00Z'}),now);
  const bad=assessMidSourceStamp(f({validAt:'2026-11-19T00:00:00'}),now);
  const x=[{usedInDisplay:true,product:'forecast' as const,audit:stale},
           {usedInDisplay:true,product:'forecast' as const,audit:bad}];
  expect(summarizeMidDisplayStamps(x,0)).toMatchObject({band:'incomplete',checked:2,stale:1,incomplete:1});
  expect(summarizeMidDisplayStamps(x,NaN).band).toBe('contradictory');
  expect(summarizeMidDisplayStamps([],0).band).toBe('empty');
 });
});
