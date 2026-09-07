import {type Day,type Hour} from './weather';
import {dominantPrecipitationForm} from './precipitation';
import {dayPeriodHoursForDate} from './forecastPeriods';
import {forecastDayRegime} from './forecastRegime';

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
 const calendarHours=hours.filter(hour=>hour.time.startsWith(day.date)),daylight=dayPeriodHoursForDate(day.date,hours),dayHours=daylight.length?daylight:calendarHours,form=dominantPrecipitationForm(dayHours)?.label,regime=forecastDayRegime(day,dayHours);
 if(regime==='showery')return compactPrecipitationLabel(form,true);
 if(regime==='wet')return compactPrecipitationLabel(form,false);
 if(regime==='windy')return'Windig';
 if(regime==='warm')return'Warm';
 if(regime==='sunny')return'Sonnig';
 return'Ruhig';
}
