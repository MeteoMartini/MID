import test from 'node:test';
import assert from 'node:assert/strict';
import {validateManifest,analyzeCandidates,inspectRemote} from '../tools/ci/release-train-plan.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40);
const manifest=()=>({schema:1,mainSha:a,stableSha:a,changes:[{pr:501,headSha:b},{pr:502,headSha:c}]});
const prs=()=>[
 {number:501,state:'open',draft:false,merged:false,headSha:b,headRepo:'MeteoMartini/MID',base:'main',baseSha:a,files:['src/foo.ts','docs/a.md']},
 {number:502,state:'open',draft:false,merged:false,headSha:c,headRepo:'MeteoMartini/MID',base:'main',baseSha:a,files:['src/bar.ts','docs/b.md']},
];
const current={mainSha:a,stableSha:a,repository:'MeteoMartini/MID'};
test('two independent verified PRs can be proposed for integration review',()=>{
 const m=validateManifest(manifest()),res=analyzeCandidates(m,current,prs());
 assert.equal(res.validForIntegrationReview,true);assert.equal(res.totalChangedFiles,4);
 assert.match(res.notice,/not a test, approval/);
});
test('unexpected stable update or main drift blocks the train',()=>{
 assert.equal(analyzeCandidates(manifest(),{...current,stableSha:b},prs()).validForIntegrationReview,false);
 assert.equal(analyzeCandidates(manifest(),{...current,mainSha:c},prs()).validForIntegrationReview,false);
});
test('head SHA drift, base drift, draft and foreign head are always blockers',()=>{
 for (const patch of [{headSha:a},{baseSha:b},{draft:true},{state:'closed'},{headRepo:'thirdparty/MID'},{merged:true}]) {
   const copies=prs();Object.assign(copies[0],patch);
   assert.equal(analyzeCandidates(manifest(),current,copies).validForIntegrationReview,false,JSON.stringify(patch));
 }
});
test('conflicting paths block combining even if each PR has good metadata',()=>{
 const copies=prs();copies[1].files.push('src/foo.ts');
 const result=analyzeCandidates(manifest(),current,copies);
 assert.equal(result.validForIntegrationReview,false);
 assert.match(result.blockers.join(' '),/Overlapping file/);
});
test('security and data plane paths require special scrutiny',()=>{
 const copies=prs();copies[0].files.push('worker/metar-proxy.js');
 const result=analyzeCandidates(manifest(),current,copies);
 assert.equal(result.observations.length,1);
 assert.match(result.observations[0],/domain-specific review/);
});
test('missing inventory and malicious path fail closed',()=>{
 const copies=prs();copies[0].files=[];
 assert.equal(analyzeCandidates(manifest(),current,copies).validForIntegrationReview,false);
 copies[0].files=['../secret'];
 assert.equal(analyzeCandidates(manifest(),current,copies).validForIntegrationReview,false);
});
test('malformed and duplicate candidate input fails closed',()=>{
 for (const value of [null,{}, {...manifest(),stableSha:b},{...manifest(),changes:[]},
  {...manifest(),changes:[{pr:1,headSha:'abc'}]},
  {...manifest(),changes:[{pr:1,headSha:b},{pr:1,headSha:c}]}]) {
   assert.throws(()=>validateManifest(value));
 }
});
test('network input is repository validated before any request',async()=>{
 await assert.rejects(inspectRemote(manifest(),'https://evil.test',''),/Invalid repository/);
});
