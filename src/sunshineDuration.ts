export const SUNSHINE_QUARTER_HOUR_SECONDS=15*60;
export const SUNSHINE_HOUR_SECONDS=60*60;

export type SunshineDurationSource='minutely_15'|'hourly'|'daily-fallback'|'missing';
export type SunshineDurationQuality='consistent'|'deviating'|'fallback'|'missing';
export type SunshineDurationDiagnostic={
 valueSeconds:number|null;
 source:SunshineDurationSource;
 quality:SunshineDurationQuality;
 daylightSeconds:number;
 hourlySamples:number;
 expectedHourlySamples:number;
 dailyReferenceSeconds:number|null;
 deviationSeconds:number|null;
};

export type SunshineDurationConsistencyReason='night'|'fog'|'opaque-low-cloud'|'stratiform-precipitation';
export type SunshineDurationConsistencyInput={
 valueSeconds:unknown;
 intervalSeconds?:number;
 daylightSeconds?:number;
 isDay?:boolean;
 weatherCode?:unknown;
 precipitation?:unknown;
 rain?:unknown;
 showers?:unknown;
 snowfall?:unknown;
 precipitationProbability?:unknown;
 cloudCover?:unknown;
 lowCloudCover?:unknown;
};
export type SunshineDurationConsistency={
 valueSeconds:number|null;
 rawSeconds:number|null;
 capSeconds:number;
 adjusted:boolean;
 reason?:SunshineDurationConsistencyReason;
};

const sunshineHoursFormatter=new Intl.NumberFormat('de-DE',{minimumFractionDigits:0,maximumFractionDigits:1});

/** Anders als Number(null) behandelt der Sunshine-Contract fehlende Providerwerte nie als meteorologische Null. */
export function finiteSunshineSeconds(value:unknown):number|null{
 if(value===null||value===undefined||value==='')return null;
 const number=Number(value);return Number.isFinite(number)?number:null;
}

export function boundedSunshineSeconds(value:unknown,maximumSeconds:number):number|null{
 const number=finiteSunshineSeconds(value),cap=Math.max(0,Number(maximumSeconds)||0);
 return number===null?null:Math.min(cap,Math.max(0,number));
}

const STRATIFORM_PRECIPITATION_CODES=new Set([51,53,55,56,57,61,63,65,66,67,68,69,71,73,75,77]);
const SHOWERY_PRECIPITATION_CODES=new Set([80,81,82,83,84,85,86,95,96,97,99]);

/**
 * Letzte appweite Plausibilisierung eines zeitlich aufgelösten Sonnenscheinwerts.
 *
 * Niederschlagswahrscheinlichkeit ist ausdrücklich keine Niederschlagsdauer und
 * begrenzt Sonnenschein deshalb niemals allein. Gekappt werden nur harte
 * Widersprüche: Nacht sowie mehrfach gestützte Nebel-, geschlossene tiefe
 * Bewölkungs- oder stratiforme Niederschlagslagen. Schauer und Gewitter bleiben
 * ausgenommen, weil heller Sonnenschein während eines Schauers möglich ist.
 */
export function reconcileSunshineDuration(input:SunshineDurationConsistencyInput):SunshineDurationConsistency{
 const intervalSeconds=Math.max(60,Number(input.intervalSeconds)||SUNSHINE_HOUR_SECONDS),rawSeconds=boundedSunshineSeconds(input.valueSeconds,intervalSeconds),explicitDaylight=finiteSunshineSeconds(input.daylightSeconds),solarCap=explicitDaylight===null?(input.isDay===false?0:intervalSeconds):Math.max(0,Math.min(intervalSeconds,explicitDaylight));
 if(rawSeconds===null)return{valueSeconds:null,rawSeconds:null,capSeconds:solarCap,adjusted:false};
 const finish=(capSeconds:number,reason?:SunshineDurationConsistencyReason):SunshineDurationConsistency=>{const cap=Math.max(0,Math.min(intervalSeconds,capSeconds)),valueSeconds=Math.min(rawSeconds,cap);return{valueSeconds,rawSeconds,capSeconds:cap,adjusted:valueSeconds<rawSeconds-.5,reason:valueSeconds<rawSeconds-.5?reason:undefined}};
 if(solarCap<=0)return finish(0,'night');
 const code=Math.round(Number(input.weatherCode)),cloud=finiteSunshineSeconds(input.cloudCover),lowCloud=finiteSunshineSeconds(input.lowCloudCover),probability=finiteSunshineSeconds(input.precipitationProbability),precipitation=Math.max(0,Number(input.precipitation)||0),rain=Math.max(0,Number(input.rain)||0),showers=Math.max(0,Number(input.showers)||0),snowfall=Math.max(0,Number(input.snowfall)||0),wetAmount=Math.max(precipitation,rain+showers,snowfall),showery=SHOWERY_PRECIPITATION_CODES.has(code)||showers>=Math.max(.05,rain*.65);
 const fog=[45,48].includes(code)&&(Number(cloud)>=82||Number(lowCloud)>=72);
 if(fog)return finish(solarCap/12,'fog');
 const opaqueLowCloud=(code===3&&Number(cloud)>=88)||(Number(cloud)>=96&&Number(lowCloud)>=88);
 if(opaqueLowCloud)return finish(solarCap/12,'opaque-low-cloud');
 const probabilitySupportsWetSignal=probability===null||probability>=30,skySupportsStratiform=Number(cloud)>=75||Number(lowCloud)>=65||wetAmount>=.3;
 if(!showery&&STRATIFORM_PRECIPITATION_CODES.has(code)&&wetAmount>=.05&&probabilitySupportsWetSignal&&skySupportsStratiform){
  const strongOrOpaque=wetAmount>=1||Number(cloud)>=95||Number(lowCloud)>=90||[55,57,65,67,69,75].includes(code);
  return finish(solarCap/(strongOrOpaque?12:6),'stratiform-precipitation');
 }
 return finish(solarCap);
}

export function coherentSunshineDurationSeconds(input:SunshineDurationConsistencyInput){return reconcileSunshineDuration(input).valueSeconds}

export function daylightSecondsFromLocalTimes(sunrise?:string|null,sunset?:string|null,fallbackSeconds=12*SUNSHINE_HOUR_SECONDS){
 const seconds=(value?:string|null)=>{const match=String(value??'').match(/T(\d{2}):(\d{2})(?::(\d{2}))?/);return match?Number(match[1])*3600+Number(match[2])*60+Number(match[3]||0):Number.NaN},rise=seconds(sunrise),set=seconds(sunset);
 if(Number.isFinite(rise)&&Number.isFinite(set)){const duration=set>=rise?set-rise:set+24*SUNSHINE_HOUR_SECONDS-rise;if(duration>0)return Math.min(24*SUNSHINE_HOUR_SECONDS,duration)}
 return Math.max(0,Number(fallbackSeconds)||12*SUNSHINE_HOUR_SECONDS);
}

/** Vier vollständige 15-Minuten-Werte haben Vorrang vor dem Stundenfeld; jeder Einzelwert bleibt auf 900 s begrenzt. */
export function canonicalSunshineHourSeconds(hourValue:unknown,quarterValues:unknown[]=[]):number|null{
 const quarters=quarterValues.map(value=>boundedSunshineSeconds(value,SUNSHINE_QUARTER_HOUR_SECONDS)).filter((value):value is number=>value!==null);
 if(quarterValues.length>=4&&quarters.length===quarterValues.length)return Math.min(SUNSHINE_HOUR_SECONDS,quarters.slice(0,4).reduce((sum,value)=>sum+value,0));
 return boundedSunshineSeconds(hourValue,SUNSHINE_HOUR_SECONDS);
}

export function canonicalSunshineDaySeconds(options:{hourValues:unknown[];dailyValue?:unknown;daylightSeconds:number;minimumExpectedHours?:number}):SunshineDurationDiagnostic{
 const daylightSeconds=Math.max(0,Number(options.daylightSeconds)||0),expectedHourlySamples=options.hourValues.length,hourly=options.hourValues.map(value=>boundedSunshineSeconds(value,SUNSHINE_HOUR_SECONDS)),validHourly=hourly.filter((value):value is number=>value!==null),minimumExpectedHours=Math.max(1,Math.round(options.minimumExpectedHours??18)),completeHourlyDay=expectedHourlySamples>=minimumExpectedHours&&validHourly.length===expectedHourlySamples,dailyReferenceSeconds=boundedSunshineSeconds(options.dailyValue,daylightSeconds),hourlySeconds=completeHourlyDay?Math.min(daylightSeconds,validHourly.reduce((sum,value)=>sum+value,0)):null,deviationSeconds=hourlySeconds!==null&&dailyReferenceSeconds!==null?hourlySeconds-dailyReferenceSeconds:null;
 if(hourlySeconds!==null){const tolerance=Math.max(30*60,daylightSeconds*.12),quality:SunshineDurationQuality=deviationSeconds!==null&&Math.abs(deviationSeconds)>tolerance?'deviating':'consistent';return{valueSeconds:hourlySeconds,source:'hourly',quality,daylightSeconds,hourlySamples:validHourly.length,expectedHourlySamples,dailyReferenceSeconds,deviationSeconds}}
 if(dailyReferenceSeconds!==null)return{valueSeconds:dailyReferenceSeconds,source:'daily-fallback',quality:'fallback',daylightSeconds,hourlySamples:validHourly.length,expectedHourlySamples,dailyReferenceSeconds,deviationSeconds:null};
 return{valueSeconds:null,source:'missing',quality:'missing',daylightSeconds,hourlySamples:validHourly.length,expectedHourlySamples,dailyReferenceSeconds:null,deviationSeconds:null};
}

export function sunshineMinutesValue(seconds:unknown,maximumMinutes=60){
 const cap=Math.max(0,Math.round(Number(maximumMinutes)||0)),value=boundedSunshineSeconds(seconds,cap*60);return value===null?'–':String(Math.max(0,Math.min(cap,Math.round(value/60))));
}
export function sunshineMinutesLabel(seconds:unknown,maximumMinutes=60){const value=sunshineMinutesValue(seconds,maximumMinutes);return value==='–'?value:`${value} min`}
export function sunshineHoursValue(seconds:unknown){const value=finiteSunshineSeconds(seconds);return value===null?'–':sunshineHoursFormatter.format(Math.max(0,value)/SUNSHINE_HOUR_SECONDS)}
export function sunshineHoursLabel(seconds:unknown){const value=sunshineHoursValue(seconds);return value==='–'?value:`${value} h`}
