/**
 * Research-only, independent-station paired verification.
 * No source fetch, user telemetry or forecast modification. The adapter must
 * validate actual station metadata, units, spatial matching and source QC.
 */
export type TwinStationParameter='temperature'|'precipitation'|'rain-probability';
export type TwinStationLeadBand='0-6h'|'6-24h'|'24-72h'|'72-168h';
export type TwinStationPair=Readonly<{
 stationId:string;
 timeZone:string; // IANA zone of verifying station
 localTargetDate:string; // verified calendar date in the station's IANA zone
 parameter:TwinStationParameter;
 sourceType:'official-measured'|'private-sensor'|'analysis'|'model-fallback';
 qualityStatus:'historical-checked'|'recent-provisional'|'unverified';
 stationMetadataVerified:boolean;
 issuedAtMs:number;
 archivedAtMs:number;
 validStartMs:number; // original accumulation start, or instantaneous valid time
 validEndMs:number; // original accumulation end, or same instant for temperature
 observedAvailableAtMs:number;
 candidate:number; // degrees C, millimetres, or probability fraction 0..1
 baseline:number; // same units, same issuance and validity
 observed:number; // degrees C or genuine accumulated millimetres
 accumulationComplete?:boolean;
 rainThresholdMm?:number;
}>;
export type TwinStationWindow=Readonly<{startMs:number;endMs:number}>;
export type TwinStationSkillGroup=Readonly<{
 parameter:TwinStationParameter;
 leadBand:TwinStationLeadBand;
 rainThresholdMm?:number;
 pairedCases:number;
 independentDays:number;
 candidateError:number;
 baselineError:number;
 improvement:number;
 bootstrap95:Readonly<{lower:number;upper:number}>|null;
 status:'insufficient-days'|'exploratory-only';
}>;
export type TwinStationSkillReport=Readonly<{
 validWindow:boolean;
 acceptedPairs:number;
 rejected:Readonly<Record<string,number>>;
 groups:readonly TwinStationSkillGroup[];
}>;

const HOUR=3600000;
const DAY=24*HOUR;
const BOOTSTRAP_DRAWS=400;
const MIN_EXPLORATORY_DAYS=30; // local QA design threshold, NOT a WMO minimum
function validMillis(value:number){return Number.isSafeInteger(value)}
function validDate(date:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const epoch=Date.parse(date+'T00:00:00Z');
 return Number.isFinite(epoch)&&new Date(epoch).toISOString().slice(0,10)===date;
}
const localFormatters=new Map<string,Intl.DateTimeFormat>();
function observedLocalDate(row:TwinStationPair):string|null{
 try{
  let fmt=localFormatters.get(row.timeZone);
  if(!fmt){
   fmt=new Intl.DateTimeFormat('en-GB',{timeZone:row.timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
   if(localFormatters.size>=16)localFormatters.clear();
   localFormatters.set(row.timeZone,fmt);
  }
  // An accumulation ending precisely at local midnight belongs to the
  // previous day. Instantaneous temperature has no end-of-period shift.
  const stamp=row.parameter==='temperature'?row.validEndMs:row.validEndMs-1;
  const parts=fmt.formatToParts(new Date(stamp));
  const get=(type:string)=>parts.find(part=>part.type===type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
 }catch{return null}
}
function leadBand(leadMs:number):TwinStationLeadBand|null{
 if(!Number.isFinite(leadMs)||leadMs<=0||leadMs>168*HOUR)return null;
 return leadMs<=6*HOUR?'0-6h':leadMs<=24*HOUR?'6-24h':leadMs<=72*HOUR?'24-72h':'72-168h';
}
function admissible(row:TwinStationPair,window:TwinStationWindow):TwinStationLeadBand|null{
 if(row.sourceType!=='official-measured'||row.qualityStatus!=='historical-checked'||
    row.stationMetadataVerified!==true||!row.stationId?.trim()||!validDate(row.localTargetDate))return null;
 if(![row.issuedAtMs,row.archivedAtMs,row.validStartMs,row.validEndMs,row.observedAvailableAtMs].every(validMillis)||
    row.issuedAtMs>row.archivedAtMs||row.archivedAtMs>=row.validStartMs||
    row.validEndMs<row.validStartMs||row.observedAvailableAtMs<row.validEndMs||
    row.observedAvailableAtMs>window.endMs||row.validEndMs<=window.startMs||
    row.validEndMs>window.endMs)return null;
 if(observedLocalDate(row)!==row.localTargetDate)return null;
 if(![row.candidate,row.baseline,row.observed].every(value=>typeof value==='number'&&Number.isFinite(value)))return null;
 if(row.parameter==='temperature'){
  if(row.validStartMs!==row.validEndMs)return null;
 }else{
  if(row.validStartMs===row.validEndMs||row.accumulationComplete!==true||row.observed<0)return null;
  if(row.parameter==='precipitation'&&(row.candidate<0||row.baseline<0))return null;
  if(row.parameter==='rain-probability'&&(
     !Number.isFinite(row.rainThresholdMm)||Number(row.rainThresholdMm)<=0||
     row.candidate<0||row.candidate>1||row.baseline<0||row.baseline>1
  ))return null;
 }
 if(row.parameter!=='temperature'&&row.parameter!=='precipitation'&&row.parameter!=='rain-probability')return null;
 return leadBand(row.validStartMs-row.issuedAtMs);
}
function sampleErrors(row:TwinStationPair):readonly[number,number]{
 if(row.parameter==='rain-probability'){
  const event=row.observed>Number(row.rainThresholdMm)?1:0;
  return [(row.candidate-event)**2,(row.baseline-event)**2];
 }
 return [Math.abs(row.candidate-row.observed),Math.abs(row.baseline-row.observed)];
}
function seedFor(label:string){let n=2166136261>>>0;for(let i=0;i<label.length;i++)n=Math.imul(n^label.charCodeAt(i),16777619)>>>0;return n||1}
function hasConsecutiveCalendarDays(days:readonly string[]){
 for(let i=1;i<days.length;i++)
  if(Date.parse(days[i]+'T00:00:00Z')-Date.parse(days[i-1]+'T00:00:00Z')!==DAY)return false;
 return true;
}
/** Deterministic moving-block (7-calendar-day) exploratory bootstrap; not a release gate. */
function exploratoryInterval(deltas:readonly number[],label:string){
 let seed=seedFor(label);const n=deltas.length,draws:number[]=[],block=Math.min(7,n);
 const next=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0};
 for(let draw=0;draw<BOOTSTRAP_DRAWS;draw++){
  let sum=0,used=0;
  while(used<n){const start=next()%n;for(let i=0;i<block&&used<n;i++,used++)sum+=deltas[(start+i)%n];}
  draws.push(sum/n);
 }
 draws.sort((a,b)=>a-b);
 return {lower:draws[Math.floor(.025*(draws.length-1))],upper:draws[Math.floor(.975*(draws.length-1))]};
}
/**
 * O(pairs + groups * 400 * days). Computes paired MAE for temperature/rain
 * and Brier score for a verified fixed rain-event threshold.
 * Groups by observed local calendar day; multiple stations/horizons in one day
 * never masquerade as multiple independent days.
 */
export function summarizeTwinIndependentStationSkill(
 rows:readonly TwinStationPair[],window:TwinStationWindow,
):TwinStationSkillReport{
 const rejected:Record<string,number>={};
 const reject=(reason:string)=>{rejected[reason]=(rejected[reason]||0)+1};
 if(!validMillis(window.startMs)||!validMillis(window.endMs)||window.endMs<=window.startMs)
  return {validWindow:false,acceptedPairs:0,rejected:{'invalid-window':rows.length},groups:[]};
 type Admission={row:TwinStationPair;band:TwinStationLeadBand;key:string};
 const candidates:Admission[]=[];
 const keys=new Map<string,number>();
 for(const row of rows){
  const band=admissible(row,window);
  if(!band){reject('not-independent-or-not-comparable');continue;}
  const key=[row.stationId,row.localTargetDate,row.parameter,row.issuedAtMs,row.validStartMs,row.validEndMs,row.rainThresholdMm??''].join('|');
  candidates.push({row,band,key});keys.set(key,(keys.get(key)||0)+1);
 }
 type Daily={candidate:number;baseline:number;count:number};
 type Group={parameter:TwinStationParameter;leadBand:TwinStationLeadBand;rainThresholdMm?:number;cases:number;days:Map<string,Daily>};
 const groups=new Map<string,Group>();let acceptedPairs=0;
 for(const {row,band,key} of candidates){
  if(keys.get(key)!==1){reject('duplicate-pair');continue;}
  const threshold=row.parameter==='rain-probability'?Number(row.rainThresholdMm):undefined;
  const groupKey=[row.parameter,band,threshold??''].join('|');
  let group=groups.get(groupKey);
  if(!group){group={parameter:row.parameter,leadBand:band,rainThresholdMm:threshold,cases:0,days:new Map()};groups.set(groupKey,group);}
  const [candidate,baseline]=sampleErrors(row);
  const day=group.days.get(row.localTargetDate)||{candidate:0,baseline:0,count:0};
  day.candidate+=candidate;day.baseline+=baseline;day.count++;
  group.days.set(row.localTargetDate,day);group.cases++;acceptedPairs++;
 }
 const summaries=[...groups.entries()].map(([key,group]):TwinStationSkillGroup=>{
  const dates=[...group.days.keys()].sort();
  const daily=dates.map(day=>group.days.get(day)!);
  const means=daily.map(row=>({candidate:row.candidate/row.count,baseline:row.baseline/row.count}));
  const n=means.length,candidateError=means.reduce((sum,row)=>sum+row.candidate,0)/n,
        baselineError=means.reduce((sum,row)=>sum+row.baseline,0)/n;
  const deltas=means.map(row=>row.baseline-row.candidate);
  const bootstrap95=n>=MIN_EXPLORATORY_DAYS&&hasConsecutiveCalendarDays(dates)?exploratoryInterval(deltas,key+dates.join(',')):null;
  return {parameter:group.parameter,leadBand:group.leadBand,...(group.rainThresholdMm===undefined?{}:{rainThresholdMm:group.rainThresholdMm}),
   pairedCases:group.cases,independentDays:n,candidateError,baselineError,improvement:baselineError-candidateError,
   bootstrap95,status:bootstrap95?'exploratory-only':'insufficient-days'};
 });
 return {validWindow:true,acceptedPairs,rejected,groups:summaries.sort((a,b)=>a.parameter.localeCompare(b.parameter)||a.leadBand.localeCompare(b.leadBand))};
}
