export function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}

export function niceStep(value:number){
 if(!Number.isFinite(value)||value<=0)return 1;
 const exponent=Math.floor(Math.log10(value)),base=10**exponent,fraction=value/base;
 return(fraction<=1?1:fraction<=2?2:fraction<=5?5:10)*base;
}

function ticksBetween(min:number,max:number,step:number){
 const ticks:number[]=[];
 for(let value=min;value<=max+step*.1;value+=step)ticks.push(Number(value.toFixed(6)));
 return ticks;
}

export function niceRange(minValue:number,maxValue:number,targetIntervals=4){
 const min=Number.isFinite(minValue)?minValue:0,max=Number.isFinite(maxValue)?maxValue:min+1;
 const step=niceStep(Math.max(1e-6,(max-min)/Math.max(1,targetIntervals)));
 const niceMin=Math.floor(min/step)*step,niceMax=Math.ceil(max/step)*step;
 return{min:niceMin,max:niceMax,step,ticks:ticksBetween(niceMin,niceMax,step)};
}

export function nicePositiveRange(maxValue:number,targetIntervals=3){
 const raw=Math.max(0,Number(maxValue)||0),step=niceStep(Math.max(1e-6,raw/Math.max(1,targetIntervals)));
 const max=Math.max(step,Math.ceil(raw/step)*step);
 return{max,step,ticks:ticksBetween(0,max,step)};
}

export function niceTemperatureScale(minValue:number,maxValue:number,targetIntervals=5){
 const step=niceStep(Math.max(.1,(maxValue-minValue)/Math.max(1,targetIntervals)));
 const min=Math.floor(minValue/step)*step,max=Math.ceil(maxValue/step)*step;
 return{min,max,ticks:ticksBetween(min,max,step)};
}
