#!/usr/bin/env node
import assert from 'node:assert/strict';
import {checkMidGroqModelConnectivity as check} from './mid-ai-router-groq-connectivity.mjs';
const sha='a'.repeat(40),key='gsk_FAKE_TEST_ONLY_01234567890';
const stable=()=>({mainSha:sha,stableSha:sha,version:'0.9.85.453'});
const model=(id,active=true)=>({id,active,object:'model'});
const both=()=>({data:[model('openai/gpt-oss-20b'),model('openai/gpt-oss-120b')]});
let payload=both(),status=200,textOverride=null,largeHeader=null,first=stable(),last=stable(),reads=0,seen=[];
const fetchImpl=async(url,opts)=>{
 seen.push({url,opts});
 const raw=textOverride??JSON.stringify(payload);
 return new Response(raw,{status,headers:largeHeader!==null?
  {'content-length':String(largeHeader)}:undefined});
};
const sourceReadback=async()=>++reads%2===1?first:last;
const run=(props={})=>check({apiKey:key,expectedStableSha:sha,
 fetchImpl,sourceReadback,...props});
let n=0;const verify=async f=>{reads=0;await f();n++};
const blocked=(f,reason)=>assert.rejects(f,e=>e?.reason===reason,reason);
await verify(async()=>{const r=await run();
 assert.equal(r.status,'MODEL_CATALOG_CONFIRMED');
 assert.equal(r.freeTierVerified,false);assert.equal(r.zdrVerifiedByApi,false);
 assert.equal(r.providerInferenceCalls,0);assert.equal(r.zeroCashVerified,false);
 assert.equal(r.credentialExposed,false);assert.equal(reads,2);
 assert.equal(seen.at(-1).url,'https://api.groq.com/openai/v1/models');
 assert.equal(seen.at(-1).opts.method,'GET');
 assert.equal(seen.at(-1).opts.redirect,'error');
 assert.equal(JSON.stringify(r).includes(key),false);
});
await verify(()=>blocked(()=>run({apiKey:undefined}),'GROQ_KEY_MISSING_OR_INVALID_FORMAT'));
await verify(()=>blocked(()=>run({expectedStableSha:'wrong'}),'PREFLIGHT_RUNTIME_NOT_CONFIGURED'));
await verify(async()=>{first={...stable(),mainSha:'b'.repeat(40)};
 await blocked(()=>run(),'MID_SOURCE_NOT_STABLE');first=stable()});
await verify(async()=>{last={...stable(),stableSha:'b'.repeat(40)};
 await blocked(()=>run(),'MID_SOURCE_NOT_STABLE');last=stable()});
await verify(async()=>{last={...stable(),version:'0.9.85.454'};
 await blocked(()=>run(),'MID_SOURCE_VERSION_CHANGED');last=stable()});
await verify(async()=>{payload={data:[model('openai/gpt-oss-20b')]};
 const r=await run();assert.equal(r.status,'MODEL_CATALOG_PARTIAL');
 assert.equal(r.models[1].listed,false);payload=both()});
await verify(async()=>{payload={data:[model('openai/gpt-oss-20b'),model('openai/gpt-oss-120b',false)]};
 const r=await run();assert.equal(r.status,'MODEL_CATALOG_PARTIAL');
 assert.equal(r.models[1].active,false);payload=both()});
await verify(async()=>{status=401;await blocked(()=>run(),'GROQ_KEY_UNAUTHORIZED');status=200});
await verify(async()=>{status=403;await blocked(()=>run(),'GROQ_MODEL_ACCESS_DENIED');status=200});
await verify(async()=>{status=429;await blocked(()=>run(),'GROQ_CATALOG_RATE_LIMITED');status=200});
await verify(async()=>{status=500;await blocked(()=>run(),'GROQ_CATALOG_HTTP_FAILED');status=200});
await verify(async()=>{textOverride='broken';await blocked(()=>run(),'GROQ_CATALOG_INVALID_JSON');textOverride=null});
await verify(async()=>{payload={x:true};await blocked(()=>run(),'GROQ_CATALOG_INVALID_SCHEMA');payload=both()});
await verify(async()=>{largeHeader=200000;await blocked(()=>run(),'GROQ_CATALOG_TOO_LARGE');largeHeader=null});
await verify(()=>blocked(()=>run({sourceReadback:async()=>{throw Error('secret')} }),'MID_SOURCE_UNAVAILABLE'));
await verify(async()=>{const r=await run();assert.deepEqual(Object.keys(r.models[0]),['id','listed','active'])});
console.log('MID AI Router Groq API GET models QA OK; scenarios='+n+
 '; no network, inference, credentials or paid calls.');
