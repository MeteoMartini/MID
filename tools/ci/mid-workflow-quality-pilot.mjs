#!/usr/bin/env node
// MID workflow security QA: offline, read-only, never a release/merge authorization.
// Tools are preinstalled by the caller from separately verified, pinned artifacts.
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const MID_WORKFLOW_PILOT_NAMES=Object.freeze([
  'agent-source-release.yml','chatgpt-pr-gate.yml','install-mid.yml',
  'release-self-heal.yml','release-train-preflight.yml','mid-code-revision.yml',
  'mid-ruc-preprocess.yml'
]);
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const MAX_OUTPUT=32_768;
const safety=(reason,extra={})=>({schema:1,status:'BLOCKED',reason,releaseAuthorized:false,mergeAuthorized:false,...extra});

// Never scan an untrusted candidate path or relax canonical/active mirrors.
export function collectWorkflowPilot(root=ROOT,read=readFileSync){
  if(typeof root!=='string'||!path.isAbsolute(root))return safety('ROOT_INVALID');
  const files=[];
  for(const name of MID_WORKFLOW_PILOT_NAMES){
    const active=path.join(root,'.github','workflows',name);
    const canonical=path.join(root,'ci','github','workflows',name);
    let a,c;
    try{a=read(active);c=read(canonical);}catch{return safety('MIRROR_MISSING',{workflow:name});}
    // Buffers are compared byte-wise to ensure no silent workflow divergence.
    if(!Buffer.isBuffer(a)||!Buffer.isBuffer(c)||!a.equals(c))
      return safety('MIRROR_DRIFT',{workflow:name});
    files.push(active);
  }
  return {schema:1,status:'INVENTORY_OK',files,releaseAuthorized:false,mergeAuthorized:false};
}

export function makeWorkflowToolPlan(files){
  if(!Array.isArray(files)||files.length!==MID_WORKFLOW_PILOT_NAMES.length||
     files.some(x=>typeof x!=='string'||!path.isAbsolute(x)))throw Error('Unsafe pilot inventory');
  return [
    {name:'actionlint',command:'actionlint',args:['-oneline',...files]},
    {name:'zizmor',command:'zizmor',args:['--offline','--no-config','--strict-collection','--format=json',...files]}
  ];
}

/** Count findings from the complete tool output before its human-readable excerpt
 * is capped. Unsupported actionlint queue syntax is observed, never deleted.
 * Zizmor JSON must remain parseable and its exit code consistent with findings. */
export function summarizeWorkflowScanner(name,raw,exitCode){
 if(name==='actionlint'){
  const rows=String(raw||'').split(/\r?\n/).filter(Boolean);
  return {findings:rows.length,knownGitHubQueueSchemaLag:
   rows.filter(x=>x.includes('unexpected key "queue" for "concurrency" section')).length,
   shellcheckStyle:rows.filter(x=>x.includes('SC2129:style:')).length};
 }
 if(name!=='zizmor')return null;
 let items;
 try{items=JSON.parse(String(raw||''));}catch{return {valid:false,reason:'UNPARSEABLE_ZIZMOR_JSON'};}
 if(!Array.isArray(items))return {valid:false,reason:'NON_ARRAY_ZIZMOR_JSON'};
 const bySeverity={},byAudit={},byWorkflow={};
 for(const item of items){
  if(!item||typeof item.ident!=='string'||typeof item.determinations?.severity!=='string')
   return {valid:false,reason:'MALFORMED_ZIZMOR_ITEM'};
  const severity=item.determinations.severity,audit=item.ident;
  bySeverity[severity]=(bySeverity[severity]||0)+1;
  byAudit[audit]=(byAudit[audit]||0)+1;
  const path=String(item.locations?.[0]?.symbolic?.key?.Local?.verbatim_path||'');
  const file=path.match(/\.github\/workflows\/[^/]+$/)?.[0]||'unknown';
  byWorkflow[file]=(byWorkflow[file]||0)+1;
 }
 const inconsistent=exitCode===0&&items.length>0||exitCode>=11&&exitCode<=14&&items.length===0;
 return {valid:!inconsistent,reason:inconsistent?'SCANNER_EXIT_FINDINGS_MISMATCH':null,
  findings:items.length,bySeverity,byAudit,byWorkflow};
}

const safeEnv=env=>({PATH:env.PATH||'/usr/bin:/bin',HOME:env.HOME||'/tmp',LANG:'C',LC_ALL:'C',ZIZMOR_OFFLINE:'true',ZIZMOR_NO_ONLINE_AUDITS:'true'});
export function runWorkflowQualityPilot({root=ROOT,read=readFileSync,invoke=spawnSync,env=process.env}={}){
  const inventory=collectWorkflowPilot(root,read);
  if(inventory.status!=='INVENTORY_OK')return inventory;
  const results=[];
  for(const tool of makeWorkflowToolPlan(inventory.files)){
    let run;
    try{
      run=invoke(tool.command,tool.args,{cwd:root,env:safeEnv(env),encoding:'utf8',timeout:120_000,maxBuffer:1024*1024,shell:false,windowsHide:true});
    }catch(e){return safety('SCANNER_EXECUTION_EXCEPTION',{tool:tool.name,detail:String(e?.code||'ERROR')});}
    const exitCode=Number.isInteger(run?.status)?run.status:null;
    const output=String(run?.stdout||'').slice(0,MAX_OUTPUT);
    const errors=String(run?.stderr||'').slice(0,MAX_OUTPUT);
    const fullOutput=String(run?.stdout||'');
    const summary=summarizeWorkflowScanner(tool.name,fullOutput,exitCode);
    let verdict=run?.error?'SCANNER_UNAVAILABLE':exitCode===0?'PASS':exitCode===null?'SCANNER_INTERRUPTED':'FINDINGS_OR_ERROR';
    if(tool.name==='zizmor'&&summary?.valid!==true)verdict='SCANNER_OUTPUT_INVALID';
    results.push({tool:tool.name,verdict,exitCode,summary,
      outputTruncated:fullOutput.length>MAX_OUTPUT,output,errors});
  }
  return {schema:1,status:results.every(r=>r.verdict==='PASS')?'PILOT_PASS':'PILOT_FINDINGS_OR_FAILURE',
    files:MID_WORKFLOW_PILOT_NAMES,results,offline:true,readOnly:true,
    releaseAuthorized:false,mergeAuthorized:false,
    notice:'Diagnostic only; never counts as Source, Installer, Review, or Stable acceptance.'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=runWorkflowQualityPilot();
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(result.status!=='PILOT_PASS')process.exitCode=1;
}
