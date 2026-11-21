import {describe,it,expect} from 'vitest';
import {auditTwinForecastCaptureCoverage,type TwinCaptureOpportunity,type TwinCaptureRecord} from '../../src/twinCaptureCoverageEvidence';
const H=3600000;
const t=Date.parse('2026-11-01T00:00:00Z');
const A='a'.repeat(64),B='b'.repeat(64),C='c'.repeat(64);
function schedule(count=8,siteKey='public-grid-eil'):TwinCaptureOpportunity[]{
 return Array.from({length:count},(_,i)=>{
  const issueWindowStartMs=t+i*6*H;
  return {id:siteKey+'-'+i,siteKey,issueWindowStartMs,
   issueWindowEndMs:issueWindowStartMs+H,validStartMs:issueWindowStartMs+24*H,
   validEndMs:issueWindowStartMs+24*H};
 });
}
function captured(slot:TwinCaptureOpportunity,changes:Partial<TwinCaptureRecord>={}):TwinCaptureRecord{
 return {opportunityId:slot.id,siteKey:slot.siteKey,origin:'original-mid-session',
  issuedAtMs:slot.issueWindowStartMs+5*60000,
  archivedAtMs:slot.issueWindowStartMs+10*60000,
  validStartMs:slot.validStartMs,validEndMs:slot.validEndMs,
  archiveAttested:true,forecastSha256:A,
  baselineSha256:B,baselineIssuedAtMs:slot.issueWindowStartMs+5*60000,...changes};
}
describe('MID Audit 1.1 · fixed forecast opportunities reveal missing app-open captures',()=>{
 it('does not call an entirely absent capture history verified or skillful',()=>{
  const report=auditTwinForecastCaptureCoverage(schedule(),[]);
  expect(report).toMatchObject({validSchedule:true,expected:8,original:0,paired:0,
   uncovered:8,longestUncoveredRun:8,coverageFraction:0,statement:'coverage-diagnostic-only'});
  expect(report.utcBins.map(b=>b.planned)).toEqual([2,2,2,2]);
 });
 it('reveals sporadic user-session bias across preplanned UTC issue periods',()=>{
  const slots=schedule(),records=[captured(slots[0]),captured(slots[4])];
  const report=auditTwinForecastCaptureCoverage(slots,records);
  expect(report).toMatchObject({expected:8,original:2,paired:2,originalSession:2,
   originalCentral:0,coverageFraction:.25,pairedFraction:.25});
  expect(report.utcBins.map(b=>b.original)).toEqual([2,0,0,0]);
  expect(report.longestUncoveredRun).toBe(3);
 });
 it('recognizes original central captures but never declares statistical skill',()=>{
  const slots=schedule(),records=slots.map(slot=>captured(slot,{origin:'original-mid-central'}));
  const report=auditTwinForecastCaptureCoverage(slots,records);
  expect(report).toMatchObject({original:8,paired:8,originalCentral:8,uncovered:0,
   coverageFraction:1,longestUncoveredRun:0,statement:'coverage-diagnostic-only'});
  expect(report.utcBins.map(b=>b.paired)).toEqual([2,2,2,2]);
 });
 it('refuses to reconstruct a historical MID capture from native model-run archives',()=>{
  const slots=schedule(),records=slots.map(slot=>captured(slot,{origin:'historical-source-run'}));
  const report=auditTwinForecastCaptureCoverage(slots,records);
  expect(report).toMatchObject({original:0,paired:0,replayOnly:8,uncovered:8});
  const other=auditTwinForecastCaptureCoverage(slots,slots.map(slot=>captured(slot,{origin:'reconstructed-mid'})));
  expect(other).toMatchObject({original:0,replayOnly:8});
 });
 it('rejects unverified, malformed, late, target-mismatched and unknown-site records',()=>{
  const slot=schedule(1)[0];
  const records=[
   captured(slot,{archiveAttested:false}),
   captured(slot,{forecastSha256:'invalid'}),
   captured(slot,{archivedAtMs:slot.validStartMs}),
   captured(slot,{validStartMs:slot.validStartMs+H}),
   captured(slot,{siteKey:'someone-else'}),
   captured(slot,{opportunityId:'never-scheduled'}),
  ];
  const report=auditTwinForecastCaptureCoverage([slot],records);
  expect(report).toMatchObject({original:0,rejectedRecords:6,uncovered:1});
 });
 it('deduplicates identical snapshots and blocks conflicting original versions',()=>{
  const slot=schedule(1)[0],first=captured(slot);
  const valid=auditTwinForecastCaptureCoverage([slot],[first,first,first]);
  expect(valid).toMatchObject({original:1,paired:1,repeatedIdentical:2,ambiguous:0});
  const conflicting=auditTwinForecastCaptureCoverage([slot],[first,captured(slot,{forecastSha256:C})]);
  expect(conflicting).toMatchObject({original:0,paired:0,ambiguous:1,uncovered:1});
 });
 it('retains the two different absolute epochs of repeated autumn local clock hour',()=>{
  const first=Date.parse('2026-10-25T02:30:00+02:00');
  const second=Date.parse('2026-10-25T02:30:00+01:00');
  const slots:[TwinCaptureOpportunity,TwinCaptureOpportunity]=[
   {id:'a',siteKey:'public-grid-eil',issueWindowStartMs:first,issueWindowEndMs:first+15*60000,
    validStartMs:first+6*H,validEndMs:first+6*H},
   {id:'b',siteKey:'public-grid-eil',issueWindowStartMs:second,issueWindowEndMs:second+15*60000,
    validStartMs:second+6*H,validEndMs:second+6*H},
  ];
  const records=slots.map(slot=>captured(slot,{issuedAtMs:slot.issueWindowStartMs+1000,archivedAtMs:slot.issueWindowStartMs+2000,
   baselineIssuedAtMs:slot.issueWindowStartMs+1000}));
  const result=auditTwinForecastCaptureCoverage(slots,records);
  expect(second-first).toBe(H);
  expect(result).toMatchObject({expected:2,original:2,paired:2});
  expect(result.utcBins[0].original).toBe(2);
 });
 it('fails closed for duplicate, out-of-order or impossible planned schedule',()=>{
  const slots=schedule(2);
  expect(auditTwinForecastCaptureCoverage([slots[0],slots[0]],[]).validSchedule).toBe(false);
  expect(auditTwinForecastCaptureCoverage([slots[1],slots[0]],[]).validSchedule).toBe(false);
  expect(auditTwinForecastCaptureCoverage([{...slots[0],validStartMs:slots[0].issueWindowStartMs}],[]).validSchedule).toBe(false);
  expect(auditTwinForecastCaptureCoverage([{...slots[0],issueWindowEndMs:NaN}],[]).validSchedule).toBe(false);
 });
 it('requires a same-issue archived baseline before claiming a complete pair',()=>{
  const slots=schedule(3);
  const r=auditTwinForecastCaptureCoverage(slots,[
   captured(slots[0],{baselineSha256:undefined}),
   captured(slots[1],{baselineIssuedAtMs:slots[1].issueWindowStartMs+10*60000}),
   captured(slots[2],{baselineSha256:B}),
  ]);
  expect(r).toMatchObject({original:3,paired:1,uncovered:0,pairedFraction:1/3});
 });
 it('tracks missing runs independently across public reference sites',()=>{
  const a=schedule(3,'site-a'),b=schedule(3,'site-b');
  const joined=[a[0],b[0],a[1],b[1],a[2],b[2]];
  const r=auditTwinForecastCaptureCoverage(joined,[captured(b[0]),captured(a[2])]);
  expect(r).toMatchObject({expected:6,original:2,uncovered:4,longestUncoveredRun:2});
 });
});
