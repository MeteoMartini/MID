#!/usr/bin/env node
// Deterministic, offline MCP HTTP safety tests. No network, secrets, billing,
// Cloudflare account, signature issuer or provider inference is used.
import assert from 'node:assert/strict';
import {createMidAiMcpHttpHandler} from './mid-ai-router-mcp-http.mjs';
let tests=0,readCount=0,execCount=0;
const t=async fn=>{await fn();tests++};
const sha='a'.repeat(40);
const auth={verified:true,audience:'mid-ai-router',principalSha256:'b'.repeat(64),
 scopes:['mid-ai:read','mid-ai:infer-public']};
let activeAuth=auth;
let source={mainSha:sha,stableSha:sha,checkedAt:new Date(100000).toISOString(),
 versionMirrors:{package:'0.9.85.455',baseline:'0.9.85.455',registry:'0.9.85.455'}};
const context={
 verifiedAuth:async()=>activeAuth,readSource:async()=>{readCount++;return source},
 execute:async(input)=>{execCount++;if(input?.fail)throw Object.assign(new Error('secret:never'),{reason:'SIGNED_GRANT_REQUIRED'});
  return {status:'UNTRUSTED_REVIEW_ONLY',requestId:input.requestId,
   stableSha:sha,provider:'groq',model:'openai/gpt-oss-20b',
   actualModel:'openai/gpt-oss-20b',text:'Untrusted model text',
   usageStatus:'NOT_REPORTED',costStatus:'NOT_VERIFIED',cashSpendStatus:'NOT_VERIFIED',
   automaticRetry:false,additionalCashAuthorizedUsd:0}},
 now:()=>100000
};
const handler=createMidAiMcpHttpHandler(context);
const call=async(method,params={},id=1,opts={})=>{
 const request=new Request('https://example.test/mcp',{method:'POST',
  headers:{'content-type':'application/json',...(opts.headers||{})},
  body:JSON.stringify({jsonrpc:'2.0',id,method,params})});
 const response=await handler(request);
 return {status:response.status,body:await response.json()};
};
const tool=async(name,args={})=>call('tools/call',{name,arguments:args});
const plan={requestId:'mid-mcp-plan-01',expectedStableSha:sha,
 expectedVersion:'0.9.85.455',kind:'independent-review',prompt:'Only public weather review'};
await t(async()=>{const r=await call('initialize');assert.equal(r.status,200);
 assert.equal(r.body.result.serverInfo.name,'mid-ai-router')});
await t(async()=>{const r=await call('ping');assert.deepEqual(r.body.result,{})});
await t(async()=>{const r=await call('tools/list');
 assert.equal(r.body.result.tools.length,3);
 assert.equal(r.body.result.tools[2].annotations.idempotentHint,false)});
await t(async()=>{const r=await tool('list_models_status');const x=JSON.parse(r.body.result.content[0].text);
 assert.equal(x.dispatchAuthorized,false);assert.equal(x.zeroCashVerified,false)});
await t(async()=>{const r=await tool('plan_request',plan);const x=JSON.parse(r.body.result.content[0].text);
 assert.equal(x.status,'PLAN_ONLY');assert.equal(x.dispatchAuthorized,false);
 assert.equal(x.prompt,undefined);assert.equal(execCount,0)});
await t(async()=>{const r=await tool('plan_request',{...plan,expectedStableSha:'f'.repeat(40)});
 assert.equal(JSON.parse(r.body.result.content[0].text).reason,'SOURCE_DRIFT')});
await t(async()=>{const r=await tool('plan_request',{...plan,prompt:'password:secret-data-123456789'});
 assert.equal(JSON.parse(r.body.result.content[0].text).reason,'INVALID_PUBLIC_TASK')});
await t(async()=>{const r=await tool('plan_request',{...plan,prompt:'contact someone@example.com'});
 assert.equal(JSON.parse(r.body.result.content[0].text).reason,'INVALID_PUBLIC_TASK')});
await t(async()=>{const n=execCount;activeAuth={...auth,scopes:['mid-ai:read']};
 const r=await tool('execute_public_review',{task:{requestId:'mid-mcp-exec-001'}});
 assert.equal(JSON.parse(r.body.result.content[0].text).reason,'OAUTH_EXECUTION_SCOPE_REQUIRED');
 assert.equal(execCount,n);activeAuth=auth});
await t(async()=>{const r=await tool('execute_public_review',{task:{requestId:'mid-mcp-exec-001',fail:true}});
 assert.equal(JSON.parse(r.body.result.content[0].text).reason,'SIGNED_GRANT_REQUIRED')});
await t(async()=>{const r=await tool('execute_public_review',{task:{requestId:'mid-mcp-exec-002'}});
 const x=JSON.parse(r.body.result.content[0].text);
 assert.equal(x.status,'UNTRUSTED_REVIEW_ONLY');assert.equal(x.costStatus,'NOT_VERIFIED');
 assert.equal(x.text,'Untrusted model text');assert.equal(x.extraModelCallsTriggered,0)});
await t(async()=>{activeAuth={...auth,verified:false};const r=await call('tools/list');
 assert.equal(r.status,401);activeAuth=auth});
await t(async()=>{activeAuth={...auth,principalSha256:'invalid'};const r=await call('tools/list');
 assert.equal(r.status,401);activeAuth=auth});
await t(async()=>{const r=await call('tools/list',{},9,{headers:{origin:'https://evil.test'}});
 assert.equal(r.status,403)});
await t(async()=>{const request=new Request('https://example.test/mcp',{method:'GET'});
 const r=await handler(request);assert.equal(r.status,405)});
await t(async()=>{const request=new Request('https://example.test/mcp',{method:'POST',
 headers:{'content-type':'text/plain'},body:'hi'});
 const r=await handler(request);assert.equal(r.status,415)});
await t(async()=>{const request=new Request('https://example.test/mcp',{method:'POST',
 headers:{'content-type':'application/json'},body:'x'.repeat(32769)});
 const r=await handler(request);assert.equal(r.status,413)});
await t(async()=>{const request=new Request('https://example.test/mcp',{method:'POST',
 headers:{'content-type':'application/json'},body:'{not-valid'});
 const r=await handler(request);assert.equal(r.status,400)});
await t(async()=>{source={...source,checkedAt:new Date(1).toISOString()};
 const r=await tool('plan_request',plan);assert.equal(JSON.parse(r.body.result.content[0].text).reason,
 'SOURCE_READBACK_STALE_OR_INVALID')});
await t(async()=>{source={...source,checkedAt:new Date(100000).toISOString(),
 versionMirrors:{package:'0.9.85.455',baseline:'0.9.85.454',registry:'0.9.85.455'}};
 const r=await tool('plan_request',plan);
 assert.equal(JSON.parse(r.body.result.content[0].text).reason,'SOURCE_READBACK_STALE_OR_INVALID')});
await t(async()=>{source={...source,versionMirrors:{
 package:'0.9.85.455',baseline:'0.9.85.455',registry:'0.9.85.455'}};
 const r=await call('methods/unknown');assert.equal(r.body.error.code,-32601)});
await t(async()=>{const r=await tool('execute_public_review',{task:{requestId:'mid-mcp-exec-003'},evil:true});
 assert.equal(JSON.parse(r.body.result.content[0].text).reason,'SIGNED_TASK_REQUIRED')});
assert.ok(readCount>=4);assert.equal(execCount,2);
console.log('MID AI Router MCP protected HTTP offline QA OK; scenarios='+tests+'; no network, secrets or external inference.');
