/**
 * MID Audit 1.2 – prospective, paired radar-nowcast verification (research-only).
 * Pure/no-I/O. Input flags are NOT proof of DWD provenance: independently audit
 * original forecast bytes, gauge QC, availability and spatial representativeness.
 * Never turn these descriptive diagnostics into official warnings or live weights.
 */
export type NowcastHorizon=15|30|60;
export type NowcastReferenceKind='official-measured'|'radar-product'|'reanalysis'|'private-sensor'|'model-fallback';
export type NowcastObservation=Readonly<{startMs:number;endMs:number;amountMm:number;complete:boolean}>;
export type NowcastCase=Readonly<{
 siteKey:string;stationId:string;modelId:string;localTargetDate:string;timeZone:string;
 issuedAtMs:number;archivedAtMs:number;validStartMs:number;validEndMs:number;observedAvailableAtMs:number;
 forecastSha256:string;baselineSha256:string;referenceKind:NowcastReferenceKind;
 referenceQuality:'historical-checked'|'recent-provisional'|'unverified';
 stationMetadataVerified:boolean;spatialMatchVerified:boolean;
 forecastOrigin:'original-mid'|'historical-replay'|'reconstructed';
 baselineOrigin:'preissue-climatology'|'preissue-persistence'|'posthoc';
 baselineIssuedAtMs:number;probabilityOrigin:'raw-heuristic'|'native-probability'|'independently-calibrated';
 rainThresholdMm:number;forecastProbability:number;baselineProbability:number;
 observations:readonly NowcastObservation[];
}>;
export type NowcastWindow=Readonly<{startMs:number;endMs:number}>;
export type NowcastReliabilityBin=Readonly<{
 from:number;to:number;cases:number;meanProbability:number|null;observedFrequency:number|null;
}>;
export type NowcastSkillGroup=Readonly<{
 siteKey:string;stationId:string;modelId:string;horizonMinutes:NowcastHorizon;rainThresholdMm:number;
 probabilityOrigin:NowcastCase['probabilityOrigin'];pairedCases:number;independentDays:number;
 eventCases:number;candidateBrier:number;baselineBrier:number;
 pairedBrierDifference:number;relativeSkill:number|null;
 hits:number;misses:number;falseAlarms:number;correctNegatives:number;
 pod:number|null;far:number|null;csi:number|null;reliability:readonly NowcastReliabilityBin[];
 status:'insufficient-days'|'exploratory-only';
}>;
export type NowcastSkillReport=Readonly<{
 validWindow:boolean;acceptedCases:number;rejected:Readonly<Record<string,number>>;
 groups:readonly NowcastSkillGroup[];statement:'invalid-window'|'research-only-no-public-skill';
}>;
const MINUTE=60000,MAX_CASES=10000,MAX_FRAMES=120,MIN_EXPLORATORY_DAYS=30;
const SHA=/^[a-f0-9]{64}$/;
const ms=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const probability=(v:unknown)=>finite(v)&&v>=0&&v<=1;
const localFormatters=new Map<string,Intl.DateTimeFormat>();
function localDate(row:NowcastCase):string|null{
 try{
  let fmt=localFormatters.get(row.timeZone);
  if(!fmt){fmt=new Intl.DateTimeFormat('en-GB',{timeZone:row.timeZone,year:'numeric',month:'2-digit',day:'2-digit'});if(localFormatters.size>=16)localFormatters.clear();localFormatters.set(row.timeZone,fmt);}
  // An accumulation ending at midnight belongs to the previous local date.
  const parts=fmt.formatToParts(new Date(row.validEndMs-1)),part=(type:string)=>parts.find(p=>p.type===type)?.value;
  return [part('year'),part('month'),part('day')].join('-');
 }catch{return null;}
}
function admissible(row:NowcastCase,window:NowcastWindow):NowcastHorizon|null{
 if(!row.siteKey?.trim()||!row.stationId?.trim()||!row.modelId?.trim()||
    !SHA.test(row.forecastSha256)||!SHA.test(row.baselineSha256)||
    row.forecastOrigin!=='original-mid'||row.referenceKind!=='official-measured'||
    row.referenceQuality!=='historical-checked'||row.stationMetadataVerified!==true||
    row.spatialMatchVerified!==true||row.baselineOrigin==='posthoc'||!(
     row.baselineOrigin==='preissue-climatology'||row.baselineOrigin==='preissue-persistence')||
    !['raw-heuristic','native-probability','independently-calibrated'].includes(row.probabilityOrigin))return null;
 if(![row.issuedAtMs,row.archivedAtMs,row.validStartMs,row.validEndMs,row.observedAvailableAtMs,row.baselineIssuedAtMs].every(ms)||
    row.issuedAtMs>row.archivedAtMs||row.archivedAtMs>row.validStartMs||
    row.baselineIssuedAtMs>row.validStartMs||
    row.validStartMs<window.startMs||row.validEndMs>window.endMs||
    row.observedAvailableAtMs<row.validEndMs||row.observedAvailableAtMs>window.endMs||
    row.validStartMs-row.issuedAtMs<0||row.validStartMs-row.issuedAtMs>15*MINUTE||
    row.validStartMs-row.baselineIssuedAtMs>24*60*MINUTE)return null;
 const horizon=(row.validEndMs-row.validStartMs)/MINUTE;
 if(horizon!==15&&horizon!==30&&horizon!==60)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(row.localTargetDate)||localDate(row)!==row.localTargetDate||
    !probability(row.forecastProbability)||!probability(row.baselineProbability)||
    !finite(row.rainThresholdMm)||row.rainThresholdMm<=0)return null;
 if(!Array.isArray(row.observations)||!row.observations.length||row.observations.length>MAX_FRAMES)return null;
 let cursor=row.validStartMs;
 for(const entry of row.observations){
  if(!ms(entry.startMs)||!ms(entry.endMs)||entry.startMs!==cursor||
     entry.endMs<=entry.startMs||entry.endMs>row.validEndMs||
     entry.complete!==true||!finite(entry.amountMm)||entry.amountMm<0)return null;
  cursor=entry.endMs;
 }
 return cursor===row.validEndMs?horizon:null;
}
const ratio=(num:number,den:number)=>den>0?num/den:null;
/**
 * O(cases * native observations + groups * cases), bounded by 10k cases and
 * <=120 sub-intervals per case; aggregate by true local calendar day.
 */
export function summarizeTwinNowcastVerification(rows:readonly NowcastCase[],window:NowcastWindow):NowcastSkillReport{
 const invalid=():NowcastSkillReport=>({validWindow:false,acceptedCases:0,rejected:{'invalid-window-or-budget':rows.length},groups:[],statement:'invalid-window'});
 if(!ms(window.startMs)||!ms(window.endMs)||window.endMs<=window.startMs||rows.length>MAX_CASES)return invalid();
 type V={row:NowcastCase;horizon:NowcastHorizon;key:string;event:number};
 const valid:V[]=[],duplicates=new Map<string,number>(),rejected:Record<string,number>={};
 const reject=(why:string)=>{rejected[why]=(rejected[why]||0)+1;};
 for(const row of rows){
  const horizon=admissible(row,window);
  if(!horizon){reject('inadmissible-interval-or-provenance');continue;}
  // Same site/model/station/target/threshold must never be cherry-picked by run.
  const key=[row.siteKey,row.stationId,row.modelId,row.validStartMs,row.validEndMs,row.rainThresholdMm].join('|');
  const total=row.observations.reduce((s,x)=>s+x.amountMm,0);
  if(!Number.isFinite(total)){reject('accumulation-overflow');continue;}
  valid.push({row,horizon,key,event:+(total>row.rainThresholdMm)});
  duplicates.set(key,(duplicates.get(key)||0)+1);
 }
 type Day={candidate:number;baseline:number;n:number};
 type Bin={n:number;p:number;events:number};
 type Group={siteKey:string;stationId:string;modelId:string;horizon:NowcastHorizon;threshold:number;origin:NowcastCase['probabilityOrigin'];cases:number;events:number;days:Map<string,Day>;bins:Bin[];tp:number;fn:number;fp:number;tn:number};
 const groups=new Map<string,Group>();
 let acceptedCases=0;
 for(const {row,horizon,key,event} of valid){
  if(duplicates.get(key)!==1){reject('ambiguous-duplicate');continue;}
  const groupKey=[row.siteKey,row.stationId,row.modelId,horizon,row.rainThresholdMm,row.probabilityOrigin].join('|');
  let group=groups.get(groupKey);
  if(!group){group={siteKey:row.siteKey,stationId:row.stationId,modelId:row.modelId,horizon,threshold:row.rainThresholdMm,origin:row.probabilityOrigin,cases:0,events:0,days:new Map(),bins:Array.from({length:10},()=>({n:0,p:0,events:0})),tp:0,fn:0,fp:0,tn:0};groups.set(groupKey,group);}
  const day=group.days.get(row.localTargetDate)||{candidate:0,baseline:0,n:0};
  day.candidate+=(row.forecastProbability-event)**2;day.baseline+=(row.baselineProbability-event)**2;day.n++;
  group.days.set(row.localTargetDate,day);
  const bin=group.bins[Math.min(9,Math.floor(row.forecastProbability*10))];bin.n++;bin.p+=row.forecastProbability;bin.events+=event;
  const selected=row.forecastProbability>=.5;
  if(selected&&event)group.tp++;else if(selected)group.fp++;else if(event)group.fn++;else group.tn++;
  group.events+=event;group.cases++;acceptedCases++;
 }
 const result=[...groups.values()].map((g):NowcastSkillGroup=>{
  const days=[...g.days.values()],n=days.length;
  const candidate=days.reduce((s,d)=>s+d.candidate/d.n,0)/n;
  const baseline=days.reduce((s,d)=>s+d.baseline/d.n,0)/n;
  const eligible=n>=MIN_EXPLORATORY_DAYS;
  const reliability=g.bins.map((bin,index):NowcastReliabilityBin=>({
   from:index/10,to:(index+1)/10,cases:bin.n,
   meanProbability:eligible&&bin.n>=10?bin.p/bin.n:null,
   observedFrequency:eligible&&bin.n>=10?bin.events/bin.n:null
  }));
  return {siteKey:g.siteKey,stationId:g.stationId,modelId:g.modelId,horizonMinutes:g.horizon,
   rainThresholdMm:g.threshold,probabilityOrigin:g.origin,pairedCases:g.cases,independentDays:n,eventCases:g.events,
   candidateBrier:candidate,baselineBrier:baseline,pairedBrierDifference:baseline-candidate,
   relativeSkill:eligible&&baseline>0?1-candidate/baseline:null,
   hits:g.tp,misses:g.fn,falseAlarms:g.fp,correctNegatives:g.tn,
   pod:eligible?ratio(g.tp,g.tp+g.fn):null,
   far:eligible?ratio(g.fp,g.tp+g.fp):null,
   csi:eligible?ratio(g.tp,g.tp+g.fp+g.fn):null,
   reliability,status:eligible?'exploratory-only':'insufficient-days'};
 });
 result.sort((x,y)=>x.siteKey.localeCompare(y.siteKey)||x.stationId.localeCompare(y.stationId)||x.modelId.localeCompare(y.modelId)||x.horizonMinutes-y.horizonMinutes||x.rainThresholdMm-y.rainThresholdMm);
 return {validWindow:true,acceptedCases,rejected,groups:result,statement:'research-only-no-public-skill'};
}
