/** Ordered, significance-ranked forecast narration. Pure: no provider calls or state. */
export type SevenDayNarrativeEvent={
 dayIndex:number;phase:0|1|2;importance:number;kind:'weather'|'hazard'|'night';text:string;
 weatherFamily?:'rain'|'showers'|'snow'|'drizzle'|'thunder';
 throughDayIndex?:number;
};
export function sevenDayNarrativeText(events:readonly SevenDayNarrativeEvent[],hasUsableData:boolean,maxEvents=3):string{
 const clean=events.filter(event=>Number.isInteger(event.dayIndex)&&event.dayIndex>=0&&event.dayIndex<7&&Number.isFinite(event.importance)&&event.importance>0&&event.text.trim().length>0);
 const seen=new Set<string>();
 const ranked=clean.sort((a,b)=>b.importance-a.importance||a.dayIndex-b.dayIndex||a.phase-b.phase).filter(event=>{
  const signature=`${event.dayIndex}:${event.text.trim().toLocaleLowerCase('de-DE')}`;
  if(seen.has(signature))return false;seen.add(signature);return true;
 }).slice(0,Math.max(0,Math.min(3,Math.trunc(maxEvents))));
 if(!ranked.length)return hasUsableData?'Keine markanten Wetteränderungen erkennbar.':'7-Tage-Prognosedaten unvollständig.';
 const ordered=ranked.sort((a,b)=>a.dayIndex-b.dayIndex||a.phase-b.phase||b.importance-a.importance),sentences:string[]=[];
 for(let i=0;i<ordered.length;i++){
  const event=ordered[i],previous=ordered[i-1],text=event.text.trim().replace(/[.!?]+$/,'');
  // Link only a genuinely selected same-day/following-night pair. This does
  // not claim continuous rain or a dry gap between separate forecast periods.
  if(event.kind==='night'&&previous?.kind==='weather'&&previous.dayIndex===event.dayIndex&&event.weatherFamily&&event.weatherFamily===previous.weatherFamily){
   sentences[sentences.length-1]+=`; auch ${text.charAt(0).toLocaleLowerCase('de-DE')+text.slice(1)}`;
  }else if(event.kind==='hazard'&&previous?.kind==='weather'&&previous.dayIndex===event.dayIndex&&previous.throughDayIndex===previous.dayIndex){
   const predicate=text.match(/^(?:Heute|Morgen|Am \S+) (.+)$/)?.[1];
   if(predicate)sentences[sentences.length-1]+=`; zudem ${predicate}`;else sentences.push(text);
  }else sentences.push(text);
 }
 return sentences.join('. ')+'.';
}
