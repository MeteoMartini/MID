/** Shared outward-rounded scale. Data extremes are never clipped. */
export function niceChartScale(values:number[],includeZero=false){
 // Stream finite extrema in constant auxiliary memory. Avoid spreading large
 // ensemble/forecast arrays into a function argument list (engine argument cap).
 let low=Number.POSITIVE_INFINITY,high=Number.NEGATIVE_INFINITY,hasFinite=false,allNonnegative=true;
 for(const value of values){
  if(!Number.isFinite(value))continue;
  hasFinite=true;
  if(value<low)low=value;
  if(value>high)high=value;
  if(value<0)allNonnegative=false;
 }
 if(!hasFinite){low=0;high=1}
 if(includeZero){low=Math.min(0,low);high=Math.max(0,high)}
 const span=Math.max(.5,high-low),raw=span/4,power=10**Math.floor(Math.log10(raw)),fraction=raw/power,step=([1,2,2.5,5,10].find(value=>value>=fraction)??10)*power;
 low=Math.floor((low-step*.1)/step)*step;high=Math.ceil((high+step*.1)/step)*step;
 if(includeZero&&allNonnegative)low=0;
 const ticks=Array.from({length:Math.round((high-low)/step)+1},(_,index)=>Number((low+index*step).toPrecision(12)));
 let decimals=0;while(decimals<6&&Math.abs(step*10**decimals-Math.round(step*10**decimals))>1e-8)decimals++;
 return{low,high,step,ticks,decimals};
}
// Initialize only if a full monthly label is used. Reuse across chart renders.
let fullMonthFormatter:Intl.DateTimeFormat|undefined;
export function calendarMonthLabel(date:string,compact=true){
 if(compact)return `${date.slice(5,7)}/${date.slice(2,4)}`;
 fullMonthFormatter??=new Intl.DateTimeFormat('de-DE',{month:'short',year:'2-digit',timeZone:'UTC'});
 return fullMonthFormatter.format(new Date(`${date.slice(0,7)}-15T12:00:00Z`));
}
export function chartLabelVisible(index:number,count:number,plotWidth:number,labelWidth=64){const stride=Math.max(1,Math.ceil(count*labelWidth/Math.max(1,plotWidth)));return index%stride===0}
