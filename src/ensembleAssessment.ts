/** Decision-oriented ensemble agreement. No calibrated forecast accuracy is claimed. */
export const ENSEMBLE_PARAMETERS=['temperature','precipitation','wind','sunshine'] as const;
export type EnsembleParameter=typeof ENSEMBLE_PARAMETERS[number];
export type Agreement='high'|'medium'|'low'|'unknown';
export type ParameterCoverage={members:number;expectedMembers:number;families:number;expectedFamilies:number;freshFamilies:number;oldestInitialisation:string|null;freshUntil:string|null;maxAgeHours:number};
export type ParameterEvidence={low:number|null;high:number|null;secondaryLow?:number|null;secondaryHigh?:number|null;eventProbability?:number|null;coverage:ParameterCoverage};
export type EnsembleEvidence=Record<EnsembleParameter,ParameterEvidence>;
export type EvidenceRow={max:number;min:number;precipitation:number;wind:number;gust:number;sunshineDuration:number|null;daylightSeconds?:number;complete?:Partial<Record<EnsembleParameter,boolean>>};
export type EvidenceContribution={group:string;native:boolean;initialisationTime?:string;updateHours:number;expectedMembers:number;rows:EvidenceRow[];weights:Record<EnsembleParameter,number>};
export type ParameterAssessment={key:EnsembleParameter;label:string;agreement:Agreement;spreadAgreement:Agreement;quality:'sufficient'|'limited'|'missing';detail:string;coverage:ParameterCoverage|null};
export type DayAssessment={date:string;agreement:Agreement;parameters:ParameterAssessment[];limiting:ParameterAssessment[];complete:boolean};
const labels:Record<EnsembleParameter,string>={temperature:'Temperatur',precipitation:'Niederschlag',wind:'Wind/Böen',sunshine:'Sonne'};
export const AGREEMENT_LABEL:Record<Agreement,string>={high:'hoch',medium:'mittel',low:'gering',unknown:'nicht bewertbar'};
export const AGREEMENT_COLOR:Record<Agreement,string>={high:'#429963',medium:'#ad7d22',low:'#c6554d',unknown:'#7c8795'};
// Explicit display tolerances, not empirically established accuracy thresholds.
export const AGREEMENT_TOLERANCES={temperature:[4,8],precipitation:[3,10],wind:[8,16],gust:[12,24],sunshine:[.25,.5]} as const;
const valid=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
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
export function buildEnsembleEvidence(contributions:EvidenceContribution[],now=Date.now()):EnsembleEvidence{
 const result={} as EnsembleEvidence;
 for(const key of ENSEMBLE_PARAMETERS){
  const expected=new Set(contributions.map(c=>c.group)),families=new Set<string>(),freshFamilies=new Set<string>(),values:{value:number;weight:number}[]=[],secondary:{value:number;weight:number}[]=[];
  let members=0,expectedMembers=0,oldest=Infinity,freshUntil=Infinity,unknownRun=false,maxAgeHours=0;
  // Renormalize within available independent groups; incomplete members never act as zero samples.
  const usable=contributions.map(c=>({c,rows:c.native?c.rows.map(r=>sample(r,key)).filter((v):v is [number,number?]=>v!==null):[]}));
  const variants=new Map<string,number>();for(const {c,rows} of usable)if(rows.length)variants.set(c.group,(variants.get(c.group)??0)+1);
  for(const {c,rows} of usable){
   expectedMembers+=c.native?c.expectedMembers:0;
   if(!rows.length)continue;
   families.add(c.group);members+=rows.length;
   const init=Date.parse(c.initialisationTime??''),age=(now-init)/3600000,limit=Math.max(1,c.updateHours)*2;
   if(Number.isFinite(init)&&age>=-.5){freshUntil=Math.min(freshUntil,init+limit*3600000);oldest=Math.min(oldest,init);maxAgeHours=Math.max(maxAgeHours,age);if(age<=limit)freshFamilies.add(c.group)}else unknownRun=true;
   const weight=c.weights[key]/rows.length/Math.max(1,variants.get(c.group)??1);
   for(const row of rows){values.push({value:row[0],weight});if(valid(row[1]))secondary.push({value:row[1],weight})}
  }
  const weight=values.reduce((s,v)=>s+v.weight,0);
  result[key]={low:quantile(values,.1),high:quantile(values,.9),secondaryLow:quantile(secondary,.1),secondaryHigh:quantile(secondary,.9),eventProbability:key==='precipitation'&&weight>0?100*values.filter(v=>v.value>.2).reduce((s,v)=>s+v.weight,0)/weight:null,coverage:{members,expectedMembers,families:families.size,expectedFamilies:expected.size,freshFamilies:freshFamilies.size,freshUntil:!unknownRun&&Number.isFinite(freshUntil)?new Date(freshUntil).toISOString():null,oldestInitialisation:Number.isFinite(oldest)?new Date(oldest).toISOString():null,maxAgeHours}};
 }
 return result;
}
const rank:Record<Agreement,number>={high:0,medium:1,low:2,unknown:3};
function worse(a:Agreement,b:Agreement):Agreement{return rank[a]>=rank[b]?a:b}
function width(low:unknown,high:unknown){return valid(low)&&valid(high)&&high>=low?high-low:null}
function classify(value:number|null,limits:readonly[number,number]):Agreement{return value===null?'unknown':value<=limits[0]?'high':value<=limits[1]?'medium':'low'}
function number(value:number|null,unit:string){return value===null?'–':`${value.toLocaleString('de-DE',{maximumFractionDigits:1})} ${unit}`}
export function assessEnsembleDay(day:{date:string;consistencyEvidence?:EnsembleEvidence},now=Date.now()):DayAssessment{
 const parameters=ENSEMBLE_PARAMETERS.map(key=>{
  const evidence=day.consistencyEvidence?.[key],coverage=evidence?.coverage??null,a=width(evidence?.low,evidence?.high),b=width(evidence?.secondaryLow,evidence?.secondaryHigh);
  let spreadAgreement:Agreement='unknown',detail='Keine vollständigen nativen Ensemblewerte.';
  if(evidence){
   if(key==='temperature'){spreadAgreement=worse(classify(a,AGREEMENT_TOLERANCES.temperature),classify(b,AGREEMENT_TOLERANCES.temperature));detail=`P10–P90-Breite: Tmax ${number(a,'K')}, Tmin ${number(b,'K')}`}
   if(key==='precipitation'){spreadAgreement=classify(a,AGREEMENT_TOLERANCES.precipitation);const p=evidence.eventProbability;if(valid(p)&&p>=0&&p<=100){const ambiguity=Math.min(p,100-p);spreadAgreement=worse(spreadAgreement,ambiguity<=20?'high':ambiguity<=35?'medium':'low')}else spreadAgreement='unknown';detail=`P10–P90-Breite ${number(a,'mm')}; Nassanteil (>0,2 mm/Tag) ${number(valid(p)?p:null,'%')}`}
   if(key==='wind'){spreadAgreement=worse(classify(a,AGREEMENT_TOLERANCES.wind),classify(b,AGREEMENT_TOLERANCES.gust));detail=`P10–P90-Breite: Wind ${number(a,'kt')}, Böen ${number(b,'kt')}`}
   if(key==='sunshine'){spreadAgreement=classify(a,AGREEMENT_TOLERANCES.sunshine);detail=`P10–P90-Breite der relativen Sonnenscheindauer ${number(a===null?null:a*100,'Prozentpunkte')}`}
  }
  const expired=!coverage?.freshUntil||!Number.isFinite(Date.parse(coverage.freshUntil))||now>Date.parse(coverage.freshUntil);
  const enough=coverage!==null&&coverage.members>=6&&coverage.families>=2&&spreadAgreement!=='unknown';
  const sufficient=enough&&!expired&&coverage.freshFamilies===coverage.families&&coverage.families===coverage.expectedFamilies&&coverage.members>=coverage.expectedMembers*.8;
  const quality:ParameterAssessment['quality']=!enough?'missing':sufficient?'sufficient':'limited';
  const agreement:Agreement=!enough?'unknown':sufficient?spreadAgreement:worse(spreadAgreement,'medium');
  return{key,label:labels[key],agreement,spreadAgreement,quality,detail,coverage};
 });
 const agreement=parameters.reduce<Agreement>((status,p)=>worse(status,p.agreement),'high'),complete=parameters.every(p=>p.quality==='sufficient');
 return{date:day.date,agreement,parameters,limiting:parameters.filter(p=>p.agreement===agreement),complete};
}
export function assessmentSummary(day:DayAssessment){return `Modellübereinstimmung ${AGREEMENT_LABEL[day.agreement]}${day.agreement==='high'?'':` · ${day.limiting.map(p=>p.label).join(', ')}`}`}
export type AgreementWindow={start:string;end:string;days:number};
export function agreementWindows(days:DayAssessment[],parameter?:EnsembleParameter):AgreementWindow[]{
 const result:AgreementWindow[]=[];let current:AgreementWindow|null=null;
 for(const day of [...days].sort((a,b)=>a.date.localeCompare(b.date))){
  const item=parameter?day.parameters.find(p=>p.key===parameter):null,qualifies=parameter?item?.agreement==='high'&&item.quality==='sufficient':day.agreement==='high'&&day.complete;
  const epoch=Date.parse(`${day.date}T12:00:00Z`);if(!qualifies||!Number.isFinite(epoch)){current=null;continue}
  if(current&&epoch-Date.parse(`${current.end}T12:00:00Z`)===86400000){current.end=day.date;current.days++}else{current={start:day.date,end:day.date,days:1};result.push(current)}
 }
 return result;
}
export function firstAgreementChange(days:DayAssessment[]){
 for(let i=1;i<days.length;i++){const before=days[i-1],after=days[i];if(Date.parse(after.date)-Date.parse(before.date)!==86400000)continue;if(rank[after.agreement]>rank[before.agreement])return after}
 return null;
}
/** Legacy chart decoration only: categorical agreement mapped to opacity, never shown as percent. */
export function agreementVisualValue(day:DayAssessment){return{high:90,medium:60,low:30,unknown:0}[day.agreement]}
