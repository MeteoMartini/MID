export type TimedFrame={time:number};
export type BlendFrame<T extends TimedFrame>={frame:T;weight:number};
export type CompositeTimePhase='observation'|'nowcast'|'forecast';
export type CompositeTimelineFrame=TimedFrame&{phase:CompositeTimePhase;source:string;live?:boolean};
export type CompositeTimelineContract={
 source:string;
 observations?:number[];
 nowcasts?:number[];
 forecasts?:number[];
};

export function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}

export function buildCompositeTimeline(referenceSeconds:number,stepMinutes=5){
 const step=stepMinutes*60,base=Math.floor(referenceSeconds/step)*step,frames:TimedFrame[]=[];
 for(let minute=-60;minute<=120;minute+=stepMinutes)frames.push({time:base+minute*60});
 return frames;
}

/**
 * Builds the interactive timeline exclusively from source-confirmed product
 * timestamps. This deliberately does not invent five-minute frames between
 * observations. Static layers (warnings, PX/HX snapshots) therefore cannot
 * accidentally turn into an animation or a forecast.
 */
export function buildAvailableCompositeTimeline(referenceSeconds:number,contract:CompositeTimelineContract,historyMinutes=60,futureMinutes=120){
 const minimum=referenceSeconds-historyMinutes*60,maximum=referenceSeconds+futureMinutes*60,rows:CompositeTimelineFrame[]=[];
 const append=(values:number[]|undefined,phase:CompositeTimePhase)=>{for(const value of values??[]){const time=Math.floor(Number(value));if(Number.isFinite(time)&&time>=minimum&&time<=maximum)rows.push({time,phase,source:contract.source})}};
 append(contract.observations,'observation');append(contract.nowcasts,'nowcast');append(contract.forecasts,'forecast');
 const priority:Record<CompositeTimePhase,number>={observation:1,nowcast:2,forecast:3},unique=[...new Map(rows.sort((a,b)=>a.time-b.time||priority[a.phase]-priority[b.phase]).map(frame=>[frame.time,frame])).values()].sort((a,b)=>a.time-b.time);
 if(!unique.length)return[];
 const observed=unique.filter(frame=>frame.phase==='observation'&&frame.time<=referenceSeconds+90),live=(observed.at(-1)??unique.reduce((best,frame)=>Math.abs(frame.time-referenceSeconds)<Math.abs(best.time-referenceSeconds)?frame:best,unique[0]));
 return unique.map(frame=>frame===live?{...frame,live:true}:frame);
}

export function nearestAvailableFrameIndex(frames:CompositeTimelineFrame[],targetSeconds:number){
 if(!frames.length)return 0;
 return frames.reduce((best,frame,index)=>Math.abs(frame.time-targetSeconds)<Math.abs(frames[best].time-targetSeconds)?index:best,0);
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
