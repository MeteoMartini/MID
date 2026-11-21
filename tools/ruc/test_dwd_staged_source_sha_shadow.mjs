import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, unlink, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectRucCorePmslCloudStage } from "./dwd_staged_source_sha_shadow.mjs";
const RUN="2026-11-03T07:00",FOLDER="2026-11-03T0700";
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),"mid-ruc-stage-"));
 for(const param of ["PMSL","CLCT"]){
  const p=join(root,FOLDER,"deterministic",param);
  await mkdir(p,{recursive:true});
  for(let h=0;h<=27;h++)await writeFile(join(p,"source_PT"+String(h).padStart(3,"0")+"H00M.grib2"),Buffer.alloc(128,h+1));
 }
 return root;
}
const pathOf=(root,param,h)=>join(root,FOLDER,"deterministic",param,
 "source_PT"+String(h).padStart(3,"0")+"H00M.grib2");
test("exact native run and PMSL/CLCT 0..27h original-stage inventory is SHA256-fingerprinted only",async()=>{
 const dir=await fixture();try{
  const result=await inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:RUN});
  assert.equal(result.recordCount,56);
  assert.equal(result.inventorySha256.length,64);
  assert.equal(result.files.every(f=>f.sha256.length===64),true);
  assert.equal(result.gribHeaderVerified,false);
  assert.equal(result.productionEligible,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("missing forecast hour cannot be assumed zero",async()=>{
 const dir=await fixture();try{
  await unlink(pathOf(dir,"CLCT",6));
  await assert.rejects(inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:RUN}),/Incomplete/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("duplicate native lead from a second path fails closed",async()=>{
 const dir=await fixture();try{
  await writeFile(join(dir,FOLDER,"deterministic","PMSL","additional_PT006H00M.grib2"),Buffer.alloc(128,4));
  await assert.rejects(inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:RUN}),/Duplicate/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("symlink input does not escape staging",async()=>{
 const dir=await fixture();try{
  await unlink(pathOf(dir,"PMSL",6));
  await symlink(pathOf(dir,"CLCT",6),pathOf(dir,"PMSL",6));
  await assert.rejects(inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:RUN}),/symlink/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("source byte change changes SHA inventory, no false same-source equivalence",async()=>{
 const dir=await fixture();try{
  const a=await inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:RUN});
  await writeFile(pathOf(dir,"PMSL",6),Buffer.alloc(128,99));
  const b=await inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:RUN});
  assert.notEqual(a.inventorySha256,b.inventorySha256);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test("invalid or untrusted UTC run rejected",async()=>{
 const dir=await fixture();try{
  await assert.rejects(inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:"2026-02-30T07:00"}));
  await assert.rejects(inspectRucCorePmslCloudStage({stageRoot:dir,utcRun:"../../"}));
 }finally{await rm(dir,{recursive:true,force:true});}
});
