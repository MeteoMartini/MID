import {dayPrecipitationAssessment,dayWeatherCharacter,dayWeatherCharacterText,type Day,type Hour} from './weather';
import {dayPeriodHoursForDate} from './forecastPeriods';

export type ForecastDayRegime='wet'|'showery'|'sunny'|'windy'|'warm'|'quiet';

function forecastRegimeDayHours(day:Day,hours:Hour[]){
 const sameDay=hours.filter(hour=>hour.time.startsWith(day.date));
 const daylight=dayPeriodHoursForDate(day.date,sameDay.length?sameDay:hours);
 return daylight.length?daylight:sameDay.length?sameDay:hours;
}

/**
 * Zentrale, appweite Wetterregime-Klassifikation für sichtbare Prognosekarten.
 * 7-Tage- und 14-Tage-Cockpit dürfen diese Logik nicht separat nachbauen.
 */
export function forecastDayRegime(day:Day,hours:Hour[]):ForecastDayRegime{
 const dayHours=forecastRegimeDayHours(day,hours),character=dayWeatherCharacter(day,dayHours),assessment=dayPrecipitationAssessment(day,dayHours),text=dayWeatherCharacterText(character).toLocaleLowerCase('de-DE');
 const sunny=/sonnig|heiter|freundlich/.test(text),cloudy=/bedeckt|stark bewölkt|meist bewölkt/.test(text),warm=day.max>=30,windy=day.wind>=15||(day.gust>=34&&day.wind>=10)||day.gust>=42;
 if(assessment.showery&&assessment.dominant)return'showery';
 if(assessment.dominant||character.precipitationDominant)return'wet';
 if(windy&&!cloudy)return'windy';
 if(sunny&&warm)return'warm';
 if(sunny)return'sunny';
 if(windy)return'windy';
 return'quiet';
}

/** Kurze Regimebezeichnung für Ansichten, die keine detaillierte 7-Tage-Kurzform benötigen. */
export function forecastRegimeLabel(regime:ForecastDayRegime,precipitationForm?:string){
 return regime==='wet'||regime==='showery'?precipitationForm||(regime==='showery'?'Schauer':'Regen'):regime==='sunny'?'Sonnig':regime==='windy'?'Wind':regime==='warm'?'Heiß':'Ruhig';
}
