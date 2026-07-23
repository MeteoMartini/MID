import {fetchWorkerJson,workerBaseCandidates} from './workerClient';
import {formatDecimal} from './format';
import {formatDwdWarningDetail,formatDwdWarningValue,summarizeDwdWarnings,type DwdWarningLevel} from './dwdWarnings';
import {loadOperaRaster} from './CompositeData';
import {analyseOperaRasterNowcast} from './OperaRasterSource';
export type WindUnit='kn'|'kmh'|'ms'|'mph';
export type UrbanClass='urban'|'suburban'|'rural'|'unknown';
export type Location={id:number;name:string;latitude:number;longitude:number;elevation?:number;timezone?:string;country?:string;country_code?:string;admin1?:string;admin2?:string;postcodes?:string[];autolocated?:boolean;source?:string;poiType?:string;poiCategory?:string;featureCode?:string;population?:number;urbanClass?:UrbanClass};
export type Weather={latitude:number;longitude:number;elevation:number;timezone:string;timezone_abbreviation?:string;utc_offset_seconds?:number;current:Record<string,number|string>;hourly:Record<string,(number|string|null)[]>;daily:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>};
export type Hour={time:string;epoch:number;timezone:string;temperature:number;apparent:number;humidity:number;dewPoint:number;precipitation:number;rain:number;showers:number;snowfall:number;probability:number;code:number;wind:number;gust:number;direction:number;cloud:number;uvIndex:number;visibility:number;cape:number;isDay:boolean};
export type Minute15={time:string;epoch:number;timezone:string;precipitation:number;rain:number;showers:number;snowfall:number;probability:number;code:number};
export type Day={date:string;code:number;max:number;min:number;sunrise?:string;sunset?:string;sunshineDuration:number;precipitation:number;probability:number;wind:number;gust:number;direction:number;uvMax:number};
export type EnsembleDay={date:string;maxMean:number;maxLow:number;maxHigh:number;maxQ25:number;maxQ75:number;minMean:number;minLow:number;minHigh:number;minQ25:number;minQ75:number;precipitationMean:number;precipitationLow:number;precipitationHigh:number;precipitationProbability:number;sunshineDurationMean:number;sunshineDurationLow:number;sunshineDurationHigh:number;modelCount:number;memberCount:number};
export type ClimateDay={date:string;maxMean:number;minMean:number;years:number};
export type Station={name:string;provider?:string;stationId?:string;latitude?:number;longitude?:number;distance?:number;height?:number;timestamp?:string;temperature?:number;humidity?:number;dewPoint?:number;pressure?:number;pressureReference?:'QFF'|'MSL'|'QNH'|'station';windSpeed?:number;windDirection?:number;windGust?:number;windUnit?:'kt'|'kmh';visibility?:number;cloudCover?:number;ceilingHft?:number;cloudBaseHft?:number;precipitation?:number;stationCount?:number;sourceProviders?:string[];blended?:boolean;temperatureSpread?:number;trustFactor?:number;networkClass?:'official'|'professional'|'pws'|'citizen'|'unknown';siteClass?:UrbanClass;analysisMethod?:string;uncertainty?:number;effectiveResolutionKm?:number;candidateCount?:number;rejectedCount?:number;localCorrection?:number;backgroundModel?:string;urbanClass?:UrbanClass};
export type OfficialAlertLevel='yellow'|'orange'|'red'|'purple'|'unknown';
export type OfficialAlert={id:string;headline:string;description:string;instruction?:string;level:OfficialAlertLevel;severity?:string;event?:string;source:string;area?:string;effective?:string;onset?:string;expires?:string;url?:string};
export type ModelRunMeta={id:string;label:string;kind:'forecast'|'ensemble';initialisationTime?:string;availabilityTime?:string;updateIntervalSeconds?:number;temporalResolutionSeconds?:number};
export type BestMatchModelInfo={summary:string;likelyChain:string;runs:ModelRunMeta[]};
export type RadarNowcastQuality='high'|'medium'|'low';
export type RadarNowcast={source:'dwd'|'opera'|'rainviewer'|'model';provider:string;quality:RadarNowcastQuality;radarProbability:number;currentRate?:number;rawCurrentRate?:number;peakRate?:number;rateApproximate?:boolean;rateUncertain?:boolean;arrivalMinutes?:number;endMinutes?:number;arrivalKind?:'site'|'nearby'|'approximate';arrivalStartAt?:string;arrivalEndAt?:string;endAt?:string;endOpenEnded?:boolean;endUncertain?:boolean;observedAt?:string;summary:string;coverage?:boolean;coverageExpected?:boolean;temporaryUnavailable?:boolean;expectedSource?:string;radarLayer?:string;timeline?:string[];license?:string;diagnostics?:Record<string,unknown>};
export type Konrad3dCell={id:string;latitude:number;longitude:number;currentDistanceKm:number;relevanceDistanceKm:number;forecastDistanceKm?:number;forecastEffectiveDistanceKm?:number;forecastTime?:string;arrivalMinutes?:number;isApproaching?:boolean;severity:number;trend:number;hailFlag:number;heavyRainFlag:number;gustFlag?:number;lightningRate:number;areaHail:number;areaLargeHail:number;speedKmh:number};
export type ThunderstormNowcast={available:boolean;coverage:boolean;temporaryUnavailable?:boolean;provider:string;product?:string;observedAt?:string;ageMinutes?:number;cellsFound:number;nearbyCells:Konrad3dCell[];nearest?:Konrad3dCell;summary:string;temporalResolutionMinutes?:number;license?:string;error?:string};
export type MountainWeather={latitude:number;longitude:number;elevation:number;timezone:string;timezone_abbreviation?:string;utc_offset_seconds?:number;current:Record<string,number|string|null>;hourly:Record<string,(number|string|null)[]>};
export type MountainForecast={valley:MountainWeather;summit:MountainWeather};
export type MarineForecast={latitude:number;longitude:number;generationtime_ms?:number;utc_offset_seconds?:number;timezone:string;timezone_abbreviation?:string;current?:Record<string,number|string|null>;hourly:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>;daily?:Record<string,(number|string|null)[]>};

const COUNTRY_CODE_ALIASES:Record<string,string>={
 DE:'DE',DEUTSCHLAND:'DE',GERMANY:'DE',GERMANIA:'DE',AT:'AT',OSTERREICH:'AT',AUSTRIA:'AT',
 IT:'IT',ITALIEN:'IT',ITALY:'IT',ITALIA:'IT',FR:'FR',FRANKREICH:'FR',FRANCE:'FR',
 ES:'ES',SPANIEN:'ES',SPAIN:'ES',ESPANA:'ES',PT:'PT',PORTUGAL:'PT',
 CH:'CH',SCHWEIZ:'CH',SWITZERLAND:'CH',SUISSE:'CH',SVIZZERA:'CH',
 GB:'GB',UK:'GB',GROSSBRITANNIEN:'GB',UNITEDKINGDOM:'GB',US:'US',USA:'US',UNITEDSTATES:'US',UNITEDSTATESOFAMERICA:'US',
 NL:'NL',NIEDERLANDE:'NL',NETHERLANDS:'NL',BE:'BE',BELGIEN:'BE',BELGIUM:'BE',
 DK:'DK',DANEMARK:'DK',DENMARK:'DK',NO:'NO',NORWEGEN:'NO',NORWAY:'NO',SE:'SE',SCHWEDEN:'SE',SWEDEN:'SE',FI:'FI',FINNLAND:'FI',FINLAND:'FI',
 IE:'IE',IRLAND:'IE',IRELAND:'IE',IS:'IS',ISLAND:'IS',ICELAND:'IS',PL:'PL',POLEN:'PL',POLAND:'PL',
 CZ:'CZ',TSCHECHIEN:'CZ',CZECHIA:'CZ',SK:'SK',SLOWAKEI:'SK',SLOVAKIA:'SK',SI:'SI',SLOWENIEN:'SI',SLOVENIA:'SI',
 HR:'HR',KROATIEN:'HR',CROATIA:'HR',GR:'GR',EL:'GR',GRIECHENLAND:'GR',GREECE:'GR',HU:'HU',UNGARN:'HU',HUNGARY:'HU',
 RO:'RO',RUMANIEN:'RO',ROMANIA:'RO',BG:'BG',BULGARIEN:'BG',BULGARIA:'BG',RS:'RS',SERBIEN:'RS',SERBIA:'RS',
 BA:'BA',BOSNIENUNDHERZEGOWINA:'BA',BOSNIAANDHERZEGOVINA:'BA',ME:'ME',MONTENEGRO:'ME',MK:'MK',NORDMAZEDONIEN:'MK',NORTHMACEDONIA:'MK',
 EE:'EE',ESTLAND:'EE',ESTONIA:'EE',LV:'LV',LETTLAND:'LV',LATVIA:'LV',LT:'LT',LITAUEN:'LT',LITHUANIA:'LT',
 LU:'LU',LUXEMBURG:'LU',LUXEMBOURG:'LU',MT:'MT',MALTA:'MT',CY:'CY',ZYPERN:'CY',CYPRUS:'CY',UA:'UA',UKRAINE:'UA',
 MD:'MD',MOLDAU:'MD',MOLDOVA:'MD',IL:'IL',ISRAEL:'IL',AD:'AD',ANDORRA:'AD'
};
export function countryCodeFromLocation(value?:string){
 const raw=String(value||'').trim();if(!raw)return'';const upper=raw.toUpperCase();if(/^[A-Z]{2}$/.test(upper))return upper==='UK'?'GB':upper;
 const key=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');return COUNTRY_CODE_ALIASES[key]||'';
}

type EnsembleModel={id:string;label:string;metaId:string;resolutionKm:number;updateHours:number;maxDays:number;bbox?:[number,number,number,number]};
const ensembleModels:EnsembleModel[]=[
 {id:'icon_seamless_eps',label:'DWD ICON EPS Seamless',metaId:'dwd_icon_eps',resolutionKm:8,updateHours:3,maxDays:7.5,bbox:[-25,30,45,72]},
 {id:'icon_global_eps',label:'DWD ICON EPS Global',metaId:'dwd_icon_eps',resolutionKm:26,updateHours:12,maxDays:7.5},
 {id:'icon_eu_eps',label:'DWD ICON EPS EU',metaId:'dwd_icon_eu_eps',resolutionKm:13,updateHours:6,maxDays:5,bbox:[-25,30,45,72]},
 {id:'icon_d2_eps',label:'DWD ICON EPS D2',metaId:'dwd_icon_d2_eps',resolutionKm:2,updateHours:3,maxDays:2,bbox:[-6,43,26,58]},
 {id:'ncep_gefs_seamless',label:'NOAA GFS Ensemble Seamless',metaId:'ncep_gefs025',resolutionKm:32,updateHours:6,maxDays:35},
 {id:'ncep_gefs025',label:'NOAA GFS Ensemble 0.25°',metaId:'ncep_gefs025',resolutionKm:25,updateHours:6,maxDays:10},
 {id:'ncep_gefs05',label:'NOAA GFS Ensemble 0.5°',metaId:'ncep_gefs05',resolutionKm:50,updateHours:6,maxDays:35},
 {id:'ncep_aigefs025',label:'NOAA AIGEFS 0.25°',metaId:'ncep_aigefs025',resolutionKm:25,updateHours:6,maxDays:16},
 {id:'ecmwf_ifs025_ensemble',label:'ECMWF IFS Ensemble',metaId:'ecmwf_ifs025_ensemble',resolutionKm:25,updateHours:6,maxDays:15},
 {id:'ecmwf_aifs025_ensemble',label:'ECMWF AIFS Ensemble',metaId:'ecmwf_aifs025_ensemble',resolutionKm:25,updateHours:6,maxDays:15},
 {id:'gem_global_ensemble',label:'GEM Global Ensemble',metaId:'cmc_gem_geps',resolutionKm:25,updateHours:12,maxDays:16},
 {id:'bom_access_global_ensemble',label:'BOM ACCESS Global Ensemble',metaId:'bom_access_global_ensemble',resolutionKm:40,updateHours:6,maxDays:10},
 {id:'ukmo_global_ensemble_20km',label:'UKMO Global Ensemble',metaId:'ukmo_global_ensemble_20km',resolutionKm:20,updateHours:6,maxDays:8},
 {id:'ukmo_uk_ensemble_2km',label:'UKMO UK Ensemble',metaId:'ukmo_uk_ensemble_2km',resolutionKm:2,updateHours:1,maxDays:5,bbox:[-12,48,4,62]},
 {id:'meteoswiss_icon_ch1_ensemble',label:'MeteoSwiss ICON CH1',metaId:'meteoswiss_icon_ch1_ensemble',resolutionKm:1,updateHours:3,maxDays:1.4,bbox:[3,43,18,50]},
 {id:'meteoswiss_icon_ch2_ensemble',label:'MeteoSwiss ICON CH2',metaId:'meteoswiss_icon_ch2_ensemble',resolutionKm:2,updateHours:6,maxDays:.5,bbox:[3,43,18,50]},
 {id:'google_weathernext2_ensemble',label:'Google WeatherNext 2',metaId:'google_weathernext2_ensemble',resolutionKm:25,updateHours:12,maxDays:15}
];
const meanModelIds=[
 'dwd_icon_eps_ensemble_mean_seamless','dwd_icon_eps_ensemble_mean','dwd_icon_eu_eps_ensemble_mean','dwd_icon_d2_eps_ensemble_mean',
 'ncep_gefs_ensemble_mean_seamless','ncep_gefs025_ensemble_mean','ncep_gefs05_ensemble_mean','ncep_aigefs025_ensemble_mean','ncep_hgefs025_ensemble_mean',
 'ecmwf_ifs025_ensemble_mean','ecmwf_aifs025_ensemble_mean','cmc_gem_geps_ensemble_mean','bom_access_global_ensemble_mean',
 'ukmo_global_ensemble_mean_20km','ukmo_uk_ensemble_mean_2km','meteoswiss_icon_ch1_ensemble_mean','meteoswiss_icon_ch2_ensemble_mean','google_weathernext2_ensemble_mean'
];
function modelApplies(m:EnsembleModel,lat:number,lon:number){if(!m.bbox)return true;const[minLon,minLat,maxLon,maxLat]=m.bbox;return lon>=minLon&&lon<=maxLon&&lat>=minLat&&lat<=maxLat}

async function j<T>(url:string,signal?:AbortSignal):Promise<T>{const r=await fetch(url,{signal,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}

function parseLocalIso(value:string){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);if(!match)return null;return{year:Number(match[1]),month:Number(match[2]),day:Number(match[3]),hour:Number(match[4]),minute:Number(match[5]),second:Number(match[6]||0)}}
function partsAtEpoch(epoch:number,timeZone:string){try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch)),get=(type:string)=>Number(parts.find(x=>x.type===type)?.value);const year=get('year'),month=get('month'),day=get('day'),hour=get('hour'),minute=get('minute'),second=get('second');return[year,month,day,hour,minute,second].every(Number.isFinite)?{year,month,day,hour,minute,second}:null}catch{return null}}
function localIsoEpoch(value:string,timeZone?:string,utcOffsetSeconds=0){const local=parseLocalIso(value);if(!local)return Number.NaN;const wall=Date.UTC(local.year,local.month-1,local.day,local.hour,local.minute,local.second);if(timeZone){let epoch=wall-utcOffsetSeconds*1000;for(let i=0;i<3;i++){const actual=partsAtEpoch(epoch,timeZone);if(!actual)break;const rendered=Date.UTC(actual.year,actual.month-1,actual.day,actual.hour,actual.minute,actual.second),delta=wall-rendered;if(Math.abs(delta)<500)break;epoch+=delta}return epoch}return wall-utcOffsetSeconds*1000}

type PhotonFeature={geometry?:{type?:string;coordinates?:number[]};properties?:Record<string,any>};
function numeric(value:unknown){if(value===null||value===undefined||value==='')return undefined;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)?n:undefined}
function poiCategory(key?:string,value?:string){const k=String(key||'').toLowerCase(),v=String(value||'').toLowerCase();if(k==='natural'&&v==='peak')return'Berggipfel';if(k==='tourism'&&['hotel','motel','hostel','guest_house','chalet','apartment','camp_site','alpine_hut','wilderness_hut'].includes(v))return'Unterkunft';if(k==='tourism')return'Sehenswürdigkeit';if(k==='amenity'&&['restaurant','cafe','fast_food','bar','pub'].includes(v))return'Gastronomie';if(k==='amenity')return'POI';if(k==='leisure')return'Freizeit';if(k==='aerialway')return'Bergbahn';if(k==='railway'||k==='public_transport')return'Bahnhof/Haltestelle';if(k==='shop')return'Geschäft';if(k==='place')return'Ort';if(k==='highway')return'Straße';return'POI'}
function photonId(properties:Record<string,any>,index:number){const osm=Number(properties.osm_id),type=String(properties.osm_type||'').toUpperCase(),suffix=type==='N'?1:type==='W'?2:type==='R'?3:4;if(Number.isFinite(osm)&&Math.abs(osm)<8e14)return-(Math.abs(osm)*10+suffix);let hash=2166136261;for(const ch of `${properties.name||''}:${index}:${properties.countrycode||''}`){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}return-(Math.abs(hash)+index+1)}
function urbanClassFromPlace(featureCode?:string,population?:number,osmKey?:string,osmValue?:string):UrbanClass{const code=String(featureCode||'').toUpperCase(),key=String(osmKey||'').toLowerCase(),value=String(osmValue||'').toLowerCase(),pop=Number(population);if(key==='natural'||['peak','wood','forest','farmland','meadow','village','hamlet','isolated_dwelling'].includes(value))return'rural';if(Number.isFinite(pop)&&pop>=100000)return'urban';if(Number.isFinite(pop)&&pop>=12000)return'suburban';if(['PPLC','PPLA','PPLA2','PPLA3','PPLA4','PPL'].includes(code)||['city','town'].includes(value))return'urban';if(['PPLX','PPLL'].includes(code)||['suburb','neighbourhood','quarter'].includes(value))return'suburban';if(['PPL','PPLQ','PPLR'].includes(code)||['village','hamlet'].includes(value))return'rural';return'unknown'}
function photonLocation(feature:PhotonFeature,index:number):Location|null{const coordinates=feature.geometry?.coordinates,properties=feature.properties??{},lon=Number(coordinates?.[0]),lat=Number(coordinates?.[1]);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;const name=String(properties.name||properties.city||properties.locality||'').trim();if(!name)return null;const extra=properties.extra??{},elevation=numeric(extra.ele??extra.elevation??properties.ele??properties.elevation),category=poiCategory(properties.osm_key,properties.osm_value),admin1=properties.state||properties.region,admin2=properties.county||properties.district||properties.city,urbanClass=urbanClassFromPlace(undefined,undefined,properties.osm_key,properties.osm_value);return{id:photonId(properties,index),name,latitude:lat,longitude:lon,elevation,country:properties.country,country_code:String(properties.countrycode||'').toUpperCase()||undefined,admin1:admin1?String(admin1):undefined,admin2:admin2&&String(admin2)!==String(admin1)?String(admin2):undefined,postcodes:properties.postcode?[String(properties.postcode)]:undefined,source:'OpenStreetMap/Photon',poiType:[properties.osm_key,properties.osm_value].filter(Boolean).join('='),poiCategory:category,urbanClass}}
function similarLocation(a:Location,b:Location){if(a.name.trim().toLocaleLowerCase('de-DE')!==b.name.trim().toLocaleLowerCase('de-DE'))return false;return haversine(a.latitude,a.longitude,b.latitude,b.longitude)<2500}

type ModelMetaCandidate={id:string;label:string;kind:'forecast'|'ensemble'};
type ForecastCandidate=ModelMetaCandidate&{countries?:string[];bbox?:[number,number,number,number]};
const forecastCandidates:ForecastCandidate[]=[
 {id:'dwd_icon_d2',label:'DWD ICON-D2',kind:'forecast',countries:['DE','CH','AT'],bbox:[-6,43,26,58]},
 {id:'meteoswiss_icon_ch1',label:'MeteoSwiss ICON-CH1',kind:'forecast',countries:['CH']},
 {id:'meteoswiss_icon_ch2',label:'MeteoSwiss ICON-CH2',kind:'forecast',countries:['CH']},
 {id:'geosphere_arome_austria',label:'GeoSphere AROME Austria',kind:'forecast',countries:['AT']},
 {id:'chmi_aladin_cz_1km',label:'CHMI ALADIN Tschechien 1 km',kind:'forecast',countries:['CZ']},
 {id:'chmi_aladin_central_europe_2km',label:'CHMI ALADIN Mitteleuropa 2,3 km',kind:'forecast',bbox:[-12,35,35,62]},
 {id:'chmi_aladin_seamless',label:'CHMI ALADIN Seamless',kind:'forecast',bbox:[-12,35,35,62]},
 {id:'meteofrance_arome_france_hd',label:'Météo-France AROME HD',kind:'forecast',countries:['FR']},
 {id:'meteofrance_arome_france0025',label:'Météo-France AROME',kind:'forecast',countries:['FR']},
 {id:'knmi_harmonie_arome_netherlands',label:'KNMI Harmonie Niederlande',kind:'forecast',countries:['NL','BE']},
 {id:'ukmo_uk_deterministic_2km',label:'UKMO UKV 2 km',kind:'forecast',countries:['GB','IE']},
 {id:'metno_nordic_pp',label:'MET Nordic PP',kind:'forecast',countries:['NO','SE','DK','FI']},
 {id:'dmi_harmonie_arome_europe',label:'DMI Harmonie Europe',kind:'forecast',countries:['DK','DE','NL','BE','NO','SE']},
 {id:'italia_meteo_arpae_icon_2i',label:'ItaliaMeteo ICON-2I',kind:'forecast',countries:['IT']},
 {id:'ncep_hrrr_conus',label:'NOAA HRRR',kind:'forecast',countries:['US','CA']},
 {id:'ncep_nbm_conus',label:'NOAA NBM',kind:'forecast',countries:['US','CA']},
 {id:'jma_msm',label:'JMA MSM',kind:'forecast',countries:['JP']},
 {id:'dwd_icon_eu',label:'DWD ICON-EU',kind:'forecast',bbox:[-25,30,45,72]},
 {id:'meteofrance_arpege_europe',label:'Météo-France ARPEGE Europe',kind:'forecast',bbox:[-25,30,45,72]}
];
const globalForecastCandidates:ForecastCandidate[]=[
 {id:'ecmwf_ifs',label:'ECMWF IFS HRES 9 km',kind:'forecast'},
 {id:'ncep_gfs013',label:'NOAA GFS 0.11°',kind:'forecast'},
 {id:'dwd_icon',label:'DWD ICON Global',kind:'forecast'}
];
function candidateApplies(candidate:ForecastCandidate,lat:number,lon:number,country:string){
 if(candidate.countries?.includes(country))return true;
 if(!candidate.bbox)return false;const[minLon,minLat,maxLon,maxLat]=candidate.bbox;return lon>=minLon&&lon<=maxLon&&lat>=minLat&&lat<=maxLat;
}
async function modelRunMeta(candidate:ModelMetaCandidate,signal?:AbortSignal):Promise<ModelRunMeta|null>{
 const host=candidate.kind==='ensemble'?'https://ensemble-api.open-meteo.com':'https://api.open-meteo.com';
 try{
  const data=await j<any>(`${host}/data/${candidate.id}/static/meta.json?cache_buster=${Date.now()}`,signal);
  const init=Number(data.last_run_initialisation_time),available=Number(data.last_run_availability_time);
  if(!Number.isFinite(init))return null;
  return{id:candidate.id,label:candidate.label,kind:candidate.kind,initialisationTime:new Date(init*1000).toISOString(),availabilityTime:Number.isFinite(available)?new Date(available*1000).toISOString():undefined,updateIntervalSeconds:Number(data.update_interval_seconds)||undefined,temporalResolutionSeconds:Number(data.temporal_resolution_seconds)||undefined};
 }catch{return null}
}
async function modelRunMetas(candidates:ModelMetaCandidate[],signal?:AbortSignal){
 const unique=[...new Map(candidates.map(x=>[`${x.kind}:${x.id}`,x])).values()];
 const settled=await Promise.allSettled(unique.map(x=>modelRunMeta(x,signal)));
 return settled.filter((x):x is PromiseFulfilledResult<ModelRunMeta|null>=>x.status==='fulfilled').map(x=>x.value).filter(Boolean) as ModelRunMeta[];
}
export async function bestMatchModelInfo(lat:number,lon:number,country?:string,signal?:AbortSignal):Promise<BestMatchModelInfo>{
 const code=countryCodeFromLocation(country),locals=forecastCandidates.filter(x=>candidateApplies(x,lat,lon,code)).slice(0,3),selected=[...locals,...globalForecastCandidates.slice(0,2)];
 const likelyChain=locals.length?`${locals.map(x=>x.label).join(' → ')} → Globalmodell`:'höchstaufgelöstes verfügbares Regionalmodell → Globalmodell';
 const runs=await modelRunMetas(selected,signal);
 return{summary:'Open-Meteo kombiniert automatisch die am Ort und je Variable geeignetsten Modelle; die konkrete Quelle wird in der Best-Match-Antwort nicht stundenweise ausgewiesen.',likelyChain,runs};
}
export async function searchLocations(q:string,signal?:AbortSignal){
 const query=q.trim(),openParams=new URLSearchParams({name:query,count:'8',language:'de',format:'json'}),photonParams=new URLSearchParams({q:query,lang:'de',limit:'8'});
 const tasks:Promise<Location[]>[]=[j<{results?:any[]}>(`https://geocoding-api.open-meteo.com/v1/search?${openParams}`,signal).then(x=>(x.results??[]).map((location:any)=>({...location,featureCode:String(location.feature_code||'')||undefined,population:Number.isFinite(Number(location.population))?Number(location.population):undefined,urbanClass:urbanClassFromPlace(location.feature_code,location.population),source:'Open-Meteo'} as Location))).catch(()=>[])];
 if(query.length>=3)tasks.push(j<{features?:PhotonFeature[]}>(`https://photon.komoot.io/api/?${photonParams}`,signal).then(x=>(x.features??[]).map(photonLocation).filter((location):location is Location=>!!location)).catch(()=>[]));
 const groups=await Promise.all(tasks),combined=groups.flat(),result:Location[]=[];
 for(const location of combined){if(result.some(existing=>similarLocation(existing,location)))continue;result.push(location);if(result.length>=12)break}
 return result;
}
export async function reverseLocation(lat:number,lon:number,elevation?:number,signal?:AbortSignal):Promise<Location>{const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),localityLanguage:'de'});try{const d=await j<any>(`https://api.bigdatacloud.net/data/reverse-geocode-client?${p}`,signal);const name=d.locality||d.city||d.principalSubdivision||d.countryName||`${formatDecimal(lat,2,2)}°, ${formatDecimal(lon,2,2)}°`;const admin=(d.localityInfo?.administrative??[]) as any[],admin2=admin.map((x:any)=>String(x?.name||'')).find((x:string)=>x&&x!==d.principalSubdivision&&x!==name);return{id:Date.now(),name,latitude:lat,longitude:lon,elevation,country:d.countryName,country_code:String(d.countryCode||'').toUpperCase()||undefined,admin1:d.principalSubdivision,admin2,postcodes:d.postcode?[String(d.postcode)]:undefined,autolocated:true}}catch{return{id:Date.now(),name:`${formatDecimal(lat,2,2)}°, ${formatDecimal(lon,2,2)}°`,latitude:lat,longitude:lon,elevation,autolocated:true}}}
export async function forecast(lat:number,lon:number,signal?:AbortSignal){const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',forecast_days:'14',forecast_minutely_15:'24',past_minutely_15:'4',models:'best_match',wind_speed_unit:'kn',current:['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','is_day','precipitation','weather_code','cloud_cover','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','visibility','cape','sunshine_duration'].join(','),minutely_15:['precipitation_probability','precipitation','rain','showers','snowfall','weather_code'].join(','),hourly:['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','precipitation_probability','precipitation','rain','showers','snowfall','weather_code','cloud_cover','wind_speed_10m','wind_direction_10m','wind_gusts_10m','uv_index','visibility','cape','is_day'].join(','),daily:['weather_code','temperature_2m_max','temperature_2m_min','sunrise','sunset','precipitation_sum','precipitation_probability_max','wind_speed_10m_max','wind_gusts_10m_max','wind_direction_10m_dominant','uv_index_max','sunshine_duration'].join(',')});return j<Weather>(`https://api.open-meteo.com/v1/forecast?${p}`,signal)}
export async function airQuality(lat:number,lon:number,signal?:AbortSignal){const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',current:['european_aqi','pm10','pm2_5','nitrogen_dioxide','ozone','uv_index'].join(',')});return j<{current?:Record<string,number|string>}>(`https://air-quality-api.open-meteo.com/v1/air-quality?${p}`,signal)}

export async function mountainForecast(lat:number,lon:number,valleyElevation:number,summitElevation:number,signal?:AbortSignal):Promise<MountainForecast>{
 const elevations=[Math.max(0,Math.round(valleyElevation)),Math.max(1,Math.round(summitElevation))];
 const vars=['temperature_2m','apparent_temperature','relative_humidity_2m','dew_point_2m','precipitation','rain','showers','snowfall','weather_code','cloud_cover','cloud_cover_low','visibility','freezing_level_height','wet_bulb_temperature_2m','wind_speed_10m','wind_gusts_10m','wind_direction_10m','is_day'];
 const p=new URLSearchParams({latitude:`${lat},${lat}`,longitude:`${lon},${lon}`,elevation:elevations.join(','),timezone:'auto',forecast_hours:'48',models:'best_match',wind_speed_unit:'kn',current:vars.join(','),hourly:vars.join(',')});
 const result=await j<MountainWeather[]|MountainWeather>(`https://api.open-meteo.com/v1/forecast?${p}`,signal),rows=Array.isArray(result)?result:[result];
 if(rows.length<2)throw new Error('Höhenvergleich konnte nicht geladen werden.');
 return{valley:rows[0],summit:rows[1]};
}

export async function marineForecast(lat:number,lon:number,timezone='auto',signal?:AbortSignal):Promise<MarineForecast>{
 const variables=['wave_height','wave_direction','wave_period','wave_peak_period','wind_wave_height','wind_wave_direction','wind_wave_period','wind_wave_peak_period','swell_wave_height','swell_wave_direction','swell_wave_period','swell_wave_peak_period','secondary_swell_wave_height','secondary_swell_wave_direction','secondary_swell_wave_period','sea_level_height_msl','sea_surface_temperature','ocean_current_velocity','ocean_current_direction'];
 const daily=['wave_height_max','wave_direction_dominant','wave_period_max','wind_wave_height_max','wind_wave_direction_dominant','wind_wave_period_max','wind_wave_peak_period_max','swell_wave_height_max','swell_wave_direction_dominant','swell_wave_period_max','swell_wave_peak_period_max'];
 const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:timezone||'auto',forecast_days:'8',cell_selection:'sea',wind_speed_unit:'kn',current:variables.join(','),hourly:variables.join(','),minutely_15:['sea_level_height_msl','ocean_current_velocity','ocean_current_direction'].join(','),daily:daily.join(',')});
 return j<MarineForecast>(`https://marine-api.open-meteo.com/v1/marine?${p}`,signal);
}


function haversine(lat1:number,lon1:number,lat2:number,lon2:number){const r=6371000,toRad=(x:number)=>x*Math.PI/180,dLat=toRad(lat2-lat1),dLon=toRad(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(a))}
async function brightSkyStation(lat:number,lon:number,elevation?:number,signal?:AbortSignal):Promise<Station|null>{
 try{
  const p=new URLSearchParams({lat:String(lat),lon:String(lon),max_dist:'75000'});
  const d=await j<any>(`https://api.brightsky.dev/current_weather?${p}`,signal),w=d.weather,sources=(d.sources??[]) as any[];
  if(!w||!sources.length)return null;
  const num=(v:any)=>v===null||v===undefined||v===''?undefined:(Number.isFinite(Number(v))?Number(v):undefined);
  const scored=[...sources].sort((a:any,b:any)=>stationFitScore(num(a.distance),num(a.height),elevation,0)-stationFitScore(num(b.distance),num(b.height),elevation,0));
  const byId=sources.find((x:any)=>x.id===w.source_id),s=byId??scored[0];
  const stationName=String(s.station_name||'DWD/WMO-Station'),siteClass:UrbanClass=/stadt|urban/i.test(`${stationName} ${s.observation_type||''}`)?'urban':/flughafen|airport|flugplatz/i.test(stationName)?'rural':'unknown',windSpeedKmh=num(w.wind_speed_10??w.wind_speed),windGustKmh=num(w.wind_gust_speed_10??w.wind_gust_speed);return{name:stationName,provider:'DWD Open Data / Bright Sky',stationId:s.wmo_station_id||s.dwd_station_id||s.id,latitude:num(s.lat??s.latitude),longitude:num(s.lon??s.longitude),distance:num(s.distance),height:num(s.height),timestamp:w.timestamp,temperature:num(w.temperature),humidity:num(w.relative_humidity),dewPoint:num(w.dew_point),pressure:num(w.pressure_msl),pressureReference:'QFF',windSpeed:windSpeedKmh===undefined?undefined:windSpeedKmh/1.852,windDirection:num(w.wind_direction_10??w.wind_direction),windGust:windGustKmh===undefined?undefined:windGustKmh/1.852,windUnit:'kt',visibility:num(w.visibility),cloudCover:num(w.cloud_cover),precipitation:num(w.precipitation_10??w.precipitation),trustFactor:96,networkClass:'official',siteClass};
 }catch{return null}
}

type GeoSphereMetaStation={id:string;name:string;state?:string;lat:number;lon:number;altitude?:number;is_active?:boolean};
let geoSphereMetadataPromise:Promise<GeoSphereMetaStation[]>|null=null;
function geoSphereApplies(lat:number,lon:number,country?:string){const c=String(country||'').toUpperCase();return c==='AT'||(lat>=46.35&&lat<=49.05&&lon>=9.45&&lon<=17.3)}
function arrayFromMetadata(d:any){
 const candidates=[d?.stations,d?.station_metadata,d?.metadata?.stations,d?.data?.stations,d];
 for(const c of candidates)if(Array.isArray(c))return c;
 if(d&&typeof d==='object')for(const v of Object.values(d))if(Array.isArray(v)&&(v as any[]).some(x=>x&&('lat'in x||'latitude'in x)&&('id'in x||'station_id'in x)))return v as any[];
 return[] as any[];
}
async function geoSphereMetadata(signal?:AbortSignal){
 if(!geoSphereMetadataPromise)geoSphereMetadataPromise=j<any>('https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min/metadata',signal).then(d=>arrayFromMetadata(d).map((s:any)=>({id:String(s.id??s.station_id??''),name:String(s.name??s.station_name??s.id??'GeoSphere-Station'),state:s.state,lat:Number(s.lat??s.latitude),lon:Number(s.lon??s.longitude),altitude:Number(s.altitude??s.height??s.elevation),is_active:s.is_active!==false})).filter((s:GeoSphereMetaStation)=>s.id&&Number.isFinite(s.lat)&&Number.isFinite(s.lon)&&s.is_active));
 try{return await geoSphereMetadataPromise}catch(e){geoSphereMetadataPromise=null;throw e}
}
function lastValue(v:any):number|undefined{
 const raw=v?.data??v?.values??v?.value??v;
 if(Array.isArray(raw)){for(let i=raw.length-1;i>=0;i--){const n=Number(raw[i]);if(raw[i]!==null&&raw[i]!==''&&Number.isFinite(n))return n}return undefined}
 const n=Number(raw);return raw!==null&&raw!==''&&Number.isFinite(n)?n:undefined;
}
function plausibleQff(value:number|undefined,height?:number,stationPressure?:number){
 if(!Number.isFinite(value)||Number(value)<870||Number(value)>1085)return false;
 const elevation=Number(height),surface=Number(stationPressure),qff=Number(value);
 // In Hochlagen kann ein Stationsdruck von etwa 750–900 hPa versehentlich
 // als reduzierter Druck erscheinen. QFF muss gegenüber P deutlich erhöht sein.
 if(Number.isFinite(elevation)&&elevation>=600&&qff<950)return false;
 if(Number.isFinite(elevation)&&Number.isFinite(surface)&&elevation>=150){const expectedLift=Math.min(155,Math.max(12,elevation*.055));if(qff-surface<expectedLift)return false}
 return true;
}
function geoSphereFeatures(d:any){if(Array.isArray(d?.features))return d.features;if(Array.isArray(d?.data))return d.data;if(Array.isArray(d))return d;return[]}
function geoSphereFeatureId(f:any){const station=f?.properties?.station;return String(f?.properties?.station_id??(station&&typeof station==='object'?station.id:station)??f?.station_id??f?.id??'')}
function geoSphereParam(f:any,name:string){const props=f?.properties??f;const params=props?.parameters??props?.parameter??props;return lastValue(params?.[name]??params?.[name.toLowerCase()]??params?.[name.toUpperCase()])}
function normalizeStationTimestamp(value:any):string|undefined{if(value===null||value===undefined||value==='')return undefined;let raw:any=value;if(typeof raw==='string'&&/^\d{10,13}$/.test(raw.trim()))raw=Number(raw);if(typeof raw==='number'&&Number.isFinite(raw))raw=raw<1e12?raw*1000:raw;const d=new Date(raw);return Number.isFinite(d.getTime())?d.toISOString():undefined}
function geoSphereTimestamp(d:any,f:any){const stamps=d?.timestamps??d?.time??f?.properties?.timestamps??f?.properties?.time,raw=Array.isArray(stamps)?stamps[stamps.length-1]:stamps??f?.properties?.timestamp;return normalizeStationTimestamp(raw)}
async function geoSphereStation(lat:number,lon:number,elevation?:number,signal?:AbortSignal):Promise<Station|null>{
 try{
  const meta=await geoSphereMetadata(signal);
  const nearby=meta.map(s=>({...s,distance:haversine(lat,lon,s.lat,s.lon)})).filter(s=>s.distance<=120000).sort((a,b)=>stationFitScore(a.distance,a.altitude,elevation,-18000)-stationFitScore(b.distance,b.altitude,elevation,-18000)).slice(0,10);
  if(!nearby.length)return null;
  let d:any=null,lastError:any=null;
  for(const parameters of ['TL,TP,RF,PRED,P,FF,DD,FFX,RR','TL,TP,RF,PRED,FF,DD,FFX,RR','TL,TP,RF,FF,DD,FFX,RR','TL,RR,FF']){try{const p=new URLSearchParams({parameters,station_ids:nearby.map(s=>s.id).join(','),output_format:'geojson'});d=await j<any>(`https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?${p}`,signal);break}catch(e){lastError=e}}
  if(!d)throw lastError??new Error('GeoSphere-Abruf fehlgeschlagen');
  const features=geoSphereFeatures(d),byId=new Map(nearby.map(s=>[s.id,s]));
  const parsed=features.map((f:any)=>{
   const id=geoSphereFeatureId(f),m=byId.get(id)??nearby.find(s=>String(f?.properties?.station?.name??'')===s.name);
   if(!m)return null;
   const ff=geoSphereParam(f,'FF'),ffx=geoSphereParam(f,'FFX'),temperature=geoSphereParam(f,'TL'),stationPressure=geoSphereParam(f,'P'),pred=geoSphereParam(f,'PRED'),pressure=plausibleQff(pred,m.altitude,stationPressure)?pred:undefined;
   return{name:m.name,provider:'GeoSphere Austria / TAWES',stationId:m.id,latitude:m.lat,longitude:m.lon,distance:m.distance,height:Number.isFinite(m.altitude)?m.altitude:undefined,timestamp:geoSphereTimestamp(d,f),temperature,humidity:geoSphereParam(f,'RF'),dewPoint:geoSphereParam(f,'TP'),pressure,pressureReference:pressure===undefined?undefined:'QFF',windSpeed:ff===undefined?undefined:ff*3.6/1.852,windDirection:geoSphereParam(f,'DD'),windGust:ffx===undefined?undefined:ffx*3.6/1.852,windUnit:'kt' as const,precipitation:geoSphereParam(f,'RR'),trustFactor:96,networkClass:'official',siteClass:'unknown'} as Station;
  }).filter(Boolean) as Station[];
  const best=parsed.sort((a,b)=>stationFitScore(a.distance,a.height,elevation,-18000,a.timestamp)-stationFitScore(b.distance,b.height,elevation,-18000,b.timestamp))[0]??null;
  return robustBlendStations(parsed,elevation)??best;
 }catch{return null}
}

function parseMetarRows(d:any){return(Array.isArray(d)?d:d?.data??d?.metars??d?.features?.map((f:any)=>({...f.properties,lat:f.geometry?.coordinates?.[1],lon:f.geometry?.coordinates?.[0]}))??[]) as any[]}
function stationFitScore(distance:number|undefined,height:number|undefined,targetElevation:number|undefined,providerOffset=0,timestamp?:string){
 const dist=distance??999999,terrain=Number(targetElevation??0)>=700,unknownHeight=height===undefined||!Number.isFinite(height),heightDiff=unknownHeight?0:Math.abs(Number(height)-Number(targetElevation??height)),heightPenalty=unknownHeight?(terrain?28000:9000):heightDiff*(terrain?55:28),extremePenalty=!unknownHeight&&terrain&&heightDiff>900?120000:0,age=timestamp?Math.max(0,Date.now()-new Date(timestamp).getTime()):7200000,agePenalty=Math.min(140000,age/32);return dist+heightPenalty+extremePenalty+agePenalty+providerOffset;
}
function stationProviderWeight(provider=''){
 const p=provider.toLowerCase();
 if(p.includes('geosphere')||p.includes('dwd-wmo')||p.includes('dwd open data')||p.includes('bright sky'))return 1.45;
 if(p.includes('metar')||p.includes('aviationweather'))return 1.18;
 if(p.includes('synoptic'))return 1.12;
 if(p.includes('xweather'))return 1.03;
 if(p.includes('weather underground'))return .98;
 if(p.includes('netatmo'))return .92;
 if(p.includes('opensensemap')||p.includes('sensebox'))return .48;
 return 1;
}
function isPrivateNetwork(provider=''){const p=provider.toLowerCase();return p.includes('weather underground')||p.includes('netatmo')||p.includes('synoptic')||p.includes('xweather')||p.includes('opensensemap')||p.includes('sensebox')||p.includes('pws')}
function isCitizenNetwork(provider=''){const p=provider.toLowerCase();return p.includes('opensensemap')||p.includes('sensebox')}
function stationAgeMinutes(timestamp?:string){if(!timestamp)return 120;const normalized=normalizeStationTimestamp(timestamp),t=normalized?new Date(normalized).getTime():NaN;return Number.isFinite(t)?Math.max(0,(Date.now()-t)/60000):120}
function median(values:number[]){const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return NaN;const i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2}
function robustStationValues(rows:{value:number;weight:number}[],absoluteLimit:number){if(rows.length<3)return rows;const med=median(rows.map(x=>x.value)),mad=median(rows.map(x=>Math.abs(x.value-med))),limit=Math.max(absoluteLimit,(Number.isFinite(mad)?mad:0)*4.45);const filtered=rows.filter(x=>Math.abs(x.value-med)<=limit);return filtered.length>=Math.max(2,Math.ceil(rows.length*.55))?filtered:rows}
function stationWeightedMean(rows:{value:number;weight:number}[],absoluteLimit:number){const a=robustStationValues(rows.filter(x=>Number.isFinite(x.value)&&x.weight>0),absoluteLimit),sum=a.reduce((s,x)=>s+x.weight,0);return sum?a.reduce((s,x)=>s+x.value*x.weight,0)/sum:undefined}
function stationCircularMean(rows:{value:number;weight:number}[]){const a=rows.filter(x=>Number.isFinite(x.value)&&x.weight>0);if(!a.length)return undefined;const x=a.reduce((s,r)=>s+Math.cos(r.value*Math.PI/180)*r.weight,0),y=a.reduce((s,r)=>s+Math.sin(r.value*Math.PI/180)*r.weight,0);return(Math.atan2(y,x)*180/Math.PI+360)%360}
function stationRowWeight(s:Station,targetElevation?:number){const distanceKm=Math.max(0,(s.distance??80000)/1000),heightDiff=Number.isFinite(s.height)&&Number.isFinite(targetElevation)?Math.abs(Number(s.height)-Number(targetElevation)):180,age=stationAgeMinutes(s.timestamp),count=Math.sqrt(Math.max(1,s.stationCount??1));return stationProviderWeight(s.provider)*count/(1+distanceKm/14)**2*Math.exp(-heightDiff/420)*Math.exp(-age/125)}
function robustBlendStations(input:Station[],targetElevation?:number):Station|null{
 const fresh=input.filter(s=>stationAgeMinutes(s.timestamp)<=180&&Number.isFinite(s.temperature));if(!fresh.length)return null;
 const terrain=Number(targetElevation??0)>=700;
 const suitable=fresh.filter(s=>{const pws=isPrivateNetwork(s.provider),maxDistance=pws?55_000:160_000,maxHeight=terrain?(pws?500:850):(pws?320:600);return(s.distance??999999)<=maxDistance&&(!Number.isFinite(s.height)||!Number.isFinite(targetElevation)||Math.abs(Number(s.height)-Number(targetElevation))<=maxHeight)});
 const candidates=(suitable.length?suitable:fresh).sort((a,b)=>stationFitScore(a.distance,a.height,targetElevation,isPrivateNetwork(a.provider)?-9000:0,a.timestamp)-stationFitScore(b.distance,b.height,targetElevation,isPrivateNetwork(b.provider)?-9000:0,b.timestamp)).slice(0,12);
 if(candidates.length===1){const only=candidates[0],qff=only.pressureReference==='QFF'||only.pressureReference==='MSL';return qff?only:{...only,pressure:undefined,pressureReference:undefined}};
 const weighted=candidates.map(s=>({s,w:stationRowWeight(s,targetElevation)})).filter(x=>x.w>0),field=(key:keyof Station,limit:number)=>stationWeightedMean(weighted.map(x=>({value:Number(x.s[key]),weight:x.w})),limit),temperature=field('temperature',3.2);
 if(temperature===undefined)return candidates[0];
 const providers=[...new Set(candidates.flatMap(s=>s.sourceProviders?.length?s.sourceProviders:[s.provider||'Messstation']))],stationCount=candidates.reduce((sum,s)=>sum+Math.max(1,s.stationCount??1),0),tempValues=candidates.map(s=>Number(s.temperature)).filter(Number.isFinite),tempSpread=tempValues.length>1?Math.sqrt(tempValues.reduce((sum,v)=>sum+(v-temperature)**2,0)/tempValues.length):0;
 const distances=weighted.map(x=>({value:Number(x.s.distance),weight:x.w})),heights=weighted.map(x=>({value:Number(x.s.height),weight:x.w})),latest=candidates.map(s=>s.timestamp).filter(Boolean).sort().at(-1),windDirections=weighted.map(x=>({value:Number(x.s.windDirection),weight:x.w}));
 const qffPressure=stationWeightedMean(weighted.filter(x=>x.s.pressureReference==='QFF'||x.s.pressureReference==='MSL').map(x=>({value:Number(x.s.pressure),weight:x.w})),7);return{name:`Robustes Mittel aus ${stationCount} Stationen`,provider:'Lokales Stationsmittel',stationId:candidates.map(x=>x.stationId).filter(Boolean).slice(0,4).join(','),distance:stationWeightedMean(distances,35000),height:stationWeightedMean(heights,650),timestamp:latest,temperature,humidity:field('humidity',18),dewPoint:field('dewPoint',4.5),pressure:qffPressure,pressureReference:qffPressure===undefined?undefined:'QFF',windSpeed:field('windSpeed',12),windDirection:stationCircularMean(windDirections),windGust:field('windGust',18),windUnit:'kt',visibility:field('visibility',18000),cloudCover:field('cloudCover',38),ceilingHft:field('ceilingHft',60),cloudBaseHft:field('cloudBaseHft',60),precipitation:field('precipitation',8),stationCount,sourceProviders:providers,blended:true,temperatureSpread:tempSpread,analysisMethod:'Robuste Stationsmittelung',uncertainty:Math.max(.2,tempSpread),effectiveResolutionKm:Math.max(1,Number(stationWeightedMean(distances,35000)??0)/1000),candidateCount:candidates.length,rejectedCount:Math.max(0,input.length-candidates.length)};
}

type LocalBackground={temperature?:number;humidity?:number;dewPoint?:number;pressure?:number;windSpeed?:number;windDirection?:number;windGust?:number;visibility?:number;cloudCover?:number;precipitation?:number};
function contextUrbanClass(context?:Location):UrbanClass{return context?.urbanClass&&context.urbanClass!=='unknown'?context.urbanClass:urbanClassFromPlace(context?.featureCode,context?.population,context?.poiType?.split('=')[0],context?.poiType?.split('=')[1])}
function candidateSiteClass(s:Station):UrbanClass{if(s.siteClass&&s.siteClass!=='unknown')return s.siteClass;const text=`${s.name} ${s.provider}`.toLowerCase();if(/stadt|urban|city center|innenstadt/.test(text))return'urban';if(/flughafen|airport|flugplatz|feld|warte|berg|gipfel/.test(text))return'rural';return'unknown'}
function networkQuality(s:Station){const p=String(s.provider||'').toLowerCase(),trust=Number.isFinite(s.trustFactor)?Math.max(.25,Math.min(1.15,Number(s.trustFactor)/100)):1;if(s.networkClass==='official'||p.includes('dwd')||p.includes('geosphere'))return 1.55*trust;if(s.networkClass==='professional'||p.includes('synoptic')||p.includes('metar'))return 1.22*trust;if(p.includes('weather underground'))return .98*trust;if(p.includes('netatmo'))return .82*trust;if(p.includes('opensensemap')||p.includes('sensebox'))return .42*trust;return .9*trust}
function siteCompatibility(target:UrbanClass,stationClass:UrbanClass){if(target==='unknown'||stationClass==='unknown')return 1;if(target===stationClass)return 1.18;if((target==='urban'&&stationClass==='suburban')||(target==='suburban'&&stationClass==='urban'))return 1.05;if(target==='rural'&&stationClass==='urban')return .68;if(target==='urban'&&stationClass==='rural')return .72;return .88}
function analysisWeight(s:Station,targetElevation:number|undefined,targetUrban:UrbanClass){const p=String(s.provider||'').toLowerCase(),citizen=p.includes('opensensemap')||p.includes('sensebox'),pws=isPrivateNetwork(s.provider),distanceKm=Math.max(.1,(s.distance??100000)/1000),scale=citizen?6:pws?13:32,age=stationAgeMinutes(s.timestamp),ageScale=citizen?38:pws?65:105,heightDiff=Number.isFinite(s.height)&&Number.isFinite(targetElevation)?Math.abs(Number(s.height)-Number(targetElevation)):120;return networkQuality(s)*siteCompatibility(targetUrban,candidateSiteClass(s))*Math.exp(-Math.pow(distanceKm/scale,1.28))*Math.exp(-age/ageScale)*Math.exp(-heightDiff/950)}
async function localBackground(points:{lat:number;lon:number;elevation?:number}[],signal?:AbortSignal):Promise<LocalBackground[]>{const selected=points.slice(0,18),p=new URLSearchParams({latitude:selected.map(x=>x.lat.toFixed(5)).join(','),longitude:selected.map(x=>x.lon.toFixed(5)).join(','),elevation:selected.map(x=>Number.isFinite(x.elevation)?String(Math.round(Number(x.elevation))):'nan').join(','),timezone:'GMT',forecast_days:'1',models:'best_match',wind_speed_unit:'kn',current:['temperature_2m','relative_humidity_2m','dew_point_2m','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','visibility','cloud_cover','precipitation'].join(',')});const raw=await j<any>(`https://api.open-meteo.com/v1/forecast?${p}`,signal),list=Array.isArray(raw)?raw:[raw];return list.map((item:any)=>{const c=item?.current??{},n=(v:any)=>Number.isFinite(Number(v))?Number(v):undefined;return{temperature:n(c.temperature_2m),humidity:n(c.relative_humidity_2m),dewPoint:n(c.dew_point_2m),pressure:n(c.pressure_msl),windSpeed:n(c.wind_speed_10m),windDirection:n(c.wind_direction_10m),windGust:n(c.wind_gusts_10m),visibility:n(c.visibility),cloudCover:n(c.cloud_cover),precipitation:n(c.precipitation)}})}
function normalizeStationWindUnit(station:Station):Station{if(station.windUnit!=='kmh')return station;const speed=Number(station.windSpeed),gust=Number(station.windGust);return{...station,windSpeed:Number.isFinite(speed)?speed/1.852:undefined,windGust:Number.isFinite(gust)?gust/1.852:undefined,windUnit:'kt'}}
function dedupeStationCandidates(input:Station[]){const out=new Map<string,Station>();for(const raw of input){const s=normalizeStationWindUnit(raw);if(!Number.isFinite(s.temperature)||stationAgeMinutes(s.timestamp)>180)continue;const key=s.stationId?`${String(s.provider||'').split('/')[0]}:${s.stationId}`:Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)?`${Number(s.latitude).toFixed(3)}:${Number(s.longitude).toFixed(3)}`:`${s.name}:${Math.round(s.distance??999999)}`,old=out.get(key);if(!old||stationAgeMinutes(s.timestamp)<stationAgeMinutes(old.timestamp)||networkQuality(s)>networkQuality(old))out.set(key,s)}return[...out.values()]}
type ResidualResult={value?:number;uncertainty?:number;correction?:number;accepted:Set<Station>;weights:Map<Station,number>};
function residualField(candidates:Station[],backgrounds:LocalBackground[],target:LocalBackground,obsKey:keyof Station,bgKey:keyof LocalBackground,targetElevation:number|undefined,targetUrban:UrbanClass,absoluteLimit:number,min:number,max:number,predicate?:(s:Station)=>boolean):ResidualResult{const raw=candidates.map((s,i)=>{const observed=Number(s[obsKey]),base=Number(backgrounds[i+1]?.[bgKey]),weight=analysisWeight(s,targetElevation,targetUrban);return{station:s,residual:observed-base,weight}}).filter(x=>(!predicate||predicate(x.station))&&Number.isFinite(x.residual)&&x.weight>.0001&&Number(x.station[obsKey])>=min&&Number(x.station[obsKey])<=max),accepted=new Set<Station>(),weights=new Map<Station,number>();if(!raw.length||!Number.isFinite(Number(target[bgKey])))return{accepted,weights};const med=median(raw.map(x=>x.residual)),mad=median(raw.map(x=>Math.abs(x.residual-med))),limit=Math.max(absoluteLimit,Number.isFinite(mad)?mad*3.7:0),filtered=raw.filter(x=>Math.abs(x.residual-med)<=limit&&Math.abs(x.residual)<=absoluteLimit*2.5),use=filtered.length?filtered:raw.sort((a,b)=>b.weight-a.weight).slice(0,1),sum=use.reduce((a,x)=>a+x.weight,0);if(!sum)return{accepted,weights};for(const x of use){accepted.add(x.station);weights.set(x.station,x.weight)}const correction=use.reduce((a,x)=>a+x.residual*x.weight,0)/sum,variance=use.reduce((a,x)=>a+(x.residual-correction)**2*x.weight,0)/sum,effectiveN=sum*sum/Math.max(.0001,use.reduce((a,x)=>a+x.weight*x.weight,0)),uncertainty=Math.max(.18,Math.sqrt(Math.max(0,variance))+.45/Math.sqrt(Math.max(1,effectiveN)));return{value:Number(target[bgKey])+correction,uncertainty,correction,accepted,weights}}
function directStationField(candidates:Station[],obsKey:keyof Station,targetElevation:number|undefined,targetUrban:UrbanClass,absoluteLimit:number,min:number,max:number):ResidualResult{const raw=candidates.map(station=>({station,value:Number(station[obsKey]),weight:analysisWeight(station,targetElevation,targetUrban)})).filter(row=>Number.isFinite(row.value)&&row.value>=min&&row.value<=max&&row.weight>.0001),accepted=new Set<Station>(),weights=new Map<Station,number>();if(!raw.length)return{accepted,weights};const med=median(raw.map(row=>row.value)),mad=median(raw.map(row=>Math.abs(row.value-med))),limit=Math.max(absoluteLimit,Number.isFinite(mad)?mad*3.7:0),filtered=raw.filter(row=>Math.abs(row.value-med)<=limit),use=filtered.length?filtered:raw.sort((a,b)=>b.weight-a.weight).slice(0,1),sum=use.reduce((total,row)=>total+row.weight,0);if(!sum)return{accepted,weights};for(const row of use){accepted.add(row.station);weights.set(row.station,row.weight)}const value=use.reduce((total,row)=>total+row.value*row.weight,0)/sum,variance=use.reduce((total,row)=>total+(row.value-value)**2*row.weight,0)/sum;return{value,uncertainty:Math.sqrt(Math.max(0,variance)),accepted,weights}}
async function hyperlocalAnalysis(input:Station[],lat:number,lon:number,elevation:number|undefined,context:Location|undefined,signal?:AbortSignal):Promise<Station|null>{
 const deduped=dedupeStationCandidates(input),nonCitizen=deduped.filter(s=>!isCitizenNetwork(s.provider)),fallback=robustBlendStations(nonCitizen.length?deduped:deduped.length>=3?deduped:[],elevation);
 if(!deduped.length||(!nonCitizen.length&&deduped.length<3))return null;
 const ranked=deduped.sort((a,b)=>stationFitScore(a.distance,a.height,elevation,isPrivateNetwork(a.provider)?-7000:0,a.timestamp)-stationFitScore(b.distance,b.height,elevation,isPrivateNetwork(b.provider)?-7000:0,b.timestamp)).filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).slice(0,17);
 if(!ranked.length)return fallback;
 let backgrounds:LocalBackground[];
 try{backgrounds=await localBackground([{lat,lon,elevation},...ranked.map(s=>({lat:Number(s.latitude),lon:Number(s.longitude),elevation:s.height}))],signal)}catch{return fallback}
 if(backgrounds.length<ranked.length+1)return fallback;
 const target=backgrounds[0],urban=contextUrbanClass(context),temp=residualField(ranked,backgrounds,target,'temperature','temperature',elevation,urban,2.6,-65,65),humidity=residualField(ranked,backgrounds,target,'humidity','humidity',elevation,urban,15,0,100),dew=residualField(ranked,backgrounds,target,'dewPoint','dewPoint',elevation,urban,3.8,-80,45),pressure=residualField(ranked,backgrounds,target,'pressure','pressure',elevation,urban,5.5,870,1085,s=>s.pressureReference==='QFF'||s.pressureReference==='MSL'),windSpeed=residualField(ranked,backgrounds,target,'windSpeed','windSpeed',elevation,urban,9,0,120),gust=residualField(ranked,backgrounds,target,'windGust','windGust',elevation,urban,14,0,180),visibility=residualField(ranked,backgrounds,target,'visibility','visibility',elevation,urban,20000,50,100000),cloudCover=residualField(ranked,backgrounds,target,'cloudCover','cloudCover',elevation,urban,38,0,100),ceiling=directStationField(ranked,'ceilingHft',elevation,urban,60,0,500),cloudBase=directStationField(ranked,'cloudBaseHft',elevation,urban,60,0,500),precipitation=residualField(ranked,backgrounds,target,'precipitation','precipitation',elevation,urban,3.5,0,60);
 if(temp.value===undefined)return fallback;
 const analyses=[temp,humidity,dew,pressure,windSpeed,gust,visibility,cloudCover,ceiling,cloudBase,precipitation],acceptedSet=new Set<Station>(),combinedWeights=new Map<Station,number>();
 for(const analysis of analyses)for(const station of analysis.accepted){acceptedSet.add(station);combinedWeights.set(station,(combinedWeights.get(station)||0)+(analysis.weights.get(station)||0))}
 const accepted=[...acceptedSet],weightSum=accepted.reduce((sum,s)=>sum+(combinedWeights.get(s)||analysisWeight(s,elevation,urban)),0),weightedDistance=weightSum?accepted.reduce((sum,s)=>sum+Number(s.distance??0)*(combinedWeights.get(s)||analysisWeight(s,elevation,urban)),0)/weightSum:undefined,providers=[...new Set(accepted.flatMap(s=>s.sourceProviders?.length?s.sourceProviders:[s.provider||'Messstation']))],latest=accepted.map(s=>s.timestamp).filter(Boolean).sort().at(-1),directionRows=ranked.map(s=>({value:Number(s.windDirection),weight:analysisWeight(s,elevation,urban)})),direct=robustBlendStations(ranked,elevation),effectiveResolutionKm=weightedDistance===undefined?undefined:Math.max(.8,Math.min(60,weightedDistance/1000)),stationCount=accepted.reduce((sum,s)=>sum+Math.max(1,s.stationCount??1),0);
 return{name:`Hyperlokale Analyse aus ${Math.max(1,stationCount)} Messpunkten`,provider:'MID Hyperlokalanalyse',stationId:accepted.map(x=>x.stationId).filter(Boolean).slice(0,6).join(','),latitude:lat,longitude:lon,distance:weightedDistance,height:elevation,timestamp:latest,temperature:temp.value,humidity:humidity.value??direct?.humidity,dewPoint:dew.value??direct?.dewPoint,pressure:pressure.value,pressureReference:pressure.value===undefined?undefined:'QFF',windSpeed:windSpeed.value??direct?.windSpeed,windDirection:stationCircularMean(directionRows),windGust:gust.value??direct?.windGust,windUnit:'kt',visibility:visibility.value===undefined?direct?.visibility:clampNumber(visibility.value,50,100000),cloudCover:cloudCover.value===undefined?direct?.cloudCover:clampNumber(cloudCover.value,0,100),ceilingHft:ceiling.value===undefined?direct?.ceilingHft:clampNumber(ceiling.value,0,500),cloudBaseHft:cloudBase.value===undefined?direct?.cloudBaseHft:clampNumber(cloudBase.value,0,500),precipitation:precipitation.value===undefined?direct?.precipitation:Math.max(0,precipitation.value),stationCount:Math.max(1,stationCount),sourceProviders:providers,blended:true,temperatureSpread:temp.uncertainty,trustFactor:Math.min(99,75+accepted.length*3),networkClass:'professional',siteClass:urban,analysisMethod:'Modellgestützte lokale Restfeldanalyse',uncertainty:temp.uncertainty,effectiveResolutionKm,candidateCount:ranked.length,rejectedCount:Math.max(0,ranked.length-accepted.length),localCorrection:temp.correction,backgroundModel:'Open-Meteo Best Match',urbanClass:urban}
}

function metarVisibilityMeters(row:any):number|undefined{
 const numeric=(value:any)=>{if(value===null||value===undefined||value==='')return undefined;const match=String(value).replace(',','.').match(/-?\d+(?:\.\d+)?/),number=match?Number(match[0]):Number(value);return Number.isFinite(number)?number:undefined};
 const explicitMeters=numeric(row.visibility_m??row.visibilityMeters??row.visibility_metres??row.visibilityMetersM);if(explicitMeters!==undefined)return clampNumber(explicitMeters,0,100000);
 const raw=row.visib??row.visibility_sm??row.visibility;const value=numeric(raw);if(value===undefined)return undefined;
 const unit=String(row.visibilityUnit??row.visibility_unit??('visib'in row?'sm':'')).toLowerCase();
 if(unit==='m'||unit.includes('meter')||unit.includes('metre'))return clampNumber(value,0,100000);
 if(unit==='km'||unit.includes('kilometer')||unit.includes('kilometre'))return clampNumber(value*1000,0,100000);
 if(unit.includes('sm')||unit.includes('mile')||'visib'in row||value<=50)return clampNumber(value*1609.344,0,100000);
 return clampNumber(value,0,100000);
}
function metarCloudLayers(row:any):any[]{
 const source=Array.isArray(row.clouds)?row.clouds:Array.isArray(row.cloudLayers)?row.cloudLayers:Array.isArray(row.skyCondition)?row.skyCondition:[];
 if(source.length)return source;
 const text=[typeof row.clouds==='string'?row.clouds:'',typeof row.rawOb==='string'?row.rawOb:'',typeof row.raw_text==='string'?row.raw_text:''].filter(Boolean).join(' ');
 return[...text.matchAll(/\b(SKC|CLR|NSC|NCD|FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)?(?:CB|TCU)?\b/gi)].map(match=>({cover:match[1].toUpperCase(),base:match[2]&&match[2]!=='///'?Number(match[2])*100:undefined}));
}
function metarLayerCover(layer:any){return String(typeof layer==='string'?layer:layer?.cover??layer?.amount??layer?.code??'').toUpperCase().slice(0,3)}
function metarLayerBaseFeet(layer:any):number|undefined{
 const directHft=numeric(layer?.baseHft??layer?.base_hft??layer?.heightHft);if(directHft!==undefined)return directHft*100;
 const explicitFeet=numeric(layer?.baseFeetAgl??layer?.base_feet_agl??layer?.base_ft_agl??layer?.heightFeet??layer?.height_ft);if(explicitFeet!==undefined)return explicitFeet;
 const generic=numeric(typeof layer==='string'?String(layer).match(/(?:FEW|SCT|BKN|OVC|VV)(\d{3})/i)?.[1]:layer?.base??layer?.height??layer?.altitude);if(generic===undefined)return undefined;
 if(typeof layer==='string'||generic<=500&&String(layer?.unit??layer?.base_unit??'').toLowerCase().includes('hft'))return generic*100;
 return generic;
}
function metarCloudCover(row:any):number|undefined{
 const direct=Number(row.cloudCover??row.cloud_cover);if(Number.isFinite(direct))return clampNumber(direct,0,100);
 const map:Record<string,number>={SKC:0,CLR:0,NSC:0,NCD:0,CAVOK:0,FEW:25,SCT:50,BKN:75,OVC:100,VV:100};
 const values=metarCloudLayers(row).map(layer=>map[metarLayerCover(layer)]).filter(Number.isFinite);
 return values.length?Math.max(...values):undefined;
}
function metarCeilingHft(row:any):number|undefined{
 const explicitHft=numeric(row.ceilingHft??row.ceiling_hft);if(explicitHft!==undefined)return clampNumber(Math.round(explicitHft),0,500);
 const explicitFeet=numeric(row.ceilingFt??row.ceiling_ft??row.ceiling??row.vertVis??row.verticalVisibility);
 const layerFeet=metarCloudLayers(row).filter(layer=>['BKN','OVC','VV'].includes(metarLayerCover(layer))).map(metarLayerBaseFeet).filter((value):value is number=>Number.isFinite(value));
 const feet=layerFeet.length?Math.min(...layerFeet):explicitFeet;if(feet===undefined)return undefined;
 return clampNumber(Math.round(feet/100),0,500);
}
function metarCloudBaseHft(row:any):number|undefined{
 const explicitHft=numeric(row.cloudBaseHft??row.cloud_base_hft);if(explicitHft!==undefined)return clampNumber(Math.round(explicitHft),0,500);
 const explicitFeet=numeric(row.cloudBaseFt??row.cloud_base_ft??row.cloudBase??row.cloud_base);
 const layerFeet=metarCloudLayers(row).filter(layer=>['FEW','SCT'].includes(metarLayerCover(layer))).map(metarLayerBaseFeet).filter((value):value is number=>Number.isFinite(value));
 const feet=layerFeet.length?Math.min(...layerFeet):explicitFeet;if(feet===undefined)return undefined;
 return clampNumber(Math.round(feet/100),0,500);
}
function rowToStation(r:any,lat:number,lon:number):Station|null{
 if(Number(r.qcStatus)===0)return null;
 const rlat=Number(r.lat??r.latitude),rlon=Number(r.lon??r.longitude);if(!Number.isFinite(rlat)||!Number.isFinite(rlon))return null;
 const distance=haversine(lat,lon,rlat,rlon),heightRaw=r.elev??r.elevation??r.elevation_m,height=heightRaw===null||heightRaw===undefined?undefined:Number(heightRaw),num=(v:any)=>v===null||v===undefined||v===''?undefined:(Number.isFinite(Number(v))?Number(v):undefined),temperature=num(r.temp??r.temperature),dewPoint=num(r.dewp??r.dewPoint),pressureMslRaw=num(r.pressureMsl),pressureMsl=plausibleQff(pressureMslRaw,height)?pressureMslRaw:undefined,altimeter=num(r.altim),stationPressure=num(r.pressure),rawPressure=pressureMsl??altimeter??stationPressure,pressure=rawPressure!==undefined&&rawPressure<100?rawPressure*33.8639:rawPressure,pressureReference:Station['pressureReference']=pressureMsl!==undefined?'QFF':altimeter!==undefined?'QNH':stationPressure!==undefined?'station':undefined,humidity=num(r.relativeHumidity??r.humidity)??(temperature!==undefined&&dewPoint!==undefined?Math.min(100,100*Math.exp((17.625*dewPoint)/(243.04+dewPoint)-(17.625*temperature)/(243.04+temperature))):undefined),windUnit=r.windUnit==='kmh'?'kmh':'kt',windSpeedRaw=num(r.wspd??r.windSpeed),windGustRaw=num(r.wgst??r.windGust);
 return{name:r.name||r.site||r.station||r.icaoId||r.stationId||'WMO/PWS-Station',provider:r.provider||'METAR / WMO',stationId:r.icaoId||r.wmoId||r.stationId||r.id,latitude:rlat,longitude:rlon,distance,height:Number.isFinite(height as number)?height:undefined,timestamp:normalizeStationTimestamp(r.reportTime??r.obsTime??r.timestamp),temperature,dewPoint,humidity,pressure,pressureReference,windSpeed:windSpeedRaw===undefined?undefined:windUnit==='kmh'?windSpeedRaw/1.852:windSpeedRaw,windDirection:num(r.wdir??r.windDirection),windGust:windGustRaw===undefined?undefined:windUnit==='kmh'?windGustRaw/1.852:windGustRaw,windUnit:'kt',visibility:metarVisibilityMeters(r),cloudCover:metarCloudCover(r),ceilingHft:metarCeilingHft(r),cloudBaseHft:metarCloudBaseHft(r),precipitation:num(r.precipitation??r.precipTotal),trustFactor:num(r.trustFactor),networkClass:r.networkClass,siteClass:r.siteClass};
}

function parseMetarStations(rows:any[],lat:number,lon:number){return rows.map(r=>rowToStation(r,lat,lon)).filter(Boolean) as Station[]}
function awcMetarBbox(lat:number,lon:number,radiusKm:number){const dLat=radiusKm/111,dLon=radiusKm/(111*Math.max(.25,Math.cos(lat*Math.PI/180)));return[Math.max(-89.9,lat-dLat),Math.max(-180,lon-dLon),Math.min(89.9,lat+dLat),Math.min(180,lon+dLon)].map(x=>x.toFixed(3)).join(',')}
async function metarStations(lat:number,lon:number,radiusKm=140,signal?:AbortSignal):Promise<Station[]>{
 const bbox=awcMetarBbox(lat,lon,radiusKm);
 if(workerBaseCandidates('metar').length){try{const data=await fetchWorkerJson<any>('',{lat,lon,radius_km:radiusKm},{purpose:'metar',signal,timeoutMs:10000}),stations=parseMetarStations(parseMetarRows(data),lat,lon);if(stations.length)return stations}catch{}}
 try{const data=await j<any>(`https://aviationweather.gov/api/data/metar?format=json&hours=3&bbox=${encodeURIComponent(bbox)}`,signal);return parseMetarStations(parseMetarRows(data),lat,lon)}catch{return[]}
}
export async function station(lat:number,lon:number,country?:string,elevation?:number,context?:Location,signal?:AbortSignal):Promise<Station|null>{
 const c=countryCodeFromLocation(country),inGermany=c==='DE'||(!c&&lat>=47.2&&lat<=55.2&&lon>=5.5&&lon<=15.6),metarRadiusKm=inGermany?140:220,tasks:Promise<Station[]|Station|null>[]=[metarStations(lat,lon,metarRadiusKm,signal)];
 if(geoSphereApplies(lat,lon,c))tasks.push(geoSphereStation(lat,lon,elevation,signal));
 if(inGermany)tasks.push(brightSkyStation(lat,lon,elevation,signal));
 const settled=await Promise.allSettled(tasks),results=settled.filter((x):x is PromiseFulfilledResult<Station[]|Station|null>=>x.status==='fulfilled').flatMap(x=>Array.isArray(x.value)?x.value:x.value?[x.value]:[]);
 if(!results.length)return null;
 const analysed=await hyperlocalAnalysis(results,lat,lon,elevation,context,signal),geoSphereQff=c==='AT'?results.find(item=>item.provider?.includes('GeoSphere')&&plausibleQff(item.pressure,item.height)&&(item.pressureReference==='QFF'||item.pressureReference==='MSL')):undefined;if(analysed&&geoSphereQff&&analysed.pressure===undefined)return{...analysed,pressure:geoSphereQff.pressure,pressureReference:'QFF'};
 const nonCitizen=results.filter(item=>!isCitizenNetwork(item.provider));return analysed??robustBlendStations(nonCitizen.length?results:results.length>=3?results:[],elevation)??nonCitizen[0]??null;
}

export async function officialWarnings(lat:number,lon:number,country?:string,name?:string,region?:string,district?:string,signal?:AbortSignal):Promise<{alerts:OfficialAlert[];provider?:string;coverage?:string}> {
 const result=await fetchWorkerJson<{alerts?:OfficialAlert[];provider?:string;coverage?:string;error?:string}>('alerts',{lat,lon,country:countryCodeFromLocation(country)||String(country||''),language:'de',name,region,district},{purpose:'alerts',signal,timeoutMs:12000});
 return{alerts:(result.alerts??[]).filter(a=>a&&a.id&&a.headline),provider:result.provider,coverage:result.coverage};
}

function normaliseRadarNowcast(result:(RadarNowcast&{error?:string})|null|undefined):RadarNowcast|null{
 if(!result||!Number.isFinite(Number(result.radarProbability)))return null;
 return{...result,radarProbability:Math.max(0,Math.min(100,Number(result.radarProbability))),currentRate:Number.isFinite(Number(result.currentRate))?Number(result.currentRate):undefined,arrivalMinutes:Number.isFinite(Number(result.arrivalMinutes))?Number(result.arrivalMinutes):undefined,endMinutes:Number.isFinite(Number(result.endMinutes))?Number(result.endMinutes):undefined};
}
function operaRadarApplies(lat:number,lon:number){return lat>=31.5&&lat<=72.5&&lon>=-30.5&&lon<=50.5}
function dwdRadarExpected(lat:number,lon:number,countryCode:string){return countryCode==='DE'||(!countryCode&&lat>=47.2&&lat<=55.2&&lon>=5.5&&lon<=15.6)}
function abortError(signal?:AbortSignal){if(signal?.aborted)throw signal.reason??new DOMException('Vorgang abgebrochen.','AbortError')}
function radarRetryDelay(signal?:AbortSignal){
 if(signal?.aborted)return Promise.reject(signal.reason??new DOMException('Vorgang abgebrochen.','AbortError'));
 return new Promise<void>((resolve,reject)=>{let settled=false;const finish=(error?:unknown)=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);error===undefined?resolve():reject(error)},abort=()=>finish(signal?.reason??new DOMException('Vorgang abgebrochen.','AbortError')),timer=setTimeout(()=>finish(),700);signal?.addEventListener('abort',abort,{once:true})});
}
async function requestRadarStage(params:{lat:number;lon:number;country:string;_ts:number},stage:'dwd'|'rainviewer',signal?:AbortSignal){
 try{return await fetchWorkerJson<RadarNowcast&{error?:string}>('radar-nowcast',{...params,stage},{purpose:'radar',signal,timeoutMs:stage==='dwd'?14000:16000})}
 catch(firstError){abortError(signal);await radarRetryDelay(signal);try{return await fetchWorkerJson<RadarNowcast&{error?:string}>('radar-nowcast',{...params,stage,_ts:Date.now()},{purpose:'radar',signal,timeoutMs:stage==='dwd'?18000:20000})}catch(secondError){abortError(signal);void firstError;void secondError;return null}}
}


export async function thunderstormNowcast(lat:number,lon:number,country?:string,signal?:AbortSignal):Promise<ThunderstormNowcast|null>{
 if(!workerBaseCandidates('radar').length)return null;
 return fetchWorkerJson<ThunderstormNowcast>('thunderstorm-nowcast',{lat,lon,country:countryCodeFromLocation(country)||String(country||''),_ts:Date.now()},{purpose:'radar',signal,timeoutMs:15000});
}


function mergeDwdOperaNowcast(dwd:RadarNowcast,opera:RadarNowcast):RadarNowcast{
 const dwdProbability=Math.max(0,Math.min(100,Number(dwd.radarProbability)||0)),operaProbability=Math.max(0,Math.min(100,Number(opera.radarProbability)||0)),operaWeight=dwd.quality==='high'?.20:dwd.quality==='medium'?.28:.36,blended=Math.round(dwdProbability*(1-operaWeight)+operaProbability*operaWeight),radarProbability=Math.max(dwdProbability,blended),discrepancy=Math.abs(dwdProbability-operaProbability),quality:RadarNowcastQuality=discrepancy>=55&&dwd.quality==='high'?'medium':dwd.quality;
 return{...dwd,quality,radarProbability,peakRate:Math.max(Number(dwd.peakRate)||0,Number(opera.peakRate)||0),provider:`${dwd.provider} · OPERA CIRRUS-Abgleich`,license:[dwd.license,'EUMETNET OPERA composite products, CC BY 4.0'].filter(Boolean).join(' · '),diagnostics:{...(dwd.diagnostics||{}),operaCrossCheck:{available:true,provider:opera.provider,probability:operaProbability,currentRate:opera.currentRate,peakRate:opera.peakRate,observedAt:opera.observedAt,quality:opera.quality,summary:opera.summary,weight:operaWeight,discrepancy}}};
}
async function operaNowcast(lat:number,lon:number,signal?:AbortSignal){
 if(!operaRadarApplies(lat,lon))return null;
 try{const metadata=await loadOperaRaster(lat,lon,signal);return normaliseRadarNowcast(await analyseOperaRasterNowcast(metadata.frames??[],lat,lon,signal))}catch(error){abortError(signal);void error;return null}
}

export async function radarNowcast(lat:number,lon:number,country?:string,signal?:AbortSignal):Promise<RadarNowcast|null>{
 if(!workerBaseCandidates('radar').length)return null;
 const countryCode=countryCodeFromLocation(country),params={lat,lon,country:countryCode||String(country||''),_ts:Date.now()},dwdExpected=dwdRadarExpected(lat,lon,countryCode),operaExpected=operaRadarApplies(lat,lon),[dwdSettled,operaSettled]=await Promise.allSettled([dwdExpected?requestRadarStage(params,'dwd',signal):Promise.resolve(null),operaExpected?operaNowcast(lat,lon,signal):Promise.resolve(null)]);abortError(signal);
 const dwdResult=dwdSettled.status==='fulfilled'?normaliseRadarNowcast(dwdSettled.value):null,operaResult=operaSettled.status==='fulfilled'?operaSettled.value:null;
 if(dwdResult?.source==='dwd')return operaResult?.source==='opera'?mergeDwdOperaNowcast(dwdResult,operaResult):dwdResult;
 if(operaResult?.source==='opera')return operaResult;
 const fallback=normaliseRadarNowcast(await requestRadarStage({...params,_ts:Date.now()},'rainviewer',signal));return fallback?.source==='opera'?null:fallback;
}

function n(v:unknown,fallback=NaN){return v===null||v===undefined||v===''?fallback:Number(v)}

// Approximate local altitude adjustment: no extra adjustment below 500 m,
// then +10 % per additional 1000 m. The factor is intentionally capped
// because cloud, ozone, aerosols and snow can dominate the local UVI.
export function uvAltitudeFactor(elevation:number|undefined){
 const h=Number(elevation);if(!Number.isFinite(h)||h<=500)return 1;return Math.min(1.35,1+((h-500)/1000)*0.10);
}
export function altitudeCorrectedUvi(value:number,elevation:number|undefined){
 const uv=Number(value);if(!Number.isFinite(uv))return Number.NaN;return Number(Math.max(0,uv*uvAltitudeFactor(elevation)).toFixed(1));
}

export function dayEffectiveUvMax(day:Day,hours:Hour[]){
 const vals=(hours??[]).map(x=>x.uvIndex).filter(v=>Number.isFinite(v));
 return vals.length?Math.max(...vals):(Number.isFinite(day.uvMax)?Number(day.uvMax):0);
}
export function mapHours(w:Weather):Hour[]{return (w.hourly.time as string[]).map((time,i)=>{const code=n(w.hourly.weather_code[i],3),cloud=n(w.hourly.cloud_cover[i],0),precipitation=n(w.hourly.precipitation[i],0),isDay=n(w.hourly.is_day[i],0)===1,uvIndex=n(w.hourly.uv_index[i],NaN);return{time,epoch:localIsoEpoch(time,w.timezone,Number(w.utc_offset_seconds)||0),timezone:w.timezone,temperature:n(w.hourly.temperature_2m[i]),apparent:n(w.hourly.apparent_temperature[i]),humidity:n(w.hourly.relative_humidity_2m[i]),dewPoint:n(w.hourly.dew_point_2m[i]),precipitation,rain:n(w.hourly.rain[i],0),showers:n(w.hourly.showers[i],0),snowfall:n(w.hourly.snowfall[i],0),probability:n(w.hourly.precipitation_probability[i],0),code,wind:n(w.hourly.wind_speed_10m[i],0),gust:n(w.hourly.wind_gusts_10m[i],0),direction:n(w.hourly.wind_direction_10m[i],0),cloud,uvIndex:Number.isFinite(uvIndex)&&isDay?altitudeCorrectedUvi(uvIndex,w.elevation):0,visibility:n(w.hourly.visibility?.[i],NaN),cape:n(w.hourly.cape?.[i],0),isDay}}).filter(x=>Number.isFinite(x.temperature))}
export function mapMinutely15(w:Weather):Minute15[]{const m=w.minutely_15;if(!m?.time)return[];return (m.time as string[]).map((time,i)=>({time,epoch:localIsoEpoch(time,w.timezone,Number(w.utc_offset_seconds)||0),timezone:w.timezone,precipitation:n(m.precipitation?.[i],0),rain:n(m.rain?.[i],0),showers:n(m.showers?.[i],0),snowfall:n(m.snowfall?.[i],0),probability:n(m.precipitation_probability?.[i],0),code:n(m.weather_code?.[i],0)}))}
export function mapDays(w:Weather):Day[]{return (w.daily.time as string[]).map((date,i)=>({date,code:n(w.daily.weather_code[i],3),max:n(w.daily.temperature_2m_max[i]),min:n(w.daily.temperature_2m_min[i]),sunrise:String(w.daily.sunrise?.[i]??'')||undefined,sunset:String(w.daily.sunset?.[i]??'')||undefined,sunshineDuration:n(w.daily.sunshine_duration?.[i],0),precipitation:n(w.daily.precipitation_sum[i],0),probability:n(w.daily.precipitation_probability_max[i],0),wind:n(w.daily.wind_speed_10m_max[i],0),gust:n(w.daily.wind_gusts_10m_max[i],0),direction:n(w.daily.wind_direction_10m_dominant[i],0),uvMax:altitudeCorrectedUvi(n(w.daily.uv_index_max[i],0),w.elevation)})).filter(d=>Number.isFinite(d.max)&&Number.isFinite(d.min)&&d.max>=d.min)}

export function cloudOktas(percent:number){return Math.max(0,Math.min(8,Math.round((Number.isFinite(percent)?percent:0)/12.5)))}
export function cloudOktasText(percent:number){
 const octas=cloudOktas(percent);
 const description=octas===0?'wolkenlos':octas<=2?'gering bewölkt':octas<=4?'aufgelockert bewölkt':octas<=7?'stark bewölkt':'bedeckt';
 return`${octas}/8 · ${description}`;
}
export type DayWeatherCharacter={code:number;label:string;secondary:string;cloudOktas:number;precipitationDominant:boolean};
const DAY_LABEL_MAX=30;
const DAY_SECONDARY_MAX=28;
type DayPartKey='night'|'morning'|'midday'|'afternoon'|'evening';
function dayPartKey(hour:number):DayPartKey{if(hour<5)return'night';if(hour<10)return'morning';if(hour<14)return'midday';if(hour<18)return'afternoon';return'evening'}
function compactSkyFallback(labelText:string){
 const text=labelText.trim();
 if(text==='Wolkig, oft sonnig')return'Oft sonnig';
 if(text==='Überwiegend klar')return'Meist klar';
 if(text==='Teilweise bewölkt')return'Wolkig';
 return text;
}
function fitDayLabel(text:string,fallback:string){const clean=text.replace(/\s+/g,' ').trim();return clean.length<=DAY_LABEL_MAX?clean:fallback}
function fitDaySecondary(text:string,fallback:string){const clean=text.replace(/\s+/g,' ').trim();return clean.length<=DAY_SECONDARY_MAX?clean:fallback}
function daylightDurationSeconds(day:Day){
 const minutes=(value?:string)=>{const match=String(value??'').match(/T(\d{2}):(\d{2})/);return match?Number(match[1])*60+Number(match[2]):NaN};
 const sunrise=minutes(day.sunrise),sunset=minutes(day.sunset);
 return Number.isFinite(sunrise)&&Number.isFinite(sunset)&&sunset>sunrise?(sunset-sunrise)*60:12*3600;
}
function skyFromCloud(percent:number,sunshineFraction?:number){
 const octas=cloudOktas(percent),sun=Number.isFinite(sunshineFraction)?Math.max(0,Math.min(1,Number(sunshineFraction))):NaN;
 if(Number.isFinite(sun)){
  if(sun>=.72)return{code:octas<=3?0:1,label:'Heiter'};
  if(sun>=.50)return{code:1,label:'Wolkig, oft sonnig'};
  if(sun>=.28)return{code:2,label:'Sonne und Wolken'};
  if(sun>=.10)return{code:3,label:'Meist bewölkt'};
  if(octas>=8)return{code:3,label:'Bedeckt'};
  return{code:3,label:'Stark bewölkt'};
 }
 if(octas<=1)return{code:0,label:'Klar'};
 if(octas<=3)return{code:1,label:'Überwiegend klar'};
 if(octas<=5)return{code:2,label:'Teilweise bewölkt'};
 if(octas<=7)return{code:3,label:'Stark bewölkt'};
 return{code:3,label:'Bedeckt'};
}
function precipCodeFamily(code:number){
 if([51,53,55,56,57].includes(code))return'drizzle';
 if([61,63,65,66,67,68,69].includes(code))return'rain';
 if([71,73,75,77].includes(code))return'snow';
 if([80,81,82,83,84,85,86].includes(code))return'showers';
 if([95,96,97,99].includes(code))return'thunder';
 return'none';
}
function representativePrecipCode(hours:Hour[]){
 type FamilyRow={score:number;hours:number;sum:number;snowSum:number;maxProbability:number;probabilitySum:number;probabilitySamples:number;first:number;last:number;codes:Map<number,number>};
 const families=new Map<string,FamilyRow>();
 for(const h of hours){
  let family=precipCodeFamily(h.code);
  const amount=Math.max(0,h.precipitation||0),snow=Math.max(0,h.snowfall||0),probability=Math.max(0,Math.min(100,h.probability||0));
  if(family==='none')family=h.showers>=.05?'showers':snow>=.05?'snow':h.rain>=.05||amount>=.05?'rain':'none';
  if(family==='none')continue;
  if(probability<20&&amount<.05&&snow<.05)continue;
  const hour=Number(h.time.slice(11,13));
  const dayWeight=h.isDay?1.12:.78;
  const probabilityWeight=.12+probability/100;
  const amountWeight=1+Math.min(2.2,amount*1.4+snow*.18);
  const severity=family==='thunder'?2.4:family==='snow'||family==='showers'?1.25:family==='rain'?1.05:.82;
  const score=dayWeight*probabilityWeight*amountWeight*severity;
  const fallbackCode=family==='showers'?81:family==='snow'?73:family==='rain'?63:53;
  const code=precipCodeFamily(h.code)!=='none'?h.code:fallbackCode;
  const row=families.get(family)??{score:0,hours:0,sum:0,snowSum:0,maxProbability:0,probabilitySum:0,probabilitySamples:0,first:hour,last:hour,codes:new Map<number,number>()};
  row.score+=score;
  if(probability>=30||amount>=.05||snow>=.05)row.hours+=1;
  row.sum+=amount;row.snowSum+=snow;row.maxProbability=Math.max(row.maxProbability,probability);
  row.probabilitySum+=probability;row.probabilitySamples+=1;
  row.first=Math.min(row.first,hour);row.last=Math.max(row.last,hour);
  row.codes.set(code,(row.codes.get(code)??0)+score);
  families.set(family,row);
 }
 const winner=[...families.entries()].sort((a,b)=>b[1].score-a[1].score)[0];
 if(!winner)return null;
 const[family,row]=winner;
 const code=[...row.codes.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]??(family==='showers'?81:family==='snow'?73:family==='rain'?63:53);
 return{family,code,...row,averageProbability:row.probabilitySum/Math.max(1,row.probabilitySamples)};
}
function conciseSkyLabel(cloud:number){
 if(cloud<=18)return'Sonnig';
 if(cloud<=38)return'Heiter';
 if(cloud<=62)return'Wolkig';
 if(cloud<=82)return'Stark bewölkt';
 return'Bedeckt';
}
function partCloud(hours:Hour[],from:number,to:number){
 const values=hours.filter(h=>h.isDay&&Number(h.time.slice(11,13))>=from&&Number(h.time.slice(11,13))<to);
 if(!values.length)return Number.NaN;
 return values.reduce((sum,h)=>sum+h.cloud,0)/values.length;
}
function representativeSkyCode(description:string,fallbackCode:number){
 const text=description.toLocaleLowerCase('de-DE');
 // Verlaufstexte brauchen ein Mischsymbol: Es soll weder nur den frühen noch nur den späten Zustand zeigen.
 if(text.includes('auflockernd'))return 2;
 if(text.includes('wolkiger')){
  if(text.startsWith('bedeckt')||text.startsWith('stark bewölkt'))return 3;
  return 2;
 }
 if(text==='sonnig'||text==='klar')return 0;
 if(text==='heiter'||text.includes('oft sonnig')||text.includes('überwiegend klar'))return 1;
 if(text.includes('sonne und wolken')||text==='wolkig'||text.includes('teilweise bewölkt'))return 2;
 if(text.includes('bedeckt')||text.includes('bewölkt'))return 3;
 return fallbackCode;
}
function skyTrend(hours:Hour[],fallback:string){
 const morning=partCloud(hours,6,11),midday=partCloud(hours,11,14),afternoon=partCloud(hours,14,18),evening=partCloud(hours,18,22);
 const early=Number.isFinite(morning)?morning:midday,late=Number.isFinite(afternoon)?afternoon:evening;
 const base=compactSkyFallback(fallback);
 if(!Number.isFinite(early)||!Number.isFinite(late))return base;
 const delta=late-early,earlyLabel=conciseSkyLabel(early),lateLabel=conciseSkyLabel(late).toLocaleLowerCase('de-DE');
 if(delta>=30){
  const timing=Number.isFinite(midday)&&midday-early>=18?'ab Mittag':'später';
  const full=`${earlyLabel}, ${timing} ${lateLabel}`;
  return fitDayLabel(full,timing==='ab Mittag'?'Ab Mittag wolkiger':'Später wolkiger');
 }
 if(delta<=-30){
  const timing=Number.isFinite(midday)&&early-midday>=18?'ab Mittag':'später';
  const full=`${earlyLabel}, ${timing} ${lateLabel}`;
  return fitDayLabel(full,timing==='ab Mittag'?'Ab Mittag auflockernd':'Später auflockernd');
 }
 return base;
}
function shortEvent(family:string,eventLabel:string){
 if(family==='showers')return eventLabel.toLowerCase().includes('schnee')?'Schneeschauer':'Schauer';
 if(family==='thunder')return'Gewitter';
 if(family==='snow')return'Schnee';
 if(family==='drizzle')return'Sprühregen';
 if(family==='rain')return'Regen';
 return eventLabel;
}
function transitionTime(hour:number){
 if(hour<10)return'morgens';
 if(hour<14)return'ab Mittag';
 if(hour<18)return'nachmittags';
 return'abends';
}
function eventFamilyAtHour(h:Hour){
 let family=precipCodeFamily(h.code);
 if(family==='none')family=h.showers>=.05?'showers':h.snowfall>=.05?'snow':h.rain>=.05||h.precipitation>=.05?'rain':'none';
 return family;
}
function eventTiming(hours:Hour[],family:string){
 const order:DayPartKey[]=['night','morning','midday','afternoon','evening'];
 const active=new Set(hours.filter(h=>eventFamilyAtHour(h)===family&&(h.probability>=25||h.precipitation>=.05||h.snowfall>=.05)).map(h=>dayPartKey(Number(h.time.slice(11,13)))));
 const parts=order.filter(part=>active.has(part));
 if(!parts.length)return'';
 if(parts.length>=3)return'zeitweise';
 if(parts.length===1){const part=parts[0];return part==='night'?'nachts':part==='morning'?'morgens':part==='midday'?'mittags':part==='afternoon'?'nachmittags':'abends'}
 const pair=parts.join(':');
 if(pair==='night:morning')return'nachts/morgens';
 if(pair==='morning:midday')return'vormittags';
 if(pair==='midday:afternoon')return'ab Mittag';
 if(pair==='afternoon:evening')return'später';
 return`${parts[0]==='night'?'nachts':parts[0]==='morning'?'morgens':parts[0]==='midday'?'mittags':parts[0]==='afternoon'?'nachmittags':'abends'}/${parts[1]==='night'?'nachts':parts[1]==='morning'?'morgens':parts[1]==='midday'?'mittags':parts[1]==='afternoon'?'nachmittags':'abends'}`;
}
function possibleEventText(event:string,timing:string){
 const full=timing?`${event} ${timing} möglich`:`${event} möglich`;
 const fallback=timing==='zeitweise'?`Zeitweise ${event}`:timing==='ab Mittag'?`${event} ab Mittag`:timing==='später'?`${event} später`:`${event} möglich`;
 return fitDaySecondary(full,fallback.length<=DAY_SECONDARY_MAX?fallback:`${event} möglich`);
}
export function dayWeatherCharacter(day:Day,hours:Hour[]):DayWeatherCharacter{
 const relevant=hours.filter(h=>h.time.startsWith(day.date));
 if(!relevant.length){
  const family=precipCodeFamily(day.code),raw=label(day.code),fallbackLabel=family==='none'?compactSkyFallback(raw):shortEvent(family,raw);
  return{code:day.code,label:fitDayLabel(fallbackLabel,family==='none'?'Wechselhaft':fallbackLabel),secondary:'',cloudOktas:0,precipitationDominant:family!=='none'};
 }
 const daylight=relevant.filter(h=>h.isDay);
 const cloudWeight=relevant.reduce((sum,h)=>{const hour=Number(h.time.slice(11,13));return sum+(h.isDay?(hour>=9&&hour<18?1.55:1.15):.35)},0);
 const weightedCloud=relevant.reduce((sum,h)=>{const hour=Number(h.time.slice(11,13));return sum+h.cloud*(h.isDay?(hour>=9&&hour<18?1.55:1.15):.35)},0)/Math.max(.1,cloudWeight);
 const sunshineFraction=Math.max(0,day.sunshineDuration||0)/Math.max(1,daylightDurationSeconds(day));
 const hourlyBrightness=daylight.length?daylight.reduce((sum,h)=>sum+Math.max(0,Math.min(1,(85-h.cloud)/70)),0)/daylight.length:Math.max(0,1-weightedCloud/100);
 const skySignal=Math.max(0,Math.min(1,hourlyBrightness*.9+sunshineFraction*.1));
 const heavyCloudShare=daylight.length?daylight.filter(h=>h.cloud>=75).length/daylight.length:0;
 const overcastShare=daylight.length?daylight.filter(h=>h.cloud>=90).length/daylight.length:0;
 const sunshineCloud=(1-skySignal)*100;
 let effectiveCloud=Math.max(0,Math.min(100,weightedCloud*.92+sunshineCloud*.08));
 if(heavyCloudShare>=.5)effectiveCloud=Math.max(effectiveCloud,66);
 if(overcastShare>=.35)effectiveCloud=Math.max(effectiveCloud,78);
 let sunshineForLabel=skySignal;
 if(overcastShare>=.5)sunshineForLabel=Math.min(sunshineForLabel,.09);
 else if(heavyCloudShare>=.65||overcastShare>=.35)sunshineForLabel=Math.min(sunshineForLabel,.18);
 else if(heavyCloudShare>=.45)sunshineForLabel=Math.min(sunshineForLabel,.27);
 const sky=skyFromCloud(effectiveCloud,sunshineForLabel),skyLabel=skyTrend(relevant,sky.label),skyCode=representativeSkyCode(skyLabel,sky.code),candidate=representativePrecipCode(relevant);
 if(!candidate)return{...sky,code:skyCode,label:fitDayLabel(skyLabel,compactSkyFallback(sky.label)),secondary:'',cloudOktas:cloudOktas(effectiveCloud),precipitationDominant:false};
 const severe=candidate.family==='thunder';
 const sustained=candidate.hours>=3&&candidate.averageProbability>=40;
 const quantitativelyRelevant=candidate.sum>=1||candidate.snowSum>=1;
 const dominant=severe?(candidate.maxProbability>=30||candidate.sum>=.2):sustained||quantitativelyRelevant;
 const eventLabel=label(candidate.code),event=shortEvent(candidate.family,eventLabel),timing=eventTiming(relevant,candidate.family);
 if(!dominant){
  const secondary=candidate.maxProbability>=25?possibleEventText(event,timing):'';
  return{...sky,code:skyCode,label:fitDayLabel(skyLabel,compactSkyFallback(sky.label)),secondary,cloudOktas:cloudOktas(effectiveCloud),precipitationDominant:false};
 }
 const lateStart=candidate.first>=10,endsEarly=candidate.last<=13;
 let characterLabel:string;
 if(lateStart){
  const when=transitionTime(candidate.first),full=`${compactSkyFallback(skyLabel)}, ${when} ${event}`;
  characterLabel=fitDayLabel(full,fitDayLabel(`${when} ${event}`,event));
 }else if(endsEarly){
  const lateCloud=partCloud(relevant,13,20),lateSky=Number.isFinite(lateCloud)?conciseSkyLabel(lateCloud).toLocaleLowerCase('de-DE'):compactSkyFallback(skyLabel).toLocaleLowerCase('de-DE');
  characterLabel=fitDayLabel(`${event} morgens, später ${lateSky}`,`${event} morgens`);
 }else{
  characterLabel=timing?timing==='zeitweise'?fitDayLabel(`Zeitweise ${event}`,event):fitDayLabel(`${event} ${timing}`,event):candidate.hours<6&&!severe?fitDayLabel(`Zeitweise ${event}`,event):event;
 }
 return{code:candidate.code,label:characterLabel,secondary:'',cloudOktas:cloudOktas(effectiveCloud),precipitationDominant:true};
}

export function currentIndex(h:Hour[]){const now=Date.now();return h.reduce((b,x,i)=>{const timestamp=Number.isFinite(x.epoch)?x.epoch:Date.parse(`${x.time}Z`),d=Math.abs(timestamp-now);return d<b.d?{i,d}:b},{i:0,d:Infinity}).i}

function quantile(values:number[],p:number){const a=[...values].filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return NaN;const idx=(a.length-1)*p,lo=Math.floor(idx),hi=Math.ceil(idx),w=idx-lo;return hi===lo?a[lo]:a[lo]*(1-w)+a[hi]*w}
function weightedQuantile(values:{value:number;weight:number}[],p:number){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0).sort((x,y)=>x.value-y.value);const total=a.reduce((s,x)=>s+x.weight,0);if(!a.length||total<=0)return NaN;const target=total*p;let c=0;for(const x of a){c+=x.weight;if(c>=target)return x.value}return a[a.length-1].value}
function weightedMean(values:{value:number;weight:number}[]){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0),w=a.reduce((s,x)=>s+x.weight,0);return w?a.reduce((s,x)=>s+x.value*x.weight,0)/w:NaN}
function weightedProbability(values:{value:number;weight:number}[],threshold=.1){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0),w=a.reduce((s,x)=>s+x.weight,0);return w?100*a.filter(x=>x.value>=threshold).reduce((s,x)=>s+x.weight,0)/w:0}
function robustWeighted(values:{value:number;weight:number}[],absolute:number){if(values.length<5)return values;const med=weightedQuantile(values,.5),q1=weightedQuantile(values,.25),q3=weightedQuantile(values,.75),iqr=Math.max(.5,q3-q1),limit=Math.max(absolute,1.8*iqr);const filtered=values.filter(x=>Math.abs(x.value-med)<=limit);return filtered.length>=Math.max(4,Math.ceil(values.length*.55))?filtered:values}
type MemberDay={date:string;max:number;min:number;precipitation:number;sunshineDuration:number};
type ModelResult={model:EnsembleModel;members:Map<string,MemberDay[]>};
function parseModelMembers(w:Weather,model:EnsembleModel):ModelResult|null{
 const times=(w.hourly.time as string[])??[],keys=Object.keys(w.hourly),tempKeys=keys.filter(k=>/^temperature_2m(?:_member\d+)?$/.test(k)),precipKeys=keys.filter(k=>/^precipitation(?:_member\d+)?$/.test(k)),sunshineKeys=keys.filter(k=>/^sunshine_duration(?:_member\d+)?$/.test(k));
 if(!times.length||!tempKeys.length)return null;
 const suffix=(k:string)=>k.replace('temperature_2m',''),pBySuffix=new Map(precipKeys.map(k=>[k.replace('precipitation',''),k])),sBySuffix=new Map(sunshineKeys.map(k=>[k.replace('sunshine_duration',''),k]));
 const members=new Map<string,MemberDay[]>();
 for(const tk of tempKeys){
  const s=suffix(tk),pk=pBySuffix.get(s),sk=sBySuffix.get(s),temps=w.hourly[tk]??[],rain=pk?w.hourly[pk]??[]:[],sunshine=sk?w.hourly[sk]??[]:[];
  const daily=new Map<string,{t:number[];p:number[];s:number[]}>();
  for(let i=0;i<times.length;i++){
   const date=String(times[i]).slice(0,10),tv=n(temps[i]),pv=n(rain[i]),sv=n(sunshine[i]);
   if(!daily.has(date))daily.set(date,{t:[],p:[],s:[]});
   const d=daily.get(date)!;
   if(Number.isFinite(tv)&&tv>-65&&tv<65)d.t.push(tv);
   if(Number.isFinite(pv)&&pv>=0&&pv<150)d.p.push(pv);
   if(Number.isFinite(sv)&&sv>=0&&sv<=21600)d.s.push(sv);
  }
  const rows:MemberDay[]=[];
  daily.forEach((d,date)=>{
   if(d.t.length>=18){
    const max=Math.max(...d.t),min=Math.min(...d.t),precipitation=d.p.reduce((a,b)=>a+b,0),sunshineDuration=d.s.length>=6?clampNumber(d.s.reduce((a,b)=>a+b,0),0,86400):NaN;
    if(Number.isFinite(max)&&Number.isFinite(min)&&max>=min&&max-min<35)rows.push({date,max,min,precipitation,sunshineDuration});
   }
  });
  if(rows.length>=2)members.set(s||'_control',rows);
 }
 return members.size?{model,members}:null;
}
function clampNumber(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}
function modelDayWeight(model:EnsembleModel,lead:number,memberCount:number){if(lead+1>model.maxDays+.5)return 0;const resolution=Math.min(1.65,Math.max(.65,Math.sqrt(25/model.resolutionKm))),update=Math.min(1.25,Math.max(.82,Math.sqrt(6/model.updateHours))),regional=model.bbox?1.12:1,horizon=lead+1<=model.maxDays*.65?1:0.9;return resolution*update*regional*horizon/Math.max(1,memberCount)}
function aggregateMembers(results:ModelResult[]){
 const allDates=[...new Set(results.flatMap(r=>[...r.members.values()].flatMap(m=>m.map(x=>x.date))))].sort().slice(0,14),days:EnsembleDay[]=[];
 for(let lead=0;lead<allDates.length;lead++){
  const date=allDates[lead];
  let maxVals:{value:number;weight:number}[]=[],minVals:{value:number;weight:number}[]=[],rainVals:{value:number;weight:number}[]=[],sunVals:{value:number;weight:number}[]=[];
  const modelsUsed=new Set<string>();let memberCount=0;
  for(const r of results){
   const memberRows=[...r.members.values()].map(rows=>rows.find(x=>x.date===date)).filter(Boolean) as MemberDay[];
   if(!memberRows.length)continue;
   const medMax=quantile(memberRows.map(x=>x.max),.5),medMin=quantile(memberRows.map(x=>x.min),.5),filtered=memberRows.filter(x=>Math.abs(x.max-medMax)<=8&&Math.abs(x.min-medMin)<=8),rows=filtered.length>=Math.max(3,Math.ceil(memberRows.length*.55))?filtered:memberRows,weight=modelDayWeight(r.model,lead,rows.length);
   if(!rows.length||weight<=0)continue;
   modelsUsed.add(r.model.id);memberCount+=rows.length;
   for(const row of rows){maxVals.push({value:row.max,weight});minVals.push({value:row.min,weight});rainVals.push({value:row.precipitation,weight});if(Number.isFinite(row.sunshineDuration))sunVals.push({value:row.sunshineDuration,weight})}
  }
  maxVals=robustWeighted(maxVals,9);minVals=robustWeighted(minVals,9);rainVals=robustWeighted(rainVals,25);sunVals=robustWeighted(sunVals,21600);
  if(modelsUsed.size<2||memberCount<10||maxVals.length<6||minVals.length<6)continue;
  const maxLow=weightedQuantile(maxVals,.1),maxHigh=weightedQuantile(maxVals,.9),maxQ25=weightedQuantile(maxVals,.25),maxQ75=weightedQuantile(maxVals,.75),minLow=weightedQuantile(minVals,.1),minHigh=weightedQuantile(minVals,.9),minQ25=weightedQuantile(minVals,.25),minQ75=weightedQuantile(minVals,.75),precipitationLow=weightedQuantile(rainVals,.1),precipitationHigh=weightedQuantile(rainVals,.9),sunshineDurationLow=sunVals.length>=6?weightedQuantile(sunVals,.1):NaN,sunshineDurationHigh=sunVals.length>=6?weightedQuantile(sunVals,.9):NaN,sunshineDurationMean=sunVals.length>=6?weightedMean(sunVals):NaN;
  if(![maxLow,maxHigh,maxQ25,maxQ75,minLow,minHigh,minQ25,minQ75].every(Number.isFinite)||maxHigh<maxLow||minHigh<minLow)continue;
  days.push({date,maxMean:weightedMean(maxVals),maxLow,maxHigh,maxQ25,maxQ75,minMean:weightedMean(minVals),minLow,minHigh,minQ25,minQ75,precipitationMean:weightedMean(rainVals),precipitationLow:Number.isFinite(precipitationLow)?precipitationLow:0,precipitationHigh:Number.isFinite(precipitationHigh)?precipitationHigh:0,precipitationProbability:weightedProbability(rainVals,.1),sunshineDurationMean,sunshineDurationLow,sunshineDurationHigh,modelCount:modelsUsed.size,memberCount});
 }
 return days;
}
function dailyMeanSeries(w:Weather){
 const out=new Map<string,MemberDay>(),times=(w.hourly.time as string[])??[],temps=w.hourly.temperature_2m??[],rain=w.hourly.precipitation??[],sunshine=w.hourly.sunshine_duration??[],daily=new Map<string,{t:number[];p:number[];s:number[]}>();
 for(let i=0;i<times.length;i++){
  const date=String(times[i]).slice(0,10),tv=n(temps[i]),pv=n(rain[i]),sv=n(sunshine[i]);
  if(!daily.has(date))daily.set(date,{t:[],p:[],s:[]});
  const d=daily.get(date)!;
  if(Number.isFinite(tv)&&tv>-65&&tv<65)d.t.push(tv);
  if(Number.isFinite(pv)&&pv>=0&&pv<150)d.p.push(pv);
  if(Number.isFinite(sv)&&sv>=0&&sv<=21600)d.s.push(sv);
 }
 daily.forEach((d,date)=>{if(d.t.length>=18)out.set(date,{date,max:Math.max(...d.t),min:Math.min(...d.t),precipitation:d.p.reduce((a,b)=>a+b,0),sunshineDuration:d.s.length>=6?clampNumber(d.s.reduce((a,b)=>a+b,0),0,86400):NaN})});
 return out;
}
async function settledMapLimited<T,R>(items:T[],limit:number,task:(item:T,index:number)=>Promise<R>){
 const results=new Array<PromiseSettledResult<R>>(items.length);let cursor=0;
 const worker=async()=>{while(cursor<items.length){const index=cursor++;try{results[index]={status:'fulfilled',value:await task(items[index],index)}}catch(reason){results[index]={status:'rejected',reason}}}};
 await Promise.all(Array.from({length:Math.min(Math.max(1,limit),items.length)},worker));return results;
}
function ensembleRetryDelay(ms:number,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Abgebrochen','AbortError'));return}const timer=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Abgebrochen','AbortError'))},{once:true})})}
async function fetchEnsembleRequest(url:string,signal?:AbortSignal){
 let lastError:unknown;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch(url,{signal,cache:'no-store'});
   if(response.ok)return await response.json() as Weather;
   const error=new Error(`HTTP ${response.status}`);lastError=error;
   if(![429,500,502,503,504].includes(response.status)||attempt===2)throw error;
  }catch(error){
   lastError=error;if(signal?.aborted)throw error;
   const status=Number(String(error instanceof Error?error.message:error).match(/HTTP (\d+)/)?.[1]);
   if(Number.isFinite(status)&&![429,500,502,503,504].includes(status))throw error;
   if(attempt===2)throw error;
  }
  await ensembleRetryDelay(450*(attempt+1),signal);
 }
 throw lastError;
}
async function fetchEnsembleWeather(lat:number,lon:number,forecastDays:number,modelId:string,signal?:AbortSignal){
 let lastError:unknown;
 for(const hourly of ['temperature_2m,precipitation,sunshine_duration','temperature_2m,precipitation']){
  const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',forecast_days:String(forecastDays),models:modelId,hourly});
  try{return await fetchEnsembleRequest(`https://ensemble-api.open-meteo.com/v1/ensemble?${p}`,signal)}catch(error){lastError=error;if(signal?.aborted)throw error}
 }
 throw lastError;
}
async function meanFallback(lat:number,lon:number,signal?:AbortSignal){
 const settled=await settledMapLimited(meanModelIds,4,async id=>({id,series:dailyMeanSeries(await fetchEnsembleWeather(lat,lon,14,id,signal))}));
 if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 const ok=settled.filter(x=>x.status==='fulfilled').map(x=>(x as PromiseFulfilledResult<{id:string;series:Map<string,MemberDay>}>).value).filter(x=>x.series.size>=7);
 const dates=[...new Set(ok.flatMap(x=>[...x.series.keys()]))].sort().slice(0,14),days:EnsembleDay[]=[];
 for(const date of dates){
  const rows=ok.map(x=>x.series.get(date)).filter(Boolean) as MemberDay[];
  if(rows.length<2)continue;
  const max=rows.map(x=>x.max),min=rows.map(x=>x.min),rain=rows.map(x=>x.precipitation),sun=rows.map(x=>x.sunshineDuration).filter(Number.isFinite);
  days.push({date,maxMean:quantile(max,.5),maxLow:quantile(max,.1),maxHigh:quantile(max,.9),maxQ25:quantile(max,.25),maxQ75:quantile(max,.75),minMean:quantile(min,.5),minLow:quantile(min,.1),minHigh:quantile(min,.9),minQ25:quantile(min,.25),minQ75:quantile(min,.75),precipitationMean:quantile(rain,.5),precipitationLow:quantile(rain,.1),precipitationHigh:quantile(rain,.9),precipitationProbability:rain.length?100*rain.filter(v=>v>=.1).length/rain.length:0,sunshineDurationMean:sun.length>=2?quantile(sun,.5):NaN,sunshineDurationLow:sun.length>=2?quantile(sun,.1):NaN,sunshineDurationHigh:sun.length>=2?quantile(sun,.9):NaN,modelCount:rows.length,memberCount:0});
 }
 return{days,models:ok.map(x=>x.id.replaceAll('_ensemble_mean','').replaceAll('_',' '))};
}
export async function ensembles(lat:number,lon:number,signal?:AbortSignal){
 const selected=ensembleModels.filter(m=>modelApplies(m,lat,lon));
 const settled=await settledMapLimited(selected,4,async model=>parseModelMembers(await fetchEnsembleWeather(lat,lon,15,model.id,signal),model));
 if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 const results=settled.filter(x=>x.status==='fulfilled').map(x=>(x as PromiseFulfilledResult<ModelResult|null>).value).filter(Boolean) as ModelResult[],failedCount=settled.filter(x=>x.status==='rejected').length;
 const activeModels=results.map(x=>x.model),runs=await modelRunMetas(activeModels.map(x=>({id:x.metaId,label:x.label,kind:'ensemble' as const})),signal),days=aggregateMembers(results);
 if(days.length>=7)return{days:days.slice(0,14),models:activeModels.map(x=>x.label),runs};
 const fallback=await meanFallback(lat,lon,signal);
 if(fallback.days.length)return{...fallback,runs};
 if(days.length)return{days,models:activeModels.map(x=>x.label),runs};
 throw new Error(`Keine ausreichend vollständigen Ensemble-Daten: ${failedCount} von ${selected.length} Mitgliedermodell-Abrufen fehlgeschlagen; auch die Ensemble-Mittel-Reserve lieferte keine auswertbare Tagesreihe.`);
}

const CLIMATE_CACHE_PREFIX='mid:climatology:1991-2020:';
type ClimateCache={created:number;values:Record<string,{max:number;min:number;years:number}>};
function climateCacheKey(lat:number,lon:number,elevation?:number){return`${CLIMATE_CACHE_PREFIX}${(Math.round(lat*20)/20).toFixed(2)}:${(Math.round(lon*20)/20).toFixed(2)}:${Math.round(Number(elevation??0)/100)*100}`}
function climateFromCache(key:string){try{const raw=localStorage.getItem(key);if(!raw)return null;const parsed=JSON.parse(raw) as ClimateCache;if(!parsed?.values||Date.now()-Number(parsed.created)>180*86400000)return null;return parsed}catch{return null}}
function climateDateKey(date:string){return String(date).slice(5,10)}
export async function climatology(lat:number,lon:number,elevation:number|undefined,dates:string[],signal?:AbortSignal):Promise<ClimateDay[]>{
 const key=climateCacheKey(lat,lon,elevation);let cache=climateFromCache(key);
 if(!cache){
  const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),start_date:'1991-01-01',end_date:'2020-12-31',daily:'temperature_2m_max,temperature_2m_min',timezone:'auto',models:'era5_land',cell_selection:'land'});if(Number.isFinite(elevation))p.set('elevation',String(elevation));
  const data=await j<any>(`https://archive-api.open-meteo.com/v1/archive?${p}`,signal),times=(data.daily?.time??[]) as string[],max=(data.daily?.temperature_2m_max??[]) as number[],min=(data.daily?.temperature_2m_min??[]) as number[],buckets=new Map<string,{max:number[];min:number[]}>();
  for(let i=0;i<times.length;i++){const k=climateDateKey(times[i]),hi=Number(max[i]),lo=Number(min[i]);if(!Number.isFinite(hi)||!Number.isFinite(lo))continue;const row=buckets.get(k)??{max:[],min:[]};row.max.push(hi);row.min.push(lo);buckets.set(k,row)}
  const values:ClimateCache['values']={};buckets.forEach((row,k)=>{if(row.max.length>=20&&row.min.length>=20)values[k]={max:row.max.reduce((a,b)=>a+b,0)/row.max.length,min:row.min.reduce((a,b)=>a+b,0)/row.min.length,years:Math.min(row.max.length,row.min.length)}});if(!values['02-29']&&values['02-28']&&values['03-01'])values['02-29']={max:(values['02-28'].max+values['03-01'].max)/2,min:(values['02-28'].min+values['03-01'].min)/2,years:Math.min(values['02-28'].years,values['03-01'].years)};cache={created:Date.now(),values};try{localStorage.setItem(key,JSON.stringify(cache))}catch{}
 }
 return dates.map(date=>{const v=cache!.values[climateDateKey(date)];return v?{date,maxMean:v.max,minMean:v.min,years:v.years}:null}).filter(Boolean) as ClimateDay[];
}

export function label(c:number){const m:Record<number,string>={0:'Klar',1:'Überwiegend klar',2:'Teilweise bewölkt',3:'Bedeckt',45:'Nebel',48:'Reifnebel',51:'Leichter Sprühregen',53:'Sprühregen',55:'Starker Sprühregen',56:'Leichter gefrierender Sprühregen',57:'Starker gefrierender Sprühregen',61:'Leichter Regen',63:'Regen',65:'Starker Regen',66:'Leichter gefrierender Regen',67:'Starker gefrierender Regen',68:'Leichter Schneeregen',69:'Schneeregen',71:'Leichter Schneefall',73:'Schneefall',75:'Starker Schneefall',77:'Schneegriesel',80:'Leichte Regenschauer',81:'Regenschauer',82:'Starke Regenschauer',83:'Leichte Schneeregenschauer',84:'Schneeregenschauer',85:'Leichte Schneeschauer',86:'Starke Schneeschauer',95:'Gewitter',96:'Gewitter mit Hagel',97:'Starkes Gewitter',99:'Starkes Gewitter mit Hagel'};return m[c]??'Wechselhaft'}
export function icon(c:number,day=true){if(c===0)return day?'☀️':'🌙';if(c===1)return day?'🌤️':'🌙';if(c===2)return'⛅';if(c===3)return'☁️';if([45,48].includes(c))return'🌫️';if([51,53,55,56,57,80].includes(c))return'🌦️';if([61,63,65,66,67,81,82].includes(c))return'🌧️';if([68,69,71,73,75,77,83,84,85,86].includes(c))return'🌨️';if([95,96,97,99].includes(c))return'⛈️';return'🌤️'}
export function wind(v:number,u:WindUnit){if(u==='kmh')return`${Math.round(v*1.852)} km/h`;if(u==='ms')return`${formatDecimal(v*.514444,1,1)} m/s`;if(u==='mph')return`${Math.round(v*1.15078)} mph`;return`${Math.round(v)} kt`}

export type HazardLevel='yellow'|'orange'|'red'|'purple';
export type HazardItem={level:HazardLevel;title:string;text:string;metric?:string};

const levelOrder:{[k in HazardLevel]:number}={purple:4,red:3,orange:2,yellow:1};
function dwdHazardClass(level:DwdWarningLevel):HazardLevel{return level===4?'purple':level===3?'red':level===2?'orange':'yellow'}

export function hazards(h:Hour[],_currentUv?:number,elevation=0,unit:WindUnit='kn'){
 const start=currentIndex(h),horizon=h.slice(start,start+96);if(!horizon.length)return[] as HazardItem[];
 return summarizeDwdWarnings(horizon,elevation,24).map(signal=>({level:dwdHazardClass(signal.level),title:signal.title,metric:formatDwdWarningValue(signal,unit),text:`${formatDwdWarningDetail(signal,unit)} Automatisch aus dem Open-Meteo-Best-Match abgeleitet; keine amtliche Warnung.`})).sort((a,b)=>levelOrder[b.level]-levelOrder[a.level]);
}
