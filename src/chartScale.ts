/** Shared outward-rounded scale. Data extremes are never clipped. */
export function niceChartScale(values:number[],includeZero=false){
 const valid=values.filter(Number.isFinite);let low=valid.length?Math.min(...valid):0,high=valid.length?Math.max(...valid):1;
 if(includeZero){low=Math.min(0,low);high=Math.max(0,high)}
 const span=Math.max(.5,high-low),raw=span/4,power=10**Math.floor(Math.log10(raw)),fraction=raw/power,step=([1,2,2.5,5,10].find(value=>value>=fraction)??10)*power;
 low=Math.floor((low-step*.1)/step)*step;high=Math.ceil((high+step*.1)/step)*step;
 if(includeZero&&valid.every(value=>value>=0))low=0;
 const ticks=Array.from({length:Math.round((high-low)/step)+1},(_,index)=>Number((low+index*step).toPrecision(12)));
 let decimals=0;while(decimals<6&&Math.abs(step*10**decimals-Math.round(step*10**decimals))>1e-8)decimals++;
 return{low,high,step,ticks,decimals};
}
export function chartLabelVisible(index:number,count:number,plotWidth:number,labelWidth=64){const stride=Math.max(1,Math.ceil(count*labelWidth/Math.max(1,plotWidth)));return index%stride===0}
