export type TimedFrame={time:number};
export type BlendFrame<T extends TimedFrame>={frame:T;weight:number};

export function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}

export function buildCompositeTimeline(referenceSeconds:number,stepMinutes=5){
 const step=stepMinutes*60,base=Math.floor(referenceSeconds/step)*step,frames:TimedFrame[]=[];
 for(let minute=-60;minute<=120;minute+=stepMinutes)frames.push({time:base+minute*60});
 return frames;
}

export function uniqueTimedFrames<T extends TimedFrame>(frames:T[],minimum:number,maximum:number){
 return[...new Map(frames.filter(frame=>Number.isFinite(frame.time)&&frame.time>=minimum&&frame.time<=maximum).sort((a,b)=>a.time-b.time).map(frame=>[frame.time,frame])).values()];
}

export function blendTimedFrames<T extends TimedFrame>(frames:T[],target:number,options?:{
 interpolationGapSeconds?:number;
 earlyGraceSeconds?:number;
 lateGraceSeconds?:number;
 fadeSeconds?:number;
}){
 const interpolationGap=options?.interpolationGapSeconds??20*60,earlyGrace=options?.earlyGraceSeconds??10*60,lateGrace=options?.lateGraceSeconds??20*60,fadeSeconds=Math.max(1,options?.fadeSeconds??90*60),sorted=[...frames].filter(frame=>Number.isFinite(frame.time)).sort((a,b)=>a.time-b.time);
 if(!sorted.length)return[] as BlendFrame<T>[];
 let before:T|undefined,after:T|undefined;
 for(const frame of sorted){if(frame.time<=target)before=frame;if(frame.time>=target){after=frame;break}}
 if(before&&after&&before.time!==after.time&&after.time-before.time<=interpolationGap){
  const ratio=clamp((target-before.time)/(after.time-before.time),0,1);
  return[{frame:before,weight:1-ratio},{frame:after,weight:ratio}].filter(item=>item.weight>.015);
 }
 const chosen=before??after!;
 const delta=target-chosen.time;
 if(delta<0){const distance=Math.abs(delta);if(distance<=earlyGrace)return[{frame:chosen,weight:1}];const weight=1-(distance-earlyGrace)/fadeSeconds;return weight>.015?[{frame:chosen,weight:clamp(weight,0,1)}]:[]}
 if(delta<=lateGrace)return[{frame:chosen,weight:1}];
 const weight=1-(delta-lateGrace)/fadeSeconds;
 return weight>.015?[{frame:chosen,weight:clamp(weight,0,1)}]:[];
}

export function blendOpacity<T extends TimedFrame>(blend:BlendFrame<T>[]){return clamp(blend.reduce((sum,item)=>sum+item.weight,0),0,1)}
export function dominantBlendFrame<T extends TimedFrame>(blend:BlendFrame<T>[]){return blend.reduce<BlendFrame<T>|undefined>((best,item)=>!best||item.weight>best.weight?item:best,undefined)?.frame}
