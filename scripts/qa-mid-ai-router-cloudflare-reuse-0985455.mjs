#!/usr/bin/env node
import assert from 'node:assert/strict';
import {inspectMidCloudflareReuse as inspect} from './mid-ai-router-cloudflare-reuse.mjs';
const accountId='a'.repeat(32),token='x'.repeat(42);
let n=0,calls=[],mode='ok',existing=true,worker=true;
const fetchImpl=async(url,options)=>{
 calls.push({url,options});
 if(mode==='throw')throw Error('not shown');
 if(mode==='denied')return new Response('Denied',{status:403});
 if(mode==='badjson')return new Response('{',{headers:{'content-type':'application/json'}});
 if(mode==='badsize')return new Response('bad',{headers:{
  'content-length':'262145','content-type':'application/json'}});
 if(mode==='schema')return Response.json({success:false,result:[]});
 if(url.endsWith('/scripts'))return Response.json({success:true,result:
  existing?[{id:'mid-data-proxy'},...(worker?[{id:'mid-ai-router-mcp'}]:[])]:[]});
 if(url.endsWith('/durable_objects/namespaces'))return Response.json({success:true,result:
  [{name:'MidAiLedger',script:'mid-ai-router-mcp',use_sqlite:true}]});
 throw Error('unrecognized endpoint');
};
const run=x=>inspect({accountId,token,fetchImpl,now:()=>1700000000000,...x});
const test=async fn=>{await fn();n++};
const deny=async(reason,x)=>assert.rejects(()=>run(x),e=>e?.reason===reason);
await test(async()=>{const z=await run();assert.equal(z.status,'EXISTING_MID_CLOUDFLARE_ACCOUNT_READBACK_OK');
 assert.equal(z.existingWeatherWorkerConfirmed,true);
 assert.equal(z.isolatedMcpWorkerObserved,true);
 assert.equal(z.sqliteRouterNamespaceObserved,true);
 assert.equal(z.cloudflareReadOnlyCalls,2);
 assert.equal(z.deployments,0);assert.equal(z.dispatchAuthorized,false);
 assert.equal(z.freePlanVerified,false);
 assert.equal(JSON.stringify(z).includes(token),false);
 assert.ok(calls.every(x=>x.options.method==='GET'&&x.options.redirect==='error'));
 assert.deepEqual(calls.slice(0,2).map(x=>new URL(x.url).pathname),[
 '/client/v4/accounts/'+accountId+'/workers/scripts',
 '/client/v4/accounts/'+accountId+'/workers/durable_objects/namespaces']);});
await test(async()=>deny('PROTECTED_CLOUDFLARE_CONTEXT_REQUIRED',{token:''}));
await test(async()=>deny('PROTECTED_CLOUDFLARE_CONTEXT_REQUIRED',{accountId:'wrong'}));
await test(async()=>{mode='denied';await deny('CLOUDFLARE_READ_DENIED');mode='ok'});
await test(async()=>{mode='throw';await deny('CLOUDFLARE_NETWORK_UNAVAILABLE');mode='ok'});
await test(async()=>{mode='badjson';await deny('CLOUDFLARE_INVALID_JSON');mode='ok'});
await test(async()=>{mode='badsize';await deny('CLOUDFLARE_EXCESSIVE_RESPONSE');mode='ok'});
await test(async()=>{mode='schema';await deny('CLOUDFLARE_SCHEMA_INVALID');mode='ok'});
await test(async()=>{existing=false;await deny('EXISTING_MID_WORKER_NOT_CONFIRMED');
 existing=true});
await test(async()=>{worker=false;const z=await run();assert.equal(z.isolatedMcpWorkerObserved,false);
 assert.equal(z.dispatchAuthorized,false);worker=true});
assert.equal(n,10);
console.log('MID existing Cloudflare account read-only QA OK; scenarios='+n+
 '; mocked GET only, no secrets, writes, deployment or inference.');
