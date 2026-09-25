export type DaySkybarTimedSample={epoch?:number};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

/**
 * Positions local-calendar-day samples on their real elapsed-time axis.
 * This preserves 23 h and 25 h DST days and keeps repeated local clock
 * hours distinct when their epochs differ.
 */
export function daySkybarTimelinePositions(
  samples:DaySkybarTimedSample[],
  left=1.5,
  right=1.5,
  width=100,
){
  if(!samples.length)return[] as number[];
  const trackWidth=Math.max(0,width-left-right);
  const epochs=samples.map(sample=>Number(sample.epoch));
  const strictlyIncreasing=epochs.every((epoch,index)=>Number.isFinite(epoch)&&(index===0||epoch>epochs[index-1]));
  if(strictlyIncreasing&&epochs.length>1){
    const gaps=epochs.slice(1).map((epoch,index)=>epoch-epochs[index]).filter(gap=>gap>=15*60_000&&gap<=3*60*60_000).sort((a,b)=>a-b);
    const interval=gaps.length?gaps[Math.floor(gaps.length/2)]:60*60_000;
    const start=epochs[0],end=epochs.at(-1)!+interval,span=Math.max(1,end-start);
    return epochs.map(epoch=>left+clamp((epoch-start)/span,0,1)*trackWidth);
  }
  return samples.map((_,index)=>left+(index/Math.max(1,samples.length))*trackWidth);
}
