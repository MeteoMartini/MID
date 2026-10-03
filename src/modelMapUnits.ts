import {wind,type WindUnit} from './weather';
import {formatDecimal} from './format';
import {compactPrecipitationAmount} from './forecastAmountFormat';
import type {NativeFieldKind} from './nativeModelFields';
// Same physical conversions as canonical wind(), before display rounding.
export function modelMapDisplayFactor(kind:NativeFieldKind,unit:WindUnit){
 return kind==='wind'||kind==='gust'?{kn:1/1.852,kmh:1,ms:.514444/1.852,mph:1.15078/1.852}[unit]:1;
}
export function modelMapUnit(kind:NativeFieldKind,rawUnit:string,unit:WindUnit){
 return kind==='wind'||kind==='gust'?wind(0,unit).split(' ').at(-1)!:rawUnit;
}
export function modelMapValue(kind:NativeFieldKind,value:number|null,rawUnit:string,unit:WindUnit){
 if(value===null||!Number.isFinite(value))return '–';
 if(kind==='wind'||kind==='gust'){
  // The immutable DWD field stores km/h. Canonical MID wind() accepts knots.
  if(rawUnit!=='km/h')return '–';
  const text=wind(value/1.852,unit),suffix=modelMapUnit(kind,rawUnit,unit);
  return text.slice(0,-suffix.length).trim();
 }
 return kind==='precipitation'?compactPrecipitationAmount(value):kind==='sigwx'?String(Math.round(value)):formatDecimal(value,1);
}
