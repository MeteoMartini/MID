import {DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM,stationFieldObservationUsable,type Day,type EnsembleDay,type Hour,type Location,type RadarNowcast,type Station} from './weather';
import {formatDisplayDateTime} from './timeDisplay';

const PREFIX='mid:forecast-verification:v3:';
const LEGACY_PREFIXES=['mid:forecast-verification:v2:','mid:forecast-verification:v1:'];
const PROFILE_PREFIX='mid:weather-twin:profile:v1:';
const PROFILE_INFERENCE_VERSION=2;
export const WEATHER_TWIN_SETTINGS_KEY='mid:weather-twin:settings:v1';
const FEEDBACK_PREFIX='mid:weather-twin:feedback:v1:';
// localStorage keeps only a fast-start window. The complete archive is preserved in IndexedDB and device sync.
const MAX_CAPTURES=72;
const MAX_REFERENCES=60;
const MAX_OBSERVATIONS=192;
const ARCHIVE_MAX_CAPTURES=4200;
const ARCHIVE_MAX_REFERENCES=1100;
const ARCHIVE_MAX_OBSERVATIONS=4200;
const REFERENCE_REFRESH_MS=6*3600000;
const REFERENCE_REFRESH_PREFIX='mid:runtime:weather-twin-reference:';
const HORIZONS=[12,24,48,72] as const;
const REGIMES=['hochdruck','wechselhaft','front','konvektiv','schauer','dauerregen','gewitter','sturm','winterlich','inversion','foehn'] as const;

export type ForecastHorizon=typeof HORIZONS[number];
export type WeatherRegime=typeof REGIMES[number];
export type ForecastParameter='temperature'|'precipitation'|'probability'|'gust'|'sunshine';
// Bewertungsprofil v2: bestehende Lern-/Archivdaten bleiben unverändert erhalten. Nur die
// Auswertung derselben Parameterfehler wird nach meteorologischer Relevanz priorisiert.
// Niederschlag, Temperatur und Wind/Böen dominieren bewusst den Gesamtscore; Sonnenschein
// kann deshalb kein Modell mehr allein zum Gesamtsieger machen.
export const FORECAST_PARAMETER_IMPORTANCE:Record<ForecastParameter,number>={
 precipitation:28,
 temperature:24,
 gust:20,
 probability:18,
 sunshine:10
};
export const FORECAST_SCORING_PROFILE_VERSION=2;
export type TwinConfidence='low'|'medium'|'high';
export type ObservationKind='measured'|'private-sensor'|'analysed'|'reanalysis'|'model-fallback';
export type TwinTerrain='plain'|'valley'|'slope'|'ridge'|'coast';
export type TwinActivity='commute'|'outdoor'|'garden'|'rowing'|'dog'|'ski'|'heat';

export type ForecastPrediction={
 id:string;
 label:string;
 max:number;
 min:number;
 precipitation:number;
 probability:number;
 gust?:number;
 sunshineDuration?:number;
 weatherCode?:number;
};

export type AdditionalForecastPrediction={id:string;label:string;days:Day[]};

export type ForecastCapture={
 id:string;
 targetDate:string;
 issuedAt:string;
 leadHours:number;
 timezone?:string;
 predictedRegime?:WeatherRegime;
 predictions:ForecastPrediction[];
};

export type ObservationSource={
 id:string;
 label:string;
 kind:ObservationKind;
 quality:number;
 timestamp?:string;
 distanceKm?:number;
 detail?:string;
};

export type ForecastReference={
 date:string;
 max:number;
 min:number;
 precipitation:number;
 source:string;
 weatherCode?:number;
 gust?:number;
 sunshineDuration?:number;
 regime:WeatherRegime;
 quality:number;
 confidence:TwinConfidence;
 kind:ObservationKind;
 sources:ObservationSource[];
 coverageHours?:number;
};

export type TwinLiveObservation={
 id:string;
 timestamp:string;
 date:string;
 temperature?:number;
 precipitationRate?:number;
 precipitationIncrement?:number;
 gust?:number;
 cloudCover?:number;
 source:ObservationSource;
};

type Store={
 version:3;
 updatedAt:string;
 captures:ForecastCapture[];
 references:ForecastReference[];
 observations:TwinLiveObservation[];
};

export type ForecastVerificationArchiveBundle={
 schema:'mid-weather-twin-archive';
 version:1;
 exportedAt:string;
 updatedAt:string;
 locations:Record<string,Store>;
 counts:{locations:number;captures:number;references:number;observations:number};
};

export type ForecastVerificationArchiveStats={locations:number;captures:number;references:number;observations:number;updatedAt:string};

export type ParameterMetric={
 parameter:ForecastParameter;
 samples:number;
 error:number;
 score:number;
};

export type ForecastModelScore={
 id:string;
 label:string;
 days:number;
 temperatureMae:number;
 precipitationMae:number;
 brier:number;
 gustMae?:number;
 sunshineMae?:number;
 score:number;
 weight:number;
 confidence:TwinConfidence;
 parameterMetrics:Partial<Record<ForecastParameter,ParameterMetric>>;
};

export type ForecastSegmentScore={
 regime:WeatherRegime;
 horizon:ForecastHorizon;
 days:number;
 models:ForecastModelScore[];
 bestModel?:ForecastModelScore;
};

export type ForecastDayReview={
 date:string;
 issuedAt:string;
 leadHours:number;
 timezone?:string;
 horizon:ForecastHorizon;
 regime:WeatherRegime;
 reference:ForecastReference;
 bestMatch?:ForecastPrediction;
 equalWeighted?:ForecastPrediction;
 localWeighted?:ForecastPrediction;
 winner?:ForecastModelScore;
};

export type ModelWeight={
 id:string;
 label:string;
 weight:number;
 days:number;
 confidence:TwinConfidence;
 maxWeight:number;
 capConfidence:TwinConfidence;
 capSamples:number;
 validationSamples:number;
 validationImprovement?:number;
 parameterWeights:Partial<Record<ForecastParameter,number>>;
 parameterCaps:Partial<Record<ForecastParameter,number>>;
};

export type BiasCorrection={
 id:string;
 label:string;
 regime:WeatherRegime;
 horizon:ForecastHorizon;
 samples:number;
 confidence:TwinConfidence;
 corrections:Partial<Record<ForecastParameter,number>>;
};

export type ProbabilityCalibrationBin={
 lower:number;
 upper:number;
 samples:number;
 forecastMean:number;
 observedFrequency:number;
 calibrated:number;
};

export type LocalWeightedForecast={
 date:string;
 horizon:ForecastHorizon;
 regime:WeatherRegime;
 prediction?:ForecastPrediction;
 equalWeighted?:ForecastPrediction;
 weights:ModelWeight[];
 ready:boolean;
 confidence:TwinConfidence;
 reason:string;
 explanations:string[];
};

export type TwinMainForecastStatus={
 eligible:boolean;
 confidence:TwinConfidence;
 readyDays:number;
 modelCount:number;
 validationDays:number;
 improvement?:number;
 dominantModel?:{id:string;label:string;weight:number};
 sourceLabel:string;
 reason:string;
};

export type TwinSiteProfile={
 locationKey:string;
 updatedAt:string;
 elevation:number;
 terrain:TwinTerrain;
 exposure:'sheltered'|'neutral'|'exposed';
 urbanClass:'urban'|'suburban'|'rural'|'unknown';
 coldPoolRisk:'low'|'medium'|'high';
 fogRisk:'low'|'medium'|'high';
 waterInfluence:boolean;
 manual:boolean;
 confidence:TwinConfidence;
 inferenceVersion:number;
 inferenceReasons:string[];
 localReliefM?:number;
 relativeElevationM?:number;
};

export type ActivityProfile={
 enabled:boolean;
 maxRainProbability:number;
 maxGustKt:number;
 minTemperature:number;
 maxTemperature:number;
 minimumWindowHours:number;
};

export type WeatherTwinSettings={
 enabled:boolean;
 useAsMainForecast:boolean;
 nowcastAssimilation:boolean;
 probabilityCalibration:boolean;
 biasCorrection:boolean;
 personalRecommendations:boolean;
 learnAllFavorites:boolean;
 privateSensorUrl:string;
 privateSensorLabel:string;
 activities:Record<TwinActivity,ActivityProfile>;
};

export type TwinRecommendation={
 id:string;
 activity:TwinActivity;
 title:string;
 assessment:'good'|'limited'|'poor';
 window?:string;
 confidence:TwinConfidence;
 reasons:string[];
 score:number;
};

export type TwinHealth={
 status:'ready'|'learning'|'limited';
 label:string;
 score:number;
 issues:string[];
 sources:string[];
};

export type ForecastVerificationReport={
 days:number;
 samples:number;
 models:ForecastModelScore[];
 segments:ForecastSegmentScore[];
 reviews:ForecastDayReview[];
 bestModel?:ForecastModelScore;
 rainBrier?:number;
 temperatureMae?:number;
 weightingReady:boolean;
 weightedScore?:number;
 equalWeightedScore?:number;
 bestMatchScore?:number;
 weightedImprovement?:number;
 weightedValidationDays:number;
 mainForecastStatus:TwinMainForecastStatus;
 currentForecasts:LocalWeightedForecast[];
 parameterLeaders:Partial<Record<ForecastParameter,ForecastModelScore>>;
 calibrations:ProbabilityCalibrationBin[];
 biases:BiasCorrection[];
 siteProfile:TwinSiteProfile;
 health:TwinHealth;
 archiveUpdatedAt:string;
};

export type LiveTwinContext={station?:Station|null;radar?:RadarNowcast|null;currentHour?:Hour|null};
export type PrivateSensorSample={timestamp?:string;temperature?:number;precipitation?:number;precipitationRate?:number;gust?:number;cloudCover?:number;label?:string;quality?:number;provider?:string};

type Evaluation={date:string;capture:ForecastCapture;reference:ForecastReference;horizon:ForecastHorizon;regime:WeatherRegime};
type ParamAccumulator={sum:number;count:number};
type RawStat={id:string;label:string;days:number;parameters:Record<ForecastParameter,ParamAccumulator>};
type FeedbackStore=Record<string,{helpful:number;notHelpful:number;lastAt?:string}>;

export const PRIVATE_SENSOR_INTEGRATION_ENABLED=false;
const DB_NAME='mid-weather-twin-archive';
const DB_STORE='locations';
const ARCHIVE_MEMORY=new Map<string,Store>();
const ARCHIVE_LOADED=new Set<string>();
const ARCHIVE_WRITES=new Map<string,Promise<void>>();

function finite(value:unknown,fallback=0){if(value===null||value===undefined||value==='')return fallback;const number=Number(value);return Number.isFinite(number)?number:fallback}
function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function confidenceFromSamples(samples:number):TwinConfidence{return samples>=18?'high':samples>=6?'medium':'low'}
function storeKey(locationKey:string){return`${PREFIX}${locationKey}`}
function profileKey(locationKey:string){return`${PROFILE_PREFIX}${locationKey}`}
function feedbackKey(locationKey:string){return`${FEEDBACK_PREFIX}${locationKey}`}
function emptyStore():Store{return{version:3,updatedAt:new Date().toISOString(),captures:[],references:[],observations:[]}}
function dateTimeParts(epoch:number,timeZone?:string){try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timeZone||undefined,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch)),value=(type:string)=>Number(parts.find(part=>part.type===type)?.value);return{year:value('year'),month:value('month'),day:value('day'),hour:value('hour'),minute:value('minute'),second:value('second')}}catch{return null}}
function localDateTimeEpoch(date:string,timeZone?:string,hour=12,minute=0){const match=date.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return NaN;const wall=Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),hour,minute),zone=String(timeZone||'').trim();if(!zone)return wall;let epoch=wall;for(let iteration=0;iteration<3;iteration++){const actual=dateTimeParts(epoch,zone);if(!actual)break;const rendered=Date.UTC(actual.year,actual.month-1,actual.day,actual.hour,actual.minute,actual.second),delta=wall-rendered;if(Math.abs(delta)<500)break;epoch+=delta}return epoch}
function dateNoon(date:string,timeZone?:string){return localDateTimeEpoch(date,timeZone,12,0)}
function dateAtEpoch(epoch:number,timeZone?:string){const parts=dateTimeParts(epoch,timeZone);return parts?`${parts.year}-${String(parts.month).padStart(2,'0')}-${String(parts.day).padStart(2,'0')}`:new Date(epoch).toISOString().slice(0,10)}
export function stationDistanceKm(distance:unknown){if(distance===null||distance===undefined||distance==='')return NaN;const metres=Number(distance);return Number.isFinite(metres)&&metres>=0?metres/1000:NaN}
function normalizedTrustFactor(value:unknown,fallback:number){if(value===null||value===undefined||value==='')return fallback;const trust=Number(value);if(!Number.isFinite(trust))return fallback;return clamp(trust>1?trust/100:trust,0,1)}
function horizonBucket(leadHours:number):ForecastHorizon{return leadHours<=18?12:leadHours<=36?24:leadHours<=60?48:72}
function predictionValid(row:ForecastPrediction){return Boolean(row.id&&row.label&&[row.max,row.min,row.precipitation,row.probability].every(Number.isFinite))}
function uniqueSources(values:ObservationSource[]){const map=new Map<string,ObservationSource>();for(const source of values){const current=map.get(source.id);if(!current||source.quality>current.quality)map.set(source.id,source)}return[...map.values()]}

function defaultActivities():Record<TwinActivity,ActivityProfile>{return{
 commute:{enabled:true,maxRainProbability:70,maxGustKt:40,minTemperature:-15,maxTemperature:40,minimumWindowHours:1},
 outdoor:{enabled:true,maxRainProbability:40,maxGustKt:28,minTemperature:-5,maxTemperature:32,minimumWindowHours:2},
 garden:{enabled:false,maxRainProbability:25,maxGustKt:25,minTemperature:2,maxTemperature:30,minimumWindowHours:2},
 rowing:{enabled:false,maxRainProbability:35,maxGustKt:18,minTemperature:2,maxTemperature:30,minimumWindowHours:1},
 dog:{enabled:false,maxRainProbability:45,maxGustKt:30,minTemperature:-5,maxTemperature:28,minimumWindowHours:1},
 ski:{enabled:false,maxRainProbability:65,maxGustKt:30,minTemperature:-20,maxTemperature:8,minimumWindowHours:2},
 heat:{enabled:false,maxRainProbability:100,maxGustKt:100,minTemperature:-50,maxTemperature:26,minimumWindowHours:3}
}}

function mergedActivities(value:Partial<Record<TwinActivity,Partial<ActivityProfile>>>|undefined){const defaults=defaultActivities(),result={...defaults};for(const activity of Object.keys(defaults) as TwinActivity[])result[activity]={...defaults[activity],...(value?.[activity]??{})};return result}
export function readWeatherTwinSettings():WeatherTwinSettings{try{const parsed=JSON.parse(localStorage.getItem(WEATHER_TWIN_SETTINGS_KEY)||'{}') as Partial<WeatherTwinSettings>;return{enabled:parsed.enabled!==false,useAsMainForecast:Boolean(parsed.useAsMainForecast),nowcastAssimilation:parsed.nowcastAssimilation!==false,probabilityCalibration:parsed.probabilityCalibration!==false,biasCorrection:parsed.biasCorrection!==false,personalRecommendations:parsed.personalRecommendations!==false,learnAllFavorites:parsed.learnAllFavorites!==false,privateSensorUrl:PRIVATE_SENSOR_INTEGRATION_ENABLED?String(parsed.privateSensorUrl||''):'',privateSensorLabel:String(parsed.privateSensorLabel||'Privater Sensor'),activities:mergedActivities(parsed.activities)}}catch{return{enabled:true,useAsMainForecast:false,nowcastAssimilation:true,probabilityCalibration:true,biasCorrection:true,personalRecommendations:true,learnAllFavorites:true,privateSensorUrl:'',privateSensorLabel:'Privater Sensor',activities:defaultActivities()}}}
export function writeWeatherTwinSettings(change:Partial<WeatherTwinSettings>){const current=readWeatherTwinSettings(),next={...current,...change,activities:mergedActivities({...current.activities,...(change.activities??{})})};localStorage.setItem(WEATHER_TWIN_SETTINGS_KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent('mid:weather-twin-settings',{detail:next}));return next}

function locationDescriptor(location:Location){return[location.name,location.admin1,location.admin2,location.country,location.poiType,location.poiCategory,location.featureCode].filter(Boolean).join(' ').toLocaleLowerCase('de-DE')}
function inferredUrbanClass(location:Location):TwinSiteProfile['urbanClass']{if(location.urbanClass&&location.urbanClass!=='unknown')return location.urbanClass;const population=Number(location.population),code=String(location.featureCode||'').toUpperCase();if(Number.isFinite(population)&&population>=100000)return'urban';if(Number.isFinite(population)&&population>=12000)return'suburban';if(['PPLC','PPLA','PPLA2','PPLA3','PPLA4'].includes(code))return'urban';if(['PPLX','PPLL'].includes(code))return'suburban';if(['PPL','PPLQ','PPLR'].includes(code))return'rural';return'unknown'}
function metadataTerrain(location:Location){const elevation=finite(location.elevation,0),descriptor=locationDescriptor(location),feature=String(location.featureCode||'').toUpperCase(),water=/coast|beach|sea|küste|strand|hafen|harbou?r|marina|meer|lake|lago|see\b|insel|island|water|bay|bucht/.test(descriptor)||['BAY','COVE','LK','SEA','CSTL','ISL'].includes(feature),ridge=/peak|gipfel|ridge|kamm|summit|mount|monte|berg\b/.test(descriptor)||['MT','MTS','PK','RDGE'].includes(feature),valley=/valley|vall[eé]e|\btal\b|\bval\b|senke/.test(descriptor)||['VAL','VLY'].includes(feature),terrain:TwinTerrain=water?'coast':ridge||elevation>=1800?'ridge':valley?'valley':elevation>=450?'slope':'plain',reasons:string[]=[];if(water)reasons.push('Orts-/POI-Metadaten weisen auf Küsten- oder Gewässernähe hin.');if(ridge)reasons.push('Orts-/POI-Metadaten weisen auf Gipfel-, Kamm- oder Berglage hin.');if(valley)reasons.push('Orts-/POI-Metadaten weisen auf Tal- oder Senkenlage hin.');if(!reasons.length&&Number.isFinite(location.elevation))reasons.push(`Ausgangshöhe ${Math.round(Number(location.elevation))} m ü. NHN.`);return{terrain,water,reasons}}
function pointAtDistance(lat:number,lon:number,bearingDeg:number,distanceKm:number){const radius=6371,bearing=bearingDeg*Math.PI/180,delta=distanceKm/radius,lat1=lat*Math.PI/180,lon1=lon*Math.PI/180,lat2=Math.asin(Math.sin(lat1)*Math.cos(delta)+Math.cos(lat1)*Math.sin(delta)*Math.cos(bearing)),lon2=lon1+Math.atan2(Math.sin(bearing)*Math.sin(delta)*Math.cos(lat1),Math.cos(delta)-Math.sin(lat1)*Math.sin(lat2));return{lat:lat2*180/Math.PI,lon:((lon2*180/Math.PI+540)%360)-180}}
function percentile(values:number[],fraction:number){const sorted=[...values].sort((a,b)=>a-b);if(!sorted.length)return NaN;const position=(sorted.length-1)*fraction,index=Math.floor(position),rest=position-index;return sorted[index]+((sorted[index+1]??sorted[index])-sorted[index])*rest}
function basicTwinSiteProfile(locationKey:string,location:Location):TwinSiteProfile{const metadata=metadataTerrain(location),terrain=metadata.terrain,urbanClass=inferredUrbanClass(location),elevation=finite(location.elevation,0);return{locationKey,updatedAt:new Date().toISOString(),elevation,terrain,exposure:terrain==='ridge'||terrain==='coast'?'exposed':terrain==='valley'?'sheltered':'neutral',urbanClass,coldPoolRisk:terrain==='valley'?'high':terrain==='plain'&&urbanClass!=='urban'?'medium':'low',fogRisk:terrain==='valley'||terrain==='coast'?'high':terrain==='plain'&&urbanClass!=='urban'?'medium':'low',waterInfluence:metadata.water,manual:false,confidence:Number.isFinite(location.elevation)?'medium':'low',inferenceVersion:1,inferenceReasons:metadata.reasons}}
export function defaultTwinSiteProfile(locationKey:string,location:Location):TwinSiteProfile{return basicTwinSiteProfile(locationKey,location)}
export async function deriveTwinSiteProfile(locationKey:string,location:Location,signal?:AbortSignal):Promise<TwinSiteProfile>{const base=basicTwinSiteProfile(locationKey,location),bearings=[0,45,90,135,180,225,270,315],points=[{lat:location.latitude,lon:location.longitude},...bearings.map(bearing=>pointAtDistance(location.latitude,location.longitude,bearing,1.5)),...bearings.map(bearing=>pointAtDistance(location.latitude,location.longitude,bearing,5))],url=new URL('https://api.open-meteo.com/v1/elevation');url.searchParams.set('latitude',points.map(point=>point.lat.toFixed(5)).join(','));url.searchParams.set('longitude',points.map(point=>point.lon.toFixed(5)).join(','));let elevations:number[]=[];try{const response=await fetch(url.toString(),{signal,cache:'no-store'});if(response.ok){const data=await response.json() as {elevation?:number[]};elevations=(data.elevation??[]).map(value=>value===null||value===undefined?NaN:Number(value))}}catch(error){if(signal?.aborted)throw error}const validElevations=elevations.filter(Number.isFinite);if(validElevations.length<9)return{...base,inferenceVersion:PROFILE_INFERENCE_VERSION,inferenceReasons:[...base.inferenceReasons,'DEM-Umfeldprofil derzeit nicht verfügbar; Metadatenableitung bleibt aktiv.']};const center=Number.isFinite(elevations[0])?elevations[0]:base.elevation,ring=elevations.slice(1).filter(Number.isFinite),outer=elevations.slice(9).filter(Number.isFinite),mean=ring.reduce((sum,value)=>sum+value,0)/ring.length,relief=Math.max(...validElevations)-Math.min(...validElevations),relative=center-mean,lower=ring.filter(value=>value<=center-20).length,higher=ring.filter(value=>value>=center+20).length,nearSea=ring.filter(value=>value<=2).length,metadata=metadataTerrain(location);let terrain:TwinTerrain=metadata.terrain;if(!metadata.water){if(relative<=-28&&higher>=5&&relief>=55)terrain='valley';else if(relative>=32&&lower>=5&&relief>=65)terrain='ridge';else if(relief>=65||Math.abs(relative)>=18||center>=450)terrain='slope';else terrain='plain'}if(metadata.water||center<=25&&nearSea>=2&&percentile(outer.length?outer:ring,.25)<=3)terrain='coast';const waterInfluence=metadata.water||terrain==='coast',exposure:TwinSiteProfile['exposure']=terrain==='ridge'||terrain==='coast'?'exposed':terrain==='valley'?'sheltered':terrain==='slope'&&relief>=180?'exposed':'neutral',urbanClass=inferredUrbanClass(location),coldPoolRisk:TwinSiteProfile['coldPoolRisk']=terrain==='valley'?'high':terrain==='plain'&&center<450&&urbanClass!=='urban'?'medium':terrain==='slope'&&exposure==='sheltered'?'medium':'low',fogRisk:TwinSiteProfile['fogRisk']=terrain==='valley'||waterInfluence?'high':terrain==='plain'&&center<350&&urbanClass!=='urban'?'medium':exposure==='exposed'?'low':base.fogRisk,reasons=[...metadata.reasons,`DEM-Relief im 10-km-Umfeld: ${Math.round(relief)} m.`,`Standort liegt ${Math.abs(Math.round(relative))} m ${relative>=0?'über':'unter'} dem Umfeldmittel.`];if(terrain==='valley')reasons.push('Mehrere Umgebungspunkte liegen deutlich höher: Tal-/Kaltluftsenkenlage wahrscheinlich.');if(terrain==='ridge')reasons.push('Mehrere Umgebungspunkte liegen deutlich tiefer: Kuppen-/Kammlage wahrscheinlich.');if(terrain==='slope')reasons.push('Deutliches Relief ohne eindeutige Tal- oder Kuppenlage: Hanglage wahrscheinlich.');if(terrain==='plain')reasons.push('Geringes lokales Relief: überwiegend ebene Lage wahrscheinlich.');if(waterInfluence&&!metadata.water)reasons.push('Niedrige DEM-Werte im Umfeld sprechen für Gewässer- oder Küsteneinfluss.');return{locationKey,updatedAt:new Date().toISOString(),elevation:center,terrain,exposure,urbanClass,coldPoolRisk,fogRisk,waterInfluence,manual:false,confidence:'high',inferenceVersion:PROFILE_INFERENCE_VERSION,inferenceReasons:[...new Set(reasons)].slice(0,6),localReliefM:relief,relativeElevationM:relative}}
function storeTwinSiteProfile(profile:TwinSiteProfile){localStorage.setItem(profileKey(profile.locationKey),JSON.stringify(profile));window.dispatchEvent(new CustomEvent('mid:weather-twin-profile',{detail:profile}));return profile}
export function readTwinSiteProfile(locationKey:string,location:Location):TwinSiteProfile{try{const parsed=JSON.parse(localStorage.getItem(profileKey(locationKey))||'null') as Partial<TwinSiteProfile>|null;if(parsed)return{...defaultTwinSiteProfile(locationKey,location),...parsed,locationKey,inferenceReasons:Array.isArray(parsed.inferenceReasons)?parsed.inferenceReasons:[],inferenceVersion:Number(parsed.inferenceVersion)||1};const initial=defaultTwinSiteProfile(locationKey,location);localStorage.setItem(profileKey(locationKey),JSON.stringify(initial));return initial}catch{return defaultTwinSiteProfile(locationKey,location)}}
export async function refreshTwinSiteProfileInference(locationKey:string,location:Location,signal?:AbortSignal,force=false){const current=readTwinSiteProfile(locationKey,location);if(current.manual&&!force)return current;if(!force&&current.inferenceVersion>=PROFILE_INFERENCE_VERSION&&current.confidence==='high')return current;const derived=await deriveTwinSiteProfile(locationKey,location,signal);return storeTwinSiteProfile(derived)}
export function updateTwinSiteProfile(locationKey:string,location:Location,change:Partial<TwinSiteProfile>){const next={...readTwinSiteProfile(locationKey,location),...change,locationKey,updatedAt:new Date().toISOString(),manual:true} satisfies TwinSiteProfile;return storeTwinSiteProfile(next)}

type RegimeDurationContext={wetHours?:number;longestWetHours?:number;convectiveHours?:number};
function dayRegimeDuration(hours:Hour[],date:string):RegimeDurationContext{const relevant=hours.filter(hour=>hour.time.startsWith(date)).sort((a,b)=>a.epoch-b.epoch);let wetHours=0,longestWetHours=0,currentWet=0,convectiveHours=0;for(const hour of relevant){const code=Math.round(finite(hour.code,-1)),wet=Math.max(0,finite(hour.precipitation))>=.1||([51,53,55,61,63,65,80,81,82].includes(code)&&finite(hour.probability,0)>=35);if(wet){wetHours++;currentWet++;longestWetHours=Math.max(longestWetHours,currentWet)}else currentWet=0;if([80,81,82,95,96,97,99].includes(code))convectiveHours++}return{wetHours,longestWetHours,convectiveHours}}
function inferRegime(value:{weatherCode?:number;precipitation:number;gust?:number;sunshineDuration?:number;min?:number;max?:number;wind?:number},profile?:TwinSiteProfile,duration:RegimeDurationContext={}):WeatherRegime{const code=Math.round(finite(value.weatherCode,-1)),precipitation=Math.max(0,finite(value.precipitation)),gust=finite(value.gust,0),sunshine=finite(value.sunshineDuration,NaN),minimum=finite(value.min,10),maximum=finite(value.max,minimum),wind=finite(value.wind,0),longestWet=Math.max(0,finite(duration.longestWetHours,0)),convectiveHours=Math.max(0,finite(duration.convectiveHours,0)),sustainedRain=(longestWet>=6&&precipitation>=8&&convectiveHours<=1)||(precipitation>=25&&[61,63,65].includes(code));if([95,96,97,99].includes(code))return'gewitter';if(gust>=34)return'sturm';if([71,73,75,77,85,86].includes(code)||(minimum<=1&&precipitation>=.2))return'winterlich';if(sustainedRain)return'dauerregen';if([80,81,82].includes(code))return'konvektiv';if([51,53,55,61,63,65].includes(code)||precipitation>=.5)return wind>=12?'front':'schauer';if(profile?.terrain==='valley'&&minimum<=5&&maximum-minimum>=10&&precipitation<.1)return'inversion';if(profile&&['slope','valley'].includes(profile.terrain)&&gust>=22&&precipitation<.2&&maximum-minimum>=9)return'foehn';if((Number.isFinite(sunshine)&&sunshine>=7*3600&&precipitation<.2)||[0,1].includes(code)&&precipitation<.2)return'hochdruck';return'wechselhaft'}
export function weatherRegimeLabel(regime:WeatherRegime){return({hochdruck:'Hochdruck / sonnig',wechselhaft:'wechselhaft',front:'Frontdurchgang',konvektiv:'konvektive Schauerlage',schauer:'Schauerlage',dauerregen:'Dauerregenlage',gewitter:'Gewitterlage',sturm:'Sturmlage',winterlich:'winterliche Lage',inversion:'Inversionslage',foehn:'Föhn-/Staulage'} as Record<WeatherRegime,string>)[regime]}

function migrateObservationSource(value:any):ObservationSource{const label=String(value?.label||value?.id||'Quelle'),rawDistance=finite(value?.distanceKm,NaN),distanceKm=Number.isFinite(rawDistance)?(rawDistance>500?rawDistance/1000:rawDistance):undefined,rawKind=String(value?.kind||'model-fallback') as ObservationKind,analysed=/hyperlokal|stationsmittel|analyse/i.test(`${label} ${value?.detail||''}`),kind:ObservationKind=rawKind==='measured'&&analysed?'analysed':rawKind,rawQuality=finite(value?.quality,.3),quality=clamp(rawQuality>1?rawQuality/100:rawQuality,0,1);return{id:String(value?.id||kind),label,kind,quality,timestamp:value?.timestamp?String(value.timestamp):undefined,distanceKm,detail:value?.detail?String(value.detail):undefined}}
function migrateReference(reference:any):ForecastReference{const source=String(reference.source||'Rückblick'),era5=source.includes('ERA5'),kind=(reference.kind??(era5?'reanalysis':'model-fallback')) as ObservationKind,row={...reference,max:finite(reference.max,NaN),min:finite(reference.min,NaN),precipitation:Math.max(0,finite(reference.precipitation,NaN)),source,quality:clamp(finite(reference.quality,era5?.72:.32),0,1),kind,sources:Array.isArray(reference.sources)?reference.sources.map(migrateObservationSource):[]} as ForecastReference;row.regime=inferRegime(row);row.confidence=reference.confidence??(row.quality>=.8?'high':row.quality>=.55?'medium':'low');if(!row.sources.length)row.sources=[{id:row.kind,label:row.source,kind:row.kind,quality:row.quality}];return row}
function migrateStore(value:any):Store{const source=value&&Array.isArray(value.captures)&&Array.isArray(value.references)?value:emptyStore();return{version:3,updatedAt:String(source.updatedAt||new Date().toISOString()),captures:source.captures.map((capture:any,index:number)=>({...capture,id:String(capture.id||`${capture.targetDate}:${capture.issuedAt}:${index}`),predictions:Array.isArray(capture.predictions)?capture.predictions:[]})).filter((capture:ForecastCapture)=>capture.targetDate&&capture.issuedAt),references:source.references.map(migrateReference).filter((row:ForecastReference)=>row.date&&[row.max,row.min,row.precipitation].every(Number.isFinite)),observations:Array.isArray(source.observations)?source.observations.filter((row:TwinLiveObservation)=>row?.timestamp&&row?.date&&row?.source).map((row:TwinLiveObservation)=>({...row,source:migrateObservationSource(row.source)})):[]}}

function mergeStores(primary:Store,secondary:Store):Store{const captures=new Map<string,ForecastCapture>(),references=new Map<string,ForecastReference>(),observations=new Map<string,TwinLiveObservation>();for(const row of[...secondary.captures,...primary.captures])captures.set(row.id,row);for(const row of[...secondary.references,...primary.references]){const current=references.get(row.date);if(!current||row.quality>=current.quality)references.set(row.date,row)}for(const row of[...secondary.observations,...primary.observations])observations.set(row.id,row);return{version:3,updatedAt:[primary.updatedAt,secondary.updatedAt].sort().at(-1)??new Date().toISOString(),captures:[...captures.values()].sort((a,b)=>Date.parse(a.issuedAt)-Date.parse(b.issuedAt)).slice(-ARCHIVE_MAX_CAPTURES),references:[...references.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-ARCHIVE_MAX_REFERENCES),observations:[...observations.values()].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)).slice(-ARCHIVE_MAX_OBSERVATIONS)}}
function readStore(locationKey:string):Store{const memory=ARCHIVE_MEMORY.get(locationKey);if(memory)return memory;try{const current=localStorage.getItem(storeKey(locationKey));let raw=current;for(const prefix of LEGACY_PREFIXES)if(!raw)raw=localStorage.getItem(`${prefix}${locationKey}`);const store=migrateStore(JSON.parse(raw||'null'));ARCHIVE_MEMORY.set(locationKey,store);if(!current&&raw)saveStore(locationKey,store);return store}catch{const store=emptyStore();ARCHIVE_MEMORY.set(locationKey,store);return store}}
function openArchiveDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB nicht verfügbar'));return}const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DB_STORE))request.result.createObjectStore(DB_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function readAllArchiveDbEntries(){const result=new Map<string,Store>();try{const db=await openArchiveDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),request=tx.objectStore(DB_STORE).openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve();return}result.set(String(cursor.key),migrateStore(cursor.value));cursor.continue()};request.onerror=()=>reject(request.error);tx.onerror=()=>reject(tx.error)});db.close()}catch{}return result}
async function mirrorStore(locationKey:string,store:Store){try{const db=await openArchiveDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(store,locationKey);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close();return true}catch{return false}}
function queueMirrorStore(locationKey:string,store:Store){const previous=ARCHIVE_WRITES.get(locationKey)??Promise.resolve(),next=previous.catch(()=>undefined).then(async()=>{await mirrorStore(locationKey,store)});ARCHIVE_WRITES.set(locationKey,next);void next.finally(()=>{if(ARCHIVE_WRITES.get(locationKey)===next)ARCHIVE_WRITES.delete(locationKey)})}
function localCompactStore(store:Store):Store{return{...store,captures:store.captures.slice(-MAX_CAPTURES),references:store.references.slice(-MAX_REFERENCES),observations:store.observations.slice(-MAX_OBSERVATIONS)}}
/** Mirrors older/full local weather-twin stores to IndexedDB first, then shrinks only the redundant localStorage fast-start copy. */
export async function compactForecastVerificationLocalStorage(){if(typeof localStorage==='undefined')return 0;const candidates:{storageKey:string;locationKey:string;store:Store;legacy:boolean}[]=[];try{for(let index=localStorage.length-1;index>=0;index--){const key=localStorage.key(index);if(!key)continue;const prefix=[PREFIX,...LEGACY_PREFIXES].find(value=>key.startsWith(value));if(!prefix||key.length<=prefix.length)continue;const raw=localStorage.getItem(key);if(!raw)continue;try{const store=migrateStore(JSON.parse(raw)),oversized=store.captures.length>MAX_CAPTURES||store.references.length>MAX_REFERENCES||store.observations.length>MAX_OBSERVATIONS||prefix!==PREFIX;if(oversized)candidates.push({storageKey:key,locationKey:key.slice(prefix.length),store,legacy:prefix!==PREFIX})}catch{}}}catch{return 0}let changed=0;for(const candidate of candidates){const mirrored=await mirrorStore(candidate.locationKey,candidate.store);if(!mirrored)continue;const target=storeKey(candidate.locationKey),compact=localCompactStore(candidate.store);try{localStorage.setItem(target,JSON.stringify(compact));if(candidate.legacy&&candidate.storageKey!==target)localStorage.removeItem(candidate.storageKey);changed++}catch{}}return changed}
export async function restoreForecastVerificationArchive(locationKey:string){if(ARCHIVE_LOADED.has(locationKey))return false;try{const local=readStore(locationKey),db=await openArchiveDb(),archived=await new Promise<Store|null>((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),request=tx.objectStore(DB_STORE).get(locationKey);request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error)});db.close();ARCHIVE_LOADED.add(locationKey);if(!archived)return false;const merged=mergeStores(local,migrateStore(archived)),changed=merged.captures.length>local.captures.length||merged.references.length>local.references.length||merged.observations.length>local.observations.length;ARCHIVE_MEMORY.set(locationKey,merged);saveStore(locationKey,merged);return changed}catch{ARCHIVE_LOADED.delete(locationKey);return false}}
function saveStore(locationKey:string,store:Store){const full=mergeStores(store,ARCHIVE_MEMORY.get(locationKey)??emptyStore()),updated={...full,updatedAt:new Date().toISOString()};ARCHIVE_MEMORY.set(locationKey,updated);const compact=localCompactStore(updated);try{localStorage.setItem(storeKey(locationKey),JSON.stringify(compact))}catch{}queueMirrorStore(locationKey,updated);try{window.dispatchEvent(new CustomEvent('mid:weather-twin-archive-changed',{detail:{locationKey,updatedAt:updated.updatedAt}}))}catch{}}

function archiveStorageLocationKeys(){const keys=new Set<string>();try{for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(!key)continue;for(const prefix of[PREFIX,...LEGACY_PREFIXES])if(key.startsWith(prefix)&&key.length>prefix.length)keys.add(key.slice(prefix.length))}}catch{}for(const key of ARCHIVE_MEMORY.keys())keys.add(key);return keys}
function archiveStats(locations:Record<string,Store>,updatedAt?:string):ForecastVerificationArchiveStats{const values=Object.values(locations),maxUpdated=values.map(store=>Date.parse(store.updatedAt)).filter(Number.isFinite).sort((a,b)=>b-a)[0];return{locations:values.length,captures:values.reduce((sum,store)=>sum+store.captures.length,0),references:values.reduce((sum,store)=>sum+store.references.length,0),observations:values.reduce((sum,store)=>sum+store.observations.length,0),updatedAt:updatedAt||new Date(maxUpdated||Date.now()).toISOString()}}
export async function waitForForecastVerificationArchiveWrites(){const pending=[...ARCHIVE_WRITES.values()];if(pending.length)await Promise.allSettled(pending)}
export async function exportForecastVerificationArchive():Promise<ForecastVerificationArchiveBundle>{await waitForForecastVerificationArchiveWrites();const dbEntries=await readAllArchiveDbEntries(),keys=archiveStorageLocationKeys();for(const key of dbEntries.keys())keys.add(key);const locations:Record<string,Store>={};for(const key of keys){let merged=dbEntries.get(key)??emptyStore();const local=readStore(key);merged=mergeStores(local,merged);locations[key]=merged}const stats=archiveStats(locations);return{schema:'mid-weather-twin-archive',version:1,exportedAt:new Date().toISOString(),updatedAt:stats.updatedAt,locations,counts:{locations:stats.locations,captures:stats.captures,references:stats.references,observations:stats.observations}}}
export async function importForecastVerificationArchive(bundle:ForecastVerificationArchiveBundle):Promise<ForecastVerificationArchiveStats>{if(!bundle||bundle.schema!=='mid-weather-twin-archive'||bundle.version!==1||!bundle.locations||typeof bundle.locations!=='object')throw new Error('Das Wetterzwilling-Langzeitarchiv besitzt ein ungültiges Format.');const entries=Object.entries(bundle.locations).slice(0,1000),mergedLocations:Record<string,Store>={};for(const[rawKey,rawStore]of entries){const locationKey=String(rawKey||'').trim();if(!locationKey||locationKey.length>240)continue;const merged=mergeStores(readStore(locationKey),migrateStore(rawStore));ARCHIVE_MEMORY.set(locationKey,merged);ARCHIVE_LOADED.add(locationKey);saveStore(locationKey,merged);mergedLocations[locationKey]=merged}await waitForForecastVerificationArchiveWrites();return archiveStats(mergedLocations,bundle.updatedAt)}

function stationQuality(station:Station){const base=station.networkClass==='official'?.94:station.networkClass==='professional'?.82:station.networkClass==='pws'?.62:station.networkClass==='citizen'?.5:.68,trust=normalizedTrustFactor(station.trustFactor,base),distanceKm=stationDistanceKm(station.distance),distancePenalty=Number.isFinite(distanceKm)?Math.min(.22,distanceKm/130):0,analysisPenalty=(station.analysisMethod||station.blended)?0.06:0;return clamp((trust+base)/2-distancePenalty-analysisPenalty,0.3,.97)}
function upsertObservation(store:Store,row:TwinLiveObservation){const index=store.observations.findIndex(item=>item.id===row.id);if(index>=0)store.observations[index]=row;else store.observations.push(row)}
function observationHasData(row:TwinLiveObservation){return[row.temperature,row.precipitationRate,row.precipitationIncrement,row.gust,row.cloudCover].some(Number.isFinite)}
export function recordLiveTwinObservation(locationKey:string,location:Location,context:LiveTwinContext){const settings=readWeatherTwinSettings();if(!settings.enabled||!locationKey)return;const store=readStore(locationKey),station=context.station,current=context.currentHour,radar=context.radar,modelTime=Number.isFinite(current?.epoch)?Number(current!.epoch):Date.now(),modelDate=current?.time?.slice(0,10)||dateAtEpoch(modelTime,location.timezone);
 if(station){const stamp=Date.parse(station.timestamp||'')||modelTime,slot=Math.floor(stamp/(15*60000)),analysed=Boolean(station.analysisMethod||station.blended),kind:ObservationKind=analysed?'analysed':'measured',source:ObservationSource={id:`station:${station.stationId||station.name}`,label:`${station.provider||'Messnetz'} · ${station.name}`,kind,quality:stationQuality(station),timestamp:new Date(stamp).toISOString(),distanceKm:stationDistanceKm(station.distance),detail:station.analysisMethod},row:TwinLiveObservation={id:`${slot}:${source.id}`,timestamp:new Date(stamp).toISOString(),date:dateAtEpoch(stamp,location.timezone),temperature:stationFieldObservationUsable(station,'temperature',Date.now(),location.elevation)?Number(station.temperature):undefined,precipitationIncrement:stationFieldObservationUsable(station,'precipitation',Date.now(),location.elevation)?Math.max(0,Number(station.precipitation)):undefined,gust:stationFieldObservationUsable(station,'windGust',Date.now(),location.elevation)?Math.max(0,Number(station.windGust)):undefined,cloudCover:stationFieldObservationUsable(station,'cloudCover',Date.now(),location.elevation)?clamp(Number(station.cloudCover),0,100):undefined,source};if(observationHasData(row))upsertObservation(store,row)}
 if(settings.nowcastAssimilation&&radar&&radar.source!=='model'&&radar.coverage!==false){const stamp=Date.parse(radar.observedAt||'')||Date.now(),slot=Math.floor(stamp/(15*60000)),source:ObservationSource={id:`radar:${radar.source}`,label:radar.provider,kind:'analysed',quality:radar.quality==='high'?.9:radar.quality==='medium'?.74:.55,timestamp:new Date(stamp).toISOString(),detail:radar.summary},row:TwinLiveObservation={id:`${slot}:${source.id}`,timestamp:new Date(stamp).toISOString(),date:dateAtEpoch(stamp,location.timezone),precipitationRate:Number.isFinite(radar.currentRate)?Math.max(0,Number(radar.currentRate)):undefined,source};if(observationHasData(row))upsertObservation(store,row)}
 if(current){const slot=Math.floor(modelTime/(15*60000)),source:ObservationSource={id:'best-match-live',label:'Best Match Livewert',kind:'model-fallback',quality:.28,timestamp:new Date(modelTime).toISOString()},row:TwinLiveObservation={id:`${slot}:${source.id}`,timestamp:new Date(modelTime).toISOString(),date:modelDate,temperature:Number.isFinite(current.temperature)?Number(current.temperature):undefined,gust:Number.isFinite(current.gust)?Math.max(0,Number(current.gust)):undefined,cloudCover:Number.isFinite(current.cloud)?clamp(Number(current.cloud),0,100):undefined,source};if(observationHasData(row))upsertObservation(store,row)}
 saveStore(locationKey,store)}
export function recordCustomSensorObservation(locationKey:string,sample:PrivateSensorSample,timeZone?:string){if(!PRIVATE_SENSOR_INTEGRATION_ENABLED||!readWeatherTwinSettings().enabled||!locationKey)return false;const rawTimestamp=sample.timestamp??new Date().toISOString(),numeric=typeof rawTimestamp==='number'?rawTimestamp:Number.NaN,time=Number.isFinite(numeric)?(Math.abs(numeric)<1e12?numeric*1000:numeric):Date.parse(String(rawTimestamp));if(!Number.isFinite(time))return false;const store=readStore(locationKey),slot=Math.floor(time/(10*60000)),source:ObservationSource={id:`private-sensor:${String(sample.provider||'connected').replace(/[^a-z0-9_-]/gi,'').slice(0,32)}`,label:sample.label||readWeatherTwinSettings().privateSensorLabel||'Privater Sensor',kind:'private-sensor',quality:clamp(Number.isFinite(sample.quality)?Number(sample.quality):.88,.35,1),timestamp:new Date(time).toISOString(),detail:sample.provider?`Automatisch über ${sample.provider} übernommen`:undefined},row:TwinLiveObservation={id:`private:${slot}`,timestamp:new Date(time).toISOString(),date:dateAtEpoch(time,timeZone||store.captures.at(-1)?.timezone),temperature:Number.isFinite(sample.temperature)?Number(sample.temperature):undefined,precipitationIncrement:Number.isFinite(sample.precipitation)?Math.max(0,Number(sample.precipitation)):undefined,precipitationRate:Number.isFinite(sample.precipitationRate)?Math.max(0,Number(sample.precipitationRate)):undefined,gust:Number.isFinite(sample.gust)?Math.max(0,Number(sample.gust)):undefined,cloudCover:Number.isFinite(sample.cloudCover)?clamp(Number(sample.cloudCover),0,100):undefined,source};if(!observationHasData(row))return false;upsertObservation(store,row);saveStore(locationKey,store);return true}
export async function fetchPrivateSensorObservation(locationKey:string,signal?:AbortSignal,timeZone?:string){if(!PRIVATE_SENSOR_INTEGRATION_ENABLED)return false;const settings=readWeatherTwinSettings(),url=settings.privateSensorUrl.trim();if(!url)return false;const response=await fetch(url,{signal,cache:'no-store',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Privater Sensor HTTP ${response.status}`);const data=await response.json() as Record<string,unknown>;return recordCustomSensorObservation(locationKey,{timestamp:String(data.timestamp||data.time||new Date().toISOString()),temperature:finite(data.temperature,NaN),precipitation:finite(data.precipitation,NaN),precipitationRate:finite(data.precipitationRate??data.rainRate,NaN),gust:finite(data.gust??data.windGust,NaN),cloudCover:finite(data.cloudCover,NaN),label:settings.privateSensorLabel},timeZone)}

function observationPriority(kind:ObservationKind){return kind==='private-sensor'||kind==='measured'?4:kind==='analysed'?3:kind==='reanalysis'?2:1}
function observationCoverageHours(rows:TwinLiveObservation[]){if(rows.length<2)return 0;const ordered=[...rows].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)),start=Date.parse(ordered[0].timestamp),end=Date.parse(ordered.at(-1)!.timestamp);return Number.isFinite(start)&&Number.isFinite(end)?Math.max(0,(end-start)/3600000):0}
function precipitationTotal(rows:TwinLiveObservation[]){const ordered=[...rows].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)),intervals=ordered.slice(1).map((row,index)=>(Date.parse(row.timestamp)-Date.parse(ordered[index].timestamp))/3600000).filter(value=>Number.isFinite(value)&&value>0&&value<=.5).sort((a,b)=>a-b),defaultDuration=intervals.length?intervals[Math.floor(intervals.length/2)]:1/12;let total=0,samples=0;for(let index=0;index<ordered.length;index++){const row=ordered[index],next=ordered[index+1],duration=next?clamp((Date.parse(next.timestamp)-Date.parse(row.timestamp))/3600000,1/60,.5):defaultDuration;if(Number.isFinite(row.precipitationIncrement)){total+=Math.max(0,Number(row.precipitationIncrement));samples++}else if(Number.isFinite(row.precipitationRate)){total+=Math.max(0,Number(row.precipitationRate))*duration;samples++}}return{total,samples,coverageHours:observationCoverageHours(ordered)}}
function aggregateLiveReferences(store:Store){
 const today=dateAtEpoch(Date.now(),store.captures.at(-1)?.timezone),groups=new Map<string,TwinLiveObservation[]>();
 for(const row of store.observations){if(row.date>=today)continue;const list=groups.get(row.date)??[];list.push(row);groups.set(row.date,list)}
 const references:ForecastReference[]=[];
 for(const[date,rows]of groups){
  const bySource=new Map<string,TwinLiveObservation[]>();for(const row of rows){const list=bySource.get(row.source.id)??[];list.push(row);bySource.set(row.source.id,list)}
  const temperatureCandidates=[...bySource.values()].map(group=>{const usable=group.filter(row=>Number.isFinite(row.temperature)),coverageHours=observationCoverageHours(usable),source=group[0].source,rank=observationPriority(source.kind)*10+source.quality*5+Math.min(6,coverageHours/3);return{rows:usable,coverageHours,source,rank}}).filter(item=>item.rows.length>=6&&item.coverageHours>=6).sort((a,b)=>b.rank-a.rank),temperatureSource=temperatureCandidates[0];
  if(!temperatureSource)continue;
  const temperatures=temperatureSource.rows.map(row=>Number(row.temperature)),coverageHours=temperatureSource.coverageHours;
  const precipitationCandidates=[...bySource.values()].map(group=>{const result=precipitationTotal(group),source=group[0].source,rank=observationPriority(source.kind)*10+source.quality*5+Math.min(5,result.coverageHours/3);return{...result,source,rank}}).filter(row=>row.samples>=4&&row.coverageHours>=2).sort((a,b)=>b.rank-a.rank),precipitationSource=precipitationCandidates[0];
  if(!precipitationSource)continue;
  const gustCandidates=[...bySource.values()].map(group=>{const gusts=group.map(row=>Number(row.gust)).filter(Number.isFinite),source=group[0].source,coverageHours=observationCoverageHours(group),rank=observationPriority(source.kind)*10+source.quality*5+Math.min(4,coverageHours/4);return{gusts,source,rank}}).filter(item=>item.gusts.length).sort((a,b)=>b.rank-a.rank),gustSource=gustCandidates[0];
  const primarySources=uniqueSources([temperatureSource.source,precipitationSource.source,...(gustSource?[gustSource.source]:[])]),coverageFactor=Math.min(1,coverageHours/18),quality=clamp((temperatureSource.source.quality*.65+precipitationSource.source.quality*.35)*coverageFactor,.35,.96),row:ForecastReference={date,max:Math.max(...temperatures),min:Math.min(...temperatures),precipitation:precipitationSource.total,source:primarySources.map(source=>source.label).join(' + '),gust:gustSource?Math.max(...gustSource.gusts):undefined,regime:'wechselhaft',quality,confidence:quality>=.8?'high':quality>=.55?'medium':'low',kind:temperatureSource.source.kind,sources:primarySources,coverageHours};
  row.regime=inferRegime(row);references.push(row)
 }
 return references
}

function bestMatchPrediction(day:Day):ForecastPrediction{return{id:'best_match',label:'Open-Meteo Best Match',max:finite(day.max),min:finite(day.min),precipitation:Math.max(0,finite(day.precipitation)),probability:clamp(finite(day.probability),0,100),gust:Number.isFinite(day.gust)?day.gust:undefined,sunshineDuration:Number.isFinite(day.sunshineDuration)?day.sunshineDuration:undefined,weatherCode:day.code}}
function predictedRegime(day:Day,profile?:TwinSiteProfile,hours:Hour[]=[]):WeatherRegime{return inferRegime({weatherCode:day.code,precipitation:day.precipitation,gust:day.gust,sunshineDuration:day.sunshineDuration,min:day.min,max:day.max,wind:day.wind},profile,dayRegimeDuration(hours,day.date))}
function currentPredictions(day:Day,row:EnsembleDay|undefined){return[bestMatchPrediction(day),...(row?.modelSummaries??[]).map(model=>({id:model.id,label:model.label,max:model.max,min:model.min,precipitation:model.precipitation,probability:model.precipitationProbability,gust:model.gust,sunshineDuration:model.sunshineDuration,weatherCode:model.weatherCode}))].filter(predictionValid)}

function chosenEvaluations(store:Store,beforeDate?:string){const references=new Map(store.references.filter(row=>!beforeDate||row.date<beforeDate).map(row=>[row.date,row])),byKey=new Map<string,ForecastCapture[]>(),now=Date.now();for(const capture of store.captures){const completeAt=localDateTimeEpoch(capture.targetDate,capture.timezone,23,59);if(Number.isFinite(completeAt)&&completeAt>=now||beforeDate&&capture.targetDate>=beforeDate||!references.has(capture.targetDate))continue;const horizon=horizonBucket(capture.leadHours),key=`${capture.targetDate}:${horizon}`,list=byKey.get(key)??[];list.push(capture);byKey.set(key,list)}const evaluations:Evaluation[]=[];for(const[key,list]of byKey){const[date,horizonText]=key.split(':'),horizon=Number(horizonText) as ForecastHorizon,capture=[...list].sort((a,b)=>Math.abs(a.leadHours-horizon)-Math.abs(b.leadHours-horizon))[0],reference=references.get(date);if(reference)evaluations.push({date,capture,reference,horizon,regime:reference.regime})}return evaluations.sort((a,b)=>b.date.localeCompare(a.date)||a.horizon-b.horizon)}

function emptyParameters():Record<ForecastParameter,ParamAccumulator>{return{temperature:{sum:0,count:0},precipitation:{sum:0,count:0},probability:{sum:0,count:0},gust:{sum:0,count:0},sunshine:{sum:0,count:0}}}
function addParameter(accumulator:ParamAccumulator,value:number){if(Number.isFinite(value)){accumulator.sum+=value;accumulator.count++}}
function modelParameterErrors(prediction:ForecastPrediction,reference:ForecastReference){const observed=reference.precipitation>DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM?1:0,probability=clamp(prediction.probability/100,0,1);return{temperature:(Math.abs(prediction.max-reference.max)+Math.abs(prediction.min-reference.min))/2,precipitation:Math.abs(prediction.precipitation-reference.precipitation),probability:(probability-observed)**2,gust:Number.isFinite(prediction.gust)&&Number.isFinite(reference.gust)?Math.abs(Number(prediction.gust)-Number(reference.gust)):NaN,sunshine:Number.isFinite(prediction.sunshineDuration)&&Number.isFinite(reference.sunshineDuration)?Math.abs(Number(prediction.sunshineDuration)-Number(reference.sunshineDuration))/3600:NaN}}
function parameterScore(parameter:ForecastParameter,error:number){if(parameter==='temperature')return error;if(parameter==='precipitation')return Math.min(4,error*.35);if(parameter==='probability')return error*3;if(parameter==='gust')return Math.min(3,error*.09);return Math.min(3,error*.28)}
function priorityWeightedMetricScore(metrics:Partial<Record<ForecastParameter,ParameterMetric>>){let weighted=0,total=0;for(const parameter of Object.keys(FORECAST_PARAMETER_IMPORTANCE) as ForecastParameter[]){const metric=metrics[parameter];if(!metric||!Number.isFinite(metric.score))continue;const importance=FORECAST_PARAMETER_IMPORTANCE[parameter];weighted+=metric.score*importance;total+=importance}return total?weighted/total:NaN}
function priorityWeightedErrorScore(errors:Record<ForecastParameter,number>){let weighted=0,total=0;for(const parameter of Object.keys(FORECAST_PARAMETER_IMPORTANCE) as ForecastParameter[]){const value=parameterScore(parameter,errors[parameter]);if(!Number.isFinite(value))continue;const importance=FORECAST_PARAMETER_IMPORTANCE[parameter];weighted+=value*importance;total+=importance}return total?weighted/total:NaN}
function weatherBundleSkill(weight:ModelWeight){let weighted=0,total=0;for(const parameter of ['precipitation','probability','sunshine'] as ForecastParameter[]){const importance=FORECAST_PARAMETER_IMPORTANCE[parameter],value=weight.parameterWeights[parameter]??weight.weight;if(!Number.isFinite(value)||value<=0)continue;weighted+=value*importance;total+=importance}return total?weighted/total:0}
function statsFor(evaluations:Evaluation[],filter?:(evaluation:Evaluation)=>boolean){const stats=new Map<string,RawStat>();for(const evaluation of evaluations){if(filter&&!filter(evaluation))continue;for(const prediction of evaluation.capture.predictions){const stat=stats.get(prediction.id)??{id:prediction.id,label:prediction.label,days:0,parameters:emptyParameters()},errors=modelParameterErrors(prediction,evaluation.reference);stat.days++;for(const parameter of Object.keys(errors) as ForecastParameter[])addParameter(stat.parameters[parameter],errors[parameter]);stats.set(prediction.id,stat)}}return[...stats.values()].map(row=>{const metrics:Partial<Record<ForecastParameter,ParameterMetric>>={};for(const parameter of Object.keys(row.parameters) as ForecastParameter[]){const accumulator=row.parameters[parameter];if(accumulator.count){const error=accumulator.sum/accumulator.count;metrics[parameter]={parameter,samples:accumulator.count,error,score:parameterScore(parameter,error)}}}const temperatureMae=metrics.temperature?.error??NaN,precipitationMae=metrics.precipitation?.error??NaN,brier=metrics.probability?.error??NaN,score=priorityWeightedMetricScore(metrics);return{id:row.id,label:row.label,days:row.days,temperatureMae,precipitationMae,brier,gustMae:metrics.gust?.error,sunshineMae:metrics.sunshine?.error,score,weight:0,confidence:confidenceFromSamples(row.days),parameterMetrics:metrics} satisfies ForecastModelScore}).sort((a,b)=>a.score-b.score)}

function modelBiases(evaluations:Evaluation[],regime:WeatherRegime,horizon:ForecastHorizon){const rows=new Map<string,{label:string;samples:number;sum:Record<ForecastParameter,number>;count:Record<ForecastParameter,number>}>();for(const evaluation of evaluations){if(evaluation.regime!==regime||evaluation.horizon!==horizon)continue;for(const prediction of evaluation.capture.predictions){if(['best_match','mid_local_weighted','equal_weighted'].includes(prediction.id))continue;const row=rows.get(prediction.id)??{label:prediction.label,samples:0,sum:{temperature:0,precipitation:0,probability:0,gust:0,sunshine:0},count:{temperature:0,precipitation:0,probability:0,gust:0,sunshine:0}};row.samples++;const temp=((prediction.max-referenceValue(evaluation.reference,'max'))+(prediction.min-referenceValue(evaluation.reference,'min')))/2;row.sum.temperature+=temp;row.count.temperature++;row.sum.precipitation+=prediction.precipitation-evaluation.reference.precipitation;row.count.precipitation++;if(Number.isFinite(prediction.gust)&&Number.isFinite(evaluation.reference.gust)){row.sum.gust+=Number(prediction.gust)-Number(evaluation.reference.gust);row.count.gust++}if(Number.isFinite(prediction.sunshineDuration)&&Number.isFinite(evaluation.reference.sunshineDuration)){row.sum.sunshine+=(Number(prediction.sunshineDuration)-Number(evaluation.reference.sunshineDuration))/3600;row.count.sunshine++}rows.set(prediction.id,row)}}return[...rows].map(([id,row])=>{const shrink=row.samples/(row.samples+5),corrections:Partial<Record<ForecastParameter,number>>={};for(const parameter of['temperature','precipitation','gust','sunshine'] as ForecastParameter[])if(row.count[parameter])corrections[parameter]=-(row.sum[parameter]/row.count[parameter])*shrink;return{id,label:row.label,regime,horizon,samples:row.samples,confidence:confidenceFromSamples(row.samples),corrections} satisfies BiasCorrection})}
function referenceValue(reference:ForecastReference,key:'max'|'min'){return reference[key]}

function calibrationBins(evaluations:Evaluation[],modelId='best_match'){const buckets=Array.from({length:5},(_,index)=>({lower:index*20,upper:(index+1)*20,samples:0,forecastSum:0,observed:0}));for(const evaluation of evaluations){const prediction=evaluation.capture.predictions.find(row=>row.id===modelId);if(!prediction)continue;const probability=clamp(prediction.probability,0,100),index=Math.min(4,Math.floor(probability/20)),bucket=buckets[index];bucket.samples++;bucket.forecastSum+=probability;bucket.observed+=evaluation.reference.precipitation>DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM?1:0}return buckets.filter(bucket=>bucket.samples).map(bucket=>{const forecastMean=bucket.forecastSum/bucket.samples,observedFrequency=100*bucket.observed/bucket.samples,shrink=bucket.samples/(bucket.samples+8),calibrated=forecastMean*(1-shrink)+observedFrequency*shrink;return{lower:bucket.lower,upper:bucket.upper,samples:bucket.samples,forecastMean,observedFrequency,calibrated} satisfies ProbabilityCalibrationBin})}
function calibratedProbability(value:number,bins:ProbabilityCalibrationBin[]){const bin=bins.find(item=>value>=item.lower&&(value<item.upper||item.upper===100));if(!bin||bin.samples<3)return value;return clamp(value+(bin.calibrated-bin.forecastMean),0,100)}

function capPercentages<T>(rows:T[],read:(row:T)=>number,write:(row:T,value:number)=>void,max:number){if(rows.length<2)return;for(let iteration=0;iteration<6;iteration++){const leaders=rows.filter(row=>read(row)>max+.001);if(!leaders.length)break;for(const leader of leaders){const excess=read(leader)-max;write(leader,max);const others=rows.filter(row=>row!==leader),otherTotal=others.reduce((sum,row)=>sum+Math.max(0,read(row)),0);if(!otherTotal)continue;for(const row of others)write(row,read(row)+excess*Math.max(0,read(row))/otherTotal)}}const total=rows.reduce((sum,row)=>sum+Math.max(0,read(row)),0)||1;for(const row of rows)write(row,100*Math.max(0,read(row))/total)}
function compositePredictionScore(prediction:ForecastPrediction,reference:ForecastReference){return priorityWeightedErrorScore(modelParameterErrors(prediction,reference))}
function localValidationEvidence(evaluations:Evaluation[]){let weightedSum=0,bestSum=0,samples=0;const days=new Set<string>();for(const evaluation of evaluations){const weighted=evaluation.capture.predictions.find(row=>row.id==='mid_local_weighted'),best=evaluation.capture.predictions.find(row=>row.id==='best_match');if(!weighted||!best)continue;const weightedScore=compositePredictionScore(weighted,evaluation.reference),bestScore=compositePredictionScore(best,evaluation.reference);if(!Number.isFinite(weightedScore)||!Number.isFinite(bestScore))continue;weightedSum+=weightedScore;bestSum+=bestScore;samples++;days.add(evaluation.date)}const improvement=samples?100*((bestSum/samples)-(weightedSum/samples))/Math.max(.1,bestSum/samples):undefined;return{samples,days:days.size,improvement}}
function adaptiveWeightCap(evaluations:Evaluation[],regime:WeatherRegime,horizon:ForecastHorizon){const globalDays=new Set(evaluations.map(item=>item.date)).size,segmentDays=new Set(evaluations.filter(item=>item.regime===regime&&item.horizon===horizon).map(item=>item.date)).size,validation=localValidationEvidence(evaluations);let max=globalDays<6?48:globalDays<12?52:globalDays<18?56:globalDays<36?60:62;if(segmentDays<3)max=Math.min(max,50);else if(segmentDays<6)max=Math.min(max,54);else if(segmentDays<12)max=Math.min(max,58);if(validation.samples<6)max=Math.min(max,58);else if(Number.isFinite(validation.improvement)){if(validation.improvement!>=10)max+=3;else if(validation.improvement!>=3)max+=2;else if(validation.improvement!>0)max+=1;else if(validation.improvement!<=-5)max=Math.min(max,52);else max=Math.min(max,55)}max=clamp(Math.round(max),48,65);const evidenceSamples=Math.min(globalDays,segmentDays?Math.max(segmentDays,Math.round((globalDays+segmentDays)/2)):globalDays),confidence=confidenceFromSamples(evidenceSamples);return{max,confidence,samples:evidenceSamples,segmentDays,globalDays,validationSamples:validation.samples,validationImprovement:validation.improvement}}
function parameterWeightCap(base:number,samples:number){if(samples<3)return Math.min(base,50);if(samples<6)return Math.min(base,54);if(samples<12)return Math.min(base,58);return base}
function regularizedWeights(evaluations:Evaluation[],regime:WeatherRegime,horizon:ForecastHorizon,beforeDate?:string){const eligibleEvaluations=evaluations.filter(item=>!beforeDate||item.date<beforeDate),uniqueDays=new Set(eligibleEvaluations.map(item=>item.date)).size;if(uniqueDays<5)return[];const global=statsFor(eligibleEvaluations).filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)),segment=statsFor(eligibleEvaluations,item=>item.regime===regime&&item.horizon===horizon).filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)),globalById=new Map(global.map(row=>[row.id,row])),segmentById=new Map(segment.map(row=>[row.id,row])),ids=[...new Set([...global.map(row=>row.id),...segment.map(row=>row.id)])],cap=adaptiveWeightCap(eligibleEvaluations,regime,horizon),weighted=ids.map(id=>{const globalRow=globalById.get(id),segmentRow=segmentById.get(id),days=segmentRow?.days??0,globalScore=globalRow?.score??8,score=((segmentRow?.score??globalScore)*days+globalScore*5)/(days+5),parameterWeights:Partial<Record<ForecastParameter,number>>={},parameterSamples:Partial<Record<ForecastParameter,number>>={};for(const parameter of['temperature','precipitation','probability','gust','sunshine'] as ForecastParameter[]){const segmentMetric=segmentRow?.parameterMetrics[parameter],globalMetric=globalRow?.parameterMetrics[parameter],segmentCount=segmentMetric?.samples??0,baseScore=globalMetric?.score??score,combined=((segmentMetric?.score??baseScore)*segmentCount+baseScore*5)/(segmentCount+5);parameterWeights[parameter]=1/Math.max(.18,combined);parameterSamples[parameter]=segmentCount||globalMetric?.samples||0}return{id,label:segmentRow?.label??globalRow?.label??id,days:Math.max(days,globalRow?.days??0),score,raw:1/Math.max(.35,score),parameterWeights,parameterSamples}}).filter(row=>row.days>=2).sort((a,b)=>a.score-b.score);if(weighted.length<2)return[];const total=weighted.reduce((sum,row)=>sum+row.raw,0)||1,normalized=weighted.map(row=>({...row,weight:100*row.raw/total,confidence:confidenceFromSamples(row.days),parameterCaps:{} as Partial<Record<ForecastParameter,number>>}));capPercentages(normalized,row=>row.weight,(row,value)=>{row.weight=value},cap.max);for(const parameter of['temperature','precipitation','probability','gust','sunshine'] as ForecastParameter[]){const parameterTotal=normalized.reduce((sum,row)=>sum+(row.parameterWeights[parameter]??0),0)||1,maxSamples=Math.max(0,...normalized.map(row=>row.parameterSamples[parameter]??0)),parameterCap=parameterWeightCap(cap.max,maxSamples);for(const row of normalized){row.parameterWeights[parameter]=100*(row.parameterWeights[parameter]??0)/parameterTotal;row.parameterCaps[parameter]=parameterCap}capPercentages(normalized,row=>row.parameterWeights[parameter]??0,(row,value)=>{row.parameterWeights[parameter]=value},parameterCap)}return normalized.sort((a,b)=>b.weight-a.weight).map(row=>({id:row.id,label:row.label,weight:row.weight,days:row.days,confidence:row.confidence,maxWeight:cap.max,capConfidence:cap.confidence,capSamples:cap.samples,validationSamples:cap.validationSamples,validationImprovement:cap.validationImprovement,parameterWeights:row.parameterWeights,parameterCaps:row.parameterCaps} satisfies ModelWeight))}

function correctedPrediction(prediction:ForecastPrediction,bias:BiasCorrection|undefined){if(!bias)return prediction;const temperature=bias.corrections.temperature??0;return{...prediction,max:prediction.max+temperature,min:prediction.min+temperature,precipitation:Math.max(0,prediction.precipitation+(bias.corrections.precipitation??0)),gust:Number.isFinite(prediction.gust)?Math.max(0,Number(prediction.gust)+(bias.corrections.gust??0)):prediction.gust,sunshineDuration:Number.isFinite(prediction.sunshineDuration)?Math.max(0,Number(prediction.sunshineDuration)+(bias.corrections.sunshine??0)*3600):prediction.sunshineDuration}}
function weightedValue(rows:{prediction:ForecastPrediction;weight:ModelWeight}[],parameter:ForecastParameter,selector:(prediction:ForecastPrediction)=>number){const usable=rows.map(row=>({value:selector(row.prediction),weight:row.weight.parameterWeights[parameter]??row.weight.weight})).filter(row=>Number.isFinite(row.value)&&row.weight>0),total=usable.reduce((sum,row)=>sum+row.weight,0);return total?usable.reduce((sum,row)=>sum+row.value*row.weight,0)/total:NaN}
function weightedPrediction(predictions:ForecastPrediction[],weights:ModelWeight[],biases:BiasCorrection[]=[],calibrations:ProbabilityCalibrationBin[]=[]):ForecastPrediction|undefined{
 const byId=new Map(predictions.map(row=>[row.id,row])),biasById=new Map(biases.map(row=>[row.id,row])),usable=weights.map(weight=>{const prediction=byId.get(weight.id);return prediction?{weight,prediction:correctedPrediction(prediction,biasById.get(weight.id))}:null}).filter(Boolean) as {weight:ModelWeight;prediction:ForecastPrediction}[];
 if(usable.length<2)return undefined;
 const max=weightedValue(usable,'temperature',row=>row.max),min=weightedValue(usable,'temperature',row=>row.min),gust=weightedValue(usable,'gust',row=>Number(row.gust));
 // Niederschlagsmenge, Wahrscheinlichkeit, Wettercode und Sonnenschein bilden
 // ein gemeinsames Wetterbündel. MID wählt dafür genau ein lokal am besten
 // bewertetes Modell, statt vier Parameter aus verschiedenen Modellen zu mischen.
 // Innerhalb dieses Bündels zählt Niederschlag klar stärker als Sonnenschein; die
 // physikalische Bündelkohärenz bleibt damit erhalten, ohne einen Sonnenschein-Sieger
 // zum Wetterbündel-Sieger zu machen.
 const weatherRepresentative=[...usable].filter(row=>Number.isFinite(row.prediction.precipitation)&&Number.isFinite(row.prediction.probability)).sort((a,b)=>weatherBundleSkill(b.weight)-weatherBundleSkill(a.weight))[0];
 if(!weatherRepresentative||![max,min].every(Number.isFinite))return undefined;
 const weather=weatherRepresentative.prediction,probability=calibratedProbability(clamp(weather.probability,0,100),calibrations);
 return{id:'mid_local_weighted',label:`MID lokal gewichtet · Wetterbündel ${weather.label}`,max,min,precipitation:Math.max(0,weather.precipitation),probability,gust:Number.isFinite(gust)?Math.max(0,gust):undefined,sunshineDuration:Number.isFinite(weather.sunshineDuration)?clamp(Number(weather.sunshineDuration),0,86400):undefined,weatherCode:Number.isFinite(weather.weatherCode)?Math.round(Number(weather.weatherCode)):undefined};
}
function equalWeightedPrediction(predictions:ForecastPrediction[]):ForecastPrediction|undefined{const usable=predictions.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id));if(usable.length<2)return undefined;const mean=(selector:(prediction:ForecastPrediction)=>number)=>{const values=usable.map(selector).filter(Number.isFinite);return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:NaN},max=mean(row=>row.max),min=mean(row=>row.min),precipitation=mean(row=>row.precipitation),probability=mean(row=>row.probability),gust=mean(row=>Number(row.gust)),sunshineDuration=mean(row=>Number(row.sunshineDuration));if(![max,min,precipitation,probability].every(Number.isFinite))return undefined;return{id:'equal_weighted',label:'Einfaches Multimodellmittel',max,min,precipitation:Math.max(0,precipitation),probability:clamp(probability,0,100),gust:Number.isFinite(gust)?gust:undefined,sunshineDuration:Number.isFinite(sunshineDuration)?sunshineDuration:undefined}}
function predictionDayScore(prediction:ForecastPrediction,reference:ForecastReference){return priorityWeightedErrorScore(modelParameterErrors(prediction,reference))}

export function recordForecastCapture(locationKey:string,days:Day[],ensemble:EnsembleDay[],location?:Location,hours:Hour[]=[],additional:AdditionalForecastPrediction[]=[]){if(!readWeatherTwinSettings().enabled||!locationKey||!days.length)return;const now=Date.now(),slot=Math.floor(now/(3*3600000)),store=readStore(locationKey),ensembleByDate=new Map(ensemble.map(row=>[row.date,row])),historical=chosenEvaluations(store),profile=readTwinSiteProfile(locationKey,location??{id:0,name:locationKey,latitude:0,longitude:0}),timezone=location?.timezone;for(const day of days.slice(0,3)){const target=dateNoon(day.date,timezone),leadHours=(target-now)/3600000;if(!Number.isFinite(leadHours)||leadHours<-12||leadHours>84)continue;const regime=predictedRegime(day,profile,hours),horizon=horizonBucket(leadHours),predictions=currentPredictions(day,ensembleByDate.get(day.date));for(const source of additional){const extra=source.days.find(row=>row.date===day.date);if(extra)predictions.push({id:source.id,label:source.label,max:extra.max,min:extra.min,precipitation:Math.max(0,extra.precipitation),probability:clamp(extra.probability,0,100),gust:extra.gust,sunshineDuration:extra.sunshineDuration,weatherCode:extra.code})}const weights=regularizedWeights(historical,regime,horizon,day.date),settings=readWeatherTwinSettings(),biases=settings.biasCorrection?modelBiases(historical.filter(item=>item.date<day.date),regime,horizon):[],calibrations=settings.probabilityCalibration?calibrationBins(historical.filter(item=>item.date<day.date)):[],local=weightedPrediction(predictions,weights,biases,calibrations),equal=equalWeightedPrediction(predictions);if(equal)predictions.push(equal);if(local)predictions.push(local);const signature=`${day.date}:${slot}`,index=store.captures.findIndex(item=>`${item.targetDate}:${Math.floor(Date.parse(item.issuedAt)/(3*3600000))}`===signature),capture:ForecastCapture={id:signature,targetDate:day.date,issuedAt:new Date(now).toISOString(),leadHours,timezone,predictedRegime:regime,predictions};if(index>=0)store.captures[index]=capture;else store.captures.push(capture)}saveStore(locationKey,store)}

function referenceRows(data:any,source:string,kind:ObservationKind,quality:number){const daily=data?.daily??{},times=Array.isArray(daily.time)?daily.time:[];return times.map((date:string,index:number)=>{const row:ForecastReference={date:String(date),max:finite(daily.temperature_2m_max?.[index],NaN),min:finite(daily.temperature_2m_min?.[index],NaN),precipitation:Math.max(0,finite(daily.precipitation_sum?.[index],NaN)),weatherCode:finite(daily.weather_code?.[index],NaN),gust:finite(daily.wind_gusts_10m_max?.[index],NaN),sunshineDuration:finite(daily.sunshine_duration?.[index],NaN),source,regime:'wechselhaft',quality,confidence:quality>=.8?'high':quality>=.55?'medium':'low',kind,sources:[{id:`${kind}:${source}`,label:source,kind,quality}]};row.regime=inferRegime(row);return row}).filter((row:ForecastReference)=>[row.max,row.min,row.precipitation].every(Number.isFinite))}
function localDateOffset(days:number,timeZone?:string){return dateAtEpoch(Date.now()+days*86400000,timeZone)}
const REFERENCE_DAILY='temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_gusts_10m_max,sunshine_duration';
async function retrospectiveBestMatchRequest(location:Location,signal?:AbortSignal){const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),timezone:'auto',past_days:'30',forecast_days:'1',models:'best_match',wind_speed_unit:'kn',daily:REFERENCE_DAILY}),response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal,cache:'no-store'});if(!response.ok)throw new Error(`Open-Meteo Rückblick HTTP ${response.status}`);return referenceRows(await response.json(),'Open-Meteo Best-Match-Rückblick','model-fallback',.28)}
async function reanalysisReferenceRequest(location:Location,signal?:AbortSignal){const base={latitude:String(location.latitude),longitude:String(location.longitude),timezone:'auto',start_date:localDateOffset(-120,location.timezone),end_date:localDateOffset(-1,location.timezone),models:'era5_land',wind_speed_unit:'kn'},request=async(daily:string)=>{const params=new URLSearchParams({...base,daily});if(Number.isFinite(location.elevation))params.set('elevation',String(location.elevation));return fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`,{signal,cache:'no-store'})};let response=await request(REFERENCE_DAILY);if(!response.ok)response=await request('temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code');if(!response.ok)throw new Error(`Open-Meteo Reanalyse HTTP ${response.status}`);return referenceRows(await response.json(),'Open-Meteo ERA5-Land-Reanalyse','reanalysis',.72)}
async function referenceRequest(store:Store,location:Location,signal?:AbortSignal){const settled=await Promise.allSettled([retrospectiveBestMatchRequest(location,signal),reanalysisReferenceRequest(location,signal)]);if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');const fallback=settled[0].status==='fulfilled'?settled[0].value:[],reanalysis=settled[1].status==='fulfilled'?settled[1].value:[],local=aggregateLiveReferences(store);if(!fallback.length&&!reanalysis.length&&!local.length){const messages=settled.filter((row):row is PromiseRejectedResult=>row.status==='rejected').map(row=>row.reason instanceof Error?row.reason.message:String(row.reason));throw new Error(messages.join(' · ')||'Kein Rückblick verfügbar.')}const merged=new Map<string,ForecastReference>();for(const row of fallback)merged.set(row.date,row);for(const row of reanalysis){const current=merged.get(row.date);if(!current||row.quality>=current.quality)merged.set(row.date,row)}for(const row of local){const current=merged.get(row.date);if(!current||row.quality>=current.quality)merged.set(row.date,row);else merged.set(row.date,{...current,sources:uniqueSources([...current.sources,...row.sources]),source:`${current.source} + lokale Teilbeobachtung`})}return[...merged.values()].sort((a,b)=>a.date.localeCompare(b.date))}
export async function refreshForecastReferences(locationKey:string,location:Location,signal?:AbortSignal,force=false){const store=readStore(locationKey),refreshKey=`${REFERENCE_REFRESH_PREFIX}${locationKey}`,last=Number(sessionStorage.getItem(refreshKey)||0);if(!force&&store.references.length&&Number.isFinite(last)&&Date.now()-last<REFERENCE_REFRESH_MS)return store;const rows=await referenceRequest(store,location,signal),byDate=new Map(store.references.map(row=>[row.date,row]));for(const row of rows){const current=byDate.get(row.date);if(!current||row.quality>=current.quality)byDate.set(row.date,row)}store.references=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-ARCHIVE_MAX_REFERENCES);saveStore(locationKey,store);try{sessionStorage.setItem(refreshKey,String(Date.now()))}catch{}return store}

function currentWeightedForecasts(days:Day[],ensemble:EnsembleDay[],evaluations:Evaluation[],profile?:TwinSiteProfile,timeZone?:string,hours:Hour[]=[],additional:AdditionalForecastPrediction[]=[]):LocalWeightedForecast[]{const ensembleByDate=new Map(ensemble.map(row=>[row.date,row])),now=Date.now(),settings=readWeatherTwinSettings(),calibrations=settings.probabilityCalibration?calibrationBins(evaluations):[];return days.slice(0,3).map(day=>{const leadHours=(dateNoon(day.date,timeZone)-now)/3600000,horizon=horizonBucket(leadHours),regime=predictedRegime(day,profile,hours),weights=regularizedWeights(evaluations,regime,horizon),biases=settings.biasCorrection?modelBiases(evaluations,regime,horizon):[],predictions=currentPredictions(day,ensembleByDate.get(day.date));for(const source of additional){const extra=source.days.find(item=>item.date===day.date);if(extra)predictions.push({id:source.id,label:source.label,max:extra.max,min:extra.min,precipitation:Math.max(0,extra.precipitation),probability:clamp(extra.probability,0,100),gust:extra.gust,sunshineDuration:extra.sunshineDuration,weatherCode:extra.code})}const prediction=weightedPrediction(predictions,weights,biases,calibrations),equalWeighted=equalWeightedPrediction(predictions),ready=Boolean(prediction),confidence=confidenceFromSamples(Math.max(0,...weights.map(row=>row.days))),explanations:string[]=[];if(ready){const leader=weights[0];if(leader){explanations.push(`${leader.label} erhält für ${weatherRegimeLabel(regime)} und +${horizon} h das höchste lokale Gewicht.`);const validation=leader.validationSamples>=6&&Number.isFinite(leader.validationImprovement)?` · Kontrollvergleich ${leader.validationImprovement!>=0?'+':''}${Math.round(leader.validationImprovement!)} %`:' · Kontrollvergleich noch im Aufbau';explanations.push(`Adaptive Obergrenze ${Math.round(leader.maxWeight)} % · Vertrauen ${leader.capConfidence==='high'?'hoch':leader.capConfidence==='medium'?'mittel':'vorläufig'} · ${leader.capSamples} belegte Tage${validation}.`)}const appliedBias=biases.find(row=>Math.abs(row.corrections.temperature??0)>=.2||Math.abs(row.corrections.precipitation??0)>=.2);if(appliedBias)explanations.push(`Lokaler Bias von ${appliedBias.label} wird mit ${appliedBias.samples} Vergleichsfällen korrigiert.`);if(calibrations.some(bin=>bin.samples>=3))explanations.push('Die Regenwahrscheinlichkeit wird anhand der lokalen Trefferhäufigkeit kalibriert.')}return{date:day.date,horizon,regime,prediction,equalWeighted,weights,ready,confidence,reason:ready?'Aus parameterspezifischer lokaler Güte, Priorität, Bias, Wetterlage und Prognosehorizont abgeleitet.':'Noch zu wenige abgeschlossene Vergleichstage für dieses Segment.',explanations}})}

function mainForecastStatus(currentForecasts:LocalWeightedForecast[],weightingReady:boolean,validationDays:number,weightedImprovement?:number):TwinMainForecastStatus{
 const ready=currentForecasts.filter(row=>row.ready&&row.prediction),requiredReady=Math.min(2,Math.max(1,currentForecasts.length)),totals=new Map<string,{id:string;label:string;sum:number;count:number}>();
 for(const row of ready)for(const weight of row.weights){if(['best_match','mid_local_weighted','equal_weighted'].includes(weight.id)||!Number.isFinite(weight.weight)||weight.weight<=0)continue;const current=totals.get(weight.id)??{id:weight.id,label:weight.label,sum:0,count:0};current.sum+=weight.weight;current.count++;totals.set(weight.id,current)}
 const models=[...totals.values()].map(row=>({id:row.id,label:row.label,weight:row.sum/Math.max(1,row.count)})).sort((a,b)=>b.weight-a.weight),dominantModel=models[0],modelCount=models.length,improvement=Number.isFinite(weightedImprovement)?Number(weightedImprovement):undefined,validated=validationDays>=6&&Number.isFinite(improvement)&&Number(improvement)>=0,eligible=weightingReady&&ready.length>=requiredReady&&modelCount>=2&&validated,confidence:TwinConfidence=validationDays>=18&&Number(improvement)>=3?'high':validationDays>=6?'medium':'low';
 let reason='';
 if(!weightingReady)reason='Mindestens fünf abgeschlossene Vergleichstage und zwei auswertbare Modelle sind erforderlich.';
 else if(ready.length<requiredReady)reason='Für mindestens zwei der nächsten drei Tage fehlt noch eine belastbare lokal gewichtete Prognose.';
 else if(modelCount<2)reason='Der aktuelle Modellmix enthält noch nicht mindestens zwei auswertbare Modellfamilien.';
 else if(validationDays<6)reason=`Noch ${Math.max(0,6-validationDays)} abgeschlossene Kontrolltage bis zur Freigabe gegen Best Match.`;
 else if(!Number.isFinite(improvement))reason='Der Kontrollvergleich mit Best Match ist noch nicht vollständig berechenbar.';
 else if(Number(improvement)<0)reason=`MID liegt im Kontrollvergleich derzeit ${Math.round(Math.abs(Number(improvement)))} % hinter Best Match.`;
 else reason=`MID ist nach ${validationDays} Kontrolltagen mindestens gleichwertig zu Best Match (${Number(improvement)>=0?'+':''}${Math.round(Number(improvement))} %).`;
 const sourceLabel=dominantModel?`Best-Match-Nachkorrektur · Diagnose-Schwerpunkt ${dominantModel.label} ${Math.round(dominantModel.weight)} %`:'Best-Match-Nachkorrektur';
 return{eligible,confidence,readyDays:ready.length,modelCount,validationDays,improvement,dominantModel,sourceLabel,reason}
}

function healthReport(store:Store,evaluations:Evaluation[],currentForecasts:LocalWeightedForecast[]){const issues:string[]=[],independent=store.references.filter(row=>row.kind!=='model-fallback'),sources=[...new Set(store.references.flatMap(row=>row.sources.map(source=>source.label)))].slice(0,6),latestReference=(independent.length?independent:store.references).at(-1),age=latestReference?Date.now()-dateNoon(latestReference.date,store.captures.at(-1)?.timezone):Infinity,uniqueDays=new Set(evaluations.map(item=>item.date)).size;if(independent.length<5)issues.push('Zu wenige unabhängige Rückblickstage.');if(store.observations.filter(row=>row.source.kind!=='model-fallback').length<8)issues.push('Lokale Mess-/Analyseserie befindet sich noch in der Lernphase.');if(uniqueDays<5||!currentForecasts.some(row=>row.ready))issues.push('Lokale Gewichtung für die aktuelle Wetterlage noch nicht freigegeben.');if(age>7*86400000)issues.push('Unabhängige Rückblicksdaten sind älter als sieben Tage.');const score=clamp(100-issues.length*22+Math.min(15,uniqueDays*2),10,100),status: TwinHealth['status']=score>=78?'ready':score>=48?'learning':'limited';return{status,label:status==='ready'?'Wetterzwilling belastbar':status==='learning'?'Wetterzwilling lernt':'Wetterzwilling eingeschränkt',score,issues,sources} satisfies TwinHealth}

export function buildForecastVerificationReport(locationKey:string,days:Day[]=[],ensemble:EnsembleDay[]=[],location?:Location,hours:Hour[]=[],additional:AdditionalForecastPrediction[]=[]):ForecastVerificationReport{
 const store=readStore(locationKey),evaluations=chosenEvaluations(store).slice(0,300),raw=statsFor(evaluations),eligible=raw.filter(row=>row.days>=Math.min(5,Math.max(2,evaluations.length))),inverse=eligible.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)).reduce((sum,row)=>sum+1/Math.max(.25,row.score),0);
 for(const row of raw)row.weight=inverse&&!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)&&eligible.includes(row)?100*(1/Math.max(.25,row.score))/inverse:0;
 const segments:ForecastSegmentScore[]=[];
 for(const regime of REGIMES)for(const horizon of HORIZONS){const matching=evaluations.filter(item=>item.regime===regime&&item.horizon===horizon),models=statsFor(matching);if(matching.length)segments.push({regime,horizon,days:new Set(matching.map(item=>item.date)).size,models,bestModel:models.find(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)&&row.days>=2)})}
 segments.sort((a,b)=>b.days-a.days||a.horizon-b.horizon);
 const reviews:ForecastDayReview[]=evaluations.slice(0,50).map(evaluation=>{const winner=[...evaluation.capture.predictions].sort((a,b)=>predictionDayScore(a,evaluation.reference)-predictionDayScore(b,evaluation.reference))[0];return{date:evaluation.date,issuedAt:evaluation.capture.issuedAt,leadHours:evaluation.capture.leadHours,horizon:evaluation.horizon,regime:evaluation.regime,reference:evaluation.reference,bestMatch:evaluation.capture.predictions.find(row=>row.id==='best_match'),equalWeighted:evaluation.capture.predictions.find(row=>row.id==='equal_weighted'),localWeighted:evaluation.capture.predictions.find(row=>row.id==='mid_local_weighted'),winner:winner?raw.find(score=>score.id===winner.id):undefined}}),bestMatch=raw.find(row=>row.id==='best_match'),weighted=raw.find(row=>row.id==='mid_local_weighted'),equal=raw.find(row=>row.id==='equal_weighted'),siteProfile=readTwinSiteProfile(locationKey,location??{id:0,name:locationKey,latitude:0,longitude:0}),currentForecasts=currentWeightedForecasts(days,ensemble,evaluations,siteProfile,location?.timezone,hours,additional),uniqueDays=new Set(evaluations.map(item=>item.date)).size,parameterLeaders:Partial<Record<ForecastParameter,ForecastModelScore>>={};
 for(const parameter of['temperature','precipitation','probability','gust','sunshine'] as ForecastParameter[]){parameterLeaders[parameter]=raw.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)&&(row.parameterMetrics[parameter]?.samples??0)>=2).sort((a,b)=>(a.parameterMetrics[parameter]?.score??Infinity)-(b.parameterMetrics[parameter]?.score??Infinity))[0]}
 const biases=REGIMES.flatMap(regime=>HORIZONS.flatMap(horizon=>modelBiases(evaluations,regime,horizon))).filter(row=>row.samples>=2).sort((a,b)=>b.samples-a.samples).slice(0,30),calibrations=calibrationBins(evaluations),health=healthReport(store,evaluations,currentForecasts),weightingReady=uniqueDays>=5&&eligible.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)).length>=2,weightedImprovement=weighted&&bestMatch?100*(bestMatch.score-weighted.score)/Math.max(.1,bestMatch.score):undefined,weightedValidationDays=new Set(evaluations.filter(item=>item.capture.predictions.some(row=>row.id==='mid_local_weighted')&&item.capture.predictions.some(row=>row.id==='best_match')).map(item=>item.date)).size,mainForecast=mainForecastStatus(currentForecasts,weightingReady,weightedValidationDays,weightedImprovement);
 return{days:uniqueDays,samples:evaluations.length,models:raw,segments,reviews,bestModel:uniqueDays>=5?eligible.find(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)):undefined,rainBrier:bestMatch?.brier,temperatureMae:bestMatch?.temperatureMae,weightingReady,weightedScore:weighted?.score,equalWeightedScore:equal?.score,bestMatchScore:bestMatch?.score,weightedImprovement,weightedValidationDays,mainForecastStatus:mainForecast,currentForecasts,parameterLeaders,calibrations,biases,siteProfile,health,archiveUpdatedAt:store.updatedAt}
}


export function applyLocalTwinForecastFromReport(days:Day[],report:ForecastVerificationReport,_radar?:RadarNowcast|null){
 const settings=readWeatherTwinSettings();if(!settings.enabled||!settings.useAsMainForecast||!report.mainForecastStatus.eligible)return days;
 const byDate=new Map(report.currentForecasts.map(row=>[row.date,row]));let changed=false;
 const result=days.map(day=>{
  const row=byDate.get(day.date);if(!row?.ready||!row.prediction)return day;
  const prediction=row.prediction,max=day.max+clamp(prediction.max-day.max,-2.5,2.5),min=day.min+clamp(prediction.min-day.min,-2.5,2.5),gust=Number.isFinite(prediction.gust)?Math.max(day.wind,day.gust+clamp(Number(prediction.gust)-day.gust,-8,8)):day.gust;
  if(Math.abs(max-day.max)<.05&&Math.abs(min-day.min)<.05&&Math.abs(gust-day.gust)<.05)return day;
  changed=true;
  // Best Match bleibt auch bei aktivem Wetterzwilling das vollständige Wetterbündel:
  // Niederschlag, Wahrscheinlichkeit, Wettercode und Sonnenschein werden weder
  // aus einem anderen Modell übernommen noch über mehrere Modelle gemischt.
  // Der lokale Lernkreis darf ausschließlich belegte thermische und Wind-Biases
  // begrenzt nachkorrigieren; Radar-/Blitz-Nowcasting erfolgt anschließend stündlich.
  return{...day,max,min,gust,weatherSourceId:day.weatherSourceId,weatherSourceLabel:day.weatherSourceLabel};
 });
 return changed?result:days;
}
export function applyLocalTwinForecast(locationKey:string,days:Day[],ensemble:EnsembleDay[],radar?:RadarNowcast|null,location?:Location){const settings=readWeatherTwinSettings();if(!settings.enabled||!settings.useAsMainForecast)return days;const report=buildForecastVerificationReport(locationKey,days,ensemble,location);return applyLocalTwinForecastFromReport(days,report,radar)}
export function applyLocalTwinHours(locationKey:string,hours:Hour[],rawDays:Day[],adjustedDays:Day[],_radar?:RadarNowcast|null){
 const settings=readWeatherTwinSettings();if(!locationKey||!settings.enabled||!settings.useAsMainForecast)return hours;
 const now=Date.now(),hasTwinAdjustment=adjustedDays!==rawDays,rawByDate=new Map(rawDays.map(day=>[day.date,day])),adjustedByDate=new Map(adjustedDays.map(day=>[day.date,day]));
 const locallyAdjusted=hasTwinAdjustment?hours.map(hour=>{
  if(hour.epoch<=now)return hour;const date=hour.time.slice(0,10),raw=rawByDate.get(date),adjusted=adjustedByDate.get(date);if(!raw||!adjusted)return hour;
  const temperatureShift=((adjusted.max-raw.max)+(adjusted.min-raw.min))/2,gustScale=raw.gust>1?clamp(adjusted.gust/raw.gust,.65,1.5):1;
  // Der Wetterzwilling korrigiert ausschließlich lokal belegte Temperatur- und
  // Wind-Biases und verschiebt keine Regenwahrscheinlichkeit über den gesamten Tag.
  // Die Niederschlagsassimilation erfolgt anschließend zentral über
  // denselben radar-/modellbasierten Blend wie in der operativen Hauptprognose.
  return{...hour,temperature:hour.temperature+temperatureShift,apparent:hour.apparent+temperatureShift,gust:Math.max(hour.wind,hour.gust*gustScale)};
 }):hours;
 // Radar-/Konvektiv-Nowcast wird nicht mehr innerhalb des Wetterzwillings
 // ein zweites Mal angewendet. Alle operativen Stundenpfade laufen anschließend
 // durch finalizeForecastHours(); der Schalter steuert nur, ob Radarbeobachtungen
 // in den lokalen Lern-/Rückblickkreis aufgenommen werden.
 return locallyAdjusted;
}

function activityLabel(activity:TwinActivity){return({commute:'Arbeitsweg',outdoor:'Outdoor',garden:'Garten',rowing:'Rudern',dog:'Hundespaziergang',ski:'Berg-/Wintersport',heat:'Hitzeschutz'} as Record<TwinActivity,string>)[activity]}
function hourScore(hour:Hour,profile:ActivityProfile){let score=100;score-=Math.max(0,hour.probability-profile.maxRainProbability)*1.4;score-=Math.max(0,hour.gust-profile.maxGustKt)*2.2;if(hour.temperature<profile.minTemperature)score-=(profile.minTemperature-hour.temperature)*4;if(hour.temperature>profile.maxTemperature)score-=(hour.temperature-profile.maxTemperature)*4;if(hour.precipitation>=1)score-=22;if(hour.cape>=700)score-=28;return clamp(score,0,100)}
function bestActivityWindow(hours:Hour[],profile:ActivityProfile){const future=hours.filter(hour=>hour.epoch>=Date.now()).slice(0,36),length=Math.max(1,Math.round(profile.minimumWindowHours)),candidates=[] as {index:number;score:number}[];for(let index=0;index+length<=future.length;index++){const slice=future.slice(index,index+length),score=slice.reduce((sum,hour)=>sum+hourScore(hour,profile),0)/slice.length;candidates.push({index,score})}const best=candidates.sort((a,b)=>b.score-a.score)[0];if(!best)return null;const slice=future.slice(best.index,best.index+length),start=slice[0],end=slice.at(-1),endEpoch=(end?.epoch??start?.epoch??Date.now())+3600000;return{score:best.score,start,endEpoch,hours:slice}}
export function buildTwinRecommendations(locationKey:string,hours:Hour[],radar?:RadarNowcast|null){const settings=readWeatherTwinSettings();if(!settings.enabled||!settings.personalRecommendations)return[];const feedback=readFeedback(locationKey),recommendations:TwinRecommendation[]=[];for(const activity of Object.keys(settings.activities) as TwinActivity[]){const profile=settings.activities[activity];if(!profile.enabled)continue;const best=bestActivityWindow(hours,profile);if(!best)continue;const history=feedback[`activity:${activity}`],feedbackTotal=(history?.helpful??0)+(history?.notHelpful??0),feedbackAdjustment=feedbackTotal>=3?clamp(((history!.helpful/feedbackTotal)-.5)*12,-6,6):0,score=clamp(best.score+feedbackAdjustment,0,100),assessment=score>=72?'good':score>=45?'limited':'poor',reasons:string[]=[];const maxRain=Math.max(...best.hours.map(hour=>hour.probability)),maxGust=Math.max(...best.hours.map(hour=>hour.gust)),temperatures=best.hours.map(hour=>hour.temperature);if(maxRain>profile.maxRainProbability)reasons.push(`Regenwahrscheinlichkeit bis ${Math.round(maxRain)} %`);else reasons.push('Niederschlagsrisiko im gewählten Fenster gering');if(maxGust>profile.maxGustKt)reasons.push(`Böen bis ${Math.round(maxGust)} kt`);if(Math.max(...temperatures)>profile.maxTemperature)reasons.push(`Temperatur bis ${Math.round(Math.max(...temperatures))} °C`);if(Math.min(...temperatures)<profile.minTemperature)reasons.push(`Temperatur bis ${Math.round(Math.min(...temperatures))} °C`);if(radar&&radar.source!=='model'&&radar.coverage!==false&&finite(radar.arrivalMinutes,999)<=120&&radar.radarProbability>=40)reasons.push(`Radarecho kann in ${Math.max(0,Math.round(finite(radar.arrivalMinutes)))} Minuten relevant werden`);if(feedbackTotal>=3)reasons.push(`Persönliche Rückmeldungen aus ${feedbackTotal} Bewertungen berücksichtigt`);const id=`${activity}:${best.start?.time??'none'}`,confidence: TwinConfidence=feedbackTotal>=5?'high':hours.length>=24?'medium':'low',startLabel=best.start?formatDisplayDateTime(best.start.epoch,undefined,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}):'',endLabel=formatDisplayDateTime(best.endEpoch,undefined,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'});recommendations.push({id,activity,title:activityLabel(activity),assessment,window:`${startLabel}–${endLabel}`,confidence,reasons,score})}return recommendations.sort((a,b)=>b.score-a.score)}
function readFeedback(locationKey:string):FeedbackStore{try{return JSON.parse(localStorage.getItem(feedbackKey(locationKey))||'{}') as FeedbackStore}catch{return{}}}
export function recordTwinRecommendationFeedback(locationKey:string,recommendationId:string,helpful:boolean){const store=readFeedback(locationKey),activity=String(recommendationId).split(':')[0] as TwinActivity,key=(Object.keys(defaultActivities()) as TwinActivity[]).includes(activity)?`activity:${activity}`:recommendationId,row=store[key]??{helpful:0,notHelpful:0};if(helpful)row.helpful++;else row.notHelpful++;row.lastAt=new Date().toISOString();store[key]=row;localStorage.setItem(feedbackKey(locationKey),JSON.stringify(store));return row}
