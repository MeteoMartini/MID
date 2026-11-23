import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {fastOidcAudience,verifyFastOidcProof,FAST_OIDC_ISSUER,FAST_OIDC_WORKFLOW,FAST_OIDC_REPOSITORY_ID} from './fast_oidc_proof.mjs';
import {buildFastOidcProof} from './build_fast_oidc_proof.mjs';
const keys=generateKeyPairSync('rsa',{modulusLength:2048}),kid='unit-fast-key';
const jwks={keys:[{...keys.publicKey.export({format:'jwk'}),kid,use:'sig',alg:'RS256'}]};
const now=Date.parse('2026-11-21T10:30:00Z'),run='2026-11-21T10:00',sha='a'.repeat(64),stable='b'.repeat(40);
const env={GITHUB_REPOSITORY:'MeteoMartini/MID',GITHUB_REF:'refs/heads/main',GITHUB_SHA:stable,STABLE_SHA:stable,
 GITHUB_RUN_ID:'123456',GITHUB_RUN_ATTEMPT:'1',GITHUB_EVENT_NAME:'schedule'};
const proof={run,fastManifestSha256:sha,primaryManifestSha256:'c'.repeat(64),siteBytes:100000,publicationAuthorized:false};
const encode=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
function issue(audience,claimsOverride={}){
 const claims={iss:FAST_OIDC_ISSUER,aud:audience,repository:'MeteoMartini/MID',repository_id:FAST_OIDC_REPOSITORY_ID,
  ref:'refs/heads/main',workflow_ref:FAST_OIDC_WORKFLOW,sha:stable,run_id:'123456',run_attempt:'1',
  event_name:'schedule',iat:Math.floor((now-30000)/1000),nbf:Math.floor((now-30000)/1000),exp:Math.floor((now+300000)/1000),...claimsOverride};
 const data=encode({typ:'JWT',alg:'RS256',kid})+'.'+encode(claims);
 return data+'.'+sign('RSA-SHA256',Buffer.from(data),keys.privateKey).toString('base64url');
}
const signed=overrides=>({schema:'mid.ruc.fast-oidc-proof.v1',run,manifestSha256:sha,stableSha:stable,
 runId:123456,runAttempt:1,oidcToken:issue(fastOidcAudience(sha),overrides)});
test('protected publisher issues SHA-specific GitHub token and recipient independently verifies genuine signature',async()=>{
 const verified=await buildFastOidcProof(proof,env,async aud=>{assert.equal(aud,fastOidcAudience(sha));return issue(aud)},async()=>jwks,now);
 assert.equal((await verifyFastOidcProof(verified,jwks,{now}))?.sha,sha);
 assert.equal((await verifyFastOidcProof(verified,jwks,{now:now+3600000}))?.run,run);
});
test('GitHub-signed proof rejects forged signatures, cross-run, cross-repo, cross-workflow and stale data',async()=>{
 for(const candidate of [
  signed({repository_id:'42'}),signed({workflow_ref:'someone/else/.github/workflows/fake.yml@refs/heads/main'}),
  signed({run_id:'876543'}),signed({aud:'other:sha:'+sha}),signed({sha:'f'.repeat(40)}),signed({event_name:'pull_request'})]){
  assert.equal(await verifyFastOidcProof(candidate,jwks,{now}),null);
 }
 const forged=signed();forged.oidcToken=forged.oidcToken.slice(0,-5)+'AAAAA';
 assert.equal(await verifyFastOidcProof(forged,jwks,{now}),null);
 assert.equal(await verifyFastOidcProof(signed(),jwks,{now:now+5*3600000}),null);
 assert.equal(await verifyFastOidcProof(signed(),{keys:[]},{now}),null);
});
test('R2-free issuer refuses unprotected contexts and invalid DWD original proof',async()=>{
 for(const bad of [ {...env,GITHUB_REF:'refs/heads/copilot/foo'}, {...env,STABLE_SHA:'f'.repeat(40)},
  {...env,GITHUB_EVENT_NAME:'pull_request'}]){
  await assert.rejects(buildFastOidcProof(proof,bad,async()=>issue(fastOidcAudience(sha)),async()=>jwks,now),/FAST_OIDC_PUBLISH_DENIED/);
 }
 await assert.rejects(buildFastOidcProof({...proof,publicationAuthorized:true},env,async()=>issue(fastOidcAudience(sha)),async()=>jwks,now),/FAST_OIDC_PUBLISH_DENIED/);
 await assert.rejects(buildFastOidcProof(proof,env,async()=>issue(fastOidcAudience(sha),{workflow_ref:'other/workflow'}),async()=>jwks,now),/FAST_OIDC_PUBLISH_DENIED/);
});
