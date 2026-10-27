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
 // Initialization is the model's reference epoch, not its delivery deadline.
 // Prefer the source-reported delivery time only with bounded, coherent provenance.
 if(row.availabilityTime!==undefined){
  const available=Date.parse(String(row.availabilityTime)),lag=(available-initialised)/3600000;
  if(!Number.isFinite(available)||available>now+5*60000||lag<0||lag>Math.min(48,Math.max(6,cadence*2)))return'unknown';
  const deliveredAge=Math.max(0,(now-available)/3600000),grace=Math.max(.25,Math.min(1,cadence*.15));
  return deliveredAge>cadence*1.6+grace?'stale':deliveredAge>cadence+grace?'delayed':'current';
 }
 const mosmix=/dwd[_-]?mosmix/i.test(row.id);
 const limit=mosmix&&cadence<=1?2.5:mosmix?Math.max(8.5,cadence*1.45):Math.max(3,cadence*1.6);
 return age>limit?'stale':age>limit*.7?'delayed':'current';
}
export function assessModelFreshness(rows:readonly ModelRunMeta[],now:number=Date.now()):ModelFreshnessAssessment {
 const used=rows.filter(r=>r.usedInCanonical===true);
 // Only contributing or credibly active models can decide the shared pill.
 // Explicitly unused fusion candidates must not turn it red after prefetch.
 const eligible=used.length?used:rows.filter(r=>r.usedInCanonical!==false&&(r.fusionLoaded===true||r.usageStatus==='active'||r.usageStatus==='fallback'));
 const count={current:0,delayed:0,stale:0,unknown:0};
 eligible.forEach(r=>{count[modelRunFreshness(r,now)]++});
 // One overdue run remains visible in yellow; red means at least 2/3
 // of eligible model runs overdue, including the one-run case.
 const substantiallyStale=count.stale>0&&count.stale*3>=eligible.length*2;
 const band:ModelFreshnessBand=!eligible.length?'unknown':substantiallyStale?'stale':count.stale||count.delayed?'delayed':count.unknown?'unknown':'current';
 const label=band==='stale'?(eligible.length===1?'Verwendeter Modelllauf überfällig':'Überwiegender Teil der Modellläufe überfällig'):band==='delayed'?(count.stale?'Einzelne Modellläufe überfällig':'Mindestens ein Modelllauf zeitlich verzögert'):band==='current'?'Modellläufe zeitlich aktuell':'Modellstand zeitlich nicht vollständig verifizierbar';
 const details=eligible.length?`${count.current} aktuell · ${count.delayed} verzögert · ${count.stale} überfällig · ${count.unknown} ohne verifizierbares Laufalter`:'Keine nachweislich verwendeten Modellläufe';
 return {band,label,details:details+' · Verifizierte Bereitstellungszeit + Quellrhythmus; ohne Bereitstellung konservatives Laufalter. Keine Aussage zur Prognosegüte.',checked:eligible.length,unknown:count.unknown,stale:count.stale,delayed:count.delayed};
}
