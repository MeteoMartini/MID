/**
 * RUC Fast-to-canonical compatibility bridge, deliberately non-authorizing.
 * Only the normal MID Worker forecast fusion can choose a forecast source.
 * The full 27h/EPS20 model remains authoritative until explicit provenance,
 * public Pages, publisher fencing, 168h quality and consumer gates all pass.
 */
const NAMES=[
 'temperature_2m','dew_point_2m','relative_humidity_2m','pressure_msl',
 'wind_speed_10m','wind_direction_10m','wind_gusts_10m','precipitation',
 'cloud_cover','cloud_cover_low','cape','convective_inhibition'
];
const FAST='mid.ruc.fast-paged-cell-shadow.v1';
const FULL='mid.dwd.ruc.grid.v2';
function assert(ok,reason){if(!ok)throw Error(reason)}
function iso(value){
 assert(typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value),'UTC ISO timestamp required');
 const stamp=Date.parse(value);assert(Number.isFinite(stamp)&&new Date(stamp).toISOString()===value,'invalid UTC calendar');
 return stamp;
}
function nativeNumber(value,field){
 assert(value===null||(typeof value==='number'&&Number.isFinite(value)),'invalid native '+field);
 return value;
}
function verifyRows(rows,run,step,count,kind){
 assert(Array.isArray(rows)&&rows.length===count,'incomplete Fast '+kind+' axis');
 for(let i=0;i<count;i++){
  const row=rows[i];
  assert(row&&typeof row==='object'&&iso(row.validTimeUtc)===run+i*step*60000,'Fast '+kind+' validity mismatch');
  const lower=i===0?null:new Date(run+(i-1)*step*60000).toISOString();
  if(kind!=='hourly'){
   assert(row.intervalStartUtc===lower && row.intervalEndUtc===(i===0?null:row.validTimeUtc),'Fast '+kind+' accumulation interval mismatch');
   nativeNumber(row.precipitationMm,'precipitation');
   assert(i!==0||row.precipitationMm===null,'unknown initial accumulation is not zero');
  }
 }
}
function fullRun(primary){
 assert(primary&&primary.schema===FULL&&typeof primary.run==='string','original 27h schema required');
 const run=iso(primary.run+':00.000Z');
 assert(Array.isArray(primary.times)&&primary.times.length===28,'missing 27h run axis');
 for(let t=0;t<28;t++)assert(primary.times[t]===new Date(run+t*3600000).toISOString().slice(0,16),'original validity axis incomplete');
 assert(primary.eps?.memberCount===20,'independent 20-member EPS must remain intact');
 return run;
}
export function inspectFastToCommonForecastShadow(primary,cell) {
 const full=fullRun(primary);
 assert(cell&&cell.schema===FAST&&cell.available===true,'Fast native cell unavailable');
 assert(cell.productionAuthorized===false&&cell.consumerAdoptionVerified===false&&cell.epsAvailable===false,'unapproved or falsely independent Fast source');
 const run=iso(cell.modelRunUtc);
 assert(run>=full&&run-full<=6*3600000,'Fast and original full model runs unrelated');
 verifyRows(cell.hours,run,60,7,'hourly');
 verifyRows(cell.rapid5Minutes,run,5,73,'rapid5');
 verifyRows(cell.rapid15Minutes,run,15,25,'rapid15');
 const hourly={time:[]};
 for(const n of NAMES)hourly[n]=[];
 for(const [i,row] of cell.hours.entries()){
  assert(row.fields&&typeof row.fields==='object','missing native Fast deterministic field');
  hourly.time.push(row.validTimeUtc.slice(0,16));
  for(const n of NAMES) {
   assert(Object.hasOwn(row.fields,n),'required native parameter absent: '+n);
   const value=nativeNumber(row.fields[n],n);
   // +0 is model initialisation, *not* a known completed 0..1h precipitation accumulation.
   hourly[n].push(n==='precipitation'&&i===0?null:value);
  }
 }
 const rapid={
  precip5:{time:cell.rapid5Minutes.map(row=>row.validTimeUtc.slice(0,16)),
           precipitation:cell.rapid5Minutes.map(row=>row.precipitationMm),
           modelRunUtc:cell.modelRunUtc,firstAccumulationUnknown:true},
  convection15:{time:cell.rapid15Minutes.map(row=>row.validTimeUtc.slice(0,16)),
                precipitation:cell.rapid15Minutes.map(row=>row.precipitationMm),
                cape:cell.rapid15Minutes.map(row=>nativeNumber(row.capeJkg,'cape')),
                convective_inhibition:cell.rapid15Minutes.map(row=>nativeNumber(row.cinJkg,'cin')),
                modelRunUtc:cell.modelRunUtc,firstAccumulationUnknown:true}
 };
 const adapter={schema:'mid.ruc.fast-canonical-compat-shadow.v1',
  timezone:'GMT',utc_offset_seconds:0,hourly,rapid,
  mid_ruc:{run:cell.modelRunUtc.slice(0,16),source:'DWD ICON-D2 RUC deterministic Fast (original)',
    sourceType:'native-original-dwd-fast',horizonHours:6,epsMemberCount:0,fastIndependentFromEps20:true,
    underlyingFullRun:primary.run,modelInitializationUtc:cell.modelRunUtc,
    hourlyValidityUtc:cell.hours.map(row=>row.validTimeUtc),
    fiveMinuteValidityUtc:cell.rapid5Minutes.map(row=>row.validTimeUtc),
    fifteenMinuteValidityUtc:cell.rapid15Minutes.map(row=>row.validTimeUtc),
    nativeIntervals: true,productionEnabled:false,consumerAdoptionVerified:false}};
 return Object.freeze({schema:'mid.ruc.full-plus-fast-canonical-shadow.v1',
  primary,fastCandidate:adapter,selectedForForecast:false,full27hEps20Unchanged:true,
  releaseAuthorized:false,usedByWebIosWidgetsExports:false});
}
