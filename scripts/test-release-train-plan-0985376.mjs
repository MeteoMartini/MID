import test from 'node:test';
import assert from 'node:assert/strict';
import {validateManifest,analyzeCandidates,inspectRemote} from '../tools/ci/release-train-plan.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40);
const manifest=()=>({schema:1,mainSha:a,stableSha:a,changes:[{pr:501,headSha:b},{pr:502,headSha:c}]});
const prs=()=>[
 {number:501,state:'open',draft:false,merged:false,headSha:b,headRef:'chatgpt/test',headRepo:'MeteoMartini/MID',base:'main',baseSha:a,files:['src/foo.ts','docs/a.md']},
 {number:502,state:'open',draft:false,merged:false,headSha:c,headRef:'chatgpt/test',headRepo:'MeteoMartini/MID',base:'main',baseSha:a,files:['src/bar.ts','docs/b.md']},
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
 for (const patch of [{headSha:a},{baseSha:b},{draft:true},{state:'closed'},{headRepo:'thirdparty/MID'},{merged:true},{draft:undefined},{merged:undefined},{headRef:'dependabot/test'},{headRef:'replit/test'}]) {
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

test('explicit Draft planning does not require Ready or grant release authorization',()=>{
 const m={...manifest(),candidateMode:'draft-planning'}, copies=prs();
 copies.forEach(p=>p.draft=true);
 const result=analyzeCandidates(m,current,copies);
 assert.equal(result.validForIntegrationReview,true);
 assert.equal(result.releaseAuthorized,false);
 assert.equal(result.candidateMode,'draft-planning');
 assert.equal(result.observations.length,2);
 assert.equal(analyzeCandidates(manifest(),current,copies).validForIntegrationReview,false);
 assert.throws(()=>validateManifest({...manifest(),candidateMode:'auto-merge'}),/mode/);
});

const remoteFixture=()=>{
 const p=prs()[0];
 const pr={number:p.number,state:p.state,draft:p.draft,merged:false,changed_files:2,
  head:{sha:p.headSha,ref:p.headRef,repo:{full_name:p.headRepo}},base:{ref:p.base,sha:p.baseSha}};
 return {pr,files:[{filename:'src/foo.ts',status:'modified'},{filename:'docs/a.md',status:'modified'}]};
};
async function withRemote(fixture,action,mutate=()=>{}) {
 const original=globalThis.fetch;let requests=0;
 try {
  globalThis.fetch=async url=>{
   requests++;mutate(String(url),requests,fixture);
   let data;
   if(String(url).includes('/git/ref/heads/')) data={object:{sha:fixture.refSha??a}};
   else if(String(url).includes('/files?')) data=fixture.files;
   else if(String(url).endsWith('/pulls/501')) data=fixture.pr;
   else throw Error('Unexpected request '+url);
   return {ok:true,json:async()=>structuredClone(data)};
  };
  return await action();
 }finally{globalThis.fetch=original}
}
const one=()=>({...manifest(),changes:[manifest().changes[0]]});
test('remote Draft inventory stays read-only with exact metadata and complete file count',async()=>{
 const f=remoteFixture();f.pr.draft=true;
 const result=await withRemote(f,()=>inspectRemote({...one(),candidateMode:'draft-planning'},current.repository,''));
 assert.equal(result.validForIntegrationReview,true);assert.equal(result.releaseAuthorized,false);
});
test('remote inspection rejects head and Stable races, incomplete inventories and malformed input',async()=>{
 for(const variant of ['head','late-head','stable','count','missing-list']) {
  const f=remoteFixture();
  await assert.rejects(withRemote(f,()=>inspectRemote(one(),current.repository,''),(url,n,f)=>{
   if(variant==='head' && n===5) f.pr.head.sha=c;
   if(variant==='late-head' && n===8) f.pr.head.sha=c;
   if(variant==='stable' && n===6) f.refSha=c;
   if(variant==='count')f.pr.changed_files=3;
   if(variant==='missing-list')f.files={};
  }),/changed|inventory/);
 }
 const original=globalThis.fetch;
 try{globalThis.fetch=()=>{throw Error('Network must not be used')};
  await assert.rejects(inspectRemote({...one(),changes:[null]},current.repository,''),/Invalid PR/);
 }finally{globalThis.fetch=original}
});
test('rename source is included in the conflict inventory',async()=>{
 const f=remoteFixture();f.files[0]={filename:'src/new.ts',status:'renamed',previous_filename:'src/foo.ts'};
 const result=await withRemote(f,()=>inspectRemote(one(),current.repository,''));
 assert.equal(result.totalChangedFiles,3);
 f.files[0].previous_filename='../unsafe';
 const bad=await withRemote(f,()=>inspectRemote(one(),current.repository,''));
 assert.equal(bad.validForIntegrationReview,false);
});
