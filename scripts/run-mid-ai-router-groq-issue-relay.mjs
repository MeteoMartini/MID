#!/usr/bin/env node
/** Secretless, trusted main-branch issues.opened relay (read-only catalog). */
import {readFileSync} from 'node:fs';
import {readMidGithubSourceSnapshot} from './mid-ai-router-github-readback.mjs';
import {relayGroqCatalogIssue} from './mid-ai-router-groq-issue-bridge.mjs';
try{
 const p=process.env;
 if(p.GITHUB_ACTIONS!=='true'||p.GITHUB_EVENT_NAME!=='issues'||
    p.GITHUB_REPOSITORY!=='MeteoMartini/MID'||
    p.GITHUB_ACTOR!=='MeteoMartini'||p.GITHUB_REF!=='refs/heads/main'||
    !/^[a-f0-9]{40}$/.test(p.GITHUB_SHA||'')||
    typeof p.GITHUB_EVENT_PATH!=='string'||
    typeof p.GH_TOKEN!=='string'||p.GH_TOKEN.length<12)
   throw Object.assign(new Error('Denied'),{reason:'UNTRUSTED_RELAY_CONTEXT'});
 const raw=readFileSync(p.GITHUB_EVENT_PATH,'utf8');
 if(raw.length>262144)
   throw Object.assign(new Error('Excessive'),{reason:'OVERSIZED_ISSUE_EVENT'});
 const body=JSON.parse(raw);
 if(body.action!=='opened'||body.repository?.full_name!=='MeteoMartini/MID')
   throw Object.assign(new Error('Invalid'),{reason:'UNTRUSTED_RELAY_EVENT'});
 const approved=await relayGroqCatalogIssue({
  event:{actor:p.GITHUB_ACTOR,eventName:p.GITHUB_EVENT_NAME,
   repository:p.GITHUB_REPOSITORY,ref:p.GITHUB_REF,
   eventSha:p.GITHUB_SHA,issue:body.issue},
  readSource:()=>readMidGithubSourceSnapshot({fetchImpl:fetch}),
  dispatch:async ({workflow,ref,inputs})=>{
   const url='https://api.github.com/repos/MeteoMartini/MID/actions/workflows/'+
      encodeURIComponent(workflow)+'/dispatches';
   const response=await fetch(url,{method:'POST',redirect:'error',
    headers:{accept:'application/vnd.github+json',
     'content-type':'application/json','x-github-api-version':'2022-11-28',
     authorization:'Bearer '+p.GH_TOKEN},
    body:JSON.stringify({ref,inputs}),signal:AbortSignal.timeout(8000)});
   return {accepted:response.status===204};
  }
 });
 console.log(JSON.stringify(approved));
}catch(e){
 const reason=/^[A-Z_]{4,80}$/.test(e?.reason||'')?
   e.reason:'RELAY_REJECTED';
 console.error('MID Groq ChatGPT catalog relay: '+reason);
 process.exitCode=1;
}
