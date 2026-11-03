
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
export const DOMAIN_RULES = Object.freeze({
  "dwd_icon_d2_ruc_native": {
    "minutes": 60,
    "leadMinutes": 1620,
    "fields": [
      "temperature_2m",
      "pressure_msl",
      "wind_u_component_10m",
      "wind_v_component_10m",
      "wind_gusts_10m",
      "cloud_cover",
      "weather_code"
    ]
  },
  "dwd_icon_d2_ruc_native_15min": {
    "minutes": 15,
    "leadMinutes": 1620,
    "fields": [
      "precipitation",
      "cape",
      "convective_inhibition",
      "lightning_potential",
      "visibility",
      "rain",
      "snowfall_water_equivalent"
    ]
  },
  "dwd_icon_d2_ruc_native_model_level": {
    "minutes": 60,
    "leadMinutes": 1620,
    "fields": [
      "temperature_80m",
      "wind_u_component_80m",
      "wind_v_component_80m"
    ]
  }
});
export function auditManifest(domain, raw, mode="latest", now=new Date()) {
  const rule=DOMAIN_RULES[domain];
  if(!rule) throw Error("Unsupported domain");
  if(!["latest","in-progress"].includes(mode)) throw Error("Unsupported mode");
  const errors=[],warnings=[];
  const obj=raw && typeof raw==="object" && !Array.isArray(raw) ? raw : {};
  const iso=(s)=>typeof s==="string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?Z$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,16)===s.slice(0,16);
  const run=iso(obj.reference_time)?Date.parse(obj.reference_time):NaN;
  const modified=iso(obj.last_modified_time)?Date.parse(obj.last_modified_time):NaN;
  const observed=now instanceof Date ? now.getTime():NaN;
  if(!Number.isFinite(run) || new Date(run).getUTCMinutes()!==0) errors.push("invalid_utc_reference_time");
  if(!Number.isFinite(modified)) errors.push("invalid_last_modified_time");
  if(!Number.isFinite(observed)) errors.push("invalid_observed_time");
  if(Number.isFinite(run)&&Number.isFinite(modified)&&modified<run) errors.push("modification_before_run");
  if(Number.isFinite(observed)&&Number.isFinite(modified)&&modified>observed+300000) errors.push("modification_in_future");
  if(mode==="latest"&&obj.completed!==true) errors.push("latest_not_completed");
  if(mode==="in-progress"&&obj.completed===true) warnings.push("in_progress_pointer_completed");
  if(!Array.isArray(obj.valid_times)||obj.valid_times.length===0||obj.valid_times.length>256)errors.push("invalid_valid_times");
  if(!Array.isArray(obj.variables)||obj.variables.length===0||obj.variables.length>512)errors.push("invalid_variables");
  const tList=Array.isArray(obj.valid_times)&&obj.valid_times.length<=256?obj.valid_times:[];
  const times=[];const seenTimes=new Set();
  for(const s of tList) {
    if(!iso(s)){errors.push("invalid_valid_time");continue}
    const ts=Date.parse(s);
    if(seenTimes.has(ts)) errors.push("duplicate_valid_time");
    seenTimes.add(ts);
    if(times.length&&ts<=times[times.length-1])errors.push("non_increasing_valid_times");
    if(Number.isFinite(run)&&(ts<run || (ts-run)%(rule.minutes*60000)!==0))errors.push("invalid_native_time_alignment");
    times.push(ts);
  }
  const vars=Array.isArray(obj.variables)&&obj.variables.length<=512?obj.variables:[];
  const seenVars=new Set();
  for(const name of vars){
    if(typeof name!=="string"||!/^[a-z][a-z0-9_]*(?:hPa)?$/.test(name))errors.push("invalid_variable_name");
    if(seenVars.has(name))errors.push("duplicate_variable");
    seenVars.add(name);
  }
  const gaps=[];
  if(Number.isFinite(run)&&times.length&&times[0]!==run)gaps.push({at:0,missingMinutes:(times[0]-run)/60000});
  for(let i=1;i<times.length;i++){
    const delta=(times[i]-times[i-1])/60000;
    if(delta!==rule.minutes)gaps.push({at:i,missingMinutes:delta-rule.minutes});
  }
  const actualLeadMinutes=times.length&&Number.isFinite(run)?Math.round((times[times.length-1]-run)/60000):null;
  const fullAxis=errors.length===0&&gaps.length===0&&actualLeadMinutes===rule.leadMinutes&&times.length===rule.leadMinutes/rule.minutes+1;
  const missingExpectedFields=rule.fields.filter(name=>!seenVars.has(name));
  if(missingExpectedFields.length)warnings.push("some_target_fields_not_in_manifest");
  if(!fullAxis)warnings.push("full_27h_axis_not_verified");
  const runAgeMinutes=Number.isFinite(observed)&&Number.isFinite(run)?Math.round((observed-run)/60000):null;
  if(runAgeMinutes!==null&&runAgeMinutes>240)warnings.push("mid_four_hour_run_age_exceeded");
  const uniq=x=>[...new Set(x)];
  return {
    schema:"mid.openmeteo.ruc.spatial.shadow.v1",
    domain,source:"Open-Meteo AWS Open Data (processed OM, not DWD-original GRIB)",
    pointer:mode,completed:obj.completed===true,referenceTime:iso(obj.reference_time)?obj.reference_time:null,
    lastModifiedTime:iso(obj.last_modified_time)?obj.last_modified_time:null,
    validTimeCount:times.length,firstValidTime:times.length?new Date(times[0]).toISOString():null,
    lastValidTime:times.length?new Date(times[times.length-1]).toISOString():null,
    publishedAxisStepMinutes:rule.minutes,nativeFieldCadenceProven:false,actualLeadMinutes,runAgeMinutes,
    variableCount:seenVars.size,availableTargetFields:rule.fields.filter(name=>seenVars.has(name)),
    missingExpectedFields,axisGaps:gaps,full27hAxis:fullAxis,
    metadataValid:errors.length===0,errors:uniq(errors),warnings:uniq(warnings),
    fullNative542040GridProven:false,dwdOriginalValueEquivalenceProven:false,
    gribBitmapAndAccumulationProven:false,eps20Proven:false,
    userFacingEndToEndFreshnessProven:false,productionEligible:false
  };
}
export function compareRunSet(results){
  const runs=results.map(x=>x.referenceTime);
  const sameRun=runs.length>0&&runs.every(x=>x!==null&&x===runs[0]);
  return {sameReferenceRun:sameRun,metadataValid:results.every(x=>x.metadataValid),allCompleted:results.every(x=>x.completed),allFull27h:results.every(x=>x.full27hAxis),productionEligible:false,blockedReasons:["DWD original GRIB value/bitmap/interval and 542040-cell native geometry A/B missing","5-minute precipitation and severe fields not fully covered","RUC EPS20 member-level proof missing","Real end-client freshness/permission/performance gates missing"]};
}

const BASE="https://openmeteo.s3.amazonaws.com/data_spatial/";
export async function readPublishedManifest(domain,mode="latest") {
  if(!Object.hasOwn(DOMAIN_RULES,domain)||!["latest","in-progress"].includes(mode)) throw Error("Disallowed Open-Meteo source");
  const url=BASE+domain+"/"+mode+".json";
  const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(12000),headers:{Accept:"application/json"}});
  if(!response.ok) throw Error("Open-Meteo manifest HTTP "+response.status+" ("+domain+")");
  if(Number(response.headers.get("content-length")||"0")>250000)throw Error("Manifest too large");
  const text=await response.text();
  if(text.length>250000) throw Error("Manifest too large");
  const document=JSON.parse(text);
  return {document,sourceUrl:url,metadataSha256:createHash("sha256").update(text).digest("hex")};
}
async function main() {
  const args=process.argv.slice(2);
  if(args.includes("--help")) { console.log("Read-only Open-Meteo RUC spatial manifest shadow: node tools/ruc/openmeteo_spatial_shadow.mjs [--in-progress]"); return; }
  if(args.some(a=>a!=="--in-progress"))throw Error("Unknown argument; --in-progress is read-only and cannot release");
  const mode=args.includes("--in-progress")?"in-progress":"latest";
  const now=new Date(),results=[];
  for(const domain of Object.keys(DOMAIN_RULES)) {
    try {
      const {document,sourceUrl,metadataSha256}=await readPublishedManifest(domain,mode);
      results.push({...auditManifest(domain,document,mode,now),sourceUrl,metadataSha256});
    } catch(e) {
      results.push({schema:"mid.openmeteo.ruc.spatial.shadow.v1",domain,metadataValid:false,
        error:String(e?.message||e),productionEligible:false});
    }
  }
  const compared=compareRunSet(results);
  console.log(JSON.stringify({observedAt:now.toISOString(),mode,results,comparison:compared},null,2));
  if(!compared.metadataValid||!compared.sameReferenceRun)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(e=>{console.error(String(e?.message||e));process.exitCode=1;});
}
