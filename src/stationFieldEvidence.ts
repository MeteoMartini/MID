/** Missing source observations never become numerical zero. Constant-time and side-effect free. */
export function stationObservationNumber(value:unknown):number{
 if(typeof value==='number')return Number.isFinite(value)?value:Number.NaN;
 if(typeof value!=='string')return Number.NaN;
 const clean=value.trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(clean))return Number.NaN;
 const number=Number(clean);
 return Number.isFinite(number)?number:Number.NaN;
}
/** Reject rollover dates in original ISO-like station reports, before new Date(). */
export function stationCalendarDateValid(value:unknown):boolean{
 if(typeof value!=='string')return true;
 const match=/^(\d{4})-(\d{2})-(\d{2})(?=$|[Tt\s])/.exec(value.trim());
 if(!match)return true;
 const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
 if(month<1||month>12||day<1)return false;
 const leap=year%4===0&&(year%100!==0||year%400===0);
 const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 return day<=days[month-1];
}
/** Caller passes normalizeStationTimestamp's UTC ISO string. +5 minute clock skew is tolerated. */
export function stationFieldAgeMinutes(timestamp:unknown,now=Date.now()):number{
 if(typeof timestamp!=='string'||!stationCalendarDateValid(timestamp)||!Number.isFinite(now)||
  !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp))return Infinity;
 const epoch=Date.parse(timestamp);
 if(!Number.isFinite(epoch)||epoch>now+5*60000)return Infinity;
 return Math.max(0,(now-epoch)/60000);
}
