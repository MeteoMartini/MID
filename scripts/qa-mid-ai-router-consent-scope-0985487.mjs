#!/usr/bin/env node
/** Verified-original OAuth scopes: no real provider, token, account or network. */
import assert from 'node:assert/strict';
import {rememberMidAiOAuthRequestedScopes,verifyMidAiOAuthRequestedScopes}
 from '../router/cloudflare/consent-page.mjs';
let scenarios=0;
const check=async f=>{await f();scenarios++};
const fail=(f,reason)=>assert.rejects(f,e=>e?.reason===reason,reason);
const handle='a'.repeat(43),at=Date.parse('2026-11-16T22:00:00Z');
let now=at;
const request={clientId:'https://client.example/cimd.json',
 redirectUri:'https://client.example/callback',resource:'https://mid.example/mcp',
 issuer:'https://auth.example',state:'test-csrf-state',
 codeChallenge:'S256fakeChallenge',codeChallengeMethod:'S256',
 scope:['mid-ai:read']};
const store=()=>{const rows=new Map();const ttl=new Map();return {
 rows,ttl,async put(k,v,opts){rows.set(k,v);ttl.set(k,opts.expirationTtl)},
 async get(k){return rows.get(k)??null},
 async delete(k){rows.delete(k);}
}};
const save=async(kv,req=request,when=now)=>
 rememberMidAiOAuthRequestedScopes({kv,handle,request:req,now:()=>when});
const verify=async(kv,req=request,selected=['mid-ai:read'],when=now)=>
 verifyMidAiOAuthRequestedScopes({kv,handle,
 approvedRequest:{...req,scope:selected},selected,now:()=>when});
await check(async()=>{const kv=store();await save(kv);const [key]=kv.rows.keys();
 assert.ok(key.startsWith('mid-ai:oauth:original-scope:'));
 assert.equal(key.includes(handle),false);assert.equal(kv.ttl.get(key),600);
 assert.equal(kv.rows.get(key).includes('https://client.example'),false);
 assert.deepEqual(await verify(kv),['mid-ai:read']);assert.equal(kv.rows.size,0)});
await check(async()=>{const kv=store(),req={...request,
 scope:['mid-ai:read','mid-ai:infer-public']};await save(kv,req);
 assert.deepEqual(await verify(kv,req,['mid-ai:read','mid-ai:infer-public']),
 ['mid-ai:read','mid-ai:infer-public']);});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,request,['mid-ai:read','mid-ai:infer-public']),
 'UNREQUESTED_OR_INVALID_SCOPE');assert.equal(kv.rows.size,0)});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,{...request,clientId:'https://evil.example'}),
 'CONSENT_SNAPSHOT_BINDING_MISMATCH')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,{...request,redirectUri:'https://evil.example/callback'}),
 'CONSENT_SNAPSHOT_BINDING_MISMATCH')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,{...request,resource:'https://different.example/mcp'}),
 'CONSENT_SNAPSHOT_BINDING_MISMATCH')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,{...request,state:'different-state'}),
 'CONSENT_SNAPSHOT_BINDING_MISMATCH')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,{...request,codeChallenge:'different'}),
 'CONSENT_SNAPSHOT_BINDING_MISMATCH')});
await check(async()=>{const kv=store();await fail(()=>verify(kv),
 'CONSENT_SNAPSHOT_UNAVAILABLE')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,request,['mid-ai:read'],at+600001),
 'CONSENT_SNAPSHOT_EXPIRED')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,request,['mid-ai:read'],at-1),
 'CONSENT_SNAPSHOT_EXPIRED')});
await check(async()=>{const kv=store();await save(kv);const key=[...kv.rows.keys()][0];
 kv.rows.set(key,'{not json');
 await fail(()=>verify(kv),'CONSENT_SNAPSHOT_UNAVAILABLE')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verifyMidAiOAuthRequestedScopes({kv,handle,
 approvedRequest:{...request,scope:['mid-ai:infer-public']},
 selected:['mid-ai:read'],now:()=>now}),'APPROVED_SCOPE_MISMATCH')});
await check(async()=>{const kv=store();await save(kv);
 await fail(()=>verify(kv,request,['mid-ai:read','mid-ai:read']),
 'UNREQUESTED_OR_INVALID_SCOPE')});
await check(async()=>{const kv=store();await save(kv);kv.get=async()=>{throw Error('network failure')};
 await fail(()=>verify(kv),'CONSENT_SNAPSHOT_UNAVAILABLE')});
await check(async()=>{const kv=store();await save(kv);kv.delete=async()=>{throw Error('KV deletion failed')};
 await fail(()=>verify(kv),'CONSENT_SNAPSHOT_DELETE_FAILED')});
await check(async()=>{const kv=store();kv.put=async()=>{throw Error('storage full')};
 await fail(()=>save(kv),'CONSENT_SNAPSHOT_WRITE_FAILED')});
await check(async()=>{const kv=store();await fail(()=>save(kv,{...request,scope:['mid-ai:infer-public']}),
 'UNREQUESTED_OR_INVALID_SCOPE')});
await check(async()=>{const kv=store();await fail(()=>
 rememberMidAiOAuthRequestedScopes({kv,handle:'bad',request}),
 'PROTECTED_CONSENT_STORAGE_REQUIRED')});
await check(async()=>{const kv=store();await fail(()=>
 rememberMidAiOAuthRequestedScopes({kv,handle,request,now:()=>-1}),
 'TRUSTED_CONSENT_CLOCK_INVALID')});
console.log('MID AI Router original OAuth scope binding QA OK; scenarios='+scenarios+
 '; no network, tokens, storage billing or deployment.');
