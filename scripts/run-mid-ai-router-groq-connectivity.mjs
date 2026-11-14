#!/usr/bin/env node
/**
 * Manual trusted GitHub Workflow ONLY.
 * No raw errors, model output or API keys are ever logged.
 */
import {checkMidGroqModelConnectivity} from './mid-ai-router-groq-connectivity.mjs';
import {readMidGithubSourceSnapshot} from './mid-ai-router-github-readback.mjs';
import {validateGroqCatalogDispatch} from './mid-ai-router-groq-issue-bridge.mjs';
import {readFileSync} from 'node:fs';
try{
 if(process.env.GITHUB_ACTIONS!=='true'||
    process.env.GITHUB_RUN_ATTEMPT!=='1'||
    process.env.GITHUB_EVENT_NAME!=='workflow_dispatch'||
    process.env.GITHUB_REPOSITORY!=='MeteoMartini/MID'||
    process.env.GITHUB_REF!=='refs/heads/mid-stable'||
    typeof process.env.GITHUB_EVENT_PATH!=='string')
   throw Object.assign(new Error('Context denied'),{reason:'TRUSTED_WORKFLOW_ONLY'});
 // GitHub may implicitly create an unprotected environment when first used.
 // Do not even read a provider key or start a GET unless the owner
 // deliberately armed this narrow read-only QA check.
 if(process.env.MID_AI_ROUTER_GROQ_CATALOG_ARMED!=='MID-GROQ-CATALOG-QA-V1')
   throw Object.assign(new Error('QA not armed'),{reason:'GROQ_QA_NOT_ARMED'});
 const raw=readFileSync(process.env.GITHUB_EVENT_PATH,'utf8');
 if(raw.length>16384)
   throw Object.assign(new Error('Excessive'),{reason:'INVALID_WORKFLOW_INPUTS'});
 const event=JSON.parse(raw);
 const attested=await validateGroqCatalogDispatch({
  actor:process.env.GITHUB_ACTOR,
  repository:process.env.GITHUB_REPOSITORY,
  ref:process.env.GITHUB_REF,
  eventName:process.env.GITHUB_EVENT_NAME,
  eventSha:process.env.GITHUB_SHA,
  inputs:event.inputs,
  readSource:()=>readMidGithubSourceSnapshot({fetchImpl:fetch}),
  readIssue:async issueNo=>{
   const url='https://api.github.com/repos/MeteoMartini/MID/issues/'+issueNo;
   const response=await fetch(url,{method:'GET',redirect:'error',
    cache:'no-store',credentials:'omit',headers:{accept:'application/vnd.github+json'},
    signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw new Error('Issue unavailable');
   const item=await response.json();
   return item;
  }
 });
 if(attested.sourceSha!==process.env.GITHUB_SHA)
   throw Object.assign(new Error('Drift'),{reason:'LIVE_SOURCE_DRIFT'});
 const result=await checkMidGroqModelConnectivity({
  apiKey:process.env.GROQ_API_KEY,
  expectedStableSha:process.env.GITHUB_SHA,
  fetchImpl:fetch,
  sourceReadback:()=>readMidGithubSourceSnapshot({fetchImpl:fetch})
 });
 console.log(JSON.stringify(result));
 if(result.status!=='MODEL_CATALOG_CONFIRMED')process.exitCode=1;
}catch(e){
 const why=/^[A-Z_]{4,72}$/.test(e?.reason||'')?e.reason:'GROQ_PREFLIGHT_FAILED';
 console.error('MID Groq Free preflight: '+why);
 process.exitCode=1;
}
