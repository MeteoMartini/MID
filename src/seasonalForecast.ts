export type SeasonalMonth={
 date:string;
 label:string;
 temperatureMean:number|null;
 temperatureAnomaly:number|null;
 precipitationMean:number|null;
 precipitationAnomaly:number|null;
 precipitationAnomalyPercent:number|null;
 climateTemperature:number|null;
 climatePrecipitation:number|null;
};

export type SeasonalPointModel={
 id:string;
 label:string;
 provider:string;
 horizonMonths:number;
 runLabel:string;
 source:string;
 months:SeasonalMonth[];
};

export type C3sSeasonalModel={
 id:string;
 label:string;
 system:string;
 horizon:string;
 currentRun:string;
 region:'global';
};

export type SeasonalForecastBundle={
 generatedAt:string;
 pointModels:SeasonalPointModel[];
 c3sModels:C3sSeasonalModel[];
 c3sReferencePeriod:string;
 c3sCatalogueUrl:string;
 notes:string[];
};

const ENDPOINT='https://seasonal-api.open-meteo.com/v1/seasonal';
const C3S_CATALOGUE='https://charts.ecmwf.int/catalogue/packages/c3s_seasonal/';
const MONTHLY_VARIABLES=['temperature_2m_mean','temperature_2m_anomaly','precipitation_mean','precipitation_anomaly'];

type SeasonalApiPayload={
 model?:string;
 monthly?:Record<string,unknown>;
 monthly_units?:Record<string,string>;
};

function finite(value:unknown):number|null{const numeric=Number(value);return Number.isFinite(numeric)?numeric:null}
function averageSeries(payload:Record<string,unknown>,base:string,length:number){
 const direct=Array.isArray(payload[base])?payload[base] as unknown[]:null;
 if(direct)return Array.from({length},(_,index)=>finite(direct[index]));
 const memberKeys=Object.keys(payload).filter(key=>key===base||key.startsWith(`${base}_member`));
 if(!memberKeys.length)return Array.from({length},()=>null as number|null);
 return Array.from({length},(_,index)=>{const values=memberKeys.map(key=>Array.isArray(payload[key])?finite((payload[key] as unknown[])[index]):null).filter((value):value is number=>value!==null);return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null});
}
function monthLabel(date:string){try{return new Intl.DateTimeFormat('de-DE',{month:'short',year:'2-digit',timeZone:'UTC'}).format(new Date(`${date.slice(0,7)}-15T12:00:00Z`))}catch{return date.slice(0,7)}}
function modelRunLabel(date=new Date()){const year=date.getUTCFullYear(),month=date.getUTCMonth(),available=date.getUTCDate()>=5?new Date(Date.UTC(year,month,1)):new Date(Date.UTC(year,month-1,1));return new Intl.DateTimeFormat('de-DE',{month:'short',year:'numeric',timeZone:'UTC'}).format(available)}
function currentC3sRun(releaseDay:number,date=new Date()){const year=date.getUTCFullYear(),month=date.getUTCMonth(),available=date.getUTCDate()>=releaseDay?new Date(Date.UTC(year,month,1)):new Date(Date.UTC(year,month-1,1));return new Intl.DateTimeFormat('de-DE',{month:'short',year:'numeric',timeZone:'UTC'}).format(available)}

export function c3sSeasonalModels(now=new Date()):C3sSeasonalModel[]{
 const ecmwfRun=currentC3sRun(6,now),otherRun=currentC3sRun(10,now);
 return[
  {id:'ecmwf',label:'ECMWF',system:'SEAS5 · System 51',horizon:'bis 215 Tage',currentRun:ecmwfRun,region:'global'},
  {id:'ukmo',label:'Met Office',system:'GloSea · System 610',horizon:'bis 215 Tage',currentRun:otherRun,region:'global'},
  {id:'meteofrance',label:'Météo-France',system:'System 9',horizon:'7 Kalendermonate',currentRun:otherRun,region:'global'},
  {id:'dwd',label:'DWD',system:'GCFS2.2 · System 22',horizon:'6 Monate',currentRun:otherRun,region:'global'},
  {id:'cmcc',label:'CMCC',system:'SPS4 · System 4',horizon:'184 Tage',currentRun:otherRun,region:'global'},
  {id:'ncep',label:'NCEP',system:'CFSv2 · System 2',horizon:'bis 215 Tage',currentRun:otherRun,region:'global'},
  {id:'jma',label:'JMA',system:'CPS4 · System 4',horizon:'saisonal',currentRun:otherRun,region:'global'},
  {id:'eccc',label:'ECCC',system:'System 4/5',horizon:'saisonal',currentRun:otherRun,region:'global'},
  {id:'bom',label:'BOM',system:'ACCESS-S2 · System 2',horizon:'saisonal',currentRun:otherRun,region:'global'}
 ];
}

function parsePointModel(payload:SeasonalApiPayload):SeasonalPointModel|null{
 const monthly=payload.monthly??{},time=Array.isArray(monthly.time)?monthly.time.map(String):[];
 if(!time.length)return null;
 const temperatureMean=averageSeries(monthly,'temperature_2m_mean',time.length),temperatureAnomaly=averageSeries(monthly,'temperature_2m_anomaly',time.length),precipitationMean=averageSeries(monthly,'precipitation_mean',time.length),precipitationAnomaly=averageSeries(monthly,'precipitation_anomaly',time.length);
 const months=time.map((date,index)=>{
  const tMean=temperatureMean[index],tAnomaly=temperatureAnomaly[index],pMean=precipitationMean[index],pAnomaly=precipitationAnomaly[index],climateTemperature=tMean!==null&&tAnomaly!==null?tMean-tAnomaly:null,climatePrecipitation=pMean!==null&&pAnomaly!==null?pMean-pAnomaly:null,precipitationAnomalyPercent=pAnomaly!==null&&climatePrecipitation!==null&&Math.abs(climatePrecipitation)>.03?Math.max(-300,Math.min(300,pAnomaly/climatePrecipitation*100)):null;
  return{date,label:monthLabel(date),temperatureMean:tMean,temperatureAnomaly:tAnomaly,precipitationMean:pMean,precipitationAnomaly:pAnomaly,precipitationAnomalyPercent,climateTemperature,climatePrecipitation};
 }).slice(0,7);
 return{id:'ecmwf-seasonal',label:'ECMWF Seasonal · SEAS5',provider:'ECMWF · Open-Meteo Seasonal API',horizonMonths:months.length,runLabel:modelRunLabel(),source:'Lokale Monatsanomalien aus dem ECMWF-Saisonsystem; der Langfristhorizont basiert auf SEAS5 und seinem modellkonsistenten Hindcast-Klima.',months};
}

async function fetchPayload(latitude:number,longitude:number,signal:AbortSignal,model?:string){
 const params=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),timezone:'GMT',forecast_days:'217',monthly:MONTHLY_VARIABLES.join(','),cell_selection:'land'});if(model)params.set('models',model);
 const response=await fetch(`${ENDPOINT}?${params}`,{signal,cache:'no-store'});if(!response.ok)throw new Error(`Seasonal API HTTP ${response.status}`);return await response.json() as SeasonalApiPayload;
}

export async function loadSeasonalForecast(latitude:number,longitude:number,signal:AbortSignal):Promise<SeasonalForecastBundle>{
 const pointModel=parsePointModel(await fetchPayload(latitude,longitude,signal));
 return{generatedAt:new Date().toISOString(),pointModels:pointModel?[pointModel]:[],c3sModels:c3sSeasonalModels(),c3sReferencePeriod:'C3S: gemeinsamer Hindcast-Referenzzeitraum 1993–2016; ECMWF/Open-Meteo: modellkonsistente SEAS5-Hindcast-Klimatologie.',c3sCatalogueUrl:C3S_CATALOGUE,notes:['Saisonvorhersagen beschreiben großräumige Monatsabweichungen, keine lokale Wetterabfolge.','Temperaturanomalie in K; Niederschlag relativ zum jeweiligen Modellklima.','Der öffentliche lokale Punktdatenzugang ist derzeit für ECMWF saisonal quantitativ verfügbar; weitere Großmodelle werden über den offiziellen C3S-Vergleich ausgewiesen.']};
}
