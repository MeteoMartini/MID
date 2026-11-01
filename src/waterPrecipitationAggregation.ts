/** Reject incomplete 1h/3h precipitation windows: missing is never measured zero. */
export type HourlyPrecipitationSample={value:unknown;epoch:unknown;available?:boolean};
export function sumCompletePrecipitation(samples:readonly HourlyPrecipitationSample[],expectedHours:number):number{
 if(!Number.isInteger(expectedHours)||expectedHours<1||samples.length!==expectedHours)return Number.NaN;
 let total=0,previousEpoch:number|undefined;
 for(const sample of samples){
  if(sample.available===false||typeof sample.epoch!=='number'||!Number.isFinite(sample.epoch))return Number.NaN;
  if(previousEpoch!==undefined&&sample.epoch-previousEpoch!==3600000)return Number.NaN;
  if(typeof sample.value!=='number'||!Number.isFinite(sample.value)||sample.value<0)return Number.NaN;
  total+=sample.value;
  if(!Number.isFinite(total))return Number.NaN;
  previousEpoch=sample.epoch;
 }
 return total;
}
