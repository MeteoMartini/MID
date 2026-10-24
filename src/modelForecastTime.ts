/** UTC model instants, including the existing offsetless UTC wire format. */
export function modelInstant(value:string|undefined):number{
 if(!value||!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)?$/.test(value))return NaN;
 return Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(value)?value:value+'Z');
}
export function modelLeadLabel(run:string|undefined,time:string|undefined):string{
 const lead=(modelInstant(time)-modelInstant(run))/3600000;
 if(!Number.isFinite(lead)||lead<0)return 'Zeitschritt unbekannt';
 return '+'+new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(lead)+' h';
}
export function modelAvailableLabel(run:string|undefined,times:readonly string[]):string{
 const base=modelInstant(run),leads=[...new Set(times.map(t=>(modelInstant(t)-base)/3600000).filter(h=>Number.isFinite(h)&&h>=0))].sort((a,b)=>a-b);
 if(!leads.length)return 'Keine bestätigten Vorhersageschritte';
 const label=(h:number)=>'+'+new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(h)+' h';
 const gaps=[...new Set(leads.slice(1).map((h,i)=>h-leads[i]))];
 return `Verfügbar ${label(leads[0])} bis ${label(leads.at(-1)!)} · ${leads.length} Termine${gaps.length===1?` · ${new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(gaps[0])}-h-Schritte`:gaps.length>1?' · unterschiedliche Schrittweiten':''}`;
}
