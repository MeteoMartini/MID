/* Read-only DWD staging reuse planner: does not download, decode or publish. */
export const MAIN_HOURS = [1,2,3,4,5,6,12,24,48];
export const MAIN_FIELDS = ["t_2m","pmsl","u_10m","v_10m","vmax_10m","clct","ww","t","relhum","tot_prec"];
export const TOTALS = [0,6,12,24,48];
export const RUC_CORE = ["T_2M","TD_2M","RELHUM_2M","PMSL","U_10M","V_10M","VMAX_10M","TOT_PREC","CLCT","CLCL","CAPE_ML","CIN_ML"];
export function checkedRun(stamp) {
 if(typeof stamp!=="string"||!/^\d{10}$/.test(stamp))throw Error("run must be YYYYMMDDHH UTC");
 const date=Date.parse(stamp.slice(0,4)+"-"+stamp.slice(4,6)+"-"+stamp.slice(6,8)+"T"+stamp.slice(8,10)+":00:00Z");
 if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,13).replace(/[-T]/g,"")!==stamp)throw Error("invalid UTC run");
 return stamp;
}
export function sourceKey(x) {
 return [x.model,x.run,x.grid,x.parameter,x.level===null?"surface":String(x.level),x.hour,x.stepSemantics].join("|");
}
export function planDwdBatch({iconD2Run,rucRun}) {
 checkedRun(iconD2Run); checkedRun(rucRun);
 if(Number(iconD2Run.slice(8,10))%3!==0)throw Error("ICON-D2 regular run must be a 3-hour cycle");
 const refs=[];
 const add=(consumer,model,run,grid,parameter,level,hour,stepSemantics)=>refs.push({consumer,model,run,grid,parameter,level,hour,stepSemantics});
 for(const hour of MAIN_HOURS)for(const f of MAIN_FIELDS){
   const processing=f==="tot_prec"?"accum-from-run":f==="vmax_10m"?"backward-maximum":"instant";
   const level=f==="t"||f==="relhum"?850:null;
   for(const step of f==="tot_prec"?[hour,hour-1]:[hour]){
     add("regular-map","icon-d2",iconD2Run,"germany_regular-lat-lon",f,level,step,processing);
   }
 }
 for(const hour of TOTALS)add("regular-totals","icon-d2",iconD2Run,"germany_regular-lat-lon","tot_prec",null,hour,"accum-from-run");
 for(let hour=0;hour<=27;hour++){
   for(const param of RUC_CORE){
     add("ruc-core","icon-d2-ruc",rucRun,"native-icosahedral",""+param,null,hour,param==="TOT_PREC"?"accum-from-run":param==="VMAX_10M"?"backward-maximum":"instant");
   }
   for(const param of ["PMSL","CLCT"]){
     add("ruc-synoptic","icon-d2-ruc",rucRun,"native-icosahedral",param,null,hour,"instant");
   }
 }
 const unique=new Map();
 for(const ref of refs){
   const key=sourceKey(ref);
   const entry=unique.get(key);
   if(entry)entry.consumers.push(ref.consumer);
   else unique.set(key,{key,model:ref.model,run:ref.run,grid:ref.grid,parameter:ref.parameter,level:ref.level,hour:ref.hour,stepSemantics:ref.stepSemantics,consumers:[ref.consumer]});
 }
 const overlap=[...unique.values()].filter(x=>x.consumers.length>1);
 return {
   schema:"mid.dwd.source-batch-plan.shadow.v1",runs:{iconD2:iconD2Run,ruc:rucRun},
   requestedReferences:refs.length,uniqueSourceKeys:unique.size,duplicateReferences:refs.length-unique.size,
   byConsumer:Object.fromEntries([...new Set(refs.map(r=>r.consumer))].map(c=>[c,refs.filter(r=>r.consumer===c).length])),
   overlaps:overlap,productionEligible:false,
   limitations:["Inventory-only; no file existence, source SHA256, GRIB grid or values verified",
     "No change to downloader, codec or approved original-data pipeline",
     "RUC P1-P5 and atomic Pages/Worker publication requirements unchanged",
     "Reuse requires same content SHA, run, GRIB header, grid, step semantics and complete original field validation"]
 };
}
import { pathToFileURL } from "node:url";
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 try {
  const args=process.argv.slice(2);
  if(args.length!==4 || args[0]!=="--icon-d2-run" || args[2]!=="--ruc-run")
    throw Error("Usage: node tools/ruc/dwd_batch_source_plan_shadow.mjs --icon-d2-run YYYYMMDDHH --ruc-run YYYYMMDDHH");
  const plan=planDwdBatch({iconD2Run:args[1],rucRun:args[3]});
  const {overlaps,...summary}=plan;
  console.log(JSON.stringify({...summary,overlapEntries:overlaps.length,
    sampleOverlapKeys:overlaps.slice(0,8).map(o=>o.key)},null,2));
 } catch(e) {console.error(String(e?.message||e));process.exitCode=1;}
}
