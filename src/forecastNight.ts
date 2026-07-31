import type {Day,Hour} from './weather';

const FOLLOWING_NIGHT_START_HOUR=20;
const FOLLOWING_NIGHT_END_HOUR=8;
const MINIMUM_HOURLY_NIGHT_SAMPLES=6;

function hourParts(time:string){
 const match=String(time||'').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):/);
 return match?{date:match[1],hour:Number(match[2])}:null;
}

/**
 * Minimum der auf einen Prognosetag folgenden Nacht.
 * Der Tages-Tiefstwert des Folgetags ist nur ein Fallback, weil der Tiefstwert
 * des aktuellen Kalendertags meist zur bereits vergangenen Nacht gehört.
 */
export function followingNightMinimum(day:Day,nextDay:Day|undefined,hours:Hour[]){
 if(!nextDay)return Number.NaN;
 const values=hours.flatMap(hour=>{
  const parts=hourParts(hour.time),temperature=Number(hour.temperature);
  if(!parts||!Number.isFinite(temperature))return[];
  const inEvening=parts.date===day.date&&parts.hour>=FOLLOWING_NIGHT_START_HOUR;
  const inMorning=parts.date===nextDay.date&&parts.hour<=FOLLOWING_NIGHT_END_HOUR;
  return inEvening||inMorning?[temperature]:[];
 });
 if(values.length>=MINIMUM_HOURLY_NIGHT_SAMPLES)return Math.min(...values);
 const fallback=Number(nextDay.min);
 return Number.isFinite(fallback)?fallback:Number.NaN;
}

export function followingNightIsTropical(day:Day,nextDay:Day|undefined,hours:Hour[]){
 const minimum=followingNightMinimum(day,nextDay,hours);
 return Number.isFinite(minimum)&&minimum>=20;
}
