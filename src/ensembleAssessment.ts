/**
 * Decision-oriented ensemble confidence.
 *
 * Important: the score is an internal confidence index, never a probability of a
 * correct forecast.  It combines parameter-specific ensemble spread, lead-time
 * normalization and (when available) a small, shrinkage-limited local skill
 * correction from MID's verification archive.  Data quality is assessed
 * separately so that missing/stale families do not masquerade as meteorological
 * uncertainty.
 */
export const ENSEMBLE_PARAMETERS=['temperature','precipitation','wind','sunshine'] as const;
export type EnsembleParameter=typeof ENSEMBLE_PARAMETERS[number];
export type Agreement='high'|'medium'|'low'|'unknown';
export type DataQuality='good'|'limited'|'poor'|'missing';
export type ParameterCoverage={members:number;expectedMembers:number;families:number;expectedFamilies:number;freshFamilies:number;oldestInitialisation:string|null;freshUntil:string|null;maxAgeHours:number};
export type ParameterEvidence={low:number|null;high:number|null;secondaryLow?:number|null;secondaryHigh?:number|null;eventProbability?:number|null;coverage:ParameterCoverage};
export type EnsembleEvidence=Record<EnsembleParameter,ParameterEvidence>;
export type EvidenceRow={max:number;min:number;precipitation:number;wind:number;gust:number;sunshineDuration:number|null;daylightSeconds?:number;complete?:Partial<Record<EnsembleParameter,boolean>>};
export type EvidenceContribution={group:string;native:boolean;initialisationTime?:string;updateHours:number;expectedMembers:number;rows:EvidenceRow[];weights:Record<EnsembleParameter,number>};
export type EnsembleSkillMetric={samples:number;error:number};
export type EnsembleSkillBucket={parameters?:Partial<Record<EnsembleParameter,EnsembleSkillMetric>>;rainProbability?:EnsembleSkillMetric};
export type EnsembleConfidenceCalibration={sampleDays:number;global?:EnsembleSkillBucket;horizons?:Partial<Record<'24'|'48'|'72',EnsembleSkillBucket>>};
export type ParameterAssessment={
 key:EnsembleParameter;
 label:string;
 agreement:Agreement;
 spreadAgreement:Agreement;
 quality:'sufficient'|'limited'|'missing';
 score:number|null;
 rawScore:number|null;
 detail:string;
 coverage:ParameterCoverage|null;
 leadFactor:number;
 calibrationAdjustment:number;
 decisionUncertainty?:'open'|'moderate'|'clear';
};
export type DayAssessment={
 date:string;
 agreement:Agreement;
 confidenceScore:number|null;
 dataQuality:DataQuality;
 parameters:ParameterAssessment[];
 limiting:ParameterAssessment[];
 complete:boolean;
 leadHours:number;
 leadFactor:number;
 calibrationApplied:boolean;
 calibrationSampleDays:number;
};
const labels:Record<EnsembleParameter,string>={temperature:'Temperatur',precipitation:'Niederschlag',wind:'Wind/Böen',sunshine:'Sonne'};
export const AGREEMENT_LABEL:Record<Agreement,string>={high:'hoch',medium:'mittel',low:'gering',unknown:'nicht bewertbar'};
export const AGREEMENT_COLOR:Record<Agreement,string>={high:'#429963',medium:'#ad7d22',low:'#c6554d',unknown:'#7c8795'};
export const DATA_QUALITY_LABEL:Record<DataQuality,string>={good:'gut',limited:'eingeschränkt',poor:'schwach',missing:'nicht ausreichend'};
// Baseline display tolerances at short lead time.  They are normalized upward with lead time.
export const AGREEMENT_TOLERANCES={temperature:[4,8],precipitation:[3,10],wind:[8,16],gust:[12,24],sunshine:[.25,.5]} as const;
export const PARAMETER_CONFIDENCE_WEIGHTS:Record<EnsembleParameter,number>={temperature:.28,precipitation:.32,wind:.28,sunshine:.12};
const valid=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
const clamp=(value:number,minimum:number,maximum:number)=>Math.min(maximum,Math.max(minimum,value));
function quantile(values:{value:number;weight:number}[],p:number){const sorted=values.filter(v=>valid(v.value)&&v.weight>0).sort((a,b)=>a.value-b.value),total=sorted.reduce((s,v)=>s+v.weight,0);if(!total)return null;let sum=0;for(const row of sorted){sum+=row.weight;if(sum>=p*total)return row.value}return sorted.at(-1)?.value??null}
function sample(row:EvidenceRow,key:EnsembleParameter):[number,number?]|null{
 if(row.complete?.[key]!==true)return null;
 if(key==='temperature')return valid(row.max)&&valid(row.min)&&row.max>=row.min?[row.max,row.min]:null;
 if(key==='precipitation')return valid(row.precipitation)&&row.precipitation>=0?[row.precipitation]:null;
 if(key==='wind')return valid(row.wind)&&valid(row.gust)&&row.wind>=0&&row.gust>=0?[row.wind,row.gust]:null;
 if(!valid(row.sunshineDuration)||row.sunshineDuration<0||!valid(row.daylightSeconds)||row.daylightSeconds<0)return null;
 // During polar night relative sunshine is deterministically zero, not division by zero.
 return [row.daylightSeconds===0?0:Math.max(0,Math.min(1,row.sunshineDuration/row.daylightSeconds))];
}
function parameterDeclared(row:EvidenceRow,key:EnsembleParameter){return Boolean(row.complete&&Object.prototype.hasOwnProperty.call(row.complete,key))}
export function buildEnsembleEvidence(contributions:EvidenceContribution[],now=Date.now()):EnsembleEvidence{
 const result={} as EnsembleEvidence;
 for(const key of ENSEMBLE_PARAMETERS){
  const expectedGroups=new Set<string>(),families=new Set<string>(),freshGroups=new Map<string,boolean>(),values:{value:number;weight:number}[]=[],secondary:{value:number;weight:number}[]=[],expectedMembersByGroup=new Map<string,number>(),membersByGroup=new Map<string,number>();
  let oldest=Infinity,freshUntil=Infinity,unknownRun=false,maxAgeHours=0;
  // Expected coverage is parameter-specific.  A family that does not expose the
  // parameter at all must not make that parameter look incomplete.
  for(const contribution of contributions){
   if(!contribution.native||!(contribution.weights[key]>0)||!contribution.rows.some(row=>parameterDeclared(row,key)))continue;
   expectedGroups.add(contribution.group);
   expectedMembersByGroup.set(contribution.group,Math.max(expectedMembersByGroup.get(contribution.group)??0,Math.max(0,contribution.expectedMembers)));
  }
  // Renormalize within available independent groups; incomplete members never act as zero samples.
  const usable=contributions.map(c=>({c,rows:c.native?c.rows.map(r=>sample(r,key)).filter((v):v is [number,number?]=>v!==null):[]}));
  const variants=new Map<string,number>();for(const {c,rows} of usable)if(rows.length)variants.set(c.group,(variants.get(c.group)??0)+1);
  for(const {c,rows} of usable){
   if(!rows.length)continue;
   families.add(c.group);membersByGroup.set(c.group,Math.max(membersByGroup.get(c.group)??0,rows.length));
   const init=Date.parse(c.initialisationTime??''),age=(now-init)/3600000,limit=Math.max(1,c.updateHours)*2;
   let variantFresh=false;
   if(Number.isFinite(init)&&age>=-.5){freshUntil=Math.min(freshUntil,init+limit*3600000);oldest=Math.min(oldest,init);maxAgeHours=Math.max(maxAgeHours,age);variantFresh=age<=limit}else unknownRun=true;
   freshGroups.set(c.group,(freshGroups.get(c.group)??true)&&variantFresh);
   const weight=c.weights[key]/rows.length/Math.max(1,variants.get(c.group)??1);
   for(const row of rows){values.push({value:row[0],weight});if(valid(row[1]))secondary.push({value:row[1],weight})}
  }
  const weight=values.reduce((s,v)=>s+v.weight,0),members=[...membersByGroup.values()].reduce((a,b)=>a+b,0),expectedMembers=[...expectedMembersByGroup.values()].reduce((a,b)=>a+b,0),freshFamilies=[...freshGroups.values()].filter(Boolean).length;
  result[key]={low:quantile(values,.1),high:quantile(values,.9),secondaryLow:quantile(secondary,.1),secondaryHigh:quantile(secondary,.9),eventProbability:key==='precipitation'&&weight>0?100*values.filter(v=>v.value>.2).reduce((s,v)=>s+v.weight,0)/weight:null,coverage:{members,expectedMembers,families:families.size,expectedFamilies:expectedGroups.size,freshFamilies,freshUntil:!unknownRun&&Number.isFinite(freshUntil)?new Date(freshUntil).toISOString():null,oldestInitialisation:Number.isFinite(oldest)?new Date(oldest).toISOString():null,maxAgeHours}};
 }
 return result;
}
const rank:Record<Agreement,number>={high:0,medium:1,low:2,unknown:3};
function width(low:unknown,high:unknown){return valid(low)&&valid(high)&&high>=low?high-low:null}
function number(value:number|null,unit:string){return value===null?'–':`${value.toLocaleString('de-DE',{maximumFractionDigits:1})} ${unit}`}
function targetLeadHours(date:string,now:number){const epoch=Date.parse(`${date}T12:00:00Z`);return Number.isFinite(epoch)?Math.max(0,(epoch-now)/3600000):0}
/** Normalization reflects that ensemble spread normally grows with forecast lead. */
export function ensembleLeadFactor(leadHours:number){const h=Math.max(0,leadHours),points:[[number,number],[number,number],[number,number],[number,number],[number,number],[number,number],[number,number]]=[[0,1],[48,1],[96,1.1],[144,1.22],[192,1.36],[264,1.52],[336,1.68]];for(let i=1;i<points.length;i++){const [rightH,right]=points[i],[leftH,left]=points[i-1];if(h<=rightH){const t=(h-leftH)/Math.max(1,rightH-leftH);return left+(right-left)*t}}return points.at(-1)![1]}
function scaledLimits(limits:readonly[number,number],factor:number):readonly[number,number]{return[limits[0]*factor,limits[1]*factor] as const}
function spreadScore(value:number|null,limits:readonly[number,number]){if(value===null)return null;const [high,medium]=limits;if(value<=high)return clamp(96-14*(value/Math.max(.0001,high)),82,100);if(value<=medium)return 82-34*((value-high)/Math.max(.0001,medium-high));return clamp(48*Math.exp(-.82*(value-medium)/Math.max(.0001,medium)),8,48)}
function agreementFromScore(score:number|null):Agreement{return score===null?'unknown':score>=72?'high':score>=44?'medium':'low'}
function meanScore(values:(number|null)[],weights:number[]){let sum=0,total=0;for(let i=0;i<values.length;i++){const value=values[i];if(value===null)continue;const weight=weights[i]??1;sum+=value*weight;total+=weight}return total?sum/total:null}
function calibrationBucket(calibration:EnsembleConfidenceCalibration|undefined,leadHours:number){if(!calibration||calibration.sampleDays<5||leadHours>96)return undefined;const horizon: '24'|'48'|'72'=leadHours<=36?'24':leadHours<=60?'48':'72';return calibration.horizons?.[horizon]??calibration.global}
function metricAdjustment(metric:EnsembleSkillMetric|undefined,benchmark:number,amplitude:number){if(!metric||metric.samples<4||!valid(metric.error))return 0;const shrink=metric.samples/(metric.samples+12),relative=(benchmark-metric.error)/Math.max(.1,benchmark);return clamp(relative*amplitude*shrink,-6,5)}
function calibrationAdjustment(key:EnsembleParameter,calibration:EnsembleConfidenceCalibration|undefined,leadHours:number){const bucket=calibrationBucket(calibration,leadHours);if(!bucket)return 0;const metric=bucket.parameters?.[key];if(key==='temperature')return metricAdjustment(metric,2.5,7);if(key==='wind')return metricAdjustment(metric,7,7);if(key==='sunshine')return metricAdjustment(metric,2.5,5);const amount=metricAdjustment(metric,3,6),brier=metricAdjustment(bucket.rainProbability,.22,5);return clamp(amount*.58+brier*.42,-6,5)}
function parameterQuality(coverage:ParameterCoverage|null,score:number|null,now:number):ParameterAssessment['quality']{
 if(!coverage||score===null||coverage.families<2||coverage.members<6)return'missing';
 const expired=!coverage.freshUntil||!Number.isFinite(Date.parse(coverage.freshUntil))||now>Date.parse(coverage.freshUntil),memberRatio=coverage.expectedMembers>0?coverage.members/coverage.expectedMembers:1,familyRatio=coverage.expectedFamilies>0?coverage.families/coverage.expectedFamilies:1,allFresh=coverage.freshFamilies===coverage.families;
 return !expired&&allFresh&&memberRatio>=.65&&familyRatio>=.75?'sufficient':'limited';
}
function dayDataQuality(parameters:ParameterAssessment[]):DataQuality{
 const core=parameters.filter(parameter=>parameter.key!=='sunshine'),availableCore=core.filter(parameter=>parameter.quality!=='missing');
 if(availableCore.length<2)return'missing';
 const limitedCore=availableCore.filter(parameter=>parameter.quality==='limited').length,missingCore=core.length-availableCore.length;
 if(missingCore||limitedCore>=2)return'poor';
 if(limitedCore||parameters.find(parameter=>parameter.key==='sunshine')?.quality!=='sufficient')return'limited';
 return'good';
}
function confidenceLeadCap(leadHours:number){if(leadHours<=72)return 96;if(leadHours<=120)return 92;if(leadHours<=168)return 88;if(leadHours<=216)return 84;if(leadHours<=264)return 80;if(leadHours<=312)return 77;return 74}
function robustDayScore(parameters:ParameterAssessment[],leadHours:number,dataQuality:DataQuality){
 const available=parameters.filter(parameter=>parameter.score!==null),core=available.filter(parameter=>parameter.key!=='sunshine');if(core.length<2)return null;
 let weighted=0,total=0;for(const parameter of available){const weight=PARAMETER_CONFIDENCE_WEIGHTS[parameter.key];weighted+=Number(parameter.score)*weight;total+=weight}if(!total)return null;
 let score=weighted/total,lowCore=core.filter(parameter=>Number(parameter.score)<44),veryLowCore=core.filter(parameter=>Number(parameter.score)<28);if(lowCore.length>=2)score-=8;else if(veryLowCore.length)score-=4;
 // Data completeness is deliberately not equated with meteorological spread.  It
 // only limits how assertively the aggregate may be presented.
 if(dataQuality==='poor')score-=4;
 if(dataQuality==='limited')score-=1.5;
 if(dataQuality==='missing')return null;
 return clamp(Math.min(score,confidenceLeadCap(leadHours)),0,100);
}
export function assessEnsembleDay(day:{date:string;consistencyEvidence?:EnsembleEvidence},now=Date.now(),calibration?:EnsembleConfidenceCalibration):DayAssessment{
 const leadHours=targetLeadHours(day.date,now),leadFactor=ensembleLeadFactor(leadHours);
 const parameters=ENSEMBLE_PARAMETERS.map(key=>{
  const evidence=day.consistencyEvidence?.[key],coverage=evidence?.coverage??null,a=width(evidence?.low,evidence?.high),b=width(evidence?.secondaryLow,evidence?.secondaryHigh),adjustment=calibrationAdjustment(key,calibration,leadHours);
  let rawScore:number|null=null,detail='Keine vollständigen nativen Ensemblewerte.',decisionUncertainty:ParameterAssessment['decisionUncertainty'];
  if(evidence){
   if(key==='temperature'){const maxScore=spreadScore(a,scaledLimits(AGREEMENT_TOLERANCES.temperature,leadFactor)),minScore=spreadScore(b,scaledLimits(AGREEMENT_TOLERANCES.temperature,leadFactor));rawScore=meanScore([maxScore,minScore],[.5,.5]);detail=`P10–P90-Breite: Tmax ${number(a,'K')}, Tmin ${number(b,'K')}`}
   if(key==='precipitation'){rawScore=spreadScore(a,scaledLimits(AGREEMENT_TOLERANCES.precipitation,leadFactor));const p=evidence.eventProbability;decisionUncertainty=valid(p)&&p>=0&&p<=100?(p>=35&&p<=65?'open':p>=20&&p<=80?'moderate':'clear'):undefined;detail=`P10–P90-Breite ${number(a,'mm')}; Ereignisanteil (>0,2 mm/Tag) ${number(valid(p)?p:null,'%')}${decisionUncertainty==='open'?' · Ausgang offen, ohne Konfidenzstrafe':''}`}
   if(key==='wind'){const windScore=spreadScore(a,scaledLimits(AGREEMENT_TOLERANCES.wind,leadFactor)),gustScore=spreadScore(b,scaledLimits(AGREEMENT_TOLERANCES.gust,leadFactor));rawScore=meanScore([windScore,gustScore],[.4,.6]);detail=`P10–P90-Breite: Wind ${number(a,'kt')}, Böen ${number(b,'kt')}`}
   if(key==='sunshine'){rawScore=spreadScore(a,scaledLimits(AGREEMENT_TOLERANCES.sunshine,leadFactor));detail=`P10–P90-Breite der relativen Sonnenscheindauer ${number(a===null?null:a*100,'Prozentpunkte')}`}
  }
  const quality=parameterQuality(coverage,rawScore,now),score=rawScore===null?null:clamp(rawScore+adjustment,0,100),spreadAgreement=agreementFromScore(rawScore),agreement=quality==='missing'?'unknown':agreementFromScore(score);
  return{key,label:labels[key],agreement,spreadAgreement,quality,score,rawScore,detail,coverage,leadFactor,calibrationAdjustment:adjustment,decisionUncertainty};
 });
 const dataQuality=dayDataQuality(parameters),confidenceScore=robustDayScore(parameters,leadHours,dataQuality),agreement=agreementFromScore(confidenceScore),scored=parameters.filter(parameter=>parameter.score!==null&&parameter.key!=='sunshine'),minimum=scored.length?Math.min(...scored.map(parameter=>Number(parameter.score))):Infinity,limiting=scored.filter(parameter=>Number(parameter.score)<=minimum+6).slice(0,2),complete=dataQuality==='good',calibrationApplied=parameters.some(parameter=>Math.abs(parameter.calibrationAdjustment)>=.25);
 return{date:day.date,agreement,confidenceScore,dataQuality,parameters,limiting,complete,leadHours,leadFactor,calibrationApplied,calibrationSampleDays:calibration?.sampleDays??0};
}
export function assessmentSummary(day:DayAssessment){const score=day.confidenceScore===null?'':` · Index ${Math.round(day.confidenceScore)}/100`,limiting=day.agreement==='high'||!day.limiting.length?'':` · unsicherer: ${day.limiting.map(p=>p.label).join(', ')}`;return `Prognosekonfidenz ${AGREEMENT_LABEL[day.agreement]}${score} · Datenbasis ${DATA_QUALITY_LABEL[day.dataQuality]}${limiting}`}
export type AgreementWindow={start:string;end:string;days:number};
export function agreementWindows(days:DayAssessment[],parameter?:EnsembleParameter):AgreementWindow[]{
 const result:AgreementWindow[]=[];let current:AgreementWindow|null=null;
 for(const day of [...days].sort((a,b)=>a.date.localeCompare(b.date))){
  const item=parameter?day.parameters.find(p=>p.key===parameter):null,qualifies=parameter?item?.agreement==='high'&&item.quality!=='missing':day.agreement==='high'&&day.dataQuality!=='poor'&&day.dataQuality!=='missing';
  const epoch=Date.parse(`${day.date}T12:00:00Z`);if(!qualifies||!Number.isFinite(epoch)){current=null;continue}
  if(current&&epoch-Date.parse(`${current.end}T12:00:00Z`)===86400000){current.end=day.date;current.days++}else{current={start:day.date,end:day.date,days:1};result.push(current)}
 }
 return result;
}
export function firstAgreementChange(days:DayAssessment[]){for(let i=1;i<days.length;i++){const before=days[i-1],after=days[i];if(Date.parse(after.date)-Date.parse(before.date)!==86400000)continue;if(rank[after.agreement]>rank[before.agreement])return after}return null}
/** Internal 0–100 confidence index for visual emphasis. Never display it as a probability. */
export function agreementVisualValue(day:DayAssessment){return day.confidenceScore??0}
