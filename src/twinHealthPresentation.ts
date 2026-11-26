/** Presentation-only archive evidence; never an activation or forecast-skill gate. */
type Reference = {date:string;sources:readonly {label:string}[]};
type Status = 'ready'|'learning'|'limited';

function validCalendarDate(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const stamp=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(stamp)&&new Date(stamp).toISOString().slice(0,10)===value;
}

/** Use the established independent-reference predicate, not a second QC policy.
 * A local day must have ended. Order and duplicates cannot inflate date coverage.
 * At most six distinct nonempty source labels; no sorting or network work.
 */
export function twinArchiveEvidence<T extends Reference>(rows:readonly T[],today:string,independent:(row:T)=>boolean){
 const dates=new Set<string>(),sources=new Set<string>();
 let latestDate:string|undefined;
 if(validCalendarDate(today))for(const row of rows){
  if(!validCalendarDate(row.date)||row.date>=today||!independent(row))continue;
  dates.add(row.date);
  if(!latestDate||row.date>latestDate)latestDate=row.date;
  for(const source of row.sources){
   if(sources.size>=6)break;
   const label=typeof source.label==='string'?source.label.trim():'';
   if(label)sources.add(label);
  }
 }
 return{independentDays:dates.size,latestDate,sources:[...sources]};
}

/** A ready heuristic with an unresolved condition is not a full readiness claim. */
export function twinLearningPresentation(status:Status,issueCount:number,days:number){
 const displayStatus:Status=status==='ready'&&issueCount>0?'learning':status;
 const count=Number.isSafeInteger(days)&&days>=0?days:undefined;
 return{status:displayStatus,
  label:displayStatus==='ready'?'Lernvoraussetzungen erfüllt':displayStatus==='learning'?'Lernstatus: im Aufbau':'Lernstatus: eingeschränkt',
  comparisonText:count===undefined?'Vergleichstage nicht verfügbar':count===1?'1 unabhängiger Vergleichstag':`${count} unabhängige Vergleichstage`};
}
