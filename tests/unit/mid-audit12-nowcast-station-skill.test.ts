import {describe,expect,it} from 'vitest';
import {summarizeTwinNowcastVerification,type NowcastCase} from '../../src/twinNowcastVerificationEvidence';
const M=60000,base=Date.parse('2026-11-17T10:00:00Z');
const sha='a'.repeat(64),other='b'.repeat(64);
function sample(override:Partial<NowcastCase>={}):NowcastCase{
 const validStartMs=base,validEndMs=base+15*M;
 return {siteKey:'Eil',stationId:'DWD-test',modelId:'MID-RV',localTargetDate:'2026-11-17',
 timeZone:'Europe/Berlin',issuedAtMs:base-5*M,archivedAtMs:base-2*M,
 validStartMs,validEndMs,observedAvailableAtMs:validEndMs+5*M,
 forecastSha256:sha,baselineSha256:other,referenceKind:'official-measured',
 referenceQuality:'historical-checked',stationMetadataVerified:true,spatialMatchVerified:true,
 forecastOrigin:'original-mid',baselineOrigin:'preissue-persistence',baselineIssuedAtMs:base-10*M,
 probabilityOrigin:'raw-heuristic',rainThresholdMm:.1,forecastProbability:.8,baselineProbability:.3,
 observations:[{startMs:base,endMs:base+5*M,amountMm:0,complete:true},
 {startMs:base+5*M,endMs:base+10*M,amountMm:.1,complete:true},
 {startMs:base+10*M,endMs:validEndMs,amountMm:.2,complete:true}],
 ...override};
}
const window={startMs:base-24*60*M,endMs:base+48*60*M};
describe('MID Audit 1.2 · independent 15/30/60 min nowcast verification (QA-only)',()=>{
 it('calculates paired Brier on exact native interval, with independent-day attribution',()=>{
  const r=summarizeTwinNowcastVerification([sample()],window);
  expect(r.acceptedCases).toBe(1);expect(r.groups[0].independentDays).toBe(1);
  expect(r.groups[0].candidateBrier).toBeCloseTo(.04);
  expect(r.groups[0].baselineBrier).toBeCloseTo(.49);
  expect(r.groups[0].relativeSkill).toBeNull();
  expect(r.groups[0].reliability.every(x=>x.observedFrequency===null)).toBe(true);
 });
 it('distinguishes genuine dry 0 mm from missing data',()=>{
  const dry=sample({observations:[{startMs:base,endMs:base+15*M,amountMm:0,complete:true}]});
  expect(summarizeTwinNowcastVerification([dry],window).groups[0].eventCases).toBe(0);
  for(const obs of [[{startMs:base,endMs:base+15*M,amountMm:NaN,complete:true}],
    [{startMs:base,endMs:base+15*M,amountMm:0,complete:false}],
    [{startMs:base,endMs:base+5*M,amountMm:0,complete:true}]]){
   expect(summarizeTwinNowcastVerification([sample({observations:obs})],window).acceptedCases).toBe(0);
  }
 });
 it('rejects gaps, overlapping intervals, negative and overflowing accumulation',()=>{
  const cases=[
   [{startMs:base,endMs:base+5*M,amountMm:1,complete:true},{startMs:base+6*M,endMs:base+15*M,amountMm:1,complete:true}],
   [{startMs:base,endMs:base+8*M,amountMm:1,complete:true},{startMs:base+7*M,endMs:base+15*M,amountMm:1,complete:true}],
   [{startMs:base,endMs:base+15*M,amountMm:-1,complete:true}],
   [{startMs:base,endMs:base+15*M,amountMm:Number.MAX_VALUE,complete:true},{startMs:base+15*M,endMs:base+15*M,amountMm:Number.MAX_VALUE,complete:true}],
  ];
  for(const observations of cases)expect(summarizeTwinNowcastVerification([sample({observations})],window).acceptedCases).toBe(0);
 });
 it('blocks hindsight, reenactment, radar self-verification and provisional gauge data',()=>{
  const cases:Partial<NowcastCase>[]=[
   {archivedAtMs:base+M},{issuedAtMs:base+M},{issuedAtMs:base-20*M},
   {forecastOrigin:'reconstructed'},{forecastOrigin:'historical-replay'},
   {referenceKind:'radar-product'},{referenceQuality:'recent-provisional'},
   {stationMetadataVerified:false},{spatialMatchVerified:false},
   {baselineOrigin:'posthoc'},{baselineIssuedAtMs:base+M},
   {forecastSha256:'wrong'}
  ];
  for(const c of cases)expect(summarizeTwinNowcastVerification([sample(c)],window).acceptedCases).toBe(0);
 });
 it('requires exact 15, 30 or 60-minute windows and fully tiling source slots',()=>{
  for(const minutes of [5,20,90]){
   expect(summarizeTwinNowcastVerification([sample({validEndMs:base+minutes*M,observedAvailableAtMs:base+(minutes+5)*M})],window).acceptedCases).toBe(0);
  }
  for(const horizon of [30,60] as const){
   const observed=Array.from({length:horizon/5},(_,i)=>({startMs:base+i*5*M,endMs:base+(i+1)*5*M,amountMm:.01,complete:true}));
   const r=summarizeTwinNowcastVerification([sample({validEndMs:base+horizon*M,observedAvailableAtMs:base+(horizon+2)*M,observations:observed})],window);
   expect(r.groups[0].horizonMinutes).toBe(horizon);
  }
 });
 it('does not interpret overlapping issue revisions as independent favorable skill',()=>{
  const rows=[sample(),sample({issuedAtMs:base-3*M,archivedAtMs:base-M,forecastProbability:1})];
  const r=summarizeTwinNowcastVerification(rows,window);
  expect(r.acceptedCases).toBe(0);expect(r.rejected['ambiguous-duplicate']).toBe(2);
 });
 it('checks local date at DST and midnight end rather than UTC day',()=>{
  const end=Date.parse('2026-10-25T23:00:00Z'),start=end-15*M;
  const r=summarizeTwinNowcastVerification([sample({
   validStartMs:start,validEndMs:end,issuedAtMs:start-5*M,archivedAtMs:start-2*M,
   baselineIssuedAtMs:start-10*M,observedAvailableAtMs:end+M,
   localTargetDate:'2026-10-25',observations:[{startMs:start,endMs:end,amountMm:0,complete:true}]
  })],{startMs:start-60*M,endMs:end+60*M});
  expect(r.acceptedCases).toBe(1);
 });
 it('separates provenance, source, threshold, location and 15/60-min cohorts',()=>{
  const h60=sample({validEndMs:base+60*M,observedAvailableAtMs:base+61*M,observations:[{startMs:base,endMs:base+60*M,amountMm:1,complete:true}]});
  const otherSite=sample({siteKey:'Mondorf',stationId:'DWD-other'});
  const rainThreshold=sample({rainThresholdMm:.5});
  const r=summarizeTwinNowcastVerification([sample(),h60,otherSite,rainThreshold],window);
  expect(r.acceptedCases).toBe(4);expect(r.groups).toHaveLength(4);
 });
 it('requires 30 independent days for descriptive reliability; rare-event denominators stay null',()=>{
  const rows=Array.from({length:30},(_,i)=>{
   const start=Date.UTC(2026,9,1+i,10);
   return sample({timeZone:'UTC',localTargetDate:new Date(start).toISOString().slice(0,10),
    issuedAtMs:start-5*M,archivedAtMs:start-2*M,validStartMs:start,validEndMs:start+15*M,
    observedAvailableAtMs:start+16*M,baselineIssuedAtMs:start-10*M,
    observations:[{startMs:start,endMs:start+15*M,amountMm:0,complete:true}],
    forecastProbability:.2,baselineProbability:.4});
  });
  const w={startMs:rows[0].validStartMs-M,endMs:rows[29].validEndMs+30*M};
  const r=summarizeTwinNowcastVerification(rows,w),g=r.groups[0];
  expect(g.independentDays).toBe(30);expect(g.status).toBe('exploratory-only');
  expect(g.csi).toBeNull();expect(g.pod).toBeNull();expect(g.far).toBeNull();
  expect(g.reliability[2].observedFrequency).toBe(0);
  expect(g.candidateBrier).toBeCloseTo(.04);expect(g.baselineBrier).toBeCloseTo(.16);
  expect(r.statement).toBe('research-only-no-public-skill');
 });
 it('never turns a perfect baseline into a synthetic Brier skill percentage',()=>{
  const first=sample({observations:[{startMs:base,endMs:base+15*M,amountMm:0,complete:true}],baselineProbability:0});
  const r=summarizeTwinNowcastVerification([first],window);
  expect(r.groups[0].relativeSkill).toBeNull();
 });
 it('caps unbounded archives and malformed temporal windows fail-closed',()=>{
  expect(summarizeTwinNowcastVerification([sample()],{startMs:base,endMs:base}).validWindow).toBe(false);
  expect(summarizeTwinNowcastVerification([sample()],{startMs:NaN,endMs:base}).validWindow).toBe(false);
  expect(summarizeTwinNowcastVerification(Array(10001).fill(sample()),window).validWindow).toBe(false);
 });
});
