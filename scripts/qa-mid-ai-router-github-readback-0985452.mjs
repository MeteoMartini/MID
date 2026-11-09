#!/usr/bin/env node
/** 14 offline scenarios: fixed-origin GitHub readback, no actual network. */
import assert from 'node:assert/strict';
import {readMidGithubSourceSnapshot} from './mid-ai-router-github-readback.mjs';
import {MidAiRouterBlocked} from './mid-ai-router.mjs';
const sha='a'.repeat(40),other='b'.repeat(40);
const api='https://api.github.com/repos/MeteoMartini/MID/git/ref/heads/';
const raw='https://raw.githubusercontent.com/MeteoMartini/MID/'+sha+'/';
const version='0.9.85.451';
const reply=(value,status=200)=>new Response(JSON.stringify(value),{status});
const responseFor=(url,opts,override={})=>{
  if(override.rejectURL && override.rejectURL(url))throw Error('simulated provider failure');
  if(url===api+'main')return reply(override.main ?? {object:{sha}});
  if(url===api+'mid-stable')return reply(override.stable ?? {object:{sha}});
  if(url===raw+'package.json')return reply(override.pkg ?? {version});
  if(url===raw+'MID_BASELINE.json')return reply(override.baseline ?? {releaseVersion:version});
  if(url===raw+'contracts/index.json')return reply(override.contracts ?? {releaseVersion:version});
  throw Error('unexpected URL '+url);
};
function fixture(overrides={}){
  const calls=[];
  return {
    calls,
    fetchImpl:async(url,opts)=>{
      calls.push({url,opts});
      return responseFor(url,opts,overrides);
    }
  };
}
let count=0;
const test=async(fn)=>{await fn();count++;};
const reject=async(input,reason)=>assert.rejects(
  ()=>readMidGithubSourceSnapshot(input),
  err=>err instanceof MidAiRouterBlocked&&err.reason===reason,reason);
await test(async()=>{
  const a=fixture(),s=await readMidGithubSourceSnapshot(a);
  assert.deepEqual({mainSha:s.mainSha,stableSha:s.stableSha,version:s.version},
    {mainSha:sha,stableSha:sha,version});
  assert.ok(Date.now()-Date.parse(s.checkedAt)<30000);
  assert.equal(a.calls.length,5);
});
await test(async()=>{
  const a=fixture();await readMidGithubSourceSnapshot(a);
  for(const {url,opts} of a.calls){
    assert.ok(url.startsWith(api)||url.startsWith(raw));
    assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');
    assert.equal(opts.credentials,'omit');assert.equal(opts.cache,'no-store');
    assert.ok(!JSON.stringify(opts).includes('authorization'));
  }
});
await test(async()=>reject({},'SOURCE_READBACK_TRANSPORT_REQUIRED'));
await test(async()=>reject(fixture({main:{object:{sha:other}}}),'SOURCE_DRIFT'));
await test(async()=>reject(fixture({stable:{object:{sha:other}}}),'SOURCE_DRIFT'));
await test(async()=>reject(fixture({main:{object:{sha:'invalid'}}}),'SOURCE_DRIFT'));
await test(async()=>reject(fixture({main:{broken:true}}),'SOURCE_DRIFT'));
await test(async()=>reject(fixture({pkg:{version:'0.9.85.999'}}),'VERSION_MIRROR_DRIFT'));
await test(async()=>reject(fixture({baseline:{releaseVersion:'0.9.85.450'}}),'VERSION_MIRROR_DRIFT'));
await test(async()=>reject(fixture({contracts:{releaseVersion:null}}),'VERSION_MIRROR_DRIFT'));
await test(async()=>reject(fixture({rejectURL:x=>x===api+'mid-stable'}),'SOURCE_READBACK_UNAVAILABLE'));
await test(async()=>reject({fetchImpl:async()=>new Response('blocked',{status:403})},
 'SOURCE_READBACK_HTTP_ERROR'));
await test(async()=>reject({fetchImpl:async()=>new Response('x'.repeat(9000),{status:200})},
 'SOURCE_READBACK_SIZE'));
await test(async()=>reject({fetchImpl:async()=>new Response(new Uint8Array([0xff,0xfe]),{status:200})},
 'SOURCE_READBACK_INVALID_BODY'));
console.log('MID AI Router GitHub fixed-origin readback QA OK; scenarios='+count+'; no network or secrets.');
