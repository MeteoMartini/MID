import type {ModelRunMeta} from './weather';
export type ModelFreshnessBand='current'|'delayed'|'stale'|'partial'|'unknown';
export type ModelFreshnessAssessment={band:ModelFreshnessBand;label:string;details:string;checked:number;aggregated:number;unknown:number;stale:number;delayed:number};
/** Source-cycle timeliness, NOT forecast skill or official DWD warning severity. */
/** Color is a visual aid only; unknown data must never look current. */
export function modelFreshnessColor(band:ModelFreshnessBand):string{
 return {current:'#23865b',delayed:'#bd8308',stale:'#c94f55',partial:'#357f9d',unknown:'#7a8794'}[band];
}
export function modelRunFreshness(row:ModelRunMeta,now:number):Exclude<ModelFreshnessBand,'partial'> {
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
/** Maximum source names in the compact pill; all original rows remain in the details panel. */
const MAX_UNVERIFIED_NAMES=4;
export function assessModelFreshness(rows:readonly ModelRunMeta[],now:number=Date.now()):ModelFreshnessAssessment {
 // Selecting actual contributors must precede any candidate/fallback inventory.
 const hasCanonical=rows.some(row=>row.usedInCanonical===true);
 const count={current:0,delayed:0,stale:0,unknown:0};
 let checked=0,aggregated=0;
 const missing:string[]=[];
 for(const row of rows){
  const eligible=hasCanonical?row.usedInCanonical===true:
   row.usedInCanonical!==false&&(row.fusionLoaded===true||row.usageStatus==='active'||row.usageStatus==='fallback');
  if(!eligible)continue;
  if(row.id==='best_match'){aggregated++;continue}
  checked++;
  // Parse each source time exactly once; repeated parsing adds work in live 60s refreshes.
  const state=modelRunFreshness(row,now);
  count[state]++;
  if(state==='unknown'&&missing.length<MAX_UNVERIFIED_NAMES){
   const label=String(row.label||row.id||'Unbekanntes Modell').replace(/\s+/g,' ').trim();
   missing.push(label.length>88?label.slice(0,87)+'…':label);
  }
 }
 // Preserve established urgency thresholds: any overdue model remains explicit;
 // red denotes >=2/3 of eligible individual runs overdue (including one-run case).
 const substantiallyStale=count.stale>0&&count.stale*3>=checked*2;
 const band:ModelFreshnessBand=!checked?'unknown':substantiallyStale?'stale':count.stale||count.delayed?'delayed':count.unknown?(count.current?'partial':'unknown'):'current';
 const label=band==='stale'?(checked===1?'Verwendeter Modelllauf überfällig':'Überwiegender Teil der Modellläufe überfällig'):band==='delayed'?(count.stale?'Einzelne Modellläufe überfällig':'Mindestens ein Modelllauf zeitlich verzögert'):band==='partial'?'Modellstand teilweise zeitlich verifiziert':band==='current'?'Modellläufe zeitlich aktuell':'Modellstand zeitlich nicht vollständig verifizierbar';
 const details=checked?`${count.current} aktuell · ${count.delayed} verzögert · ${count.stale} überfällig · ${count.unknown} ohne verifizierbares Laufalter`:'Keine einzeln zeitlich verifizierbaren Modellläufe';
 const remaining=count.unknown-missing.length;
 const additional=remaining>0?` und ${remaining} ${remaining===1?'weiterer Lauf':'weitere Läufe'}`:'';
 const coverage=(aggregated?' · Best Match ist eine Sammelquelle ohne einzelne Initialisierung und wird separat geführt.':'')+
  (count.unknown?' · Ohne vollständigen Zeitnachweis: '+missing.join(', ')+additional+'.':'');
 return {band,label,details:details+coverage+' · Verifizierte Bereitstellungszeit + Quellrhythmus; ohne Bereitstellung konservatives Laufalter. Keine Aussage zur Prognosegüte',checked,aggregated,unknown:count.unknown,stale:count.stale,delayed:count.delayed};
}
