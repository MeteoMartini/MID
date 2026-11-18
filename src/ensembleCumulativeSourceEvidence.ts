/**
 * Original ensemble rain: only a complete, temporally continuous sequence of
 * source-native daily cells may contribute to a cumulative distribution.
 * No missing value is substituted with zero; true measured/predicted zeros
 * and finite extremes are preserved. This does not itself authenticate a
 * provider header or the underlying local-day accumulation interval.
 */
export type CumulativeEnsembleDay=Readonly<{date:string;precipitation:number}>;

function utcCalendarDay(date:string):number|null{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 const millis=Date.parse(date+'T00:00:00Z');
 return Number.isFinite(millis)&&new Date(millis).toISOString().slice(0,10)===date?millis:null;
}
/**
 * O(expected days + supplied days) time, O(expected days) memory.
 * `requiredDates` must be in chronological UTC calendar order. A gap in the
 * combined provider date axis invalidates the whole cumulative period.
 * Extra rows after the target window are ignored, never counted as rain.
 */
export function verifiedCumulativeEnsembleRain(
 memberDays:readonly CumulativeEnsembleDay[],
 requiredDates:ReadonlySet<string>,
):number|null{
 if(!requiredDates.size)return null;
 let previous:number|null=null;
 for(const date of requiredDates){
  const day=utcCalendarDay(date);
  if(day===null||previous!==null&&day-previous!==86_400_000)return null;
  previous=day;
 }
 let total=0;
 const seen=new Set<string>();
 for(const row of memberDays){
  if(!requiredDates.has(row.date))continue;
  if(seen.has(row.date))return null;
  if(typeof row.precipitation!=='number'||
     !Number.isFinite(row.precipitation)||row.precipitation<0)return null;
  seen.add(row.date);
  total+=row.precipitation;
  if(!Number.isFinite(total))return null;
 }
 return seen.size===requiredDates.size?total:null;
}
