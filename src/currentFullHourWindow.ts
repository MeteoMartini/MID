import type {Hour} from './weather';

export type CurrentFullHourIndex={fullHours:Hour[];byEpoch:Map<number,Hour>};

export function fullHourMinuteInZone(epoch:number,timezone:string,cache?:{formatter?:Intl.DateTimeFormat}){
 if(!Number.isFinite(epoch))return Number.NaN;
 const formatter=cache?.formatter??Intl.DateTimeFormat('en-GB',{timeZone:timezone,minute:'2-digit'});
 if(cache)cache.formatter=formatter;
 const minute=formatter.formatToParts(new Date(epoch)).find(part=>part.type==='minute')?.value;
 return Number(minute);
}

/** Forecast-only index. Rebuild when the immutable source series or IANA zone changes. */
export function buildCurrentFullHourIndex(hours:Hour[],timezone:string):CurrentFullHourIndex{
 const cache:{formatter?:Intl.DateTimeFormat}={};
 const fullHours=hours.filter(hour=>Number.isFinite(Number(hour.epoch))&&fullHourMinuteInZone(Number(hour.epoch),timezone,cache)===0);
 return{fullHours,byEpoch:new Map(fullHours.map(hour=>[Number(hour.epoch),hour]))};
}

/** The selected forecast epoch changes only at a real local forecast-hour boundary. */
export function currentFullHourStartEpoch(index:CurrentFullHourIndex,now:number){
 if(!index.fullHours.length)return Number.NaN;
 let startIndex=-1;
 for(let i=0;i<index.fullHours.length;i++){
  if(Number(index.fullHours[i].epoch)<=now)startIndex=i;
  else break;
 }
 if(startIndex<0)startIndex=0;
 return Number(index.fullHours[startIndex]?.epoch);
}

/** Build the visible window from cached forecast-only data and a live selected epoch. */
export function currentFullHourWindowFromIndex(index:CurrentFullHourIndex,timezone:string,startEpoch:number,horizonHours=12):Hour[]{
 const fullHours=index.fullHours;
 if(!fullHours.length)return[];
 const firstHour=index.byEpoch.get(startEpoch)??fullHours[0];
 return Array.from({length:horizonHours+1},(_,i)=>{
  const epoch=startEpoch+i*3600000;
  return index.byEpoch.get(epoch)??{...firstHour,epoch,time:new Date(epoch).toISOString(),timezone,temperature:Number.NaN};
 });
}

export function currentFullHourWindow(hours:Hour[],timezone:string,now:number,horizonHours=12){
 const index=buildCurrentFullHourIndex(hours,timezone);
 return currentFullHourWindowFromIndex(index,timezone,currentFullHourStartEpoch(index,now),horizonHours);
}
