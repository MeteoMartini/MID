/**
 * MID Audit 1.1 – scheduled ORIGINAL forecast archive coverage.
 * A source-model hindcast never substitutes for a MID forecast actually issued
 * before validity. Pure QA evidence: neither an archival service nor a skill gate.
 * All timestamps are absolute epochs; the caller owns source/site provenance.
 */
export type TwinCaptureOrigin =
 'original-mid-session'|'original-mid-central'|'historical-source-run'|'reconstructed-mid';
export type TwinCaptureOpportunity = Readonly<{
 id:string; siteKey:string;
 issueWindowStartMs:number; issueWindowEndMs:number;
 validStartMs:number; validEndMs:number;
}>;
export type TwinCaptureRecord = Readonly<{
 opportunityId:string; siteKey:string; origin:TwinCaptureOrigin;
 issuedAtMs:number; archivedAtMs:number;
 validStartMs:number; validEndMs:number;
 archiveAttested:boolean;
 forecastSha256?:string;
 baselineSha256?:string;
 baselineIssuedAtMs?:number;
}>;
type MutableTwinCaptureBin = {
 label:'00-06 UTC'|'06-12 UTC'|'12-18 UTC'|'18-24 UTC';
 planned:number; original:number; paired:number;
};
export type TwinCaptureBin = Readonly<MutableTwinCaptureBin>;
export type TwinCaptureCoverageReport = Readonly<{
 validSchedule:boolean;
 expected:number;
 original:number;
 paired:number;
 originalSession:number;
 originalCentral:number;
 uncovered:number;
 replayOnly:number;
 ambiguous:number;
 rejectedRecords:number;
 repeatedIdentical:number;
 longestUncoveredRun:number;
 coverageFraction:number|null;
 pairedFraction:number|null;
 utcBins:readonly TwinCaptureBin[];
 statement:'invalid-schedule'|'coverage-diagnostic-only';
}>;

const H=3600000;
const SHA256=/^[0-9a-f]{64}$/;
function absolute(value:number){return Number.isSafeInteger(value)}
function digest(value:unknown):value is string{return typeof value==='string'&&SHA256.test(value)}
function emptyBins():MutableTwinCaptureBin[]{
 return [
  {label:'00-06 UTC',planned:0,original:0,paired:0},
  {label:'06-12 UTC',planned:0,original:0,paired:0},
  {label:'12-18 UTC',planned:0,original:0,paired:0},
  {label:'18-24 UTC',planned:0,original:0,paired:0},
 ];
}
type State={
 original:TwinCaptureRecord|null;
 fingerprint:string|null;
 conflicting:boolean;
 replay:boolean;
 duplicateCount:number;
};
function errorReport():TwinCaptureCoverageReport{
 return {validSchedule:false,expected:0,original:0,paired:0,
  originalSession:0,originalCentral:0,uncovered:0,replayOnly:0,ambiguous:0,
  rejectedRecords:0,repeatedIdentical:0,longestUncoveredRun:0,
  coverageFraction:null,pairedFraction:null,utcBins:emptyBins(),
  statement:'invalid-schedule'};
}
function verifiedAgainstSlot(row:TwinCaptureRecord,slot:TwinCaptureOpportunity){
 return row.siteKey===slot.siteKey&&
  [row.issuedAtMs,row.archivedAtMs,row.validStartMs,row.validEndMs].every(absolute)&&
  row.issuedAtMs>=slot.issueWindowStartMs&&row.issuedAtMs<slot.issueWindowEndMs&&
  row.archivedAtMs>=row.issuedAtMs&&row.archivedAtMs<slot.issueWindowEndMs&&
  row.archivedAtMs<=slot.validStartMs&&
  row.validStartMs===slot.validStartMs&&row.validEndMs===slot.validEndMs;
}
function paired(row:TwinCaptureRecord):boolean{
 return digest(row.baselineSha256)&&
  absolute(Number(row.baselineIssuedAtMs))&&
  row.baselineIssuedAtMs===row.issuedAtMs;
}
/**
 * O(opportunities + records), O(opportunities + distinct sites) memory.
 * Opportunity schedule must be planned independently of app-open events,
 * ordered by UTC issue-window start and audited by an external scheduler.
 * This NEVER grants permission to learn, publish skill, or replace Best Match.
 */
export function auditTwinForecastCaptureCoverage(
 opportunities:readonly TwinCaptureOpportunity[],
 records:readonly TwinCaptureRecord[],
):TwinCaptureCoverageReport{
 const byId=new Map<string,{slot:TwinCaptureOpportunity;state:State}>();
 let previousStart=-Infinity;
 for(const slot of opportunities){
  if(!slot.id?.trim()||!slot.siteKey?.trim()||byId.has(slot.id)||
   ![slot.issueWindowStartMs,slot.issueWindowEndMs,slot.validStartMs,slot.validEndMs].every(absolute)||
   slot.issueWindowEndMs<=slot.issueWindowStartMs||
   slot.validEndMs<slot.validStartMs||
   slot.issueWindowEndMs>slot.validStartMs||
   slot.issueWindowStartMs<previousStart)return errorReport();
  previousStart=slot.issueWindowStartMs;
  byId.set(slot.id,{slot,state:{original:null,fingerprint:null,conflicting:false,replay:false,duplicateCount:0}});
 }
 let rejectedRecords=0;
 for(const row of records){
  const entry=byId.get(row.opportunityId);
  if(!entry||!verifiedAgainstSlot(row,entry.slot)){rejectedRecords++;continue;}
  const state=entry.state;
  if(row.origin==='historical-source-run'||row.origin==='reconstructed-mid'){
   // A valid model replay may diagnose the source model, not the MID fusion.
   state.replay=true;continue;
  }
  if(row.origin!=='original-mid-session'&&row.origin!=='original-mid-central'||
   row.archiveAttested!==true||!digest(row.forecastSha256)){
   rejectedRecords++;continue;
  }
  const fingerprint=[row.origin,row.issuedAtMs,row.archivedAtMs,row.forecastSha256,
   row.baselineSha256??'',row.baselineIssuedAtMs??''].join('|');
  if(state.original){
   if(fingerprint===state.fingerprint)state.duplicateCount++;
   else state.conflicting=true; // never choose the more favorable conflicting record
  }else{
   state.original=row;state.fingerprint=fingerprint;
  }
 }
 const bins=emptyBins();
 let original=0,pairedCount=0,originalSession=0,originalCentral=0,
  replayOnly=0,ambiguous=0,repeatedIdentical=0,longestUncoveredRun=0;
 const missingBySite=new Map<string,number>();
 for(const slot of opportunities){
  const state=byId.get(slot.id)!.state;
  const hour=((Math.floor(slot.issueWindowStartMs/H)%24)+24)%24;
  const bin=bins[Math.floor(hour/6)];
  bin.planned++;
  repeatedIdentical+=state.duplicateCount;
  const available=Boolean(state.original&&!state.conflicting);
  if(available){
   original++;bin.original++;
   if(state.original!.origin==='original-mid-session')originalSession++;
   else originalCentral++;
   if(paired(state.original!)){pairedCount++;bin.paired++;}
  }else if(state.conflicting)ambiguous++;
  if(!available&&state.replay)replayOnly++;
  const gap=available?0:(missingBySite.get(slot.siteKey)??0)+1;
  missingBySite.set(slot.siteKey,gap);
  longestUncoveredRun=Math.max(longestUncoveredRun,gap);
 }
 const expected=opportunities.length;
 return {validSchedule:true,expected,original,paired:pairedCount,
  originalSession,originalCentral,uncovered:expected-original,replayOnly,
  ambiguous,rejectedRecords,repeatedIdentical,longestUncoveredRun,
  coverageFraction:expected?original/expected:null,pairedFraction:expected?pairedCount/expected:null,
  utcBins:bins,statement:'coverage-diagnostic-only'};
}
