import type {RadarNowcast,RadarNowcastFrame} from './weather';

const finiteNonnegative=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
/** A runtime null/NaN is not a measured dry value. Legacy omitted amountMm may still use the documented rate estimate. */
export function radarFrameAvailable(frame:RadarNowcastFrame){
 return frame.dataAvailable!==false&&frame.hitClass!=='missing'&&finiteNonnegative(frame.rate)&&
  (frame.amountMm===undefined||finiteNonnegative(frame.amountMm));
}
export function radarForecastCoverage(radar:RadarNowcast,minutes=120){
 const base=Date.parse(radar.observedAt||''),expectedSlots=minutes/5;
 // Preserve the existing numeric partialAmountMm diagnostics shape. No incomplete amount may be displayed as a full forecast.
 if(!Number.isFinite(base)||!Number.isInteger(expectedSlots)||expectedSlots<=0||expectedSlots>24)
  return{complete:false,availableSlots:0,expectedSlots:Number.isFinite(expectedSlots)?expectedSlots:0,
   availableMinutes:0,partialAmountMm:0,startAt:'',endAt:''};
 const byTime=new Map<number,RadarNowcastFrame|null>();
 for(const frame of radar.nowcastSeries??[]){
  const epoch=Date.parse(frame.time);
  if(!Number.isFinite(epoch))continue;
  const previous=byTime.get(epoch);
  if(previous===undefined){byTime.set(epoch,frame);continue}
  // Identical evidence counts once. Conflicting or unavailable evidence leaves the slot unverified.
  if(!previous||!radarFrameAvailable(previous)||!radarFrameAvailable(frame)||
   previous.future!==frame.future||previous.rate!==frame.rate||previous.amountMm!==frame.amountMm||
   previous.intervalStartAt!==frame.intervalStartAt||previous.intervalEndAt!==frame.intervalEndAt){
   byTime.set(epoch,null);
  }
 }
 let availableSlots=0,partialAmountMm=0;
 for(let slot=1;slot<=expectedSlots;slot++){
  const frame=byTime.get(base+slot*300000);
  if(!frame||frame.future!==true||!radarFrameAvailable(frame))continue;
  const amount=frame.amountMm===undefined?frame.rate*5/60:frame.amountMm;
  availableSlots++;partialAmountMm+=amount;
 }
 return{complete:availableSlots===expectedSlots,availableSlots,expectedSlots,availableMinutes:availableSlots*5,
  partialAmountMm:+partialAmountMm.toFixed(3),startAt:new Date(base).toISOString(),endAt:new Date(base+minutes*60000).toISOString()};
}
