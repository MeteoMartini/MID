#!/usr/bin/env node
// MID P1 read-only QA. Approved GitHub release assets, exact digests; no tokens or auto-fixes.
// This is diagnostic evidence, not permission to merge, publish or relax any MID gate.
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createReadStream,createWriteStream} from 'node:fs';
import {chmod,mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dir=await mkdtemp(path.join(tmpdir(),'mid-p1-qa-'));
const reportPath=path.join(process.env.RUNNER_TEMP||dir,'mid-p1-tool-report.json');
const assets=[
 {name:'actionlint',version:'1.7.12',url:'https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz',sha:'8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8',archive:true},
 {name:'zizmor',version:'1.32.0',url:'https://github.com/zizmorcore/zizmor/releases/download/v1.32.0/zizmor-x86_64-unknown-linux-gnu.tar.gz',sha:'bb110cc765eca9cd7efb2e284a956be5974c60027b0970f16397d86208a9957b',archive:true},
 {name:'biome',version:'2.6.7',url:'https://github.com/biomejs/biome/releases/download/%40biomejs/biome%402.6.7/biome-linux-x64',sha:'d924b8407471748465121f0a2dc1a0bc277038b0b89142e77583e3ce0dda3746',archive:false}
];
const evidence={schema:1,mode:'diagnostic',releaseAuthorized:false,mergeAuthorized:false,tools:[],status:'UNAVAILABLE'};
function run(command,args,environment={}){
 const result=spawnSync(command,args,{cwd:root,env:{...process.env,...environment,GITHUB_TOKEN:'',GH_TOKEN:'',ZIZMOR_GITHUB_TOKEN:'',ZIZMOR_OFFLINE:'true',ZIZMOR_NO_ONLINE_AUDITS:'true'},encoding:'utf8',timeout:120000,maxBuffer:2*1024*1024,shell:false});
 return {status:result.status,error:result.error?.code||null,stdout:(result.stdout||'').slice(0,40000),stderr:(result.stderr||'').slice(0,10000)};
}
async function download(spec){
 const response=await fetch(spec.url,{redirect:'follow',signal:AbortSignal.timeout(90000)});
 if(!response.ok||!response.body)throw new Error(spec.name+' download HTTP '+response.status);
 const archive=path.join(dir,spec.name+(spec.archive?'.tar.gz':''));
 await pipeline(Readable.fromWeb(response.body),createWriteStream(archive,{flags:'wx',mode:0o600}));
 const h=createHash('sha256');let bytes=0;
 for await(const chunk of createReadStream(archive)){bytes+=chunk.length;h.update(chunk);}
 if(h.digest('hex')!==spec.sha)throw new Error(spec.name+' release SHA-256 mismatch');
 if(bytes<100000||bytes>160000000)throw new Error(spec.name+' unexpected asset size');
 if(spec.archive){
  const result=spawnSync('tar',['-xzf',archive,'-C',dir,spec.name],{encoding:'utf8',timeout:15000});
  if(result.status!==0)throw new Error(spec.name+' verified archive extraction failed');
 }
 const bin=path.join(dir,spec.name);
 await chmod(bin,0o755);
 return{bin,bytes};
}
try{
 for(const item of assets){
  const {bin,bytes}=await download(item);
  evidence.tools.push({name:item.name,version:item.version,sha256Verified:true,bytes});
 }
 const env={PATH:dir+path.delimiter+(process.env.PATH||'')};
 const pilot=run(process.execPath,['tools/ci/mid-workflow-quality-pilot.mjs'],env);
 evidence.tools.find(x=>x.name==='actionlint').execution=pilot.status;
 evidence.tools.find(x=>x.name==='zizmor').execution=pilot.status;
 let details;
 try{details=JSON.parse(pilot.stdout);}catch{details={status:'INVALID_SCANNER_REPORT'};}
 evidence.workflow=details;
 const biome=run(path.join(dir,'biome'),['lint','src/currentSurroundingsTemperature.ts','src/CurrentSurroundings.tsx','src/CurrentSurroundings.css'],env);
 evidence.tools.find(x=>x.name==='biome').execution=biome.status;
 evidence.biome={status:biome.status===0?'PASS':'FINDINGS_OR_ERROR',output:biome.stdout.slice(0,12000),errors:biome.stderr.slice(0,10000)};
 evidence.status=pilot.status===0&&biome.status===0?'PILOT_PASS':'PILOT_FINDINGS_OR_FAILURE';
}catch(error){
 evidence.status='SCANNER_BOOTSTRAP_ERROR';
 evidence.error=error instanceof Error?error.message:String(error);
}finally{
 try{await writeFile(reportPath,JSON.stringify(evidence,null,2)+'\n');}catch(error){console.error('MID P1 report unavailable:',String(error));}
 console.log(JSON.stringify({status:evidence.status,tools:evidence.tools.map(x=>({name:x.name,version:x.version,execution:x.execution??null,sha256Verified:x.sha256Verified})),reportPath,releaseAuthorized:false}));
 await rm(dir,{recursive:true,force:true});
}
if(evidence.status!=='PILOT_PASS')process.exitCode=1;
