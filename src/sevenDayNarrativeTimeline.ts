/** Ordered, significance-ranked forecast narration. Pure: no provider calls or state. */
export type SevenDayNarrativeEvent={
 dayIndex:number;phase:0|1|2;importance:number;kind:'weather'|'hazard'|'night';text:string;
};
export function sevenDayNarrativeText(events:readonly SevenDayNarrativeEvent[],hasUsableData:boolean,maxEvents=3):string{
 const clean=events.filter(event=>Number.isInteger(event.dayIndex)&&event.dayIndex>=0&&event.dayIndex<7&&Number.isFinite(event.importance)&&event.importance>0&&event.text.trim().length>0);
 const seen=new Set<string>();
 const ranked=clean.sort((a,b)=>b.importance-a.importance||a.dayIndex-b.dayIndex||a.phase-b.phase).filter(event=>{
  const signature=`${event.dayIndex}:${event.text.trim().toLocaleLowerCase('de-DE')}`;
  if(seen.has(signature))return false;seen.add(signature);return true;
 }).slice(0,Math.max(0,Math.min(3,Math.trunc(maxEvents))));
 if(!ranked.length)return hasUsableData?'Keine markanten Wetteränderungen erkennbar.':'7-Tage-Prognosedaten unvollständig.';
 return ranked.sort((a,b)=>a.dayIndex-b.dayIndex||a.phase-b.phase||b.importance-a.importance).map(event=>event.text.trim().replace(/[.!?]+$/,'')).join('. ')+'.';
}
