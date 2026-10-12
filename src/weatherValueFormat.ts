import {formatDecimal} from './format';
import {compactPrecipitationAmount} from './precipitation';

/** Presentation only: calculations, stored data, intervals and thresholds retain native values. */
export type WeatherDisplayParameter='temperature'|'dewPoint'|'pressure'|'pressureChange'|'precipitation'|'precipitationRate'|'snowfall'|'snowDepth'|'percent'|'windSpeed'|'windDirection'|'visibility'|'height'|'energy'|'radiation'|'uvi'|'waveHeight'|'wavePeriod'|'waterLevel'|'currentSpeed';
export type WeatherDisplayContext='detail'|'overview';
export function formatWeatherValue(value:unknown,parameter:WeatherDisplayParameter,context:WeatherDisplayContext='detail'):string{
 if(typeof value!=='number'||!Number.isFinite(value))return '–';
 if(['precipitation','precipitationRate','snowfall','snowDepth','visibility','height','energy','radiation','uvi','waveHeight','wavePeriod','currentSpeed'].includes(parameter)&&value<0)return '–';
 if(parameter==='visibility')return formatVisibility(value);
 if(parameter==='precipitation')return compactPrecipitationAmount(value);
 if(parameter==='windDirection')return formatDecimal((Math.round(((value%360+360)%360)/10)*10)%360,0);
 let digits=0;
 if(['temperature','dewPoint','pressure','pressureChange'].includes(parameter))digits=context==='overview'&&parameter==='temperature'?0:1;
 if(parameter==='precipitationRate'||parameter==='snowfall')digits=value<10?1:0;
 if(['waveHeight','wavePeriod','waterLevel','currentSpeed'].includes(parameter))digits=1;
 if(['precipitation','precipitationRate','snowfall','snowDepth','waveHeight','currentSpeed'].includes(parameter)&&value>0&&value<10**-digits)return `<${formatDecimal(10**-digits,digits,digits)}`;
 // Decimal formatting can produce a misleading negative zero around the rounding boundary.
 const rounded=Math.round(Math.abs(value)*10**digits)/10**digits*Math.sign(value);
 return formatDecimal(Object.is(rounded,-0)?0:rounded,digits);
}
export function formatTemperatureRange(min:unknown,max:unknown,context:WeatherDisplayContext='detail'){
 const a=formatWeatherValue(min,'temperature',context),b=formatWeatherValue(max,'temperature',context);
 return a==='–'||b==='–'?'–':a===b?a:`${a}–${b}`;
}
/** FM12 table 4377 resolution. Never round visibility upwards across a code boundary. */
export function formatVisibility(meters:unknown):string{
 if(typeof meters!=='number'||!Number.isFinite(meters)||meters<0)return '–';
 if(meters<100)return '<100 m';
 if(meters<1000)return `${Math.floor(meters/100)*100} m`;
 const km=meters/1000;
 if(km<=5)return `${formatDecimal(Math.floor(km*10)/10,1)} km`;
 if(km<=30)return `${Math.floor(km)} km`;
 if(km<=70)return `${Math.floor(km/5)*5} km`;
 return '>70 km';
}
