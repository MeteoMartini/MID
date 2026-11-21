/**
 * MID Audit 1.1: strict structural provider-time evidence, not forecast skill.
 * No I/O, timers, global cache, source promotion, warning severity or UI work.
 */
export type MidSourceProductKind='forecast'|'analysis'|'observation'|'radar'|'climatology'|'official-warning';
export type MidTemporalCell='instant'|'sum'|'mean'|'minimum'|'maximum';
export type MidSourceStamp=Readonly<{
 sourceId:string; fieldId:string; unit:string;
 product:MidSourceProductKind; cell:MidTemporalCell;
 provenance:'provider-native'|'derived'|'unverified';
 modelRunAt?:string; issuedAt?:string; validAt:string;
 periodStartAt?:string; periodEndAt?:string;
 publishedAt?:string; receivedAt:string;
 /** Proven per-provider/field cycle-age budget, never a generic MID-wide timeout. */
 sourceAgeBudgetMs?:number;
}>;
export type MidSourceStampResult=Readonly<{
 integrity:'verified'|'incomplete'|'contradictory';
 freshness:'unknown'|'within-budget'|'over-budget';
 reason:string;
 validAtMs?:number;
 referenceAtMs?:number;
}>;
export type MidDisplayStamp=Readonly<{usedInDisplay:boolean;product:MidSourceProductKind;audit:MidSourceStampResult}>;
export type MidDisplayTimeSummary=Readonly<{
 band:'empty'|'contradictory'|'incomplete'|'stale'|'mixed'|'unverified-freshness'|'current';
 checked:number;contradictory:number;incomplete:number;stale:number;unknownAge:number;
 comparable:number;validSpanMs:number|null;
}>;
const FUTURE_CLOCK_TOLERANCE_MS=5*60*1000;

/** Require ISO8601 with an explicit UTC designator or numeric offset. */
function parseAbsolute(value:unknown):number|null{
 if(typeof value!=='string')return null;
 const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(value);
 if(!match)return null;
 const y=Number(match[1]),mo=Number(match[2]),day=Number(match[3]),
  hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]),zone=match[8];
 if(y<100||mo<1||mo>12||day<1||day>31||hour>23||minute>59||second>59)return null;
 const check=new Date(Date.UTC(y,mo-1,day));
 if(check.getUTCFullYear()!==y||check.getUTCMonth()!==mo-1||check.getUTCDate()!==day)return null;
 if(zone!=='Z'){
  const h=Number(zone.slice(1,3)),m=Number(zone.slice(4,6));
  if(h>14||m>59||h===14&&m>0)return null;
 }
 const ms=Date.parse(value);
 return Number.isSafeInteger(ms)?ms:null;
}
const invalid=(reason:string):MidSourceStampResult=>({integrity:'contradictory',freshness:'unknown',reason});
const missing=(reason:string):MidSourceStampResult=>({integrity:'incomplete',freshness:'unknown',reason});

/** Integrity checks do not assert the physical accuracy/authenticity of the provider. */
export function assessMidSourceStamp(
 row:MidSourceStamp,nowMs:number,
):MidSourceStampResult{
 if(!Number.isSafeInteger(nowMs))return invalid('invalid-clock');
 if(!row.sourceId?.trim()||!row.fieldId?.trim()||!row.unit?.trim())return missing('missing-source-field-unit');
 if(row.provenance!=='provider-native')return missing('unverified-provider-time');
 const valid=parseAbsolute(row.validAt),received=parseAbsolute(row.receivedAt);
 if(valid===null||received===null)return missing('missing-absolute-time');
 if(received>nowMs+FUTURE_CLOCK_TOLERANCE_MS)return invalid('receipt-in-future');
 const period=row.cell!=='instant';
 let start=valid,end=valid;
 if(period){
  const from=parseAbsolute(row.periodStartAt),to=parseAbsolute(row.periodEndAt);
  if(from===null||to===null)return missing('missing-native-interval');
  if(from>=to||to!==valid)return invalid('invalid-interval-or-end-stamp');
  start=from;end=to;
 }else if(row.periodStartAt!==undefined||row.periodEndAt!==undefined){
  return invalid('instant-with-period');
 }
 let reference=valid;
 if(row.product==='forecast'){
  const run=parseAbsolute(row.modelRunAt);
  if(run===null)return missing('missing-model-run');
  if(run>start||run>received||run>nowMs+FUTURE_CLOCK_TOLERANCE_MS)
   return invalid('run-after-forecast-or-receipt');
  reference=run;
 }else if(row.product==='official-warning'){
  const issued=parseAbsolute(row.issuedAt);
  if(issued===null)return missing('missing-official-issue-time');
  if(issued>received||issued>nowMs+FUTURE_CLOCK_TOLERANCE_MS)
   return invalid('issue-after-receipt');
  reference=issued;
 }else if(row.product==='radar'||row.product==='observation'||row.product==='analysis'){
  if(end>received)return invalid('observed-or-analysed-after-receipt');
 }
 if(row.publishedAt!==undefined){
  const published=parseAbsolute(row.publishedAt);
  if(published===null)return missing('missing-publication-time');
  if(published<reference||published>received)return invalid('inconsistent-publication-time');
 }
 if(row.sourceAgeBudgetMs!==undefined&&(!Number.isSafeInteger(row.sourceAgeBudgetMs)||row.sourceAgeBudgetMs<=0))
  return invalid('invalid-source-age-budget');
 // Official warnings have their own issuance/validity rules; do not apply
 // meteorological model-run freshness badges or source budgets to them.
 let freshness:MidSourceStampResult['freshness']='unknown';
 if(row.product!=='official-warning'&&row.product!=='climatology'&&row.sourceAgeBudgetMs!==undefined)
  freshness=nowMs-reference>row.sourceAgeBudgetMs?'over-budget':'within-budget';
 return {integrity:'verified',freshness,reason:'time-structure-verified',validAtMs:valid,referenceAtMs:reference};
}

/** O(n) / O(1): only actually drawn weather fields, never candidate inventory. */
export function summarizeMidDisplayStamps(
 stamps:readonly MidDisplayStamp[],maxValidOffsetMs:number,
):MidDisplayTimeSummary{
 let checked=0,contradictory=0,incomplete=0,stale=0,unknownAge=0,comparable=0,
  lowest=Infinity,highest=-Infinity;
 if(!Number.isSafeInteger(maxValidOffsetMs)||maxValidOffsetMs<0){
  return {band:'contradictory',checked:0,contradictory:0,incomplete:0,stale:0,unknownAge:0,comparable:0,validSpanMs:null};
 }
 for(const {usedInDisplay,product,audit} of stamps){
  if(!usedInDisplay)continue;
  checked++;
  if(audit.integrity==='contradictory'){contradictory++;continue;}
  if(audit.integrity==='incomplete'){incomplete++;continue;}
  if(product==='official-warning'||product==='climatology')continue;
  if(audit.freshness==='over-budget')stale++;
  if(audit.freshness==='unknown')unknownAge++;
  if(audit.validAtMs!==undefined&&Number.isFinite(audit.validAtMs)){
   comparable++;lowest=Math.min(lowest,audit.validAtMs);highest=Math.max(highest,audit.validAtMs);
  }
 }
 const validSpanMs=comparable>0?highest-lowest:null;
 const band:MidDisplayTimeSummary['band']=!checked?'empty':contradictory?'contradictory':incomplete?'incomplete':
  stale?'stale':validSpanMs!==null&&validSpanMs>maxValidOffsetMs?'mixed':
  !comparable||unknownAge?'unverified-freshness':'current';
 return {band,checked,contradictory,incomplete,stale,unknownAge,comparable,validSpanMs};
}
