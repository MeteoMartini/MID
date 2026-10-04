export type SeasonalTrace={id:string;label:string;months:{date:string;temperature:number|null;precipitation:number|null}[]};
export function seasonalTraceDates(traces:SeasonalTrace[]){const dates=[...new Set(traces.flatMap(trace=>trace.months.map(month=>month.date)))].sort();if(!dates.length)return[];const start=new Date(`${dates[0].slice(0,7)}-01T00:00:00Z`),last=dates.at(-1)!;const result:string[]=[];while(start.toISOString().slice(0,10)<=last&&result.length<12){result.push(start.toISOString().slice(0,10));start.setUTCMonth(start.getUTCMonth()+1)}return result}
const numeric=(value:unknown):number|null=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;
export function monthDayCount(date:string){const [year,month]=date.slice(0,7).split('-').map(Number);return new Date(Date.UTC(year,month,0)).getUTCDate()}
export function monthlyPrecipitationToDaily(value:number|null,date:string,unit:string){if(value===null)return null;return /^(mm|mm\/month)$/i.test(unit.trim())?value/monthDayCount(date):/mm\/(day|d)$/i.test(unit.trim())?value:null}
/** Raw SEAS5 members: complete calendar months only, no invented climatology/anomalies. */
export function aggregateSeasonalMembers(daily:Record<string,unknown>):SeasonalTrace[]{
 const times=Array.isArray(daily.time)?daily.time.map(String):[],months=[...new Set(times.map(time=>time.slice(0,7)))].sort(),keys=Object.keys(daily).filter(key=>/^temperature_2m_mean(?:_member\d+)?$/.test(key)&&Array.isArray(daily[key]));
 return keys.map(key=>{const suffix=key.slice('temperature_2m_mean'.length),rain=daily[`precipitation_sum${suffix}`] as unknown[]|undefined,temperatures=daily[key] as unknown[];
  return{id:suffix||'control',label:suffix?`Member ${suffix.replace('_member','')}`:'Kontrolllauf',months:months.flatMap(month=>{const indexes=times.flatMap((time,index)=>time.startsWith(month)?[index]:[]),dates=new Set(indexes.map(index=>times[index].slice(0,10))),days=monthDayCount(month),complete=dates.size===days&&indexes.length===days;
   if(!complete)return[];const temp=indexes.map(index=>numeric(temperatures[index])),precip=indexes.map(index=>numeric(rain?.[index]));return[{date:`${month}-01`,temperature:temp.every(value=>value!==null)?temp.reduce<number>((sum,value)=>sum+Number(value),0)/days:null,precipitation:precip.every(value=>value!==null)?precip.reduce<number>((sum,value)=>sum+Number(value),0)/days:null}];})};
 }).filter(trace=>trace.months.some(month=>month.temperature!==null||month.precipitation!==null));
}
