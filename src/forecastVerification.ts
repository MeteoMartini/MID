import type {Day,EnsembleDay,Hour,Location,RadarNowcast,Station} from './weather';

const PREFIX='mid:forecast-verification:v3:';
const LEGACY_PREFIXES=['mid:forecast-verification:v2:','mid:forecast-verification:v1:'];
const PROFILE_PREFIX='mid:weather-twin:profile:v1:';
export const WEATHER_TWIN_SETTINGS_KEY='mid:weather-twin:settings:v1';
const FEEDBACK_PREFIX='mid:weather-twin:feedback:v1:';
const MAX_CAPTURES=720;
const MAX_REFERENCES=370;
const MAX_OBSERVATIONS=2400;
const HORIZONS=[12,24,48,72] as const;
const REGIMES=['hochdruck','wechselhaft','front','konvektiv','schauer','dauerregen','gewitter','sturm','winterlich','inversion','foehn'] as const;

export type ForecastHorizon=typeof HORIZONS[number];
export type WeatherRegime=typeof REGIMES[number];
export type ForecastParameter='temperature'|'precipitation'|'probability'|'gust'|'sunshine';
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

export type ForecastCapture={
 id:string;
 targetDate:string;
 issuedAt:string;
 leadHours:number;
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
 parameterWeights:Partial<Record<ForecastParameter,number>>;
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
 currentForecasts:LocalWeightedForecast[];
 parameterLeaders:Partial<Record<ForecastParameter,ForecastModelScore>>;
 calibrations:ProbabilityCalibrationBin[];
 biases:BiasCorrection[];
 siteProfile:TwinSiteProfile;
 health:TwinHealth;
 archiveUpdatedAt:string;
};

export type LiveTwinContext={station?:Station|null;radar?:RadarNowcast|null;currentHour?:Hour|null};
export type PrivateSensorSample={timestamp?:string;temperature?:number;precipitation?:number;precipitationRate?:number;gust?:number;cloudCover?:number;label?:string};

type Evaluation={date:string;capture:ForecastCapture;reference:ForecastReference;horizon:ForecastHorizon;regime:WeatherRegime};
type ParamAccumulator={sum:number;count:number};
type RawStat={id:string;label:string;days:number;parameters:Record<ForecastParameter,ParamAccumulator>};
type FeedbackStore=Record<string,{helpful:number;notHelpful:number;lastAt?:string}>;

const DB_NAME='mid-weather-twin-archive';
const DB_STORE='locations';

function finite(value:unknown,fallback=0){const number=Number(value);return Number.isFinite(number)?number:fallback}
function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function confidenceFromSamples(samples:number):TwinConfidence{return samples>=18?'high':samples>=6?'medium':'low'}
function storeKey(locationKey:string){return`${PREFIX}${locationKey}`}
function profileKey(locationKey:string){return`${PROFILE_PREFIX}${locationKey}`}
function feedbackKey(locationKey:string){return`${FEEDBACK_PREFIX}${locationKey}`}
function emptyStore():Store{return{version:3,updatedAt:new Date().toISOString(),captures:[],references:[],observations:[]}}
function dateNoon(date:string){const match=date.match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12):NaN}
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
export function readWeatherTwinSettings():WeatherTwinSettings{try{const parsed=JSON.parse(localStorage.getItem(WEATHER_TWIN_SETTINGS_KEY)||'{}') as Partial<WeatherTwinSettings>;return{enabled:parsed.enabled!==false,useAsMainForecast:Boolean(parsed.useAsMainForecast),nowcastAssimilation:parsed.nowcastAssimilation!==false,probabilityCalibration:parsed.probabilityCalibration!==false,biasCorrection:parsed.biasCorrection!==false,personalRecommendations:parsed.personalRecommendations!==false,privateSensorUrl:String(parsed.privateSensorUrl||''),privateSensorLabel:String(parsed.privateSensorLabel||'Privater Sensor'),activities:mergedActivities(parsed.activities)}}catch{return{enabled:true,useAsMainForecast:false,nowcastAssimilation:true,probabilityCalibration:true,biasCorrection:true,personalRecommendations:true,privateSensorUrl:'',privateSensorLabel:'Privater Sensor',activities:defaultActivities()}}}
export function writeWeatherTwinSettings(change:Partial<WeatherTwinSettings>){const current=readWeatherTwinSettings(),next={...current,...change,activities:mergedActivities({...current.activities,...(change.activities??{})})};localStorage.setItem(WEATHER_TWIN_SETTINGS_KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent('mid:weather-twin-settings',{detail:next}));return next}

function inferredTerrain(location:Location):TwinTerrain{const elevation=finite(location.elevation,0),poi=String(location.poiType||location.poiCategory||'').toLowerCase();if(/coast|beach|sea|küste|strand/.test(poi))return'coast';if(/peak|gipfel|ridge|kamm/.test(poi)||elevation>=1800)return'ridge';if(/valley|tal/.test(poi))return'valley';if(elevation>=450)return'slope';return'plain'}
export function defaultTwinSiteProfile(locationKey:string,location:Location):TwinSiteProfile{const terrain=inferredTerrain(location),urbanClass=location.urbanClass??'unknown',elevation=finite(location.elevation,0);return{locationKey,updatedAt:new Date().toISOString(),elevation,terrain,exposure:terrain==='ridge'?'exposed':terrain==='valley'?'sheltered':'neutral',urbanClass,coldPoolRisk:terrain==='valley'?'high':terrain==='plain'?'medium':'low',fogRisk:terrain==='valley'||terrain==='coast'?'high':urbanClass==='rural'?'medium':'low',waterInfluence:terrain==='coast',manual:false,confidence:Number.isFinite(location.elevation)?'medium':'low'}}
export function readTwinSiteProfile(locationKey:string,location:Location):TwinSiteProfile{try{const parsed=JSON.parse(localStorage.getItem(profileKey(locationKey))||'null') as Partial<TwinSiteProfile>|null;if(parsed)return{...defaultTwinSiteProfile(locationKey,location),...parsed,locationKey};const initial=defaultTwinSiteProfile(locationKey,location);localStorage.setItem(profileKey(locationKey),JSON.stringify(initial));return initial}catch{return defaultTwinSiteProfile(locationKey,location)}}
export function updateTwinSiteProfile(locationKey:string,location:Location,change:Partial<TwinSiteProfile>){const next={...readTwinSiteProfile(locationKey,location),...change,locationKey,updatedAt:new Date().toISOString(),manual:true} satisfies TwinSiteProfile;localStorage.setItem(profileKey(locationKey),JSON.stringify(next));window.dispatchEvent(new CustomEvent('mid:weather-twin-profile',{detail:next}));return next}

function inferRegime(value:{weatherCode?:number;precipitation:number;gust?:number;sunshineDuration?:number;min?:number;max?:number;wind?:number},profile?:TwinSiteProfile):WeatherRegime{const code=Math.round(finite(value.weatherCode,0)),precipitation=Math.max(0,finite(value.precipitation)),gust=finite(value.gust,0),sunshine=finite(value.sunshineDuration,NaN),minimum=finite(value.min,10),maximum=finite(value.max,minimum),wind=finite(value.wind,0);if([95,96,97,99].includes(code))return'gewitter';if(gust>=34)return'sturm';if([71,73,75,77,85,86].includes(code)||(minimum<=1&&precipitation>=.2))return'winterlich';if(precipitation>=5||[63,65].includes(code))return'dauerregen';if([80,81,82].includes(code))return'konvektiv';if([51,53,55,61].includes(code)||precipitation>=.5)return wind>=12?'front':'schauer';if(profile?.terrain==='valley'&&minimum<=5&&maximum-minimum>=10&&precipitation<.1)return'inversion';if(profile&&['slope','valley'].includes(profile.terrain)&&gust>=22&&precipitation<.2&&maximum-minimum>=9)return'foehn';if((Number.isFinite(sunshine)&&sunshine>=7*3600&&precipitation<.2)||[0,1].includes(code)&&precipitation<.2)return'hochdruck';return'wechselhaft'}
export function weatherRegimeLabel(regime:WeatherRegime){return({hochdruck:'Hochdruck / sonnig',wechselhaft:'wechselhaft',front:'Frontdurchgang',konvektiv:'konvektive Schauerlage',schauer:'Schauerlage',dauerregen:'Dauerregenlage',gewitter:'Gewitterlage',sturm:'Sturmlage',winterlich:'winterliche Lage',inversion:'Inversionslage',foehn:'Föhn-/Staulage'} as Record<WeatherRegime,string>)[regime]}

function migrateReference(reference:any):ForecastReference{const source=String(reference.source||'Rückblick'),era5=source.includes('ERA5'),kind=(reference.kind??(era5?'reanalysis':'model-fallback')) as ObservationKind,row={...reference,max:finite(reference.max,NaN),min:finite(reference.min,NaN),precipitation:Math.max(0,finite(reference.precipitation,NaN)),source,quality:clamp(finite(reference.quality,era5?.72:.32),0,1),kind,sources:Array.isArray(reference.sources)?reference.sources:[]} as ForecastReference;row.regime=REGIMES.includes(reference.regime)?reference.regime:inferRegime(row);row.confidence=reference.confidence??(row.quality>=.8?'high':row.quality>=.55?'medium':'low');if(!row.sources.length)row.sources=[{id:row.kind,label:row.source,kind:row.kind,quality:row.quality}];return row}
function migrateStore(value:any):Store{const source=value&&Array.isArray(value.captures)&&Array.isArray(value.references)?value:emptyStore();return{version:3,updatedAt:String(source.updatedAt||new Date().toISOString()),captures:source.captures.map((capture:any,index:number)=>({...capture,id:String(capture.id||`${capture.targetDate}:${capture.issuedAt}:${index}`),predictions:Array.isArray(capture.predictions)?capture.predictions:[]})).filter((capture:ForecastCapture)=>capture.targetDate&&capture.issuedAt),references:source.references.map(migrateReference).filter((row:ForecastReference)=>row.date&&[row.max,row.min,row.precipitation].every(Number.isFinite)),observations:Array.isArray(source.observations)?source.observations.filter((row:TwinLiveObservation)=>row?.timestamp&&row?.date&&row?.source):[]}}

function readStore(locationKey:string):Store{try{const current=localStorage.getItem(storeKey(locationKey));let raw=current;for(const prefix of LEGACY_PREFIXES)if(!raw)raw=localStorage.getItem(`${prefix}${locationKey}`);const store=migrateStore(JSON.parse(raw||'null'));if(!current&&raw)saveStore(locationKey,store);return store}catch{return emptyStore()}}
function openArchiveDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB nicht verfügbar'));return}const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DB_STORE))request.result.createObjectStore(DB_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function mirrorStore(locationKey:string,store:Store){try{const db=await openArchiveDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(store,locationKey);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}catch{}}
export async function restoreForecastVerificationArchive(locationKey:string){try{const local=readStore(locationKey);if(local.captures.length||local.references.length)return false;const db=await openArchiveDb(),archived=await new Promise<Store|null>((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly'),request=tx.objectStore(DB_STORE).get(locationKey);request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error)});db.close();if(!archived)return false;saveStore(locationKey,migrateStore(archived));return true}catch{return false}}
function saveStore(locationKey:string,store:Store){const compact={...store,version:3 as const,updatedAt:new Date().toISOString(),captures:store.captures.slice(-MAX_CAPTURES),references:store.references.slice(-MAX_REFERENCES),observations:store.observations.slice(-MAX_OBSERVATIONS)};try{localStorage.setItem(storeKey(locationKey),JSON.stringify(compact))}catch{}void mirrorStore(locationKey,compact)}

function stationQuality(station:Station){const base=station.networkClass==='official'?.94:station.networkClass==='professional'?.86:station.networkClass==='pws'?.62:station.networkClass==='citizen'?.5:.68,trust=Number.isFinite(station.trustFactor)?clamp(Number(station.trustFactor),0,1):base,distancePenalty=Number.isFinite(station.distance)?Math.min(.22,Number(station.distance)/130):0;return clamp((trust+base)/2-distancePenalty,0.3,.97)}
export function recordLiveTwinObservation(locationKey:string,location:Location,context:LiveTwinContext){if(!readWeatherTwinSettings().enabled||!locationKey)return;const station=context.station,current=context.currentHour,radar=context.radar,timestamp=station?.timestamp||radar?.observedAt||current?.time||new Date().toISOString(),time=Date.parse(timestamp);if(!Number.isFinite(time))return;const slot=Math.floor(time/(15*60000)),store=readStore(locationKey),stationSource:ObservationSource|undefined=station?{id:`station:${station.stationId||station.name}`,label:`${station.provider||'Messnetz'} · ${station.name}`,kind:'measured',quality:stationQuality(station),timestamp:station.timestamp,distanceKm:station.distance,detail:station.analysisMethod}:undefined,radarSource:ObservationSource|undefined=radar&&radar.source!=='model'?{id:`radar:${radar.source}`,label:radar.provider,kind:'analysed',quality:radar.quality==='high'?.9:radar.quality==='medium'?.74:.55,timestamp:radar.observedAt,detail:radar.summary}:undefined,source=stationSource??radarSource??{id:'best-match-live',label:'Best Match Livewert',kind:'model-fallback',quality:.28},observation:TwinLiveObservation={id:`${slot}:${source.id}`,timestamp:new Date(time).toISOString(),date:(current?.time?.slice(0,10)||new Date(time).toISOString().slice(0,10)),temperature:Number.isFinite(station?.temperature)?Number(station!.temperature):Number.isFinite(current?.temperature)?Number(current!.temperature):undefined,precipitationRate:Number.isFinite(radar?.currentRate)?Math.max(0,Number(radar!.currentRate)):undefined,precipitationIncrement:Number.isFinite(station?.precipitation)?Math.max(0,Number(station!.precipitation)):undefined,gust:Number.isFinite(station?.windGust)?Number(station!.windGust):Number.isFinite(current?.gust)?Number(current!.gust):undefined,cloudCover:Number.isFinite(station?.cloudCover)?Number(station!.cloudCover):Number.isFinite(current?.cloud)?Number(current!.cloud):undefined,source};const index=store.observations.findIndex(row=>row.id===observation.id);if(index>=0)store.observations[index]=observation;else store.observations.push(observation);saveStore(locationKey,store);void location}
export function recordCustomSensorObservation(locationKey:string,sample:PrivateSensorSample){const timestamp=sample.timestamp||new Date().toISOString(),time=Date.parse(timestamp);if(!locationKey||!Number.isFinite(time))return false;const store=readStore(locationKey),slot=Math.floor(time/(10*60000)),source:ObservationSource={id:'private-sensor',label:sample.label||readWeatherTwinSettings().privateSensorLabel||'Privater Sensor',kind:'private-sensor',quality:.88,timestamp:new Date(time).toISOString()},row:TwinLiveObservation={id:`private:${slot}`,timestamp:new Date(time).toISOString(),date:new Date(time).toISOString().slice(0,10),temperature:Number.isFinite(sample.temperature)?Number(sample.temperature):undefined,precipitationIncrement:Number.isFinite(sample.precipitation)?Math.max(0,Number(sample.precipitation)):undefined,precipitationRate:Number.isFinite(sample.precipitationRate)?Math.max(0,Number(sample.precipitationRate)):undefined,gust:Number.isFinite(sample.gust)?Math.max(0,Number(sample.gust)):undefined,cloudCover:Number.isFinite(sample.cloudCover)?clamp(Number(sample.cloudCover),0,100):undefined,source};const index=store.observations.findIndex(item=>item.id===row.id);if(index>=0)store.observations[index]=row;else store.observations.push(row);saveStore(locationKey,store);return true}
export async function fetchPrivateSensorObservation(locationKey:string,signal?:AbortSignal){const settings=readWeatherTwinSettings(),url=settings.privateSensorUrl.trim();if(!url)return false;const response=await fetch(url,{signal,cache:'no-store',headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Privater Sensor HTTP ${response.status}`);const data=await response.json() as Record<string,unknown>;return recordCustomSensorObservation(locationKey,{timestamp:String(data.timestamp||data.time||new Date().toISOString()),temperature:finite(data.temperature,NaN),precipitation:finite(data.precipitation,NaN),precipitationRate:finite(data.precipitationRate??data.rainRate,NaN),gust:finite(data.gust??data.windGust,NaN),cloudCover:finite(data.cloudCover,NaN),label:settings.privateSensorLabel})}

function aggregateLiveReferences(store:Store){const today=new Date().toISOString().slice(0,10),groups=new Map<string,TwinLiveObservation[]>();for(const row of store.observations){if(row.date>=today)continue;const list=groups.get(row.date)??[];list.push(row);groups.set(row.date,list)}const references:ForecastReference[]=[];for(const[date,rows]of groups){const ordered=[...rows].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)),temperatures=ordered.map(row=>row.temperature).filter(Number.isFinite) as number[],gusts=ordered.map(row=>row.gust).filter(Number.isFinite) as number[],start=Date.parse(ordered[0]?.timestamp||''),end=Date.parse(ordered.at(-1)?.timestamp||''),coverageHours=Number.isFinite(start)&&Number.isFinite(end)?(end-start)/3600000:0;if(temperatures.length<6||coverageHours<6)continue;let precipitation=0;for(let index=0;index<ordered.length;index++){const row=ordered[index],next=ordered[index+1],duration=next?clamp((Date.parse(next.timestamp)-Date.parse(row.timestamp))/3600000,0,.5):.25;if(Number.isFinite(row.precipitationIncrement))precipitation+=Math.max(0,Number(row.precipitationIncrement));else if(Number.isFinite(row.precipitationRate))precipitation+=Math.max(0,Number(row.precipitationRate))*duration}const sources=uniqueSources(ordered.map(row=>row.source)),quality=clamp(sources.reduce((sum,source)=>sum+source.quality,0)/Math.max(1,sources.length)*(Math.min(1,coverageHours/18)),.35,.96),kind=sources.some(source=>source.kind==='private-sensor')?'private-sensor':sources.some(source=>source.kind==='measured')?'measured':'analysed',row:ForecastReference={date,max:Math.max(...temperatures),min:Math.min(...temperatures),precipitation,source:sources.map(source=>source.label).join(' + '),gust:gusts.length?Math.max(...gusts):undefined,regime:'wechselhaft',quality,confidence:quality>=.8?'high':quality>=.55?'medium':'low',kind,sources,coverageHours};row.regime=inferRegime(row);references.push(row)}return references}

function bestMatchPrediction(day:Day):ForecastPrediction{return{id:'best_match',label:'Open-Meteo Best Match',max:finite(day.max),min:finite(day.min),precipitation:Math.max(0,finite(day.precipitation)),probability:clamp(finite(day.probability),0,100),gust:Number.isFinite(day.gust)?day.gust:undefined,sunshineDuration:Number.isFinite(day.sunshineDuration)?day.sunshineDuration:undefined,weatherCode:day.code}}
function predictedRegime(day:Day,profile?:TwinSiteProfile):WeatherRegime{return inferRegime({weatherCode:day.code,precipitation:day.precipitation,gust:day.gust,sunshineDuration:day.sunshineDuration,min:day.min,max:day.max,wind:day.wind},profile)}
function currentPredictions(day:Day,row:EnsembleDay|undefined){return[bestMatchPrediction(day),...(row?.modelSummaries??[]).map(model=>({id:model.id,label:model.label,max:model.max,min:model.min,precipitation:model.precipitation,probability:model.precipitationProbability,gust:model.gust,sunshineDuration:model.sunshineDuration,weatherCode:model.weatherCode}))].filter(predictionValid)}

function chosenEvaluations(store:Store,beforeDate?:string){const today=new Date().toISOString().slice(0,10),references=new Map(store.references.filter(row=>!beforeDate||row.date<beforeDate).map(row=>[row.date,row])),byKey=new Map<string,ForecastCapture[]>();for(const capture of store.captures){if(capture.targetDate>=today||beforeDate&&capture.targetDate>=beforeDate||!references.has(capture.targetDate))continue;const horizon=horizonBucket(capture.leadHours),key=`${capture.targetDate}:${horizon}`,list=byKey.get(key)??[];list.push(capture);byKey.set(key,list)}const evaluations:Evaluation[]=[];for(const[key,list]of byKey){const[date,horizonText]=key.split(':'),horizon=Number(horizonText) as ForecastHorizon,capture=[...list].sort((a,b)=>Math.abs(a.leadHours-horizon)-Math.abs(b.leadHours-horizon))[0],reference=references.get(date);if(reference)evaluations.push({date,capture,reference,horizon,regime:reference.regime})}return evaluations.sort((a,b)=>b.date.localeCompare(a.date)||a.horizon-b.horizon)}

function emptyParameters():Record<ForecastParameter,ParamAccumulator>{return{temperature:{sum:0,count:0},precipitation:{sum:0,count:0},probability:{sum:0,count:0},gust:{sum:0,count:0},sunshine:{sum:0,count:0}}}
function addParameter(accumulator:ParamAccumulator,value:number){if(Number.isFinite(value)){accumulator.sum+=value;accumulator.count++}}
function modelParameterErrors(prediction:ForecastPrediction,reference:ForecastReference){const observed=reference.precipitation>=.1?1:0,probability=clamp(prediction.probability/100,0,1);return{temperature:(Math.abs(prediction.max-reference.max)+Math.abs(prediction.min-reference.min))/2,precipitation:Math.abs(prediction.precipitation-reference.precipitation),probability:(probability-observed)**2,gust:Number.isFinite(prediction.gust)&&Number.isFinite(reference.gust)?Math.abs(Number(prediction.gust)-Number(reference.gust)):NaN,sunshine:Number.isFinite(prediction.sunshineDuration)&&Number.isFinite(reference.sunshineDuration)?Math.abs(Number(prediction.sunshineDuration)-Number(reference.sunshineDuration))/3600:NaN}}
function parameterScore(parameter:ForecastParameter,error:number){if(parameter==='temperature')return error;if(parameter==='precipitation')return Math.min(4,error*.35);if(parameter==='probability')return error*3;if(parameter==='gust')return Math.min(3,error*.09);return Math.min(3,error*.28)}
function statsFor(evaluations:Evaluation[],filter?:(evaluation:Evaluation)=>boolean){const stats=new Map<string,RawStat>();for(const evaluation of evaluations){if(filter&&!filter(evaluation))continue;for(const prediction of evaluation.capture.predictions){const stat=stats.get(prediction.id)??{id:prediction.id,label:prediction.label,days:0,parameters:emptyParameters()},errors=modelParameterErrors(prediction,evaluation.reference);stat.days++;for(const parameter of Object.keys(errors) as ForecastParameter[])addParameter(stat.parameters[parameter],errors[parameter]);stats.set(prediction.id,stat)}}return[...stats.values()].map(row=>{const metrics:Partial<Record<ForecastParameter,ParameterMetric>>={};for(const parameter of Object.keys(row.parameters) as ForecastParameter[]){const accumulator=row.parameters[parameter];if(accumulator.count){const error=accumulator.sum/accumulator.count;metrics[parameter]={parameter,samples:accumulator.count,error,score:parameterScore(parameter,error)}}}const temperatureMae=metrics.temperature?.error??NaN,precipitationMae=metrics.precipitation?.error??NaN,brier=metrics.probability?.error??NaN,parts=Object.values(metrics).filter(Boolean) as ParameterMetric[],score=parts.reduce((sum,item)=>sum+item.score,0)/Math.max(1,parts.length);return{id:row.id,label:row.label,days:row.days,temperatureMae,precipitationMae,brier,gustMae:metrics.gust?.error,sunshineMae:metrics.sunshine?.error,score,weight:0,confidence:confidenceFromSamples(row.days),parameterMetrics:metrics} satisfies ForecastModelScore}).sort((a,b)=>a.score-b.score)}

function modelBiases(evaluations:Evaluation[],regime:WeatherRegime,horizon:ForecastHorizon){const rows=new Map<string,{label:string;samples:number;sum:Record<ForecastParameter,number>;count:Record<ForecastParameter,number>}>();for(const evaluation of evaluations){if(evaluation.regime!==regime||evaluation.horizon!==horizon)continue;for(const prediction of evaluation.capture.predictions){if(['best_match','mid_local_weighted','equal_weighted'].includes(prediction.id))continue;const row=rows.get(prediction.id)??{label:prediction.label,samples:0,sum:{temperature:0,precipitation:0,probability:0,gust:0,sunshine:0},count:{temperature:0,precipitation:0,probability:0,gust:0,sunshine:0}};row.samples++;const temp=((prediction.max-referenceValue(evaluation.reference,'max'))+(prediction.min-referenceValue(evaluation.reference,'min')))/2;row.sum.temperature+=temp;row.count.temperature++;row.sum.precipitation+=prediction.precipitation-evaluation.reference.precipitation;row.count.precipitation++;if(Number.isFinite(prediction.gust)&&Number.isFinite(evaluation.reference.gust)){row.sum.gust+=Number(prediction.gust)-Number(evaluation.reference.gust);row.count.gust++}if(Number.isFinite(prediction.sunshineDuration)&&Number.isFinite(evaluation.reference.sunshineDuration)){row.sum.sunshine+=(Number(prediction.sunshineDuration)-Number(evaluation.reference.sunshineDuration))/3600;row.count.sunshine++}rows.set(prediction.id,row)}}return[...rows].map(([id,row])=>{const shrink=row.samples/(row.samples+5),corrections:Partial<Record<ForecastParameter,number>>={};for(const parameter of['temperature','precipitation','gust','sunshine'] as ForecastParameter[])if(row.count[parameter])corrections[parameter]=-(row.sum[parameter]/row.count[parameter])*shrink;return{id,label:row.label,regime,horizon,samples:row.samples,confidence:confidenceFromSamples(row.samples),corrections} satisfies BiasCorrection})}
function referenceValue(reference:ForecastReference,key:'max'|'min'){return reference[key]}

function calibrationBins(evaluations:Evaluation[],modelId='best_match'){const buckets=Array.from({length:5},(_,index)=>({lower:index*20,upper:(index+1)*20,samples:0,forecastSum:0,observed:0}));for(const evaluation of evaluations){const prediction=evaluation.capture.predictions.find(row=>row.id===modelId);if(!prediction)continue;const probability=clamp(prediction.probability,0,100),index=Math.min(4,Math.floor(probability/20)),bucket=buckets[index];bucket.samples++;bucket.forecastSum+=probability;bucket.observed+=evaluation.reference.precipitation>=.1?1:0}return buckets.filter(bucket=>bucket.samples).map(bucket=>{const forecastMean=bucket.forecastSum/bucket.samples,observedFrequency=100*bucket.observed/bucket.samples,shrink=bucket.samples/(bucket.samples+8),calibrated=forecastMean*(1-shrink)+observedFrequency*shrink;return{lower:bucket.lower,upper:bucket.upper,samples:bucket.samples,forecastMean,observedFrequency,calibrated} satisfies ProbabilityCalibrationBin})}
function calibratedProbability(value:number,bins:ProbabilityCalibrationBin[]){const bin=bins.find(item=>value>=item.lower&&(value<item.upper||item.upper===100));if(!bin||bin.samples<3)return value;return clamp(value+(bin.calibrated-bin.forecastMean),0,100)}

function regularizedWeights(evaluations:Evaluation[],regime:WeatherRegime,horizon:ForecastHorizon,beforeDate?:string){const eligibleEvaluations=evaluations.filter(item=>!beforeDate||item.date<beforeDate),global=statsFor(eligibleEvaluations).filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)),segment=statsFor(eligibleEvaluations,item=>item.regime===regime&&item.horizon===horizon).filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)),globalById=new Map(global.map(row=>[row.id,row])),segmentById=new Map(segment.map(row=>[row.id,row])),ids=[...new Set([...global.map(row=>row.id),...segment.map(row=>row.id)])],weighted=ids.map(id=>{const globalRow=globalById.get(id),segmentRow=segmentById.get(id),days=segmentRow?.days??0,globalScore=globalRow?.score??8,score=((segmentRow?.score??globalScore)*days+globalScore*5)/(days+5),parameterWeights:Partial<Record<ForecastParameter,number>>={};for(const parameter of['temperature','precipitation','probability','gust','sunshine'] as ForecastParameter[]){const segmentMetric=segmentRow?.parameterMetrics[parameter],globalMetric=globalRow?.parameterMetrics[parameter],segmentCount=segmentMetric?.samples??0,baseScore=globalMetric?.score??score,combined=((segmentMetric?.score??baseScore)*segmentCount+baseScore*5)/(segmentCount+5);parameterWeights[parameter]=1/Math.max(.18,combined)}return{id,label:segmentRow?.label??globalRow?.label??id,days:Math.max(days,globalRow?.days??0),score,raw:1/Math.max(.35,score),parameterWeights}}).filter(row=>row.days>=2).sort((a,b)=>a.score-b.score);if(weighted.length<2||eligibleEvaluations.length<5)return[];const total=weighted.reduce((sum,row)=>sum+row.raw,0)||1,normalized=weighted.map(row=>({...row,weight:100*row.raw/total,confidence:confidenceFromSamples(row.days)}));for(const parameter of['temperature','precipitation','probability','gust','sunshine'] as ForecastParameter[]){const parameterTotal=normalized.reduce((sum,row)=>sum+(row.parameterWeights[parameter]??0),0)||1;for(const row of normalized)row.parameterWeights[parameter]=100*(row.parameterWeights[parameter]??0)/parameterTotal}const maxWeight=Math.max(...normalized.map(row=>row.weight));if(maxWeight>58){const leader=normalized.find(row=>row.weight===maxWeight)!;const excess=leader.weight-58;leader.weight=58;const others=normalized.filter(row=>row!==leader),otherTotal=others.reduce((sum,row)=>sum+row.weight,0)||1;for(const row of others)row.weight+=excess*row.weight/otherTotal}return normalized.map(row=>({id:row.id,label:row.label,weight:row.weight,days:row.days,confidence:row.confidence,parameterWeights:row.parameterWeights} satisfies ModelWeight))}

function correctedPrediction(prediction:ForecastPrediction,bias:BiasCorrection|undefined){if(!bias)return prediction;const temperature=bias.corrections.temperature??0;return{...prediction,max:prediction.max+temperature,min:prediction.min+temperature,precipitation:Math.max(0,prediction.precipitation+(bias.corrections.precipitation??0)),gust:Number.isFinite(prediction.gust)?Math.max(0,Number(prediction.gust)+(bias.corrections.gust??0)):prediction.gust,sunshineDuration:Number.isFinite(prediction.sunshineDuration)?Math.max(0,Number(prediction.sunshineDuration)+(bias.corrections.sunshine??0)*3600):prediction.sunshineDuration}}
function weightedValue(rows:{prediction:ForecastPrediction;weight:ModelWeight}[],parameter:ForecastParameter,selector:(prediction:ForecastPrediction)=>number){const usable=rows.map(row=>({value:selector(row.prediction),weight:row.weight.parameterWeights[parameter]??row.weight.weight})).filter(row=>Number.isFinite(row.value)&&row.weight>0),total=usable.reduce((sum,row)=>sum+row.weight,0);return total?usable.reduce((sum,row)=>sum+row.value*row.weight,0)/total:NaN}
function weightedPrediction(predictions:ForecastPrediction[],weights:ModelWeight[],biases:BiasCorrection[]=[],calibrations:ProbabilityCalibrationBin[]=[]):ForecastPrediction|undefined{const byId=new Map(predictions.map(row=>[row.id,row])),biasById=new Map(biases.map(row=>[row.id,row])),usable=weights.map(weight=>{const prediction=byId.get(weight.id);return prediction?{weight,prediction:correctedPrediction(prediction,biasById.get(weight.id))}:null}).filter(Boolean) as {weight:ModelWeight;prediction:ForecastPrediction}[];if(usable.length<2)return undefined;const max=weightedValue(usable,'temperature',row=>row.max),min=weightedValue(usable,'temperature',row=>row.min),precipitation=weightedValue(usable,'precipitation',row=>row.precipitation),rawProbability=weightedValue(usable,'probability',row=>row.probability),gust=weightedValue(usable,'gust',row=>Number(row.gust)),sunshineDuration=weightedValue(usable,'sunshine',row=>Number(row.sunshineDuration));if(![max,min,precipitation,rawProbability].every(Number.isFinite))return undefined;return{id:'mid_local_weighted',label:'MID lokal gewichtet',max,min,precipitation:Math.max(0,precipitation),probability:calibratedProbability(clamp(rawProbability,0,100),calibrations),gust:Number.isFinite(gust)?Math.max(0,gust):undefined,sunshineDuration:Number.isFinite(sunshineDuration)?Math.max(0,sunshineDuration):undefined}}
function equalWeightedPrediction(predictions:ForecastPrediction[]):ForecastPrediction|undefined{const usable=predictions.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id));if(usable.length<2)return undefined;const mean=(selector:(prediction:ForecastPrediction)=>number)=>usable.map(selector).filter(Number.isFinite).reduce((sum,value)=>sum+value,0)/Math.max(1,usable.map(selector).filter(Number.isFinite).length);return{id:'equal_weighted',label:'Einfaches Multimodellmittel',max:mean(row=>row.max),min:mean(row=>row.min),precipitation:Math.max(0,mean(row=>row.precipitation)),probability:clamp(mean(row=>row.probability),0,100),gust:mean(row=>Number(row.gust)),sunshineDuration:mean(row=>Number(row.sunshineDuration))}}
function predictionDayScore(prediction:ForecastPrediction,reference:ForecastReference){const errors=modelParameterErrors(prediction,reference),scores=(Object.keys(errors) as ForecastParameter[]).map(parameter=>parameterScore(parameter,errors[parameter])).filter(Number.isFinite);return scores.reduce((sum,value)=>sum+value,0)/Math.max(1,scores.length)}

export function recordForecastCapture(locationKey:string,days:Day[],ensemble:EnsembleDay[],location?:Location){if(!readWeatherTwinSettings().enabled||!locationKey||!days.length)return;const now=Date.now(),slot=Math.floor(now/(3*3600000)),store=readStore(locationKey),ensembleByDate=new Map(ensemble.map(row=>[row.date,row])),historical=chosenEvaluations(store),profile=readTwinSiteProfile(locationKey,location??{id:0,name:locationKey,latitude:0,longitude:0});for(const day of days.slice(0,3)){const target=dateNoon(day.date),leadHours=(target-now)/3600000;if(!Number.isFinite(leadHours)||leadHours<-12||leadHours>84)continue;const regime=predictedRegime(day,profile),horizon=horizonBucket(leadHours),predictions=currentPredictions(day,ensembleByDate.get(day.date)),weights=regularizedWeights(historical,regime,horizon,day.date),settings=readWeatherTwinSettings(),biases=settings.biasCorrection?modelBiases(historical.filter(item=>item.date<day.date),regime,horizon):[],calibrations=settings.probabilityCalibration?calibrationBins(historical.filter(item=>item.date<day.date)):[],local=weightedPrediction(predictions,weights,biases,calibrations),equal=equalWeightedPrediction(predictions);if(equal)predictions.push(equal);if(local)predictions.push(local);const signature=`${day.date}:${slot}`,index=store.captures.findIndex(item=>`${item.targetDate}:${Math.floor(Date.parse(item.issuedAt)/(3*3600000))}`===signature),capture:ForecastCapture={id:signature,targetDate:day.date,issuedAt:new Date(now).toISOString(),leadHours,predictedRegime:regime,predictions};if(index>=0)store.captures[index]=capture;else store.captures.push(capture)}saveStore(locationKey,store)}

function referenceRows(data:any,source:string,kind:ObservationKind,quality:number){const daily=data?.daily??{},times=Array.isArray(daily.time)?daily.time:[];return times.map((date:string,index:number)=>{const row:ForecastReference={date:String(date),max:finite(daily.temperature_2m_max?.[index],NaN),min:finite(daily.temperature_2m_min?.[index],NaN),precipitation:Math.max(0,finite(daily.precipitation_sum?.[index],NaN)),weatherCode:finite(daily.weather_code?.[index],NaN),gust:finite(daily.wind_gusts_10m_max?.[index],NaN),sunshineDuration:finite(daily.sunshine_duration?.[index],NaN),source,regime:'wechselhaft',quality,confidence:quality>=.8?'high':quality>=.55?'medium':'low',kind,sources:[{id:`${kind}:${source}`,label:source,kind,quality}]};row.regime=inferRegime(row);return row}).filter((row:ForecastReference)=>[row.max,row.min,row.precipitation].every(Number.isFinite))}
function utcDateOffset(days:number){return new Date(Date.now()+days*86400000).toISOString().slice(0,10)}
const REFERENCE_DAILY='temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_gusts_10m_max,sunshine_duration';
async function retrospectiveBestMatchRequest(location:Location,signal?:AbortSignal){const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),timezone:'auto',past_days:'30',forecast_days:'1',models:'best_match',wind_speed_unit:'kn',daily:REFERENCE_DAILY}),response=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal,cache:'no-store'});if(!response.ok)throw new Error(`Open-Meteo Rückblick HTTP ${response.status}`);return referenceRows(await response.json(),'Open-Meteo Best-Match-Rückblick','model-fallback',.28)}
async function reanalysisReferenceRequest(location:Location,signal?:AbortSignal){const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),timezone:'auto',start_date:utcDateOffset(-120),end_date:utcDateOffset(-1),models:'era5_land',wind_speed_unit:'kn',daily:REFERENCE_DAILY});if(Number.isFinite(location.elevation))params.set('elevation',String(location.elevation));const response=await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`,{signal,cache:'no-store'});if(!response.ok)throw new Error(`Open-Meteo Reanalyse HTTP ${response.status}`);return referenceRows(await response.json(),'Open-Meteo ERA5-Land-Reanalyse','reanalysis',.72)}
async function referenceRequest(store:Store,location:Location,signal?:AbortSignal){const settled=await Promise.allSettled([retrospectiveBestMatchRequest(location,signal),reanalysisReferenceRequest(location,signal)]);if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');const fallback=settled[0].status==='fulfilled'?settled[0].value:[],reanalysis=settled[1].status==='fulfilled'?settled[1].value:[],local=aggregateLiveReferences(store);if(!fallback.length&&!reanalysis.length&&!local.length){const messages=settled.filter((row):row is PromiseRejectedResult=>row.status==='rejected').map(row=>row.reason instanceof Error?row.reason.message:String(row.reason));throw new Error(messages.join(' · ')||'Kein Rückblick verfügbar.')}const merged=new Map<string,ForecastReference>();for(const row of fallback)merged.set(row.date,row);for(const row of reanalysis){const current=merged.get(row.date);if(!current||row.quality>=current.quality)merged.set(row.date,row)}for(const row of local){const current=merged.get(row.date);if(!current||row.quality>=current.quality)merged.set(row.date,row);else merged.set(row.date,{...current,sources:uniqueSources([...current.sources,...row.sources]),source:`${current.source} + lokale Teilbeobachtung`})}return[...merged.values()].sort((a,b)=>a.date.localeCompare(b.date))}
export async function refreshForecastReferences(locationKey:string,location:Location,signal?:AbortSignal){const store=readStore(locationKey),rows=await referenceRequest(store,location,signal),byDate=new Map(store.references.map(row=>[row.date,row]));for(const row of rows){const current=byDate.get(row.date);if(!current||row.quality>=current.quality)byDate.set(row.date,row)}store.references=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-MAX_REFERENCES);saveStore(locationKey,store);return store}

function currentWeightedForecasts(days:Day[],ensemble:EnsembleDay[],evaluations:Evaluation[]):LocalWeightedForecast[]{const ensembleByDate=new Map(ensemble.map(row=>[row.date,row])),now=Date.now(),settings=readWeatherTwinSettings(),calibrations=settings.probabilityCalibration?calibrationBins(evaluations):[];return days.slice(0,3).map(day=>{const leadHours=(dateNoon(day.date)-now)/3600000,horizon=horizonBucket(leadHours),regime=predictedRegime(day),weights=regularizedWeights(evaluations,regime,horizon),biases=settings.biasCorrection?modelBiases(evaluations,regime,horizon):[],predictions=currentPredictions(day,ensembleByDate.get(day.date)),prediction=weightedPrediction(predictions,weights,biases,calibrations),equalWeighted=equalWeightedPrediction(predictions),ready=Boolean(prediction),confidence=confidenceFromSamples(Math.max(0,...weights.map(row=>row.days))),explanations:string[]=[];if(ready){const leader=weights[0];if(leader)explanations.push(`${leader.label} erhält für ${weatherRegimeLabel(regime)} und +${horizon} h das höchste lokale Gewicht.`);const appliedBias=biases.find(row=>Math.abs(row.corrections.temperature??0)>=.2||Math.abs(row.corrections.precipitation??0)>=.2);if(appliedBias)explanations.push(`Lokaler Bias von ${appliedBias.label} wird mit ${appliedBias.samples} Vergleichsfällen korrigiert.`);if(calibrations.some(bin=>bin.samples>=3))explanations.push('Die Regenwahrscheinlichkeit wird anhand der lokalen Trefferhäufigkeit kalibriert.')}return{date:day.date,horizon,regime,prediction,equalWeighted,weights,ready,confidence,reason:ready?'Aus lokaler Güte, Bias, Wetterlage und Prognosehorizont abgeleitet.':'Noch zu wenige abgeschlossene Vergleichsfälle für dieses Segment.',explanations}})}

function healthReport(store:Store,evaluations:Evaluation[],currentForecasts:LocalWeightedForecast[]){const issues:string[]=[],sources=[...new Set(store.references.flatMap(row=>row.sources.map(source=>source.label)))].slice(0,6),latestReference=store.references.at(-1),age=latestReference?Date.now()-dateNoon(latestReference.date):Infinity;if(store.references.length<5)issues.push('Zu wenige unabhängige Rückblickstage.');if(store.observations.length<8)issues.push('Lokale Mess-/Analyseserie befindet sich noch in der Lernphase.');if(!currentForecasts.some(row=>row.ready))issues.push('Lokale Gewichtung für die aktuelle Wetterlage noch nicht freigegeben.');if(age>7*86400000)issues.push('Rückblicksdaten sind älter als sieben Tage.');const score=clamp(100-issues.length*22+Math.min(15,evaluations.length),10,100),status: TwinHealth['status']=score>=78?'ready':score>=48?'learning':'limited';return{status,label:status==='ready'?'Wetterzwilling belastbar':status==='learning'?'Wetterzwilling lernt':'Wetterzwilling eingeschränkt',score,issues,sources} satisfies TwinHealth}

export function buildForecastVerificationReport(locationKey:string,days:Day[]=[],ensemble:EnsembleDay[]=[],location?:Location):ForecastVerificationReport{const store=readStore(locationKey),evaluations=chosenEvaluations(store).slice(0,300),raw=statsFor(evaluations),eligible=raw.filter(row=>row.days>=Math.min(5,Math.max(2,evaluations.length))),inverse=eligible.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)).reduce((sum,row)=>sum+1/Math.max(.25,row.score),0);for(const row of raw)row.weight=inverse&&!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)&&eligible.includes(row)?100*(1/Math.max(.25,row.score))/inverse:0;const segments:ForecastSegmentScore[]=[];for(const regime of REGIMES)for(const horizon of HORIZONS){const matching=evaluations.filter(item=>item.regime===regime&&item.horizon===horizon),models=statsFor(matching);if(matching.length)segments.push({regime,horizon,days:matching.length,models,bestModel:models.find(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id))??models[0]})}segments.sort((a,b)=>b.days-a.days||a.horizon-b.horizon);const reviews:ForecastDayReview[]=evaluations.slice(0,50).map(evaluation=>{const winner=[...evaluation.capture.predictions].sort((a,b)=>predictionDayScore(a,evaluation.reference)-predictionDayScore(b,evaluation.reference))[0];return{date:evaluation.date,issuedAt:evaluation.capture.issuedAt,leadHours:evaluation.capture.leadHours,horizon:evaluation.horizon,regime:evaluation.regime,reference:evaluation.reference,bestMatch:evaluation.capture.predictions.find(row=>row.id==='best_match'),equalWeighted:evaluation.capture.predictions.find(row=>row.id==='equal_weighted'),localWeighted:evaluation.capture.predictions.find(row=>row.id==='mid_local_weighted'),winner:winner?raw.find(score=>score.id===winner.id):undefined}}),bestMatch=raw.find(row=>row.id==='best_match'),weighted=raw.find(row=>row.id==='mid_local_weighted'),equal=raw.find(row=>row.id==='equal_weighted'),currentForecasts=currentWeightedForecasts(days,ensemble,evaluations),uniqueDays=new Set(evaluations.map(item=>item.date)).size,parameterLeaders:Partial<Record<ForecastParameter,ForecastModelScore>>={};for(const parameter of['temperature','precipitation','probability','gust','sunshine'] as ForecastParameter[]){parameterLeaders[parameter]=raw.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)&&row.parameterMetrics[parameter]).sort((a,b)=>(a.parameterMetrics[parameter]?.score??Infinity)-(b.parameterMetrics[parameter]?.score??Infinity))[0]}const siteProfile=readTwinSiteProfile(locationKey,location??{id:0,name:locationKey,latitude:0,longitude:0}),biases=REGIMES.flatMap(regime=>HORIZONS.flatMap(horizon=>modelBiases(evaluations,regime,horizon))).filter(row=>row.samples>=2).sort((a,b)=>b.samples-a.samples).slice(0,30),calibrations=calibrationBins(evaluations),health=healthReport(store,evaluations,currentForecasts);return{days:uniqueDays,samples:evaluations.length,models:raw,segments,reviews,bestModel:raw.find(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id))??raw[0],rainBrier:bestMatch?.brier,temperatureMae:bestMatch?.temperatureMae,weightingReady:uniqueDays>=5&&eligible.filter(row=>!['best_match','mid_local_weighted','equal_weighted'].includes(row.id)).length>=2,weightedScore:weighted?.score,equalWeightedScore:equal?.score,bestMatchScore:bestMatch?.score,weightedImprovement:weighted&&bestMatch?100*(bestMatch.score-weighted.score)/Math.max(.1,bestMatch.score):undefined,currentForecasts,parameterLeaders,calibrations,biases,siteProfile,health,archiveUpdatedAt:store.updatedAt}}

function nowcastAdjustedPrediction(prediction:ForecastPrediction,radar?:RadarNowcast|null){if(!radar||radar.source==='model'||radar.coverage===false)return{prediction,explanation:''};const arrival=finite(radar.arrivalMinutes,999),withinWindow=arrival<=180,radarProbability=clamp(finite(radar.radarProbability,0),0,100);if(!withinWindow&&radarProbability<20)return{prediction,explanation:''};const quality=radar.quality==='high'?.7:radar.quality==='medium'?.5:.3,probability=clamp(prediction.probability*(1-quality)+radarProbability*quality,0,100),rate=Math.max(0,finite(radar.currentRate,finite(radar.peakRate,0))),duration=Math.max(.25,Math.min(2,finite(radar.endMinutes,60)/60)),precipitation=Math.max(prediction.precipitation,rate*duration*.55);return{prediction:{...prediction,probability,precipitation},explanation:`Radar-/Nowcast-Signal (${radar.provider}) wurde für die ersten Stunden mit ${Math.round(quality*100)} % einbezogen.`}}
export function applyLocalTwinForecast(locationKey:string,days:Day[],ensemble:EnsembleDay[],radar?:RadarNowcast|null){const settings=readWeatherTwinSettings();if(!settings.enabled||!settings.useAsMainForecast)return days;const report=buildForecastVerificationReport(locationKey,days,ensemble),byDate=new Map(report.currentForecasts.map(row=>[row.date,row]));let changed=false;const result=days.map((day,index)=>{const row=byDate.get(day.date);if(!row?.prediction)return day;const adjusted=index===0&&settings.nowcastAssimilation?nowcastAdjustedPrediction(row.prediction,radar).prediction:row.prediction;changed=true;return{...day,max:adjusted.max,min:adjusted.min,precipitation:adjusted.precipitation,probability:adjusted.probability,gust:Number.isFinite(adjusted.gust)?Number(adjusted.gust):day.gust,sunshineDuration:Number.isFinite(adjusted.sunshineDuration)?Number(adjusted.sunshineDuration):day.sunshineDuration}});return changed?result:days}
export function applyLocalTwinHours(locationKey:string,hours:Hour[],rawDays:Day[],adjustedDays:Day[],radar?:RadarNowcast|null){const settings=readWeatherTwinSettings();if(!locationKey||!settings.enabled||!settings.useAsMainForecast||adjustedDays===rawDays)return hours;const rawByDate=new Map(rawDays.map(day=>[day.date,day])),adjustedByDate=new Map(adjustedDays.map(day=>[day.date,day])),now=Date.now();return hours.map(hour=>{if(hour.epoch<=now)return hour;const date=hour.time.slice(0,10),raw=rawByDate.get(date),adjusted=adjustedByDate.get(date);if(!raw||!adjusted)return hour;const temperatureShift=((adjusted.max-raw.max)+(adjusted.min-raw.min))/2,precipitationScale=raw.precipitation>=.15?clamp(adjusted.precipitation/raw.precipitation,.25,3):adjusted.precipitation>=.15?1.6:1,probabilityShift=adjusted.probability-raw.probability,gustScale=raw.gust>1?clamp(adjusted.gust/raw.gust,.65,1.5):1,next={...hour,temperature:hour.temperature+temperatureShift,apparent:hour.apparent+temperatureShift,precipitation:Math.max(0,hour.precipitation*precipitationScale),rain:Math.max(0,hour.rain*precipitationScale),showers:Math.max(0,hour.showers*precipitationScale),snowfall:Math.max(0,hour.snowfall*precipitationScale),probability:clamp(hour.probability+probabilityShift,0,100),gust:Math.max(hour.wind,hour.gust*gustScale)};if(date===adjustedDays[0]?.date&&settings.nowcastAssimilation&&radar&&hour.epoch-now<=3*3600000){const quality=radar.quality==='high'?.7:radar.quality==='medium'?.5:.3,radarProbability=clamp(finite(radar.radarProbability,0),0,100);next.probability=clamp(next.probability*(1-quality)+radarProbability*quality,0,100);if(Number.isFinite(radar.currentRate))next.precipitation=Math.max(next.precipitation,Math.max(0,Number(radar.currentRate))*.25)}return next})}

function activityLabel(activity:TwinActivity){return({commute:'Arbeitsweg',outdoor:'Draußenaktivität',garden:'Garten',rowing:'Rudern',dog:'Hundespaziergang',ski:'Berg-/Wintersport',heat:'Hitzeschutz'} as Record<TwinActivity,string>)[activity]}
function hourScore(hour:Hour,profile:ActivityProfile){let score=100;score-=Math.max(0,hour.probability-profile.maxRainProbability)*1.4;score-=Math.max(0,hour.gust-profile.maxGustKt)*2.2;if(hour.temperature<profile.minTemperature)score-=(profile.minTemperature-hour.temperature)*4;if(hour.temperature>profile.maxTemperature)score-=(hour.temperature-profile.maxTemperature)*4;if(hour.precipitation>=1)score-=22;if(hour.cape>=700)score-=28;return clamp(score,0,100)}
function bestActivityWindow(hours:Hour[],profile:ActivityProfile){const future=hours.filter(hour=>hour.epoch>=Date.now()).slice(0,36),length=Math.max(1,profile.minimumWindowHours),candidates=[] as {index:number;score:number}[];for(let index=0;index+length<=future.length;index++){const slice=future.slice(index,index+length),score=slice.reduce((sum,hour)=>sum+hourScore(hour,profile),0)/slice.length;candidates.push({index,score})}const best=candidates.sort((a,b)=>b.score-a.score)[0];if(!best)return null;const slice=future.slice(best.index,best.index+length),start=slice[0],end=slice.at(-1);return{score:best.score,start,end,hours:slice}}
export function buildTwinRecommendations(locationKey:string,hours:Hour[],radar?:RadarNowcast|null){const settings=readWeatherTwinSettings();if(!settings.personalRecommendations)return[];const feedback=readFeedback(locationKey),recommendations:TwinRecommendation[]=[];for(const activity of Object.keys(settings.activities) as TwinActivity[]){const profile=settings.activities[activity];if(!profile.enabled)continue;const best=bestActivityWindow(hours,profile);if(!best)continue;const assessment=best.score>=72?'good':best.score>=45?'limited':'poor',reasons:string[]=[];const maxRain=Math.max(...best.hours.map(hour=>hour.probability)),maxGust=Math.max(...best.hours.map(hour=>hour.gust)),temperatures=best.hours.map(hour=>hour.temperature);if(maxRain>profile.maxRainProbability)reasons.push(`Regenwahrscheinlichkeit bis ${Math.round(maxRain)} %`);else reasons.push('Niederschlagsrisiko im gewählten Fenster gering');if(maxGust>profile.maxGustKt)reasons.push(`Böen bis ${Math.round(maxGust)} kt`);if(Math.max(...temperatures)>profile.maxTemperature)reasons.push(`Temperatur bis ${Math.round(Math.max(...temperatures))} °C`);if(Math.min(...temperatures)<profile.minTemperature)reasons.push(`Temperatur bis ${Math.round(Math.min(...temperatures))} °C`);if(radar&&finite(radar.arrivalMinutes,999)<=120&&radar.radarProbability>=40)reasons.push(`Radarecho kann in ${Math.max(0,Math.round(finite(radar.arrivalMinutes)))} Minuten relevant werden`);const id=`${activity}:${best.start?.time??'none'}`,history=feedback[id],confidence: TwinConfidence=history&&history.helpful+history.notHelpful>=5?'high':hours.length>=24?'medium':'low',format=(hour:Hour|undefined)=>hour?new Date(hour.epoch).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):'';recommendations.push({id,activity,title:activityLabel(activity),assessment,window:`${format(best.start)}–${format(best.end)} Uhr`,confidence,reasons,score:best.score})}return recommendations.sort((a,b)=>b.score-a.score)}
function readFeedback(locationKey:string):FeedbackStore{try{return JSON.parse(localStorage.getItem(feedbackKey(locationKey))||'{}') as FeedbackStore}catch{return{}}}
export function recordTwinRecommendationFeedback(locationKey:string,recommendationId:string,helpful:boolean){const store=readFeedback(locationKey),row=store[recommendationId]??{helpful:0,notHelpful:0};if(helpful)row.helpful++;else row.notHelpful++;row.lastAt=new Date().toISOString();store[recommendationId]=row;localStorage.setItem(feedbackKey(locationKey),JSON.stringify(store));return row}
