import type {Day,Hour} from './weather';
import {followingNightHoursForDate} from './forecastPeriods';

const MINIMUM_HOURLY_NIGHT_SAMPLES=6;

/**
 * Minimum der auf einen Prognosetag folgenden Nacht.
 * Der Tages-Tiefstwert des Folgetags ist nur ein Fallback, weil der Tiefstwert
 * des aktuellen Kalendertags meist zur bereits vergangenen Nacht gehört.
 */
export function followingNightMinimum(day:Day,nextDay:Day|undefined,hours:Hour[]){
 if(!nextDay)return Number.NaN;
 const values=followingNightHoursForDate(day.date,hours).map(hour=>Number(hour.temperature)).filter(Number.isFinite);
 if(values.length>=MINIMUM_HOURLY_NIGHT_SAMPLES)return Math.min(...values);
 const fallback=Number(nextDay.min);
 return Number.isFinite(fallback)?fallback:Number.NaN;
}

export function followingNightIsTropical(day:Day,nextDay:Day|undefined,hours:Hour[]){
 const minimum=followingNightMinimum(day,nextDay,hours);
 return Number.isFinite(minimum)&&minimum>=20;
}
