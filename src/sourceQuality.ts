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

export type FieldRelevanceLimits={
 preferredDistanceKm:number;
 hardDistanceKm:number;
 preferredAgeMinutes:number;
 hardAgeMinutes:number;
 heightScaleM:number;
 hardHeightDifferenceM:number;
 minimumAnchorRelevance:number;
};

// Quellenqualität ist nicht gleich räumliche/zeitliche Repräsentativität. Auch eine
// amtliche Station darf bei dynamischen Feldern nicht wegen ihres Namens lange oder
// über große Distanzen dominieren. Die eigentliche Härtegrenze liegt deshalb separat
// im parameterbezogenen Relevanzvertrag weiter unten.
const OFFICIAL:StationSourcePolicy={quality:1.55,temperatureDistanceKm:18,temperatureAgeMinutes:42,windDistanceKm:28,windAgeMinutes:38,sensitiveDistanceKm:22,sensitiveAgeMinutes:32,precipitationMinutes:10,sensitiveAllowed:true};
const GENERIC_OFFICIAL:StationSourcePolicy={...OFFICIAL,quality:1.46,precipitationMinutes:60};
const ROAD_WEATHER:StationSourcePolicy={quality:1.32,temperatureDistanceKm:18,temperatureAgeMinutes:50,windDistanceKm:5,windAgeMinutes:35,sensitiveDistanceKm:5,sensitiveAgeMinutes:30,precipitationMinutes:15,sensitiveAllowed:false};
const AVIATION:StationSourcePolicy={quality:1.24,temperatureDistanceKm:20,temperatureAgeMinutes:48,windDistanceKm:32,windAgeMinutes:45,sensitiveDistanceKm:30,sensitiveAgeMinutes:42,precipitationMinutes:60,sensitiveAllowed:true};
const PROFESSIONAL:StationSourcePolicy={quality:1.14,temperatureDistanceKm:16,temperatureAgeMinutes:40,windDistanceKm:24,windAgeMinutes:38,sensitiveDistanceKm:18,sensitiveAgeMinutes:32,precipitationMinutes:60,sensitiveAllowed:true};
const PWS:StationSourcePolicy={quality:.88,temperatureDistanceKm:8,temperatureAgeMinutes:30,windDistanceKm:12,windAgeMinutes:28,sensitiveDistanceKm:7,sensitiveAgeMinutes:22,precipitationMinutes:60,sensitiveAllowed:false};
const CITIZEN:StationSourcePolicy={quality:.42,temperatureDistanceKm:4,temperatureAgeMinutes:22,windDistanceKm:5,windAgeMinutes:20,sensitiveDistanceKm:4,sensitiveAgeMinutes:16,precipitationMinutes:10,sensitiveAllowed:false};
const DEFAULT:StationSourcePolicy={quality:.9,temperatureDistanceKm:13,temperatureAgeMinutes:36,windDistanceKm:18,windAgeMinutes:34,sensitiveDistanceKm:14,sensitiveAgeMinutes:28,precipitationMinutes:60,sensitiveAllowed:false};

const FIELD_RELEVANCE:Record<StationAnalysisField,FieldRelevanceLimits>={
 // 90 min bzw. 50 km sind für 2-m-Temperatur kein hyperlokaler Anker mehr.
 temperature:{preferredDistanceKm:10,hardDistanceKm:45,preferredAgeMinutes:22,hardAgeMinutes:75,heightScaleM:480,hardHeightDifferenceM:850,minimumAnchorRelevance:.14},
 humidity:{preferredDistanceKm:13,hardDistanceKm:48,preferredAgeMinutes:28,hardAgeMinutes:85,heightScaleM:560,hardHeightDifferenceM:950,minimumAnchorRelevance:.12},
 dewPoint:{preferredDistanceKm:13,hardDistanceKm:48,preferredAgeMinutes:28,hardAgeMinutes:85,heightScaleM:560,hardHeightDifferenceM:950,minimumAnchorRelevance:.12},
 // QFF ist räumlich wesentlich glatter und darf daher länger/weiter stützen.
 pressure:{preferredDistanceKm:65,hardDistanceKm:180,preferredAgeMinutes:85,hardAgeMinutes:210,heightScaleM:1800,hardHeightDifferenceM:2600,minimumAnchorRelevance:.07},
 windSpeed:{preferredDistanceKm:15,hardDistanceKm:58,preferredAgeMinutes:20,hardAgeMinutes:70,heightScaleM:900,hardHeightDifferenceM:1500,minimumAnchorRelevance:.13},
 windDirection:{preferredDistanceKm:15,hardDistanceKm:58,preferredAgeMinutes:20,hardAgeMinutes:70,heightScaleM:900,hardHeightDifferenceM:1500,minimumAnchorRelevance:.13},
 windGust:{preferredDistanceKm:12,hardDistanceKm:48,preferredAgeMinutes:16,hardAgeMinutes:55,heightScaleM:850,hardHeightDifferenceM:1400,minimumAnchorRelevance:.15},
 visibility:{preferredDistanceKm:10,hardDistanceKm:38,preferredAgeMinutes:18,hardAgeMinutes:55,heightScaleM:650,hardHeightDifferenceM:1100,minimumAnchorRelevance:.16},
 cloudCover:{preferredDistanceKm:18,hardDistanceKm:58,preferredAgeMinutes:25,hardAgeMinutes:75,heightScaleM:720,hardHeightDifferenceM:1200,minimumAnchorRelevance:.12},
 // Flughafen-/METAR-Decken besitzen etwas größere räumliche Aussagekraft als Sicht.
 ceilingHft:{preferredDistanceKm:28,hardDistanceKm:82,preferredAgeMinutes:34,hardAgeMinutes:95,heightScaleM:900,hardHeightDifferenceM:1500,minimumAnchorRelevance:.10},
 cloudBaseHft:{preferredDistanceKm:28,hardDistanceKm:82,preferredAgeMinutes:34,hardAgeMinutes:95,heightScaleM:900,hardHeightDifferenceM:1500,minimumAnchorRelevance:.10},
 // Punktniederschlag ist besonders lokal und altert schnell; Radar/Nowcast bleibt führend.
 precipitation:{preferredDistanceKm:7,hardDistanceKm:28,preferredAgeMinutes:12,hardAgeMinutes:40,heightScaleM:600,hardHeightDifferenceM:950,minimumAnchorRelevance:.18}
};

export function sourcePolicyFor(provider='',networkClass:SourceNetworkClass='unknown'):StationSourcePolicy{
 const value=provider.toLowerCase();
 if(/road-weather|straßenwetter|strassenwetter|gma|swsmos|sws\b/.test(value))return ROAD_WEATHER;
 if(/\bdwd\b|geosphere|hydromet|meteo swiss|meteoswiss|smhi|fmi|environment canada|eccc|aemet|knmi/.test(value))return OFFICIAL;
 if(/metar|aviationweather|airport observation/.test(value))return AVIATION;
 if(networkClass==='official')return GENERIC_OFFICIAL;
 if(networkClass==='professional'||/synoptic|mesowest|madis|xweather/.test(value))return PROFESSIONAL;
 if(networkClass==='citizen'||/opensensemap|sensebox/.test(value))return CITIZEN;
 if(networkClass==='pws'||/weather underground|netatmo|\bpws\b/.test(value))return PWS;
 return DEFAULT;
}

export function fieldWeightPolicy(provider:string|undefined,networkClass:SourceNetworkClass,field:StationAnalysisField){
 const source=sourcePolicyFor(provider,networkClass),road=/road-weather|straßenwetter|strassenwetter|gma|swsmos|sws\b/i.test(String(provider||''));
 // Straßenwetter ist für Fahrbahn-/Glätterisiken hervorragend, darf aber allgemeine
 // Wind-, Sicht-, Wolken- oder Niederschlagsfelder nicht wegen bloßer Nähe dominieren.
 if(road&&(field==='windSpeed'||field==='windDirection'||field==='windGust'||field==='visibility'||field==='cloudCover'||field==='ceilingHft'||field==='cloudBaseHft'||field==='precipitation'))return{quality:.08,distanceScaleKm:3,ageScaleMinutes:25,sensitiveAllowed:false};
 // GMA/Straßenwetter misst zwar auch die Luftschicht, ist aber standorttypisch stark
 // durch Fahrbahn, Einschnitt, Brücke oder Straßenrand geprägt. Diese Werte dienen
 // deshalb nur als lokale Stütze und dürfen das allgemeine hyperlokale Luftfeld nicht
 // gegenüber repräsentativeren SYNOP-/Stationsnetzen verdrängen.
 if(road&&(field==='temperature'||field==='humidity'||field==='dewPoint'))return{quality:.42,distanceScaleKm:7,ageScaleMinutes:35,sensitiveAllowed:false};
 if(road&&field==='pressure')return{quality:.28,distanceScaleKm:5,ageScaleMinutes:30,sensitiveAllowed:false};
 if(field==='windSpeed'||field==='windDirection'||field==='windGust')return{quality:source.quality,distanceScaleKm:source.windDistanceKm,ageScaleMinutes:source.windAgeMinutes,sensitiveAllowed:source.sensitiveAllowed};
 if(field==='visibility'||field==='cloudCover'||field==='ceilingHft'||field==='cloudBaseHft'||field==='precipitation')return{quality:source.quality,distanceScaleKm:source.sensitiveDistanceKm,ageScaleMinutes:source.sensitiveAgeMinutes,sensitiveAllowed:source.sensitiveAllowed};
 return{quality:source.quality,distanceScaleKm:source.temperatureDistanceKm,ageScaleMinutes:source.temperatureAgeMinutes,sensitiveAllowed:source.sensitiveAllowed};
}

export function fieldRelevanceLimits(field:StationAnalysisField):FieldRelevanceLimits{return FIELD_RELEVANCE[field]}

export function fieldObservationRelevance(field:StationAnalysisField,ageMinutes:number,distanceKm:number,heightDifferenceM=0,temporalResolutionMinutes?:number){
 const limits=fieldRelevanceLimits(field),age=Math.max(0,Number(ageMinutes)||0),distance=Math.max(0,Number(distanceKm)||0),height=Math.max(0,Number(heightDifferenceM)||0);
 if(age>=limits.hardAgeMinutes||distance>=limits.hardDistanceKm||height>=limits.hardHeightDifferenceM)return 0;
 const ageFactor=Math.exp(-Math.pow(age/Math.max(1,limits.preferredAgeMinutes),1.45)),distanceFactor=Math.exp(-Math.pow(distance/Math.max(1,limits.preferredDistanceKm),1.38)),heightFactor=Math.exp(-Math.pow(height/Math.max(100,limits.heightScaleM),1.18));
 const resolution=Number(temporalResolutionMinutes),dynamic=field!=='pressure'&&field!=='ceilingHft'&&field!=='cloudBaseHft',resolutionFactor=!Number.isFinite(resolution)||resolution<=0?1:resolution<=10?(dynamic?1.12:1.05):resolution<=20?(dynamic?1.06:1.03):resolution<=60?(dynamic ? .94 : 1):(dynamic ? .82 : .94);
 return ageFactor*distanceFactor*heightFactor*resolutionFactor;
}

export function fieldObservationCanAnchor(field:StationAnalysisField,ageMinutes:number,distanceKm:number,heightDifferenceM=0,temporalResolutionMinutes?:number){return fieldObservationRelevance(field,ageMinutes,distanceKm,heightDifferenceM,temporalResolutionMinutes)>=fieldRelevanceLimits(field).minimumAnchorRelevance}

export function fieldSiteCompatibility(field:StationAnalysisField,target:SourceSiteClass,station:SourceSiteClass){
 if(target==='unknown'||station==='unknown'||!target||!station)return 1;
 if(target===station)return field==='windSpeed'||field==='windDirection'||field==='windGust'?1.1:1.2;
 if(field==='pressure')return (target==='urban'&&station==='rural'||target==='rural'&&station==='urban') ? .96 : .98;
 if((target==='urban'&&station==='suburban')||(target==='suburban'&&station==='urban'))return (field==='temperature'||field==='humidity'||field==='dewPoint') ? .98 : 1.03;
 if((target==='rural'&&station==='suburban')||(target==='suburban'&&station==='rural'))return (field==='temperature'||field==='humidity'||field==='dewPoint') ? .9 : .98;
 if(field==='windSpeed'||field==='windDirection'||field==='windGust'){
  if(station==='rural')return target==='urban'?.82:1.04;
  if(station==='urban'&&target==='rural')return .68;
  return .86;
 }
 if(target==='rural'&&station==='urban')return .55;
 if(target==='urban'&&station==='rural')return .58;
 return .84;
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
