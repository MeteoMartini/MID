export type SourceNetworkClass='official'|'professional'|'pws'|'citizen'|'unknown'|undefined;
export type SourceSiteClass='urban'|'suburban'|'rural'|'unknown'|undefined;
export type StationAnalysisField='temperature'|'humidity'|'dewPoint'|'pressure'|'windSpeed'|'windDirection'|'windGust'|'visibility'|'cloudCover'|'ceilingHft'|'cloudBaseHft'|'precipitation';

export type StationSourcePolicy={
 quality:number;
 temperatureDistanceKm:number;
 temperatureAgeMinutes:number;
 windDistanceKm:number;
 windAgeMinutes:number;
 sensitiveDistanceKm:number;
 sensitiveAgeMinutes:number;
 precipitationMinutes?:number;
 sensitiveAllowed:boolean;
};

const OFFICIAL:StationSourcePolicy={quality:1.55,temperatureDistanceKm:32,temperatureAgeMinutes:105,windDistanceKm:46,windAgeMinutes:95,sensitiveDistanceKm:42,sensitiveAgeMinutes:75,precipitationMinutes:10,sensitiveAllowed:true};
const GENERIC_OFFICIAL:StationSourcePolicy={...OFFICIAL,quality:1.46,precipitationMinutes:60};
const AVIATION:StationSourcePolicy={quality:1.24,temperatureDistanceKm:38,temperatureAgeMinutes:105,windDistanceKm:58,windAgeMinutes:110,sensitiveDistanceKm:52,sensitiveAgeMinutes:90,precipitationMinutes:60,sensitiveAllowed:true};
const PROFESSIONAL:StationSourcePolicy={quality:1.14,temperatureDistanceKm:28,temperatureAgeMinutes:90,windDistanceKm:40,windAgeMinutes:85,sensitiveDistanceKm:32,sensitiveAgeMinutes:70,precipitationMinutes:60,sensitiveAllowed:true};
const PWS:StationSourcePolicy={quality:.88,temperatureDistanceKm:13,temperatureAgeMinutes:65,windDistanceKm:18,windAgeMinutes:60,sensitiveDistanceKm:10,sensitiveAgeMinutes:40,precipitationMinutes:60,sensitiveAllowed:false};
const CITIZEN:StationSourcePolicy={quality:.42,temperatureDistanceKm:6,temperatureAgeMinutes:38,windDistanceKm:8,windAgeMinutes:35,sensitiveDistanceKm:5,sensitiveAgeMinutes:25,precipitationMinutes:10,sensitiveAllowed:false};
const DEFAULT:StationSourcePolicy={quality:.9,temperatureDistanceKm:22,temperatureAgeMinutes:80,windDistanceKm:28,windAgeMinutes:75,sensitiveDistanceKm:24,sensitiveAgeMinutes:60,precipitationMinutes:60,sensitiveAllowed:false};

export function sourcePolicyFor(provider='',networkClass:SourceNetworkClass='unknown'):StationSourcePolicy{
 const value=provider.toLowerCase();
 if(/\bdwd\b|geosphere|hydromet|meteo swiss|meteoswiss/.test(value))return OFFICIAL;
 if(/metar|aviationweather|airport observation/.test(value))return AVIATION;
 if(networkClass==='official')return GENERIC_OFFICIAL;
 if(networkClass==='professional'||/synoptic|mesowest|madis|xweather/.test(value))return PROFESSIONAL;
 if(networkClass==='citizen'||/opensensemap|sensebox/.test(value))return CITIZEN;
 if(networkClass==='pws'||/weather underground|netatmo|\bpws\b/.test(value))return PWS;
 return DEFAULT;
}

export function fieldWeightPolicy(provider:string|undefined,networkClass:SourceNetworkClass,field:StationAnalysisField){
 const source=sourcePolicyFor(provider,networkClass);
 if(field==='windSpeed'||field==='windDirection'||field==='windGust')return{quality:source.quality,distanceScaleKm:source.windDistanceKm,ageScaleMinutes:source.windAgeMinutes,sensitiveAllowed:source.sensitiveAllowed};
 if(field==='visibility'||field==='cloudCover'||field==='ceilingHft'||field==='cloudBaseHft'||field==='precipitation')return{quality:source.quality,distanceScaleKm:source.sensitiveDistanceKm,ageScaleMinutes:source.sensitiveAgeMinutes,sensitiveAllowed:source.sensitiveAllowed};
 return{quality:source.quality,distanceScaleKm:source.temperatureDistanceKm,ageScaleMinutes:source.temperatureAgeMinutes,sensitiveAllowed:source.sensitiveAllowed};
}

export function fieldSiteCompatibility(field:StationAnalysisField,target:SourceSiteClass,station:SourceSiteClass){
 if(target==='unknown'||station==='unknown'||!target||!station)return 1;
 if(target===station)return field==='windSpeed'||field==='windDirection'||field==='windGust'?1.08:1.18;
 if((target==='urban'&&station==='suburban')||(target==='suburban'&&station==='urban'))return 1.05;
 if(field==='windSpeed'||field==='windDirection'||field==='windGust'){
  if(station==='rural')return target==='urban'?.92:1.04;
  if(station==='urban'&&target==='rural')return .78;
  return .9;
 }
 if(target==='rural'&&station==='urban')return .68;
 if(target==='urban'&&station==='rural')return .72;
 return .88;
}

export function precipitationIntervalMinutes(provider:string|undefined,networkClass:SourceNetworkClass,explicit?:number){
 if(Number.isFinite(explicit)&&Number(explicit)>=5&&Number(explicit)<=180)return Number(explicit);
 return sourcePolicyFor(provider,networkClass).precipitationMinutes??60;
}

export function normalisePrecipitationAccumulation(value:number|undefined,intervalMinutes:number|undefined,targetMinutes=60){
 if(!Number.isFinite(value))return undefined;
 const interval=Number.isFinite(intervalMinutes)&&Number(intervalMinutes)>=5&&Number(intervalMinutes)<=180?Number(intervalMinutes):targetMinutes;
 return Math.max(0,Number(value))*targetMinutes/interval;
}
