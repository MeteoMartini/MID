import {describe,expect,it} from 'vitest';
import {summarizeTwinIndependentStationSkill,type TwinStationPair} from '../../src/twinIndependentStationSkillEvidence';
const DAY=86400000;
const ms=(x:string)=>Date.parse(x);
const origin=ms('2026-10-01T00:00:00Z');
const window={startMs:origin-10*DAY,endMs:origin+100*DAY};
function base(i:number,changes:Partial<TwinStationPair>={}):TwinStationPair{
 const validStartMs=origin+i*DAY+12*3600000;
 return {stationId:'DWD-01234',timeZone:'Europe/Berlin',localTargetDate:new Date(origin+i*DAY).toISOString().slice(0,10),
  parameter:'temperature',sourceType:'official-measured',qualityStatus:'historical-checked',
  stationMetadataVerified:true,issuedAtMs:validStartMs-24*3600000,
  archivedAtMs:validStartMs-23*3600000,validStartMs,validEndMs:validStartMs,
  observedAvailableAtMs:validStartMs+60000,candidate:9,baseline:11,observed:10,...changes};
}
describe('MID Audit 1.1 · DWD-independent prospective paired skill diagnostic',()=>{
 it('compares one identical checked station observation to baseline and candidate',()=>{
  const result=summarizeTwinIndependentStationSkill([base(0),base(1)],window);
  expect(result.acceptedPairs).toBe(2);
  expect(result.groups).toHaveLength(1);
  expect(result.groups[0]).toMatchObject({parameter:'temperature',leadBand:'6-24h',independentDays:2,candidateError:1,baselineError:1,improvement:0,status:'insufficient-days',bootstrap95:null});
 });
 it('never treats model, reanalysis, provisional or private sensor as checked independent DWD evidence',()=>{
  const rows=[
   base(0,{sourceType:'model-fallback'}),
   base(1,{sourceType:'analysis'}),
   base(2,{sourceType:'private-sensor'}),
   base(3,{qualityStatus:'recent-provisional'}),
   base(4,{stationMetadataVerified:false}),
   base(5,{observed:NaN}),
  ];
  const report=summarizeTwinIndependentStationSkill(rows,window);
  expect(report.acceptedPairs).toBe(0);
  expect(report.rejected['not-independent-or-not-comparable']).toBe(6);
 });
 it('rejects hindsight forecasts, later archive writes and pre-observation leakage',()=>{
  const raw=base(0);
  const report=summarizeTwinIndependentStationSkill([
   base(0,{issuedAtMs:raw.validStartMs,archivedAtMs:raw.validStartMs}),
   base(1,{archivedAtMs:base(1).validStartMs+1}),
   base(2,{observedAvailableAtMs:base(2).validEndMs-1}),
   base(3,{issuedAtMs:base(3).archivedAtMs+1}),
  ],window);
  expect(report.acceptedPairs).toBe(0);
 });
 it('does not manufacture dry rain from incomplete periods, negative or missing amounts',()=>{
  const day=base(0);
  const start=day.validStartMs;
  const rain={parameter:'precipitation',validStartMs:start,validEndMs:start+3600000,observedAvailableAtMs:start+3600000+60000,issuedAtMs:start-24*3600000,archivedAtMs:start-23*3600000,accumulationComplete:false,candidate:0,baseline:0,observed:0} as const;
  expect(summarizeTwinIndependentStationSkill([base(0,rain)],window).acceptedPairs).toBe(0);
  expect(summarizeTwinIndependentStationSkill([base(0,{...rain,accumulationComplete:true,observed:-1})],window).acceptedPairs).toBe(0);
  expect(summarizeTwinIndependentStationSkill([base(0,{...rain,accumulationComplete:true,observed:NaN})],window).acceptedPairs).toBe(0);
  const good=summarizeTwinIndependentStationSkill([base(0,{...rain,accumulationComplete:true,observed:100000,candidate:100001,baseline:100002})],window);
  expect(good.groups[0]).toMatchObject({candidateError:1,baselineError:2,improvement:1});
 });
 it('computes Brier only for probability fractions and one explicit observed rain threshold',()=>{
  const row=base(0),start=row.validStartMs;
  const rain={parameter:'rain-probability',validStartMs:start,validEndMs:start+3600000,observedAvailableAtMs:start+3660000,accumulationComplete:true,observed:0.3,candidate:.8,baseline:.6,rainThresholdMm:.2} as const;
  const report=summarizeTwinIndependentStationSkill([base(0,rain),base(1,{...rain,validStartMs:base(1).validStartMs,validEndMs:base(1).validStartMs+3600000,observedAvailableAtMs:base(1).validStartMs+3660000,issuedAtMs:base(1).validStartMs-24*3600000,archivedAtMs:base(1).validStartMs-23*3600000,observed:.1,candidate:.2,baseline:.9})],window);
  expect(report.groups[0].pairedCases).toBe(2);
  expect(report.groups[0].candidateError).toBeCloseTo((.04+.04)/2);
  expect(report.groups[0].baselineError).toBeCloseTo((.16+.81)/2);
  expect(summarizeTwinIndependentStationSkill([base(2,{...rain,candidate:80})],window).acceptedPairs).toBe(0);
  expect(summarizeTwinIndependentStationSkill([base(2,{...rain,rainThresholdMm:0})],window).acceptedPairs).toBe(0);
 });
 it('counts duplicate paired records zero times; unique station-day pairs cannot inflate independent days',()=>{
  const first=base(0);
  const station2=base(0,{stationId:'DWD-05432',candidate:10,baseline:12});
  const report=summarizeTwinIndependentStationSkill([first,first,station2],window);
  expect(report.acceptedPairs).toBe(1);
  expect(report.groups[0]).toMatchObject({pairedCases:1,independentDays:1,candidateError:0,baselineError:2});
  expect(report.rejected['duplicate-pair']).toBe(2);
 });
 it('uses an exploratory deterministic seven-day block interval only for 30 consecutive days',()=>{
  const rows=Array.from({length:35},(_,i)=>base(i,{candidate:10,baseline:12}));
  const first=summarizeTwinIndependentStationSkill(rows,window);
  const second=summarizeTwinIndependentStationSkill(rows,window);
  expect(first).toEqual(second);
  expect(first.groups[0]).toMatchObject({pairedCases:35,independentDays:35,candidateError:0,baselineError:2,improvement:2,status:'exploratory-only'});
  expect(first.groups[0].bootstrap95?.lower).toBeCloseTo(2);
  expect(first.groups[0].bootstrap95?.upper).toBeCloseTo(2);
  const gapped=summarizeTwinIndependentStationSkill(rows.filter((_,i)=>i!==10),window);
  expect(gapped.groups[0].bootstrap95).toBeNull();
  expect(gapped.groups[0].status).toBe('insufficient-days');
 });
 it('keeps real local calendar days at DST boundaries, and rejects invalid periods',()=>{
  const a=ms('2026-03-29T12:00:00Z'),b=ms('2026-10-25T12:00:00Z');
  const spring=base(0,{localTargetDate:'2026-03-29',validStartMs:a,validEndMs:a,
   issuedAtMs:a-DAY,archivedAtMs:a-DAY+3600000,observedAvailableAtMs:a+60000});
  const autumn=base(1,{localTargetDate:'2026-10-25',validStartMs:b,validEndMs:b,
   issuedAtMs:b-DAY,archivedAtMs:b-DAY+3600000,observedAvailableAtMs:b+60000});
  const wide={startMs:ms('2026-03-01T00:00:00Z'),endMs:ms('2026-11-01T00:00:00Z')};
  expect(summarizeTwinIndependentStationSkill([spring,autumn],wide).groups[0].independentDays).toBe(2);
  expect(summarizeTwinIndependentStationSkill([base(0,{localTargetDate:'2026-02-30'})],window).acceptedPairs).toBe(0);
  expect(summarizeTwinIndependentStationSkill([base(0,{localTargetDate:'2026-09-30'})],window).acceptedPairs).toBe(0);
  expect(summarizeTwinIndependentStationSkill([base(0,{timeZone:'Bad/Invalid'})],window).acceptedPairs).toBe(0);
  expect(summarizeTwinIndependentStationSkill([base(0)],{startMs:10,endMs:1}).validWindow).toBe(false);
 });
});
