/** MID-Karten P1: pure 5-minute radar/satellite timeline and GPU-commit buffering contract.
 * QA-only: no live catalog/publisher authorization and no synthetic imagery.
 * Production integration must preserve a mounted ImageQuadLayer through source changes.
 */
export const RADSAT_STEP_MS=5*60_000;
export const RADSAT_MIN_STEP=-9; // 45 minutes in the past
export const RADSAT_MAX_STEP=24; // 120 minutes ahead; positive steps are nowcasts only
const HALF_STEP_MS=RADSAT_STEP_MS/2;
const MAX_SAT_ORIGINAL_AGE_MS=15*60_000;
const MAX_NOW_OBSERVATION_AGE_MS=10*60_000;
const MAX_BUFFER_AGE_MS=45*60_000;
const FUTURE_CLOCK_TOLERANCE_MS=90_000;
export type OriginalTime=string|number;
export type RadarCandidate={time:number;kind:'Beobachtung'|'Nowcast'};
export type SatelliteCandidate={time:number;spectrum:'RGB'|'IR';provider:'dwd'|'eumetsat';layer:string};
export type SatProduct={provider:'dwd'|'eumetsat';layer:string;times:OriginalTime[];fresh?:boolean;timeVerified?:boolean};
export type RadSatCatalog={dwdRadar?:OriginalTime[];dwdRadarNowcast?:OriginalTime[];
 satelliteRgbProduct?:SatProduct;satelliteIrProduct?:SatProduct};

function originalMillis(t:OriginalTime):number{
 const value=typeof t==='number'?(t<1e12?t*1000:t):Date.parse(t);
 return Number.isFinite(value)&&value>=946684800000?value:Number.NaN;
}
function originalSet(values:OriginalTime[]|undefined):number[]{
 return [...new Set((values??[]).map(originalMillis).filter(Number.isFinite))].sort((a,b)=>a-b);
}
/** The UI cursor is a *request*, not evidence of an original. Fixed UTC slots avoid
 * re-requesting identical source frames on every 30-second clock tick.
 */
export function radSatTarget5m(now:number,step:number):number{
 if(!Number.isFinite(now)||!Number.isInteger(step)||step<RADSAT_MIN_STEP||step>RADSAT_MAX_STEP)return NaN;
 return Math.floor(now/RADSAT_STEP_MS)*RADSAT_STEP_MS+step*RADSAT_STEP_MS;
}
export function selectRadar5m(catalog:RadSatCatalog|undefined,now:number,step:number,inDwdArea=true):RadarCandidate|undefined{
 const target=radSatTarget5m(now,step);
 if(!catalog||!inDwdArea||!Number.isFinite(target))return undefined;
 const future=step>0,kind=future?'Nowcast':'Beobachtung';
 const original=originalSet(future?catalog.dwdRadarNowcast:catalog.dwdRadar).filter(time=>
  future?(time>now+FUTURE_CLOCK_TOLERANCE_MS&&Math.abs(time-target)<=HALF_STEP_MS):
  (time<=now+FUTURE_CLOCK_TOLERANCE_MS&&
   (step===0?time>=now-MAX_NOW_OBSERVATION_AGE_MS:Math.abs(time-target)<=HALF_STEP_MS))
 ).sort((a,b)=>step===0?b-a:Math.abs(a-target)-Math.abs(b-target)||b-a)[0];
 return original===undefined?undefined:{time:original,kind};
}
/** Select real source time separately from request. A 10/15-min satellite image
 * can remain a transparently labeled *older original* during 5-min scrubbing.
 */
export function selectSatellite5m(catalog:RadSatCatalog|undefined,now:number,step:number):SatelliteCandidate|undefined{
 const target=radSatTarget5m(now,step);
 if(!catalog||!Number.isFinite(target)||step>0)return undefined;
 const choices:[SatelliteCandidate['spectrum'],SatProduct|undefined][]=[['RGB',catalog.satelliteRgbProduct],['IR',catalog.satelliteIrProduct]];
 for(const [spectrum,source] of choices){
  if(!source||source.fresh===false||source.timeVerified===false||!source.layer.trim())continue;
  const observed=originalSet(source.times).filter(time=>time<=now+FUTURE_CLOCK_TOLERANCE_MS&&
   time<=target+FUTURE_CLOCK_TOLERANCE_MS&&time>=target-MAX_SAT_ORIGINAL_AGE_MS).at(-1);
  if(observed!==undefined)return {time:observed,spectrum,provider:source.provider,layer:source.layer};
 }
 return undefined;
}

export type BufferedFrame={scope:string;url:string;originalTime:number;family:'radar'|'satellite';
 phase:'Beobachtung'|'Nowcast'|'RGB'|'IR';verifiedOriginal:true};
export type BufferedState={scope:string;family:BufferedFrame['family'];
 requestedTime:number;visible?:BufferedFrame;pending?:BufferedFrame;error?:'no-original'|'load-failed'};
function phaseCompatible(f:BufferedFrame,kind:BufferedFrame['phase']):boolean{
 return f.family==='satellite'?kind==='RGB'||kind==='IR':f.phase===kind;
}
function admitted(frame:BufferedFrame,scope:string,now:number):boolean{
 return frame.verifiedOriginal===true&&frame.scope===scope&&Boolean(frame.url)&&
  Number.isFinite(frame.originalTime)&&Number.isFinite(now)&&
  (frame.phase==='Nowcast'?frame.originalTime>now+FUTURE_CLOCK_TOLERANCE_MS&&frame.originalTime<=now+125*60_000:
   frame.originalTime<=now+FUTURE_CLOCK_TOLERANCE_MS&&frame.originalTime>=now-MAX_BUFFER_AGE_MS);
}
function sameFrame(a:BufferedFrame|undefined,b:BufferedFrame|undefined):boolean{
 return !!a&&!!b&&a.scope===b.scope&&a.url===b.url&&a.originalTime===b.originalTime&&a.family===b.family&&a.phase===b.phase;
}
/** Called on a 5-minute cursor movement, *before* starting image/network/GPU loading.
 * A same-footprint visible original remains until commitReady, but the displayed
 * source time is NEVER changed to requestedTime. On a location/phase change,
 * old images must be removed immediately rather than mis-georeferenced.
 */
export function requestBufferedFrame(previous:BufferedState|undefined,scope:string,
 family:BufferedFrame['family'],kind:BufferedFrame['phase'],requestedTime:number,
 candidate:BufferedFrame|undefined,now:number):BufferedState{
 if(!scope||!Number.isFinite(requestedTime)||!Number.isFinite(now)||
  (family==='radar'&&kind!=='Nowcast'&&kind!=='Beobachtung')||
  (family==='satellite'&&kind!=='RGB'&&kind!=='IR'))throw Error('invalid buffered request');
 const mayKeep=previous?.scope===scope&&previous.family===family&&
  previous.visible&&phaseCompatible(previous.visible,kind)&&admitted(previous.visible,scope,now);
 const visible=mayKeep?previous?.visible:undefined;
 if(!candidate||!admitted(candidate,scope,now)||candidate.family!==family||!phaseCompatible(candidate,kind))
  return {scope,family,requestedTime,visible,error:'no-original'};
 if(sameFrame(visible,candidate))return {scope,family,requestedTime,visible}; // no new HTTP/GPU load
 if(previous?.scope===scope&&sameFrame(previous.pending,candidate))
  return {scope,family,requestedTime,visible,pending:previous.pending};
 return {scope,family,requestedTime,visible,pending:candidate};
}
/** Invoke only once the new image has passed both source validation AND the
 * real MapLibre render/texture-ready barrier (ImageQuadLayer already has one).
 * A late, superseded response is never promoted.
 */
export function commitBufferedFrame(state:BufferedState,ready:BufferedFrame):BufferedState{
 if(!sameFrame(state.pending,ready))return state;
 return {...state,visible:ready,pending:undefined,error:undefined};
}
export function failBufferedFrame(state:BufferedState,failed:BufferedFrame):BufferedState{
 if(!sameFrame(state.pending,failed))return state;
 return {...state,pending:undefined,error:'load-failed'};
}
export function bufferedFrameInfo(state:BufferedState){
 return {requestedTime:state.requestedTime,visibleOriginalTime:state.visible?.originalTime,
  loading:!!state.pending,displayedIsExactOriginal:state.visible?.originalTime===state.requestedTime,
  error:state.error??null};
}
