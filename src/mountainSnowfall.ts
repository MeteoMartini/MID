export type MountainSnowfallTotals={past24:number;next24:number;next48:number};

const HOUR_MS=60*60*1000;

export function sumMountainSnowfallWindows(times:readonly unknown[],values:readonly unknown[],nowEpoch:number,toEpoch:(value:unknown)=>number):MountainSnowfallTotals{
 const now=Number(nowEpoch);
 if(!Number.isFinite(now))return{past24:NaN,next24:NaN,next48:NaN};
 const sumWindow=(start:number,end:number,expectedHours:number)=>{
  let total=0,count=0;
  for(let index=0;index<times.length;index++){
   const epoch=toEpoch(times[index]);
   if(!Number.isFinite(epoch)||epoch<start||epoch>=end)continue;
   const raw=values[index];
   if(raw===null||raw===undefined||raw==='')return NaN;
   const value=Number(raw);
   if(!Number.isFinite(value))return NaN;
   total+=Math.max(0,value);
   count++;
  }
  return count===expectedHours?total:NaN;
 };
 return{
  past24:sumWindow(now-24*HOUR_MS,now,24),
  next24:sumWindow(now,now+24*HOUR_MS,24),
  next48:sumWindow(now,now+48*HOUR_MS,48)
 };
}