// MID Data 1.2: isolated read-only Open-Meteo DWD ICON-D2-RUC single-run SHADOW.
// No producer/Worker use, no EPS synthesis, no DWD GRIB signature equivalence.
// Provider snapshot time axis is run-pinned; all original field nulls are preserved.
export const FIELDS=["temperature_2m","dew_point_2m","relative_humidity_2m","pressure_msl","wind_speed_10m","wind_direction_10m","wind_gusts_10m","precipitation","cloud_cover","cloud_cover_low","cape","convective_inhibition"];
export const UNITS={"time":"iso8601","temperature_2m":"°C","dew_point_2m":"°C","relative_humidity_2m":"%","pressure_msl":"hPa","wind_speed_10m":"kn","wind_direction_10m":"°","wind_gusts_10m":"kn","precipitation":"mm","cloud_cover":"%","cloud_cover_low":"%","cape":"J/kg","convective_inhibition":"J/kg"};
const RANGES={"temperature_2m":[-115,65],"dew_point_2m":[-120,65],"relative_humidity_2m":[0,100],"pressure_msl":[750,1120],"wind_speed_10m":[0,200],"wind_direction_10m":[0,360],"wind_gusts_10m":[0,250],"precipitation":[0,600],"cloud_cover":[0,100],"cloud_cover_low":[0,100],"cape":[0,16000],"convective_inhibition":[0,16000]};
const CORE=["temperature_2m","dew_point_2m","relative_humidity_2m","pressure_msl","wind_speed_10m","cloud_cover"];
export function canonicalRun(run){
 if(typeof run!=="string"||!/^20\d\d-\d\d-\d\dT\d\d:00$/.test(run))throw Error("noncanonical UTC run");
 const at=Date.parse(run+":00Z");
 if(!Number.isFinite(at)||new Date(at).toISOString().slice(0,16)!==run)throw Error("nonexistent UTC model run");
 return at;
}
export function buildSingleRunUrl({run,lat,lon}){
 canonicalRun(run);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error("invalid coordinate");
 return "https://single-runs-api.open-meteo.com/v1/forecast?latitude="+lat.toFixed(5)+"&longitude="+lon.toFixed(5)+"&models=dwd_icon_d2_ruc_native&run="+encodeURIComponent(run)+"&hourly="+FIELDS.join(",")+"&forecast_hours=28&timezone=GMT&wind_speed_unit=kn&temperature_unit=celsius&precipitation_unit=mm";
}
export function qualifyRunPinnedRuc({requestedRun,lat,lon,metadata,payload,nowMs=Date.now()}){
 const runMs=canonicalRun(requestedRun);
 if(!Number.isFinite(nowMs)||nowMs<runMs-5*60000||nowMs-runMs>4*3600000)throw Error("run outside original RUC four-hour freshness contract");
 const init=metadata?.last_run_initialisation_time,ready=metadata?.last_run_availability_time;
 if(!Number.isSafeInteger(init)||!Number.isSafeInteger(ready))throw Error("provider run metadata unavailable");
 if(init*1000!==runMs||ready*1000<runMs||ready*1000>nowMs+5*60000)throw Error("provider cycle not currently admitted");
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error("invalid coordinate");
 if(!payload||Array.isArray(payload)||payload.error||payload.timezone!=="GMT"||payload.utc_offset_seconds!==0)throw Error("non-UTC or invalid provider response");
 if(!Number.isFinite(payload.latitude)||!Number.isFinite(payload.longitude)||Math.abs(payload.latitude-lat)>.09||Math.abs(payload.longitude-lon)>.13)throw Error("provider model grid point too remote");
 const times=payload.hourly?.time,units=payload.hourly_units;
 if(!Array.isArray(times)||times.length!==28||!units||units.time!=="iso8601")throw Error("provider 0..27 UTC axis incomplete");
 for(let i=0;i<times.length;i++)if(times[i]!==new Date(runMs+i*3600000).toISOString().slice(0,16))throw Error("provider UTC lead axis misaligned");
 const missing={},valid={};
 for(const name of FIELDS){
  if(units[name]!==UNITS[name])throw Error("unsupported unit "+name);
  const row=payload.hourly[name];
  if(!Array.isArray(row)||row.length!==28)throw Error("invalid "+name+" field axis");
  let holes=0,finite=0;
  for(const value of row){
   if(value===null){holes++;continue}
   if(typeof value!=="number"||!Number.isFinite(value)||value<RANGES[name][0]||value>RANGES[name][1])throw Error("unphysical/invalid "+name+" value");
   finite++;
  }
  missing[name]=holes;valid[name]=finite;
 }
 let lastCoreLead=-1;
 for(let i=0;i<28;i++){
  if(CORE.some(name=>payload.hourly[name][i]===null))break;
  lastCoreLead=i;
 }
 if(lastCoreLead<5)throw Error("insufficient contiguous deterministic core");
 const hours=times.map((time,i)=>{
  const h=payload.hourly,wind=h.wind_speed_10m[i],rawDirection=h.wind_direction_10m[i];
  const direction=wind===0||rawDirection===null?null:((rawDirection%360)+360)%360;
  return{time,epoch:runMs+i*3600000,leadHours:i,temperature:h.temperature_2m[i],
   dewPoint:h.dew_point_2m[i],humidity:h.relative_humidity_2m[i],pressure:h.pressure_msl[i],
   wind,direction,gust:h.wind_gusts_10m[i],precipitation:h.precipitation[i],
   cloud:h.cloud_cover[i],lowCloud:h.cloud_cover_low[i],cape:h.cape[i],
   convectiveInhibition:h.convective_inhibition[i],probability:null};
 });
 return{schema:"mid.ruc.openmeteo.runpin-shadow.v1",modelId:"dwd_icon_d2_ruc_native",
  provider:"Open-Meteo Single Runs",originModel:"DWD ICON-D2-RUC",independenceGroup:"dwd-icon",
  requestedRun,initialisationTime:new Date(runMs).toISOString(),availabilityTime:new Date(ready*1000).toISOString(),
  sampledLocation:{lat:payload.latitude,lon:payload.longitude},expectedHours:28,maxCoreLeadHours:lastCoreLead,
  fieldValidCounts:valid,fieldMissingCounts:missing,hours,sourceVerification:"provider-run-pinned",
  nativeDwdGribVerified:false,epsAvailable:false,nativeRapidVerified:false,
  commercialUseAuthorized:false,publicationAuthorized:false};
}
