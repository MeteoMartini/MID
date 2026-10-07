import type {HazardItem} from './weather';

const longRangeNote=' Langfristiges Modellsignal; keine ortsscharfe Warnung.';
const narrative=(item:HazardItem)=>(item.displayText??'').replace(longRangeNote,'').trim();
/** Only MID wind episodes with identical displayed risk and overlapping windows.
 * Official alerts and cumulative precipitation windows never enter this merge. */
export function mergeHazardEpisodes(items:HazardItem[]):HazardItem[]{
 const result:HazardItem[]=[];
 for(const item of [...items].sort((a,b)=>Date.parse(a.validFrom??'')-Date.parse(b.validFrom??''))){
  const start=Date.parse(item.validFrom??''),end=Date.parse(item.validTo??'');
  const match=item.kind==='wind'&&Number.isFinite(start)&&Number.isFinite(end)&&end>start&&narrative(item)&&result.find(previous=>previous.kind==='wind'&&previous.title===item.title&&previous.level===item.level&&previous.stageRank===item.stageRank&&previous.lowerIntensity===item.lowerIntensity&&previous.displayMetric===item.displayMetric&&narrative(previous)===narrative(item)&&Date.parse(previous.validFrom??'')<=end&&Date.parse(previous.validTo??'')>=start);
  if(!match){result.push({...item});continue}
  match.validFrom=new Date(Math.min(Date.parse(match.validFrom!),start)).toISOString();
  match.validTo=new Date(Math.max(Date.parse(match.validTo!),end)).toISOString();
  // Keep the more cautious long-range qualification across the full episode.
  if(item.displayText?.includes(longRangeNote)&&!match.displayText?.includes(longRangeNote)){
   match.displayText=(match.displayText??'')+longRangeNote;
   match.scopeLabel=match.scopeLabel===item.scopeLabel?item.scopeLabel:'MID · einschließlich langfristigem Modellsignal';
   match.precisionLabel='Zeitfenster und Ausprägung unsicher';
  }
  match.conditional=Boolean(match.conditional||item.conditional);
  match.text=[...new Set([match.text,item.text])].join(' ');
 }
 return result;
}
