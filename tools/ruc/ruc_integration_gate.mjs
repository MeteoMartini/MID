/**
 * MID C43: provider readiness is not production authorization.
 * The two RUC paths remain independent; this diagnostic does not alter app state.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const REQUIRED_DWD_RUC_FIELDS=Object.freeze([
 'T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M',
 'TOT_PREC','CLCT','CLCL','CAPE_ML','CIN_ML'
]);
const EXPECTED_HOURLY_LEADS=28;
const EXPECTED_RAPID5_STEPS=325;
const HOURLY_FIELDS=new Set(REQUIRED_DWD_RUC_FIELDS.filter(name=>!['TOT_PREC','CAPE_ML','CIN_ML'].includes(name)));
const NUMERIC_FIELDS=new Set(['T_2M','CLCL','TOT_PREC']);
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const integer=(value,min=0)=>Number.isSafeInteger(value)&&value>=min;
const validNumber=value=>typeof value==='number'&&Number.isFinite(value);
const positiveNumber=value=>validNumber(value)&&value>0;
const unique=values=>new Set(values).size===values.length;

function validateListings(provider){
 if(!isObject(provider)||provider.schema!=='mid.ruc.provider.readonly.v1'||provider.dwdListingGate!==true)return false;
 const runs=provider.runDiscovery?.runs,rows=provider.dwd;
 if(!Array.isArray(runs)||runs.length!==3||!runs.every(x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(x))||!unique(runs))return false;
 if(!Array.isArray(rows)||rows.length!==runs.length*REQUIRED_DWD_RUC_FIELDS.length)return false;
 const combinations=new Set();
 for(const row of rows){
  if(!isObject(row)||!runs.includes(row.run)||!REQUIRED_DWD_RUC_FIELDS.includes(row.field)||row.http!==200)return false;
  const key=row.run+'/'+row.field;
  if(combinations.has(key))return false;
  combinations.add(key);
  const inv=row.inventory;
  if(!isObject(inv)||!Array.isArray(inv.missingHourlyLeads)||inv.missingHourlyLeads.length||inv.plus27Listed!==true)return false;
  if(!integer(inv.filesListed))return false;
  if(row.field==='TOT_PREC'){
   if(inv.filesListed!==EXPECTED_RAPID5_STEPS||inv.fiveMinuteSlotsMissing!==0)return false;
  }else if(row.field==='CAPE_ML'||row.field==='CIN_ML'){
   if(inv.filesListed!==109)return false;
  }else if(HOURLY_FIELDS.has(row.field)){
   if(inv.filesListed!==EXPECTED_HOURLY_LEADS)return false;
  }else{return false}
 }
 return runs.every(run=>REQUIRED_DWD_RUC_FIELDS.every(field=>combinations.has(run+'/'+field)));
}
function validateHeaders(headers){
 if(!isObject(headers)||headers.schema!=='mid.ruc.grib-header-sample.v1'||headers.headerTimeGate!==true||!Array.isArray(headers.samples)||headers.samples.length!==5)return false;
 const keys=headers.samples.map(x=>x.field+':'+x.leadMinutes);
 if(!unique(keys))return false;
 for(const key of ['T_2M:1620','PMSL:1620','CLCL:1620','TOT_PREC:1615','TOT_PREC:1620'])if(!keys.includes(key))return false;
 return headers.samples.every(s=>s.validityMatched===true&&isObject(s.grib)&&s.grib.edition===2&&s.grib.numberOfDataPoints===542040&&s.grib.bitmapPresent===1&&(
   s.field==='TOT_PREC'?s.grib.stepType==='accum'&&s.grib.units==='kg m**-2':s.grib.stepType==='instant'
 ));
}
function validateNumerics(numeric){
 if(!isObject(numeric)||numeric.schema!=='mid.ruc.numeric-pilot.v1'||numeric.numericSampleGate!==true||!Array.isArray(numeric.files)||numeric.files.length!==5||!Array.isArray(numeric.increments)||numeric.increments.length!==2)return false;
 if(!numeric.files.every(f=>NUMERIC_FIELDS.has(f.field)&&f.valid===true&&f.pointCount===542040&&integer(f.finitePoints,1)&&integer(f.missingPoints)&&f.finitePoints+f.missingPoints===f.pointCount&&validNumber(f.min)&&validNumber(f.max)&&f.min<=f.max))return false;
 const steps=numeric.increments.map(i=>i.startLeadMinutes+':'+i.endLeadMinutes);
 if(!unique(steps)||!steps.includes('1610:1615')||!steps.includes('1615:1620'))return false;
 return numeric.increments.every(x=>integer(x.validPairedCells,1)&&integer(x.missingPairedCells)&&
   x.validPairedCells+x.missingPairedCells===542040&&
   x.negativeBelowToleranceCount===0&&
   validNumber(x.minMm)&&x.minMm>=-0.05&&validNumber(x.maxMm)&&x.maxMm>=x.minMm);
}
function validateOpenMeteo(provider){
 const api=provider?.openMeteo;
 return isObject(api)&&api.http===200&&api.model==='dwd_icon_d2_ruc_native'&&api.usable===true&&api.hourlyTimeStepValid===true&&api.unit==='°C'&&integer(api.finite,6)&&integer(api.timeCount,6)&&api.temperatureCount===api.timeCount;
}
export function evaluateRucPilot({provider,headers,numeric}={}){
 const dwd={listing:validateListings(provider),gribHeaders:validateHeaders(headers),nativeSample:validateNumerics(numeric)};
 const openMeteo={modelApi:validateOpenMeteo(provider)};
 const dwdPilotVerified=Object.values(dwd).every(Boolean);
 const apiPilotVerified=Object.values(openMeteo).every(Boolean);
 const requiredReleaseChecks=[
  'full_27h_native_grib_and_bitmap_validation',
  'all_run_precipitation_accumulation_and_step_boundaries',
  'dwd_ruc_eps_independent_member_and_horizon_validation',
  'measured_900MB_RUC_950MB_Pages_and_lossless_rollback',
  'best_match_ruc_independence_and_no_double_counting',
  'worker_pages_fusion_regressions_and_sha_bound_release',
  'explicit_meteorological_and_product_approval'
 ];
 return {
  schema:'mid.ruc.integration.readiness.v1',
  scope:'READ_ONLY_PRELIMINARY_EVIDENCE',
  sources:{nativeDwd:{...dwd,pilotVerified:dwdPilotVerified},
           openMeteo:{...openMeteo,pilotVerified:apiPilotVerified}},
  integration:{
   nativeDwd:{status:dwdPilotVerified?'pilot_verified__release_gates_outstanding':'pilot_incomplete',
               readyForProduction:false},
   openMeteo:{status:apiPilotVerified?'api_pilot_verified__release_gates_outstanding':'api_not_verified',
              readyForProduction:false},
   pendingReleaseChecks:requiredReleaseChecks,
   activationAuthorized:false,
   automatedPromotionAllowed:false
  }
 };
}
async function maybeRead(path){
 try{return JSON.parse(await readFile(path,'utf8'))}catch(error){
  if(error.code==='ENOENT')return null;
  throw error;
 }
}
export async function evaluateEvidenceDirectory(directory){
 const dir=resolve(directory);
 return evaluateRucPilot({
  provider:await maybeRead(resolve(dir,'provider-status.json')),
  headers:await maybeRead(resolve(dir,'native-grib27-header-samples.json')),
  numeric:await maybeRead(resolve(dir,'native-ruc-numeric-samples.json'))
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);
 if(args.length!==3||args[0]!=='--evidence-dir'){
  console.error('Usage: node tools/ruc/ruc_integration_gate.mjs --evidence-dir PATH --out PATH');
  process.exit(64);
 }
 // Backward-incompatible argument formats fail closed.
 const result=await evaluateEvidenceDirectory(args[1]);
 await writeFile(resolve(args[2]),JSON.stringify(result,null,2)+'\n');
 console.log('RUC native DWD pilot:',result.sources.nativeDwd.pilotVerified?'VERIFIED':'INCOMPLETE',
             '; Open-Meteo pilot:',result.sources.openMeteo.pilotVerified?'VERIFIED':'BLOCKED',
             '; production activation: NOT AUTHORIZED');
}
