function formatDecimalFixed(value:number,fractionDigits=1){return new Intl.NumberFormat('de-DE',{useGrouping:false,minimumFractionDigits:fractionDigits,maximumFractionDigits:fractionDigits}).format(value)}

export type PrecipType='none'|'drizzle'|'freezingDrizzle'|'rain'|'freezingRain'|'showers'|'snow'|'snowGrains'|'snowShowers'|'sleet'|'sleetShowers'|'thunderstorm'|'thunderstormHail';

export type PrecipSample={
 time?:string;
 epoch?:number;
 timezone?:string;
 precipitation:number;
 rain:number;
 showers:number;
 snowfall:number;
 probability:number;
 code:number;
 temperature?:number;
 dewPoint?:number;
 humidity?:number;
 cloud?:number;
 lowCloud?:number;
 cloudBaseHft?:number;
 ceilingHft?:number;
};

export type PrecipitationParts={
 total:number;
 type:PrecipType;
 label:string;
 weatherLabel:string;
 code:number;
 displayCode:number;
};

export const WMO_PRECIP_TYPE:Partial<Record<number,PrecipType>>={
 51:'drizzle',53:'drizzle',55:'drizzle',
 56:'freezingDrizzle',57:'freezingDrizzle',
 61:'rain',63:'rain',65:'rain',
 66:'freezingRain',67:'freezingRain',
 68:'sleet',69:'sleet',
 71:'snow',73:'snow',75:'snow',77:'snowGrains',
 80:'showers',81:'showers',82:'showers',
 83:'sleetShowers',84:'sleetShowers',
 85:'snowShowers',86:'snowShowers',
 95:'thunderstorm',97:'thunderstorm',
 96:'thunderstormHail',99:'thunderstormHail'
};

export type ForecastPrecipitationConsistencyInput={
 precipitation:number;
 rain?:number;
 showers?:number;
 snowfall?:number;
 probability:number;
 code:number;
 cloud?:number;
};

export type ForecastPrecipitationConsistency={
 precipitation:number;
 rain:number;
 showers:number;
 snowfall:number;
 probability:number;
 code:number;
 traceSuppressed:boolean;
};

const UNSUPPORTED_FORECAST_TRACE_MAX_MM=.15;
const UNSUPPORTED_FORECAST_TRACE_MAX_PROBABILITY=5;

function dryForecastWeatherCode(code:number,cloud:unknown){
 if([45,48].includes(code))return code;
 const cover=Number(cloud);
 if(!Number.isFinite(cover))return 3;
 if(cover<=15)return 0;
 if(cover<=45)return 1;
 if(cover<=80)return 2;
 return 3;
}

/**
 * Beseitigt ausschließlich sehr kleine, probabilistisch ungestützte
 * Forecast-Impulse. Open-Meteo Best Match kann Menge/Wettercode und
 * Niederschlagswahrscheinlichkeit aus unterschiedlich kombinierten
 * Modellfeldern liefern. Ein Trace bis 0,15 mm bei höchstens 5 % wird daher
 * nicht als sicherer Regen dargestellt. Größere deterministische Signale
 * bleiben unverändert erhalten und werden nicht künstlich umgedeutet.
 */
export function reconcileForecastPrecipitation(input:ForecastPrecipitationConsistencyInput):ForecastPrecipitationConsistency{
 const precipitation=Math.max(0,Number(input.precipitation)||0),rain=Math.max(0,Number(input.rain)||0),showers=Math.max(0,Number(input.showers)||0),snowfall=Math.max(0,Number(input.snowfall)||0),probability=Math.max(0,Math.min(100,Number(input.probability)||0)),code=Math.round(Number(input.code)||0),wetCode=Boolean(WMO_PRECIP_TYPE[code]),wetSignal=wetCode||precipitation>=.01||rain>=.01||showers>=.01||snowfall>=.01,tinySignal=Math.max(precipitation,rain,showers,snowfall)<=UNSUPPORTED_FORECAST_TRACE_MAX_MM,traceSuppressed=wetSignal&&tinySignal&&probability<=UNSUPPORTED_FORECAST_TRACE_MAX_PROBABILITY;
 if(!traceSuppressed)return{precipitation,rain,showers,snowfall,probability,code,traceSuppressed:false};
 return{precipitation:0,rain:0,showers:0,snowfall:0,probability,code:dryForecastWeatherCode(code,input.cloud),traceSuppressed:true};
}

const PRECIP_LABEL:Record<Exclude<PrecipType,'none'>,string>={
 drizzle:'Sprühregen',
 freezingDrizzle:'Gefrierender Sprühregen',
 rain:'Regen',
 freezingRain:'Gefrierender Regen',
 showers:'Regenschauer',
 snow:'Schneefall',
 snowGrains:'Schneegriesel',
 snowShowers:'Schneeschauer',
 sleet:'Schneeregen',
 sleetShowers:'Schneeregenschauer',
 thunderstorm:'Gewitterniederschlag',
 thunderstormHail:'Gewitter mit Hagel'
};

/**
 * Bestimmt die Niederschlagsform für Diagramm, Legende und Stunden-Tooltip.
 * Ein vorhandener WMO-Wettercode ist die maßgebliche Phasenangabe und wird
 * deshalb nicht durch parallel gelieferte Mengenfelder umgedeutet. Das ist
 * besonders für Schnee wichtig: precipitation enthält dort das flüssige
 * Wasseräquivalent und darf nicht als zusätzlicher Regenanteil gelten.
 */
function finiteOrNaN(value:unknown){const number=Number(value);return Number.isFinite(number)?number:Number.NaN}

function estimatedCloudBaseHft(h:PrecipSample){
 const observed=[finiteOrNaN(h.ceilingHft),finiteOrNaN(h.cloudBaseHft)].filter(Number.isFinite);
 if(observed.length)return Math.min(...observed);
 const temperature=finiteOrNaN(h.temperature),dewPoint=finiteOrNaN(h.dewPoint);
 // Näherung für die konvektive Kondensationshöhe: ca. 400 ft je Kelvin T−Td.
 return Number.isFinite(temperature)&&Number.isFinite(dewPoint)?Math.max(0,(temperature-dewPoint)*400):Number.NaN;
}

function lowStratusSignal(h:PrecipSample,{humidityMinimum,lowCloudMinimum}:{humidityMinimum:number;lowCloudMinimum:number}){
 const humidity=finiteOrNaN(h.humidity),lowCloud=finiteOrNaN(h.lowCloud),cloud=finiteOrNaN(h.cloud),baseHft=estimatedCloudBaseHft(h);
 const humidEnough=Number.isFinite(humidity)&&humidity>=humidityMinimum;
 const lowCloudEnough=Number.isFinite(lowCloud)?lowCloud>=lowCloudMinimum:Number.isFinite(cloud)&&cloud>=92;
 const lowCloudDominant=Number.isFinite(lowCloud)&&Number.isFinite(cloud)?lowCloud>=Math.max(lowCloudMinimum,cloud*.72):lowCloudEnough;
 const sufficientlyLow=Number.isFinite(baseHft)?baseHft<=3000:humidEnough&&humidity>=97&&lowCloudEnough;
 return humidEnough&&lowCloudEnough&&lowCloudDominant&&sufficientlyLow;
}

function drizzlePlausible(h:PrecipSample,total:number){
 const weakStratiformRate=total<=.8&&Math.max(0,Number(h.showers)||0)<.03;
 return lowStratusSignal(h,{humidityMinimum:92,lowCloudMinimum:80})&&weakStratiformRate;
}

function snowGrainsPlausible(h:PrecipSample,total:number){
 const weakNonConvective=total<=.5&&Math.max(0,Number(h.showers)||0)<.03;
 return lowStratusSignal(h,{humidityMinimum:88,lowCloudMinimum:75})&&weakNonConvective;
}

function rainIntensity(total:number){
 if(total>=50)return'sehr starker';
 if(total>=10)return'starker';
 if(total>=2.5)return'mäßiger';
 return'leichter';
}

function drizzleIntensity(total:number){
 if(total>=.5)return'starker';
 if(total>=.1)return'mäßiger';
 return'leichter';
}

function representativePrecipitationCode(type:PrecipType,total:number,snowCm:number){
 if(type==='drizzle')return total>=.5?55:total>=.1?53:51;
 if(type==='freezingDrizzle')return total>=.5?57:56;
 if(type==='rain')return total>=10?65:total>=2.5?63:61;
 if(type==='freezingRain')return total>=2.5?67:66;
 if(type==='showers')return total>=10?82:total>=2.5?81:80;
 if(type==='snow')return snowCm>=2?75:snowCm>=.5?73:71;
 if(type==='snowGrains')return 77;
 if(type==='snowShowers')return snowCm>=2?86:85;
 if(type==='sleet')return total>=2.5?69:68;
 if(type==='sleetShowers')return total>=2.5?84:83;
 if(type==='thunderstormHail')return 96;
 if(type==='thunderstorm')return 95;
 return 3;
}

/**
 * Bestimmt Niederschlagsart, Text und Symbol zentral für die gesamte App.
 * Der WMO-Code bleibt für die Phase (flüssig, gefrierend, gemischt oder fest)
 * maßgeblich. Die Plausibilitätsprüfung korrigiert ausschließlich die seltenen
 * Unterarten Sprühregen und Schneegriesel: fehlt die typische feuchte, tiefe
 * Stratuslage, eine sehr niedrige Wolkenbasis und eine schwache nicht-konvektive
 * Rate, wird innerhalb derselben Phase zu Regen bzw. Schnee verallgemeinert.
 */
export function precipitationParts(h:PrecipSample):PrecipitationParts{
 const total=Math.max(0,Number(h.precipitation)||0);
 const rainValue=Math.max(0,Number(h.rain)||0);
 const showerValue=Math.max(0,Number(h.showers)||0);
 const snowCm=Math.max(0,Number(h.snowfall)||0);
 const code=Math.round(Number(h.code)||0);
 const codedType=WMO_PRECIP_TYPE[code];
 const hasRain=rainValue>=.05;
 const hasShowers=showerValue>=.05;
 const hasSnow=snowCm>=.05;
 let type:PrecipType;

 if(codedType==='drizzle'){
  type=drizzlePlausible(h,total)?'drizzle':hasShowers?'showers':'rain';
 }else if(codedType==='freezingDrizzle'){
  type=drizzlePlausible(h,total)?'freezingDrizzle':'freezingRain';
 }else if(codedType==='snowGrains'){
  type=snowGrainsPlausible(h,total)?'snowGrains':hasShowers?'snowShowers':'snow';
 }else if(codedType){
  // Die vom Modell gelieferte Niederschlagsphase darf durch Feuchte-, Wolken-
  // oder Temperaturkriterien nicht verändert werden.
  type=codedType;
 }else if(hasSnow&&hasShowers)type='sleetShowers';
 else if(hasSnow&&hasRain)type='sleet';
 else if(hasSnow)type='snow';
 else if(hasShowers)type='showers';
 else if(hasRain||total>=.01)type='rain';
 else type='none';

 if(type==='none')return{total,type,label:'kein Niederschlag',weatherLabel:'kein Niederschlag',code,displayCode:code};
 const amount=type==='snow'||type==='snowShowers'||type==='snowGrains'
  ?`${formatDecimalFixed(snowCm,1)} cm`
  :type==='sleet'||type==='sleetShowers'
   ?`${formatDecimalFixed(total,1)} mm · ${formatDecimalFixed(snowCm,1)} cm`
   :`${formatDecimalFixed(total,1)} mm`;
 const weatherLabel=type==='rain'
  ?`${rainIntensity(total)} Regen`
  :type==='drizzle'
   ?`${drizzleIntensity(total)} Sprühregen`
   :PRECIP_LABEL[type];
 const displayCode=codedType===type
  ?code
  :representativePrecipitationCode(type,total,snowCm);
 const label=`${weatherLabel} ${amount}`;
 return{total,type,label,weatherLabel,code,displayCode};
}

const PRECIP_TYPE_ORDER:PrecipType[]=['drizzle','freezingDrizzle','rain','freezingRain','showers','sleet','sleetShowers','snow','snowGrains','snowShowers','thunderstorm','thunderstormHail'];

export function presentPrecipTypes(series:{type:PrecipType}[]){
 return PRECIP_TYPE_ORDER.filter(type=>series.some(item=>item.type===type)) as Exclude<PrecipType,'none'>[];
}
