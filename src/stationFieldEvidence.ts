/** Missing source observations never become numerical zero. Constant-time and side-effect free. */
export function stationObservationNumber(value:unknown):number{
 if(typeof value==='number')return Number.isFinite(value)?value:Number.NaN;
 if(typeof value!=='string')return Number.NaN;
 const clean=value.trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(clean))return Number.NaN;
 const number=Number(clean);
 return Number.isFinite(number)?number:Number.NaN;
}
/** Caller passes normalizeStationTimestamp's UTC ISO string. +5 minute clock skew is tolerated. */
export function stationFieldAgeMinutes(timestamp:unknown,now=Date.now()):number{
 if(typeof timestamp!=='string'||!Number.isFinite(now)||
  !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(timestamp))return Infinity;
 const epoch=Date.parse(timestamp);
 if(!Number.isFinite(epoch)||epoch>now+5*60000)return Infinity;
 return Math.max(0,(now-epoch)/60000);
}
