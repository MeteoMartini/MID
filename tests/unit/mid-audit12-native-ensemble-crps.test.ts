import {describe,expect,it} from 'vitest';
import {empiricalEnsembleCrps,summarizeTwinEnsembleCrps,type TwinEnsembleCrpsCase} from '../../src/twinEnsembleCrpsEvidence';

const H=3600000;
const valid=Date.parse('2026-11-17T12:00:00Z');
const forecastSha256='a'.repeat(64);
const window={startMs:valid-24*H,endMs:valid+48*H};
function make(overrides:Partial<TwinEnsembleCrpsCase>={}):TwinEnsembleCrpsCase{
 return {
  siteKey:'Eil',stationId:'DWD-test-station',timeZone:'Europe/Berlin',
  localTargetDate:'2026-11-17',variable:'temperature',modelId:'IFS-ENS',sourceRunId:'20261117-00',
  initialisedAtMs:valid-18*H,issuedAtMs:valid-12*H,archivedAtMs:valid-11*H,
  validStartMs:valid,validEndMs:valid,observationAvailableAtMs:valid+H,
  observationSource:'official-measured',observationQuality:'historical-checked',
  stationMetadataVerified:true,spatialMatchVerified:true,
  forecastUnit:'celsius',observationUnit:'celsius',observed:1,
  originalNativeMembers:true,forecastSha256,expectedMembers:2,
  memberIds:['m01','m02'],members:[0,2],...overrides
 };
}
describe('MID Audit 1.2 · independent native ensemble CRPS (QA only)',()=>{
 it('uses the proper empirical CRPS rather than ensemble mean absolute error',()=>{
  expect(empiricalEnsembleCrps([0,2],1)).toBe(.5);
  expect(empiricalEnsembleCrps([0,1,2],1)).toBeCloseTo(2/9,12);
  expect(empiricalEnsembleCrps([5,5,5],5)).toBe(0);
  expect(empiricalEnsembleCrps([5,5,5],6)).toBe(1);
 });
 it('does not hide extreme original members or replace missing with zero',()=>{
  expect(empiricalEnsembleCrps([0,500],0)).toBe(125);
  for(const members of [[],[0],[0,Number.NaN],[0,Infinity],[0,-Infinity]]){
   expect(empiricalEnsembleCrps(members,0)).toBeNull();
  }
  expect(empiricalEnsembleCrps([0,2],Number.NaN)).toBeNull();
  expect(empiricalEnsembleCrps([Number.MAX_VALUE,Number.MAX_VALUE],0)).toBeNull();
 });
 it('requires original complete native members and unambiguous units',()=>{
  const cases=[
   {expectedMembers:3},{memberIds:['m01','m01']},
   {members:[1,Number.NaN]},{originalNativeMembers:false},
   {forecastSha256:'not-a-sha'}, {forecastUnit:'kelvin' as const},
   {observationUnit:'inches' as const},{modelId:''},{sourceRunId:''}
  ];
  for(const change of cases){
   expect(summarizeTwinEnsembleCrps([make(change)],window).acceptedCases).toBe(0);
  }
 });
 it('rejects reanalysis, provisional, private and unverified spatial references',()=>{
  const cases=[
   {observationSource:'reanalysis' as const},
   {observationSource:'private-sensor' as const},
   {observationSource:'model-fallback' as const},
   {observationQuality:'recent-provisional' as const},
   {stationMetadataVerified:false},{spatialMatchVerified:false}
  ];
  for(const change of cases){
   expect(summarizeTwinEnsembleCrps([make(change)],window).acceptedCases).toBe(0);
  }
 });
 it('rejects hindsight, mismatched validity, future observations and invalid dates',()=>{
  const cases=[
   {archivedAtMs:valid},{issuedAtMs:valid+H},
   {initialisedAtMs:valid},{observationAvailableAtMs:valid-H},
   {observationAvailableAtMs:window.endMs+H},
   {validEndMs:valid+H},{localTargetDate:'2026-11-18'},
   {timeZone:'Invalid/Zone'},{localTargetDate:'2026-02-30'}
  ];
  for(const change of cases){
   expect(summarizeTwinEnsembleCrps([make(change)],window).acceptedCases).toBe(0);
  }
 });
 it('recognizes native 23h and 25h local accumulation days without fabricated 24h windows',()=>{
  const springStart=Date.parse('2026-03-28T23:00:00Z'),springEnd=Date.parse('2026-03-29T22:00:00Z');
  const autumnStart=Date.parse('2026-10-24T22:00:00Z'),autumnEnd=Date.parse('2026-10-25T23:00:00Z');
  const rain=(start:number,end:number,date:string)=>make({
   variable:'precipitation',localTargetDate:date,
   validStartMs:start,validEndMs:end,initialisedAtMs:start-18*H,
   issuedAtMs:start-12*H,archivedAtMs:start-11*H,observationAvailableAtMs:end+H,
   forecastUnit:'millimetres',observationUnit:'millimetres',accumulationComplete:true,
   observed:500,members:[400,600]
  });
  for(const [start,end,date,minutes] of [
   [springStart,springEnd,'2026-03-29',1380],
   [autumnStart,autumnEnd,'2026-10-25',1500]
  ] as const){
   const sample=rain(start,end,date),bounds={startMs:start,endMs:end+2*H};
   const result=summarizeTwinEnsembleCrps([sample],bounds);
   expect(result.acceptedCases).toBe(1);
   expect(result.groups[0].accumulationMinutes).toBe(minutes);
   expect(summarizeTwinEnsembleCrps([{...sample,accumulationComplete:false}],bounds).acceptedCases).toBe(0);
   expect(summarizeTwinEnsembleCrps([{...sample,members:[-1,500]}],bounds).acceptedCases).toBe(0);
  }
 });
 it('excludes all conflicting duplicate captures instead of selecting the most favorable run',()=>{
  const result=summarizeTwinEnsembleCrps([make(),make({sourceRunId:'other-run',observed:2})],window);
  expect(result.acceptedCases).toBe(0);
  expect(result.rejected['ambiguous-duplicate']).toBe(2);
  expect(result.groups).toEqual([]);
 });
 it('weights verified local days equally, never raw member or within-day sample counts',()=>{
  const a=make(),b=make({validStartMs:valid+2*H,validEndMs:valid+2*H,observationAvailableAtMs:valid+3*H,observed:5});
  const next=valid+24*H;
  const c=make({validStartMs:next,validEndMs:next,issuedAtMs:next-12*H,
   initialisedAtMs:next-18*H,archivedAtMs:next-11*H,observationAvailableAtMs:next+H,localTargetDate:'2026-11-18'});
  const result=summarizeTwinEnsembleCrps([a,b,c],window);
  expect(result.acceptedCases).toBe(3);
  expect(result.groups).toHaveLength(1);
  expect(result.groups[0].independentDays).toBe(2);
  expect(result.groups[0].meanCrps).toBeCloseTo(1.25,12);
  expect(result.groups[0].observedWithinP10P90).toBeCloseTo(.75,12);
  expect(result.groups[0].status).toBe('insufficient-days');
 });
 it('never mixes model families, accumulation lengths, or forecast lead bands',()=>{
  const alt=make({modelId:'ICON-EPS',members:[0,4]});
  const short=make({issuedAtMs:valid-3*H,initialisedAtMs:valid-12*H,archivedAtMs:valid-2*H});
  const r=summarizeTwinEnsembleCrps([make(),alt,short],window);
  // Two IFS runs for the same target and same lead bucket would conflict;
  // here 3h and 12h belong to separate lead buckets and stay distinct.
  expect(r.acceptedCases).toBe(3);
  expect(r.groups).toHaveLength(3);
  expect(new Set(r.groups.map(g=>g.modelId+'|'+g.leadBand)).size).toBe(3);
 });
 it('requires 30 distinct verified dates for an exploratory label, never grants skill',()=>{
  const samples=Array.from({length:30},(_,i)=>{
   const time=Date.UTC(2026,9,1+i,12);
   return make({timeZone:'UTC',localTargetDate:new Date(time).toISOString().slice(0,10),
    validStartMs:time,validEndMs:time,issuedAtMs:time-12*H,
    initialisedAtMs:time-18*H,archivedAtMs:time-11*H,observationAvailableAtMs:time+H});
  });
  const bounds={startMs:samples[0].validStartMs-1,endMs:samples.at(-1)!.validEndMs+2*H};
  const fewer=summarizeTwinEnsembleCrps(samples.slice(0,29),bounds);
  const all=summarizeTwinEnsembleCrps(samples,bounds);
  expect(fewer.groups[0].status).toBe('insufficient-days');
  expect(all.groups[0].independentDays).toBe(30);
  expect(all.groups[0].status).toBe('exploratory-only');
  expect(all.statement).toBe('research-only-no-skill-claim');
  expect(all.groups[0].meanCrps).toBeCloseTo(.5,12);
  expect(summarizeTwinEnsembleCrps([...samples].reverse(),bounds).groups).toEqual(all.groups);
 });
 it('fails closed on invalid windows and the fixed CPU/memory input budget',()=>{
  expect(summarizeTwinEnsembleCrps([make()],{startMs:valid,endMs:valid}).validWindow).toBe(false);
  expect(summarizeTwinEnsembleCrps([make()],{startMs:NaN,endMs:valid}).validWindow).toBe(false);
  expect(summarizeTwinEnsembleCrps(Array(10001).fill(make()),window).validWindow).toBe(false);
 });
});
