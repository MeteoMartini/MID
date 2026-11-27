import {test} from 'vitest';
import assert from 'node:assert/strict';
import {githubApi} from '../../tools/release/github-catalog-api.mjs';
const tag='repos/MeteoMartini/MID/git/ref/tags/v0.9.85.520';
const ref='repos/MeteoMartini/MID/git/ref/heads/main';
const release='repos/MeteoMartini/MID/releases/tags/v0.9.85.520';
function response(http,body,{exit=http>=400?1:0,stderr='',headers='Content-Type: application/json\r\n'}={}){
 return {status:exit,stdout:`HTTP/2.0 ${http} Example\n${headers}\r\n${JSON.stringify(body)}`,stderr};
}
function harness(...responses){
 let calls=[],waits=0;
 return {calls,waits:()=>waits,deps:{spawn:(bin,args,opts)=>{calls.push({bin,args,opts});assert.ok(responses.length);return responses.shift();},wait:()=>{waits++;}}};
}
test('confirmed HTTP 404, independent of stderr wording, is optional tag/release absence',()=>{
 for(const path of [tag,release]){const h=harness(response(404,{message:'Not Found'},{stderr:'unexpected diagnostic HTTP 503'}));assert.equal(githubApi(path,'GET',undefined,true,h.deps),null);assert.equal(h.calls.length,1);assert.ok(h.calls[0].args.includes('--include'));}
});
test('success returns JSON after status and headers',()=>{const h=harness(response(200,{object:{sha:'a'.repeat(40)}}));assert.equal(githubApi(ref,'GET',undefined,false,h.deps).object.sha,'a'.repeat(40));});
test('forbidden, unauthorized, rate limited and misleading stderr never mean missing',()=>{
 for(const status of [401,403,409,422,429]){const h=harness(response(status,{message:'HTTP 404 fake'},{stderr:'HTTP 404'}));assert.throws(()=>githubApi(tag,'GET',undefined,true,h.deps),new RegExp('HTTP '+status));assert.equal(h.calls.length,1);}
});
test('only optional tag and release reads may treat HTTP 404 as absent',()=>{for(const [path,optional,expectedCalls] of [[ref,true,0],[tag,false,1]]){const h=harness(response(404,{message:'Not Found'}));assert.throws(()=>githubApi(path,'GET',undefined,optional,h.deps));assert.equal(h.calls.length,expectedCalls);}});
test('explicit transient GET status retries once, never POST or rate limit',()=>{
 for(const status of [502,503,504]){const h=harness(response(status,{message:'temporary'}),response(200,{ok:true}));assert.deepEqual(githubApi(ref,'GET',undefined,false,h.deps),{ok:true});assert.equal(h.calls.length,2);assert.equal(h.waits(),1);}
 const h=harness(response(503,{message:'temporary'}),response(503,{message:'temporary'}));assert.throws(()=>githubApi(ref,'GET',undefined,false,h.deps),/HTTP 503/);assert.equal(h.calls.length,2);
 const p=harness(response(503,{message:'temporary'}));assert.throws(()=>githubApi('repos/MeteoMartini/MID/git/refs','POST',{ref:'refs/tags/v0.9.85.520'},false,p.deps),/HTTP 503/);assert.equal(p.calls.length,1);assert.equal(p.waits(),0);
 const q=harness(response(503,{message:'wait'},{headers:'Content-Type: application/json\r\nRetry-After: 60\r\n'}));assert.throws(()=>githubApi(ref,'GET',undefined,false,q.deps),/HTTP 503/);assert.equal(q.calls.length,1);
});
test('missing or malformed status, non-JSON, timeout and exit mismatch fail closed',()=>{
 for(const x of [{status:1,stdout:'',stderr:'HTTP 404'},response(404,'not an object'),response(404,{message:'Not Found'},{exit:0}),response(200,{ok:true},{exit:1}),{status:0,stdout:'HTTP/2.0 200 OK\n\r\nnot json'},{status:null,error:{code:'ETIMEDOUT'},stdout:'HTTP/2.0 404 Not Found\n\r\n{}'}]){const h=harness(x);assert.throws(()=>githubApi(tag,'GET',undefined,true,h.deps));assert.equal(h.calls.length,1);}
});
test('POST verified response exactly once, ambiguous result is not retried or leaked',()=>{
 const h=harness(response(201,{id:1}));assert.deepEqual(githubApi('repos/MeteoMartini/MID/releases','POST',{tag_name:'v0.9.85.520'},false,h.deps),{id:1});assert.equal(h.calls.length,1);
 const b=harness({status:1,stdout:'',stderr:'Bearer SHOULD_NOT_LEAK'});assert.throws(()=>githubApi('repos/MeteoMartini/MID/releases','POST',{},false,b.deps),err=>!err.message.includes('SHOULD_NOT_LEAK'));assert.equal(b.calls.length,1);
});

test('GET cannot carry a body or silently become POST',()=>{
 const h=harness(response(200,{ok:true}));
 assert.throws(()=>githubApi(ref,'GET',{},false,h.deps),/Invalid catalog API request/);
 assert.equal(h.calls.length,0);
 assert.deepEqual(githubApi(ref,'GET',undefined,false,h.deps),{ok:true});
 const args=h.calls[0].args;
 assert.equal(args[args.indexOf('--method')+1],'GET');
 assert.ok(!args.includes('--input'));
});
