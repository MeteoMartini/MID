import type {Day} from './weather';
import {precipitationAmountLabel} from './precipitation';
import {formatWeatherValue} from './weatherValueFormat';

/** Compact daily labels; never relabel an hourly maximum as an event probability. */
export function widgetCurveDailyPrecipitation(day:Pick<Day,'precipitation'|'precipitationAvailable'|'snowfall'|'probability'|'probabilityAvailable'|'probabilitySource'>){
 const amount=precipitationAmountLabel(day);
 const valid=day.probabilityAvailable!==false&&Number.isFinite(day.probability)&&day.probability>=0&&day.probability<=100;
 const event=day.probabilitySource==='ensemble-members-dwd';
 const probability=valid?`${event?'':'max '}${formatWeatherValue(day.probability,'percent')}%`:'–%';
 const meaning=event?'Tages-Ereigniswahrscheinlichkeit 00–24 h für mehr als 0,2 mm':'Maximale Stundenwahrscheinlichkeit des lokalen Tages';
 return {amount,probability,title:`${amount} · ${meaning}: ${valid?formatWeatherValue(day.probability,'percent')+' %':'keine Daten'}`};
}
