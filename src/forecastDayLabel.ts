import {dayPrecipitationAssessment,dayWeatherCharacter,dayWeatherCharacterText,type Day,type Hour} from './weather';
import {dominantPrecipitationForm} from './precipitation';
import {dayPeriodHoursForDate} from './forecastPeriods';

function compactPrecipitationLabel(label:string|undefined,showery:boolean){
 const value=String(label||'').toLocaleLowerCase('de-DE');
 if(value.includes('gewitter'))return'Gewitter';
 if(value.includes('schnee')&&value.includes('regen'))return'Schneeregen';
 if(value.includes('schnee'))return'Schnee';
 if(value.includes('hagel'))return'Hagel';
 return showery?'Schauer':'Regen';
}

/** Sichtbarer Wettercharakter der 7-Tage-Kacheln: bewusst kurz und einzeilig. */
export function compactSevenDayConditionLabel(day:Day,hours:Hour[]){
 const calendarHours=hours.filter(hour=>hour.time.startsWith(day.date)),daylight=dayPeriodHoursForDate(day.date,hours),dayHours=daylight.length?daylight:calendarHours,character=dayWeatherCharacter(day,dayHours),assessment=dayPrecipitationAssessment(day,dayHours),characterText=dayWeatherCharacterText(character).toLocaleLowerCase('de-DE'),form=dominantPrecipitationForm(dayHours)?.label;
 const sunny=/sonnig|heiter|freundlich/.test(characterText),cloudy=/bedeckt|stark bewölkt|meist bewölkt/.test(characterText),warm=day.max>=30,windy=day.wind>=15||(day.gust>=34&&day.wind>=10)||day.gust>=42,showery=assessment.showery&&assessment.dominant;
 if(showery)return compactPrecipitationLabel(form,true);
 if(assessment.dominant||character.precipitationDominant)return compactPrecipitationLabel(form,false);
 if(windy&&!cloudy)return'Windig';
 if(sunny&&warm)return'Warm';
 if(sunny)return'Sonnig';
 if(windy)return'Windig';
 return'Ruhig';
}
