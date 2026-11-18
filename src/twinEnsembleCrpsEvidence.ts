/**
 * MID Audit 1.2: independent, original-ensemble CRPS audit, no I/O or UI.
 * Input provenance must be attested by the caller: flags cannot authenticate DWD data.
 * No result from this module authorizes operational weights or a public skill claim.
 */
export type CrpsVariable='temperature'|'precipitation';
export type CrpsLeadBand='0-6h'|'6-24h'|'24-72h'|'72-168h';
export type TwinEnsembleCrpsCase=Readonly<{
 siteKey:string;stationId:string;timeZone:string;localTargetDate:string;
 variable:CrpsVariable;modelId:string;sourceRunId:string;
 initialisedAtMs:number;issuedAtMs:number;archivedAtMs:number;
 validStartMs:number;validEndMs:number;observationAvailableAtMs:number;
 observationSource:'official-measured'|'private-sensor'|'analysis'|'reanalysis'|'model-fallback';
 observationQuality:'historical-checked'|'recent-provisional'|'unverified';
 stationMetadataVerified:boolean;spatialMatchVerified:boolean;
 forecastUnit:'celsius'|'millimetres'|'kelvin'|'inches';
 observationUnit:'celsius'|'millimetres'|'kelvin'|'inches';
 observed:number;accumulationComplete?:boolean;
 originalNativeMembers:boolean;forecastSha256:string;
 expectedMembers:number;memberIds:readonly string[];members:readonly number[];
}>;
export type CrpsWindow=Readonly<{startMs:number;endMs:number}>;
export type CrpsGroup=Readonly<{
 siteKey:string;modelId:string;variable:CrpsVariable;leadBand:CrpsLeadBand;
 accumulationMinutes:number;cases:number;independentDays:number;
 meanCrps:number;observedWithinP10P90:number;
 status:'insufficient-days'|'exploratory-only';
}>;
export type CrpsReport=Readonly<{
 validWindow:boolean;acceptedCases:number;rejected:Readonly<Record<string,number>>;
 groups:readonly CrpsGroup[];statement:'invalid-window'|'research-only-no-skill-claim';
}>;
const HOUR=3600000;
const SHA256=/^[a-f0-9]{64}$/;
const MAX_CASES=10000;
const MAX_MEMBERS=128;
const MIN_EXPLORATORY_DAYS=30; // MID QA threshold, not a WMO normative minimum
const isEpoch=(v:number)=>Number.isSafeInteger(v);
const isNumber=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const validDate=(v:string)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const ms=Date.parse(v+'T00:00:00Z');return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===v;};
const formatters=new Map<string,Intl.DateTimeFormat>();
function observedLocalDate(row:TwinEnsembleCrpsCase):string|null{
 try{
  let formatter=formatters.get(row.timeZone);
  if(!formatter){formatter=new Intl.DateTimeFormat('en-GB',{timeZone:row.timeZone,year:'numeric',month:'2-digit',day:'2-digit'});if(formatters.size>=16)formatters.clear();formatters.set(row.timeZone,formatter);}
  const stamp=row.variable==='precipitation'?row.validEndMs-1:row.validEndMs;
  const parts=formatter.formatToParts(new Date(stamp)),part=(type:string)=>parts.find(p=>p.type===type)?.value;
  const value=String(part('year'))+'-'+String(part('month'))+'-'+String(part('day'));
  return validDate(value)?value:null;
 }catch{return null;}
}
function leadBand(ms:number):CrpsLeadBand|null{
 if(!isNumber(ms)||ms<=0||ms>168*HOUR)return null;
 return ms<=6*HOUR?'0-6h':ms<=24*HOUR?'6-24h':ms<=72*HOUR?'24-72h':'72-168h';
}
function admission(row:TwinEnsembleCrpsCase,window:CrpsWindow):{band:CrpsLeadBand;period:number}|null{
 if(!row.siteKey?.trim()||!row.stationId?.trim()||!row.modelId?.trim()||!row.sourceRunId?.trim()||
    !validDate(row.localTargetDate)||row.observationSource!=='official-measured'||
    row.observationQuality!=='historical-checked'||row.stationMetadataVerified!==true||
    row.spatialMatchVerified!==true||row.originalNativeMembers!==true||!SHA256.test(row.forecastSha256))return null;
 if(![row.initialisedAtMs,row.issuedAtMs,row.archivedAtMs,row.validStartMs,row.validEndMs,row.observationAvailableAtMs].every(isEpoch)||
    row.initialisedAtMs>row.issuedAtMs||row.issuedAtMs>row.archivedAtMs||
    row.archivedAtMs>=row.validStartMs||row.validStartMs<window.startMs||row.validEndMs>window.endMs||
    row.observationAvailableAtMs<row.validEndMs||row.observationAvailableAtMs>window.endMs||
    !isNumber(row.observed))return null;
 const band=leadBand(row.validStartMs-row.issuedAtMs);
 if(!band||observedLocalDate(row)!==row.localTargetDate)return null;
 const periodMs=row.validEndMs-row.validStartMs;
 if(row.variable==='temperature'){if(periodMs!==0)return null;}
 else if(row.variable==='precipitation'){
  if(periodMs<=0||periodMs>25*HOUR||periodMs%60000!==0||row.accumulationComplete!==true||row.observed<0)return null;
 }else return null;
 if(row.variable==='temperature'?(row.forecastUnit!=='celsius'||row.observationUnit!=='celsius'):
    (row.forecastUnit!=='millimetres'||row.observationUnit!=='millimetres'))return null;
 if(!Number.isInteger(row.expectedMembers)||row.expectedMembers<2||row.expectedMembers>MAX_MEMBERS||
    !Array.isArray(row.members)||!Array.isArray(row.memberIds)||
    row.members.length!==row.expectedMembers||row.memberIds.length!==row.expectedMembers)return null;
 const ids=new Set<string>();
 for(let i=0;i<row.expectedMembers;i++){
  const id=row.memberIds[i],value=row.members[i];
  if(typeof id!=='string'||!id.trim()||ids.has(id)||!isNumber(value)||
    (row.variable==='precipitation'&&value<0))return null;
  ids.add(id);
 }
 return {band,period:periodMs/60000};
}
function quantile(sorted:readonly number[],p:number){
 const index=p*(sorted.length-1),lo=Math.floor(index),hi=Math.ceil(index);
 return sorted[lo]+(sorted[hi]-sorted[lo])*(index-lo);
}
/** CRPS(F,y) = mean |x-y| - (1 / (2 n²)) sum_i sum_j |x_i-x_j|.
 * Sorted prefix algebra evaluates the pairwise term in O(n log n), not O(n²).
 */
export function empiricalEnsembleCrps(members:readonly number[],observed:number):number|null{
 if(!Array.isArray(members)||members.length<2||members.length>MAX_MEMBERS||!isNumber(observed)||
    members.some(value=>!isNumber(value)))return null;
 const values=[...members].sort((a,b)=>a-b),n=values.length;
 let absolute=0,spread=0;
 for(let i=0;i<n;i++){absolute+=Math.abs(values[i]-observed);spread+=(2*i-n+1)*values[i];}
 const result=absolute/n-spread/(n*n);
 return Number.isFinite(result)?Math.max(0,result):null;
}
/** O(cases * members log members), bounded by 10k cases and 128 native members.
 * All sampled days get equal weight within their separately identified cohort.
 * No baselines or skill scores are inferred from this descriptive CRPS.
 */
export function summarizeTwinEnsembleCrps(rows:readonly TwinEnsembleCrpsCase[],window:CrpsWindow):CrpsReport{
 const empty=(reason:string):CrpsReport=>({validWindow:false,acceptedCases:0,rejected:{[reason]:rows.length},groups:[],statement:'invalid-window'});
 if(!isEpoch(window.startMs)||!isEpoch(window.endMs)||window.endMs<=window.startMs||rows.length>MAX_CASES)return empty('invalid-window-or-budget');
 type Valid={row:TwinEnsembleCrpsCase;band:CrpsLeadBand;period:number;key:string};
 const accepted:Valid[]=[],counts=new Map<string,number>(),rejected:Record<string,number>={};
 const reject=(reason:string)=>{rejected[reason]=(rejected[reason]??0)+1;};
 for(const row of rows){
  const a=admission(row,window);
  if(!a){reject('invalid-provenance-or-completeness');continue;}
  // Do not choose the most favorable run if the same site/model/lead/target was archived twice.
  const key=[row.siteKey,row.stationId,row.modelId,row.variable,a.band,row.validStartMs,row.validEndMs].join('|');
  accepted.push({row,...a,key});counts.set(key,(counts.get(key)??0)+1);
 }
 type Day={sumCrps:number;covered:number;count:number};
 type Group={siteKey:string;modelId:string;variable:CrpsVariable;band:CrpsLeadBand;period:number;cases:number;days:Map<string,Day>};
 const groups=new Map<string,Group>();let acceptedCases=0;
 for(const {row,band,period,key} of accepted){
  if(counts.get(key)!==1){reject('ambiguous-duplicate');continue;}
  const score=empiricalEnsembleCrps(row.members,row.observed);
  if(score===null){reject('numeric-overflow');continue;}
  const cohort=[row.siteKey,row.modelId,row.variable,band,period].join('|');
  let group=groups.get(cohort);
  if(!group){group={siteKey:row.siteKey,modelId:row.modelId,variable:row.variable,band,period,cases:0,days:new Map()};groups.set(cohort,group);}
  const sorted=[...row.members].sort((a,b)=>a-b);
  const covered=+(row.observed>=quantile(sorted,.1)&&row.observed<=quantile(sorted,.9));
  const day=group.days.get(row.localTargetDate)??{sumCrps:0,covered:0,count:0};
  day.sumCrps+=score;day.covered+=covered;day.count++;
  group.days.set(row.localTargetDate,day);group.cases++;acceptedCases++;
 }
 const summaries=[...groups.values()].map((g):CrpsGroup=>{
  const days=[...g.days.values()],n=days.length;
  const crps=days.reduce((sum,day)=>sum+day.sumCrps/day.count,0)/n;
  const coverage=days.reduce((sum,day)=>sum+day.covered/day.count,0)/n;
  return {siteKey:g.siteKey,modelId:g.modelId,variable:g.variable,leadBand:g.band,
   accumulationMinutes:g.period,cases:g.cases,independentDays:n,meanCrps:crps,
   observedWithinP10P90:coverage,status:n>=MIN_EXPLORATORY_DAYS?'exploratory-only':'insufficient-days'};
 });
 summaries.sort((a,b)=>a.siteKey.localeCompare(b.siteKey)||a.modelId.localeCompare(b.modelId)||a.variable.localeCompare(b.variable)||a.leadBand.localeCompare(b.leadBand)||a.accumulationMinutes-b.accumulationMinutes);
 return {validWindow:true,acceptedCases,rejected,groups:summaries,statement:'research-only-no-skill-claim'};
}
