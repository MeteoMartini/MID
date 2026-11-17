import {formatWeatherValue} from './weatherValueFormat';
import {isTwinVerifiedNonnegative,isTwinVerifiedTemperaturePair} from './twinObservationEvidence';

/** Presentation only. No data, threshold, archive or source is modified.
 * Missing observed rain is not the same event as verified 0 mm.
 */
export function formatTwinReferenceReadout(reference:{
 max?:unknown;
 min?:unknown;
 precipitation?:unknown;
}):string{
 const max=reference.max,min=reference.min,rain=reference.precipitation;
 const temperature=isTwinVerifiedTemperaturePair(max,min)
  ?String(Math.round(min as number))+'–'+String(Math.round(max as number))+' °C'
  :'Temperatur nicht gemessen';
 const precipitation=isTwinVerifiedNonnegative(rain)
  ?formatWeatherValue(rain,'precipitation')+' mm'
  :'Niederschlag nicht gemessen';
 return temperature+' · '+precipitation;
}
