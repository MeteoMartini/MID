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

export function distinctExtrema(payload){
 const minima=payload?.hourly?.temperature_2m_min,maxima=payload?.hourly?.temperature_2m_max;
 if(!Array.isArray(minima)||!Array.isArray(maxima))return false;
 return minima.some((value,index)=>{
  const min=apiSeriesNumber(value),max=apiSeriesNumber(maxima[index]);
  return Number.isFinite(min)&&Number.isFinite(max)&&min!==max;
 });
}
