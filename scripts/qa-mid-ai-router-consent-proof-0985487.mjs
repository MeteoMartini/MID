#!/usr/bin/env node
import assert from 'node:assert/strict';
import {issueMidAiScopeProof,verifyMidAiScopeProof} from '../router/cloudflare/consent-proof.mjs';
const secret='A'.repeat(48),handle='H'.repeat(43),at=Date.parse('2026-11-16T22:00:00Z');
const req={clientId:'https://client.example/metadata',redirectUri:'https://client.example/callback',
 resource:'https://mid.example/mcp',issuer:'https://auth.example',state:'csrf',
 codeChallenge:'challenge',codeChallengeMethod:'S256',scope:['mid-ai:read']};
const issue=(x={})=>issueMidAiScopeProof({secret,handle,request:req,now:()=>at,...x});
const verify=(p,x={})=>verifyMidAiScopeProof({secret,handle,proof:p,request:req,
 selected:['mid-ai:read'],now:()=>at,...x});
let count=0;const test=async f=>{await f();count++};
const blocked=(f,why)=>assert.rejects(f,e=>e?.reason===why,why);
await test(async()=>{const p=await issue();assert.equal(p.includes('client.example'),false);
 assert.deepEqual(await verify(p),['mid-ai:read'])});
await test(async()=>{const r={...req,scope:['mid-ai:read','mid-ai:infer-public']};
 const p=await issue({request:r});assert.deepEqual(await verify(p,{request:r,selected:r.scope}),r.scope)});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{request:{...req,scope:['mid-ai:read','mid-ai:infer-public']},
 selected:['mid-ai:read','mid-ai:infer-public']}),'UNREQUESTED_OR_INVALID_SCOPE')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{request:{...req,clientId:'other'}}),'PROOF_CONTEXT_MISMATCH')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{request:{...req,redirectUri:'https://evil.example/cb'}}),'PROOF_CONTEXT_MISMATCH')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{request:{...req,resource:'https://evil.example/mcp'}}),'PROOF_CONTEXT_MISMATCH')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{request:{...req,state:'new'}}),'PROOF_CONTEXT_MISMATCH')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{request:{...req,codeChallenge:'other'}}),'PROOF_CONTEXT_MISMATCH')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{handle:'J'.repeat(43)}),'PROOF_CONTEXT_MISMATCH')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{secret:'B'.repeat(48)}),'INVALID_SIGNATURE')});
await test(async()=>{const p=await issue(),[a,b]=p.split('.');await blocked(()=>verify('A'+a.slice(1)+'.'+b),'INVALID_SIGNATURE')});
await test(async()=>{const p=await issue(),[a,b]=p.split('.');await blocked(()=>verify(a+'.'+'A'+b.slice(1)),'INVALID_SIGNATURE')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{now:()=>at+600001}),'PROOF_EXPIRED')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{now:()=>at-1}),'PROOF_EXPIRED')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{selected:['mid-ai:read','mid-ai:read']}),'UNREQUESTED_OR_INVALID_SCOPE')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{request:{...req,scope:['mid-ai:infer-public']}}),'SDK_SCOPE_MISMATCH')});
await test(async()=>{const p=await issue();await blocked(()=>verify(p,{proof:'bad'}),'INVALID_PROOF')});
await test(async()=>blocked(()=>issue({secret:'weak'}),'SIGNER_NOT_CONFIGURED'));
await test(async()=>blocked(()=>issue({handle:'invalid'}),'SIGNER_NOT_CONFIGURED'));
await test(async()=>blocked(()=>issue({request:{...req,scope:['mid-ai:infer-public']}}),'UNREQUESTED_OR_INVALID_SCOPE'));
console.log('MID AI Router stateless consent proof QA OK; cases='+count+
 '; no extra KV, tokens, network or deployment.');
