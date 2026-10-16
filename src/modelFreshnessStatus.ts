import type {ModelRunMeta} from './weather';
export type ModelFreshnessBand='current'|'delayed'|'stale'|'unknown';
export type ModelFreshnessAssessment={band:ModelFreshnessBand;label:string;details:string;checked:number;unknown:number;stale:number;delayed:number};
/** Source-cycle timeliness, NOT forecast skill or official DWD warning severity. */
/** Color is a visual aid only; unknown data must never look current. */
export function modelFreshnessColor(band:ModelFreshnessBand):string{
 return {current:'#23865b',delayed:'#bd8308',stale:'#c94f55',unknown:'#7a8794'}[band];
}
export function modelRunFreshness(row:ModelRunMeta,now:number):ModelFreshnessBand {
 const initialised=Date.parse(String(row.initialisationTime??'')),cadenceSeconds=Number(row.updateIntervalSeconds);
 if(row.metadataUnavailable===true||!Number.isFinite(initialised)||!Number.isFinite(now)||
 !Number.isFinite(cadenceSeconds)||cadenceSeconds<=0||cadenceSeconds>7*86400)return'unknown';
 const age=(now-initialised)/3600000,cadence=cadenceSeconds/3600;
 if(age<-.5)return'unknown';
 const mosmix=/dwd[_-]?mosmix/i.test(row.id);
 const limit=mosmix&&cadence<=1?2.5:mosmix?Math.max(8.5,cadence*1.45):Math.max(3,cadence*1.6);
 return age>limit?'stale':age>limit*.7?'delayed':'current';
}
export function assessModelFreshness(rows:readonly ModelRunMeta[],now:number=Date.now()):ModelFreshnessAssessment {
 const used=rows.filter(r=>r.usedInCanonical===true);
 const eligible=used.length?used:rows.filter(r=>r.fusionLoaded===true||r.usageStatus==='active');
 const count={current:0,delayed:0,stale:0,unknown:0};
 eligible.forEach(r=>{count[modelRunFreshness(r,now)]++});
 const band:ModelFreshnessBand=!eligible.length?'unknown':count.stale?'stale':count.delayed?'delayed':count.unknown?'unknown':'current';
 const label={current:'Modellläufe zeitlich aktuell',delayed:'Mindestens ein Modelllauf zeitlich verzögert',stale:'Mindestens ein Modelllauf überfällig',unknown:'Modellstand zeitlich nicht vollständig verifizierbar'}[band];
 const details=eligible.length?`${count.current} aktuell · ${count.delayed} verzögert · ${count.stale} überfällig · ${count.unknown} ohne verifizierbares Laufalter`:'Keine nachweislich verwendeten Modellläufe';
 return {band,label,details,checked:eligible.length,unknown:count.unknown,stale:count.stale,delayed:count.delayed};
}
