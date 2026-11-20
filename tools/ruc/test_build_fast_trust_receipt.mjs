import test from 'node:test';
import assert from 'node:assert/strict';
import {trustedFastReceipt} from './build_fast_trust_receipt.mjs';
const NOW=Date.parse('2026-11-20T06:35:00Z'),run='2026-11-20T06:00';
const env={GITHUB_REPOSITORY:'MeteoMartini/MID',GITHUB_REF:'refs/heads/main',
 GITHUB_SHA:'a'.repeat(40),STABLE_SHA:'a'.repeat(40),GITHUB_RUN_ID:'12345678'};
const proof={run,fastManifestSha256:'b'.repeat(64),primaryManifestSha256:'c'.repeat(64),
 siteBytes:800000000,publicationAuthorized:false};
test('protected Publisher can mint SHA/exact run/version/physical-budget constrained independent R2 receipt',()=>{
 const p=trustedFastReceipt(proof,env,'0.9.85.498',NOW);
 assert.deepEqual(p,{schema:'mid.ruc.fast-publisher-trust.v1',version:'0.9.85.498',
 repository:'MeteoMartini/MID',stableSha:'a'.repeat(40),run,fastManifestSha256:'b'.repeat(64),
 sourceRunId:12345678,publishedAt:'2026-11-20T06:35:00.000Z'});
});
test('untrusted event/repo, wrong parent, missing SHA, future or expired source and physical budget are refused',()=>{
 const cases=[
  [proof,{...env,GITHUB_REPOSITORY:'fork/MID'},NOW],
  [proof,{...env,GITHUB_REF:'refs/heads/some-pr'},NOW],
  [proof,{...env,STABLE_SHA:'d'.repeat(40)},NOW],
  [proof,{...env,GITHUB_RUN_ID:'0'},NOW],
  [{...proof,fastManifestSha256:'bad'},env,NOW],
  [{...proof,primaryManifestSha256:'bad'},env,NOW],
  [{...proof,publicationAuthorized:true},env,NOW],
  [{...proof,siteBytes:900000001},env,NOW],
  [{...proof,siteBytes:-1},env,NOW],
  [{...proof,run:'2026-11-19T01:00'},env,NOW],
  [{...proof,run:'2026-11-20T07:00'},env,NOW],
  [{...proof,run:'2026-02-30T06:00'},env,NOW],
 ];
 for(const [p,e,t] of cases)assert.throws(()=>trustedFastReceipt(p,e,'0.9.85.498',t),/FAST_TRUST_DENIED/);
});
