import {daySkybarCalendarWindow} from './daySkybarTimeline';

const HOUR_MS=3_600_000;
type TimedPrecipitation={epoch:number;precipitation:number};

/**
 * True only when each physically existing local calendar hour is supported by
 * both its visible slot and the next end-stamped precipitation accumulation.
 * Handles 23/24/25-h days and rejects holes, repeated epochs and missing
 * accumulation values. A missing reading is never interpreted as 0 mm.
 */
export function fullCalendarDayHourlyPrecipitationCoverage(
 date:string,
 timezone:string,
 visibleHours:TimedPrecipitation[],
 rawHours:TimedPrecipitation[],
){
 const window=daySkybarCalendarWindow(date,timezone);
 if(!window)return false;
 const expected=(window.endEpoch-window.startEpoch)/HOUR_MS;
 if(!Number.isInteger(expected)||expected<23||expected>25)return false;
 const visible=visibleHours.filter(hour=>Number.isFinite(hour.epoch));
 const within=visible.filter(hour=>hour.epoch>=window.startEpoch&&hour.epoch<window.endEpoch);
 if(within.length!==expected||new Set(within.map(hour=>hour.epoch)).size!==expected)return false;
 const validAmount=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
 if(within.some(hour=>!validAmount(hour.precipitation)))return false;
 const accumulations=rawHours.filter(hour=>Number.isFinite(hour.epoch)&&hour.epoch>window.startEpoch&&hour.epoch<=window.endEpoch);
 if(accumulations.length!==expected||new Set(accumulations.map(hour=>hour.epoch)).size!==expected)return false;
 const rawByEpoch=new Map(accumulations.map(hour=>[hour.epoch,hour]));
 const visibleEpochs=new Set(within.map(hour=>hour.epoch));
 for(let i=0;i<expected;i++){
  const start=window.startEpoch+i*HOUR_MS,rawNext=rawByEpoch.get(start+HOUR_MS);
  if(!visibleEpochs.has(start)||!validAmount(rawNext?.precipitation))return false;
 }
 return true;
}
