export function apportionScenarioPercentages(probabilities:number[]){
 const safe=probabilities.map(value=>Number.isFinite(value)?Math.max(0,Number(value)):0);
 if(!safe.length)return[];
 const total=safe.reduce((sum,value)=>sum+value,0);
 if(total<=0){
  const base=Math.floor(100/safe.length),remainder=100-base*safe.length;
  return safe.map((_,index)=>base+(index<remainder?1:0));
 }
 const exact=safe.map(value=>value/total*100),rounded=exact.map(value=>Math.floor(value));
 let remainder=100-rounded.reduce((sum,value)=>sum+value,0);
 const order=exact.map((value,index)=>({index,fraction:value-rounded[index],weight:safe[index]})).sort((a,b)=>b.fraction-a.fraction||b.weight-a.weight||a.index-b.index);
 for(let offset=0;offset<remainder;offset++)rounded[order[offset%order.length].index]++;
 return rounded;
}
