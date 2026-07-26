import type {Day,EnsembleDay,Hour,ModelRunMeta} from './weather';

export type ModelChangeSeverity='info'|'material'|'major';
export type ModelChangeMetric='tmax'|'tmin'|'precipitation'|'probability'|'gust'|'confidence'|'spread'|'onset';
export type ModelChangeItem={
 id:string;
 date?:string;
 metric:ModelChangeMetric;
 severity:ModelChangeSeverity;
 label:string;
 detail:string;
 delta?:number;
};
export type ModelChangeSnapshotDay={
 date:string;
 bestMax:number;
 bestMin:number;
 ensembleMax:number;
 ensembleMin:number;
 precipitation:number;
 probability:number;
 gust:number;
 confidence:number;
 spread:number;
};
export type ModelChangeSnapshot={
 version:1;
 createdAt:string;
 runKey:string;
 runTime?:string;
 signature:string;
 precipitationOnset?:string;
 days:ModelChangeSnapshotDay[];
};
export type ModelChangeReport={
 baseline:boolean;
 unchanged:boolean;
 previous?:ModelChangeSnapshot;
 current:ModelChangeSnapshot;
 items:ModelChangeItem[];
 materialCount:number;
 majorCount:number;
};

const STORAGE_PREFIX='mid:model-run-change:';
const severityOrder:Record<ModelChangeSeverity,number>={major:3,material:2,info:1};
function finite(value:unknown,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
function rounded(value:number,digits=1){const factor=10**digits;return Math.round(value*factor)/factor}
function signed(value:number,digits=1){const number=rounded(value,digits);return`${number>0?'+':''}${new Intl.NumberFormat('de-DE',{minimumFractionDigits:0,maximumFractionDigits:digits}).format(number)}`}
function dayLabel(date:string){const match=String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return date;const value=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12));return new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(value)}
function confidenceFor(row:EnsembleDay,index:number,maxModels:number){
 const spread=Math.max(0,((row.maxHigh-row.maxLow)+(row.minHigh-row.minLow))/2),scoreSpread=Math.max(25,Math.min(97,100-spread*7.5)),scoreLead=Math.max(45,Math.min(100,100-index*3.7)),scoreModels=Math.max(55,Math.min(100,55+(row.modelCount/Math.max(1,maxModels))*45));
 return Math.round(Math.max(25,Math.min(97,scoreSpread*.48+scoreLead*.22+scoreModels*.30)));
}
function firstPrecipitationOnset(hours:Hour[]){
 const now=Date.now()-3600000,limit=Date.now()+8*86400000;
 const row=hours.find(hour=>hour.epoch>=now&&hour.epoch<=limit&&(finite(hour.precipitation)>=.1||(finite(hour.probability)>=65&&(finite(hour.rain)+finite(hour.showers)+finite(hour.snowfall))>.02)));
 return row?.time;
}
function runTime(runs:ModelRunMeta[]){return runs.map(row=>row.initialisationTime||row.availabilityTime||'').filter(Boolean).sort().at(-1)}
function snapshotSignature(days:ModelChangeSnapshotDay[],precipitationOnset?:string){return JSON.stringify({days:days.map(row=>[row.date,rounded(row.bestMax),rounded(row.bestMin),rounded(row.ensembleMax),rounded(row.ensembleMin),rounded(row.precipitation),Math.round(row.probability),rounded(row.gust),Math.round(row.confidence),rounded(row.spread)]),precipitationOnset:precipitationOnset||''})}
export function buildModelChangeSnapshot(data:EnsembleDay[],days:Day[],hours:Hour[],runs:ModelRunMeta[]):ModelChangeSnapshot{
 const best=new Map(days.map(row=>[row.date,row])),maxModels=Math.max(1,...data.map(row=>row.modelCount));
 const snapshotDays=data.filter(row=>best.has(row.date)).slice(0,14).map((row,index)=>{const day=best.get(row.date)!;return{date:row.date,bestMax:finite(day.max),bestMin:finite(day.min),ensembleMax:finite(row.maxMean),ensembleMin:finite(row.minMean),precipitation:finite(day.precipitation),probability:finite(row.precipitationProbability),gust:finite(day.gust),confidence:confidenceFor(row,index,maxModels),spread:Math.max(0,((finite(row.maxHigh)-finite(row.maxLow))+(finite(row.minHigh)-finite(row.minLow)))/2)}});
 const precipitationOnset=firstPrecipitationOnset(hours),key=runs.map(row=>`${row.kind}:${row.id}:${row.initialisationTime||''}:${row.availabilityTime||''}`).sort().join('|');
 return{version:1,createdAt:new Date().toISOString(),runKey:key,runTime:runTime(runs),signature:snapshotSignature(snapshotDays,precipitationOnset),precipitationOnset,days:snapshotDays};
}
function push(items:ModelChangeItem[],item:ModelChangeItem){items.push(item)}
function severity(abs:number,material:number,major:number):ModelChangeSeverity{return abs>=major?'major':abs>=material?'material':'info'}
function compareMetric(items:ModelChangeItem[],date:string,metric:ModelChangeMetric,label:string,previous:number,current:number,infoThreshold:number,materialThreshold:number,majorThreshold:number,unit:string){
 const delta=current-previous,abs=Math.abs(delta);if(abs<infoThreshold)return;const level=severity(abs,materialThreshold,majorThreshold),direction=delta>0?'höher':'niedriger';push(items,{id:`${date}:${metric}`,date,metric,severity:level,label:`${dayLabel(date)} · ${label}`,detail:`${signed(delta)} ${unit} ${direction} (${new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(previous)} → ${new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(current)})`,delta});
}
function onsetDeltaHours(previous?:string,current?:string){if(!previous||!current)return Number.NaN;const a=Date.parse(previous),b=Date.parse(current);return Number.isFinite(a)&&Number.isFinite(b)?(b-a)/3600000:Number.NaN}
export function compareModelChangeSnapshots(previous:ModelChangeSnapshot|undefined,current:ModelChangeSnapshot):ModelChangeReport{
 if(!previous)return{baseline:true,unchanged:false,current,items:[],materialCount:0,majorCount:0};
 if(previous.signature===current.signature)return{baseline:false,unchanged:true,previous,current,items:[],materialCount:0,majorCount:0};
 const items:ModelChangeItem[]=[],before=new Map(previous.days.map(row=>[row.date,row]));
 current.days.slice(0,10).forEach(row=>{const old=before.get(row.date);if(!old)return;compareMetric(items,row.date,'tmax','Tmax',old.bestMax,row.bestMax,1.5,2.5,4,'K');compareMetric(items,row.date,'tmin','Tmin',old.bestMin,row.bestMin,1.5,2.5,4,'K');compareMetric(items,row.date,'probability','Niederschlagswahrscheinlichkeit',old.probability,row.probability,15,25,40,'%-Punkte');compareMetric(items,row.date,'gust','Böen',old.gust,row.gust,7,12,20,'kt');compareMetric(items,row.date,'confidence','Prognosekonsistenz',old.confidence,row.confidence,12,20,30,'%-Punkte');compareMetric(items,row.date,'spread','ENS-Temperaturspanne',old.spread,row.spread,2,4,7,'K');const rainDelta=row.precipitation-old.precipitation,rainAbs=Math.abs(rainDelta),rainReference=Math.max(old.precipitation,row.precipitation);if(rainAbs>=3&&(rainReference>=4||rainAbs>=5)){const level=severity(rainAbs,Math.max(5,rainReference*.5),Math.max(10,rainReference*.8));push(items,{id:`${row.date}:precipitation`,date:row.date,metric:'precipitation',severity:level,label:`${dayLabel(row.date)} · Niederschlagsmenge`,detail:`${signed(rainDelta)} mm (${new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(old.precipitation)} → ${new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(row.precipitation)})`,delta:rainDelta})}});
 const onsetDelta=onsetDeltaHours(previous.precipitationOnset,current.precipitationOnset);if(Number.isFinite(onsetDelta)&&Math.abs(onsetDelta)>=1){const level=severity(Math.abs(onsetDelta),2,5),later=onsetDelta>0;push(items,{id:'precipitation-onset',metric:'onset',severity:level,label:'Beginn des nächsten Niederschlags',detail:`${Math.abs(Math.round(onsetDelta))} h ${later?'später':'früher'}`,delta:onsetDelta})}else if(previous.precipitationOnset&&!current.precipitationOnset)push(items,{id:'precipitation-onset-removed',metric:'onset',severity:'material',label:'Nächster Niederschlag',detail:'ist aus dem 8-Tage-Zeitfenster verschwunden'});else if(!previous.precipitationOnset&&current.precipitationOnset)push(items,{id:'precipitation-onset-added',metric:'onset',severity:'material',label:'Nächster Niederschlag',detail:'ist neu im 8-Tage-Zeitfenster enthalten'});
 items.sort((a,b)=>severityOrder[b.severity]-severityOrder[a.severity]||String(a.date||'').localeCompare(String(b.date||''))||a.label.localeCompare(b.label,'de'));
 return{baseline:false,unchanged:false,previous,current,items:items.slice(0,16),materialCount:items.filter(item=>item.severity!=='info').length,majorCount:items.filter(item=>item.severity==='major').length};
}
function storageKey(locationKey:string){return`${STORAGE_PREFIX}${locationKey.replace(/[^a-z0-9:._-]+/gi,'_')}`}
export function loadModelChangeSnapshot(locationKey:string):ModelChangeSnapshot|undefined{try{const raw=localStorage.getItem(storageKey(locationKey));if(!raw)return;const parsed=JSON.parse(raw) as ModelChangeSnapshot;return parsed?.version===1&&Array.isArray(parsed.days)?parsed:undefined}catch{return undefined}}
export function saveModelChangeSnapshot(locationKey:string,snapshot:ModelChangeSnapshot){try{localStorage.setItem(storageKey(locationKey),JSON.stringify(snapshot))}catch{}}
export function updateModelChangeRadar(locationKey:string,current:ModelChangeSnapshot){const previous=loadModelChangeSnapshot(locationKey),report=compareModelChangeSnapshots(previous,current);if(!report.unchanged||Boolean(current.runKey&&current.runKey!==previous?.runKey))saveModelChangeSnapshot(locationKey,current);return report}
