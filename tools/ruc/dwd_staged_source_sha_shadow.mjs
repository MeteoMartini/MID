/**
 * DWD RUC batch source stage inventory, READ ONLY. Never authorizes reuse.
 * Inspect only PMSL/CLCT core stage for same-run downstream synoptic candidates.
 * A SHA256 record here is NOT a GRIB semantic or official-source attestation.
 */
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import { resolve, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
const PARAMS=["PMSL","CLCT"];
const FILE_RX=/\.(?:grib2|grb2)(?:\.bz2)?$/i;
const LEAD_RX=/PT(\d{3})H(\d{2})M/i;
const MAX_FILE_BYTES=250_000_000;
function runFolder(utcRun) {
 if(typeof utcRun!=="string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(utcRun) ||
    new Date(utcRun+"Z").toISOString().slice(0,16)!==utcRun)throw Error("Invalid exact UTC run");
 if(!Number.isFinite(Date.parse(utcRun+"Z")) || utcRun.slice(-2)!=="00")
    throw Error("Expected hourly run initialization");
 return utcRun.replace(/[^0-9A-Za-z_-]/g,"");
}
async function safeRegularFile(path) {
 const s=await lstat(path,{bigint:true});
 if(!s.isFile()||s.isSymbolicLink()||s.size<81n||s.size>BigInt(MAX_FILE_BYTES))
   throw Error("Unsafe or invalid staged GRIB file");
 return s;
}
async function inspectDirectory(folder,base,rows,depth=0) {
 if(depth>5)throw Error("Unexpected source tree depth");
 const st=await lstat(folder);
 if(!st.isDirectory()||st.isSymbolicLink())throw Error("Unsafe staged source directory");
 const entries=await readdir(folder,{withFileTypes:true});
 if(entries.length>256)throw Error("Excess staged directory entries");
 for(const entry of entries){
   const abs=join(folder,entry.name);
   if(entry.isSymbolicLink())throw Error("Staged source symlink rejected");
   if(entry.isDirectory())await inspectDirectory(abs,base,rows,depth+1);
   else if(entry.isFile()&&FILE_RX.test(entry.name)){
     if(rows.length>=512)throw Error("Excess GRIB files");
     const match=LEAD_RX.exec(entry.name);
     if(!match||Number(match[2])!==0||Number(match[1])>27)
       throw Error("Unexpected RUC hourly lead identifier");
     rows.push({absolutePath:abs,relativePath:relative(base,abs).split(sep).join("/"),
       hour:Number(match[1])});
   } else throw Error("Unexpected staged source object");
 }
}
async function shaWithStat(file) {
 const before=await safeRegularFile(file);
 const digest=createHash("sha256");
 const stream=createReadStream(file,{highWaterMark:1024*1024});
 for await(const bytes of stream) digest.update(bytes);
 const after=await safeRegularFile(file);
 if(before.size!==after.size || before.mtimeNs!==after.mtimeNs ||
    before.ino!==after.ino)throw Error("Staged file drift during hash");
 return {bytes:Number(before.size),sha256:digest.digest("hex")};
}
export async function inspectRucCorePmslCloudStage({stageRoot,utcRun}) {
 const folder=runFolder(utcRun);
 if(typeof stageRoot!=="string"||!stageRoot.trim())throw Error("Missing stage path");
 const base=resolve(stageRoot);
 const bs=await lstat(base);
 if(!bs.isDirectory()||bs.isSymbolicLink())throw Error("Unsafe stage root");
 const runs=[];
 for(const param of PARAMS){
   const sub=resolve(base,folder,"deterministic",param);
   if(!sub.startsWith(base+sep))throw Error("Unsafe stage path");
   const rows=[];
   await inspectDirectory(sub,base,rows);
   const seen=new Set();
   for(const row of rows) {
     if(seen.has(row.hour))throw Error("Duplicate native RUC forecast lead");
     seen.add(row.hour);
   }
   if(rows.length!==28||Array.from({length:28},(_,i)=>i).some(i=>!seen.has(i)))
     throw Error("Incomplete 0..27h source stage (no fake missing zeros)");
   for(const row of rows){
     const {bytes,sha256}=await shaWithStat(row.absolutePath);
     runs.push({parameter:param,forecastHour:row.hour,
        sourceRelativePath:row.relativePath,bytes,sha256});
   }
 }
 runs.sort((a,b)=>a.parameter.localeCompare(b.parameter)||a.forecastHour-b.forecastHour);
 const inventorySha256=createHash("sha256")
   .update(JSON.stringify(runs)).digest("hex");
 return {schema:"mid.ruc.core-source-sha.shadow.v1",
   stageRootVerified:true,run:utcRun,sourceRunHeaderProven:false,
   expectedParameters:PARAMS,recordCount:runs.length,
   shaVerifiedRecords:runs.length,inventorySha256,files:runs,
   gribHeaderVerified:false,originalDwdUrlShaAndBitmapVerified:false,
   nativeCell542040Verified:false,productionEligible:false};
}
async function main(){
 if(process.argv.length!==6||process.argv[2]!=="--stage"||process.argv[4]!=="--run")
   throw Error("Usage: node tools/ruc/dwd_staged_source_sha_shadow.mjs --stage PATH --run YYYY-MM-DDTHH:00");
 const report=await inspectRucCorePmslCloudStage({stageRoot:process.argv[3],utcRun:process.argv[5]});
 console.log(JSON.stringify(report,null,2));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
 main().catch(e=>{console.error(String(e?.message||e));process.exitCode=1;});
}
