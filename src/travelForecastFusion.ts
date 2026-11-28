import {travelStrictBlend} from './travelPeriodIntegrity';
import {guardedOpenMeteoFetch} from './openMeteoGuard';
import {aggregateGefsUtcDays,consecutiveUtcWeek,ec46DailyApplicability,nativeFinite,seasonalTemperatureScenario,ec46DailyTemperatureScenario,NATIVE_DAILY_FORECAST_SOURCE,type GefsDayEvidence} from './travelForecastPeriodEvidence';
import {ensembles,forecast,mapDays,type Day,type EnsembleDay,type Location} from './weather';
import {loadSeasonalForecast,type DwdQualityMetric,type SeasonalForecastBundle,type SeasonalPointModel} from './seasonalForecast';
import {addDays,dateRange,daysBetween,travelClimateForDate,type TravelClimateDataset,type TravelClimateDay} from './travelPlanner';

export type TravelForecastSourceState='used'|'outside-horizon'|'unavailable';
export type TravelForecastSourceStatus={
 id:string;
 label:string;
 state:TravelForecastSourceState;
 detail:string;
 parameters:string[];
 coverage?:string;
};
export type TravelForecastFusionResult={
 dataset:TravelClimateDataset;
 sourceMode:'Nur Klimatologie'|'Modellprognose + Klima'|'Witterungstrend + Klima'|'Saisontrend + Klima'|'Prognose + Witterung + Klima';
 sourceDetail:string;
 modelSharePct:number;
 modelFamilyCount:number;
 modelCoveredDays:number;
 modelSources:string[];
 sourceStatuses:TravelForecastSourceStatus[];
 warnings:string[];
};

type WeeklyPayload={weekly?:Record<string,unknown>;weekly_units?:Record<string,string>;model?:string;error?:boolean;reason?:string};
type GefsPayload={hourly?:Record<string,unknown>;hourly_units?:Record<string,string>;utc_offset_seconds?:number;model?:string;error?:boolean;reason?:string};
type GefsDaily=GefsDayEvidence;
type WeekSignal={start:string;end:string;tempMaxAnomaly?:number;tempMinAnomaly?:number;tempMeanAnomaly?:number;precipitationAnomaly?:number;sunshineAnomalyHours?:number;windAnomalyKn?:number;cloudAnomalyPct?:number;snowfallAnomalyCm?:number;snowDepthAnomalyCm?:number};

const EC46_ENDPOINT='https://seasonal-api.open-meteo.com/v1/seasonal';
const ENSEMBLE_ENDPOINT='https://ensemble-api.open-meteo.com/v1/ensemble';
const MEDIUM_LAST_LEAD=13;
const SUBSEASONAL_LAST_LEAD=45;
const MAX_SOURCE_WAIT_MS=18000;

function localToday(){try{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),get=(type:string)=>parts.find(part=>part.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`}catch{return new Date().toISOString().slice(0,10)}}
function finite(value:unknown){return nativeFinite(value)}
function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
function blend(base:number,target:number,share:number){return travelStrictBlend(base,target,share)}
function dateKey(value:string){return value.slice(5,10)}
function monthKey(value:string){return value.slice(0,7)}
function mean(values:(number|undefined|null)[]){const finiteValues=values.filter((value):value is number=>typeof value==='number'&&Number.isFinite(value));return finiteValues.length?finiteValues.reduce((sum,value)=>sum+value,0)/finiteValues.length:undefined}
function modelShareForMedium(lead:number){return clamp(.94-(Math.max(0,lead)*.014),.75,.94)}
function modelShareForSubseasonal(lead:number){const position=clamp((lead-14)/31,0,1);return .62*(1-position)+.16*position}
function modelShareForSeasonal(lead:number){const position=clamp((lead-46)/74,0,1);return .16*(1-position)+.06*position}
function sourceTimeout(parent:AbortSignal,label:string){const controller=new AbortController(),abort=()=>controller.abort(parent.reason??new DOMException('Abgebrochen','AbortError')),timer=globalThis.setTimeout(()=>controller.abort(new DOMException(`${label} hat das Zeitbudget überschritten.`,'TimeoutError')),MAX_SOURCE_WAIT_MS);if(parent.aborted)abort();else parent.addEventListener('abort',abort,{once:true});return{signal:controller.signal,cleanup(){globalThis.clearTimeout(timer);parent.removeEventListener('abort',abort)}}}
async function fetchJson<T>(url:string,signal:AbortSignal){const response=await guardedOpenMeteoFetch(url,{signal,cache:'default',headers:{Accept:'application/json'}},{priority:'normal'}),payload=await response.json().catch(()=>({}));if(!response.ok||(payload as {error?:boolean}).error)throw new Error(String((payload as {reason?:string}).reason||`Open-Meteo HTTP ${response.status}`));return payload as T}
function valueAt(section:Record<string,unknown>|undefined,key:string,index:number){const values=section?.[key];return Array.isArray(values)?finite(values[index]):undefined}
function unit(section:Record<string,string>|undefined,key:string){return String(section?.[key]||'').toLowerCase()}
function anomalyValue(payload:WeeklyPayload,key:string,index:number,expected:'temperature'|'precipitation'|'sunshine'|'wind'|'cloud'|'snowfall'|'snow-depth'){
 const value=valueAt(payload.weekly,key,index);if(value===undefined)return undefined;const u=unit(payload.weekly_units,key);
 if(expected==='temperature')return /°c|celsius|kelvin|\bk\b/.test(u)||!u?value:undefined;
 if(expected==='precipitation')return /mm|millimet/.test(u)||!u?value:undefined;
 if(expected==='sunshine'){if(/hour|\bh\b/.test(u))return value;if(/second|\bs\b/.test(u)||!u)return value/3600;return undefined}
 if(expected==='wind'){if(/kn|knot/.test(u)||!u)return value;if(/km\/h|kmh/.test(u))return value/1.852;if(/m\/s|ms/.test(u))return value/0.514444;return undefined}
 if(expected==='cloud')return /%|percent/.test(u)||!u?value:undefined;
 if(expected==='snowfall'){if(/cm|centimet/.test(u)||!u)return value;if(/mm|millimet/.test(u))return value/10;if(/meter|metre|\bm\b/.test(u))return value*100;return undefined}
 if(expected==='snow-depth'){if(/cm|centimet/.test(u))return value;if(/meter|metre|\bm\b/.test(u)||!u)return value*100;return undefined}
 return undefined;
}

async function fetchEc46Weeks(location:Location,signal:AbortSignal):Promise<WeekSignal[]>{
 const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),models:'ecmwf_ec46_ensemble_mean',forecast_days:'46',timezone:'GMT',wind_speed_unit:'kn',cell_selection:'nearest',weekly:['temperature_2m_anomaly','temperature_max6h_2m_anomaly','temperature_min6h_2m_anomaly','precipitation_anomaly','sunshine_duration_anomaly','cloud_cover_anomaly','wind_speed_10m_anomaly','snowfall_anomaly','snow_depth_anomaly'].join(',')});
 const payload=await fetchJson<WeeklyPayload>(`${EC46_ENDPOINT}?${params}`,signal),times=Array.isArray(payload.weekly?.time)?payload.weekly!.time.map(String):[];
 return times.map((start,index)=>({start,end:addDays(start,6),tempMeanAnomaly:anomalyValue(payload,'temperature_2m_anomaly',index,'temperature'),tempMaxAnomaly:anomalyValue(payload,'temperature_max6h_2m_anomaly',index,'temperature'),tempMinAnomaly:anomalyValue(payload,'temperature_min6h_2m_anomaly',index,'temperature'),precipitationAnomaly:anomalyValue(payload,'precipitation_anomaly',index,'precipitation'),sunshineAnomalyHours:anomalyValue(payload,'sunshine_duration_anomaly',index,'sunshine'),windAnomalyKn:anomalyValue(payload,'wind_speed_10m_anomaly',index,'wind'),cloudAnomalyPct:anomalyValue(payload,'cloud_cover_anomaly',index,'cloud'),snowfallAnomalyCm:anomalyValue(payload,'snowfall_anomaly',index,'snowfall'),snowDepthAnomalyCm:anomalyValue(payload,'snow_depth_anomaly',index,'snow-depth')})).filter(row=>row.start&&row.end);
}

async function fetchGefsDaily(location:Location,signal:AbortSignal):Promise<GefsDaily[]>{
 const params=new URLSearchParams({latitude:String(location.latitude),longitude:String(location.longitude),models:'ncep_gefs05_ensemble_mean',forecast_days:'35',timezone:'GMT',temperature_unit:'celsius',precipitation_unit:'mm',wind_speed_unit:'kn',hourly:'temperature_2m,precipitation'});
 const payload=await fetchJson<GefsPayload>(ENSEMBLE_ENDPOINT+'?'+params.toString(),signal);
 return aggregateGefsUtcDays(payload.hourly,payload.hourly_units,payload.utc_offset_seconds);
}

function weekDates(week:WeekSignal){return dateRange(week.start,week.end)}
function sign(value:number|undefined,threshold:number){return value===undefined||Math.abs(value)<threshold?0:value>0?1:-1}
function gefsCorroboration(week:WeekSignal,gefs:GefsDaily[],dataset:TravelClimateDataset){
 const dates=weekDates(week);
 if(!consecutiveUtcWeek(dates))return{factor:1,familyCount:1};
 const byDate=new Map(gefs.map(row=>[row.date,row]));
 const model=dates.map(date=>byDate.get(date));
 const climate=dates.map(date=>travelClimateForDate(dataset,date));
 if(model.some(row=>!row?.temperatureComplete)||climate.some(row=>!row||!Number.isFinite(row.nativeMean2mClimatology)))return{factor:1,familyCount:1};
 const modelMean=mean(model.map(row=>row?.mean)),climateMean=mean(climate.map(row=>row?.nativeMean2mClimatology));
 const ecTemp=week.tempMeanAnomaly;
 if(ecTemp===undefined||modelMean===undefined||climateMean===undefined)return{factor:1,familyCount:1};
 const gefsTemp=modelMean-climateMean;
 const agreement=sign(ecTemp,.35)*sign(gefsTemp,.35);
 // Compare GEFS 2m MEAN with a source-native ERA5 daily 2m MEAN only.
 // Missing provenance -> neutral factor and one family; Tmax/Tmin midpoint is NOT a mean.
 // No precipitation corroboration until EC46 weekly amount semantics are proven.
 return{factor:agreement>0?1.08:agreement<0?.78:1,familyCount:2};
}
function applyEc46Week(days:Record<string,TravelClimateDay>,dataset:TravelClimateDataset,week:WeekSignal,from:string,to:string,gefs:GefsDaily[],today:string){
 const dates=weekDates(week);
 // The one native EC46 weekly record is not seven separately supplied daily records.
 // We only distribute a conservative SHIFT of comparable weekly MEAN fields on
 // the local daily climate; those daily values are *scenarios*, not event forecasts.
 if(!consecutiveUtcWeek(dates)||dates.some(date=>daysBetween(today,date)<0||daysBetween(today,date)>SUBSEASONAL_LAST_LEAD))return{covered:0,shareTotal:0,familyCount:0};
 const selected=dates.filter(date=>date>=from&&date<=to&&daysBetween(today,date)>=14&&Boolean(travelClimateForDate(dataset,date))&&Boolean(days[dateKey(date)]));
 if(!selected.length)return{covered:0,shareTotal:0,familyCount:0};
 const lead=mean(dates.map(date=>daysBetween(today,date)))??14;
 const corroboration=gefsCorroboration(week,gefs,dataset);
 const share=clamp(modelShareForSubseasonal(lead)*corroboration.factor,.12,.66);
 let applied=0;
 for(const date of selected){
  const key=dateKey(date),base=days[key],eligibility=ec46DailyApplicability(week,base);
  if(!eligibility.temperature&&!eligibility.cloud&&!eligibility.snowDepth)continue;
  const day={...base};
  // Weekly 2m mean-temperature anomaly is a scenario location shift of the
  // climate DAILY temperature distribution. This is NOT the 6h max/min anomaly
  // and does not provide weather for a specific date.
  if(eligibility.temperature){
   const shifted=ec46DailyTemperatureScenario(day,week,share);
   if(shifted)Object.assign(day,shifted);
  }
  // Wind-only weeks do not count as applied daily travel evidence: the UI and
  // rankings use daily maximum wind, not this separately tracked mean.
  if(eligibility.wind)day.windMean=Math.max(0,Number(day.windMean)+week.windAnomalyKn!*share);
  if(eligibility.cloud)day.cloudMean=clamp(day.cloudMean+week.cloudAnomalyPct!*share,0,100);
  if(eligibility.snowDepth)day.snowDepthMean=Math.max(0,Number(day.snowDepthMean)+week.snowDepthAnomalyCm!*share);
  // No EC46 weekly precipitation/sunshine/snowfall -> synthetic DAILY PoP/amount.
  day.forecastSource='EC46-Wochenanomalie + ERA5-Tagesklima';
  day.forecastShare=share;
  days[key]=day;
  applied++;
 }
 return{covered:applied,shareTotal:share*applied,familyCount:applied?corroboration.familyCount:0};
}

export function mediumDay(day:TravelClimateDay,ensemble:EnsembleDay|undefined,best:Day|undefined,lead:number){const share=modelShareForMedium(lead),maxTarget=finite(ensemble?.maxMean)??finite(best?.max),minTarget=finite(ensemble?.minMean)??finite(best?.min),precipTarget=finite(ensemble?.precipitationMean)??finite(best?.precipitation),sunTarget=finite(ensemble?.sunshineDurationMean)!==undefined?Number(ensemble!.sunshineDurationMean)/3600:finite(best?.sunshineDuration)!==undefined?Number(best!.sunshineDuration)/3600:undefined,windTarget=finite(ensemble?.windMean)??finite(best?.wind),snowTarget=finite(best?.snowfall),familyCount=Math.max(1,Number(ensemble?.modelCount)||0),sources=[...(ensemble?.modelSummaries??[]).map(row=>row.family||row.label),best?.weatherSourceLabel].filter(Boolean) as string[];const result={...day};
 if(maxTarget!==undefined)result.maxMean=blend(day.maxMean,maxTarget,share);if(minTarget!==undefined)result.minMean=blend(day.minMean,minTarget,share);result.meanMean=Number.isFinite(result.maxMean)&&Number.isFinite(result.minMean)?(result.maxMean+result.minMean)/2:NaN;if(ensemble){result.maxP25=blend(day.maxP25,ensemble.maxQ25,share);result.maxP75=blend(day.maxP75,ensemble.maxQ75,share);result.minP25=blend(day.minP25,ensemble.minQ25,share);result.minP75=blend(day.minP75,ensemble.minQ75,share)}
 if(precipTarget!==undefined)result.precipitationMean=Math.max(0,blend(day.precipitationMean,precipTarget,share));/* Retain climate >=1 mm/day frequency: generic PoP thresholds/intervals are not equivalent. */if(sunTarget!==undefined)result.sunshineMeanHours=clamp(blend(day.sunshineMeanHours,sunTarget,share),0,day.daylightMeanHours||24);if(windTarget!==undefined)result.windMaxMean=Math.max(0,blend(day.windMaxMean,windTarget,share));if(snowTarget!==undefined)result.snowfallMean=Math.max(0,blend(day.snowfallMean,snowTarget,share));if(best)result.weatherCode=best.code;
 result.forecastSource=NATIVE_DAILY_FORECAST_SOURCE;result.forecastShare=share;return{day:result,share,familyCount,sources:[...new Set(sources)]};
}

function qualityFactor(metric:DwdQualityMetric|undefined){
 if(metric?.classification==='better')return 1.08;
 if(metric?.classification==='similar')return 1;
 if(metric?.classification==='worse')return .78;
 return .92;
}
function dwdSignal(bundle:SeasonalForecastBundle,date:string,kind:'temperature'|'precipitation'){const period=bundle.dwdPerspective?.periods.find(row=>row.startDate&&row.endDate&&date>=row.startDate&&date<=row.endDate);if(!period)return undefined;return kind==='temperature'?{value:finite(period.temperatureAnomaly),weight:qualityFactor(period.temperatureQuality)}:{value:finite(period.precipitationAnomalyPercent),weight:qualityFactor(period.precipitationQuality)}}
function seasonalModelMonth(model:SeasonalPointModel,date:string){return model.months.find(month=>monthKey(month.date)===monthKey(date))}
function seasonalSignals(bundle:SeasonalForecastBundle,date:string){const modelRows=bundle.pointModels.map(model=>({model,month:seasonalModelMonth(model,date)})).filter(row=>row.month),tempRows=modelRows.filter(row=>finite(row.month?.temperatureAnomaly)!==undefined),temp=mean(tempRows.map(row=>finite(row.month?.temperatureAnomaly))),precipPct=mean(modelRows.map(row=>{const direct=finite(row.month?.precipitationAnomalyPercent);if(direct!==undefined)return direct;const anomaly=finite(row.month?.precipitationAnomaly),climate=finite(row.month?.climatePrecipitation);return anomaly!==undefined&&climate!==undefined&&Math.abs(climate)>.05?anomaly/climate*100:undefined})),dwdTemp=dwdSignal(bundle,date,'temperature'),dwdPrecip=dwdSignal(bundle,date,'precipitation'),tempFinal=temp===undefined?dwdTemp?.value:dwdTemp?.value===undefined?temp:temp*.8+dwdTemp.value*.2*dwdTemp.weight,precipFinal=precipPct===undefined?dwdPrecip?.value:dwdPrecip?.value===undefined?precipPct:precipPct*.85+dwdPrecip.value*.15*dwdPrecip.weight;
 return{temperatureAnomaly:tempFinal,precipitationAnomalyPercent:precipFinal,familyCount:tempRows.length,labels:tempRows.map(row=>row.model.family),familyIds:tempRows.map(row=>row.model.independenceKey||row.model.family),dwdUsed:Boolean(dwdTemp?.value!==undefined)};
}

export async function loadTravelForecastFusion(location:Location,climate:TravelClimateDataset,start:string,end:string,signal:AbortSignal):Promise<TravelForecastFusionResult>{
 const today=localToday(),startLead=daysBetween(today,start),endLead=daysBetween(today,end),days={...climate.days},sourceStatuses:TravelForecastSourceStatus[]=[],warnings:string[]=[],sourceLabels=new Set<string>(),families=new Set<string>();let covered=0,shareTotal=0,usedMedium=false,usedSub=false,usedSeasonal=false;
 const needsMedium=endLead>=0&&startLead<=MEDIUM_LAST_LEAD,needsSub=endLead>=14&&startLead<=SUBSEASONAL_LAST_LEAD,needsSeasonal=endLead>=46;
 let bestDays:Day[]=[],ensembleDays:EnsembleDay[]=[];
 if(needsMedium){const budget=sourceTimeout(signal,'Mittelfristmodelle');try{const [best,eps]=await Promise.allSettled([forecast(location.latitude,location.longitude,budget.signal,{priority:'normal'}),ensembles(location.latitude,location.longitude,budget.signal,'normal',location.timezone)]);if(best.status==='fulfilled')bestDays=mapDays(best.value);if(eps.status==='fulfilled')ensembleDays=eps.value.days;if(!bestDays.length&&!ensembleDays.length)throw new Error('keine aktuelle Modellprognose verfügbar');const bestMap=new Map(bestDays.map(row=>[row.date,row])),ensembleMap=new Map(ensembleDays.map(row=>[row.date,row]));for(const date of dateRange(start,end)){const lead=daysBetween(today,date);if(lead<0||lead>MEDIUM_LAST_LEAD)continue;const base=days[dateKey(date)],ensemble=ensembleMap.get(date),bestDay=bestMap.get(date);if(!base||(!ensemble&&!bestDay))continue;const fused=mediumDay(base,ensemble,bestDay,lead);days[dateKey(date)]=fused.day;covered++;shareTotal+=fused.share;usedMedium=true;fused.sources.forEach(source=>sourceLabels.add(source));if(ensemble)for(const row of ensemble.modelSummaries??[])families.add(row.independenceGroup||row.family||row.label);else families.add('best-match')}sourceStatuses.push({id:'medium-ensemble',label:'Operationelle Mittelfrist-Ensembles',state:'used',coverage:'bis Tag 14',parameters:['Temperatur','Niederschlag','Sonne','Wind','Wetterart'],detail:`${ensembleDays.length?'Unabhängige Ensemblefamilien werden über den bestehenden MID-Ensemblekern gewichtet.':'Best Match dient als Fallback, weil die Ensembleauswertung nicht vollständig verfügbar war.'} Regentage (≥ 1 mm/Tag) bleiben klimatologisch, solange keine schwellen- und intervallgleiche Modellwahrscheinlichkeit belegt ist.`})}catch(error){if(signal.aborted)throw error;warnings.push(error instanceof Error?error.message:String(error));sourceStatuses.push({id:'medium-ensemble',label:'Operationelle Mittelfrist-Ensembles',state:'unavailable',coverage:'bis Tag 14',parameters:['Temperatur','Niederschlag','Sonne','Wind','Wetterart'],detail:'Aktuelle Mittelfristdaten waren beim Abruf nicht verfügbar; Klimatologie bleibt erhalten.'})}finally{budget.cleanup()}}else sourceStatuses.push({id:'medium-ensemble',label:'Operationelle Mittelfrist-Ensembles',state:'outside-horizon',coverage:'bis Tag 14',parameters:['Temperatur','Niederschlag','Sonne','Wind','Wetterart'],detail:'Der gewählte Reisezeitraum liegt außerhalb dieses Prognosehorizonts.'});

 let ec46:WeekSignal[]=[],gefs:GefsDaily[]=[];
 if(needsSub){const ecBudget=sourceTimeout(signal,'ECMWF EC46'),gefsBudget=sourceTimeout(signal,'NOAA GEFS');try{const [ec,gefsReply]=await Promise.allSettled([fetchEc46Weeks(location,ecBudget.signal),fetchGefsDaily(location,gefsBudget.signal)]);if(ec.status==='fulfilled')ec46=ec.value;if(gefsReply.status==='fulfilled')gefs=gefsReply.value;if(!ec46.length)throw new Error('ECMWF EC46-Wochenanomalien sind derzeit nicht verfügbar.');let localCovered=0,localShare=0,maxFamilies=1;for(const week of ec46){const applied=applyEc46Week(days,climate,week,start,end,gefs,today);localCovered+=applied.covered;localShare+=applied.shareTotal;maxFamilies=Math.max(maxFamilies,applied.familyCount)}covered+=localCovered;shareTotal+=localShare;if(localCovered){usedSub=true;sourceLabels.add('ECMWF EC46');families.add('ecmwf-ec46');if(maxFamilies>1){sourceLabels.add('NOAA GEFS');families.add('ncep-gefs')}}else warnings.push('EC46-Wochenfelder ohne anwendbares Modell-Mittel: Reise bleibt klimatologisch.');sourceStatuses.push({id:'ec46',label:'ECMWF EC46 · Wochenanomalien',state:localCovered?'used':'unavailable',coverage:'Tag 15–46',parameters:['Wochenmitteltemperatur','mittlere Windgeschwindigkeit','mittlere Bewölkung','mittlere Schneehöhe'],detail:localCovered?'EC46-Wochenmittel werden als schwach gewichtete Klimaszenarien dargestellt. Native 6h-Temperatur-Extreme sind NICHT Tages-Tmax/Tmin; Tagesregen/PoP/Sonnenschein/Neuschnee bleiben klimatologisch, keine tagesgenauen Ereignisprognosen.':'Keine auf die Reise anwendbare native Wochenmittel-Anomalie; nur die Klimareferenz wird angezeigt.'});sourceStatuses.push({id:'gefs-corroboration',label:'NOAA GEFS · unabhängige Bestätigung',state:maxFamilies>1&&localCovered?'used':'unavailable',coverage:'bis etwa Tag 35',parameters:['Temperatur'],detail:maxFamilies>1?'Vollständige GEFS-Temperatur-Tageswerte bestätigen oder relativieren das EC46-Wochensignal; Regen wird mangels belegter vergleichbarer Wochen-Akkumulation nicht zur Gewichtung herangezogen.':'Keine vollständige GEFS-Woche mit vergleichbarer Temperatur-Originaldatenqualität für eine unabhängige Bestätigung.'});if(maxFamilies>1)families.add('ncep-gefs')}catch(error){if(signal.aborted)throw error;warnings.push(error instanceof Error?error.message:String(error));sourceStatuses.push({id:'ec46',label:'ECMWF EC46 · Wochenanomalien',state:'unavailable',coverage:'Tag 15–46',parameters:['Temperatur','Niederschlag','Sonne','Wind','Bewölkung','Schnee'],detail:'Witterungssignal war beim Abruf nicht verfügbar; Klimatologie bleibt als Fallback erhalten.'})}finally{ecBudget.cleanup();gefsBudget.cleanup()}}else{sourceStatuses.push({id:'ec46',label:'ECMWF EC46 · Wochenanomalien',state:'outside-horizon',coverage:'Tag 15–46',parameters:['Temperatur','Niederschlag','Sonne','Wind','Bewölkung','Schnee'],detail:'Der gewählte Reisezeitraum liegt außerhalb dieses Prognosehorizonts.'});sourceStatuses.push({id:'gefs-corroboration',label:'NOAA GEFS · unabhängige Bestätigung',state:'outside-horizon',coverage:'bis etwa Tag 35',parameters:['Temperatur','Niederschlag'],detail:'Für den gewählten Zeitraum nicht erforderlich.'})}

 let seasonal:SeasonalForecastBundle|null=null;
 if(needsSeasonal){const budget=sourceTimeout(signal,'Saisonmodelle');try{seasonal=await loadSeasonalForecast(location.latitude,location.longitude,budget.signal);let localCovered=0,localShare=0;const actualSeasonalFamilies=new Set<string>();for(const date of dateRange(start,end)){const lead=daysBetween(today,date);if(lead<46)continue;const base=days[dateKey(date)];if(!base)continue;const signalRow=seasonalSignals(seasonal,date);if(signalRow.temperatureAnomaly===undefined)continue;const share=modelShareForSeasonal(lead),day=seasonalTemperatureScenario(base,signalRow.temperatureAnomaly,share);if(!day)continue;/* Native MONTHLY precipitation anomaly has no calibrated DAILY rain amount or wet-day probability. Retain original daily climatology. */day.forecastSource='Saisonales Monatsmittel + ERA5-Tagesklima';day.forecastShare=share;days[dateKey(date)]=day;localCovered++;localShare+=share;signalRow.labels.forEach(label=>sourceLabels.add(label));signalRow.familyIds.forEach(id=>actualSeasonalFamilies.add(id));if(signalRow.dwdUsed){sourceLabels.add('DWD GCFS2.2 / EPISODES');actualSeasonalFamilies.add('dwd-gcfs2')}}covered+=localCovered;shareTotal+=localShare;if(localCovered){usedSeasonal=true;actualSeasonalFamilies.forEach(id=>families.add(id))}sourceStatuses.push({id:'seasonal-mme',label:'Saison-Multi-Modell',state:localCovered?'used':'unavailable',coverage:'ab Tag 47',parameters:['Temperatur-Monatstrend'],detail:localCovered?`${actualSeasonalFamilies.size} tatsächlich genutzte unabhängige Temperatur-Modellfamilien; Temperatur-Monatsanomalien werden als Klimaszenario gedämpft übertragen. Monatliche Niederschlagsanomalien erzeugen ausdrücklich KEINE täglichen Regenmengen oder Regenwahrscheinlichkeiten.`:'Für die gewählten Monate lag kein auf Tages-Klimaszenarien anwendbares Temperatur-Monatssignal vor; Monatsregen ist keine tägliche PoP.'});sourceStatuses.push({id:'dwd-seasonal',label:'DWD GCFS2.2 / EPISODES',state:seasonal.dwdPerspective?'used':seasonal.dwdEpisodesStatus.state==='outside-domain'?'outside-horizon':'unavailable',coverage:'Deutschland · saisonal/subseasonal',parameters:['Temperatur','Niederschlag'],detail:seasonal.dwdPerspective?'DWD-Anomalien werden mit den vorhandenen Gütemaßen als regionaler Qualitätsanker verwendet, nicht als zusätzliche unabhängige ECMWF-Stimme.':seasonal.dwdEpisodesStatus.detail})}catch(error){if(signal.aborted)throw error;warnings.push(error instanceof Error?error.message:String(error));sourceStatuses.push({id:'seasonal-mme',label:'Saison-Multi-Modell',state:'unavailable',coverage:'ab Tag 47',parameters:['Temperatur','Niederschlag'],detail:'Saisonmodelle waren beim Abruf nicht rechtzeitig verfügbar; Klimatologie bleibt erhalten.'})}finally{budget.cleanup()}}else sourceStatuses.push({id:'seasonal-mme',label:'Saison-Multi-Modell',state:'outside-horizon',coverage:'ab Tag 47',parameters:['Temperatur','Niederschlag'],detail:'Der gewählte Reisezeitraum liegt noch vor dem saisonalen Anwendungsbereich.'});

 const sourceMode=usedMedium&&usedSub?'Prognose + Witterung + Klima':usedMedium?'Modellprognose + Klima':usedSub?'Witterungstrend + Klima':usedSeasonal?'Saisontrend + Klima':'Nur Klimatologie',modelSharePct=covered?Math.round(shareTotal/covered*100):0,modelSources=[...sourceLabels].sort((a,b)=>a.localeCompare(b,'de')),modelFamilyCount=families.size,sourceDetail=sourceMode==='Nur Klimatologie'?`Keine aktuelle Modellquelle deckte den ausgewerteten Zeitraum belastbar ab; ${climate.source} (${climate.referencePeriod}) bleibt die Basis.`:`${covered} Reisetage werden durch aktuelle Modell-/Anomaliesignale ergänzt; Klimatologie ${climate.referencePeriod} bleibt als lokaler, mit dem Horizont zunehmend dominanter Referenzrahmen.`;
 return{dataset:{...climate,days,source:`${sourceMode} · ${climate.source}`},sourceMode,sourceDetail,modelSharePct,modelFamilyCount,modelCoveredDays:covered,modelSources,sourceStatuses,warnings};
}
