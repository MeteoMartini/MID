import type {RadarNowcast,RadarNowcastFrame} from './weather';

function coverageFrameEpoch(frame:RadarNowcastFrame){return Date.parse(frame.time)}
function coverageObservedEpoch(radar:RadarNowcast,now=Date.now()){const parsed=Date.parse(radar.observedAt||'');return Number.isFinite(parsed)?parsed:now}
export function radarFrameAvailable(frame:RadarNowcastFrame){const rate=Number(frame.rate);return frame.dataAvailable!==false&&frame.hitClass!=='missing'&&Number.isFinite(rate)&&rate>=0}
export function radarForecastCoverage(radar:RadarNowcast,minutes=120){
 const base=coverageObservedEpoch(radar),frames=radar.nowcastSeries??[],expectedSlots=minutes/5,byTime=new Map(frames.map(frame=>[coverageFrameEpoch(frame),frame]));
 let availableSlots=0,partialAmountMm=0;
 for(let slot=1;slot<=expectedSlots;slot++){const frame=byTime.get(base+slot*300000);if(!frame||!radarFrameAvailable(frame))continue;availableSlots++;const amount=Number(frame.amountMm);partialAmountMm+=Number.isFinite(amount)&&amount>=0?amount:Math.max(0,Number(frame.rate)||0)*5/60}
 return{complete:availableSlots===expectedSlots,availableSlots,expectedSlots,availableMinutes:availableSlots*5,partialAmountMm:+partialAmountMm.toFixed(3),startAt:new Date(base).toISOString(),endAt:new Date(base+minutes*60000).toISOString()};
}
