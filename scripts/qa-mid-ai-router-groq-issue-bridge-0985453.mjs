#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeGroqCatalogIssue,validateGroqCatalogIssue,relayGroqCatalogIssue,
 validateGroqCatalogDispatch} from './mid-ai-router-groq-issue-bridge.mjs';
const sha='a'.repeat(40),version='0.9.85.453',now=Date.parse('2026-11-10T11:00:00Z');
const requestId='mid-groq-catalog-00001',record=makeGroqCatalogIssue({requestId,stableSha:sha,version});
const source={mainSha:sha,stableSha:sha,version};
const issue={number:929,user:{login:'MeteoMartini',id:75040651},
 author_association:'OWNER',state:'open',created_at:new Date(now-30000).toISOString(),
 title:record.title,body:record.body};
const event={issue,actor:'MeteoMartini',eventName:'issues',repository:'MeteoMartini/MID',
 ref:'refs/heads/main',eventSha:sha};
let n=0;const test=async f=>{await f();n++};
const denied=(f,code)=>assert.rejects(f,e=>e?.reason===code,code);
await test(()=>{const x=validateGroqCatalogIssue({...event,source,now});
 assert.equal(x.requestId,requestId);assert.equal(x.issueNumber,929);
 assert.equal(record.noSecrets,true);assert.equal(record.noInference,true)});
await test(async()=>{let count=0;const r=await relayGroqCatalogIssue({event,
 readSource:async()=>source,now:()=>now,
 dispatch:async args=>{count++;assert.equal(args.ref,'mid-stable');
 assert.equal(args.workflow,'mid-ai-router-groq-free-preflight.yml');
 assert.deepEqual(args.inputs,{issue_number:'929',request_id:requestId,expected_stable_sha:sha});
 return {accepted:true}}});
 assert.equal(count,1);assert.equal(r.inferenceCallsMade,0);
 assert.equal(r.status,'DISPATCH_REQUEST_ACCEPTED')});
await test(()=>denied(()=>relayGroqCatalogIssue({event,readSource:async()=>source,
 now:()=>now,dispatch:async()=>{throw Error('network')}}),'WORKFLOW_DISPATCH_FAILED'));
await test(()=>denied(()=>relayGroqCatalogIssue({event,readSource:async()=>source,
 now:()=>now,dispatch:async()=>({accepted:false})}),'WORKFLOW_DISPATCH_NOT_CONFIRMED'));
const invalid=(parts,reason)=>denied(async()=>validateGroqCatalogIssue({...event,...parts,source,now}),reason);
await test(()=>invalid({actor:'stranger'},'UNTRUSTED_RELAY_EVENT'));
await test(()=>invalid({ref:'refs/heads/feature'},'UNTRUSTED_RELAY_EVENT'));
await test(()=>invalid({issue:{...issue,user:{login:'bad',id:1}}},'ISSUE_OWNER_NOT_AUTHORIZED'));
await test(()=>invalid({issue:{...issue,author_association:'CONTRIBUTOR'}},'ISSUE_OWNER_NOT_AUTHORIZED'));
await test(()=>invalid({issue:{...issue,body:record.body+'extra'}},'ISSUE_BODY_NOT_CANONICAL'));
await test(()=>invalid({issue:{...issue,title:record.title+'extra'}},'ISSUE_BODY_NOT_CANONICAL'));
await test(()=>invalid({eventSha:'b'.repeat(40)},'LIVE_SOURCE_DRIFT'));
await test(()=>invalid({issue:{...issue,created_at:new Date(now-4000000).toISOString()}},'ISSUE_NOT_FRESH'));
await test(()=>denied(async()=>makeGroqCatalogIssue({requestId:'bad',stableSha:sha,version}),
 'INVALID_PUBLIC_REQUEST'));
const dest={actor:'github-actions[bot]',repository:'MeteoMartini/MID',
 ref:'refs/heads/mid-stable',eventName:'workflow_dispatch',eventSha:sha,
 inputs:{issue_number:'929',request_id:requestId,expected_stable_sha:sha},
 readSource:async()=>source,readIssue:async()=>issue,now:()=>now};
await test(async()=>{const v=await validateGroqCatalogDispatch(dest);
 assert.equal(v.mode,'OWNER_ISSUE_RELAY')});
await test(async()=>{const v=await validateGroqCatalogDispatch({...dest,actor:'MeteoMartini',inputs:{}});
 assert.equal(v.mode,'OWNER_MANUAL')});
await test(()=>denied(()=>validateGroqCatalogDispatch({...dest,inputs:{}}),'BOT_MISSING_ISSUE_PROOF'));
await test(()=>denied(()=>validateGroqCatalogDispatch({...dest,ref:'refs/heads/main'}),'INVALID_DESTINATION_CONTEXT'));
await test(()=>denied(()=>validateGroqCatalogDispatch({...dest,readIssue:async()=>({...issue,user:{login:'bad',id:1}})}),'RELAY_ORIGIN_ISSUE_REJECTED'));
await test(()=>denied(()=>validateGroqCatalogDispatch({...dest,inputs:{...dest.inputs,request_id:'mid-groq-wrong-000'}}),'RELAY_REQUEST_MISMATCH'));
await test(()=>{
 // GitHub Actions cancel-in-progress:false does not preserve old PENDING
 // entries; queue:max explicitly preserves a bounded FIFO up to 100.
 const pairs=[
  ['mid-ai-router-groq-free-preflight.yml'],
  ['mid-ai-router-groq-issue-relay.yml']
 ];
 for(const [name] of pairs){
  const primary=readFileSync(new URL('../.github/workflows/'+name,import.meta.url),'utf8');
  const mirror=readFileSync(new URL('../ci/github/workflows/'+name,import.meta.url),'utf8');
  assert.equal(primary,mirror,'workflow mirror mismatch: '+name);
  assert.match(primary,/concurrency:\n  group: [^\n]+\n  cancel-in-progress: false\n  queue: max\n/);
 }
});
await test(()=>{
 // A manually re-run job must never re-dispatch, nor re-read a provider
 // catalog as if it were the original owner-approved event.
 const catalog=readFileSync(new URL('./run-mid-ai-router-groq-connectivity.mjs',import.meta.url),'utf8');
 const relay=readFileSync(new URL('./run-mid-ai-router-groq-issue-relay.mjs',import.meta.url),'utf8');
 assert.match(catalog,/process\.env\.GITHUB_RUN_ATTEMPT!=='1'/);
 assert.match(relay,/p\.GITHUB_RUN_ATTEMPT!=='1'/);
});
console.log('MID Groq ChatGPT Issue bridge QA OK; scenarios='+n+
 '; no GitHub actions, secrets, provider calls or network.');
