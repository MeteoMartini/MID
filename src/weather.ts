import {fetchWorkerJson,workerBaseCandidates} from './workerClient';
import {writeBoundedStorage} from './cachePolicy';
import {guardedOpenMeteoJson,isOpenMeteoRateLimitError,openMeteoCooldownRetryAt,registerOpenMeteoCooldown,OpenMeteoRateLimitError,type OpenMeteoPriority} from './openMeteoGuard';
import {formatDecimal} from './format';
import {formatDwdWarningDetailWithDirection,formatDwdWarningValue,summarizeDwdWarnings,type DwdWarningKind,type DwdWarningLevel} from './dwdWarnings';
import {loadOperaRaster} from './CompositeData';
import {analyseOperaRasterNowcast} from './OperaRasterSource';
import {precipitationParts,reconcileForecastPrecipitation} from './precipitation';
import type {AirQualityStationMeta} from './airQuality';
import {naturalPossibleEventFallback,naturalPossibleEventText} from './forecastWording';
import {fieldObservationRelevance,fieldRelevanceLimits,fieldSiteCompatibility,fieldWeightPolicy,normalisePrecipitationAccumulation,precipitationIntervalMinutes,sourcePolicyFor,type StationAnalysisField} from './sourceQuality';
import {constrainTemperatureWithDirectObservations,detectStableNightThermalRegime,stableNightThermalWeightFactor,type StableNightThermalSample} from './hyperlocalThermal';
import {dayPeriodHoursForDate} from './forecastPeriods';
import {loadAndSampleRadolan} from './RadolanRasterSource';
import {loadDwdRsCalibration} from './DwdRsSource';
import {loadHxBoundaryCheck} from './HxRadarPointSource';
import {finalizeRadarNowcastCalibration,needsHxBoundaryCheck,type RadarRainStationCalibration} from './RadarNowcastCalibration';
import {astronomicalIsDayAt,solarDaylightWindowAt} from './astronomy';
export type WindUnit='kn'|'kmh'|'ms'|'mph';
export type UrbanClass='urban'|'suburban'|'rural'|'unknown';
export type CloudObservation='cavok'|'clear'|'layers';
export type Location={id:number;name:string;latitude:number;longitude:number;elevation?:number;timezone?:string;country?:string;country_code?:string;city?:string;locality?:string;admin1?:string;admin2?:string;postcodes?:string[];icao?:string;autolocated?:boolean;source?:string;poiType?:string;poiCategory?:string;featureCode?:string;population?:number;urbanClass?:UrbanClass};
export type CoreForecastProxyMeta={provider?:string;fallback?:boolean;cached?:boolean;stale?:boolean;ageMs?:number;upstreamStatus?:number;upstreamReason?:string;sourceUpdatedAt?:string;horizonDays?:number;precipitationProbabilityAvailable?:boolean;checkedAt?:string;version?:string};
export type Weather={latitude:number;longitude:number;elevation:number;timezone:string;timezone_abbreviation?:string;utc_offset_seconds?:number;current:Record<string,number|string>;hourly:Record<string,(number|string|null)[]>;daily:Record<string,(number|string|null)[]>;minutely_15?:Record<string,(number|string|null)[]>;_mid_core_proxy?:CoreForecastProxyMeta};
export type Hour={time:string;epoch:number;timezone:string;temperature:number;apparent:number;humidity:number;dewPoint:number;pressure:number;precipitation:number;rain:number;showers:number;snowfall:number;probability:number;code:number;wind:number;gust:number;gustAdjusted?:boolean;direction:number;cloud:number;lowCloud:number;midCloud?:number;highCloud?:number;uvIndex:number;visibility:number;cape:number;liftedIndex?:number;convectiveInhibition?:number;columnWaterVapour?:number;sunshineDuration?:number;weatherSourceId?:string;weatherSourceLabel?:string;weatherBundleKind?:'best-match'|'coherent-model'|'nowcast';localAdjustment?:number;localAdjustmentSourceLabel?:string;sunriseEpoch?:number;sunsetEpoch?:number;isDay:boolean};
export type Minute15={time:string;epoch:number;timezone:string;precipitation:number;rain:number;showers:number;snowfall:number;probability:number;code:number;sunriseEpoch?:number;sunsetEpoch?:number;isDay?:boolean};
export type PrecipitationProbabilityWindow={startHour:number;endHour:number;probability:number;probabilitySignificant:number;memberCount:number};
export type Day={date:string;code:number;max:number;min:number;sunrise?:string;sunset?:string;sunshineDuration:number;precipitation:number;rain?:number;showers?:number;snowfall?:number;precipitationHours?:number;probability:number;probabilitySignificant?:number;probabilityWindows?:PrecipitationProbabilityWindow[];probabilitySource?:'ensemble-members-dwd'|'hourly-max-fallback';probabilityMemberCount?:number;wind:number;gust:number;gustAdjusted?:boolean;direction:number;uvMax:number;weatherSourceId?:string;weatherSourceLabel?:string};
export type EnsembleModelDay={id:string;label:string;family?:string;independenceGroup?:string;max:number;min:number;precipitation:number;precipitationProbability:number;precipitationProbabilitySignificant?:number;memberCount:number;wind?:number;gust?:number;sunshineDuration?:number;weatherCode?:number};
export type EnsembleScenarioPoint={date:string;max:number;min:number;precipitation:number;sunshineDuration:number;gust:number};
export type EnsembleScenarioModelShare={id:string;label:string;memberCount:number;familyMemberCount:number;familyShare:number};
export type EnsembleScenarioCluster={id:string;label:string;summary:string;probability:number;memberCount:number;modelLabels:string[];modelShares?:EnsembleScenarioModelShare[];divergenceDate?:string;points:EnsembleScenarioPoint[]};
export type EnsembleDay={date:string;maxMean:number;maxLow:number;maxHigh:number;maxQ25:number;maxQ75:number;minMean:number;minLow:number;minHigh:number;minQ25:number;minQ75:number;precipitationMean:number;precipitationLow:number;precipitationHigh:number;precipitationQ25:number;precipitationQ75:number;cumulativePrecipitationMean:number;cumulativePrecipitationLow:number;cumulativePrecipitationHigh:number;cumulativePrecipitationQ25:number;cumulativePrecipitationQ75:number;precipitationProbability:number;precipitationProbabilitySignificant:number;precipitationProbabilityWindows:PrecipitationProbabilityWindow[];sunshineDurationMean:number;sunshineDurationLow:number;sunshineDurationHigh:number;windMean:number;windLow:number;windHigh:number;windQ25:number;windQ75:number;gustMean:number;gustLow:number;gustHigh:number;gustQ25:number;gustQ75:number;modelCount:number;memberCount:number;modelSummaries?:EnsembleModelDay[]};
export type EventPrecipitationProbabilityAssessment={probability:number;probabilitySignificant:number;memberCount:number;modelFamilyCount:number;meanPrecipitation:number;source:'ensemble-members-dwd-event';start:string;end:string};
export type EventEnsembleForecast={days:EnsembleDay[];models:string[];precipitationProbability:EventPrecipitationProbabilityAssessment|null;cached?:boolean;ageMs?:number};
export type ClimateDay={date:string;maxMean:number;minMean:number;years:number};
export type StationSourceType='official-surface'|'aviation'|'road-weather'|'professional'|'private'|'citizen'|'unknown';
export type StationFieldSource={provider:string;stationName:string;stationId?:string;distanceKm?:number;observedAt?:string;networkClass?:'official'|'professional'|'pws'|'citizen'|'unknown';sourceType?:StationSourceType;weight?:number;qc?:string;temporalResolutionMinutes?:number};
export type StationFieldSources=Partial<Record<StationAnalysisField,StationFieldSource[]>>;
export type Station={name:string;provider?:string;stationId?:string;latitude?:number;longitude?:number;distance?:number;height?:number;timestamp?:string;temperature?:number;humidity?:number;dewPoint?:number;pressure?:number;pressureReference?:'QFF'|'MSL'|'QNH'|'station';windSpeed?:number;windDirection?:number;windGust?:number;windUnit?:'kt'|'kmh';visibility?:number;cloudCover?:number;ceilingHft?:number;cloudBaseHft?:number;precipitation?:number;precipitationMinutes?:number;temporalResolutionMinutes?:number;fieldTemporalResolutionMinutes?:Partial<Record<StationAnalysisField,number>>;fieldObservedAt?:Partial<Record<StationAnalysisField,string>>;cloudObservation?:CloudObservation;cloudAnalysisMethod?:string;stationCount?:number;sourceProviders?:string[];fieldSources?:StationFieldSources;sourceType?:StationSourceType;qcLabel?:string;blended?:boolean;temperatureSpread?:number;trustFactor?:number;networkClass?:'official'|'professional'|'pws'|'citizen'|'unknown';siteClass?:UrbanClass;analysisMethod?:string;uncertainty?:number;effectiveResolutionKm?:number;candidateCount?:number;rejectedCount?:number;localCorrection?:number;temperatureResidualCorrection?:number;temperatureObservationConstraint?:number;temperatureDirectEstimate?:number;temperatureObservationSupport?:number;temperatureObservationSpreadK?:number;temperatureStationCount?:number;temperatureEffectiveResolutionKm?:number;backgroundModel?:string;urbanClass?:UrbanClass;terrainSlopeDeg?:number;terrainAspectDeg?:number;terrainReliefM?:number;terrainPositionIndexM?:number;surfaceClass?:string;roughnessLengthM?:number;imperviousnessPercent?:number;localContextSource?:string;terrainWindExposure?:number;terrainWindDirection?:number;terrainWindCorrectionPercent?:number;thermalRegime?:'stable-night';thermalObservationSpreadK?:number;thermalResidualSpreadK?:number;thermalLocalizationKm?:number;thermalWindKt?:number;thermalCloudCover?:number;staleFallback?:boolean;cacheAgeMinutes?:number};
export type OfficialAlertLevel='yellow'|'orange'|'red'|'purple'|'unknown';
export type OfficialAlert={id:string;headline:string;description:string;instruction?:string;level:OfficialAlertLevel;severity?:string;event?:string;source:string;area?:string;effective?:string;onset?:string;expires?:string;url?:string};
export type ModelRunUsageStatus='active'|'fallback'|'unavailable'|'adapter-not-configured'|'reserve';
export type ModelRunMeta={id:string;label:string;kind:'forecast'|'ensemble';initialisationTime?:string;availabilityTime?:string;updateIntervalSeconds?:number;temporalResolutionSeconds?:number;metadataModelId?:string;metadataSource?:string;rapidUpdate?:boolean;resolutionKm?:number;forecastHorizonHours?:number;members?:number;availabilityOnly?:boolean;usageStatus?:ModelRunUsageStatus;statusNote?:string;metadataUnavailable?:boolean};
export type BestMatchModelInfo={summary:string;likelyChain:string;candidateModels?:string;runs:ModelRunMeta[]};
export type RadarNowcastQuality='high'|'medium'|'low';
export type RadarMotionAnchor={lat:number;lon:number;rate?:number};
export type RadarNowcastFrame={time:string;rate:number;nearbyRate?:number;nearestWetKm?:number;siteSupport?:number;hitClass?:'site'|'nearby'|'dry';future:boolean;rawAmountMm?:number;amountMm?:number;amountP25?:number;amountP75?:number;amountSource?:string;amountConfidence?:'high'|'medium'|'low';growthFactor?:number;hxBoundaryFactor?:number;stationCalibrationFactor?:number;hitProbability?:number};
export type RadarNowcastInterval={startAt:string;endAt:string;peakRate:number;frameCount:number;amountMm?:number};
export type RadarNowcastEnsemble={members:9;totalP25:number;totalMedian:number;totalP75:number;hitProbability:number;method:string};
export type RadarNowcast={source:'dwd'|'opera'|'rainviewer'|'model';provider:string;quality:RadarNowcastQuality;radarProbability:number;currentRate?:number;rawCurrentRate?:number;peakRate?:number;rateApproximate?:boolean;rateUncertain?:boolean;seasonalEchoProfile?:'winter-sensitive'|'transition'|'summer-filter';seasonalEchoLabel?:string;siteEchoThreshold?:number;nearbyEchoThreshold?:number;arrivalMinutes?:number;endMinutes?:number;arrivalKind?:'site'|'nearby'|'approximate';arrivalStartAt?:string;arrivalEndAt?:string;endAt?:string;endOpenEnded?:boolean;endUncertain?:boolean;observedAt?:string;summary:string;coverage?:boolean;coverageExpected?:boolean;temporaryUnavailable?:boolean;expectedSource?:string;radarLayer?:string;timeline?:string[];nowcastSeries?:RadarNowcastFrame[];siteIntervals?:RadarNowcastInterval[];interrupted?:boolean;interruptionMinutes?:number;nearestWetKm?:number;observationProvider?:string;license?:string;motionDirectionDeg?:number;motionSpeedKmh?:number;motionConfidence?:'high'|'medium'|'low';motionSource?:string;motionFrameCount?:number;motionFit?:number;motionPairCount?:number;motionDirectionConvention?:'towards';steeringDirectionDeg?:number;steeringSpeedKmh?:number;motionAnchors?:RadarMotionAnchor[];growthRatePerHour?:number;growthTrend?:'growing'|'steady'|'decaying';growthConfidence?:'high'|'medium'|'low';growthSource?:string;forecastAmount60?:number;forecastAmount120?:number;amountSource?:string;rsObservedAt?:string;hxBoundaryCheck?:{observedAt?:string;siteSupport:number;nearestWetKm?:number;centerRate:number;factor:number;source:string};stationCalibration?:{name?:string;provider?:string;observedAt?:string;distanceKm?:number;amount10m:number;radarAmount10m:number;ratio:number;distanceWeight?:number;ageWeight?:number;convectiveWeightReduced:boolean};ensemble?:RadarNowcastEnsemble;diagnostics?:Record<string,unknown>};
export type KonradTrackPoint={time?:string;minutes:number;latitude:number;longitude:number;distanceKm?:number;effectiveDistanceKm?:number;uncertaintyKm?:number;uncertaintyMinorKm?:number;uncertaintyOrientationDeg?:number};
export type KonradFootprintPoint={latitude:number;longitude:number};
export type ThunderstormAffectedPlaceStatus='now'|'likely'|'possible'|'corridor';
export type ThunderstormAffectedPlace={name:string;latitude:number;longitude:number;placeType?:string;countryCode?:string;status:ThunderstormAffectedPlaceStatus;arrivalMinutes:number;arrivalAt?:string;arrivalWindowStartAt?:string;arrivalWindowEndAt?:string;distanceToTrackKm?:number;corridorWidthKm?:number;confidence?:'high'|'medium'|'low';source?:'radar-footprint'|'forecast-track'|'uncertainty-corridor'|'reference-location';isReferenceLocation?:boolean};
export type Konrad3dCell={id:string;latitude:number;longitude:number;displayLatitude?:number;displayLongitude?:number;currentFootprint?:KonradFootprintPoint[];currentDistanceKm:number;siteBearingDeg?:number;relevanceDistanceKm:number;currentImpactRadiusKm?:number;trackForecasts?:KonradTrackPoint[];affectedPlaces?:ThunderstormAffectedPlace[];affectedPlacesTotal?:number;currentAffectedPlaceCount?:number;futureAffectedPlaceCount?:number;routeSummary?:string;placeSource?:string;forecastDistanceKm?:number;forecastEffectiveDistanceKm?:number;forecastUncertaintyKm?:number;forecastTime?:string;forecastLatitude?:number;forecastLongitude?:number;trackForecastTime?:string;trackForecastLatitude?:number;trackForecastLongitude?:number;trackForecastUncertaintyKm?:number;motionDirectionDeg?:number;arrivalMinutes?:number;isApproaching?:boolean;severity:number;severityPrecise?:number;trend:number;hailFlag:number;heavyRainFlag:number;gustFlag?:number;lightningRate:number;areaHail:number;areaLargeHail:number;speedKmh:number;maxReflectivityDbz?:number;meanReflectivityDbz?:number;echoTopKm?:number;echoBottomKm?:number;vilKgM2?:number;vilDensityGm3?:number;cellAreaKm2?:number;detectionCount?:number;rainAmountMm?:number;maxHailSizeCm?:number;windGustKmh?:number;nearGroundClass?:number;muCapeJkg?:number;windShear06Ms?:number;mesocycloneDetected?:boolean;mesocycloneObservedAt?:string;mesocycloneLevel?:number;mesocycloneBottomKm?:number;mesocycloneTopKm?:number;mesocycloneDiameterKm?:number;mesocycloneDiameterEquivalentKm?:number;mesocycloneEchoTopKm?:number;mesocycloneVilKgM2?:number;mesocycloneMeanReflectivityDbz?:number;mesocycloneMaxReflectivityDbz?:number;mesocycloneShearMean?:number;mesocycloneShearMax?:number;mesocycloneMomentumMean?:number;mesocycloneMomentumMax?:number;mesocycloneShearVectors?:number;mesocycloneShearFeatures?:number;mesocycloneVelocityMaxMs?:number;mesocycloneVelocityRotationalMaxMs?:number;mesocycloneVelocityRotationalMeanMs?:number;mesocycloneVelocityRotationalGroundMs?:number;mesocycloneMotionSpeedKmh?:number;mesocycloneOrientationDeg?:number;tornadoProbabilityPercent?:number;mesocycloneDistanceKm?:number};
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

type EnsembleModel={id:string;label:string;metaId:string;family:string;independenceGroup:string;resolutionKm:number;updateHours:number;maxDays:number;bbox?:[number,number,number,number];distributionMode?:'members'|'mean-spread';variantGroup?:string};
const EUROPE_ENSEMBLE_BBOX:[number,number,number,number]=[-11,33,37,71];
const ensembleModels:EnsembleModel[]=[
 {id:'icon_seamless_eps',label:'DWD ICON EPS Seamless',metaId:'dwd_icon_eps',family:'dwd-icon-eps',independenceGroup:'dwd-ensemble',resolutionKm:8,updateHours:3,maxDays:7.5,bbox:[-25,30,45,72]},
 {id:'icon_global_eps',label:'DWD ICON EPS Global',metaId:'dwd_icon_eps',family:'dwd-icon-eps',independenceGroup:'dwd-ensemble',resolutionKm:26,updateHours:12,maxDays:7.5},
 {id:'icon_eu_eps',label:'DWD ICON EPS EU',metaId:'dwd_icon_eu_eps',family:'dwd-icon-eps',independenceGroup:'dwd-ensemble',resolutionKm:13,updateHours:6,maxDays:5,bbox:[-25,30,45,72]},
 {id:'icon_d2_eps',label:'DWD ICON EPS D2',metaId:'dwd_icon_d2_eps',family:'dwd-icon-eps',independenceGroup:'dwd-ensemble',resolutionKm:2,updateHours:3,maxDays:2,bbox:[-6,43,26,58]},
 {id:'knmi_harmonie_arome_cy43_eps',label:'KNMI HARMONIE-AROME EPS',metaId:'knmi_harmonie_arome_cy43_eps',family:'uwc-west-harmonie-eps',independenceGroup:'uwc-west-harmonie-eps',resolutionKm:2.5,updateHours:3,maxDays:2.5,bbox:[-25,38.75,16,62.6]},
 {id:'ncep_gefs_seamless',label:'NOAA GFS Ensemble Seamless',metaId:'ncep_gefs025',family:'noaa-gefs',independenceGroup:'noaa-ensemble',resolutionKm:32,updateHours:6,maxDays:35},
 {id:'ncep_gefs025',label:'NOAA GFS Ensemble 0.25°',metaId:'ncep_gefs025',family:'noaa-gefs',independenceGroup:'noaa-ensemble',resolutionKm:25,updateHours:6,maxDays:10},
 {id:'ncep_gefs05',label:'NOAA GFS Ensemble 0.5°',metaId:'ncep_gefs05',family:'noaa-gefs',independenceGroup:'noaa-ensemble',resolutionKm:50,updateHours:6,maxDays:35},
 {id:'ncep_aigefs025',label:'NOAA AIGEFS 0.25°',metaId:'ncep_aigefs025',family:'noaa-aigefs',independenceGroup:'noaa-ensemble',resolutionKm:25,updateHours:6,maxDays:16},
 {id:'ecmwf_ifs_europe_ensemble',label:'ECMWF IFS ENS Europa 9 km',metaId:'ecmwf_ifs_europe_ensemble',family:'ecmwf-ifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-ifs-ens-native-global',resolutionKm:9,updateHours:6,maxDays:15,bbox:EUROPE_ENSEMBLE_BBOX},
 {id:'ecmwf_aifs_europe_ensemble',label:'ECMWF AIFS ENS Europa 31 km',metaId:'ecmwf_aifs_europe_ensemble',family:'ecmwf-aifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-aifs-ens-native-global',resolutionKm:31,updateHours:6,maxDays:15,bbox:EUROPE_ENSEMBLE_BBOX},
 {id:'ecmwf_ifs025_ensemble',label:'ECMWF IFS Ensemble',metaId:'ecmwf_ifs025_ensemble',family:'ecmwf-ifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-ifs-ens-native-global',resolutionKm:25,updateHours:6,maxDays:15},
 {id:'ecmwf_aifs025_ensemble',label:'ECMWF AIFS Ensemble',metaId:'ecmwf_aifs025_ensemble',family:'ecmwf-aifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-aifs-ens-native-global',resolutionKm:25,updateHours:6,maxDays:15},
 {id:'gem_global_ensemble',label:'GEM Global Ensemble',metaId:'cmc_gem_geps',family:'cmc-geps',independenceGroup:'cmc-ensemble',resolutionKm:25,updateHours:12,maxDays:16},
 {id:'eccc_reps',label:'ECCC REPS 10 km',metaId:'eccc_reps',family:'eccc-reps',independenceGroup:'eccc-reps',resolutionKm:10,updateHours:6,maxDays:3,bbox:[-170,20,-50,75]},
 {id:'bom_access_global_ensemble',label:'BOM ACCESS Global Ensemble',metaId:'bom_access_global_ensemble',family:'bom-access-ens',independenceGroup:'bom-ensemble',resolutionKm:40,updateHours:6,maxDays:10},
 {id:'ukmo_global_ensemble_20km',label:'UKMO Global Ensemble',metaId:'ukmo_global_ensemble_20km',family:'ukmo-ens',independenceGroup:'ukmo-ensemble',resolutionKm:20,updateHours:6,maxDays:8},
 {id:'ukmo_uk_ensemble_2km',label:'UKMO UK Ensemble',metaId:'ukmo_uk_ensemble_2km',family:'ukmo-ens',independenceGroup:'ukmo-ensemble',resolutionKm:2,updateHours:1,maxDays:5,bbox:[-12,48,4,62]},
 {id:'meteoswiss_icon_ch1_ensemble',label:'MeteoSwiss ICON CH1',metaId:'meteoswiss_icon_ch1_ensemble',family:'meteoswiss-icon-ens',independenceGroup:'meteoswiss-ensemble',resolutionKm:1,updateHours:3,maxDays:1.4,bbox:[3,43,18,50]},
 {id:'meteoswiss_icon_ch2_ensemble',label:'MeteoSwiss ICON CH2',metaId:'meteoswiss_icon_ch2_ensemble',family:'meteoswiss-icon-ens',independenceGroup:'meteoswiss-ensemble',resolutionKm:2,updateHours:6,maxDays:.5,bbox:[3,43,18,50]},
 {id:'google_weathernext2_ensemble',label:'Google WeatherNext 2',metaId:'google_weathernext2_ensemble',family:'google-weathernext2',independenceGroup:'google-weathernext2',resolutionKm:25,updateHours:12,maxDays:15}
];
type EnsembleMeanModel=EnsembleModel;
const ensemblePriority=['ukmo_uk_ensemble_2km','icon_d2_eps','knmi_harmonie_arome_cy43_eps','icon_eu_eps','icon_seamless_eps','ecmwf_ifs_europe_ensemble','ecmwf_aifs_europe_ensemble','ecmwf_ifs025_ensemble','ecmwf_aifs025_ensemble','ncep_gefs05','eccc_reps','gem_global_ensemble','google_weathernext2_ensemble'];
const meanPriority=['dwd_icon_eps_ensemble_mean_seamless','ncep_hgefs025_ensemble_mean','ecmwf_ifs_europe_ensemble_mean','ecmwf_aifs_europe_ensemble_mean','ecmwf_ifs025_ensemble_mean','ecmwf_aifs025_ensemble_mean','ncep_aigefs025_ensemble_mean','ncep_gefs_ensemble_mean_seamless','ukmo_uk_ensemble_mean_2km','ukmo_global_ensemble_mean_20km','meteoswiss_icon_ch1_ensemble_mean','meteoswiss_icon_ch2_ensemble_mean','cmc_gem_geps_ensemble_mean','bom_access_global_ensemble_mean','google_weathernext2_ensemble_mean'];
const meanModels:EnsembleMeanModel[]=[
 {id:'dwd_icon_eps_ensemble_mean_seamless',label:'DWD ICON EPS Mittel',metaId:'dwd_icon_eps',family:'dwd-icon-eps',independenceGroup:'dwd-ensemble',resolutionKm:8,updateHours:3,maxDays:7.5},
 {id:'ecmwf_ifs_europe_ensemble_mean',label:'ECMWF IFS ENS Europa Mittel',metaId:'ecmwf_ifs_europe_ensemble_mean',family:'ecmwf-ifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-ifs-ens-native-global',resolutionKm:9,updateHours:6,maxDays:15,bbox:EUROPE_ENSEMBLE_BBOX},
 {id:'ecmwf_aifs_europe_ensemble_mean',label:'ECMWF AIFS ENS Europa Mittel',metaId:'ecmwf_aifs_europe_ensemble_mean',family:'ecmwf-aifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-aifs-ens-native-global',resolutionKm:31,updateHours:6,maxDays:15,bbox:EUROPE_ENSEMBLE_BBOX},
 {id:'ncep_hgefs025_ensemble_mean',label:'NOAA HGEFS Mittel/Spread',metaId:'ncep_hgefs025_ensemble_mean',family:'noaa-hgefs',independenceGroup:'noaa-ensemble',resolutionKm:25,updateHours:6,maxDays:10},
 {id:'ncep_gefs_ensemble_mean_seamless',label:'NOAA GEFS Mittel',metaId:'ncep_gefs05',family:'noaa-gefs',independenceGroup:'noaa-ensemble',resolutionKm:32,updateHours:6,maxDays:14},
 {id:'ncep_aigefs025_ensemble_mean',label:'NOAA AIGEFS Mittel/Spread',metaId:'ncep_aigefs025',family:'noaa-aigefs',independenceGroup:'noaa-ensemble',resolutionKm:25,updateHours:6,maxDays:16},
 {id:'ukmo_global_ensemble_mean_20km',label:'UKMO Global ENS Mittel/Spread',metaId:'ukmo_global_ensemble_20km',family:'ukmo-ens',independenceGroup:'ukmo-ensemble',resolutionKm:20,updateHours:6,maxDays:8},
 {id:'ukmo_uk_ensemble_mean_2km',label:'UKMO UK ENS Mittel/Spread',metaId:'ukmo_uk_ensemble_2km',family:'ukmo-ens',independenceGroup:'ukmo-ensemble',resolutionKm:2,updateHours:1,maxDays:5,bbox:[-12,48,4,62]},
 {id:'meteoswiss_icon_ch1_ensemble_mean',label:'MeteoSwiss ICON CH1 Mittel/Spread',metaId:'meteoswiss_icon_ch1_ensemble',family:'meteoswiss-icon-ens',independenceGroup:'meteoswiss-ensemble',resolutionKm:1,updateHours:3,maxDays:1.4,bbox:[3,43,18,50]},
 {id:'meteoswiss_icon_ch2_ensemble_mean',label:'MeteoSwiss ICON CH2 Mittel/Spread',metaId:'meteoswiss_icon_ch2_ensemble',family:'meteoswiss-icon-ens',independenceGroup:'meteoswiss-ensemble',resolutionKm:2,updateHours:6,maxDays:.5,bbox:[3,43,18,50]},
 {id:'ecmwf_ifs025_ensemble_mean',label:'ECMWF IFS ENS Mittel',metaId:'ecmwf_ifs025_ensemble',family:'ecmwf-ifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-ifs-ens-native-global',resolutionKm:25,updateHours:6,maxDays:14},
 {id:'ecmwf_aifs025_ensemble_mean',label:'ECMWF AIFS ENS Mittel',metaId:'ecmwf_aifs025_ensemble',family:'ecmwf-aifs-ens',independenceGroup:'ecmwf-ensemble',variantGroup:'ecmwf-aifs-ens-native-global',resolutionKm:25,updateHours:6,maxDays:14},
 {id:'cmc_gem_geps_ensemble_mean',label:'GEM GEPS Mittel',metaId:'cmc_gem_geps',family:'cmc-geps',independenceGroup:'cmc-ensemble',resolutionKm:25,updateHours:12,maxDays:14},
 {id:'bom_access_global_ensemble_mean',label:'BOM ACCESS ENS Mittel/Spread',metaId:'bom_access_global_ensemble',family:'bom-access-ens',independenceGroup:'bom-ensemble',resolutionKm:40,updateHours:6,maxDays:10},
 {id:'google_weathernext2_ensemble_mean',label:'Google WeatherNext 2 Mittel',metaId:'google_weathernext2_ensemble',family:'google-weathernext2',independenceGroup:'google-weathernext2',resolutionKm:25,updateHours:12,maxDays:14}
];
const ENSEMBLE_CACHE_PREFIX='mid:ensemble:v14:';
const ENSEMBLE_FRESH_CACHE_MS=20*60*1000;
const EVENT_ENSEMBLE_CACHE_PREFIX='mid:event-ensemble:v2:';
const EVENT_ENSEMBLE_STALE_MS=4*60*60*1000;
const DIRECT_REGIONAL_ENSEMBLE_MODELS=new Set(['knmi_harmonie_arome_cy43_eps','eccc_reps']);
function modelApplies(m:EnsembleModel,lat:number,lon:number){if(!m.bbox)return true;const[minLon,minLat,maxLon,maxLat]=m.bbox;return lon>=minLon&&lon<=maxLon&&lat>=minLat&&lat<=maxLat}
function orderedModels(models:EnsembleModel[],priority:string[]){const rank=new Map(priority.map((id,index)=>[id,index])),ordered=[...models].sort((a,b)=>(rank.get(a.id)??99)-(rank.get(b.id)??99)||a.resolutionKm-b.resolutionKm),first:EnsembleModel[]=[],reserve:EnsembleModel[]=[],seen=new Set<string>();for(const model of ordered){if(seen.has(model.independenceGroup))reserve.push(model);else{seen.add(model.independenceGroup);first.push(model)}}return[...first,...reserve]}
function selectedEnsembleModels(lat:number,lon:number){return orderedModels(ensembleModels.filter(model=>modelApplies(model,lat,lon)),ensemblePriority)}
function selectedMeanModels(lat:number,lon:number){return orderedModels(meanModels.filter(model=>modelApplies(model,lat,lon)),meanPriority)}
function eventLeadDayIndex(date:string){const target=Date.parse(`${date}T12:00:00Z`),now=new Date(),today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),12);return Number.isFinite(target)?Math.max(0,Math.floor((target-today)/86400000)):0}
function selectedEnsembleModelsForEvent(lat:number,lon:number,date:string){const lead=eventLeadDayIndex(date),applicable=ensembleModels.filter(model=>modelApplies(model,lat,lon)&&model.maxDays>=lead+.5);return orderedModels(applicable,ensemblePriority)}
type EnsembleRequestUnit={models:EnsembleModel[]};
type EnsembleLoadAttempt<T>={model:EnsembleModel;status:'active'|'fallback'|'unavailable'|'adapter-not-configured'|'reserve';value?:T;error?:unknown};
function ensembleRequestUnits(models:EnsembleModel[]){const units:EnsembleRequestUnit[]=[],byGroup=new Map<string,EnsembleRequestUnit>();for(const model of models){if(model.variantGroup){const existing=byGroup.get(model.variantGroup);if(existing){existing.models.push(model);continue}const unit={models:[model]};byGroup.set(model.variantGroup,unit);units.push(unit)}else units.push({models:[model]})}return units}
function adapterNotConfigured(error:unknown){return /adapter.+nicht konfiguriert|point adapter.+not configured|numerischer punktadapter nicht konfiguriert/i.test(String(error instanceof Error?error.message:error??''))}
async function loadEnsembleUnits<T>(models:EnsembleModel[],target:number,loader:(model:EnsembleModel)=>Promise<T|null>,signal?:AbortSignal){const units=ensembleRequestUnits(models),attempts:EnsembleLoadAttempt<T>[]=[],successes:{model:EnsembleModel;value:T;status:'active'|'fallback'}[]=[];let cursor=0;const worker=async()=>{while(cursor<units.length&&successes.length<target){const unit=units[cursor++];for(let variantIndex=0;variantIndex<unit.models.length;variantIndex++){if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');const model=unit.models[variantIndex];try{const value=await loader(model);if(value){if(successes.length>=target){attempts.push({model,status:'reserve',value});break}const status=variantIndex>0?'fallback':'active';attempts.push({model,status,value});successes.push({model,value,status});break}attempts.push({model,status:'unavailable'})}catch(error){if(signal?.aborted)throw error;attempts.push({model,status:adapterNotConfigured(error)?'adapter-not-configured':'unavailable',error})}}}};await Promise.all(Array.from({length:Math.min(2,units.length)},worker));return{successes:successes.slice(0,target),attempts,units}}
function ensembleCacheKey(lat:number,lon:number){return`${ENSEMBLE_CACHE_PREFIX}${(Math.round(lat*20)/20).toFixed(2)}:${(Math.round(lon*20)/20).toFixed(2)}`}
function readEnsembleCache(lat:number,lon:number){try{const raw=localStorage.getItem(ensembleCacheKey(lat,lon));if(!raw)return null;const parsed=JSON.parse(raw) as {created:number;days:EnsembleDay[];models:string[];runs:ModelRunMeta[];scenarios?:EnsembleScenarioCluster[]},ageMs=Date.now()-Number(parsed.created);if(!Array.isArray(parsed.days)||parsed.days.length<5||!parsed.days.every(day=>Array.isArray(day.precipitationProbabilityWindows)&&[day.cumulativePrecipitationMean,day.cumulativePrecipitationLow,day.cumulativePrecipitationHigh,day.cumulativePrecipitationQ25,day.cumulativePrecipitationQ75].every(Number.isFinite))||!Number.isFinite(ageMs)||ageMs<0||ageMs>24*3600000)return null;return{...parsed,scenarios:Array.isArray(parsed.scenarios)?parsed.scenarios:[],ageMs}}catch{return null}}
function writeEnsembleCache(lat:number,lon:number,value:{days:EnsembleDay[];models:string[];runs:ModelRunMeta[];scenarios?:EnsembleScenarioCluster[]}){try{localStorage.setItem(ensembleCacheKey(lat,lon),JSON.stringify({created:Date.now(),...value}))}catch{}}

async function j<T>(url:string,signal?:AbortSignal,priority:OpenMeteoPriority='normal'):Promise<T>{if(/(?:^|\.)open-meteo\.com$/i.test(new URL(url).hostname))return guardedOpenMeteoJson<T>(url,{signal,cache:'no-store'},{priority});const r=await fetch(url,{signal,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}

function parseLocalIso(value:string){const match=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);if(!match)return null;return{year:Number(match[1]),month:Number(match[2]),day:Number(match[3]),hour:Number(match[4]),minute:Number(match[5]),second:Number(match[6]||0)}}
function partsAtEpoch(epoch:number,timeZone:string){try{const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch)),get=(type:string)=>Number(parts.find(x=>x.type===type)?.value);const year=get('year'),month=get('month'),day=get('day'),hour=get('hour'),minute=get('minute'),second=get('second');return[year,month,day,hour,minute,second].every(Number.isFinite)?{year,month,day,hour,minute,second}:null}catch{return null}}
export function localIsoEpoch(value:string,timeZone?:string,utcOffsetSeconds=0){const local=parseLocalIso(value);if(!local)return Number.NaN;const wall=Date.UTC(local.year,local.month-1,local.day,local.hour,local.minute,local.second);if(timeZone){let epoch=wall-utcOffsetSeconds*1000;for(let i=0;i<3;i++){const actual=partsAtEpoch(epoch,timeZone);if(!actual)break;const rendered=Date.UTC(actual.year,actual.month-1,actual.day,actual.hour,actual.minute,actual.second),delta=wall-rendered;if(Math.abs(delta)<500)break;epoch+=delta}return epoch}return wall-utcOffsetSeconds*1000}

type PhotonFeature={geometry?:{type?:string;coordinates?:number[]};properties?:Record<string,any>};
function numeric(value:unknown){if(value===null||value===undefined||value==='')return undefined;const n=Number(String(value).replace(',','.'));return Number.isFinite(n)?n:undefined}
function poiCategory(key?:string,value?:string){const k=String(key||'').toLowerCase(),v=String(value||'').toLowerCase();if(k==='natural'&&v==='peak')return'Berggipfel';if(k==='tourism'&&['hotel','motel','hostel','guest_house','chalet','apartment','camp_site','alpine_hut','wilderness_hut'].includes(v))return'Unterkunft';if(k==='tourism')return'Sehenswürdigkeit';if(k==='amenity'&&['restaurant','cafe','fast_food','bar','pub'].includes(v))return'Gastronomie';if(k==='amenity')return'POI';if(k==='leisure')return'Freizeit';if(k==='aerialway')return'Bergbahn';if(k==='railway'||k==='public_transport')return'Bahnhof/Haltestelle';if(k==='shop')return'Geschäft';if(k==='place')return'Ort';if(k==='highway')return'Straße';return'POI'}
function photonId(properties:Record<string,any>,index:number){const osm=Number(properties.osm_id),type=String(properties.osm_type||'').toUpperCase(),suffix=type==='N'?1:type==='W'?2:type==='R'?3:4;if(Number.isFinite(osm)&&Math.abs(osm)<8e14)return-(Math.abs(osm)*10+suffix);let hash=2166136261;for(const ch of `${properties.name||''}:${index}:${properties.countrycode||''}`){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619)}return-(Math.abs(hash)+index+1)}
function urbanClassFromPlace(featureCode?:string,population?:number,osmKey?:string,osmValue?:string):UrbanClass{const code=String(featureCode||'').toUpperCase(),key=String(osmKey||'').toLowerCase(),value=String(osmValue||'').toLowerCase(),pop=Number(population);if(key==='natural'||['peak','wood','forest','farmland','meadow','village','hamlet','isolated_dwelling'].includes(value))return'rural';if(Number.isFinite(pop)){if(pop>=100000)return'urban';if(pop>=10000)return'suburban';if(pop>0&&pop<2500)return'rural'}if(['PPLC','PPLA','PPLA2','PPLA3','PPLA4'].includes(code)||value==='city')return'urban';if(['PPLX','PPLL'].includes(code)||['suburb','neighbourhood','quarter','residential','town'].includes(value))return'suburban';if(['PPLQ','PPLR'].includes(code)||['village','hamlet'].includes(value))return'rural';if(code==='PPL')return Number.isFinite(pop)&&pop>=2500?'suburban':'unknown';return'unknown'}
function photonLocation(feature:PhotonFeature,index:number):Location|null{const coordinates=feature.geometry?.coordinates,properties=feature.properties??{},lon=Number(coordinates?.[0]),lat=Number(coordinates?.[1]);if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return null;const name=String(properties.name||properties.city||properties.locality||'').trim();if(!name)return null;const extra=properties.extra??{},elevation=numeric(extra.ele??extra.elevation??properties.ele??properties.elevation),category=poiCategory(properties.osm_key,properties.osm_value),admin1=properties.state||properties.region,admin2=properties.county||properties.district||properties.city,urbanClass=urbanClassFromPlace(undefined,undefined,properties.osm_key,properties.osm_value);return{id:photonId(properties,index),name,latitude:lat,longitude:lon,elevation,country:properties.country,country_code:String(properties.countrycode||'').toUpperCase()||undefined,admin1:admin1?String(admin1):undefined,admin2:admin2&&String(admin2)!==String(admin1)?String(admin2):undefined,postcodes:properties.postcode?[String(properties.postcode)]:undefined,source:'OpenStreetMap/Photon',poiType:[properties.osm_key,properties.osm_value].filter(Boolean).join('='),poiCategory:category,urbanClass}}
function similarLocation(a:Location,b:Location){if(a.name.trim().toLocaleLowerCase('de-DE')!==b.name.trim().toLocaleLowerCase('de-DE'))return false;return haversine(a.latitude,a.longitude,b.latitude,b.longitude)<2500}

type ModelMetaCandidate={id:string;label:string;kind:'forecast'|'ensemble';metaIds?:string[];metaSource?:'open-meteo'|'dwd-ruc';rapidUpdate?:boolean;resolutionKm?:number;forecastHorizonHours?:number;members?:number;availabilityOnly?:boolean};
type ForecastCandidate=ModelMetaCandidate&{countries?:string[];bbox?:[number,number,number,number]};
const forecastCandidates:ForecastCandidate[]=[
 {id:'icon-d2-ruc',label:'DWD ICON-D2-RUC',kind:'forecast',metaSource:'dwd-ruc',rapidUpdate:true,resolutionKm:2,forecastHorizonHours:14,availabilityOnly:true,countries:['DE','CH','AT'],bbox:[-6,43,26,58]},
 {id:'icon-d2-ruc-eps',label:'DWD ICON-D2-RUC-EPS',kind:'ensemble',metaSource:'dwd-ruc',rapidUpdate:true,resolutionKm:2,forecastHorizonHours:14,members:20,availabilityOnly:true,countries:['DE','CH','AT'],bbox:[-6,43,26,58]},
 {id:'dwd_icon_d2',label:'DWD ICON-D2',kind:'forecast',resolutionKm:2,forecastHorizonHours:48,countries:['DE','CH','AT'],bbox:[-6,43,26,58]},
 {id:'knmi_harmonie_arome_europe',label:'KNMI HARMONIE Europe',kind:'forecast',rapidUpdate:true,resolutionKm:5.5,forecastHorizonHours:60,bbox:[-14,35,32,66]},
 {id:'meteoswiss_icon_ch1',label:'MeteoSwiss ICON-CH1',kind:'forecast',countries:['CH']},
 {id:'meteoswiss_icon_ch2',label:'MeteoSwiss ICON-CH2',kind:'forecast',countries:['CH']},
 {id:'geosphere_arome_austria',label:'GeoSphere AROME Austria',kind:'forecast',countries:['AT']},
 {id:'chmi_aladin_cz_1km',label:'CHMI ALADIN Tschechien 1 km',kind:'forecast',countries:['CZ']},
 {id:'chmi_aladin_central_europe_2km',label:'CHMI ALADIN Mitteleuropa 2,3 km',kind:'forecast',bbox:[-12,35,35,62]},
 {id:'chmi_aladin_seamless',label:'CHMI ALADIN Seamless',kind:'forecast',bbox:[-12,35,35,62]},
 {id:'meteofrance_arome_france_hd_15min',label:'Météo-France AROME HD 15 min',kind:'forecast',rapidUpdate:true,resolutionKm:1.5,forecastHorizonHours:6,countries:['FR']},
 {id:'meteofrance_arome_france_15min',label:'Météo-France AROME 15 min',kind:'forecast',rapidUpdate:true,resolutionKm:2.5,forecastHorizonHours:6,countries:['FR']},
 {id:'meteofrance_arome_france_hd',label:'Météo-France AROME HD',kind:'forecast',resolutionKm:1.5,forecastHorizonHours:48,countries:['FR']},
 {id:'meteofrance_arome_france0025',label:'Météo-France AROME',kind:'forecast',resolutionKm:2.5,forecastHorizonHours:48,countries:['FR']},
 {id:'knmi_harmonie_arome_netherlands',label:'KNMI HARMONIE Niederlande',kind:'forecast',rapidUpdate:true,resolutionKm:2,forecastHorizonHours:60,countries:['NL','BE']},
 {id:'ukmo_uk_deterministic_2km',label:'UKMO UKV 2 km',kind:'forecast',rapidUpdate:true,resolutionKm:2,forecastHorizonHours:54,countries:['GB','IE']},
 {id:'metno_nordic_pp',label:'MET Nordic PP',kind:'forecast',rapidUpdate:true,resolutionKm:1,forecastHorizonHours:60,countries:['NO','SE','DK','FI']},
 {id:'dmi_harmonie_arome_europe',label:'DMI Harmonie Europe',kind:'forecast',countries:['DK','DE','NL','BE','NO','SE']},
 {id:'italia_meteo_arpae_icon_2i',label:'ItaliaMeteo ICON-2I',kind:'forecast',countries:['IT']},
 {id:'ncep_hrrr_conus',label:'NOAA HRRR',kind:'forecast',rapidUpdate:true,resolutionKm:3,forecastHorizonHours:48,countries:['US','CA']},
 {id:'ncep_nam_conus',label:'NOAA NAM',kind:'forecast',resolutionKm:12,forecastHorizonHours:84,countries:['US','CA']},
 {id:'ncep_nbm_conus',label:'NOAA NBM',kind:'forecast',rapidUpdate:true,resolutionKm:2.5,forecastHorizonHours:264,countries:['US','CA']},
 {id:'cmc_gem_hrdps',label:'GEM HRDPS 2,5 km',kind:'forecast',resolutionKm:2.5,forecastHorizonHours:48,countries:['CA','US'],bbox:[-150,35,-45,72]},
 {id:'cmc_gem_rdps',label:'GEM RDPS 10 km',kind:'forecast',resolutionKm:10,forecastHorizonHours:84,countries:['CA','US'],bbox:[-170,20,-35,90]},
 {id:'jma_msm',label:'JMA MSM 5 km',kind:'forecast',resolutionKm:5,forecastHorizonHours:96,countries:['JP','KR'],bbox:[118,20,155,52]},
 {id:'kma_ldps',label:'KMA LDPS 1,5 km',kind:'forecast',resolutionKm:1.5,forecastHorizonHours:48,countries:['KR'],bbox:[120,30,134,42]},
 {id:'dwd_icon_eu',label:'DWD ICON-EU',kind:'forecast',resolutionKm:7,forecastHorizonHours:120,bbox:[-25,30,45,72]},
 {id:'meteofrance_arpege_europe',label:'Météo-France ARPEGE Europe',kind:'forecast',bbox:[-25,30,45,72]}
];
const globalForecastCandidates:ForecastCandidate[]=[
 {id:'ecmwf_ifs',label:'ECMWF IFS HRES 9 km',kind:'forecast',resolutionKm:9,forecastHorizonHours:360},
 {id:'ecmwf_aifs025_single',label:'ECMWF AIFS Single 0,25°',kind:'forecast',metaIds:['ecmwf_aifs025_single'],resolutionKm:25,forecastHorizonHours:360},
 {id:'ncep_gfs_global',label:'NOAA GFS Global',kind:'forecast',metaIds:['ncep_gfs_global','ncep_gfs013','ncep_gfs025'],resolutionKm:13,forecastHorizonHours:384},
 {id:'ncep_aigfs025',label:'NOAA AIGFS 0,25°',kind:'forecast',resolutionKm:25,forecastHorizonHours:384},
 {id:'dwd_icon',label:'DWD ICON Global',kind:'forecast',resolutionKm:11,forecastHorizonHours:180},
 {id:'ukmo_global_deterministic_10km',label:'UKMO Global 10 km',kind:'forecast',resolutionKm:10,forecastHorizonHours:168},
 {id:'cmc_gem_gdps',label:'GEM Global 15 km',kind:'forecast',resolutionKm:15,forecastHorizonHours:240},
 {id:'jma_gsm',label:'JMA GSM 55 km',kind:'forecast',resolutionKm:55,forecastHorizonHours:264},
 {id:'kma_gdps',label:'KMA GDPS 13 km',kind:'forecast',resolutionKm:13,forecastHorizonHours:288},
 {id:'bom_access_global',label:'BOM ACCESS Global 15 km',kind:'forecast',resolutionKm:15,forecastHorizonHours:240},
 {id:'cma_grapes_global',label:'CMA GRAPES Global 15 km',kind:'forecast',resolutionKm:15,forecastHorizonHours:240},
 {id:'meteofrance_arpege_world',label:'Météo-France ARPEGE World',kind:'forecast',resolutionKm:25,forecastHorizonHours:96}
];
function candidateApplies(candidate:ForecastCandidate,lat:number,lon:number,country:string){
 if(candidate.countries?.includes(country))return true;
 if(!candidate.bbox)return false;const[minLon,minLat,maxLon,maxLat]=candidate.bbox;return lon>=minLon&&lon<=maxLon&&lat>=minLat&&lat<=maxLat;
}
function modelMetaEpochMs(value:unknown){const numberValue=Number(value);if(!Number.isFinite(numberValue))return Number.NaN;return numberValue>10_000_000_000?numberValue:numberValue*1000}
function modelMetaIsFresh(data:any){const initMs=modelMetaEpochMs(data?.last_run_initialisation_time),updateSeconds=Math.max(3600,Number(data?.update_interval_seconds)||21600),maximumAgeMs=Math.max(18*3600000,Math.min(72*3600000,updateSeconds*4000+6*3600000)),now=Date.now();return Number.isFinite(initMs)&&initMs<=now+2*3600000&&now-initMs<=maximumAgeMs}
async function modelRunMeta(candidate:ModelMetaCandidate,signal?:AbortSignal):Promise<ModelRunMeta|null>{
 if(candidate.metaSource==='dwd-ruc'){
  try{
   const data=await fetchWorkerJson<any>('rapid-model-meta',{model:candidate.id},{purpose:'general',signal,timeoutMs:9000,cache:'no-store'}),initMs=modelMetaEpochMs(data?.last_run_initialisation_time),availableMs=modelMetaEpochMs(data?.last_run_availability_time);
   if(!modelMetaIsFresh(data)||!Number.isFinite(initMs))return null;
   return{id:candidate.id,label:candidate.label,kind:candidate.kind,initialisationTime:new Date(initMs).toISOString(),availabilityTime:Number.isFinite(availableMs)?new Date(availableMs).toISOString():undefined,updateIntervalSeconds:Number(data.update_interval_seconds)||3600,temporalResolutionSeconds:Number(data.temporal_resolution_seconds)||undefined,metadataModelId:candidate.id,metadataSource:'DWD Open Data · ICON-D2-RUC',rapidUpdate:true,resolutionKm:Number(data._mid_resolution_km)||candidate.resolutionKm,forecastHorizonHours:Number(data._mid_forecast_horizon_hours)||candidate.forecastHorizonHours,members:Number(data._mid_members)||candidate.members,availabilityOnly:true};
  }catch{return null}
 }
 const host=candidate.kind==='ensemble'?'https://ensemble-api.open-meteo.com':'https://api.open-meteo.com',metaIds=candidate.metaIds?.length?candidate.metaIds:[candidate.id];
 for(const metadataModelId of metaIds){
  try{
   let data:any;
   if(workerBaseCandidates('general').length){try{const proxied=await fetchWorkerJson<any>('model-meta',{model:metadataModelId,kind:candidate.kind},{purpose:'general',signal,timeoutMs:9000,cache:'no-store'});if(modelMetaIsFresh(proxied))data=proxied}catch{}}
   if(!data){const direct=await j<any>(`${host}/data/${metadataModelId}/static/meta.json?cache_buster=${Date.now()}`,signal);if(modelMetaIsFresh(direct))data=direct}
   if(!data)continue;
   const initMs=modelMetaEpochMs(data.last_run_initialisation_time),availableMs=modelMetaEpochMs(data.last_run_availability_time),availableValid=Number.isFinite(availableMs)&&availableMs>=initMs-3600000&&availableMs<=Date.now()+2*3600000,updateIntervalSeconds=Number(data.update_interval_seconds)||undefined;
   return{id:candidate.id,label:candidate.label,kind:candidate.kind,initialisationTime:new Date(initMs).toISOString(),availabilityTime:availableValid?new Date(availableMs).toISOString():undefined,updateIntervalSeconds,temporalResolutionSeconds:Number(data.temporal_resolution_seconds)||undefined,metadataModelId,metadataSource:'Open-Meteo Metadata API',rapidUpdate:Boolean(candidate.rapidUpdate||(updateIntervalSeconds&&updateIntervalSeconds<=3600)),resolutionKm:candidate.resolutionKm,forecastHorizonHours:candidate.forecastHorizonHours,members:candidate.members,availabilityOnly:candidate.availabilityOnly};
  }catch{}
 }
 return null
}
const BEST_MATCH_INFO_CACHE_PREFIX='mid:best-match-model-info:v1:';
const BEST_MATCH_INFO_FRESH_MS=20*60*1000;
const BEST_MATCH_INFO_STALE_MS=6*3600000;
function bestMatchInfoCacheKey(lat:number,lon:number,country?:string){return`${BEST_MATCH_INFO_CACHE_PREFIX}${Number(lat).toFixed(2)}:${Number(lon).toFixed(2)}:${countryCodeFromLocation(country)||'XX'}`}
function readBestMatchInfoCache(lat:number,lon:number,country?:string,maxAge=BEST_MATCH_INFO_FRESH_MS){try{const parsed=JSON.parse(localStorage.getItem(bestMatchInfoCacheKey(lat,lon,country))||'null') as {at?:number;value?:BestMatchModelInfo}|null;if(!parsed?.value||!Number.isFinite(parsed.at)||Date.now()-Number(parsed.at)>maxAge)return null;return parsed.value}catch{return null}}
function writeBestMatchInfoCache(lat:number,lon:number,country:string|undefined,value:BestMatchModelInfo){try{writeBoundedStorage(localStorage,bestMatchInfoCacheKey(lat,lon,country),{at:Date.now(),value},[BEST_MATCH_INFO_CACHE_PREFIX],18,BEST_MATCH_INFO_STALE_MS)}catch{}}
async function modelRunMetas(candidates:ModelMetaCandidate[],signal?:AbortSignal){
 const unique=[...new Map(candidates.map(x=>[`${x.kind}:${x.id}`,x])).values()];
 const settled=await Promise.allSettled(unique.map(x=>modelRunMeta(x,signal)));
 return settled.filter((x):x is PromiseFulfilledResult<ModelRunMeta|null>=>x.status==='fulfilled').map(x=>x.value).filter(Boolean) as ModelRunMeta[];
}
function modelRunCandidate(model:EnsembleModel):ModelMetaCandidate{return{id:model.metaId,label:model.label,kind:'ensemble',rapidUpdate:model.updateHours<=1,resolutionKm:model.resolutionKm,forecastHorizonHours:model.maxDays*24}}
async function ensembleModelRunMetas(attempts:EnsembleLoadAttempt<unknown>[],allModels:EnsembleModel[],signal?:AbortSignal){
 const successful=attempts.filter(attempt=>attempt.status==='active'||attempt.status==='fallback'),rows:ModelRunMeta[]=[];
 for(const attempt of successful){const candidate=modelRunCandidate(attempt.model),meta=await modelRunMeta(candidate,signal);rows.push({...candidate,...(meta??{}),id:candidate.id,label:candidate.label,kind:'ensemble',usageStatus:attempt.status,metadataUnavailable:!meta,statusNote:meta?undefined:'Modell aktiv · Laufmetadaten derzeit nicht abrufbar'})}
 const failed=attempts.filter(attempt=>attempt.status==='unavailable'||attempt.status==='adapter-not-configured');for(const attempt of failed.slice(0,6)){const candidate=modelRunCandidate(attempt.model);rows.push({...candidate,usageStatus:attempt.status,statusNote:attempt.status==='adapter-not-configured'?'Optionaler Punktadapter nicht konfiguriert':'Abruf in diesem Lauf nicht erfolgreich'})}
 const requestedReserve=attempts.filter(attempt=>attempt.status==='reserve').slice(0,2);for(const attempt of requestedReserve){const candidate=modelRunCandidate(attempt.model);rows.push({...candidate,usageStatus:'reserve',statusNote:'Reserve · erfolgreich geladen, wegen bereits erfüllter Modellquote nicht gewichtet'})}
 const attemptedIds=new Set(attempts.map(attempt=>attempt.model.id)),reserve=allModels.filter(model=>!attemptedIds.has(model.id)).slice(0,4);for(const model of reserve){const candidate=modelRunCandidate(model);rows.push({...candidate,usageStatus:'reserve',statusNote:'Reserve · wegen ausreichender erfolgreicher Modellbasis nicht abgefragt'})}
 return rows;
}
export async function bestMatchModelInfo(lat:number,lon:number,country?:string,signal?:AbortSignal):Promise<BestMatchModelInfo>{
 const cached=readBestMatchInfoCache(lat,lon,country);if(cached)return cached;
 const code=countryCodeFromLocation(country),applicable=forecastCandidates.filter(x=>candidateApplies(x,lat,lon,code)),ordered=[...applicable.filter(x=>x.rapidUpdate&&x.countries?.includes(code)),...applicable.filter(x=>x.rapidUpdate),...applicable.filter(x=>!x.rapidUpdate&&x.countries?.includes(code)),...applicable.filter(x=>!x.rapidUpdate&&!x.id.includes('seamless')),...applicable.filter(x=>x.id.includes('seamless'))],locals=ordered.filter((candidate,index,rows)=>rows.findIndex(row=>row.id===candidate.id)===index).slice(0,8),selected=[...locals,...globalForecastCandidates],candidateModels=locals.length?locals.map(x=>`${x.label}${x.rapidUpdate?' · Rapid Update':''}`).join(' · '):'höchstaufgelöstes am Standort verfügbares Regionalmodell';
 try{const runs=await modelRunMetas(selected,signal),rapidAvailable=runs.filter(run=>run.rapidUpdate).map(run=>run.label),value={summary:`Best Match stammt aus der Open-Meteo Forecast API. MID prüft zusätzlich verfügbare Rapid-Update-, Regional- und unabhängige Globalmodelle${rapidAvailable.length?` (${rapidAvailable.join(', ')})`:''}. DWD ICON-D2-RUC wird direkt auf Laufverfügbarkeit geprüft. Numerische RUC-Punktwerte können zusätzlich über den Worker-Punktadapter in die Forecast-Fusion eingehen; ohne dekodierten Punktpfad bleibt der DWD-Rohdatensatz wegen seines nativen Dreiecksgitters eine Verfügbarkeitsquelle. Die konkrete Best-Match-Quelle kann je Variable und Zeitraum wechseln.`,likelyChain:'',candidateModels,runs} satisfies BestMatchModelInfo;writeBestMatchInfoCache(lat,lon,country,value);return value}catch(error){const stale=readBestMatchInfoCache(lat,lon,country,BEST_MATCH_INFO_STALE_MS);if(stale)return stale;throw error}
}
const ICAO_LOCATION_CACHE_KEY='mid:icao-location-cache:v1';
const ICAO_LOCATION_CACHE_TTL=30*86400000;
const icaoLocationRequests=new Map<string,Promise<Location|null>>();
function normalizedSearchToken(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function readIcaoLocationCache(code:string){try{const cache=JSON.parse(localStorage.getItem(ICAO_LOCATION_CACHE_KEY)||'{}') as Record<string,{at:number;location:Location}>;const entry=cache[code];if(!entry||!Number.isFinite(entry.at)||Date.now()-entry.at>ICAO_LOCATION_CACHE_TTL)return null;return entry.location}catch{return null}}
function writeIcaoLocationCache(code:string,location:Location){try{const raw=JSON.parse(localStorage.getItem(ICAO_LOCATION_CACHE_KEY)||'{}') as Record<string,{at:number;location:Location}>,entries=Object.entries(raw).filter(([,entry])=>Number.isFinite(entry?.at)&&Date.now()-entry.at<=ICAO_LOCATION_CACHE_TTL).sort((a,b)=>b[1].at-a[1].at).slice(0,39);localStorage.setItem(ICAO_LOCATION_CACHE_KEY,JSON.stringify(Object.fromEntries([[code,{at:Date.now(),location}],...entries.filter(([key])=>key!==code)])))}catch{}}
async function icaoLocation(code:string,signal?:AbortSignal){
 const cached=readIcaoLocationCache(code);if(cached)return cached;
 let request=icaoLocationRequests.get(code);
 if(!request){request=fetchWorkerJson<Location&{error?:string}>('icao-location',{icao:code},{purpose:'general',timeoutMs:9000,cache:'default'}).then(location=>{const normalized={...location,icao:String(location.icao||code).toUpperCase(),source:location.source||'NOAA AviationWeather / ICAO',poiType:location.poiType||'airport',poiCategory:location.poiCategory||'Flughafen'};writeIcaoLocationCache(code,normalized);return normalized}).catch(()=>null).finally(()=>icaoLocationRequests.delete(code));icaoLocationRequests.set(code,request)}
 const location=await request;if(signal?.aborted)throw signal.reason??new DOMException('Abgebrochen','AbortError');return location;
}
export async function searchLocations(q:string,signal?:AbortSignal){
 const query=q.trim(),openParams=new URLSearchParams({name:query,count:'8',language:'de',format:'json'}),photonParams=new URLSearchParams({q:query,lang:'de',limit:'8'});
 const tasks:Promise<Location[]>[]=[j<{results?:any[]}>(`https://geocoding-api.open-meteo.com/v1/search?${openParams}`,signal).then(x=>(x.results??[]).map((location:any)=>({...location,featureCode:String(location.feature_code||'')||undefined,population:Number.isFinite(Number(location.population))?Number(location.population):undefined,urbanClass:urbanClassFromPlace(location.feature_code,location.population),source:'Open-Meteo'} as Location))).catch(()=>[])];
 if(query.length>=3)tasks.push(j<{features?:PhotonFeature[]}>(`https://photon.komoot.io/api/?${photonParams}`,signal).then(x=>(x.features??[]).map(photonLocation).filter((location):location is Location=>!!location)).catch(()=>[]));
 const groups=await Promise.all(tasks),combined=groups.flat(),code=normalizedSearchToken(query),looksLikeIcao=/^[A-Z]{4}$/.test(code)&&query.replace(/\s/g,'').length===4,exactPlace=combined.some(location=>normalizedSearchToken(location.name)===code||location.postcodes?.some(postcode=>normalizedSearchToken(postcode)===code));
 if(looksLikeIcao&&!exactPlace){const airport=await icaoLocation(code,signal);if(airport)combined.unshift(airport)}
 const result:Location[]=[];
 for(const location of combined){if(result.some(existing=>similarLocation(existing,location)))continue;result.push(location);if(result.length>=12)break}
 return result;
}
const REVERSE_LOCATION_CACHE_PREFIX='mid:reverse-location:v1:';
const REVERSE_LOCATION_CACHE_FRESH_MS=14*86400000;
const REVERSE_LOCATION_CACHE_NEARBY_M=650;
function reverseLocationCacheKey(lat:number,lon:number){return`${REVERSE_LOCATION_CACHE_PREFIX}${Number(lat).toFixed(3)}:${Number(lon).toFixed(3)}`}
function reverseLocationCacheCoordinates(key:string){if(!key.startsWith(REVERSE_LOCATION_CACHE_PREFIX))return null;const match=key.slice(REVERSE_LOCATION_CACHE_PREFIX.length).match(/^(-?\d+(?:\.\d+)?):(-?\d+(?:\.\d+)?)$/);return match?{lat:Number(match[1]),lon:Number(match[2])}:null}
function readReverseLocationCache(lat:number,lon:number,elevation?:number){try{let best:{at:number;value:Location;distance:number}|null=null;for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index)||'',coordinates=reverseLocationCacheCoordinates(key);if(!coordinates)continue;const distance=haversine(lat,lon,coordinates.lat,coordinates.lon);if(distance>REVERSE_LOCATION_CACHE_NEARBY_M)continue;try{const parsed=JSON.parse(localStorage.getItem(key)||'null') as{at?:number;value?:Location}|null,at=Number(parsed?.at);if(!parsed?.value||!Number.isFinite(at)||Date.now()-at>REVERSE_LOCATION_CACHE_FRESH_MS)continue;if(!best||distance<best.distance||distance===best.distance&&at>best.at)best={at,value:parsed.value,distance}}catch{}}if(!best)return null;return{...best.value,id:Date.now(),latitude:lat,longitude:lon,elevation:Number.isFinite(Number(elevation))?Number(elevation):best.value.elevation,autolocated:true} satisfies Location}catch{return null}}
function writeReverseLocationCache(lat:number,lon:number,value:Location){try{writeBoundedStorage(localStorage,reverseLocationCacheKey(lat,lon),{at:Date.now(),value},[REVERSE_LOCATION_CACHE_PREFIX],40,REVERSE_LOCATION_CACHE_FRESH_MS)}catch{}}
export async function reverseLocation(lat:number,lon:number,elevation?:number,signal?:AbortSignal):Promise<Location>{
 const cached=readReverseLocationCache(lat,lon,elevation);if(cached)return cached;
 const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),localityLanguage:'de'});
 try{
  const d=await j<any>(`https://api.bigdatacloud.net/data/reverse-geocode-client?${p}`,signal),city=String(d.city||'').trim(),locality=String(d.locality||'').trim(),country=String(d.countryName||'').trim(),admin1=String(d.principalSubdivision||'').trim(),name=locality||city||admin1||country||`${formatDecimal(lat,2,2)}°, ${formatDecimal(lon,2,2)}°`,admin=(d.localityInfo?.administrative??[]) as any[],excluded=new Set([name,city,locality,country,admin1].filter(Boolean).map(value=>String(value).toLocaleLowerCase('de-DE'))),admin2=admin.map((item:any)=>String(item?.name||'').trim()).find((value:string)=>value&&!excluded.has(value.toLocaleLowerCase('de-DE'))),value={id:Date.now(),name,latitude:lat,longitude:lon,elevation,country:country||undefined,country_code:String(d.countryCode||'').toUpperCase()||undefined,city:city||undefined,locality:locality||undefined,admin1:admin1||undefined,admin2,postcodes:d.postcode?[String(d.postcode)]:undefined,autolocated:true} satisfies Location;
  writeReverseLocationCache(lat,lon,value);return value;
 }catch{return{id:Date.now(),name:`${formatDecimal(lat,2,2)}°, ${formatDecimal(lon,2,2)}°`,latitude:lat,longitude:lon,elevation,autolocated:true}}
}
const FORECAST_CORE_CACHE_PREFIX='mid:forecast-core:v3:';
const FORECAST_CORE_LEGACY_CACHE_PREFIXES=['mid:forecast-core:v2:','mid:forecast-core:v1:'];
const FORECAST_CORE_FRESH_MS=8*60*1000;
const FORECAST_CORE_STALE_MS=18*3600000;
const FORECAST_CORE_NEARBY_FALLBACK_M=2500;
type ForecastRequestOptions={forceFresh?:boolean;priority?:OpenMeteoPriority;timeZone?:string;elevation?:number};
type ForecastCoreCache={time:number;value:Weather};
function primaryCoreForecast(value:unknown):value is Weather{const row=value as Partial<Weather>|null,meta=row?._mid_core_proxy;return Boolean(row&&typeof row==='object'&&row.current&&row.hourly&&row.daily&&Array.isArray(row.hourly.time)&&Array.isArray(row.daily.time)&&meta?.fallback!==true&&!/MET Norway/i.test(String(meta?.provider||'')))}
function forecastCoreCacheKey(lat:number,lon:number){return`${FORECAST_CORE_CACHE_PREFIX}${Number(lat).toFixed(3)}:${Number(lon).toFixed(3)}`}
function parseForecastCoreCache(raw:string|null){try{if(!raw)return null;const parsed=JSON.parse(raw) as ForecastCoreCache,age=Date.now()-Number(parsed?.time);if(!primaryCoreForecast(parsed?.value)||!Number.isFinite(age)||age<0||age>FORECAST_CORE_STALE_MS)return null;return{...parsed,age}}catch{return null}}
function forecastCoreCacheCoordinates(key:string){for(const prefix of[FORECAST_CORE_CACHE_PREFIX,...FORECAST_CORE_LEGACY_CACHE_PREFIXES])if(key.startsWith(prefix)){const match=key.slice(prefix.length).match(/^(-?\d+(?:\.\d+)?):(-?\d+(?:\.\d+)?)$/);if(match)return{lat:Number(match[1]),lon:Number(match[2])}}return null}
function readForecastCoreCache(lat:number,lon:number){try{const exact=parseForecastCoreCache(localStorage.getItem(forecastCoreCacheKey(lat,lon)));if(exact)return exact;for(const prefix of FORECAST_CORE_LEGACY_CACHE_PREFIXES){const digits=prefix.endsWith('v1:')?4:3,legacy=parseForecastCoreCache(localStorage.getItem(`${prefix}${Number(lat).toFixed(digits)}:${Number(lon).toFixed(digits)}`));if(legacy){writeForecastCoreCache(lat,lon,legacy.value,legacy.time);return legacy}}let best:(ForecastCoreCache&{age:number;distance:number})|null=null;for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index)||'',coordinates=forecastCoreCacheCoordinates(key);if(!coordinates)continue;const entry=parseForecastCoreCache(localStorage.getItem(key));if(!entry)continue;const distance=haversine(lat,lon,coordinates.lat,coordinates.lon);if(distance>FORECAST_CORE_NEARBY_FALLBACK_M)continue;if(!best||entry.age<best.age||entry.age===best.age&&distance<best.distance)best={...entry,distance}}if(best){writeForecastCoreCache(lat,lon,best.value,best.time);return{time:best.time,value:best.value,age:best.age}}return null}catch{return null}}
function writeForecastCoreCache(lat:number,lon:number,value:Weather,time=Date.now()){if(!primaryCoreForecast(value))return;try{writeBoundedStorage(localStorage,forecastCoreCacheKey(lat,lon),{time,value},[FORECAST_CORE_CACHE_PREFIX,...FORECAST_CORE_LEGACY_CACHE_PREFIXES],10,FORECAST_CORE_STALE_MS)}catch{}}
function forecastQuery(lat:number,lon:number){return new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',forecast_days:'14',forecast_minutely_15:'24',past_minutely_15:'4',models:'best_match',wind_speed_unit:'kn',current:['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','is_day','precipitation','rain','showers','snowfall','weather_code','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','visibility','cape','sunshine_duration'].join(','),minutely_15:['precipitation_probability','precipitation','rain','showers','snowfall','weather_code','sunshine_duration'].join(','),hourly:['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','precipitation_probability','precipitation','rain','showers','snowfall','weather_code','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','uv_index','visibility','cape','lifted_index','convective_inhibition','total_column_integrated_water_vapour','is_day','sunshine_duration'].join(','),daily:['weather_code','temperature_2m_max','temperature_2m_min','sunrise','sunset','precipitation_sum','rain_sum','showers_sum','snowfall_sum','precipitation_hours','precipitation_probability_max','wind_speed_10m_max','wind_gusts_10m_max','wind_direction_10m_dominant','uv_index_max','sunshine_duration'].join(',')})}
async function directOpenMeteoCoreForecast(lat:number,lon:number,signal:AbortSignal|undefined,priority:OpenMeteoPriority){const url=`https://api.open-meteo.com/v1/forecast?${forecastQuery(lat,lon)}`,payload=await guardedOpenMeteoJson<Weather>(url,{signal,cache:'no-store'},{priority,maxRetries:priority==='foreground'?1:priority==='normal'?1:0});if(!primaryCoreForecast(payload))throw new Error('Open-Meteo lieferte keine vollständige Best-Match-Kernvorhersage.');return payload}
async function workerForecastCore(lat:number,lon:number,signal:AbortSignal|undefined,forceFresh:boolean,timeZone?:string,elevation?:number){if(!workerBaseCandidates('general').length)return null;try{const value=await fetchWorkerJson<Weather&{error?:string}>('forecast-core',{lat:Number(lat).toFixed(5),lon:Number(lon).toFixed(5),refresh:forceFresh?1:0,timezone:String(timeZone||'').trim()||undefined,elevation:Number.isFinite(Number(elevation))?Math.round(Number(elevation)):undefined},{purpose:'general',signal,timeoutMs:16000,cache:forceFresh?'no-store':'default',maxAgeMs:forceFresh?0:2*60*1000,staleIfErrorMs:FORECAST_CORE_STALE_MS,cacheKey:`forecast-core:v3:${Number(lat).toFixed(3)}:${Number(lon).toFixed(3)}`});if(Number(value?._mid_core_proxy?.upstreamStatus)===429)registerOpenMeteoCooldown(Date.now()+30_000);return primaryCoreForecast(value)?value:null}catch(error){if(signal?.aborted)throw error;return null}}
export async function forecast(lat:number,lon:number,signal?:AbortSignal,options:ForecastRequestOptions={}){const cached=readForecastCoreCache(lat,lon),priority=options.priority??'normal',cooldownAt=openMeteoCooldownRetryAt(),cooldownActive=cooldownAt>Date.now();if(!options.forceFresh&&cached&&cached.age<=FORECAST_CORE_FRESH_MS)return cached.value;const useDirectFirst=priority==='foreground'&&!cooldownActive;let directError:unknown=null;if(useDirectFirst){try{const value=await directOpenMeteoCoreForecast(lat,lon,signal,priority);writeForecastCoreCache(lat,lon,value);return value}catch(error){if(signal?.aborted)throw error;directError=error}}const proxied=await workerForecastCore(lat,lon,signal,options.forceFresh===true,options.timeZone,options.elevation);if(proxied){writeForecastCoreCache(lat,lon,proxied);return proxied}if(!useDirectFirst&&!cooldownActive){try{const value=await directOpenMeteoCoreForecast(lat,lon,signal,priority);writeForecastCoreCache(lat,lon,value);return value}catch(error){if(signal?.aborted)throw error;directError=error}}if(cached)return cached.value;if(cooldownActive)throw new OpenMeteoRateLimitError(cooldownAt);if(directError)throw directError;throw new Error('Open-Meteo Best Match ist vorübergehend nicht erreichbar.')}

const AIR_QUALITY_CACHE_PREFIX='mid:air-quality:v1:';
const AIR_QUALITY_FRESH_MS=15*60000;
const AIR_QUALITY_STALE_MS=2*3600000;
type AirQualityPayload={current?:Record<string,number|string>};
function airQualityCacheKey(lat:number,lon:number){return`${AIR_QUALITY_CACHE_PREFIX}${Number(lat).toFixed(2)}:${Number(lon).toFixed(2)}`}
function readAirQualityCache(lat:number,lon:number,maxAge=AIR_QUALITY_FRESH_MS){try{const parsed=JSON.parse(localStorage.getItem(airQualityCacheKey(lat,lon))||'null') as{at?:number;value?:AirQualityPayload}|null,at=Number(parsed?.at);return parsed?.value&&Number.isFinite(at)&&Date.now()-at<=maxAge?parsed.value:null}catch{return null}}
function writeAirQualityCache(lat:number,lon:number,value:AirQualityPayload){try{writeBoundedStorage(localStorage,airQualityCacheKey(lat,lon),{at:Date.now(),value},[AIR_QUALITY_CACHE_PREFIX],24,AIR_QUALITY_STALE_MS)}catch{}}
export async function airQuality(lat:number,lon:number,signal?:AbortSignal,forceRefresh=false){const cached=forceRefresh?null:readAirQualityCache(lat,lon);if(cached)return cached;const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',current:['european_aqi','european_aqi_pm2_5','european_aqi_pm10','european_aqi_nitrogen_dioxide','european_aqi_ozone','european_aqi_sulphur_dioxide','pm10','pm2_5','nitrogen_dioxide','sulphur_dioxide','ozone','uv_index'].join(',')});try{const value=await j<AirQualityPayload>(`https://air-quality-api.open-meteo.com/v1/air-quality?${p}`,signal);writeAirQualityCache(lat,lon,value);return value}catch(error){if(signal?.aborted)throw error;const stale=readAirQualityCache(lat,lon,AIR_QUALITY_STALE_MS);if(stale)return stale;throw error}}
const EEA_STATION_DIRECT_ENDPOINTS=['https://air.discomap.eea.europa.eu/arcgis/rest/services/AirQuality/AirQualityDownloadServiceEUMonitoringStations/MapServer/0/query','https://eeha.discomap.eea.europa.eu/arcgis/rest/services/AirQuality/AirQualityDownloadServiceEUMonitoringStations/MapServer/0/query'];
const EEA_STATION_CACHE_KEY='mid:eea-station-cache:v2';
function eeaStationQuery(endpoint:string,lat:number,lon:number,strategy:'distance'|'envelope'){
 const url=new URL(endpoint),latRadius=75/111,lonRadius=75/(111*Math.max(.25,Math.cos(lat*Math.PI/180)));
 url.searchParams.set('f','json');url.searchParams.set('where','1=1');url.searchParams.set('inSR','4326');url.searchParams.set('outSR','4326');url.searchParams.set('spatialRel','esriSpatialRelIntersects');
 if(strategy==='envelope'){url.searchParams.set('geometry',`${lon-lonRadius},${lat-latRadius},${lon+lonRadius},${lat+latRadius}`);url.searchParams.set('geometryType','esriGeometryEnvelope')}
 else{url.searchParams.set('geometry',`${lon},${lat}`);url.searchParams.set('geometryType','esriGeometryPoint');url.searchParams.set('distance','75000');url.searchParams.set('units','esriSRUnit_Meter')}
 url.searchParams.set('outFields','AirQualityStation,AQStationName,Country,CountryCode,AirQualityStationEoICode,stationClass');url.searchParams.set('returnGeometry','true');url.searchParams.set('returnZ','false');url.searchParams.set('returnM','false');url.searchParams.set('resultRecordCount','250');return url;
}
function eeaStationClass(value:unknown){const key=String(value??'').trim();return key==='0'?'all-mandatory-pollutants':key==='1'?'main-pollutants':key==='2'?'some-main-pollutants':key==='3'?'other-pollutants':key}
function parseEeaStationResponse(data:any,lat:number,lon:number,sourceHost:string):AirQualityStationMeta|null{
 const rows=(Array.isArray(data?.features)?data.features:[]).map((feature:any)=>{const attributes=feature?.attributes||{},x=numeric(feature?.geometry?.x),y=numeric(feature?.geometry?.y);if(x===undefined||y===undefined)return null;const distanceKm=haversine(lat,lon,y,x)/1000;if(!Number.isFinite(distanceKm)||distanceKm>90)return null;return{available:true,name:String(attributes.AQStationName||attributes.AirQualityStation||attributes.AirQualityStationEoICode||'EEA-Messstation'),stationCode:String(attributes.AirQualityStation||''),eoiCode:String(attributes.AirQualityStationEoICode||''),country:String(attributes.Country||''),countryCode:String(attributes.CountryCode||''),stationClass:eeaStationClass(attributes.stationClass),latitude:y,longitude:x,distanceKm:Math.round(distanceKm*10)/10,provider:'European Environment Agency (EEA)',sourceHost} satisfies AirQualityStationMeta}).filter((row:AirQualityStationMeta|null):row is AirQualityStationMeta=>Boolean(row)).sort((a:AirQualityStationMeta,b:AirQualityStationMeta)=>(a.distanceKm??Infinity)-(b.distanceKm??Infinity));
 return rows[0]??null;
}
function storeEeaStation(lat:number,lon:number,station:AirQualityStationMeta){try{localStorage.setItem(EEA_STATION_CACHE_KEY,JSON.stringify({lat,lon,station,at:Date.now()}))}catch{}}
function cachedEeaStation(lat:number,lon:number,maxAgeMs=30*86400000,maxQueryDistanceM=100000){try{const parsed=JSON.parse(localStorage.getItem(EEA_STATION_CACHE_KEY)||'null') as {lat?:number;lon?:number;station?:AirQualityStationMeta;at?:number}|null;if(!parsed?.station?.available||!Number.isFinite(parsed.lat)||!Number.isFinite(parsed.lon)||!Number.isFinite(parsed.at)||Date.now()-Number(parsed.at)>maxAgeMs||haversine(lat,lon,Number(parsed.lat),Number(parsed.lon))>maxQueryDistanceM)return null;return{...parsed.station,cached:true,cachedAt:new Date(Number(parsed.at)).toISOString()} satisfies AirQualityStationMeta}catch{return null}}
async function directEeaAirQualityStation(lat:number,lon:number,signal?:AbortSignal){
 const failures:string[]=[];let successful=false;
 for(const endpoint of EEA_STATION_DIRECT_ENDPOINTS)for(const strategy of['distance','envelope'] as const){if(signal?.aborted)throw signal.reason;const url=eeaStationQuery(endpoint,lat,lon,strategy),host=new URL(endpoint).hostname;try{const response=await fetch(url.toString(),{signal,headers:{Accept:'application/json,application/geo+json;q=0.9,*/*;q=0.2'},cache:'force-cache'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(data?.error)throw new Error(data.error?.message||'ArcGIS-Dienst meldet einen Fehler.');successful=true;const station=parseEeaStationResponse(data,lat,lon,host);if(station)return station}catch(error){failures.push(`${host}/${strategy}: ${error instanceof Error?error.message:String(error)}`)}}
 if(successful)return{available:false,provider:'European Environment Agency (EEA)',reason:'Im Umkreis von 75 km wurde keine aktuelle EEA-Messstation gefunden.'} satisfies AirQualityStationMeta;
 throw new Error(`Direkter EEA-Abruf fehlgeschlagen: ${failures.slice(-4).join(' | ')}`);
}
export async function airQualityStation(lat:number,lon:number,signal?:AbortSignal){
 const fresh=cachedEeaStation(lat,lon,7*86400000,5000);if(fresh)return fresh;
 const failures:string[]=[];
 try{const station=await fetchWorkerJson<AirQualityStationMeta>('air-quality-station',{lat,lon},{purpose:'general',signal,timeoutMs:14000,cache:'default',maxAgeMs:24*3600000,staleIfErrorMs:7*86400000,cacheKey:`air-quality-station:${lat.toFixed(2)}:${lon.toFixed(2)}`});if(station.available)storeEeaStation(lat,lon,station);return station}catch(error){failures.push(error instanceof Error?error.message:String(error))}
 try{const station=await directEeaAirQualityStation(lat,lon,signal);if(station.available)storeEeaStation(lat,lon,station);return station}catch(error){failures.push(error instanceof Error?error.message:String(error))}
 const cached=cachedEeaStation(lat,lon);if(cached)return cached;
 throw new Error(`EEA-Messstation nicht verfügbar. ${failures.join(' · ')}`);
}

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
 const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:timezone||'auto',forecast_days:'8',forecast_minutely_15:String(8*24*4),cell_selection:'sea',wind_speed_unit:'kn',current:variables.join(','),hourly:variables.join(','),minutely_15:'sea_level_height_msl',daily:daily.join(',')});
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
  const stationName=String(s.station_name||'DWD/WMO-Station'),siteClass:UrbanClass=/stadt|urban/i.test(`${stationName} ${s.observation_type||''}`)?'urban':/flughafen|airport|flugplatz/i.test(stationName)?'rural':'unknown',windSpeedKmh=num(w.wind_speed_10??w.wind_speed),windGustKmh=num(w.wind_gust_speed_10??w.wind_gust_speed);return{name:stationName,provider:'DWD Open Data / Bright Sky',stationId:s.wmo_station_id||s.dwd_station_id||s.id,latitude:num(s.lat??s.latitude),longitude:num(s.lon??s.longitude),distance:num(s.distance),height:num(s.height),timestamp:w.timestamp,temperature:num(w.temperature),humidity:num(w.relative_humidity),dewPoint:num(w.dew_point),pressure:num(w.pressure_msl),pressureReference:'QFF',windSpeed:windSpeedKmh===undefined?undefined:windSpeedKmh/1.852,windDirection:num(w.wind_direction_10??w.wind_direction),windGust:windGustKmh===undefined?undefined:windGustKmh/1.852,windUnit:'kt',visibility:num(w.visibility),cloudCover:num(w.cloud_cover),precipitation:num(w.precipitation_10??w.precipitation),precipitationMinutes:w.precipitation_10!==undefined?10:60,trustFactor:96,networkClass:'official',siteClass};
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
   return{name:m.name,provider:'GeoSphere Austria / TAWES',stationId:m.id,latitude:m.lat,longitude:m.lon,distance:m.distance,height:Number.isFinite(m.altitude)?m.altitude:undefined,timestamp:geoSphereTimestamp(d,f),temperature,humidity:geoSphereParam(f,'RF'),dewPoint:geoSphereParam(f,'TP'),pressure,pressureReference:pressure===undefined?undefined:'QFF',windSpeed:ff===undefined?undefined:ff*3.6/1.852,windDirection:geoSphereParam(f,'DD'),windGust:ffx===undefined?undefined:ffx*3.6/1.852,windUnit:'kt' as const,precipitation:geoSphereParam(f,'RR'),precipitationMinutes:10,trustFactor:96,networkClass:'official',siteClass:'unknown'} as Station;
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
function stationAgeMinutes(timestamp?:string,now=Date.now()){if(!timestamp)return 120;const normalized=normalizeStationTimestamp(timestamp),t=normalized?new Date(normalized).getTime():NaN;return Number.isFinite(t)?Math.max(0,(now-t)/60000):120}
function median(values:number[]){const a=values.filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return NaN;const i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2}
function robustStationValues(rows:{value:number;weight:number}[],absoluteLimit:number){if(rows.length<3)return rows;const med=median(rows.map(x=>x.value)),mad=median(rows.map(x=>Math.abs(x.value-med))),limit=Math.max(absoluteLimit,(Number.isFinite(mad)?mad:0)*4.45);const filtered=rows.filter(x=>Math.abs(x.value-med)<=limit);return filtered.length>=Math.max(2,Math.ceil(rows.length*.55))?filtered:rows}
function stationWeightedMean(rows:{value:number;weight:number}[],absoluteLimit:number){const a=robustStationValues(rows.filter(x=>Number.isFinite(x.value)&&x.weight>0),absoluteLimit),sum=a.reduce((s,x)=>s+x.weight,0);return sum?a.reduce((s,x)=>s+x.value*x.weight,0)/sum:undefined}
function stationCircularMean(rows:{value:number;weight:number}[]){const a=rows.filter(x=>Number.isFinite(x.value)&&x.weight>0);if(!a.length)return undefined;const x=a.reduce((s,r)=>s+Math.cos(r.value*Math.PI/180)*r.weight,0),y=a.reduce((s,r)=>s+Math.sin(r.value*Math.PI/180)*r.weight,0);return(Math.atan2(y,x)*180/Math.PI+360)%360}
function stationFieldTemporalResolution(station:Station,field:StationAnalysisField){const direct=station.fieldTemporalResolutionMinutes?.[field],generic=station.temporalResolutionMinutes;return Number.isFinite(direct)?Number(direct):Number.isFinite(generic)?Number(generic):undefined}
type StationFieldObservationContext={ageMinutes:number;distanceKm:number;heightDifferenceM:number;temporalResolutionMinutes?:number;relevance:number;provider?:string;networkClass?:Station['networkClass']};
function stationFieldObservationContext(station:Station,field:StationAnalysisField,targetElevation?:number,now=Date.now()):StationFieldObservationContext{const heightDifferenceM=Number.isFinite(station.height)&&Number.isFinite(targetElevation)?Math.abs(Number(station.height)-Number(targetElevation)):0,sources=station.fieldSources?.[field]??[],fallbackAge=stationAgeMinutes(station.fieldObservedAt?.[field]??station.timestamp,now),fallbackDistance=Math.max(0,Number(station.distance??100000)/1000),fallbackResolution=stationFieldTemporalResolution(station,field);if(!sources.length){return{ageMinutes:fallbackAge,distanceKm:fallbackDistance,heightDifferenceM,temporalResolutionMinutes:fallbackResolution,relevance:fieldObservationRelevance(field,fallbackAge,fallbackDistance,heightDifferenceM,fallbackResolution),provider:station.provider,networkClass:station.networkClass}}let best:StationFieldObservationContext|undefined;for(const source of sources){const stamp=source.observedAt?Date.parse(source.observedAt):NaN,ageMinutes=Number.isFinite(stamp)?Math.max(0,(now-stamp)/60000):fallbackAge,distanceKm=Number.isFinite(source.distanceKm)?Math.max(0,Number(source.distanceKm)):fallbackDistance,temporalResolutionMinutes=Number.isFinite(source.temporalResolutionMinutes)?Number(source.temporalResolutionMinutes):fallbackResolution,relevance=fieldObservationRelevance(field,ageMinutes,distanceKm,heightDifferenceM,temporalResolutionMinutes),candidate={ageMinutes,distanceKm,heightDifferenceM,temporalResolutionMinutes,relevance,provider:source.provider,networkClass:source.networkClass};if(!best||candidate.relevance>best.relevance)best=candidate}return best??{ageMinutes:fallbackAge,distanceKm:fallbackDistance,heightDifferenceM,temporalResolutionMinutes:fallbackResolution,relevance:0,provider:station.provider,networkClass:station.networkClass}}
export function stationFieldObservationUsable(station:Station|null|undefined,field:StationAnalysisField,now=Date.now(),targetElevation?:number){if(!station||!Number.isFinite(Number(station[field])))return false;const context=stationFieldObservationContext(station,field,targetElevation,now);return context.relevance>=fieldRelevanceLimits(field).minimumAnchorRelevance}
function stationSourceReference(station:Station,weight?:number,field?:StationAnalysisField):StationFieldSource{const provenance=field?station.fieldSources?.[field]?.[0]:undefined;return{provider:provenance?.provider??station.provider??'Messstation',stationName:provenance?.stationName??station.name,stationId:provenance?.stationId??station.stationId,distanceKm:Number.isFinite(provenance?.distanceKm)?Number(provenance!.distanceKm):Number.isFinite(station.distance)?Number((Number(station.distance)/1000).toFixed(1)):undefined,observedAt:provenance?.observedAt??(field?station.fieldObservedAt?.[field]:undefined)??station.timestamp,networkClass:provenance?.networkClass??station.networkClass,sourceType:provenance?.sourceType??station.sourceType,weight:Number.isFinite(weight)?Number(Number(weight).toFixed(3)):undefined,qc:provenance?.qc??station.qcLabel,temporalResolutionMinutes:provenance?.temporalResolutionMinutes??(field?stationFieldTemporalResolution(station,field):station.temporalResolutionMinutes)}}
function stationFieldSourcesForCandidates(candidates:{s:Station;w:number}[],targetElevation?:number,targetUrban:UrbanClass='unknown'):StationFieldSources{const fields:StationAnalysisField[]=['temperature','humidity','dewPoint','pressure','windSpeed','windDirection','windGust','visibility','cloudCover','ceilingHft','cloudBaseHft','precipitation'],out:StationFieldSources={};for(const field of fields){const rows=candidates.map(({s})=>({s,w:analysisWeight(s,targetElevation,targetUrban,field)})).filter(({s,w})=>Number.isFinite(Number(s[field]))&&w>0).sort((a,b)=>b.w-a.w).slice(0,3);if(rows.length)out[field]=rows.map(({s,w})=>stationSourceReference(s,w,field))}return out}
function stationFieldSourcesFromAnalysis(analysis:ResidualResult,field:StationAnalysisField):StationFieldSource[]{return[...analysis.accepted].map(station=>stationSourceReference(station,analysis.weights.get(station),field)).sort((a,b)=>(b.weight??0)-(a.weight??0)).slice(0,4)}
function stationRowWeight(s:Station,targetElevation?:number){const distanceKm=Math.max(0,(s.distance??80000)/1000),count=Math.sqrt(Math.max(1,s.stationCount??1)),relevance=stationFieldObservationContext(s,'temperature',targetElevation).relevance;return stationProviderWeight(s.provider)*count*relevance/(1+distanceKm/10)**1.5}
function robustBlendStations(input:Station[],targetElevation?:number):Station|null{
 const now=Date.now(),fresh=input.filter(s=>stationFieldObservationUsable(s,'temperature',now,targetElevation));if(!fresh.length)return null;
 const terrain=Number(targetElevation??0)>=700;
 const suitable=fresh.filter(s=>{const pws=isPrivateNetwork(s.provider),maxDistance=pws?22_000:45_000,maxHeight=terrain?(pws?420:700):(pws?280:520);return(s.distance??999999)<=maxDistance&&(!Number.isFinite(s.height)||!Number.isFinite(targetElevation)||Math.abs(Number(s.height)-Number(targetElevation))<=maxHeight)});
 const candidates=(suitable.length?suitable:fresh).sort((a,b)=>stationFitScore(a.distance,a.height,targetElevation,isPrivateNetwork(a.provider)?-9000:0,a.timestamp)-stationFitScore(b.distance,b.height,targetElevation,isPrivateNetwork(b.provider)?-9000:0,b.timestamp)).slice(0,12);
 if(candidates.length===1){const only=candidates[0],qff=only.pressureReference==='QFF'||only.pressureReference==='MSL';return qff?only:{...only,pressure:undefined,pressureReference:undefined}};
 const weighted=candidates.map(s=>({s,w:stationRowWeight(s,targetElevation)})).filter(x=>x.w>0),field=(key:StationAnalysisField,limit:number)=>stationWeightedMean(candidates.map(s=>({value:Number(s[key]),weight:analysisWeight(s,targetElevation,'unknown',key)})),limit),temperature=field('temperature',3.2);
 if(temperature===undefined)return candidates[0];
 const providers=[...new Set(candidates.flatMap(s=>s.sourceProviders?.length?s.sourceProviders:[s.provider||'Messstation']))],stationCount=candidates.reduce((sum,s)=>sum+Math.max(1,s.stationCount??1),0),tempValues=candidates.map(s=>Number(s.temperature)).filter(Number.isFinite),tempSpread=tempValues.length>1?Math.sqrt(tempValues.reduce((sum,v)=>sum+(v-temperature)**2,0)/tempValues.length):0;
 const distances=weighted.map(x=>({value:Number(x.s.distance),weight:x.w})),heights=weighted.map(x=>({value:Number(x.s.height),weight:x.w})),latest=candidates.map(s=>s.timestamp).filter(Boolean).sort().at(-1),windDirections=candidates.map(s=>({value:Number(s.windDirection),weight:analysisWeight(s,targetElevation,'unknown','windDirection')}));
 const qffPressure=stationWeightedMean(candidates.filter(s=>s.pressureReference==='QFF'||s.pressureReference==='MSL').map(s=>({value:Number(s.pressure),weight:analysisWeight(s,targetElevation,'unknown','pressure')})),7);return{name:`Robustes Mittel aus ${stationCount} Stationen`,provider:'Lokales Stationsmittel',stationId:candidates.map(x=>x.stationId).filter(Boolean).slice(0,4).join(','),distance:stationWeightedMean(distances,35000),height:stationWeightedMean(heights,650),timestamp:latest,temperature,humidity:field('humidity',18),dewPoint:field('dewPoint',4.5),pressure:qffPressure,pressureReference:qffPressure===undefined?undefined:'QFF',windSpeed:field('windSpeed',12),windDirection:stationCircularMean(windDirections),windGust:field('windGust',18),windUnit:'kt',visibility:field('visibility',18000),cloudCover:field('cloudCover',38),ceilingHft:field('ceilingHft',60),cloudBaseHft:field('cloudBaseHft',60),precipitation:field('precipitation',8),stationCount,sourceProviders:providers,fieldSources:stationFieldSourcesForCandidates(weighted,targetElevation),blended:true,temperatureSpread:tempSpread,analysisMethod:'Robuste Stationsmittelung',uncertainty:Math.max(.2,tempSpread),effectiveResolutionKm:Math.max(1,Number(stationWeightedMean(distances,35000)??0)/1000),candidateCount:candidates.length,rejectedCount:Math.max(0,input.length-candidates.length)};
}

type LocalBackground={temperature?:number;humidity?:number;dewPoint?:number;pressure?:number;windSpeed?:number;windDirection?:number;windGust?:number;visibility?:number;cloudCover?:number;precipitation?:number;isDay?:number};
function contextUrbanClass(context?:Location):UrbanClass{return context?.urbanClass&&context.urbanClass!=='unknown'?context.urbanClass:urbanClassFromPlace(context?.featureCode,context?.population,context?.poiType?.split('=')[0],context?.poiType?.split('=')[1])}
function candidateSiteClass(s:Station):UrbanClass{if(s.siteClass&&s.siteClass!=='unknown')return s.siteClass;const text=`${s.name} ${s.provider}`.toLowerCase();if(/stadt|urban|city center|innenstadt/.test(text))return'urban';if(/flughafen|airport|flugplatz|feld|warte|berg|gipfel/.test(text))return'rural';return'unknown'}
function networkQuality(s:Station){const trust=Number.isFinite(s.trustFactor)?Math.max(.25,Math.min(1.15,Number(s.trustFactor)/100)):1;return sourcePolicyFor(s.provider,s.networkClass).quality*trust}
function analysisWeight(s:Station,targetElevation:number|undefined,targetUrban:UrbanClass,field:StationAnalysisField='temperature'){
 const observation=stationFieldObservationContext(s,field,targetElevation),policy=fieldWeightPolicy(observation.provider??s.provider,observation.networkClass??s.networkClass,field),distanceKm=Math.max(.1,observation.distanceKm),age=observation.ageMinutes,relevance=observation.relevance;
 if(relevance<=0)return 0;
 const trust=Number.isFinite(s.trustFactor)?Math.max(.25,Math.min(1.15,Number(s.trustFactor)/100)):1,site=fieldSiteCompatibility(field,targetUrban,candidateSiteClass(s)),localityScale=field==='pressure'?42:field==='windSpeed'||field==='windDirection'||field==='windGust'?28:field==='visibility'||field==='cloudCover'||field==='precipitation'?20:18,locality=.55+.65*Math.exp(-Math.pow(distanceKm/localityScale,1.22)),sourceDistance=Math.exp(-Math.pow(distanceKm/Math.max(3,policy.distanceScaleKm),1.15)),sourceAge=Math.exp(-Math.pow(age/Math.max(12,policy.ageScaleMinutes),1.2)),sourceFit=Math.sqrt(sourceDistance*sourceAge);return policy.quality*trust*site*locality*relevance*sourceFit
}
function stationFieldValue(station:Station,key:keyof Station){const value=Number(station[key]);if(!Number.isFinite(value))return Number.NaN;if(key==='precipitation')return Number(normalisePrecipitationAccumulation(value,precipitationIntervalMinutes(station.provider,station.networkClass,station.precipitationMinutes),60));return value}
type LocalBackgroundResult={rows:LocalBackground[];modelId:string;modelLabel:string};
const localBackgroundCache=new Map<string,{at:number;value:LocalBackgroundResult}>();
const LOCAL_BACKGROUND_STORAGE_PREFIX='mid:hyperlocal-background:v1:';
const LOCAL_BACKGROUND_FRESH_MS=5*60000;
const LOCAL_BACKGROUND_STALE_MS=30*60000;
function compactCacheHash(value:string){let hash=2166136261;for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619)}return(hash>>>0).toString(36)}
function localBackgroundStorageKey(key:string){return`${LOCAL_BACKGROUND_STORAGE_PREFIX}${compactCacheHash(key)}`}
function readStoredLocalBackground(key:string,maxAgeMs=LOCAL_BACKGROUND_STALE_MS){try{const parsed=JSON.parse(localStorage.getItem(localBackgroundStorageKey(key))||'null') as{at?:number;sourceKey?:string;value?:LocalBackgroundResult}|null,at=Number(parsed?.at),age=Date.now()-at;return parsed?.sourceKey===key&&parsed?.value&&Number.isFinite(at)&&age>=0&&age<=maxAgeMs?{at,value:parsed.value}:null}catch{return null}}
function writeStoredLocalBackground(key:string,value:LocalBackgroundResult,at=Date.now()){try{writeBoundedStorage(localStorage,localBackgroundStorageKey(key),{at,sourceKey:key,value},[LOCAL_BACKGROUND_STORAGE_PREFIX],16,LOCAL_BACKGROUND_STALE_MS)}catch{}}
function hyperlocalBackgroundModelCandidates(context?:Location){const country=countryCodeFromLocation(context?.country_code??context?.country),regional=country==='DE'?['dwd_icon_d2','knmi_harmonie_arome_europe']:country==='AT'?['geosphere_arome_austria','dwd_icon_d2']:country==='CH'?['meteoswiss_icon_ch1','dwd_icon_d2']:country==='NL'||country==='BE'?['knmi_harmonie_arome_netherlands','knmi_harmonie_arome_europe','dwd_icon_d2']:country==='FR'?['meteofrance_arome_france_hd_15min','meteofrance_arome_france_hd']:country==='GB'||country==='IE'?['ukmo_uk_deterministic_2km']:country==='NO'||country==='SE'||country==='DK'||country==='FI'?['metno_nordic_pp']:country==='US'?['ncep_hrrr_conus']:country==='CA'?['cmc_gem_hrdps','ncep_hrrr_conus']:country==='IT'?['italia_meteo_arpae_icon_2i']:country==='CZ'?['chmi_aladin_cz_1km','chmi_aladin_central_europe_2km']:country==='JP'?['jma_msm']:country==='KR'?['kma_ldps']:[];return[...regional,'best_match'].filter((value,index,rows)=>rows.indexOf(value)===index)}
function hyperlocalBackgroundModelLabel(modelId:string){const labels:Record<string,string>={dwd_icon_d2:'DWD ICON-D2 · 2 km',knmi_harmonie_arome_europe:'KNMI HARMONIE-AROME Europe',geosphere_arome_austria:'GeoSphere AROME Austria',meteoswiss_icon_ch1:'MeteoSwiss ICON-CH1 · 1 km',knmi_harmonie_arome_netherlands:'KNMI HARMONIE-AROME NL · 2 km',meteofrance_arome_france_hd_15min:'Météo-France AROME HD · 15 min',meteofrance_arome_france_hd:'Météo-France AROME HD',ukmo_uk_deterministic_2km:'UK Met Office UKV · 2 km',metno_nordic_pp:'MET Nordic PP · 1 km',ncep_hrrr_conus:'NOAA HRRR · 3 km',cmc_gem_hrdps:'ECCC HRDPS · 2,5 km',italia_meteo_arpae_icon_2i:'ItaliaMeteo ICON-2I',chmi_aladin_cz_1km:'CHMI ALADIN CZ · 1 km',chmi_aladin_central_europe_2km:'CHMI ALADIN Mitteleuropa',jma_msm:'JMA MSM · 5 km',kma_ldps:'KMA LDPS · 1,5 km',best_match:'Open-Meteo Best Match'};return labels[modelId]??modelId}
function localBackgroundKey(points:{lat:number;lon:number;elevation?:number}[],models:string[]){return`${models.join(',')}|${points.slice(0,18).map(point=>`${point.lat.toFixed(3)}:${point.lon.toFixed(3)}:${Number.isFinite(point.elevation)?Math.round(Number(point.elevation)/25)*25:'x'}`).join('|')}`}
async function fetchLocalBackground(points:{lat:number;lon:number;elevation?:number}[],modelId:string,signal?:AbortSignal):Promise<LocalBackground[]>{const selected=points.slice(0,18),p=new URLSearchParams({latitude:selected.map(x=>x.lat.toFixed(5)).join(','),longitude:selected.map(x=>x.lon.toFixed(5)).join(','),elevation:selected.map(x=>Number.isFinite(x.elevation)?String(Math.round(Number(x.elevation))):'nan').join(','),timezone:'GMT',forecast_days:'1',models:modelId,wind_speed_unit:'kn',current:['temperature_2m','relative_humidity_2m','dew_point_2m','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','visibility','cloud_cover','precipitation','is_day'].join(',')});const raw=await j<any>(`https://api.open-meteo.com/v1/forecast?${p}`,signal),list=Array.isArray(raw)?raw:[raw];if(list.length<selected.length)throw new Error(`Lokaler Modellhintergrund ${modelId} unvollständig`);return list.map((item:any)=>{const c=item?.current??{},n=(v:any)=>Number.isFinite(Number(v))?Number(v):undefined;return{temperature:n(c.temperature_2m),humidity:n(c.relative_humidity_2m),dewPoint:n(c.dew_point_2m),pressure:n(c.pressure_msl),windSpeed:n(c.wind_speed_10m),windDirection:n(c.wind_direction_10m),windGust:n(c.wind_gusts_10m),visibility:n(c.visibility),cloudCover:n(c.cloud_cover),precipitation:n(c.precipitation),isDay:n(c.is_day)}})}
async function localBackground(points:{lat:number;lon:number;elevation?:number}[],context?:Location,signal?:AbortSignal):Promise<LocalBackgroundResult>{const models=hyperlocalBackgroundModelCandidates(context),key=localBackgroundKey(points,models),memory=localBackgroundCache.get(key),stored=readStoredLocalBackground(key),cached=memory&&(!stored||memory.at>=stored.at)?memory:stored;if(cached){localBackgroundCache.set(key,cached);if(Date.now()-cached.at<=LOCAL_BACKGROUND_FRESH_MS)return cached.value}let lastError:unknown;for(const modelId of models){try{const rows=await fetchLocalBackground(points,modelId,signal),value={rows,modelId,modelLabel:hyperlocalBackgroundModelLabel(modelId)},at=Date.now();localBackgroundCache.set(key,{at,value});writeStoredLocalBackground(key,value,at);if(localBackgroundCache.size>24){const oldest=[...localBackgroundCache.entries()].sort((a,b)=>a[1].at-b[1].at).slice(0,localBackgroundCache.size-24);for(const [cacheKey] of oldest)localBackgroundCache.delete(cacheKey)}return value}catch(error){lastError=error;if(signal?.aborted)throw error}}if(cached&&Date.now()-cached.at<=LOCAL_BACKGROUND_STALE_MS)return cached.value;throw lastError??new Error('Lokaler Modellhintergrund nicht verfügbar')}
type TerrainMorphology={elevation?:number;slopeDeg:number;aspectDeg?:number;reliefM:number;positionIndexM:number;exposure:number;directionalExposure:number[]};
type LocalSurfaceContext={error?:string;surfaceClass?:string;lcz?:string;imperviousnessPercent?:number;builtFraction?:number;builtIntensity?:number;roughnessLengthM?:number;source?:string;quality?:'gis'|'proxy'};
type MorphologyContext={target?:TerrainMorphology;stations:Map<Station,TerrainMorphology>;surface?:LocalSurfaceContext;targetWindSpeed?:number;targetWindDirection?:number;isDay?:boolean};
const terrainMorphologyCache=new Map<string,{at:number;value:TerrainMorphology}>();
const TERRAIN_MORPHOLOGY_STORAGE_PREFIX='mid:terrain-morphology:v1:';
const TERRAIN_MORPHOLOGY_TTL=14*86400000;
const TERRAIN_EXPOSURE_BEARINGS=[0,45,90,135,180,225,270,315];
function offsetPoint(lat:number,lon:number,northMeters:number,eastMeters:number){return{lat:lat+northMeters/111000,lon:lon+eastMeters/(111000*Math.max(.25,Math.cos(lat*Math.PI/180)))}}
function bearingOffsetPoint(lat:number,lon:number,bearing:number,distanceM:number){const radians=bearing*Math.PI/180;return offsetPoint(lat,lon,Math.cos(radians)*distanceM,Math.sin(radians)*distanceM)}
function terrainMorphologyKey(lat:number,lon:number){return`${lat.toFixed(4)}:${lon.toFixed(4)}`}
function readStoredTerrainMorphology(key:string){try{const parsed=JSON.parse(localStorage.getItem(`${TERRAIN_MORPHOLOGY_STORAGE_PREFIX}${key}`)||'null') as{at?:number;value?:TerrainMorphology}|null,at=Number(parsed?.at),age=Date.now()-at;return parsed?.value&&Number.isFinite(at)&&age>=0&&age<=TERRAIN_MORPHOLOGY_TTL?{at,value:parsed.value}:null}catch{return null}}
function writeStoredTerrainMorphology(key:string,value:TerrainMorphology,at=Date.now()){try{writeBoundedStorage(localStorage,`${TERRAIN_MORPHOLOGY_STORAGE_PREFIX}${key}`,{at,value},[TERRAIN_MORPHOLOGY_STORAGE_PREFIX],80,TERRAIN_MORPHOLOGY_TTL)}catch{}}
function terrainMorphologyFromElevations(values:number[]){const [center,north,south,east,west]=values,span=700,dzDy=(north-south)/span,dzDx=(east-west)/span,grade=Math.sqrt(dzDx*dzDx+dzDy*dzDy),slopeDeg=Math.atan(grade)*180/Math.PI,aspectDeg=slopeDeg<.6?undefined:(Math.atan2(-dzDx,-dzDy)*180/Math.PI+360)%360,local=[north,south,east,west].filter(Number.isFinite),directionalInner=values.slice(5,13),directionalOuter=values.slice(13,21),terrainValues=[...local,...directionalInner,...directionalOuter].filter(Number.isFinite),reliefM=terrainValues.length?Math.max(center,...terrainValues)-Math.min(center,...terrainValues):0,positionIndexM=local.length?center-local.reduce((sum,v)=>sum+v,0)/local.length:0,exposure=clampNumber(.5+positionIndexM/90+slopeDeg/120,0,1),directionalExposure=TERRAIN_EXPOSURE_BEARINGS.map((_,index)=>{const inner=Number(directionalInner[index]),outer=Number(directionalOuter[index]),shelter=Math.max(0,Number.isFinite(inner)?inner-center:0,Number.isFinite(outer)?(outer-center)*.58:0),openness=Math.max(0,Number.isFinite(inner)?center-inner:0,Number.isFinite(outer)?(center-outer)*.42:0);return clampNumber(.5+openness/150-shelter/105+positionIndexM/320,0,1)});return{elevation:center,slopeDeg,aspectDeg,reliefM,positionIndexM,exposure,directionalExposure}}
function directionalTerrainExposure(profile:TerrainMorphology|undefined,direction:number|undefined){if(!profile)return .5;const normalized=Number(direction);if(!Number.isFinite(normalized)||profile.directionalExposure.length!==8)return profile.exposure;const sector=((normalized%360)+360)%360/45,lower=Math.floor(sector)%8,upper=(lower+1)%8,fraction=sector-Math.floor(sector),a=profile.directionalExposure[lower],b=profile.directionalExposure[upper];return clampNumber(a+(b-a)*fraction,0,1)}
async function terrainMorphologyForPoints(points:{lat:number;lon:number}[],signal?:AbortSignal){const result=new Map<number,TerrainMorphology>(),missing:number[]=[];points.forEach((point,index)=>{const key=terrainMorphologyKey(point.lat,point.lon),memory=terrainMorphologyCache.get(key),stored=readStoredTerrainMorphology(key),cached=memory&&(!stored||memory.at>=stored.at)?memory:stored;if(cached&&Date.now()-cached.at<TERRAIN_MORPHOLOGY_TTL){terrainMorphologyCache.set(key,cached);result.set(index,cached.value)}else missing.push(index)});for(let offset=0;offset<missing.length;offset+=4){const ids=missing.slice(offset,offset+4),samplePoints=ids.flatMap(index=>{const p=points[index],cardinal=[{lat:p.lat,lon:p.lon},offsetPoint(p.lat,p.lon,350,0),offsetPoint(p.lat,p.lon,-350,0),offsetPoint(p.lat,p.lon,0,350),offsetPoint(p.lat,p.lon,0,-350)],inner=TERRAIN_EXPOSURE_BEARINGS.map(bearing=>bearingOffsetPoint(p.lat,p.lon,bearing,700)),outer=TERRAIN_EXPOSURE_BEARINGS.map(bearing=>bearingOffsetPoint(p.lat,p.lon,bearing,2200));return[...cardinal,...inner,...outer]}),params=new URLSearchParams({latitude:samplePoints.map(p=>p.lat.toFixed(6)).join(','),longitude:samplePoints.map(p=>p.lon.toFixed(6)).join(',')}),raw=await j<any>(`https://api.open-meteo.com/v1/elevation?${params}`,signal),elevations=(Array.isArray(raw?.elevation)?raw.elevation:[]).map(Number);if(elevations.length<samplePoints.length)throw new Error('Copernicus-DEM-Expositionsprofil unvollständig');ids.forEach((id,local)=>{const values=elevations.slice(local*21,local*21+21);if(values.length===21&&values.every(Number.isFinite)){const profile=terrainMorphologyFromElevations(values),key=terrainMorphologyKey(points[id].lat,points[id].lon),at=Date.now();result.set(id,profile);terrainMorphologyCache.set(key,{at,value:profile});writeStoredTerrainMorphology(key,profile,at)}})}return result}
async function localSurfaceContext(lat:number,lon:number,signal?:AbortSignal,fast=false):Promise<LocalSurfaceContext|undefined>{if(fast||!workerBaseCandidates('general').length)return undefined;try{return await fetchWorkerJson<LocalSurfaceContext>('site-context',{lat,lon},{purpose:'general',signal,timeoutMs:8500,maxAgeMs:21600000,staleIfErrorMs:172800000,cacheKey:`site-context:${lat.toFixed(4)}:${lon.toFixed(4)}`})}catch{return undefined}}
function siteClassRoughness(site:UrbanClass,station?:Station){const text=`${station?.name||''} ${station?.provider||''}`.toLowerCase();if(/airport|flughafen|flugplatz|airfield/.test(text))return .035;if(/berg|gipfel|mountain|peak/.test(text))return .06;if(site==='urban')return .9;if(site==='suburban')return .4;if(site==='rural')return .07;return .15}
function siteClassImperviousness(site:UrbanClass,station?:Station){const text=`${station?.name||''} ${station?.provider||''}`.toLowerCase();if(/airport|flughafen|flugplatz|airfield|feld|wiese/.test(text))return 6;if(/wald|forest/.test(text))return 2;if(site==='urban')return 72;if(site==='suburban')return 34;if(site==='rural')return 7;return 20}
function angularSeparation(a:number|undefined,b:number|undefined){if(!Number.isFinite(a)||!Number.isFinite(b))return 0;return Math.abs(((Number(a)-Number(b)+540)%360)-180)}
function morphologyCompatibility(field:StationAnalysisField,station:Station,context?:MorphologyContext){if(!context)return 1;let factor=1;const target=context.target,profile=context.stations.get(station);if(target&&profile&&field!=='pressure'){const positionDiff=Math.abs(target.positionIndexM-profile.positionIndexM),slopeDiff=Math.abs(target.slopeDeg-profile.slopeDeg),aspectDiff=angularSeparation(target.aspectDeg,profile.aspectDeg),windTerrain=field==='windSpeed'||field==='windDirection'||field==='windGust',targetExposure=windTerrain?directionalTerrainExposure(target,context.targetWindDirection):target.exposure,stationExposure=windTerrain?directionalTerrainExposure(profile,context.targetWindDirection):profile.exposure,terrain=field==='temperature'||field==='humidity'||field==='dewPoint'?Math.exp(-positionDiff/55)*Math.exp(-slopeDiff/24)*(target.slopeDeg>3&&profile.slopeDeg>3?(.72+.28*Math.exp(-aspectDiff/100)):1):windTerrain?Math.exp(-Math.abs(targetExposure-stationExposure)/.5)*Math.exp(-slopeDiff/34):field==='visibility'||field==='precipitation'?Math.exp(-positionDiff/95)*Math.exp(-slopeDiff/45):.9+.1*Math.exp(-positionDiff/120);factor*=clampNumber(.28+.72*terrain,.28,1)}if(context.surface&&field!=='pressure'&&field!=='cloudCover'&&field!=='ceilingHft'&&field!=='cloudBaseHft'){const targetZ=Math.max(.0002,Number(context.surface.roughnessLengthM)||siteClassRoughness(context.surface.surfaceClass?.includes('dense')?'urban':context.surface.surfaceClass==='built'?'suburban':context.surface.surfaceClass==='open'||context.surface.surfaceClass==='water'?'rural':'unknown')),stationClass=candidateSiteClass(station),stationZ=siteClassRoughness(stationClass,station),logDiff=Math.abs(Math.log10(targetZ)-Math.log10(Math.max(.0002,stationZ))),surfaceFactor=field==='windSpeed'||field==='windDirection'||field==='windGust'?Math.exp(-logDiff/.88):field==='temperature'||field==='humidity'||field==='dewPoint'?Math.exp(-logDiff/1.8):Math.exp(-logDiff/2.3);factor*=clampNumber(.32+.68*surfaceFactor,.32,1);if((field==='temperature'||field==='humidity'||field==='dewPoint')&&context.surface.quality==='gis'&&Number.isFinite(Number(context.surface.imperviousnessPercent))){const targetImpervious=clampNumber(Number(context.surface.imperviousnessPercent),0,100),stationImpervious=siteClassImperviousness(stationClass,station),weakWind=!Number.isFinite(context.targetWindSpeed)||Number(context.targetWindSpeed)<7,scale=context.isDay===false&&weakWind?19:context.isDay===false?25:38,imperviousFactor=Math.exp(-Math.abs(targetImpervious-stationImpervious)/scale);factor*=clampNumber(.3+.7*imperviousFactor,.3,1)}}return clampNumber(factor,.1,1)}
function surfaceUrbanClass(surface:LocalSurfaceContext|undefined,fallback:UrbanClass):UrbanClass{if(!surface)return fallback;const name=String(surface.surfaceClass||'').toLowerCase(),impervious=Number(surface.imperviousnessPercent),built=Number(surface.builtFraction??surface.builtIntensity);if(surface.quality==='gis'){if(Number.isFinite(impervious)&&impervious>=65||Number.isFinite(built)&&built>=.65||name.includes('dense'))return'urban';if(Number.isFinite(impervious)&&impervious>=25||Number.isFinite(built)&&built>=.28||name==='built')return'suburban';if(Number.isFinite(impervious)&&impervious<=12||Number.isFinite(built)&&built<=.12||/open|wood|water/.test(name))return'rural'}if(fallback==='unknown'){if(name.includes('dense'))return'urban';if(name==='built')return'suburban';if(/open|wood|water/.test(name))return'rural'}return fallback}

async function morphologyContextForAnalysis(ranked:Station[],lat:number,lon:number,signal?:AbortSignal,fast=false):Promise<MorphologyContext|undefined>{const terrainPoints=[{lat,lon},...ranked.map(station=>({lat:Number(station.latitude),lon:Number(station.longitude)}))];try{const [profiles,surface]=await Promise.all([terrainMorphologyForPoints(terrainPoints,signal),localSurfaceContext(lat,lon,signal,fast)]),stations=new Map<Station,TerrainMorphology>();ranked.forEach((station,index)=>{const profile=profiles.get(index+1);if(profile)stations.set(station,profile)});return{target:profiles.get(0),stations,surface}}catch{return undefined}}
function normalizeStationWindUnit(station:Station):Station{if(station.windUnit!=='kmh')return station;const speed=Number(station.windSpeed),gust=Number(station.windGust);return{...station,windSpeed:Number.isFinite(speed)?speed/1.852:undefined,windGust:Number.isFinite(gust)?gust/1.852:undefined,windUnit:'kt'}}
function stationNetworkRank(value:Station['networkClass']){return value==='official'?4:value==='professional'?3:value==='pws'?2:value==='citizen'?1:0}
function stationObservationEpoch(timestamp?:string){const normalized=normalizeStationTimestamp(timestamp),value=normalized?Date.parse(normalized):NaN;return Number.isFinite(value)?value:NaN}
function equivalentStationCandidate(a:Station,b:Station){
 const aId=String(a.stationId||'').trim().toLowerCase(),bId=String(b.stationId||'').trim().toLowerCase(),hasCoordinates=Number.isFinite(a.latitude)&&Number.isFinite(a.longitude)&&Number.isFinite(b.latitude)&&Number.isFinite(b.longitude),separation=hasCoordinates?haversine(Number(a.latitude),Number(a.longitude),Number(b.latitude),Number(b.longitude)):Number.NaN;
 if(aId&&bId&&aId===bId){if(hasCoordinates)return separation<=2000;const aNetwork=String(a.provider||'').split('/')[0].trim().toLowerCase(),bNetwork=String(b.provider||'').split('/')[0].trim().toLowerCase();return Boolean(aNetwork&&aNetwork===bNetwork)}
 if(!hasCoordinates)return false;
 if(separation>900)return false;
 if(Number.isFinite(a.height)&&Number.isFinite(b.height)&&Math.abs(Number(a.height)-Number(b.height))>120)return false;
 const aTime=stationObservationEpoch(a.timestamp),bTime=stationObservationEpoch(b.timestamp);if(Number.isFinite(aTime)&&Number.isFinite(bTime)&&Math.abs(aTime-bTime)>25*60000)return false;
 if(Number.isFinite(a.temperature)&&Number.isFinite(b.temperature)&&Math.abs(Number(a.temperature)-Number(b.temperature))>1.8)return false;
 return true;
}
function mergeEquivalentStationCandidates(a:Station,b:Station){
 const quality=(station:Station)=>networkQuality(station)*1.7-stationAgeMinutes(station.timestamp)/240-(station.distance??100000)/250000,primary=quality(a)>=quality(b)?a:b,secondary=primary===a?b:a,fields:(keyof Station)[]=['latitude','longitude','distance','height','timestamp','temperature','humidity','dewPoint','pressure','pressureReference','windSpeed','windDirection','windGust','visibility','cloudCover','ceilingHft','cloudBaseHft','precipitation','precipitationMinutes','cloudObservation','cloudAnalysisMethod','trustFactor','siteClass','sourceType','qcLabel','fieldSources','temporalResolutionMinutes','fieldTemporalResolutionMinutes','fieldObservedAt'];
 const merged:Station={...secondary,...primary};for(const field of fields)if(merged[field]===undefined)Object.assign(merged,{[field]:secondary[field]});
 merged.distance=Math.min(Number(a.distance??Infinity),Number(b.distance??Infinity));if(!Number.isFinite(merged.distance))merged.distance=primary.distance??secondary.distance;
 merged.fieldTemporalResolutionMinutes={...(secondary.fieldTemporalResolutionMinutes??{}),...(primary.fieldTemporalResolutionMinutes??{})};merged.fieldObservedAt={...(secondary.fieldObservedAt??{}),...(primary.fieldObservedAt??{})};const analysisFields:StationAnalysisField[]=['temperature','humidity','dewPoint','pressure','windSpeed','windDirection','windGust','visibility','cloudCover','ceilingHft','cloudBaseHft','precipitation'],mergedSources:StationFieldSources={};for(const field of analysisFields){const candidates=[a,b].filter(candidate=>Number.isFinite(Number(candidate[field]))),winner=candidates.sort((left,right)=>analysisWeight(right,undefined,'unknown',field)-analysisWeight(left,undefined,'unknown',field))[0];if(winner){Object.assign(merged,{[field]:winner[field]});const sources=winner.fieldSources?.[field];if(sources?.length)mergedSources[field]=sources;if(winner.fieldTemporalResolutionMinutes?.[field]!==undefined)merged.fieldTemporalResolutionMinutes![field]=winner.fieldTemporalResolutionMinutes[field];if(winner.fieldObservedAt?.[field])merged.fieldObservedAt![field]=winner.fieldObservedAt[field];if(field==='pressure')merged.pressureReference=winner.pressureReference;if(field==='precipitation')merged.precipitationMinutes=winner.precipitationMinutes}}merged.fieldSources={...(secondary.fieldSources??{}),...(primary.fieldSources??{}),...mergedSources};
 merged.sourceProviders=[...new Set([...(a.sourceProviders??[a.provider||a.name]),...(b.sourceProviders??[b.provider||b.name])].filter(Boolean))];merged.stationCount=Math.max(1,a.stationCount??1,b.stationCount??1);merged.networkClass=stationNetworkRank(a.networkClass)>=stationNetworkRank(b.networkClass)?a.networkClass:b.networkClass;merged.trustFactor=Math.max(Number(a.trustFactor)||0,Number(b.trustFactor)||0)||undefined;
 if((secondary.cloudObservation==='cavok'||secondary.cloudObservation==='clear'||secondary.cloudObservation==='layers')&&primary.cloudObservation===undefined){merged.cloudObservation=secondary.cloudObservation;merged.cloudCover=secondary.cloudCover;merged.ceilingHft=secondary.ceilingHft??merged.ceilingHft;merged.cloudBaseHft=secondary.cloudBaseHft??merged.cloudBaseHft}
 return merged;
}
function dedupeStationCandidates(input:Station[]){const fields:StationAnalysisField[]=['temperature','humidity','dewPoint','pressure','windSpeed','windDirection','windGust','visibility','cloudCover','ceilingHft','cloudBaseHft','precipitation'],out:Station[]=[];for(const raw of input){const station=normalizeStationWindUnit(raw);if(stationAgeMinutes(station.timestamp)>fieldRelevanceLimits('pressure').hardAgeMinutes||!fields.some(field=>Number.isFinite(Number(station[field]))))continue;const index=out.findIndex(candidate=>equivalentStationCandidate(candidate,station));if(index<0)out.push(station);else out[index]=mergeEquivalentStationCandidates(out[index],station)}return out}
type ResidualResult={value?:number;uncertainty?:number;correction?:number;accepted:Set<Station>;weights:Map<Station,number>};
function residualSupport(sum:number,effectiveN:number,field:StationAnalysisField){const responseScale=field==='pressure' ? .5 : (field==='temperature'||field==='dewPoint') ? .78 : field==='humidity' ? .88 : (field==='windGust'||field==='precipitation') ? 1.05 : .92,singleFactor=effectiveN>=2 ? 1.08 : effectiveN>=1.35 ? .96 : .82,support=Math.min(.98,(1-Math.exp(-Math.max(0,sum)/responseScale))*singleFactor);return Math.max(0,support)}
function residualField(candidates:Station[],backgrounds:LocalBackground[],target:LocalBackground,obsKey:keyof Station,bgKey:keyof LocalBackground,targetElevation:number|undefined,targetUrban:UrbanClass,absoluteLimit:number,min:number,max:number,predicate?:(s:Station)=>boolean,morphology?:MorphologyContext,weightModifier?:(s:Station,index:number)=>number):ResidualResult{const raw=candidates.map((s,i)=>{const observed=stationFieldValue(s,obsKey),base=Number(backgrounds[i+1]?.[bgKey]),field=obsKey as StationAnalysisField,modifier=weightModifier?clampNumber(weightModifier(s,i),.03,2):1,weight=analysisWeight(s,targetElevation,targetUrban,field)*morphologyCompatibility(field,s,morphology)*modifier;return{station:s,residual:observed-base,observed,weight}}).filter(x=>(!predicate||predicate(x.station))&&Number.isFinite(x.residual)&&x.weight>.0001&&x.observed>=min&&x.observed<=max),accepted=new Set<Station>(),weights=new Map<Station,number>();if(!raw.length||!Number.isFinite(Number(target[bgKey])))return{accepted,weights};const med=median(raw.map(x=>x.residual)),mad=median(raw.map(x=>Math.abs(x.residual-med))),limit=Math.max(absoluteLimit,Number.isFinite(mad)?mad*3.7:0),filtered=raw.filter(x=>Math.abs(x.residual-med)<=limit&&Math.abs(x.residual)<=absoluteLimit*2.5),use=filtered.length?filtered:raw.sort((a,b)=>b.weight-a.weight).slice(0,1),sum=use.reduce((a,x)=>a+x.weight,0);if(!sum)return{accepted,weights};for(const x of use){accepted.add(x.station);weights.set(x.station,x.weight)}const rawCorrection=use.reduce((a,x)=>a+x.residual*x.weight,0)/sum,effectiveN=sum*sum/Math.max(.0001,use.reduce((a,x)=>a+x.weight*x.weight,0)),support=residualSupport(sum,effectiveN,obsKey as StationAnalysisField),correction=rawCorrection*support,variance=use.reduce((a,x)=>a+(x.residual-rawCorrection)**2*x.weight,0)/sum,uncertainty=Math.max(.18,Math.sqrt(Math.max(0,variance))+.45/Math.sqrt(Math.max(1,effectiveN))+Math.abs(rawCorrection)*(1-support)*.2);return{value:Number(target[bgKey])+correction,uncertainty,correction,accepted,weights}}
function angularDifference(a:number,b:number){return((a-b+540)%360)-180}
function residualCircularField(candidates:Station[],backgrounds:LocalBackground[],target:LocalBackground,targetElevation:number|undefined,targetUrban:UrbanClass,morphology?:MorphologyContext):ResidualResult{
 const raw=candidates.map((station,index)=>{const observed=Number(station.windDirection),base=Number(backgrounds[index+1]?.windDirection),speed=Math.max(Number(station.windSpeed)||0,Number(station.windGust)||0),weight=analysisWeight(station,targetElevation,targetUrban,'windDirection')*morphologyCompatibility('windDirection',station,morphology)*Math.min(1.4,Math.max(.35,speed/8));return{station,residual:angularDifference(observed,base),weight}}).filter(row=>Number.isFinite(row.residual)&&row.weight>.0001&&(Number(row.station.windSpeed)>=2||Number(row.station.windGust)>=5)),accepted=new Set<Station>(),weights=new Map<Station,number>(),targetDirection=Number(target.windDirection);
 if(!raw.length||!Number.isFinite(targetDirection))return{accepted,weights};const vector=(rows:typeof raw)=>{const x=rows.reduce((sum,row)=>sum+Math.cos(row.residual*Math.PI/180)*row.weight,0),y=rows.reduce((sum,row)=>sum+Math.sin(row.residual*Math.PI/180)*row.weight,0);return(Math.atan2(y,x)*180/Math.PI+360)%360},first=vector(raw),filtered=raw.filter(row=>Math.abs(angularDifference(row.residual,first))<=75),use=filtered.length?filtered:raw.sort((a,b)=>b.weight-a.weight).slice(0,1),correction=vector(use),rawSignedCorrection=correction>180?correction-360:correction,sum=use.reduce((total,row)=>total+row.weight,0),effectiveN=sum*sum/Math.max(.0001,use.reduce((total,row)=>total+row.weight*row.weight,0)),support=residualSupport(sum,effectiveN,'windDirection'),signedCorrection=rawSignedCorrection*support;for(const row of use){accepted.add(row.station);weights.set(row.station,row.weight)}const variance=sum?use.reduce((total,row)=>total+angularDifference(row.residual,rawSignedCorrection)**2*row.weight,0)/sum:0;return{value:(targetDirection+signedCorrection+360)%360,uncertainty:Math.sqrt(Math.max(0,variance))+Math.abs(rawSignedCorrection)*(1-support)*.15,correction:signedCorrection,accepted,weights}
}
function humidityFromTemperatureAndDewPoint(temperature:number,dewPoint:number){const a=17.625,b=243.04;return clampNumber(100*Math.exp((a*dewPoint)/(b+dewPoint)-(a*temperature)/(b+temperature)),0,100)}
function dewPointFromTemperatureAndHumidity(temperature:number,humidity:number){const a=17.625,b=243.04,gamma=Math.log(clampNumber(humidity,1,100)/100)+(a*temperature)/(b+temperature);return(b*gamma)/(a-gamma)}
function reconcileThermodynamics(temperature:number|undefined,humidity:number|undefined,dewPoint:number|undefined){if(!Number.isFinite(temperature))return{temperature,humidity,dewPoint};const t=Number(temperature),rawHumidity=Number.isFinite(humidity)?clampNumber(Number(humidity),0,100):undefined,rawDew=Number.isFinite(dewPoint)?Math.min(t,Number(dewPoint)):undefined;if(rawDew!==undefined){const derived=humidityFromTemperatureAndDewPoint(t,rawDew),finalHumidity=rawHumidity===undefined||Math.abs(rawHumidity-derived)>18?derived:clampNumber(rawHumidity*.65+derived*.35,0,100);return{temperature:t,humidity:finalHumidity,dewPoint:rawDew}}if(rawHumidity!==undefined)return{temperature:t,humidity:rawHumidity,dewPoint:Math.min(t,dewPointFromTemperatureAndHumidity(t,rawHumidity))};return{temperature:t,humidity:rawHumidity,dewPoint:rawDew}}
function directStationField(candidates:Station[],obsKey:keyof Station,targetElevation:number|undefined,targetUrban:UrbanClass,absoluteLimit:number,min:number,max:number,morphology?:MorphologyContext):ResidualResult{const field=obsKey as StationAnalysisField,raw=candidates.map(station=>({station,value:stationFieldValue(station,obsKey),weight:analysisWeight(station,targetElevation,targetUrban,field)*morphologyCompatibility(field,station,morphology)})).filter(row=>Number.isFinite(row.value)&&row.value>=min&&row.value<=max&&row.weight>.0001),accepted=new Set<Station>(),weights=new Map<Station,number>();if(!raw.length)return{accepted,weights};const med=median(raw.map(row=>row.value)),mad=median(raw.map(row=>Math.abs(row.value-med))),limit=Math.max(absoluteLimit,Number.isFinite(mad)?mad*3.7:0),filtered=raw.filter(row=>Math.abs(row.value-med)<=limit),use=filtered.length?filtered:raw.sort((a,b)=>b.weight-a.weight).slice(0,1),sum=use.reduce((total,row)=>total+row.weight,0);if(!sum)return{accepted,weights};for(const row of use){accepted.add(row.station);weights.set(row.station,row.weight)}const value=use.reduce((total,row)=>total+row.value*row.weight,0)/sum,variance=use.reduce((total,row)=>total+(row.value-value)**2*row.weight,0)/sum;return{value,uncertainty:Math.sqrt(Math.max(0,variance)),accepted,weights}}
type CloudReconciliation={value?:number;method?:string;clearReports:number;cloudyReports:number};
function explicitSkyWeight(station:Station,targetElevation?:number){const context=stationFieldObservationContext(station,'cloudCover',targetElevation),kind=station.cloudObservation==='cavok'?1.35:station.cloudObservation==='clear'?1.2:1;return networkQuality(station)*kind*context.relevance}
function reconcileHyperlocalCloudCover(candidates:Station[],residualValue:number|undefined,directValue:number|undefined,targetValue:number|undefined,targetElevation?:number):CloudReconciliation{
 const finite=[residualValue,directValue,targetValue].find(value=>Number.isFinite(value)),baseline=finite===undefined?undefined:Number(finite),now=Date.now(),authoritative=candidates.filter(station=>station.cloudObservation&&stationFieldObservationUsable(station,'cloudCover',now,targetElevation)&&Number.isFinite(station.cloudCover)&&(station.networkClass==='official'||station.networkClass==='professional'||/metar|aviationweather|dwd/i.test(String(station.provider||''))));
 const clear=authoritative.filter(station=>(station.cloudObservation==='cavok'||station.cloudObservation==='clear')&&(!Number.isFinite(station.visibility)||Number(station.visibility)>=8000)&&(!Number.isFinite(station.precipitation)||Number(station.precipitation)<=.2)),cloudy=authoritative.filter(station=>station.cloudObservation==='layers'&&Number(station.cloudCover)>=60),sum=(rows:Station[])=>rows.reduce((total,station)=>total+explicitSkyWeight(station,targetElevation),0),clearWeight=sum(clear),cloudyWeight=sum(cloudy),nearest=(rows:Station[])=>rows.length?Math.min(...rows.map(station=>Number(station.distance??999999))):Infinity,nearestClear=nearest(clear),nearestCloudy=nearest(cloudy);
 if(clear.length&&nearestClear<=45000&&clearWeight>=Math.max(.08,cloudyWeight*1.25)){
  const cavok=clear.some(station=>station.cloudObservation==='cavok'),multiple=clear.length>=2,cap=Math.max(8,(cavok?(nearestClear<=25000?24:30):(nearestClear<=25000?14:22))-(multiple?5:0)),value=Math.min(Number.isFinite(baseline)?Number(baseline):cap,cap);return{value:clampNumber(value,0,100),method:cavok?'Aktuelle METAR-Sichtmeldung (CAVOK) berücksichtigt':'Aktuelle klare METAR-Sichtmeldung berücksichtigt',clearReports:clear.length,cloudyReports:cloudy.length};
 }
 if(cloudy.length&&nearestCloudy<=35000&&cloudyWeight>=Math.max(.08,clearWeight*1.25)){
  const floor=nearestCloudy<=20000?72:62,value=Math.max(Number.isFinite(baseline)?Number(baseline):floor,floor);return{value:clampNumber(value,0,100),method:'Aktuelle METAR-Wolkenlagen berücksichtigt',clearReports:clear.length,cloudyReports:cloudy.length};
 }
 return{value:baseline===undefined?undefined:clampNumber(baseline,0,100),clearReports:clear.length,cloudyReports:cloudy.length};
}
function dynamicExposureWindCorrection(value:number|undefined,context:MorphologyContext|undefined,gust=false){const raw=Number(value),background=Number(context?.targetWindSpeed),direction=Number(context?.targetWindDirection);if(!Number.isFinite(raw)||!context?.target||!Number.isFinite(direction)||!Number.isFinite(background)||background<1)return{value:raw,factor:1,exposure:context?.target?.exposure};const exposure=directionalTerrainExposure(context.target,direction),roughness=Math.max(.0002,Number(context.surface?.roughnessLengthM)||.08),roughnessSensitivity=clampNumber(1/(1+roughness*.7),.55,1),amplitude=gust?.16:.12,factor=clampNumber(1+(exposure-.5)*amplitude*roughnessSensitivity,gust?.92:.94,gust?1.08:1.06);return{value:Math.max(0,raw*factor),factor,exposure}}
async function hyperlocalAnalysis(input:Station[],lat:number,lon:number,elevation:number|undefined,context:Location|undefined,signal?:AbortSignal,fast=false):Promise<Station|null>{
 const deduped=dedupeStationCandidates(input),nonCitizen=deduped.filter(s=>!isCitizenNetwork(s.provider)),fallback=robustBlendStations(nonCitizen.length?deduped:deduped.length>=3?deduped:[],elevation);
 if(!deduped.length||(!nonCitizen.length&&deduped.length<3))return null;
 const ranked=deduped.sort((a,b)=>stationFitScore(a.distance,a.height,elevation,isPrivateNetwork(a.provider)?-7000:0,a.timestamp)-stationFitScore(b.distance,b.height,elevation,isPrivateNetwork(b.provider)?-7000:0,b.timestamp)).filter(s=>Number.isFinite(s.latitude)&&Number.isFinite(s.longitude)).slice(0,fast?10:17);
 if(!ranked.length)return fallback;
 const morphologyPromise=morphologyContextForAnalysis(ranked,lat,lon,signal,fast).catch(()=>undefined);
 let backgroundSet:LocalBackgroundResult;
 try{backgroundSet=await localBackground([{lat,lon,elevation},...ranked.map(s=>({lat:Number(s.latitude),lon:Number(s.longitude),elevation:s.height}))],context,signal)}catch{return fallback}
 const backgrounds=backgroundSet.rows;if(backgrounds.length<ranked.length+1)return fallback;
 const morphology=await morphologyPromise,target=backgrounds[0];
 if(morphology){morphology.targetWindSpeed=target.windSpeed;morphology.targetWindDirection=target.windDirection;morphology.isDay=Number.isFinite(target.isDay)?Number(target.isDay)>=.5:undefined}
 const urban=surfaceUrbanClass(morphology?.surface,contextUrbanClass(context));
 const thermalSamples=new Map<Station,StableNightThermalSample>();
 ranked.forEach((station,index)=>{const observation=stationFieldObservationContext(station,'temperature',elevation),observedTemperature=stationFieldValue(station,'temperature'),backgroundTemperature=Number(backgrounds[index+1]?.temperature),siteCompatibility=fieldSiteCompatibility('temperature',urban,candidateSiteClass(station)),morphologyFit=morphologyCompatibility('temperature',station,morphology),aviation=station.sourceType==='aviation'||/metar|aviation|airport|flughafen|flugplatz/i.test(`${station.provider||''} ${station.name||''}`);thermalSamples.set(station,{distanceKm:observation.distanceKm,observedTemperature,backgroundTemperature,relevance:observation.relevance,siteCompatibility,morphologyCompatibility:morphologyFit,aviation})});
 const thermalRegime=detectStableNightThermalRegime({isDay:target.isDay,windKt:target.windSpeed,cloudCover:target.cloudCover,samples:[...thermalSamples.values()]}),temperatureWeightModifier=(station:Station)=>stableNightThermalWeightFactor(thermalSamples.get(station)!,thermalRegime,urban);
 const authoritative=(station:Station)=>fieldWeightPolicy(station.provider,station.networkClass,'visibility').sensitiveAllowed;
 const tempResidual=residualField(ranked,backgrounds,target,'temperature','temperature',elevation,urban,thermalRegime.active?4.2:2.6,-65,65,undefined,morphology,temperatureWeightModifier),directTemperatureRows=ranked.map(station=>{const sample=thermalSamples.get(station),observation=stationFieldObservationContext(station,'temperature',elevation),observedTemperature=stationFieldValue(station,'temperature'),aviation=Boolean(sample?.aviation),aviationFactor=aviation&&urban!=='rural'&&observation.distanceKm>7?.72:1,weight=analysisWeight(station,elevation,urban,'temperature')*morphologyCompatibility('temperature',station,morphology)*temperatureWeightModifier(station)*aviationFactor;return{station,weight,sample:{temperature:observedTemperature,weight,distanceKm:observation.distanceKm,ageMinutes:observation.ageMinutes,aviation}}}).filter(row=>Number.isFinite(row.sample.temperature)&&row.weight>.0001),temperatureConstraint=constrainTemperatureWithDirectObservations({modelTarget:target.temperature,residualValue:tempResidual.value,isDay:target.isDay,windKt:target.windSpeed,samples:directTemperatureRows.map(row=>row.sample)}),tempAccepted=new Set(tempResidual.accepted),tempWeights=new Map(tempResidual.weights);
 if(temperatureConstraint.applied)for(const index of temperatureConstraint.acceptedIndexes){const row=directTemperatureRows[index];if(!row)continue;tempAccepted.add(row.station);tempWeights.set(row.station,(tempWeights.get(row.station)||0)+row.weight*Math.max(.2,temperatureConstraint.strength))}
 const tempValue=temperatureConstraint.applied?temperatureConstraint.value:tempResidual.value,tempCorrection=Number.isFinite(Number(tempValue))&&Number.isFinite(Number(target.temperature))?Number(tempValue)-Number(target.temperature):tempResidual.correction,temp:ResidualResult={...tempResidual,value:tempValue,correction:tempCorrection,accepted:tempAccepted,weights:tempWeights},humidity=residualField(ranked,backgrounds,target,'humidity','humidity',elevation,urban,15,0,100,undefined,morphology),dew=residualField(ranked,backgrounds,target,'dewPoint','dewPoint',elevation,urban,3.8,-80,45,undefined,morphology),pressure=residualField(ranked,backgrounds,target,'pressure','pressure',elevation,urban,5.5,870,1085,s=>s.pressureReference==='QFF'||s.pressureReference==='MSL',morphology),windSpeed=residualField(ranked,backgrounds,target,'windSpeed','windSpeed',elevation,urban,9,0,120,undefined,morphology),windDirection=residualCircularField(ranked,backgrounds,target,elevation,urban,morphology),gust=residualField(ranked,backgrounds,target,'windGust','windGust',elevation,urban,14,0,180,undefined,morphology),visibility=residualField(ranked,backgrounds,target,'visibility','visibility',elevation,urban,20000,50,100000,authoritative,morphology),cloudCover=residualField(ranked,backgrounds,target,'cloudCover','cloudCover',elevation,urban,38,0,100,authoritative,morphology),ceiling=directStationField(ranked.filter(authoritative),'ceilingHft',elevation,urban,60,0,500,morphology),cloudBase=directStationField(ranked.filter(authoritative),'cloudBaseHft',elevation,urban,60,0,500,morphology),precipitation=residualField(ranked,backgrounds,target,'precipitation','precipitation',elevation,urban,3.5,0,60,authoritative,morphology);
 const analyses=[temp,humidity,dew,pressure,windSpeed,windDirection,gust,visibility,cloudCover,ceiling,cloudBase,precipitation];if(!analyses.some(analysis=>analysis.accepted.size))return fallback;
 const acceptedSet=new Set<Station>(),combinedWeights=new Map<Station,number>();
 for(const analysis of analyses)for(const station of analysis.accepted){acceptedSet.add(station);combinedWeights.set(station,(combinedWeights.get(station)||0)+(analysis.weights.get(station)||0))}
 const accepted=[...acceptedSet],weightSum=accepted.reduce((sum,s)=>sum+(combinedWeights.get(s)||analysisWeight(s,elevation,urban,'temperature')),0),weightedDistance=weightSum?accepted.reduce((sum,s)=>sum+Number(s.distance??0)*(combinedWeights.get(s)||analysisWeight(s,elevation,urban,'temperature')),0)/weightSum:undefined,providers=[...new Set(accepted.flatMap(s=>s.sourceProviders?.length?s.sourceProviders:[s.provider||'Messstation']))],latest=accepted.map(s=>s.timestamp).filter(Boolean).sort().at(-1),direct=robustBlendStations(ranked,elevation),cloudReconciliation=reconcileHyperlocalCloudCover(ranked,cloudCover.value,direct?.cloudCover,target.cloudCover,elevation),effectiveResolutionKm=weightedDistance===undefined?undefined:Math.max(.8,Math.min(60,weightedDistance/1000)),stationCount=accepted.reduce((sum,s)=>sum+Math.max(1,s.stationCount??1),0),temperatureStations=[...temp.accepted],temperatureWeightSum=temperatureStations.reduce((sum,station)=>sum+(temp.weights.get(station)||0),0),temperatureWeightedDistance=temperatureWeightSum?temperatureStations.reduce((sum,station)=>sum+(Number(station.distance??0)/1000)*(temp.weights.get(station)||0),0)/temperatureWeightSum:undefined,temperatureEffectiveResolutionKm=Number.isFinite(temperatureWeightedDistance)?Math.max(.5,Math.min(45,Number(temperatureWeightedDistance))):undefined,temperatureStationCount=temperatureStations.reduce((sum,station)=>sum+Math.max(1,station.stationCount??1),0),thermo=reconcileThermodynamics(temp.value,humidity.value??direct?.humidity,dew.value??direct?.dewPoint),rawWind=windSpeed.value??direct?.windSpeed,rawGust=gust.value??direct?.windGust,windExposure=dynamicExposureWindCorrection(rawWind,morphology,false),gustExposure=dynamicExposureWindCorrection(rawGust,morphology,true),windPair=Number.isFinite(windExposure.value)||Number.isFinite(gustExposure.value)?validateWindPair(Number(windExposure.value),Number(gustExposure.value)):null,constraintUncertainty=temperatureConstraint.applied?Math.max(.35,.28+temperatureConstraint.spreadK*.45+(1-temperatureConstraint.strength)*.45):undefined,baseThermalUncertainty=temp.uncertainty===undefined?undefined:thermalRegime.active?Math.max(temp.uncertainty,Math.min(2.2,.35+Math.max(thermalRegime.observationSpreadK,thermalRegime.residualSpreadK)*.24)):temp.uncertainty,thermalUncertainty=constraintUncertainty===undefined?baseThermalUncertainty:baseThermalUncertainty===undefined?constraintUncertainty:Math.max(baseThermalUncertainty,constraintUncertainty),fieldSources:StationFieldSources={temperature:stationFieldSourcesFromAnalysis(temp,'temperature'),humidity:stationFieldSourcesFromAnalysis(humidity,'humidity'),dewPoint:stationFieldSourcesFromAnalysis(dew,'dewPoint'),pressure:stationFieldSourcesFromAnalysis(pressure,'pressure'),windSpeed:stationFieldSourcesFromAnalysis(windSpeed,'windSpeed'),windDirection:stationFieldSourcesFromAnalysis(windDirection,'windDirection'),windGust:stationFieldSourcesFromAnalysis(gust,'windGust'),visibility:stationFieldSourcesFromAnalysis(visibility,'visibility'),cloudCover:stationFieldSourcesFromAnalysis(cloudCover,'cloudCover'),ceilingHft:stationFieldSourcesFromAnalysis(ceiling,'ceilingHft'),cloudBaseHft:stationFieldSourcesFromAnalysis(cloudBase,'cloudBaseHft'),precipitation:stationFieldSourcesFromAnalysis(precipitation,'precipitation')};
 const method={analysisMethod:morphology?'Modellgestützte lokale Restfeldanalyse · strömungsrichtungsabhängige DEM-/Oberflächenexposition':'Modellgestützte lokale Restfeldanalyse'};
 if(thermalRegime.active)method.analysisMethod=morphology?'Modellgestützte lokale Restfeldanalyse · stabile Nacht thermisch lokalisiert · strömungsrichtungsabhängige DEM-/Oberflächenexposition':'Modellgestützte lokale Restfeldanalyse · stabile Nacht thermisch lokalisiert';
 if(temperatureConstraint.applied)method.analysisMethod+=' · direkter Temperatur-Messkonsens begrenzt rückgeführt';
 const analysisMethod=method.analysisMethod;
 return{name:`Hyperlokale Analyse aus ${Math.max(1,stationCount)} Messpunkten`,provider:'MID Hyperlokalanalyse',stationId:accepted.map(x=>x.stationId).filter(Boolean).slice(0,6).join(','),latitude:lat,longitude:lon,distance:weightedDistance,height:elevation,timestamp:latest,temperature:thermo.temperature,humidity:thermo.humidity,dewPoint:thermo.dewPoint,pressure:pressure.value,pressureReference:pressure.value===undefined?undefined:'QFF',windSpeed:windPair?.wind??windExposure.value,windDirection:windDirection.value??direct?.windDirection??target.windDirection,windGust:windPair?.gust??gustExposure.value,windUnit:'kt',visibility:visibility.value===undefined?direct?.visibility:clampNumber(visibility.value,50,100000),cloudCover:cloudReconciliation.value,cloudAnalysisMethod:cloudReconciliation.method,ceilingHft:ceiling.value===undefined?direct?.ceilingHft:clampNumber(ceiling.value,0,500),cloudBaseHft:cloudBase.value===undefined?direct?.cloudBaseHft:clampNumber(cloudBase.value,0,500),precipitation:precipitation.value===undefined?normalisePrecipitationAccumulation(direct?.precipitation,precipitationIntervalMinutes(direct?.provider,direct?.networkClass,direct?.precipitationMinutes),60):Math.max(0,precipitation.value),precipitationMinutes:60,stationCount:Math.max(1,stationCount),sourceProviders:providers,fieldSources,blended:true,temperatureSpread:thermalUncertainty,trustFactor:Math.min(99,75+accepted.length*3),networkClass:'professional',siteClass:urban,analysisMethod,uncertainty:thermalUncertainty,effectiveResolutionKm,candidateCount:ranked.length,rejectedCount:Math.max(0,ranked.length-accepted.length),localCorrection:temp.correction,temperatureResidualCorrection:tempResidual.correction,temperatureObservationConstraint:temperatureConstraint.applied?temperatureConstraint.correction:0,temperatureDirectEstimate:temperatureConstraint.estimate,temperatureObservationSupport:temperatureConstraint.strength,temperatureObservationSpreadK:temperatureConstraint.spreadK,temperatureStationCount:Math.max(0,temperatureStationCount),temperatureEffectiveResolutionKm,backgroundModel:backgroundSet.modelLabel,urbanClass:urban,terrainSlopeDeg:morphology?.target?.slopeDeg,terrainAspectDeg:morphology?.target?.aspectDeg,terrainReliefM:morphology?.target?.reliefM,terrainPositionIndexM:morphology?.target?.positionIndexM,surfaceClass:morphology?.surface?.surfaceClass,roughnessLengthM:morphology?.surface?.roughnessLengthM,imperviousnessPercent:Number.isFinite(Number(morphology?.surface?.imperviousnessPercent))?Number(morphology?.surface?.imperviousnessPercent):undefined,localContextSource:[backgroundSet.modelLabel,morphology?.target?'Copernicus DEM GLO-90 · 8-Sektor-Exposition':undefined,morphology?.surface?.source,thermalRegime.active?'stabile Nacht: thermische Nahbereichsgewichtung':undefined,temperatureConstraint.applied?'direkter Temperatur-Messkonsens: räumlicher Modellgradient begrenzt korrigiert':undefined].filter(Boolean).join(' + ')||backgroundSet.modelLabel,terrainWindExposure:morphology?.target&&Number.isFinite(Number(morphology.targetWindDirection))?directionalTerrainExposure(morphology.target,morphology.targetWindDirection):undefined,terrainWindDirection:Number.isFinite(Number(morphology?.targetWindDirection))?Number(morphology?.targetWindDirection):undefined,terrainWindCorrectionPercent:Number.isFinite(Number(windExposure.factor))?Math.round((windExposure.factor-1)*1000)/10:undefined,thermalRegime:thermalRegime.active?'stable-night':undefined,thermalObservationSpreadK:thermalRegime.active?thermalRegime.observationSpreadK:undefined,thermalResidualSpreadK:thermalRegime.active?thermalRegime.residualSpreadK:undefined,thermalLocalizationKm:thermalRegime.active?thermalRegime.localizationKm:undefined,thermalWindKt:thermalRegime.active?thermalRegime.windKt:undefined,thermalCloudCover:thermalRegime.active?thermalRegime.cloudCover:undefined}
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
function metarCloudObservation(row:any):CloudObservation|undefined{
 const raw=[row?.rawOb,row?.raw_text,row?.rawText,row?.metar].filter(value=>typeof value==='string').join(' ').toUpperCase();
 if(/\bCAVOK\b/.test(raw))return'cavok';
 const covers=metarCloudLayers(row).map(metarLayerCover).filter(Boolean);
 if(covers.some(code=>['BKN','OVC','VV','FEW','SCT'].includes(code)))return'layers';
 if(covers.some(code=>['SKC','CLR','NSC','NCD'].includes(code))||/\b(SKC|CLR|NSC|NCD)\b/.test(raw))return'clear';
 return undefined;
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
 const rawFieldResolution=r.fieldTemporalResolutionMinutes&&typeof r.fieldTemporalResolutionMinutes==='object'?r.fieldTemporalResolutionMinutes:{},rawFieldObservedAt=r.fieldObservedAt&&typeof r.fieldObservedAt==='object'?r.fieldObservedAt:{},station:Station={name:r.name||r.site||r.station||r.icaoId||r.stationId||'WMO/PWS-Station',provider:r.provider||'METAR / WMO',stationId:r.icaoId||r.wmoId||r.stationId||r.id,latitude:rlat,longitude:rlon,distance,height:Number.isFinite(height as number)?height:undefined,timestamp:normalizeStationTimestamp(r.reportTime??r.obsTime??r.timestamp),temperature,dewPoint,humidity,pressure,pressureReference,windSpeed:windSpeedRaw===undefined?undefined:windUnit==='kmh'?windSpeedRaw/1.852:windSpeedRaw,windDirection:num(r.wdir??r.windDirection),windGust:windGustRaw===undefined?undefined:windUnit==='kmh'?windGustRaw/1.852:windGustRaw,windUnit:'kt',visibility:metarVisibilityMeters(r),cloudCover:metarCloudCover(r),cloudObservation:metarCloudObservation(r),ceilingHft:metarCeilingHft(r),cloudBaseHft:metarCloudBaseHft(r),precipitation:num(r.precipitation??r.precipTotal),precipitationMinutes:num(r.precipitationMinutes??r.precipitation_minutes??r.precipitationIntervalMinutes??r.precipitation_interval_minutes),temporalResolutionMinutes:num(r.temporalResolutionMinutes??r.temporal_resolution_minutes),fieldTemporalResolutionMinutes:rawFieldResolution,fieldObservedAt:rawFieldObservedAt,trustFactor:num(r.trustFactor),networkClass:r.networkClass,sourceType:r.sourceType,qcLabel:r.qcLabel,siteClass:r.siteClass};const generated=stationFieldSourcesForCandidates([{s:station,w:1}]);for(const [field,rows] of Object.entries(generated) as [StationAnalysisField,StationFieldSource[]][]){const observedAt=normalizeStationTimestamp(rawFieldObservedAt[field])??station.timestamp,resolution=num(rawFieldResolution[field])??station.temporalResolutionMinutes;generated[field]=rows.map(row=>({...row,observedAt,temporalResolutionMinutes:resolution}))}const supplied=r.fieldSources&&typeof r.fieldSources==='object'?r.fieldSources:{};station.fieldSources={...generated,...supplied};return station;
}

function parseMetarStations(rows:any[],lat:number,lon:number){return rows.map(r=>rowToStation(r,lat,lon)).filter(Boolean) as Station[]}
function awcMetarBbox(lat:number,lon:number,radiusKm:number){const dLat=radiusKm/111,dLon=radiusKm/(111*Math.max(.25,Math.cos(lat*Math.PI/180)));return[Math.max(-89.9,lat-dLat),Math.max(-180,lon-dLon),Math.min(89.9,lat+dLat),Math.min(180,lon+dLon)].map(x=>x.toFixed(3)).join(',')}
async function metarStations(lat:number,lon:number,radiusKm=140,signal?:AbortSignal,fast=false,country=''):Promise<Station[]>{
 const bbox=awcMetarBbox(lat,lon,radiusKm);
 if(workerBaseCandidates('metar').length){try{const data=await fetchWorkerJson<any>('',{lat,lon,radius_km:radiusKm,fast:fast?1:0,country:countryCodeFromLocation(country)||country},{purpose:'metar',signal,timeoutMs:fast?6000:10000,maxAgeMs:fast?180000:300000,staleIfErrorMs:fast?600000:1200000,cacheKey:`stations:${lat.toFixed(3)}:${lon.toFixed(3)}:${radiusKm}:${fast?1:0}:${countryCodeFromLocation(country)||country}`}),stations=parseMetarStations(parseMetarRows(data),lat,lon);if(stations.length)return stations}catch{}}
 try{const data=await j<any>(`https://aviationweather.gov/api/data/metar?format=json&hours=3&bbox=${encodeURIComponent(bbox)}`,signal);return parseMetarStations(parseMetarRows(data),lat,lon)}catch{return[]}
}
async function stationUncached(lat:number,lon:number,country?:string,elevation?:number,context?:Location,signal?:AbortSignal,fast=false):Promise<Station|null>{
 const c=countryCodeFromLocation(country),inGermany=c==='DE'||(!c&&lat>=47.2&&lat<=55.2&&lon>=5.5&&lon<=15.6),metarRadiusKm=inGermany?140:220,workerStationsAvailable=workerBaseCandidates('metar').length>0,metarTask=fast?metarStations(lat,lon,metarRadiusKm,signal,true,c):metarStations(lat,lon,metarRadiusKm,signal,false,c),tasks:Promise<Station[]|Station|null>[]=[metarTask];
 if(!workerStationsAvailable&&geoSphereApplies(lat,lon,c))tasks.push(geoSphereStation(lat,lon,elevation,signal));
 if(!workerStationsAvailable&&inGermany)tasks.push(brightSkyStation(lat,lon,elevation,signal));
 const settled=await Promise.allSettled(tasks);let results=settled.filter((x):x is PromiseFulfilledResult<Station[]|Station|null>=>x.status==='fulfilled').flatMap(x=>Array.isArray(x.value)?x.value:x.value?[x.value]:[]);
 if(workerStationsAvailable){const fallbacks:Promise<Station|null>[]=[];if(geoSphereApplies(lat,lon,c)&&!results.some(item=>/geosphere/i.test(String(item.provider||''))))fallbacks.push(geoSphereStation(lat,lon,elevation,signal));if(inGermany&&!results.some(item=>/dwd synop|dwd open data|bright sky/i.test(String(item.provider||''))))fallbacks.push(brightSkyStation(lat,lon,elevation,signal));if(fallbacks.length){const extra=await Promise.allSettled(fallbacks);results=[...results,...extra.filter((item):item is PromiseFulfilledResult<Station|null>=>item.status==='fulfilled').flatMap(item=>item.value?[item.value]:[])]}}
 if(!results.length)return null;
 const nonCitizen=results.filter(item=>!isCitizenNetwork(item.provider)),direct=robustBlendStations(nonCitizen.length?results:results.length>=3?results:[],elevation)??nonCitizen[0]??results[0]??null;
 // Der schnelle Startpfad liefert ausschließlich aktuelle Beobachtungen/Stationsmittel.
 // Modellhintergrund, Gelände- und Oberflächenanalyse folgen erst im Full-Pass, damit
 // der sichtbare Current-Bereich sofort reagiert ohne parallel zur Kernprognose
 // zusätzliche Open-Meteo-Modellabrufe auszulösen.
 if(fast)return direct;
 const analysed=await hyperlocalAnalysis(results,lat,lon,elevation,context,signal,false),geoSphereQff=c==='AT'?results.find(item=>item.provider?.includes('GeoSphere')&&plausibleQff(item.pressure,item.height)&&(item.pressureReference==='QFF'||item.pressureReference==='MSL')):undefined;if(analysed&&geoSphereQff&&analysed.pressure===undefined)return{...analysed,pressure:geoSphereQff.pressure,pressureReference:'QFF'};
 return analysed??direct;
}

const stationAnalysisCache=new Map<string,{at:number;value:Station}>();
function stationAnalysisCacheKey(lat:number,lon:number,country:string|undefined,elevation:number|undefined,context:Location|undefined,fast:boolean){return`${lat.toFixed(3)}:${lon.toFixed(3)}:${countryCodeFromLocation(country)||String(country||'')}:${Number.isFinite(elevation)?Math.round(Number(elevation)/10)*10:'x'}:${contextUrbanClass(context)}:${fast?1:0}`}
export async function station(lat:number,lon:number,country?:string,elevation?:number,context?:Location,signal?:AbortSignal,fast=false):Promise<Station|null>{
 if(signal?.aborted)throw signal.reason??new DOMException('Vorgang abgebrochen.','AbortError');
 const key=stationAnalysisCacheKey(lat,lon,country,elevation,context,fast),cached=stationAnalysisCache.get(key),freshMs=fast?4*60000:6*60000,age=cached?Date.now()-cached.at:Infinity;
 if(cached&&age<=freshMs)return cached.value;
 const value=await stationUncached(lat,lon,country,elevation,context,signal,fast).catch(error=>{if(signal?.aborted)throw error;return null});
 if(value){stationAnalysisCache.set(key,{at:Date.now(),value});if(stationAnalysisCache.size>18){const remove=[...stationAnalysisCache.entries()].sort((a,b)=>a[1].at-b[1].at).slice(0,stationAnalysisCache.size-18);for(const[item]of remove)stationAnalysisCache.delete(item)}return value}
 if(cached&&age<=20*60000)return{...cached.value,staleFallback:true,cacheAgeMinutes:Math.round(age/60000),analysisMethod:`${cached.value.analysisMethod||'Stationsanalyse'} · letzter belastbarer Stand`};
 return null;
}

export async function officialWarnings(lat:number,lon:number,country?:string,name?:string,region?:string,district?:string,signal?:AbortSignal):Promise<{alerts:OfficialAlert[];provider?:string;coverage?:string}> {
 const result=await fetchWorkerJson<{alerts?:OfficialAlert[];provider?:string;coverage?:string;error?:string}>('alerts',{lat,lon,country:countryCodeFromLocation(country)||String(country||''),language:'de',name,region,district},{purpose:'alerts',signal,timeoutMs:12000,maxAgeMs:180000,staleIfErrorMs:1800000,cacheKey:`alerts:${lat.toFixed(3)}:${lon.toFixed(3)}:${countryCodeFromLocation(country)||String(country||'')}:${String(name||'').toLowerCase()}:${String(region||'').toLowerCase()}:${String(district||'').toLowerCase()}`});
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
async function requestRadarStage(params:{lat:number;lon:number;country:string;_ts:number},stage:'dwd'|'rainviewer',signal?:AbortSignal,fast=false){
 try{return await fetchWorkerJson<RadarNowcast&{error?:string}>('radar-nowcast',{...params,stage,fast:fast?1:0},{purpose:'radar',signal,timeoutMs:stage==='dwd'?(fast?8000:14000):16000})}
 catch(firstError){abortError(signal);await radarRetryDelay(signal);try{return await fetchWorkerJson<RadarNowcast&{error?:string}>('radar-nowcast',{...params,stage,fast:fast?1:0,_ts:Date.now()},{purpose:'radar',signal,timeoutMs:stage==='dwd'?(fast?11000:18000):20000})}catch(secondError){abortError(signal);void firstError;void secondError;return null}}
}


export async function thunderstormNowcast(lat:number,lon:number,country?:string,signal?:AbortSignal):Promise<ThunderstormNowcast|null>{
 if(!workerBaseCandidates('radar').length)return null;
 return fetchWorkerJson<ThunderstormNowcast>('thunderstorm-nowcast',{lat,lon,country:countryCodeFromLocation(country)||String(country||''),_ts:Date.now()},{purpose:'radar',signal,timeoutMs:15000,maxAgeMs:45000,staleIfErrorMs:120000,cacheKey:`thunder:${lat.toFixed(3)}:${lon.toFixed(3)}:${countryCodeFromLocation(country)||String(country||'')}`});
}


function radarHasDirectSiteHit(radar:RadarNowcast){const threshold=Number(radar.siteEchoThreshold)||.05;return Number(radar.currentRate||0)>=threshold||(radar.siteIntervals?.length??0)>0||(radar.nowcastSeries??[]).some(frame=>Number(frame.rate||0)>=threshold)}
function mergeDwdOperaNowcast(dwd:RadarNowcast,opera:RadarNowcast):RadarNowcast{
 const dwdProbability=Math.max(0,Math.min(100,Number(dwd.radarProbability)||0)),operaProbability=Math.max(0,Math.min(100,Number(opera.radarProbability)||0)),direct=radarHasDirectSiteHit(dwd),operaWeight=direct?(dwd.quality==='high'?.12:dwd.quality==='medium'?.18:.24):.08,blended=Math.round(dwdProbability*(1-operaWeight)+operaProbability*operaWeight),radarProbability=direct?Math.max(dwdProbability,blended):Math.min(45,Math.max(dwdProbability,blended)),discrepancy=Math.abs(dwdProbability-operaProbability),quality:RadarNowcastQuality=discrepancy>=55&&dwd.quality==='high'?'medium':dwd.quality;
 return{...dwd,quality,radarProbability,motionDirectionDeg:Number.isFinite(Number(dwd.motionDirectionDeg))?dwd.motionDirectionDeg:opera.motionDirectionDeg,motionSpeedKmh:Number.isFinite(Number(dwd.motionSpeedKmh))?dwd.motionSpeedKmh:opera.motionSpeedKmh,motionConfidence:dwd.motionConfidence??opera.motionConfidence,motionSource:dwd.motionSource??opera.motionSource,motionAnchors:dwd.motionAnchors?.length?dwd.motionAnchors:opera.motionAnchors,provider:`${dwd.provider} · OPERA CIRRUS-Kontrollabgleich`,license:[dwd.license,'EUMETNET OPERA composite products, CC BY 4.0'].filter(Boolean).join(' · '),diagnostics:{...(dwd.diagnostics||{}),operaCrossCheck:{available:true,role:'räumlicher Kontrollabgleich; kein Ersatz für den DWD-Standortpunkt',provider:opera.provider,probability:operaProbability,currentRate:opera.currentRate,peakRate:opera.peakRate,observedAt:opera.observedAt,quality:opera.quality,summary:opera.summary,weight:operaWeight,discrepancy}}};
}
type RadolanCurrentMeta={error?:string;coverage?:boolean;observedAt?:string;frames?:{time:string;fileUrl:string}[]};
async function nativeRadolanCurrentPoint(lat:number,lon:number,signal?:AbortSignal){
 try{const meta=await fetchWorkerJson<RadolanCurrentMeta>('radolan-yw-meta',{lat,lon,_ts:Date.now()},{purpose:'radar',signal,timeoutMs:16000,maxAgeMs:90000,staleIfErrorMs:600000}),frame=meta.frames?.at(-1);if(!meta.coverage||!frame)return null;const sample=await loadAndSampleRadolan(frame.fileUrl,lat,lon,signal),observed=Date.parse(frame.time);if(!sample.covered||!Number.isFinite(observed)||Math.abs(Date.now()-observed)>35*60000)return null;return{time:frame.time,rate:Number((sample.amountMm*12).toFixed(3)),nearbyRate:Number((sample.nearbyAmountMm*12).toFixed(3)),nearestWetKm:sample.nearestWetKm,provider:'DWD RADOLAN YW · nativer 1-km-Standortpunkt'}}catch(error){abortError(signal);void error;return null}
}
async function nativeRainStationCalibration(lat:number,lon:number,signal?:AbortSignal):Promise<RadarRainStationCalibration|null>{
 try{return await fetchWorkerJson<RadarRainStationCalibration>('dwd-rain-station',{lat,lon,country:'DE',_ts:Date.now()},{purpose:'radar',signal,timeoutMs:11000,maxAgeMs:180000,staleIfErrorMs:600000,cacheKey:`radar-rain-station:${lat.toFixed(3)}:${lon.toFixed(3)}`})}catch(error){abortError(signal);void error;return null}
}
function applyNativeObservation(radar:RadarNowcast,observation:Awaited<ReturnType<typeof nativeRadolanCurrentPoint>>){
 if(!observation)return radar;const threshold=Number(radar.siteEchoThreshold)||.05,series=[...(radar.nowcastSeries??[])],observedIndex=series.reduce((best,frame,index)=>!frame.future&&Date.parse(frame.time)<=Date.parse(observation.time)+3*60000?index:best,-1),nativeFrame:RadarNowcastFrame={time:observation.time,rate:observation.rate,nearbyRate:observation.nearbyRate,nearestWetKm:observation.nearestWetKm,hitClass:observation.rate>=threshold?'site':observation.nearbyRate>=(Number(radar.nearbyEchoThreshold)||.18)?'nearby':'dry',future:false};if(observedIndex>=0)series[observedIndex]=nativeFrame;else series.push(nativeFrame);series.sort((a,b)=>Date.parse(a.time)-Date.parse(b.time));const direct=observation.rate>=threshold,probability=direct?Math.max(Number(radar.radarProbability)||0,92):Math.min(Number(radar.radarProbability)||0,radarHasDirectSiteHit(radar)?96:45);return{...radar,currentRate:observation.rate,rawCurrentRate:observation.rate,observedAt:observation.time,observationProvider:observation.provider,nearestWetKm:observation.nearestWetKm,radarProbability:probability,nowcastSeries:series,diagnostics:{...(radar.diagnostics||{}),nativeObservation:{provider:observation.provider,rate:observation.rate,nearbyRate:observation.nearbyRate,nearestWetKm:observation.nearestWetKm}}}
}
async function operaNowcast(lat:number,lon:number,signal?:AbortSignal){
 if(!operaRadarApplies(lat,lon))return null;
 try{const metadata=await loadOperaRaster(lat,lon,signal);return normaliseRadarNowcast(await analyseOperaRasterNowcast(metadata.frames??[],lat,lon,signal))}catch(error){abortError(signal);void error;return null}
}

export async function radarNowcast(lat:number,lon:number,country?:string,signal?:AbortSignal,fast=false):Promise<RadarNowcast|null>{
 if(!workerBaseCandidates('radar').length)return null;
 const countryCode=countryCodeFromLocation(country),params={lat,lon,country:countryCode||String(country||''),_ts:Date.now()},dwdExpected=dwdRadarExpected(lat,lon,countryCode),operaExpected=operaRadarApplies(lat,lon);
 if(fast&&dwdExpected){const dwdResult=normaliseRadarNowcast(await requestRadarStage(params,'dwd',signal,true));if(dwdResult?.source==='dwd')return dwdResult}
 const[dwdSettled,operaSettled,nativeSettled,rsSettled,stationSettled]=await Promise.allSettled([dwdExpected?requestRadarStage(params,'dwd',signal,false):Promise.resolve(null),operaExpected?operaNowcast(lat,lon,signal):Promise.resolve(null),dwdExpected?nativeRadolanCurrentPoint(lat,lon,signal):Promise.resolve(null),dwdExpected?loadDwdRsCalibration(lat,lon,signal):Promise.resolve(null),dwdExpected?nativeRainStationCalibration(lat,lon,signal):Promise.resolve(null)]);abortError(signal);
 let dwdResult=dwdSettled.status==='fulfilled'?normaliseRadarNowcast(dwdSettled.value):null;const operaResult=operaSettled.status==='fulfilled'?operaSettled.value:null,native=nativeSettled.status==='fulfilled'?nativeSettled.value:null,rs=rsSettled.status==='fulfilled'?rsSettled.value:null,station=stationSettled.status==='fulfilled'?stationSettled.value:null;
 if(dwdResult?.source==='dwd'){let calibrated=applyNativeObservation(dwdResult,native);let hx=null;if(needsHxBoundaryCheck(calibrated)){try{hx=await loadHxBoundaryCheck(lat,lon,Number(calibrated.siteEchoThreshold)||.05,signal)}catch(error){abortError(signal);void error}}calibrated=finalizeRadarNowcastCalibration(calibrated,{rs,hx,station});return operaResult?.source==='opera'?mergeDwdOperaNowcast(calibrated,operaResult):calibrated}
 if(operaResult?.source==='opera')return operaResult;
 const fallback=normaliseRadarNowcast(await requestRadarStage({...params,_ts:Date.now()},'rainviewer',signal,false));return fallback?.source==='opera'?null:fallback;
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


export function validateWindPair(wind:number,gust:number){
 // Open-Meteo Best Match can occasionally deliver wind_gusts_10m below wind_speed_10m
 // because wind and gust are independent model parameters and may be interpolated or
 // combined differently. Preserve the wind value and reconcile only the same timestamp's
 // gust; this is a pointwise plausibility fallback, not temporal smoothing.
 const base=Number.isFinite(wind)?Math.max(0,Number(wind)):0;
 const gustValue=Number.isFinite(gust)?Math.max(0,Number(gust)):Number.NaN;
 const adjusted=!Number.isFinite(gustValue)||gustValue<base;
 return{wind:base,gust:adjusted?base:gustValue,adjusted};
}

export function dayEffectiveUvMax(day:Day,hours:Hour[]){
 const vals=(hours??[]).map(x=>x.uvIndex).filter(v=>Number.isFinite(v));
 return vals.length?Math.max(...vals):(Number.isFinite(day.uvMax)?Number(day.uvMax):0);
}
export function coreForecastSourceLabel(_w:Weather){return'Open-Meteo Best Match'}
/** Legacy helper kept for compatibility with older consumers; the core forecast no longer enters provider-fallback display mode. */
export function coreForecastUsesIndependentFallback(_w:Weather){return false}
export function mapHours(w:Weather):Hour[]{return (w.hourly.time as string[]).map((time,i)=>{
 const epoch=localIsoEpoch(time,w.timezone,Number(w.utc_offset_seconds)||0),providerIsDay=n(w.hourly.is_day[i],0)===1,solarWindow=solarDaylightWindowAt(epoch,{latitude:w.latitude,longitude:w.longitude,elevation:w.elevation,timezone:w.timezone}),sunriseEpoch=solarWindow.sunrise?.getTime(),sunsetEpoch=solarWindow.sunset?.getTime(),isDay=astronomicalIsDayAt(epoch,{latitude:w.latitude,longitude:w.longitude,elevation:w.elevation,timezone:w.timezone},providerIsDay),rawCode=n(w.hourly.weather_code[i],3),cloud=n(w.hourly.cloud_cover[i],0),lowCloud=n(w.hourly.cloud_cover_low?.[i],NaN),midCloud=n(w.hourly.cloud_cover_mid?.[i],NaN),highCloud=n(w.hourly.cloud_cover_high?.[i],NaN),uvIndex=n(w.hourly.uv_index[i],NaN),humidity=n(w.hourly.relative_humidity_2m[i]),cape=n(w.hourly.cape?.[i],0),liftedIndex=n(w.hourly.lifted_index?.[i],NaN),convectiveInhibition=n(w.hourly.convective_inhibition?.[i],NaN),sunshineDuration=n(w.hourly.sunshine_duration?.[i],NaN),rawProbability=n(w.hourly.precipitation_probability[i],0),windPair=validateWindPair(n(w.hourly.wind_speed_10m[i],0),n(w.hourly.wind_gusts_10m[i],0));
 const precipitationSignal=reconcileForecastPrecipitation({precipitation:n(w.hourly.precipitation[i],0),rain:n(w.hourly.rain[i],0),showers:n(w.hourly.showers[i],0),snowfall:n(w.hourly.snowfall[i],0),probability:rawProbability,code:rawCode,cloud,lowCloud,humidity,cape,liftedIndex,convectiveInhibition,sunshineDuration,isDay,leadHours:(epoch-Date.now())/3600000});
 return{time,epoch,timezone:w.timezone,temperature:n(w.hourly.temperature_2m[i]),apparent:n(w.hourly.apparent_temperature[i]),humidity,dewPoint:n(w.hourly.dew_point_2m[i]),pressure:n(w.hourly.pressure_msl?.[i],NaN),precipitation:precipitationSignal.precipitation,rain:precipitationSignal.rain,showers:precipitationSignal.showers,snowfall:precipitationSignal.snowfall,probability:precipitationSignal.probability,code:precipitationSignal.code,wind:windPair.wind,gust:windPair.gust,gustAdjusted:windPair.adjusted,direction:n(w.hourly.wind_direction_10m[i],0),cloud,lowCloud,midCloud,highCloud,uvIndex:Number.isFinite(uvIndex)&&isDay?altitudeCorrectedUvi(uvIndex,w.elevation):0,visibility:n(w.hourly.visibility?.[i],NaN),cape,liftedIndex,convectiveInhibition,columnWaterVapour:n(w.hourly.total_column_integrated_water_vapour?.[i],NaN),sunshineDuration,weatherSourceId:'best_match',weatherSourceLabel:'Open-Meteo Best Match',weatherBundleKind:'best-match' as const,sunriseEpoch:Number.isFinite(sunriseEpoch)?Number(sunriseEpoch):undefined,sunsetEpoch:Number.isFinite(sunsetEpoch)?Number(sunsetEpoch):undefined,isDay};
 }).filter(x=>Number.isFinite(x.temperature))}
export function mapMinutely15(w:Weather):Minute15[]{const m=w.minutely_15;if(!m?.time)return[];return (m.time as string[]).map((time,i)=>{const epoch=localIsoEpoch(time,w.timezone,Number(w.utc_offset_seconds)||0),providerIsDay=(()=>{const hours=(w.hourly.time??[]) as string[],index=hours.indexOf(`${time.slice(0,13)}:00`);return index>=0?n(w.hourly.is_day?.[index],0)===1:false})(),solarWindow=solarDaylightWindowAt(epoch,{latitude:w.latitude,longitude:w.longitude,elevation:w.elevation,timezone:w.timezone}),sunriseEpoch=solarWindow.sunrise?.getTime(),sunsetEpoch=solarWindow.sunset?.getTime(),isDay=astronomicalIsDayAt(epoch,{latitude:w.latitude,longitude:w.longitude,elevation:w.elevation,timezone:w.timezone},providerIsDay),precipitationSignal=reconcileForecastPrecipitation({precipitation:n(m.precipitation?.[i],0),rain:n(m.rain?.[i],0),showers:n(m.showers?.[i],0),snowfall:n(m.snowfall?.[i],0),probability:n(m.precipitation_probability?.[i],0),code:n(m.weather_code?.[i],0),isDay,leadHours:(epoch-Date.now())/3600000});return{time,epoch,timezone:w.timezone,precipitation:precipitationSignal.precipitation,rain:precipitationSignal.rain,showers:precipitationSignal.showers,snowfall:precipitationSignal.snowfall,probability:precipitationSignal.probability,code:precipitationSignal.code,sunriseEpoch:Number.isFinite(sunriseEpoch)?Number(sunriseEpoch):undefined,sunsetEpoch:Number.isFinite(sunsetEpoch)?Number(sunsetEpoch):undefined,isDay}})}
export type RecentSunshineDuration={seconds:number;coverageMinutes:number;intervalMinutes:number;source:'minutely_15'|'current'|'hourly';plausibilityAdjusted:boolean};
export function recentSunshineDuration(w:Weather,options:{localCloudCover?:number;currentCloudCover?:number;isDay?:boolean}={}):RecentSunshineDuration{
 const offset=Number(w.utc_offset_seconds)||0,currentEpoch=localIsoEpoch(String(w.current?.time??''),w.timezone,offset),m=w.minutely_15,times=(m?.time??[]) as string[],values=(m?.sunshine_duration??[]) as (number|string|null)[];
 if(Number.isFinite(currentEpoch)&&times.length&&values.length){
  const rows=times.map((time,index)=>({index,epoch:localIsoEpoch(String(time),w.timezone,offset),value:n(values[index],NaN)})).filter(row=>Number.isFinite(row.epoch)&&Number.isFinite(row.value)&&row.epoch<=currentEpoch+1000&&row.epoch>currentEpoch-60*60000-1000).sort((a,b)=>a.epoch-b.epoch);
  if(rows.length>=3){
   const gaps=rows.slice(1).map((row,index)=>(row.epoch-rows[index].epoch)/60000).filter(value=>Number.isFinite(value)&&value>0),intervalMinutes=gaps.length?Math.max(1,Math.round(gaps.reduce((sum,value)=>sum+value,0)/gaps.length)):15,intervalCount=Math.max(1,Math.floor(60/intervalMinutes)),selectedRows=rows.slice(-intervalCount),latest=selectedRows[selectedRows.length-1],intervalSeconds=intervalMinutes*60;let seconds=selectedRows.reduce((sum,row)=>sum+Math.min(intervalSeconds,Math.max(0,row.value)),0),adjusted=false;
   const localCloud=Number(options.localCloudCover),modelCloud=Number(options.currentCloudCover),isDay=options.isDay!==false;
   if(isDay&&Number.isFinite(localCloud)&&Number.isFinite(modelCloud)&&localCloud>=87.5&&modelCloud>=80){const cap=Math.min(intervalSeconds,localCloud>=95?120:300),original=Math.min(intervalSeconds,Math.max(0,latest.value)),limited=Math.min(original,cap);if(limited<original){seconds-=original-limited;adjusted=true}}
   const coverageMinutes=Math.min(60,selectedRows.length*intervalMinutes);return{seconds:Math.min(coverageMinutes*60,Math.max(0,seconds)),coverageMinutes,intervalMinutes,source:'minutely_15',plausibilityAdjusted:adjusted};
  }
 }
 const currentValue=n(w.current?.sunshine_duration,NaN),currentInterval=Math.max(60,n(w.current?.interval,900));
 if(Number.isFinite(currentValue)){const coverageMinutes=Math.max(1,Math.round(currentInterval/60));return{seconds:Math.min(coverageMinutes*60,Math.max(0,currentValue)),coverageMinutes,intervalMinutes:coverageMinutes,source:'current',plausibilityAdjusted:false}}
 const hourlyTimes=(w.hourly?.time??[]) as string[],hourlyValues=(w.hourly?.sunshine_duration??[]) as (number|string|null)[];
 if(Number.isFinite(currentEpoch)&&hourlyTimes.length&&hourlyValues.length){let best=-1,bestEpoch=-Infinity;for(let i=0;i<hourlyTimes.length;i++){const epoch=localIsoEpoch(String(hourlyTimes[i]),w.timezone,offset),value=n(hourlyValues[i],NaN);if(Number.isFinite(epoch)&&Number.isFinite(value)&&epoch<=currentEpoch&&epoch>bestEpoch){best=i;bestEpoch=epoch}}if(best>=0)return{seconds:Math.min(3600,Math.max(0,n(hourlyValues[best],0))),coverageMinutes:60,intervalMinutes:60,source:'hourly',plausibilityAdjusted:false}}
 return{seconds:NaN,coverageMinutes:0,intervalMinutes:0,source:'current',plausibilityAdjusted:false};
}
export function mapDays(w:Weather):Day[]{return (w.daily.time as string[]).map((date,i)=>{
 const windPair=validateWindPair(n(w.daily.wind_speed_10m_max[i],0),n(w.daily.wind_gusts_10m_max[i],0)),leadHours=(localIsoEpoch(`${date}T12:00`,w.timezone,Number(w.utc_offset_seconds)||0)-Date.now())/3600000,rain=n(w.daily.rain_sum?.[i],0),showers=n(w.daily.showers_sum?.[i],0),snowfall=n(w.daily.snowfall_sum?.[i],0),precipitationHours=n(w.daily.precipitation_hours?.[i],0),rawProbability=n(w.daily.precipitation_probability_max[i],0),precipitationSignal=reconcileForecastPrecipitation({precipitation:n(w.daily.precipitation_sum[i],0),rain,showers,snowfall,probability:rawProbability,code:n(w.daily.weather_code[i],3),leadHours});
 return({date,code:precipitationSignal.code,max:n(w.daily.temperature_2m_max[i]),min:n(w.daily.temperature_2m_min[i]),sunrise:String(w.daily.sunrise?.[i]??'')||undefined,sunset:String(w.daily.sunset?.[i]??'')||undefined,sunshineDuration:n(w.daily.sunshine_duration?.[i],0),precipitation:precipitationSignal.precipitation,rain:precipitationSignal.rain,showers:precipitationSignal.showers,snowfall:precipitationSignal.snowfall,precipitationHours,probability:precipitationSignal.probability,probabilitySource:'hourly-max-fallback' as const,wind:windPair.wind,gust:windPair.gust,gustAdjusted:windPair.adjusted,direction:n(w.daily.wind_direction_10m_dominant[i],0),uvMax:altitudeCorrectedUvi(n(w.daily.uv_index_max[i],0),w.elevation),weatherSourceId:'best_match',weatherSourceLabel:'Open-Meteo Best Match'});
 }).filter(d=>Number.isFinite(d.max)&&Number.isFinite(d.min)&&d.max>=d.min)}

export const DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM=.2;
export const DWD_SIGNIFICANT_PRECIPITATION_PROBABILITY_THRESHOLD_MM=5;

/** DWD-nahe Ereigniswahrscheinlichkeit: >0,2 mm und >5,0 mm werden für den ganzen Tag und zusätzlich in vier 6-h-Zeitfenstern geführt.
 * Das Best-Match-Stundenmaximum bleibt ausschließlich als transparenter Fallback und wird nie als Tageswahrscheinlichkeit bezeichnet. */
export function applyEnsembleDailyPrecipitationProbability(days:Day[],ensemble:EnsembleDay[]){
 if(!days.length||!ensemble.length)return days;
 const byDate=new Map(ensemble.map(day=>[day.date,day]));let changed=false;
 const result=days.map(day=>{const row=byDate.get(day.date),probability=Number(row?.precipitationProbability),significant=Number(row?.precipitationProbabilitySignificant),members=Math.max(0,Math.round(Number(row?.memberCount)||0)),windows=(row?.precipitationProbabilityWindows??[]).filter(window=>Number.isFinite(window.probability)&&window.memberCount>=2).map(window=>({...window,probability:Math.max(0,Math.min(100,window.probability)),probabilitySignificant:Math.max(0,Math.min(window.probability,window.probabilitySignificant))}));if(!row||!Number.isFinite(probability)||!Number.isFinite(significant)||members<2)return day;const peakWindow=Math.max(0,...windows.map(window=>window.probability)),peakSignificantWindow=Math.max(0,...windows.map(window=>window.probabilitySignificant)),next=Math.max(peakWindow,Math.max(0,Math.min(100,probability))),nextSignificant=Math.min(next,Math.max(peakSignificantWindow,Math.max(0,Math.min(100,significant)))),sameWindows=JSON.stringify(day.probabilityWindows??[])===JSON.stringify(windows);if(Math.abs(next-day.probability)<.05&&Math.abs(nextSignificant-Number(day.probabilitySignificant))<.05&&sameWindows&&day.probabilitySource==='ensemble-members-dwd'&&day.probabilityMemberCount===members)return day;changed=true;return{...day,probability:next,probabilitySignificant:nextSignificant,probabilityWindows:windows,probabilitySource:'ensemble-members-dwd' as const,probabilityMemberCount:members}});
 return changed?result:days;
}

export function peakDwdPrecipitationProbabilityWindow(windows?:PrecipitationProbabilityWindow[]){return [...(windows??[])].filter(window=>Number.isFinite(window.probability)&&window.memberCount>=2).sort((a,b)=>b.probability-a.probability||a.startHour-b.startHour)[0]}
/** Für kompakte Tagesübersichten wird ein DWD-6-h-Fenster nur dann hervorgehoben, wenn es gegenüber dem Mittel der vier Tagesfenster und dem nächsthöchsten Fenster klar erhöht ist. */
export function elevatedDwdPrecipitationProbabilityWindow(windows?:PrecipitationProbabilityWindow[]){const valid=(windows??[]).filter(window=>Number.isFinite(window.probability)&&window.memberCount>=2);if(valid.length<2)return undefined;const ranked=[...valid].sort((a,b)=>b.probability-a.probability||a.startHour-b.startHour),values=valid.map(window=>Math.round(Math.max(0,Math.min(100,window.probability)))),highest=Math.round(Math.max(0,Math.min(100,ranked[0].probability))),second=Math.round(Math.max(0,Math.min(100,ranked[1].probability))),dailyWindowMean=values.reduce((sum,value)=>sum+value,0)/Math.max(1,values.length);return highest>0&&highest-second>=10&&highest-dailyWindowMean>=15?ranked[0]:undefined}
function precipitationProbabilityWindowLabel(window:PrecipitationProbabilityWindow){return `${String(window.startHour).padStart(2,'0')}–${String(window.endHour).padStart(2,'0')} h`}
export function precipitationProbabilityWindowCompactLabel(window:PrecipitationProbabilityWindow){return `${String(window.startHour).padStart(2,'0')}–${String(window.endHour).padStart(2,'0')}h`}
export function dwdPrecipitationProbabilityWindowsTitle(windows?:PrecipitationProbabilityWindow[]){return (windows??[]).filter(window=>Number.isFinite(window.probability)&&window.memberCount>=2).map(window=>`${precipitationProbabilityWindowLabel(window)}: >0,2 mm ${Math.round(window.probability)} % / >5 mm ${Math.round(window.probabilitySignificant)} %`).join(' · ')}

type HourlyProbabilityWindow={startHour:number;endHour:number;probability:number};
/** Wenn nur stündliche Best-Match-Wahrscheinlichkeiten vorliegen, wird für die kompakte Darstellung ein klarer 6-h-Schwerpunkt markiert. Das ändert die Semantik nicht: der Prozentwert bleibt ein Stundenmaximum. */
function fallbackHourlyProbabilityWindow(hours:Hour[]){
 const buckets=new Map<number,number>();
 for(const hour of hours){const clock=Number(String(hour.time).slice(11,13)),probability=Math.max(0,Math.min(100,Number(hour.probability)));if(!Number.isFinite(clock)||!Number.isFinite(probability))continue;const bucket=Math.max(0,Math.min(3,Math.floor(clock/6)));buckets.set(bucket,Math.max(buckets.get(bucket)??0,probability))}
 const ranked=[...buckets.entries()].map(([bucket,probability])=>({startHour:bucket*6,endHour:(bucket+1)*6,probability})).sort((a,b)=>b.probability-a.probability||a.startHour-b.startHour);if(ranked.length<2)return undefined;const highest=Math.round(ranked[0].probability),second=Math.round(ranked[1].probability),rest=ranked.slice(1).map(row=>Math.round(row.probability)),restMean=rest.reduce((sum,value)=>sum+value,0)/Math.max(1,rest.length);return highest>0&&highest-second>=15&&highest-restMean>=20?ranked[0]:undefined;
}
function hourlyProbabilityWindowCompactLabel(window:HourlyProbabilityWindow){return `${String(window.startHour).padStart(2,'0')}–${String(window.endHour).padStart(2,'0')}h`}
function hourlyProbabilityWindowLabel(window:HourlyProbabilityWindow){return `${String(window.startHour).padStart(2,'0')}–${String(window.endHour).padStart(2,'0')} h`}

export function dailyPrecipitationProbabilityTitle(day:Pick<Day,'probability'|'probabilitySignificant'|'probabilityWindows'|'probabilitySource'|'probabilityMemberCount'>,hours:Hour[]=[]){
 const primary=Math.round(Math.max(0,Math.min(100,Number(day.probability)||0))),probability=`${primary} %`;
 if(day.probabilitySource==='ensemble-members-dwd'){
  const dailySignificant=Math.round(Math.max(0,Math.min(100,Number(day.probabilitySignificant)||0))),members=Math.max(0,Math.round(Number(day.probabilityMemberCount)||0)),periods=dwdPrecipitationProbabilityWindowsTitle(day.probabilityWindows),elevated=primary>0?elevatedDwdPrecipitationProbabilityWindow(day.probabilityWindows):undefined,period=primary<=0?'':elevated?precipitationProbabilityWindowLabel(elevated):'00–24 h',displayProbability=elevated?Math.round(Math.max(0,Math.min(100,elevated.probability))):primary,displaySignificant=elevated?Math.round(Math.max(0,Math.min(100,elevated.probabilitySignificant))):dailySignificant,dailyReference=elevated?` · Tageswert 00–24 h: >0,2 mm ${primary} % / >5,0 mm ${dailySignificant} %`:'';
  return `DWD-Ereigniswahrscheinlichkeit${period?` · ${period}`:''}: >0,2 mm ${displayProbability} % · >5,0 mm ${displaySignificant} %${dailyReference}${periods?` · 6-h-Zeitfenster: ${periods}`:''}${members?` · ${members} Ensemble-Member`:''}`
 }
 const elevated=primary>0?fallbackHourlyProbabilityWindow(hours):undefined,period=elevated?hourlyProbabilityWindowLabel(elevated):primary>0&&hours.length?'00–24 h':'';
 return `Max. Stundenwahrscheinlichkeit ${probability}${period?` · Zeitraum ${period}`:''} · Fallback: höchste stündliche Best-Match-Wahrscheinlichkeit; der Zeitraum ordnet das Stundenmaximum nur zeitlich ein; keine aus Ensemble-Membern berechnete DWD-Ereigniswahrscheinlichkeit für 6 h oder 00–24 h`;
}

export function dailyPrecipitationProbabilityCompact(day:Pick<Day,'probability'|'probabilityWindows'|'probabilitySource'>,hours:Hour[]=[]){
 const primary=Math.round(Math.max(0,Math.min(100,Number(day.probability)||0)));if(primary<=0)return'0%';const elevated=elevatedDwdPrecipitationProbabilityWindow(day.probabilityWindows);
 if(day.probabilitySource==='ensemble-members-dwd')return elevated?`${precipitationProbabilityWindowCompactLabel(elevated)} · ${Math.round(elevated.probability)}%`:`00–24h · ${primary}%`;
 if(hours.length){const hourlyPeak=fallbackHourlyProbabilityWindow(hours),period=hourlyPeak?hourlyProbabilityWindowCompactLabel(hourlyPeak):'00–24h';return `${period} · max ${primary}%`}
 return `max. Std. ${primary}%`;
}

export function cloudOktas(percent:number){return Math.max(0,Math.min(8,Math.round((Number.isFinite(percent)?percent:0)/12.5)))}
export function cloudOktasText(percent:number){
 const octas=cloudOktas(percent);
 const description=octas===0?'wolkenlos':octas<=2?'gering bewölkt':octas<=4?'aufgelockert bewölkt':octas<=7?'stark bewölkt':'bedeckt';
 return`${octas}/8 · ${description}`;
}
export type DayWeatherCharacter={code:number;label:string;secondary:string;cloudOktas:number;precipitationDominant:boolean};
export function dayWeatherCharacterText(character:DayWeatherCharacter){const secondary=String(character.secondary||'').trim();return secondary?`${character.label}, ${secondary.charAt(0).toLocaleLowerCase('de-DE')}${secondary.slice(1)}`:character.label}
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
function sentenceStartText(value:string){const clean=String(value||'').trim();return clean?`${clean.charAt(0).toLocaleUpperCase('de-DE')}${clean.slice(1)}`:''}
function fitDayLabel(text:string,fallback:string){const clean=text.replace(/\s+/g,' ').trim();return sentenceStartText(clean.length<=DAY_LABEL_MAX?clean:fallback)}
function fitDaySecondary(text:string,fallback:string){const clean=text.replace(/\s+/g,' ').trim();return sentenceStartText(clean.length<=DAY_SECONDARY_MAX?clean:fallback)}
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
function plausiblePrecipFamily(h:Hour){
 const part=precipitationParts(h);
 if(part.type==='drizzle'||part.type==='freezingDrizzle')return'drizzle';
 if(part.type==='rain'||part.type==='freezingRain'||part.type==='sleet')return'rain';
 if(part.type==='snow'||part.type==='snowGrains')return'snow';
 if(part.type==='showers'||part.type==='snowShowers'||part.type==='sleetShowers')return'showers';
 if(part.type==='thunderstorm'||part.type==='thunderstormHail')return'thunder';
 return'none';
}
function plausiblePrecipCode(h:Hour,family:string){
 const part=precipitationParts(h);
 if(part.type!=='none')return part.displayCode;
 return family==='showers'?81:family==='snow'?73:family==='rain'?63:family==='drizzle'?53:part.displayCode;
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
 type FamilyRow={score:number;hours:number;daytimeHours:number;sum:number;snowSum:number;maxProbability:number;probabilitySum:number;probabilitySamples:number;first:number;last:number;codes:Map<number,number>};
 const families=new Map<string,FamilyRow>();
 for(const h of hours){
  let family=plausiblePrecipFamily(h);
  const amount=Math.max(0,h.precipitation||0),snow=Math.max(0,h.snowfall||0),probability=Math.max(0,Math.min(100,h.probability||0));
  if(family==='none')family=h.showers>=.05?'showers':snow>=.05?'snow':h.rain>=.05||amount>=.05?'rain':'none';
  if(family==='none')continue;
  if(probability<20&&amount<.05&&snow<.05)continue;
  const hour=Number(h.time.slice(11,13));
  const dayWeight=h.isDay||hour>=7&&hour<19?1.12:.78;
  const probabilityWeight=.12+probability/100;
  const amountWeight=1+Math.min(2.2,amount*1.4+snow*.18);
  const severity=family==='thunder'?2.4:family==='snow'||family==='showers'?1.25:family==='rain'?1.05:.82;
  const score=dayWeight*probabilityWeight*amountWeight*severity;
  const code=plausiblePrecipCode(h,family);
  const row=families.get(family)??{score:0,hours:0,daytimeHours:0,sum:0,snowSum:0,maxProbability:0,probabilitySum:0,probabilitySamples:0,first:hour,last:hour,codes:new Map<number,number>()};
  row.score+=score;
  if(probability>=30||amount>=.05||snow>=.05){row.hours+=1;if(hour>=6&&hour<20)row.daytimeHours+=1;}
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
 const values=hours.filter(h=>Number(h.time.slice(11,13))>=from&&Number(h.time.slice(11,13))<to);
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
 const text=eventLabel.toLocaleLowerCase('de-DE');
 if(text.includes('schneeregenschauer'))return'Schneeregenschauer';
 if(text.includes('schneeschauer'))return'Schneeschauer';
 if(text.includes('schneeregen'))return'Schneeregen';
 if(text.includes('schneegriesel'))return'Schneegriesel';
 if(text.includes('schneefall'))return'Schnee';
 if(text.includes('gefrierenden sprühregen')||text.includes('gefrierender sprühregen'))return'Gefrierender Sprühregen';
 if(text.includes('gefrierenden regen')||text.includes('gefrierender regen'))return'Gefrierender Regen';
 if(text.includes('regenschauer'))return'Regenschauer';
 if(text.includes('sprühregen'))return'Sprühregen';
 if(family==='showers')return'Schauer';
 if(family==='thunder')return text.includes('hagel')?'Gewitter mit Hagel':'Gewitter';
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
 return plausiblePrecipFamily(h);
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
 const full=naturalPossibleEventText(event,timing),fallback=naturalPossibleEventFallback(event,timing);
 return fitDaySecondary(full,fallback.length<=DAY_SECONDARY_MAX?fallback:`${event} möglich`);
}

export type PrecipitationPeriodAssessment={
 family:'none'|'drizzle'|'rain'|'snow'|'showers'|'thunder';
 amount:number;
 maxProbability:number;
 averageProbability:number;
 durationHours:number;
 possibleDurationHours:number;
 activeIntervals:number;
 possibleIntervals:number;
 dominant:boolean;
 showery:boolean;
 severe:boolean;
 timing:string;
};

type PrecipitationAssessmentSample={epoch:number;durationHours:number;amount:number;snow:number;probability:number;family:PrecipitationPeriodAssessment['family'];precise:boolean;hour?:Hour};
function minutePrecipitationFamily(sample:Minute15):PrecipitationPeriodAssessment['family']{
 const family=precipCodeFamily(Math.round(Number(sample.code)||0));
 if(family!=='none')return family;
 if(Math.max(0,Number(sample.showers)||0)>=.02)return'showers';
 if(Math.max(0,Number(sample.snowfall)||0)>=.02)return'snow';
 if(Math.max(0,Number(sample.rain)||0)>=.02||Math.max(0,Number(sample.precipitation)||0)>=.02)return'rain';
 return'none';
}
function hourlyAssessmentDuration(hour:Hour,intervalHours:number,family:PrecipitationPeriodAssessment['family']){
 const amount=Math.max(0,Number(hour.precipitation)||0),snow=Math.max(0,Number(hour.snowfall)||0),probability=Math.max(0,Math.min(100,Number(hour.probability)||0));
 const direct=amount>=.04||snow>=.04,likely=family!=='none'&&probability>=60;
 if(!direct&&!likely)return 0;
 if(family==='showers'||family==='thunder'){
  if(amount<.08&&snow<.08&&probability<55)return Math.min(intervalHours,.25);
  if(amount<.25&&snow<.25)return Math.min(intervalHours,.5);
  if(amount<.6&&snow<.6)return Math.min(intervalHours,.75);
 }
 return intervalHours;
}
function assessmentSampleActive(sample:PrecipitationAssessmentSample){return sample.family!=='none'&&(sample.amount>=.04||sample.snow>=.04||sample.probability>=60)}
function assessmentSamplePossible(sample:PrecipitationAssessmentSample){return sample.family!=='none'&&(sample.amount>=.02||sample.snow>=.02||sample.probability>=25)}
function precipitationDominance(family:PrecipitationPeriodAssessment['family'],durationHours:number,maxProbability:number,amount:number){
 if(family==='thunder')return(durationHours>=.5&&(maxProbability>=35||amount>=.2))||maxProbability>=75||amount>=1;
 if(family==='showers')return(durationHours>=1.25&&maxProbability>=35&&amount>=.25)||amount>=1.2||(durationHours>=2&&maxProbability>=25);
 if(family==='rain'||family==='drizzle')return(durationHours>=2&&maxProbability>=35&&amount>=.45)||amount>=1.5||durationHours>=3;
 if(family==='snow')return(durationHours>=1.5&&maxProbability>=35)||(durationHours>=.75&&amount>=.8)||amount>=1.5;
 return false;
}
export function precipitationDurationLabel(durationHours:number){
 const hours=Math.max(0,Number(durationHours)||0),minutes=Math.round(hours*60/15)*15;
 if(minutes<=0)return'0 min';
 if(minutes<60)return`${minutes} min`;
 if(minutes%60===0)return`${minutes/60} h`;
 return`${Math.floor(minutes/60)} h ${minutes%60} min`;
}
export function precipitationDurationCompactLabel(durationHours:number){
 const hours=Math.max(0,Number(durationHours)||0),minutes=Math.round(hours*60/15)*15;
 if(minutes<=0)return'';
 if(minutes<60)return`${minutes}m`;
 if(minutes%60===0)return`${minutes/60}h`;
 const whole=Math.floor(minutes/60),fraction=minutes%60===15?'¼':minutes%60===30?'½':'¾';
 return`${whole}${fraction}h`;
}
/** Tagesübersichten zeigen bewusst nur ganze Stunden; detaillierte Ansichten behalten die 15-Minuten-Auflösung. */
export function precipitationDurationDayOverviewLabel(durationHours:number){const rounded=Math.max(0,Math.round(Math.max(0,Number(durationHours)||0)));return`${rounded} h`}
export function precipitationDurationDayOverviewCompactLabel(durationHours:number){const rounded=Math.max(0,Math.round(Math.max(0,Number(durationHours)||0)));return rounded>0?`${rounded}h`:''}
export function precipitationPeriodAssessment(hours:Hour[],minute15:Minute15[]=[]):PrecipitationPeriodAssessment{
 const ordered=[...hours].filter(hour=>Number.isFinite(Number(hour.epoch))).sort((a,b)=>a.epoch-b.epoch),samples:PrecipitationAssessmentSample[]=[];
 for(let index=0;index<ordered.length;index++){
  const hour=ordered[index],next=ordered[index+1],intervalHours=Math.max(.25,Math.min(1.5,Number.isFinite(next?.epoch)?(next.epoch-hour.epoch)/3600000:1)),end=hour.epoch+intervalHours*3600000;
  const fine=minute15.filter(sample=>sample.epoch>=hour.epoch&&sample.epoch<end);
  if(fine.length>=2){
   for(const sample of fine)samples.push({epoch:sample.epoch,durationHours:.25,amount:Math.max(0,Number(sample.precipitation)||0),snow:Math.max(0,Number(sample.snowfall)||0),probability:Math.max(0,Math.min(100,Number(sample.probability)||0)),family:minutePrecipitationFamily(sample),precise:true,hour});
   continue;
  }
  const family=plausiblePrecipFamily(hour) as PrecipitationPeriodAssessment['family'],duration=hourlyAssessmentDuration(hour,intervalHours,family);
  samples.push({epoch:hour.epoch,durationHours:duration||intervalHours,amount:Math.max(0,Number(hour.precipitation)||0),snow:Math.max(0,Number(hour.snowfall)||0),probability:Math.max(0,Math.min(100,Number(hour.probability)||0)),family,precise:false,hour});
 }
 const possible=samples.filter(assessmentSamplePossible),active=samples.filter(assessmentSampleActive),amount=ordered.reduce((sum,hour)=>sum+Math.max(0,Number(hour.precipitation)||0),0),maxProbability=Math.max(0,...possible.map(sample=>sample.probability));
 const possibleDurationHours=possible.reduce((sum,sample)=>sum+(sample.precise?sample.durationHours:Math.max(.25,hourlyAssessmentDuration(sample.hour!,sample.durationHours,sample.family))),0),durationHours=active.reduce((sum,sample)=>{
  if(!sample.precise&&sample.hour)return sum+hourlyAssessmentDuration(sample.hour,sample.durationHours,sample.family);
  return sum+sample.durationHours;
 },0),averageProbability=possible.length?possible.reduce((sum,sample)=>sum+sample.probability,0)/possible.length:0;
 const scores=new Map<PrecipitationPeriodAssessment['family'],number>();
 for(const sample of possible){const severity=sample.family==='thunder'?2.2:sample.family==='snow'?1.35:sample.family==='showers'?1.25:sample.family==='rain'?1.05:.8,score=sample.durationHours*(.35+sample.probability/100)*severity+(sample.amount+sample.snow*.12)*2.2;scores.set(sample.family,(scores.get(sample.family)??0)+score)}
 const family=[...scores.entries()].filter(([name])=>name!=='none').sort((a,b)=>b[1]-a[1])[0]?.[0]??'none',showery=family==='showers'||family==='thunder',severe=family==='thunder';
 const dominant=precipitationDominance(family,durationHours,maxProbability,amount);
 const timing=family==='none'?'':eventTiming(ordered,family);
 return{family,amount,maxProbability,averageProbability,durationHours:Math.round(durationHours*4)/4,possibleDurationHours:Math.round(possibleDurationHours*4)/4,activeIntervals:active.length,possibleIntervals:possible.length,dominant,showery,severe,timing};
}
function minuteWithinDayPeriod(day:Day,sample:Minute15){
 if(sample.time.slice(0,10)!==day.date)return false;
 const clock=Number(sample.time.slice(11,13))*60+Number(sample.time.slice(14,16)),sunrise=sevenDayClockMinutesForWeather(day.sunrise),sunset=sevenDayClockMinutesForWeather(day.sunset);
 if(Number.isFinite(sunrise)&&Number.isFinite(sunset)&&sunset>sunrise)return clock>=sunrise&&clock<sunset;
 return clock>=7*60&&clock<19*60;
}
function sevenDayClockMinutesForWeather(value?:string){const match=String(value||'').match(/T(\d{2}):(\d{2})/);return match?Number(match[1])*60+Number(match[2]):Number.NaN}
export function dayPrecipitationAssessment(day:Day,hours:Hour[],minute15:Minute15[]=[]){
 const relevant=dayPeriodHoursForDate(day.date,hours),fine=minute15.filter(sample=>minuteWithinDayPeriod(day,sample));
 if(relevant.length)return precipitationPeriodAssessment(relevant,fine);
 const family=precipCodeFamily(Math.round(Number(day.code)||0)),amount=Math.max(0,Number(day.precipitation)||0),maxProbability=Math.max(0,Math.min(100,Number(day.probability)||0)),reportedDuration=Math.max(0,Number(day.precipitationHours)||0),durationHours=reportedDuration>0?reportedDuration:family==='none'||(amount<.02&&maxProbability<25)?0:family==='showers'||family==='thunder'?amount>=1?.75:.25:amount>=1.5?2:amount>=.45?1:.5,dominant=precipitationDominance(family,durationHours,maxProbability,amount);
 return{family,amount,maxProbability,averageProbability:maxProbability,durationHours:Math.round(durationHours*4)/4,possibleDurationHours:Math.round(durationHours*4)/4,activeIntervals:durationHours>0?1:0,possibleIntervals:durationHours>0?1:0,dominant,showery:family==='showers'||family==='thunder',severe:family==='thunder',timing:''};
}
export function dayWeatherCharacter(day:Day,hours:Hour[]):DayWeatherCharacter{
 const relevant=dayPeriodHoursForDate(day.date,hours);
 if(!relevant.length){
  const family=precipCodeFamily(day.code),raw=label(day.code),fallbackLabel=family==='none'?compactSkyFallback(raw):shortEvent(family,raw);
  return{code:day.code,label:fitDayLabel(fallbackLabel,family==='none'?'Wechselhaft':fallbackLabel),secondary:'',cloudOktas:0,precipitationDominant:family!=='none'};
 }
 const astronomicalDaylight=relevant.filter(h=>h.isDay),daylight=astronomicalDaylight.length?astronomicalDaylight:relevant;
 const cloudWeight=relevant.reduce((sum,h)=>{const hour=Number(h.time.slice(11,13));return sum+(hour>=9&&hour<18?1.55:1.15)},0);
 const weightedCloud=relevant.reduce((sum,h)=>{const hour=Number(h.time.slice(11,13));return sum+h.cloud*(hour>=9&&hour<18?1.55:1.15)},0)/Math.max(.1,cloudWeight);
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
 const sky=skyFromCloud(effectiveCloud,sunshineForLabel),skyLabel=skyTrend(relevant,sky.label),skyCode=representativeSkyCode(skyLabel,sky.code),candidate=representativePrecipCode(relevant),assessment=precipitationPeriodAssessment(relevant);
 if(!candidate||assessment.family==='none')return{...sky,code:skyCode,label:fitDayLabel(skyLabel,compactSkyFallback(sky.label)),secondary:'',cloudOktas:cloudOktas(effectiveCloud),precipitationDominant:false};
 const severe=assessment.severe,dominant=assessment.dominant,eventFamily=assessment.family,eventCode=candidate.family===eventFamily?candidate.code:(eventFamily==='showers'?81:eventFamily==='thunder'?95:eventFamily==='snow'?73:eventFamily==='drizzle'?53:63),eventLabel=label(eventCode),event=shortEvent(eventFamily,eventLabel),timing=assessment.timing||eventTiming(relevant,eventFamily);
 if(!dominant){
  const secondary=assessment.maxProbability>=25&&assessment.possibleDurationHours>0?possibleEventText(event,timing):'';
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
 return{code:eventCode,label:characterLabel,secondary:'',cloudOktas:cloudOktas(effectiveCloud),precipitationDominant:true};
}

export function currentIndex(h:Hour[]){const now=Date.now();return h.reduce((b,x,i)=>{const timestamp=Number.isFinite(x.epoch)?x.epoch:Date.parse(`${x.time}Z`),d=Math.abs(timestamp-now);return d<b.d?{i,d}:b},{i:0,d:Infinity}).i}

function quantile(values:number[],p:number){const a=[...values].filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return NaN;const idx=(a.length-1)*p,lo=Math.floor(idx),hi=Math.ceil(idx),w=idx-lo;return hi===lo?a[lo]:a[lo]*(1-w)+a[hi]*w}
function weightedQuantile(values:{value:number;weight:number}[],p:number){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0).sort((x,y)=>x.value-y.value);const total=a.reduce((s,x)=>s+x.weight,0);if(!a.length||total<=0)return NaN;const target=total*p;let c=0;for(const x of a){c+=x.weight;if(c>=target)return x.value}return a[a.length-1].value}
function weightedMean(values:{value:number;weight:number}[]){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0),w=a.reduce((s,x)=>s+x.weight,0);return w?a.reduce((s,x)=>s+x.value*x.weight,0)/w:NaN}
function weightedProbability(values:{value:number;weight:number}[],threshold=.1,strict=false){const a=values.filter(x=>Number.isFinite(x.value)&&x.weight>0),w=a.reduce((s,x)=>s+x.weight,0);return w?100*a.filter(x=>strict?x.value>threshold:x.value>=threshold).reduce((s,x)=>s+x.weight,0)/w:0}
function robustWeighted(values:{value:number;weight:number}[],absolute:number){if(values.length<5)return values;const med=weightedQuantile(values,.5),q1=weightedQuantile(values,.25),q3=weightedQuantile(values,.75),iqr=Math.max(.5,q3-q1),limit=Math.max(absolute,1.8*iqr);const filtered=values.filter(x=>Math.abs(x.value-med)<=limit);return filtered.length>=Math.max(4,Math.ceil(values.length*.55))?filtered:values}
type MemberDay={date:string;max:number;min:number;precipitation:number;precipitationWindows:[number,number,number,number];sunshineDuration:number;wind:number;gust:number};
type ModelResult={model:EnsembleModel;members:Map<string,MemberDay[]>};
type ScenarioTrajectory={id:string;modelId:string;modelLabel:string;weight:number;rows:MemberDay[];vector:number[]};
function scenarioTrajectoryVector(rows:MemberDay[],dates:string[]){const values:number[]=[];for(const date of dates){const row=rows.find(item=>item.date===date);if(!row||![row.max,row.min,row.precipitation].every(Number.isFinite))return[];values.push(row.max,row.min,Math.log1p(Math.max(0,row.precipitation))*3,Number.isFinite(row.gust)?Math.log1p(Math.max(0,row.gust))*1.25:NaN)}return values}
function standardizeScenarioVectors(items:ScenarioTrajectory[]){if(!items.length)return items;const width=items[0].vector.length,means=Array(width).fill(0),scales=Array(width).fill(1);for(let index=0;index<width;index++){const valid=items.filter(item=>Number.isFinite(item.vector[index])&&item.weight>0),total=valid.reduce((sum,item)=>sum+item.weight,0)||1;means[index]=valid.length?valid.reduce((sum,item)=>sum+item.vector[index]*item.weight,0)/total:0;const variance=valid.length?valid.reduce((sum,item)=>sum+(item.vector[index]-means[index])**2*item.weight,0)/total:0;scales[index]=Math.max(.35,Math.sqrt(variance))}return items.map(item=>({...item,vector:item.vector.map((value,index)=>((Number.isFinite(value)?value:means[index])-means[index])/scales[index])}))}
function vectorDistance(a:number[],b:number[]){let sum=0;for(let index=0;index<Math.min(a.length,b.length);index++)sum+=(a[index]-b[index])**2;return Math.sqrt(sum)}
function scenarioCentroids(items:ScenarioTrajectory[],count:number){const centroids:number[][]=[];const first=[...items].sort((a,b)=>a.id.localeCompare(b.id))[0];if(!first)return centroids;centroids.push([...first.vector]);while(centroids.length<count){const candidate=[...items].sort((a,b)=>Math.min(...centroids.map(center=>vectorDistance(b.vector,center)))-Math.min(...centroids.map(center=>vectorDistance(a.vector,center))))[0];if(!candidate)break;centroids.push([...candidate.vector])}return centroids}
function weightedCentroid(items:ScenarioTrajectory[],indices:number[],fallback:number[]){const selected=indices.map(index=>items[index]),total=selected.reduce((sum,item)=>sum+item.weight,0);if(!selected.length||!total)return fallback;return fallback.map((_,feature)=>selected.reduce((sum,item)=>sum+item.vector[feature]*item.weight,0)/total)}
function clusterScenarioItems(items:ScenarioTrajectory[],count:number){let centroids=scenarioCentroids(items,count),assignments=items.map(()=>0);for(let iteration=0;iteration<14;iteration++){const next=items.map(item=>{let best=0,bestDistance=Infinity;centroids.forEach((center,index)=>{const distance=vectorDistance(item.vector,center);if(distance<bestDistance){best=index;bestDistance=distance}});return best}),changed=next.some((value,index)=>value!==assignments[index]);assignments=next;centroids=centroids.map((center,index)=>weightedCentroid(items,assignments.map((value,itemIndex)=>value===index?itemIndex:-1).filter(value=>value>=0),center));if(!changed)break}return{assignments,centroids}}
function weightedScenarioPoint(items:ScenarioTrajectory[],date:string){const rows=items.map(item=>({item,row:item.rows.find(row=>row.date===date)})).filter(entry=>entry.row) as {item:ScenarioTrajectory;row:MemberDay}[],mean=(selector:(row:MemberDay)=>number,fallback=NaN)=>{const valid=rows.map(entry=>({value:selector(entry.row),weight:entry.item.weight})).filter(entry=>Number.isFinite(entry.value)&&entry.weight>0),total=valid.reduce((sum,entry)=>sum+entry.weight,0);return total?valid.reduce((sum,entry)=>sum+entry.value*entry.weight,0)/total:fallback};return{date,max:mean(row=>row.max),min:mean(row=>row.min),precipitation:mean(row=>row.precipitation,0),sunshineDuration:mean(row=>row.sunshineDuration),gust:mean(row=>row.gust)}}
function scenarioBaselineGust(day:EnsembleDay|undefined){const values=(day?.modelSummaries??[]).map(item=>Number(item.gust)).filter(Number.isFinite);return values.length?quantile(values,.5):NaN}
function scenarioLabel(points:EnsembleScenarioPoint[],baseline:EnsembleDay[]){const relevant=points.slice(0,Math.min(5,points.length)),base=new Map(baseline.map(day=>[day.date,day])),temperature=relevant.reduce((sum,point)=>{const row=base.get(point.date);return sum+(row?((point.max+point.min)-(row.maxMean+row.minMean))/2:0)},0)/Math.max(1,relevant.length),rain=relevant.reduce((sum,point)=>sum+point.precipitation,0),baseRain=relevant.reduce((sum,point)=>sum+(base.get(point.date)?.precipitationMean??0),0),wetDelta=rain-baseRain,scenarioGustValues=relevant.map(point=>point.gust).filter(Number.isFinite),baseGustValues=relevant.map(point=>scenarioBaselineGust(base.get(point.date))).filter(Number.isFinite),scenarioGust=scenarioGustValues.length?Math.max(...scenarioGustValues):NaN,baseGust=baseGustValues.length?Math.max(...baseGustValues):NaN,gustDelta=Number.isFinite(scenarioGust)&&Number.isFinite(baseGust)?scenarioGust-baseGust:0,firstWet=relevant.findIndex(point=>point.precipitation>=1),baseFirstWet=relevant.findIndex(point=>(base.get(point.date)?.precipitationMean??0)>=1);if(wetDelta>=Math.max(12,baseRain*1.6))return temperature>=1?'wärmer und sehr niederschlagsreich':'sehr niederschlagsreich';if(wetDelta>=3)return temperature>=1?'wärmer und nasser':gustDelta>=5?'nasser und windiger':'nasser';if(wetDelta<=-3)return temperature<=-1?'kühler und trockener':gustDelta>=5?'trockener und windiger':'trockener';if(firstWet>=0&&baseFirstWet>=0&&firstWet<baseFirstWet)return'früherer Niederschlag';if(firstWet>=0&&baseFirstWet>=0&&firstWet>baseFirstWet)return'verzögerter Niederschlag';if(gustDelta>=5)return'windiger';if(gustDelta<=-5)return'weniger windig';if(temperature>=1.5)return'wärmer';if(temperature<=-1.5)return'kühler';return'nahe am Ensemble-Schwerpunkt'}
function scenarioMeanTemperature(points:EnsembleScenarioPoint[]){const relevant=points.slice(0,5);return relevant.reduce((sum,point)=>sum+(point.max+point.min)/2,0)/Math.max(1,relevant.length)}
function scenarioRainSum(points:EnsembleScenarioPoint[]){return points.slice(0,5).reduce((sum,point)=>sum+Math.max(0,point.precipitation),0)}
function scenarioPeakGust(points:EnsembleScenarioPoint[]){const values=points.slice(0,5).map(point=>point.gust).filter(Number.isFinite);return values.length?Math.max(...values):NaN}
function scenarioFirstWetIndex(points:EnsembleScenarioPoint[]){return points.slice(0,5).findIndex(point=>point.precipitation>=1)}
function scenarioWeekday(date:string){return new Intl.DateTimeFormat('de-DE',{weekday:'long',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`))}
function scenarioPeakRainDay(points:EnsembleScenarioPoint[]){const relevant=points.slice(0,7);if(!relevant.length)return null;return relevant.reduce((best,point)=>point.precipitation>best.precipitation?point:best,relevant[0])}
function scenarioConcreteTimingLabel(points:EnsembleScenarioPoint[],reference:EnsembleScenarioPoint[]){
 const peak=scenarioPeakRainDay(points),referencePeak=scenarioPeakRainDay(reference);
 if(peak&&referencePeak&&peak.date!==referencePeak.date&&Math.max(peak.precipitation,referencePeak.precipitation)>=.8)return`Niederschlagsschwerpunkt am ${scenarioWeekday(peak.date)} statt am ${scenarioWeekday(referencePeak.date)}`;
 const daily=points.slice(0,7).map((point,index)=>({point,reference:reference[index],rainDelta:point.precipitation-(reference[index]?.precipitation??0),tempDelta:((point.max+point.min)-(reference[index]?.max??point.max)-(reference[index]?.min??point.min))/2,gustDelta:Number.isFinite(point.gust)&&Number.isFinite(reference[index]?.gust)?point.gust-reference[index].gust:0}));
 const rain=([...daily].sort((a,b)=>Math.abs(b.rainDelta)-Math.abs(a.rainDelta))[0]);if(rain&&Math.abs(rain.rainDelta)>=.6)return`${rain.rainDelta>0?'mehr':'weniger'} Niederschlag am ${scenarioWeekday(rain.point.date)}`;
 const temp=([...daily].sort((a,b)=>Math.abs(b.tempDelta)-Math.abs(a.tempDelta))[0]);if(temp&&Math.abs(temp.tempDelta)>=1)return`${temp.tempDelta>0?'wärmer':'kühler'} am ${scenarioWeekday(temp.point.date)}`;
 const gust=([...daily].sort((a,b)=>Math.abs(b.gustDelta)-Math.abs(a.gustDelta))[0]);if(gust&&Math.abs(gust.gustDelta)>=4)return`${gust.gustDelta>0?'windiger':'weniger windig'} am ${scenarioWeekday(gust.point.date)}`;
 return'anderer Wochenverlauf';
}
function scenarioRelativeLabel(points:EnsembleScenarioPoint[],reference:EnsembleScenarioPoint[]){const temperatureDelta=scenarioMeanTemperature(points)-scenarioMeanTemperature(reference),rainDelta=scenarioRainSum(points)-scenarioRainSum(reference),gust=scenarioPeakGust(points),referenceGust=scenarioPeakGust(reference),gustDelta=Number.isFinite(gust)&&Number.isFinite(referenceGust)?gust-referenceGust:0,firstWet=scenarioFirstWetIndex(points),referenceFirstWet=scenarioFirstWetIndex(reference);if(rainDelta>=10)return temperatureDelta>=1.5?'deutlich wärmer und nasser':gustDelta>=8?'deutlich nasser und windiger':'deutlich nasser';if(rainDelta<=-10)return temperatureDelta<=-1.5?'deutlich kühler und trockener':gustDelta>=8?'deutlich trockener und windiger':'deutlich trockener';if(firstWet>=0&&referenceFirstWet>=0&&firstWet<=referenceFirstWet-1)return'früherer Niederschlag';if(firstWet>=0&&referenceFirstWet>=0&&firstWet>=referenceFirstWet+1)return'verzögerter Niederschlag';if(rainDelta>=3)return temperatureDelta>=1.5?'wärmer und nasser':gustDelta>=6?'nasser und windiger':'nasser';if(rainDelta<=-3)return temperatureDelta<=-1.5?'kühler und trockener':gustDelta>=6?'trockener und windiger':'trockener';if(gustDelta>=8)return temperatureDelta>=1.5?'wärmer und windiger':'windiger';if(gustDelta<=-8)return temperatureDelta<=-1.5?'kühler und weniger windig':'weniger windig';if(temperatureDelta>=2)return'wärmer';if(temperatureDelta<=-2)return'kühler';return scenarioConcreteTimingLabel(points,reference)}
function scenarioSummary(_label:string,points:EnsembleScenarioPoint[]){const relevant=points.slice(0,5),rain=relevant.reduce((sum,point)=>sum+point.precipitation,0),peak=Math.max(...relevant.map(point=>point.max)),minimum=Math.min(...relevant.map(point=>point.min)),gustValues=relevant.map(point=>point.gust).filter(Number.isFinite),gust=gustValues.length?Math.max(...gustValues):NaN,temperatureRange=String(Math.round(minimum))+' bis '+String(Math.round(peak))+'\u00a0\u00b0C';return formatDecimal(rain,1,1)+' mm in fünf Tagen · etwa '+temperatureRange+(Number.isFinite(gust)?' · Böen bis '+String(Math.round(gust))+' kt':'')}
function scenarioRainTotal(item:ScenarioTrajectory,dates:string[]){return dates.slice(0,5).reduce((sum,date)=>sum+Math.max(0,item.rows.find(row=>row.date===date)?.precipitation??0),0)}
function filterScenarioRainOutliers(items:ScenarioTrajectory[],dates:string[]){if(items.length<12)return items;const totals=items.map(item=>({value:scenarioRainTotal(item,dates),weight:item.weight})),median=weightedQuantile(totals,.5),deviations=totals.map(item=>({value:Math.abs(item.value-median),weight:item.weight})),mad=Math.max(1,weightedQuantile(deviations,.5)),limit=Math.max(80,median+Math.max(60,8*mad,median*3+25)),dailyLimit=Math.max(180,median+12*mad),filtered=items.filter(item=>{const total=scenarioRainTotal(item,dates),dailyPeak=Math.max(...dates.slice(0,5).map(date=>Math.max(0,item.rows.find(row=>row.date===date)?.precipitation??0)));return total<=limit&&dailyPeak<=dailyLimit});return filtered.length>=Math.max(10,Math.ceil(items.length*.55))?filtered:items}
function scenarioModelShares(group:ScenarioTrajectory[],all:ScenarioTrajectory[]){const familyTotals=new Map<string,{label:string;count:number}>(),groupCounts=new Map<string,{label:string;count:number}>();for(const item of all){const row=familyTotals.get(item.modelId)??{label:item.modelLabel,count:0};row.count++;familyTotals.set(item.modelId,row)}for(const item of group){const row=groupCounts.get(item.modelId)??{label:item.modelLabel,count:0};row.count++;groupCounts.set(item.modelId,row)}return[...groupCounts.entries()].map(([id,row])=>{const familyMemberCount=familyTotals.get(id)?.count??row.count;return{id,label:row.label,memberCount:row.count,familyMemberCount,familyShare:100*row.count/Math.max(1,familyMemberCount)}}).sort((a,b)=>b.familyShare-a.familyShare||b.memberCount-a.memberCount||a.label.localeCompare(b.label)).slice(0,6)}
function scenarioDaySeparation(clusters:EnsembleScenarioCluster[],index:number){const values=clusters.map(cluster=>cluster.points[index]).filter(Boolean);if(values.length<2)return{normal:false,exceptional:false};const maxSpread=Math.max(...values.map(point=>point.max))-Math.min(...values.map(point=>point.max)),minSpread=Math.max(...values.map(point=>point.min))-Math.min(...values.map(point=>point.min)),temperatureSpread=Math.max(maxSpread,minSpread),rainValues=values.map(point=>Math.max(0,point.precipitation)),rainSpread=Math.max(...rainValues)-Math.min(...rainValues),rainPeak=Math.max(...rainValues),gusts=values.map(point=>point.gust).filter(Number.isFinite),gustSpread=gusts.length>=2?Math.max(...gusts)-Math.min(...gusts):0,tempSignal=temperatureSpread>=3,rainSignal=rainSpread>=3&&rainPeak>=4,gustSignal=gustSpread>=8,signalCount=[tempSignal,rainSignal,gustSignal].filter(Boolean).length,combined=temperatureSpread/3+(rainPeak>=4?rainSpread/4:0)+gustSpread/10,normal=signalCount>=2||combined>=1.8||temperatureSpread>=4||(rainSpread>=5&&rainPeak>=6)||gustSpread>=12,exceptional=temperatureSpread>=5||(rainSpread>=10&&rainPeak>=12)||gustSpread>=16||signalCount===3;return{normal,exceptional}}
function scenarioDivergenceDate(clusters:EnsembleScenarioCluster[],dates:string[]){for(let index=1;index<dates.length;index++){const current=scenarioDaySeparation(clusters,index);if(current.exceptional)return dates[index];const next=index+1<dates.length?scenarioDaySeparation(clusters,index+1):null;if(current.normal&&next?.normal)return dates[index]}return undefined}
function buildEnsembleScenarios(results:ModelResult[],days:EnsembleDay[]):EnsembleScenarioCluster[]{
 const dates=days.slice(0,7).map(day=>day.date);if(dates.length<4)return[];
 const collected:ScenarioTrajectory[]=[];
 const groupCounts=new Map<string,number>();for(const result of results)groupCounts.set(result.model.independenceGroup,(groupCounts.get(result.model.independenceGroup)??0)+1);for(const result of results){const memberCount=Math.max(1,result.members.size),groupDivisor=Math.max(1,groupCounts.get(result.model.independenceGroup)??1),weight=1/(memberCount*groupDivisor);for(const[memberId,rows]of result.members){const complete=dates.map(date=>rows.find(row=>row.date===date)).filter(Boolean) as MemberDay[];if(complete.length!==dates.length)continue;const vector=scenarioTrajectoryVector(complete,dates);if(vector.length)collected.push({id:`${result.model.id}:${memberId}`,modelId:result.model.independenceGroup,modelLabel:result.model.label,weight,rows:complete,vector})}}
 const trajectories=filterScenarioRainOutliers(collected,dates);if(trajectories.length<10)return[];
 const normalized=standardizeScenarioVectors(trajectories),count=normalized.length>=28?3:2,{assignments}=clusterScenarioItems(normalized,count),groups=Array.from({length:count},(_,index)=>trajectories.filter((_,itemIndex)=>assignments[itemIndex]===index)),totalWeight=trajectories.reduce((sum,item)=>sum+item.weight,0)||1;
 const clusters=groups.map((group,index)=>{const probability=100*group.reduce((sum,item)=>sum+item.weight,0)/totalWeight,points=dates.map(date=>weightedScenarioPoint(group,date)),modelShares=scenarioModelShares(group,trajectories),models=modelShares.map(item=>item.label);return{id:`scenario-${index+1}`,label:'',summary:'',probability,memberCount:group.length,modelLabels:models,modelShares,points}}).filter(cluster=>cluster.probability>=6).sort((a,b)=>b.probability-a.probability);
 if(clusters.length<2)return[];
 const usedLabels=new Set<string>(),reference=clusters[0].points,labelled=clusters.map((cluster,index)=>{let label=index===0?scenarioLabel(cluster.points,days):scenarioRelativeLabel(cluster.points,reference);if(usedLabels.has(label))label=scenarioConcreteTimingLabel(cluster.points,reference);usedLabels.add(label);return{...cluster,id:`scenario-${index+1}`,label,summary:scenarioSummary(label,cluster.points)}}),divergenceDate=scenarioDivergenceDate(labelled,dates);
 return labelled.map(cluster=>({...cluster,divergenceDate}));
}
function parseModelMembers(w:Weather,model:EnsembleModel):ModelResult|null{
 const times=(w.hourly.time as string[])??[],keys=Object.keys(w.hourly),tempKeys=keys.filter(k=>/^temperature_2m(?:_member\d+)?$/.test(k)),precipKeys=keys.filter(k=>/^precipitation(?:_member\d+)?$/.test(k)),sunshineKeys=keys.filter(k=>/^sunshine_duration(?:_member\d+)?$/.test(k)),windKeys=keys.filter(k=>/^wind_speed_10m(?:_member\d+)?$/.test(k)),gustKeys=keys.filter(k=>/^wind_gusts_10m(?:_member\d+)?$/.test(k));
 if(!times.length||!tempKeys.length)return null;
 const suffix=(k:string)=>k.replace('temperature_2m',''),pBySuffix=new Map(precipKeys.map(k=>[k.replace('precipitation',''),k])),sBySuffix=new Map(sunshineKeys.map(k=>[k.replace('sunshine_duration',''),k])),wBySuffix=new Map(windKeys.map(k=>[k.replace('wind_speed_10m',''),k])),gBySuffix=new Map(gustKeys.map(k=>[k.replace('wind_gusts_10m',''),k]));
 const members=new Map<string,MemberDay[]>();
 for(const tk of tempKeys){
  const s=suffix(tk),pk=pBySuffix.get(s),sk=sBySuffix.get(s),wk=wBySuffix.get(s),gk=gBySuffix.get(s),temps=w.hourly[tk]??[],rain=pk?w.hourly[pk]??[]:[],sunshine=sk?w.hourly[sk]??[]:[],winds=wk?w.hourly[wk]??[]:[],gusts=gk?w.hourly[gk]??[]:[];
  const daily=new Map<string,{t:number[];p:number[];pb:[number[],number[],number[],number[]];s:number[];w:number[];g:number[]}>();
  for(let i=0;i<times.length;i++){
   const date=String(times[i]).slice(0,10),tv=n(temps[i]),pv=n(rain[i]),sv=n(sunshine[i]),wv=n(winds[i]),gv=n(gusts[i]);
   if(!daily.has(date))daily.set(date,{t:[],p:[],pb:[[],[],[],[]],s:[],w:[],g:[]});
   const d=daily.get(date)!;
   if(Number.isFinite(tv)&&tv>-65&&tv<65)d.t.push(tv);
   if(Number.isFinite(pv)&&pv>=0&&pv<150){d.p.push(pv);const hour=Number(String(times[i]).slice(11,13)),block=Number.isFinite(hour)?Math.max(0,Math.min(3,Math.floor(hour/6))):-1;if(block>=0)d.pb[block].push(pv)}
   if(Number.isFinite(sv)&&sv>=0&&sv<=21600)d.s.push(sv);
   if(Number.isFinite(wv)&&wv>=0&&wv<140)d.w.push(wv);
   if(Number.isFinite(gv)&&gv>=0&&gv<180)d.g.push(gv);
  }
  const rows:MemberDay[]=[];
  daily.forEach((d,date)=>{
   if(d.t.length>=18){
    const max=Math.max(...d.t),min=Math.min(...d.t),precipitation=d.p.reduce((a,b)=>a+b,0),precipitationWindows=d.pb.map(values=>values.length>=5?values.reduce((a,b)=>a+b,0):NaN) as [number,number,number,number],sunshineDuration=d.s.length>=6?clampNumber(d.s.reduce((a,b)=>a+b,0),0,86400):NaN,wind=d.w.length?Math.max(...d.w):NaN,gust=d.g.length?Math.max(...d.g):NaN;
    if(Number.isFinite(max)&&Number.isFinite(min)&&max>=min&&max-min<35)rows.push({date,max,min,precipitation,precipitationWindows,sunshineDuration,wind,gust});
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
  let maxVals:{value:number;weight:number}[]=[],minVals:{value:number;weight:number}[]=[],rainVals:{value:number;weight:number}[]=[],rainProbabilityVals:{value:number;weight:number}[]=[],windowRainProbabilityVals:Array<{value:number;weight:number}[]>=Array.from({length:4},()=>[]),cumulativeRainVals:{value:number;weight:number}[]=[],sunVals:{value:number;weight:number}[]=[],windVals:{value:number;weight:number}[]=[],gustVals:{value:number;weight:number}[]=[],modelSummaries:EnsembleModelDay[]=[];
  const groupsUsed=new Set<string>();let memberCount=0;
  const groupCounts=new Map<string,number>();for(const result of results){const hasDate=[...result.members.values()].some(rows=>rows.some(row=>row.date===date));if(hasDate)groupCounts.set(result.model.independenceGroup,(groupCounts.get(result.model.independenceGroup)??0)+1)}
  for(const r of results){
   const memberRows=[...r.members.values()].map(rows=>rows.find(x=>x.date===date)).filter(Boolean) as MemberDay[];
   if(!memberRows.length)continue;
   const medMax=quantile(memberRows.map(x=>x.max),.5),medMin=quantile(memberRows.map(x=>x.min),.5),filtered=memberRows.filter(x=>Math.abs(x.max-medMax)<=8&&Math.abs(x.min-medMin)<=8),rows=filtered.length>=Math.max(3,Math.ceil(memberRows.length*.55))?filtered:memberRows,groupDivisor=Math.max(1,groupCounts.get(r.model.independenceGroup)??1),weight=modelDayWeight(r.model,lead,rows.length)/groupDivisor;
   if(!rows.length||weight<=0)continue;
   groupsUsed.add(r.model.independenceGroup);memberCount+=rows.length;
   modelSummaries.push({id:r.model.id,label:r.model.label,family:r.model.family,independenceGroup:r.model.independenceGroup,max:quantile(rows.map(item=>item.max),.5),min:quantile(rows.map(item=>item.min),.5),precipitation:quantile(rows.map(item=>item.precipitation),.5),precipitationProbability:100*rows.filter(item=>item.precipitation>DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM).length/Math.max(1,rows.length),precipitationProbabilitySignificant:100*rows.filter(item=>item.precipitation>DWD_SIGNIFICANT_PRECIPITATION_PROBABILITY_THRESHOLD_MM).length/Math.max(1,rows.length),memberCount:r.model.distributionMode==='mean-spread'?0:rows.length,wind:rows.some(item=>Number.isFinite(item.wind))?quantile(rows.map(item=>item.wind).filter(Number.isFinite),.5):undefined,gust:rows.some(item=>Number.isFinite(item.gust))?quantile(rows.map(item=>item.gust).filter(Number.isFinite),.5):undefined,sunshineDuration:rows.some(item=>Number.isFinite(item.sunshineDuration))?quantile(rows.map(item=>item.sunshineDuration).filter(Number.isFinite),.5):undefined});
   for(const row of rows){maxVals.push({value:row.max,weight});minVals.push({value:row.min,weight});rainVals.push({value:row.precipitation,weight});rainProbabilityVals.push({value:row.precipitation,weight});row.precipitationWindows.forEach((value,index)=>{if(Number.isFinite(value))windowRainProbabilityVals[index].push({value,weight})});if(Number.isFinite(row.sunshineDuration))sunVals.push({value:row.sunshineDuration,weight});if(Number.isFinite(row.wind))windVals.push({value:row.wind,weight});if(Number.isFinite(row.gust))gustVals.push({value:row.gust,weight})}
   const cumulativeTargetDates=new Set(allDates.slice(0,lead+1)),cumulativeMemberTotals=[...r.members.values()].map(memberDays=>{const covered=memberDays.filter(item=>cumulativeTargetDates.has(item.date));if(covered.length!==cumulativeTargetDates.size)return NaN;return covered.reduce((sum,item)=>sum+(Number.isFinite(item.precipitation)?Math.max(0,item.precipitation):0),0)}).filter(Number.isFinite),cumulativeWeight=modelDayWeight(r.model,lead,cumulativeMemberTotals.length)/Math.max(1,groupCounts.get(r.model.independenceGroup)??1);
   if(cumulativeWeight>0)for(const total of cumulativeMemberTotals)cumulativeRainVals.push({value:total,weight:cumulativeWeight});
  }
  maxVals=robustWeighted(maxVals,9);minVals=robustWeighted(minVals,9);rainVals=robustWeighted(rainVals,25);cumulativeRainVals=robustWeighted(cumulativeRainVals,25*Math.sqrt(lead+1));sunVals=robustWeighted(sunVals,21600);windVals=robustWeighted(windVals,35);gustVals=robustWeighted(gustVals,45);
  if(groupsUsed.size<2||memberCount<10||maxVals.length<6||minVals.length<6)continue;
  const maxLow=weightedQuantile(maxVals,.1),maxHigh=weightedQuantile(maxVals,.9),maxQ25=weightedQuantile(maxVals,.25),maxQ75=weightedQuantile(maxVals,.75),minLow=weightedQuantile(minVals,.1),minHigh=weightedQuantile(minVals,.9),minQ25=weightedQuantile(minVals,.25),minQ75=weightedQuantile(minVals,.75),precipitationLow=weightedQuantile(rainVals,.1),precipitationHigh=weightedQuantile(rainVals,.9),precipitationQ25=weightedQuantile(rainVals,.25),precipitationQ75=weightedQuantile(rainVals,.75),cumulativePrecipitationLow=weightedQuantile(cumulativeRainVals,.1),cumulativePrecipitationHigh=weightedQuantile(cumulativeRainVals,.9),cumulativePrecipitationQ25=weightedQuantile(cumulativeRainVals,.25),cumulativePrecipitationQ75=weightedQuantile(cumulativeRainVals,.75),cumulativePrecipitationMean=weightedMean(cumulativeRainVals),sunshineDurationLow=sunVals.length>=6?weightedQuantile(sunVals,.1):NaN,sunshineDurationHigh=sunVals.length>=6?weightedQuantile(sunVals,.9):NaN,sunshineDurationMean=sunVals.length>=6?weightedMean(sunVals):NaN,windLow=windVals.length>=6?weightedQuantile(windVals,.1):NaN,windHigh=windVals.length>=6?weightedQuantile(windVals,.9):NaN,windQ25=windVals.length>=6?weightedQuantile(windVals,.25):NaN,windQ75=windVals.length>=6?weightedQuantile(windVals,.75):NaN,windMean=windVals.length>=6?weightedMean(windVals):NaN,gustLow=gustVals.length>=6?weightedQuantile(gustVals,.1):NaN,gustHigh=gustVals.length>=6?weightedQuantile(gustVals,.9):NaN,gustQ25=gustVals.length>=6?weightedQuantile(gustVals,.25):NaN,gustQ75=gustVals.length>=6?weightedQuantile(gustVals,.75):NaN,gustMean=gustVals.length>=6?weightedMean(gustVals):NaN;
  if(![maxLow,maxHigh,maxQ25,maxQ75,minLow,minHigh,minQ25,minQ75].every(Number.isFinite)||maxHigh<maxLow||minHigh<minLow)continue;
  const precipitationProbabilityWindows=windowRainProbabilityVals.map((values,index)=>({startHour:index*6,endHour:(index+1)*6,probability:weightedProbability(values,DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true),probabilitySignificant:weightedProbability(values,DWD_SIGNIFICANT_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true),memberCount:values.length})).filter(window=>window.memberCount>=2);
  const validModelSummaries=modelSummaries.filter(item=>[item.max,item.min,item.precipitation,item.precipitationProbability].every(Number.isFinite)),independentModelSummaries=[...new Map(validModelSummaries.map(item=>[item.independenceGroup??item.family??item.id,item])).values()],effectiveMemberCount=independentModelSummaries.reduce((sum,item)=>sum+Math.max(0,item.memberCount),0);days.push({date,maxMean:weightedMean(maxVals),maxLow,maxHigh,maxQ25,maxQ75,minMean:weightedMean(minVals),minLow,minHigh,minQ25,minQ75,precipitationMean:weightedMean(rainVals),precipitationLow:Number.isFinite(precipitationLow)?precipitationLow:0,precipitationHigh:Number.isFinite(precipitationHigh)?precipitationHigh:0,precipitationQ25:Number.isFinite(precipitationQ25)?precipitationQ25:0,precipitationQ75:Number.isFinite(precipitationQ75)?precipitationQ75:0,cumulativePrecipitationMean:Number.isFinite(cumulativePrecipitationMean)?cumulativePrecipitationMean:0,cumulativePrecipitationLow:Number.isFinite(cumulativePrecipitationLow)?cumulativePrecipitationLow:0,cumulativePrecipitationHigh:Number.isFinite(cumulativePrecipitationHigh)?cumulativePrecipitationHigh:0,cumulativePrecipitationQ25:Number.isFinite(cumulativePrecipitationQ25)?cumulativePrecipitationQ25:0,cumulativePrecipitationQ75:Number.isFinite(cumulativePrecipitationQ75)?cumulativePrecipitationQ75:0,precipitationProbability:weightedProbability(rainProbabilityVals,DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true),precipitationProbabilitySignificant:weightedProbability(rainProbabilityVals,DWD_SIGNIFICANT_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true),precipitationProbabilityWindows,sunshineDurationMean,sunshineDurationLow,sunshineDurationHigh,windMean,windLow,windHigh,windQ25,windQ75,gustMean,gustLow,gustHigh,gustQ25,gustQ75,modelCount:independentModelSummaries.length,memberCount:effectiveMemberCount,modelSummaries:independentModelSummaries});
 }
 return days;
}


function ensembleRetryDelay(ms:number,signal?:AbortSignal){return new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Abgebrochen','AbortError'));return}const timer=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Abgebrochen','AbortError'))},{once:true})})}
async function fetchEnsembleRequest(url:string,signal?:AbortSignal,priority:OpenMeteoPriority='normal'){
 try{return await guardedOpenMeteoJson<Weather>(url,{signal,cache:'no-store'},{priority,maxRetries:priority==='background'?0:1})}
 catch(error){if(signal?.aborted)throw error;if(isOpenMeteoRateLimitError(error))throw error;await ensembleRetryDelay(450,signal);return guardedOpenMeteoJson<Weather>(url,{signal,cache:'no-store'},{priority,maxRetries:0,dedupe:false})}
}
async function fetchEnsembleWeather(lat:number,lon:number,forecastDays:number,modelId:string,signal?:AbortSignal,hourly='temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,sunshine_duration',priority:OpenMeteoPriority='normal'){
 const forecast_days=Math.max(1,Math.min(14,Math.ceil(forecastDays))),request=async(variables:string)=>{
  const parameters={lat,lon,model:modelId,forecast_days,variables},directRegional=DIRECT_REGIONAL_ENSEMBLE_MODELS.has(modelId);let proxyError:unknown;
  if(workerBaseCandidates('general').length){try{const proxied=await fetchWorkerJson<Weather&{error?:string}>('ensemble-proxy',parameters,{purpose:'general',signal,timeoutMs:18000,cache:'no-store'});if(Array.isArray(proxied?.hourly?.time)&&proxied.hourly.time.length>=12)return proxied;proxyError=new Error(`${modelId}: Regionalensemble-Adapter lieferte keine nutzbare Zeitreihe`)}catch(error){proxyError=error}}
  if(directRegional)throw proxyError instanceof Error?proxyError:new Error(`${modelId}: numerischer Regionalensemble-Adapter nicht verfügbar`);
  const p=new URLSearchParams({latitude:String(lat),longitude:String(lon),timezone:'auto',forecast_days:String(forecast_days),models:modelId,hourly:variables,wind_speed_unit:'kn'});return fetchEnsembleRequest(`https://ensemble-api.open-meteo.com/v1/ensemble?${p}`,signal,priority)
 };
 const attempts=[hourly,hourly.split(',').filter(value=>value!=='sunshine_duration').join(','),'temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m','temperature_2m,precipitation'].filter((value,index,list)=>value&&list.indexOf(value)===index);let lastError:unknown;for(const variables of attempts){try{return await request(variables)}catch(error){lastError=error;if(signal?.aborted)throw error}}throw lastError;
}
function pseudoModelFromMeanSpread(w:Weather,definition:EnsembleMeanModel):ModelResult|null{
 const times=(w.hourly?.time as string[])??[],mean=w.hourly?.temperature_2m??[],spread=w.hourly?.temperature_2m_spread??[],rain=w.hourly?.precipitation??[],rainSpread=w.hourly?.precipitation_spread??[];
 if(times.length<24||!mean.length||!spread.length)return null;
 const z=[-1.28155,-.67449,0,.67449,1.28155],members=new Map<string,MemberDay[]>();
 for(let member=0;member<z.length;member++){
  const daily=new Map<string,{t:number[];p:number[];pb:[number[],number[],number[],number[]]}>();
  for(let index=0;index<times.length;index++){
   const timestamp=String(times[index]),date=timestamp.slice(0,10),hour=Number(timestamp.slice(11,13)),temperature=n(mean[index]),sigma=Math.max(0,n(spread[index])),precipitation=Math.max(0,n(rain[index])+z[member]*Math.max(0,n(rainSpread[index])));
   if(!Number.isFinite(temperature))continue;const row=daily.get(date)??{t:[],p:[],pb:[[],[],[],[]]};row.t.push(temperature+z[member]*sigma);if(Number.isFinite(precipitation)){row.p.push(precipitation);if(Number.isFinite(hour)&&hour>=0&&hour<24)row.pb[Math.min(3,Math.floor(hour/6))].push(precipitation)}daily.set(date,row);
  }
  const rows:MemberDay[]=[];daily.forEach((row,date)=>{if(row.t.length>=18){const precipitationWindows=row.pb.map(values=>values.length>=5?values.reduce((sum,value)=>sum+value,0):NaN) as [number,number,number,number];rows.push({date,max:Math.max(...row.t),min:Math.min(...row.t),precipitation:row.p.reduce((sum,value)=>sum+value,0),precipitationWindows,sunshineDuration:NaN,wind:NaN,gust:NaN})}});
  if(rows.length>=5)members.set(`spread_${member+1}`,rows);
 }
 if(members.size<3)return null;
 const model:EnsembleModel={id:definition.id,label:definition.label,metaId:definition.metaId,family:definition.family,independenceGroup:definition.independenceGroup,resolutionKm:definition.resolutionKm,updateHours:definition.updateHours,maxDays:definition.maxDays,distributionMode:'mean-spread'};
 return{model,members};
}
async function meanFallback(lat:number,lon:number,signal?:AbortSignal,priority:OpenMeteoPriority='normal'){
 const selected=selectedMeanModels(lat,lon),loaded=await loadEnsembleUnits(selected,6,async definition=>pseudoModelFromMeanSpread(await fetchEnsembleWeather(lat,lon,definition.maxDays,definition.id,signal,'temperature_2m,temperature_2m_spread,precipitation,precipitation_spread',priority),definition),signal);
 if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');const results=loaded.successes.map(row=>row.value),days=aggregateMembers(results),scenarios:EnsembleScenarioCluster[]=[],activeModels=results.map(result=>result.model),runs=await ensembleModelRunMetas(loaded.attempts,selected,signal);
 return{days,models:activeModels.map(model=>model.label),runs,scenarios};
}
function eventCivilEpoch(value:string){const match=String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);return match?Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5])):NaN}
function eventEnsembleCacheKey(lat:number,lon:number,date:string,startTime:string,endTime:string){return`${EVENT_ENSEMBLE_CACHE_PREFIX}${(Math.round(lat*20)/20).toFixed(2)}:${(Math.round(lon*20)/20).toFixed(2)}:${date}:${startTime}:${endTime}`}
function readEventEnsembleCache(lat:number,lon:number,date:string,startTime:string,endTime:string,maxAge=EVENT_ENSEMBLE_STALE_MS){try{const raw=localStorage.getItem(eventEnsembleCacheKey(lat,lon,date,startTime,endTime));if(!raw)return null;const parsed=JSON.parse(raw) as {created:number;value:EventEnsembleForecast},ageMs=Date.now()-Number(parsed.created);if(!parsed?.value||!Array.isArray(parsed.value.days)||!Number.isFinite(ageMs)||ageMs<0||ageMs>maxAge)return null;return{...parsed.value,cached:true,ageMs}}catch{return null}}
function writeEventEnsembleCache(lat:number,lon:number,date:string,startTime:string,endTime:string,value:EventEnsembleForecast){try{localStorage.setItem(eventEnsembleCacheKey(lat,lon,date,startTime,endTime),JSON.stringify({created:Date.now(),value}))}catch{}}
function eventMemberPrecipitationTotals(weather:Weather,date:string,startTime:string,endTime:string){
 const times=(weather.hourly?.time??[]).map(String),keys=Object.keys(weather.hourly??{}).filter(key=>/^precipitation(?:_member\d+)?$/.test(key));if(!times.length||!keys.length)return[] as number[];
 let start=eventCivilEpoch(`${date}T${startTime}`),end=eventCivilEpoch(`${date}T${endTime}`);if(!Number.isFinite(start)||!Number.isFinite(end))return[];if(end<=start)end=start+3600000;const duration=end-start,stamps=times.map(eventCivilEpoch),totals:number[]=[];
 for(const key of keys){const values=weather.hourly[key]??[];let total=0,coverage=0;for(let index=0;index<times.length;index++){const intervalEnd=stamps[index];if(!Number.isFinite(intervalEnd))continue;const previous=index>0?stamps[index-1]:intervalEnd-3600000,rawStep=intervalEnd-previous,step=Number.isFinite(rawStep)&&rawStep>=15*60000&&rawStep<=3*3600000?rawStep:3600000,intervalStart=intervalEnd-step,overlap=Math.max(0,Math.min(intervalEnd,end)-Math.max(intervalStart,start));if(overlap<=0)continue;const value=Number(values[index]);if(!Number.isFinite(value)||value<0||value>150)continue;total+=value*(overlap/step);coverage+=overlap}if(coverage>=duration*.7)totals.push(total)}
 return totals;
}
function aggregateEventPrecipitationProbability(rows:{model:EnsembleModel;totals:number[]}[],date:string,startTime:string,endTime:string):EventPrecipitationProbabilityAssessment|null{
 const usable=rows.filter(row=>row.totals.length>=2),groupCounts=new Map<string,number>();for(const row of usable)groupCounts.set(row.model.independenceGroup,(groupCounts.get(row.model.independenceGroup)??0)+1);const values:{value:number;weight:number}[]=[],groups=new Set<string>(),lead=eventLeadDayIndex(date);let memberCount=0;
 for(const row of usable){const divisor=Math.max(1,groupCounts.get(row.model.independenceGroup)??1),weight=modelDayWeight(row.model,lead,row.totals.length)/divisor;if(weight<=0)continue;groups.add(row.model.independenceGroup);memberCount+=row.totals.length;for(const total of row.totals)values.push({value:Math.max(0,total),weight})}
 if(groups.size<2||memberCount<10||values.length<6)return null;return{probability:weightedProbability(values,DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true),probabilitySignificant:weightedProbability(values,DWD_SIGNIFICANT_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true),memberCount,modelFamilyCount:groups.size,meanPrecipitation:weightedMean(values),source:'ensemble-members-dwd-event',start:startTime,end:endTime};
}
/**
 * Eventbezogene Ensembleauswertung mit denselben DWD-nahen Schwellen und
 * Modellfamilien-Gewichten wie die appweite Tageswahrscheinlichkeit. Die
 * Stundenakkumulationen werden nur für das konkrete Eventfenster summiert.
 */
export async function eventEnsembleForecast(lat:number,lon:number,date:string,startTime:string,endTime:string,signal?:AbortSignal,forceRefresh=false):Promise<EventEnsembleForecast>{
 const fresh=forceRefresh?null:readEventEnsembleCache(lat,lon,date,startTime,endTime,ENSEMBLE_FRESH_CACHE_MS);if(fresh)return fresh;const selected=selectedEnsembleModelsForEvent(lat,lon,date),lead=eventLeadDayIndex(date),loaded=await loadEnsembleUnits(selected,8,async model=>{const forecastDays=Math.max(1,Math.min(14,Math.ceil(Math.min(model.maxDays,lead+2)))),weather=await fetchEnsembleWeather(lat,lon,forecastDays,model.id,signal),modelResult=parseModelMembers(weather,model),totals=eventMemberPrecipitationTotals(weather,date,startTime,endTime);return modelResult||totals.length>=2?{model,modelResult,totals}:null},signal);if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 const fulfilled=loaded.successes.map(row=>row.value),results=fulfilled.map(row=>row.modelResult).filter(Boolean) as ModelResult[],days=aggregateMembers(results),precipitationProbability=aggregateEventPrecipitationProbability(fulfilled,date,startTime,endTime),models=fulfilled.map(row=>row.model.label),value={days,models,precipitationProbability} satisfies EventEnsembleForecast;
 if(days.length||precipitationProbability){writeEventEnsembleCache(lat,lon,date,startTime,endTime,value);return value}const stale=readEventEnsembleCache(lat,lon,date,startTime,endTime);if(stale)return stale;return value;
}

export async function ensembles(lat:number,lon:number,signal?:AbortSignal,priority:OpenMeteoPriority='normal'){
 const cache=readEnsembleCache(lat,lon);if(cache&&cache.ageMs<=ENSEMBLE_FRESH_CACHE_MS)return{days:cache.days,models:cache.models,runs:cache.runs,scenarios:cache.scenarios??[]};
 const selected=selectedEnsembleModels(lat,lon),loaded=await loadEnsembleUnits(selected,8,async model=>parseModelMembers(await fetchEnsembleWeather(lat,lon,model.maxDays,model.id,signal,undefined,priority),model),signal);if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 const results=loaded.successes.map(row=>row.value),rateLimitFailure=loaded.attempts.find(row=>row.status==='unavailable'&&isOpenMeteoRateLimitError(row.error));if(!results.length&&rateLimitFailure)throw rateLimitFailure.error;
 const activeModels=results.map(x=>x.model),days=aggregateMembers(results),scenarios=buildEnsembleScenarios(results,days),runs=await ensembleModelRunMetas(loaded.attempts,selected,signal);
 if(days.length>=7){const value={days:days.slice(0,14),models:activeModels.map(x=>x.label),runs,scenarios};writeEnsembleCache(lat,lon,value);return value}
 const fallback=await meanFallback(lat,lon,signal,priority);if(fallback.days.length>=5){writeEnsembleCache(lat,lon,fallback);return fallback}
 if(days.length){const value={days,models:activeModels.map(x=>x.label),runs,scenarios};writeEnsembleCache(lat,lon,value);return value}
 if(cache)return{days:cache.days,models:[...cache.models,'lokaler letzter erfolgreicher Stand'],runs:cache.runs,scenarios:cache.scenarios??[]};
 const failedCount=loaded.attempts.filter(row=>row.status==='unavailable'||row.status==='adapter-not-configured').length;throw new Error(`Keine ausreichend vollständigen Ensemble-Daten: ${failedCount} priorisierte Mitgliedermodell-Abrufe bzw. Adapterpfade waren nicht nutzbar; die offizielle Ensemble-Mittel-/Spread-Reserve lieferte ebenfalls keine auswertbare Tagesreihe.`);
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
export function icon(c:number,day=true){if(c===0)return day?'☀️':'🌙';if(c===1)return day?'🌤️':'🌙';if(c===2)return day?'⛅':'☁️🌙';if(c===3)return'☁️';if([45,48].includes(c))return'🌫️';if([51,53,55,56,57,80].includes(c))return day?'🌦️':'🌧️🌙';if([61,63,65,66,67,81,82].includes(c))return'🌧️';if([68,69,71,73,75,77,83,84,85,86].includes(c))return'🌨️';if([95,96,97,99].includes(c))return'⛈️';return day?'🌤️':'☁️🌙'}
export function wind(v:number,u:WindUnit){if(!Number.isFinite(v))return'–';if(u==='kmh')return`${Math.round(v*1.852)} km/h`;if(u==='ms')return`${formatDecimal(v*.514444,1,1)} m/s`;if(u==='mph')return`${Math.round(v*1.15078)} mph`;return`${Math.round(v)} kt`}

export type HazardLevel='yellow'|'orange'|'red'|'purple';
export type HazardItem={level:HazardLevel;title:string;text:string;metric?:string;validFrom?:string;validTo?:string;kind?:DwdWarningKind;lowerIntensity?:boolean};

const levelOrder:{[k in HazardLevel]:number}={purple:4,red:3,orange:2,yellow:1};
function dwdHazardClass(level:DwdWarningLevel):HazardLevel{return level===4?'purple':level===3?'red':level===2?'orange':'yellow'}

export function hazards(h:Hour[],_currentUv?:number,elevation=0,unit:WindUnit='kn'){
 const start=currentIndex(h),horizon=h.slice(start,start+96);if(!horizon.length)return[] as HazardItem[];
 return summarizeDwdWarnings(horizon,elevation,24).map(signal=>({level:dwdHazardClass(signal.level),title:signal.title,metric:formatDwdWarningValue(signal,unit),text:`${formatDwdWarningDetailWithDirection(signal,unit)} Automatisch aus dem Open-Meteo-Best-Match abgeleitet; keine amtliche Warnung.`,validFrom:signal.validFrom,validTo:signal.validTo,kind:signal.kind,lowerIntensity:signal.lowerIntensity})).sort((a,b)=>levelOrder[b.level]-levelOrder[a.level]);
}
