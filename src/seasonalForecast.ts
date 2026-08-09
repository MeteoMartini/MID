export type SeasonalMonth={
 date:string;
 label:string;
 temperatureMean:number|null;
 temperatureAnomaly:number|null;
 temperatureAnomalyLow:number|null;
 temperatureAnomalyHigh:number|null;
 precipitationMean:number|null;
 precipitationAnomaly:number|null;
 precipitationAnomalyPercent:number|null;
 precipitationAnomalyPercentLow:number|null;
 precipitationAnomalyPercentHigh:number|null;
 climateTemperature:number|null;
 climatePrecipitation:number|null;
};

export type SeasonalGridPoint={
 latitude:number;
 longitude:number;
 distanceKm:number;
 selection:'nearest';
 gridLabel:string;
};

export type SeasonalPointModel={
 id:string;
 label:string;
 provider:string;
 horizonMonths:number;
 runLabel:string;
 source:string;
 ensembleMembers:number;
 gridPoint:SeasonalGridPoint|null;
 months:SeasonalMonth[];
};

export type C3sSeasonalModel={
 id:string;
 label:string;
 system:string;
 horizon:string;
 currentRun:string;
 region:'global';
 ensembleCapable:true;
 gridLabel:string;
 nearestGridPoint:{latitude:number;longitude:number};
 dataAccess:'C3S CDS';
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
 latitude?:number;
 longitude?:number;
 elevation?:number;
 model?:string;
 monthly?:Record<string,unknown>;
 monthly_units?:Record<string,string>;
};

type SeasonalFetchProfile={
 id:string;
 apiModel?:string;
 label:string;
 provider:string;
 source:string;
 defaultMembers:number;
};

const SEASONAL_FETCH_PROFILES:SeasonalFetchProfile[]=[
 {id:'ecmwf-seamless',apiModel:'ecmwf_seamless',label:'ECMWF Seasonal · EC46 + SEAS5',provider:'ECMWF · Open-Meteo Seasonal API',source:'51-köpfiges ECMWF-Saisonensemble am nächstgelegenen verfügbaren Modellgitterpunkt; EC46 für die ersten 46 Tage, anschließend SEAS5.',defaultMembers:51},
 {id:'ecmwf-seas5',apiModel:'ecmwf_seas5',label:'ECMWF SEAS5',provider:'ECMWF · Open-Meteo Seasonal API',source:'51-köpfiges ECMWF-SEAS5-Ensemble am nächstgelegenen verfügbaren Modellgitterpunkt.',defaultMembers:51},
 {id:'ecmwf-ec46',apiModel:'ecmwf_ec46',label:'ECMWF EC46',provider:'ECMWF · Open-Meteo Seasonal API',source:'51-köpfiges ECMWF-EC46-Ensemble am nächstgelegenen verfügbaren Modellgitterpunkt.',defaultMembers:51},
 {id:'ecmwf-default',label:'ECMWF Seasonal · EC46 + SEAS5',provider:'ECMWF · Open-Meteo Seasonal API',source:'51-köpfiges ECMWF-Saisonensemble am nächstgelegenen verfügbaren Modellgitterpunkt; EC46 für die ersten 46 Tage, anschließend SEAS5.',defaultMembers:51}
];

function finite(value:unknown):number|null{const numeric=Number(value);return Number.isFinite(numeric)?numeric:null}
function memberKeys(payload:Record<string,unknown>,base:string){return Object.keys(payload).filter(key=>key.startsWith(`${base}_member`)&&Array.isArray(payload[key])).sort()}
function memberValuesAt(payload:Record<string,unknown>,base:string,index:number){return memberKeys(payload,base).map(key=>finite((payload[key] as unknown[])[index])).filter((value):value is number=>value!==null)}
function quantile(values:number[],q:number){if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),position=(sorted.length-1)*q,lower=Math.floor(position),upper=Math.ceil(position);if(lower===upper)return sorted[lower];const weight=position-lower;return sorted[lower]*(1-weight)+sorted[upper]*weight}
function averageSeries(payload:Record<string,unknown>,base:string,length:number){
 const direct=Array.isArray(payload[base])?payload[base] as unknown[]:null;
 const members=memberKeys(payload,base);
 if(members.length)return Array.from({length},(_,index)=>{const values=memberValuesAt(payload,base,index);return values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null});
 if(direct)return Array.from({length},(_,index)=>finite(direct[index]));
 return Array.from({length},()=>null as number|null);
}
function quantileSeries(payload:Record<string,unknown>,base:string,length:number,q:number){const members=memberKeys(payload,base);if(members.length<2)return Array.from({length},()=>null as number|null);return Array.from({length},(_,index)=>quantile(memberValuesAt(payload,base,index),q))}
function monthLabel(date:string){try{return new Intl.DateTimeFormat('de-DE',{month:'short',year:'2-digit',timeZone:'UTC'}).format(new Date(`${date.slice(0,7)}-15T12:00:00Z`))}catch{return date.slice(0,7)}}
function modelRunLabel(date=new Date()){const year=date.getUTCFullYear(),month=date.getUTCMonth(),available=date.getUTCDate()>=5?new Date(Date.UTC(year,month,1)):new Date(Date.UTC(year,month-1,1));return new Intl.DateTimeFormat('de-DE',{month:'short',year:'numeric',timeZone:'UTC'}).format(available)}
function currentC3sRun(releaseDay:number,date=new Date()){const year=date.getUTCFullYear(),month=date.getUTCMonth(),available=date.getUTCDate()>=releaseDay?new Date(Date.UTC(year,month,1)):new Date(Date.UTC(year,month-1,1));return new Intl.DateTimeFormat('de-DE',{month:'short',year:'numeric',timeZone:'UTC'}).format(available)}
function radians(value:number){return value*Math.PI/180}
function distanceKm(lat1:number,lon1:number,lat2:number,lon2:number){const earth=6371,dLat=radians(lat2-lat1),dLon=radians(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(radians(lat1))*Math.cos(radians(lat2))*Math.sin(dLon/2)**2;return earth*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)))}
function nearestC3sCoordinate(value:number){return Math.round(value-.5)+.5}
function nearestC3sGridPoint(latitude:number,longitude:number){const lat=Math.max(-89.5,Math.min(89.5,nearestC3sCoordinate(latitude))),normalized=((longitude+180)%360+360)%360-180,lon=nearestC3sCoordinate(normalized);return{latitude:lat,longitude:lon>179.5?lon-360:lon}}

export function c3sSeasonalModels(latitude:number,longitude:number,now=new Date()):C3sSeasonalModel[]{
 const ecmwfRun=currentC3sRun(6,now),otherRun=currentC3sRun(10,now),nearest=nearestC3sGridPoint(latitude,longitude);
 const base={region:'global' as const,ensembleCapable:true as const,gridLabel:'C3S 1° × 1° · nächster Gitterpunkt',nearestGridPoint:nearest,dataAccess:'C3S CDS' as const};
 return[
  {...base,id:'ecmwf',label:'ECMWF',system:'SEAS5 · System 51',horizon:'bis 215 Tage',currentRun:ecmwfRun},
  {...base,id:'ukmo',label:'Met Office',system:'GloSea · System 610',horizon:'bis 215 Tage',currentRun:otherRun},
  {...base,id:'meteofrance',label:'Météo-France',system:'System 9',horizon:'7 Kalendermonate',currentRun:otherRun},
  {...base,id:'dwd',label:'DWD',system:'GCFS2.2 · System 22',horizon:'6 Monate',currentRun:otherRun},
  {...base,id:'cmcc',label:'CMCC',system:'SPS4 · System 4',horizon:'184 Tage',currentRun:otherRun},
  {...base,id:'ncep',label:'NCEP',system:'CFSv2 · System 2',horizon:'bis 215 Tage',currentRun:otherRun},
  {...base,id:'jma',label:'JMA',system:'CPS4 · System 4',horizon:'saisonal',currentRun:otherRun},
  {...base,id:'eccc',label:'ECCC',system:'System 4/5',horizon:'saisonal',currentRun:otherRun},
  {...base,id:'bom',label:'BOM',system:'ACCESS-S2 · System 2',horizon:'saisonal',currentRun:otherRun}
 ];
}

function parsePointModel(payload:SeasonalApiPayload,requestedLatitude:number,requestedLongitude:number,profile:SeasonalFetchProfile):SeasonalPointModel|null{
 const monthly=payload.monthly??{},time=Array.isArray(monthly.time)?monthly.time.map(String):[];
 if(!time.length)return null;
 const temperatureMean=averageSeries(monthly,'temperature_2m_mean',time.length),temperatureAnomaly=averageSeries(monthly,'temperature_2m_anomaly',time.length),temperatureAnomalyLow=quantileSeries(monthly,'temperature_2m_anomaly',time.length,.1),temperatureAnomalyHigh=quantileSeries(monthly,'temperature_2m_anomaly',time.length,.9),precipitationMean=averageSeries(monthly,'precipitation_mean',time.length),precipitationAnomaly=averageSeries(monthly,'precipitation_anomaly',time.length),precipitationAnomalyLow=quantileSeries(monthly,'precipitation_anomaly',time.length,.1),precipitationAnomalyHigh=quantileSeries(monthly,'precipitation_anomaly',time.length,.9),ensembleMembers=Math.max(memberKeys(monthly,'temperature_2m_anomaly').length,memberKeys(monthly,'precipitation_anomaly').length,profile.defaultMembers,1);
 const months=time.map((date,index)=>{
  const tMean=temperatureMean[index],tAnomaly=temperatureAnomaly[index],pMean=precipitationMean[index],pAnomaly=precipitationAnomaly[index],climateTemperature=tMean!==null&&tAnomaly!==null?tMean-tAnomaly:null,climatePrecipitation=pMean!==null&&pAnomaly!==null?pMean-pAnomaly:null,toPercent=(value:number|null)=>value!==null&&climatePrecipitation!==null&&Math.abs(climatePrecipitation)>.03?Math.max(-300,Math.min(300,value/climatePrecipitation*100)):null,precipitationAnomalyPercent=toPercent(pAnomaly),precipitationAnomalyPercentLow=toPercent(precipitationAnomalyLow[index]),precipitationAnomalyPercentHigh=toPercent(precipitationAnomalyHigh[index]);
  return{date,label:monthLabel(date),temperatureMean:tMean,temperatureAnomaly:tAnomaly,temperatureAnomalyLow:temperatureAnomalyLow[index],temperatureAnomalyHigh:temperatureAnomalyHigh[index],precipitationMean:pMean,precipitationAnomaly:pAnomaly,precipitationAnomalyPercent,precipitationAnomalyPercentLow,precipitationAnomalyPercentHigh,climateTemperature,climatePrecipitation};
 }).slice(0,7);
 const gridLatitude=finite(payload.latitude),gridLongitude=finite(payload.longitude),gridPoint=gridLatitude!==null&&gridLongitude!==null?{latitude:gridLatitude,longitude:gridLongitude,distanceKm:distanceKm(requestedLatitude,requestedLongitude,gridLatitude,gridLongitude),selection:'nearest' as const,gridLabel:'ECMWF O320 · ca. 36 km'}:null;
 return{id:profile.id,label:profile.label,provider:profile.provider,horizonMonths:months.length,runLabel:modelRunLabel(),source:profile.source,ensembleMembers,gridPoint,months};
}

async function fetchPayload(latitude:number,longitude:number,signal:AbortSignal,model?:string){
 const params=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),timezone:'GMT',forecast_days:'217',monthly:MONTHLY_VARIABLES.join(','),cell_selection:'nearest'});if(model)params.set('models',model);
 const response=await fetch(`${ENDPOINT}?${params}`,{signal,cache:'no-store'});if(!response.ok)throw new Error(`Seasonal API HTTP ${response.status}`);return await response.json() as SeasonalApiPayload;
}
function modelSignature(model:SeasonalPointModel){return JSON.stringify(model.months.map(month=>[month.date,month.temperatureAnomaly,month.precipitationAnomalyPercent]))}

export async function loadSeasonalForecast(latitude:number,longitude:number,signal:AbortSignal):Promise<SeasonalForecastBundle>{
 const settled=await Promise.allSettled(SEASONAL_FETCH_PROFILES.map(async profile=>({profile,payload:await fetchPayload(latitude,longitude,signal,profile.apiModel)})));
 const pointModels:SeasonalPointModel[]=[];
 const signatures=new Set<string>();
 for(const result of settled){
  if(result.status!=='fulfilled')continue;
  const parsed=parsePointModel(result.value.payload,latitude,longitude,result.value.profile);
  if(!parsed)continue;
  const signature=modelSignature(parsed);
  if(signatures.has(signature))continue;
  signatures.add(signature);
  pointModels.push(parsed);
 }
 return{generatedAt:new Date().toISOString(),pointModels,c3sModels:c3sSeasonalModels(latitude,longitude),c3sReferencePeriod:'C3S: gemeinsamer Hindcast-Referenzzeitraum 1993–2016; ECMWF/Open-Meteo: modellkonsistente SEAS5-/EC46-Hindcast-Klimatologie.',c3sCatalogueUrl:C3S_CATALOGUE,notes:['Saisonvorhersagen beschreiben großräumige Monatsabweichungen, keine lokale Wetterabfolge.','MID verwendet bewusst den nächstgelegenen verfügbaren Modellgitterpunkt; eine lokale Interpolation würde bei saisonalen Trends zusätzliche Scheinpräzision erzeugen.','Die Datenstruktur und Diagramme sind multi-modell- und ensemblefähig. Aktuell werden öffentlich verfügbare ECMWF-Varianten (Seamless, SEAS5, EC46) soweit numerisch abrufbar parallel eingelesen; zusätzliche C3S-Komponenten bleiben als Ensemblequellen vorbereitet.']};
}
