// Provider NoData is not a measured zero. Keep finite numeric strings compatible.
export function apiSeriesNumber(value){
 if(typeof value!=='number'&&typeof value!=='string')return NaN;
 if(typeof value==='string'&&!value.trim())return NaN;
 const number=Number(value);
 return Number.isFinite(number)?number:NaN;
}

export function finiteSeries(payload,key,minCount=6){
 const values=payload?.hourly?.[key];
 return Array.isArray(values)&&values.filter(value=>Number.isFinite(apiSeriesNumber(value))).length>=minCount;
}

export function rangeSeries(payload,key,min,max){
 const values=payload?.hourly?.[key];
 if(!Array.isArray(values))return false;
 const finite=values.map(apiSeriesNumber).filter(Number.isFinite);
 return finite.length>=6&&finite.every(value=>value>=min&&value<=max);
}

// The native IFS 3h probe explicitly requests GMT, ISO8601 and default Celsius.
// This is capability evidence, not proof of original GRIB aggregation or skill.
export function distinctExtrema(payload){
 const {time,temperature_2m_min:minima,temperature_2m_max:maxima}=payload?.hourly??{};
 if(payload?.utc_offset_seconds!==0||payload?.hourly_units?.temperature_2m_min!=='°C'||payload?.hourly_units?.temperature_2m_max!=='°C')return false;
 if(!Array.isArray(time)||!Array.isArray(minima)||!Array.isArray(maxima)||time.length!==minima.length||time.length!==maxima.length)return false;
 let previous=-Infinity,pairs=0,distinct=false;
 for(let index=0;index<time.length;index++){
  const t=time[index];
  if(typeof t!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(t))return false;
  const stamp=Date.parse(t+'Z');
  if(!Number.isFinite(stamp)||stamp<=previous||new Date(stamp).toISOString().slice(0,16)!==t)return false;
  previous=stamp;
  const min=apiSeriesNumber(minima[index]),max=apiSeriesNumber(maxima[index]);
  if(!Number.isFinite(min)||!Number.isFinite(max))continue;
  if(min>max)return false;
  pairs++;
  if(min<max)distinct=true;
 }
 // The existing probe requires at least two finite values per field; require
 // that minimum coverage in paired intervals, not disjoint individual masks.
 return pairs>=2&&distinct;
}
