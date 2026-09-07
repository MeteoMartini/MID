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
export function monotoneSvgPath(points:{x:number;y:number}[]){
 const finite=points.filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
 if(!finite.length)return'';
 if(finite.length===1)return`M ${finite[0].x.toFixed(2)} ${finite[0].y.toFixed(2)}`;
 const rows=finite.filter((point,index)=>!index||point.x>finite[index-1].x);
 if(rows.length===1)return`M ${rows[0].x.toFixed(2)} ${rows[0].y.toFixed(2)}`;
 const n=rows.length,h=Array.from({length:n-1},(_,index)=>rows[index+1].x-rows[index].x),delta=h.map((width,index)=>(rows[index+1].y-rows[index].y)/Math.max(1e-9,width)),tangent=new Array<number>(n);
 tangent[0]=delta[0];tangent[n-1]=delta[n-2];
 for(let index=1;index<n-1;index++)tangent[index]=delta[index-1]*delta[index]<=0?0:(delta[index-1]+delta[index])/2;
 for(let index=0;index<n-1;index++){const slope=delta[index];if(Math.abs(slope)<1e-12){tangent[index]=0;tangent[index+1]=0;continue}const a=tangent[index]/slope,b=tangent[index+1]/slope,magnitude=a*a+b*b;if(magnitude>9){const scale=3/Math.sqrt(magnitude);tangent[index]=scale*a*slope;tangent[index+1]=scale*b*slope}}
 let path=`M ${rows[0].x.toFixed(2)} ${rows[0].y.toFixed(2)}`;
 for(let index=0;index<n-1;index++){const width=h[index],left=rows[index],right=rows[index+1],c1x=left.x+width/3,c1y=left.y+tangent[index]*width/3,c2x=right.x-width/3,c2y=right.y-tangent[index+1]*width/3;path+=` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${right.x.toFixed(2)} ${right.y.toFixed(2)}`}
 return path;
}

