import {access,readdir,readFile as readRepositoryFile} from 'node:fs/promises';
import {parseMidVersion,makeProposedVersion,analyzeReleaseVersion,verifyProposedTarget} from '../tools/ci/mid-release-version-proposal.mjs';
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

// MID release version policy: mandatory offline negative and arithmetic tests.
{
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40);
const live={stableSha:a,mainSha:a,version:'0.9.85.454'};
const one=(impact='maintenance')=>({schema:1,stableSha:a,mainSha:a,baseVersion:'0.9.85.454',
 candidates:[{pr:745,headSha:b,impact,reason:'Checked product impact and actual changed code',changedPaths:['src/example.tsx']}]});

test('MID four-component version is preserved without SemVer conversion',()=>{
 assert.deepEqual(parseMidVersion('0.9.85.454'),[0,9,85,454]);
 assert.throws(()=>parseMidVersion('0.9.85'),/four-component/);
 for(const bad of ['1.01.2.3','0.9.85.454+meta','v0.9.85.454','0.9.85.-1','0.9.85.9007199254740992'])
  assert.throws(()=>parseMidVersion(bad));
});
test('only maintenance increments W',()=>{
 const r=analyzeReleaseVersion(one(),live);
 assert.equal(r.proposedVersion,'0.9.85.455');
 assert.equal(r.bump,'maintenance');
 assert.equal(r.releaseAuthorized,false);
 assert.equal(verifyProposedTarget(r,'0.9.85.455'),true);
});
test('a verified prospective independent feature proposes Z and resets W',()=>{
 const r=analyzeReleaseVersion(one('feature'),live);
 assert.equal(r.proposedVersion,'0.9.86.0');
 assert.equal(verifyProposedTarget(r,'0.9.86.0'),true);
});
test('mixed maintenance and feature proposals use highest compatible impact',()=>{
 const m=one();m.candidates.push({...m.candidates[0],pr:748,headSha:c,impact:'feature',changedPaths:['src/another.ts']});
 const r=analyzeReleaseVersion(m,live);
 assert.equal(r.proposedVersion,'0.9.86.0');
});
test('Y and X are never auto-proposed, even if manifest explicitly requests them',()=>{
 for(const impact of ['generation','breaking','unknown']){
  const r=analyzeReleaseVersion(one(impact),live);
  assert.equal(r.proposedVersion,null);
  assert.equal(r.readyForIntegrationReview,false);
  assert.equal(r.releaseAuthorized,false);
  assert.throws(()=>verifyProposedTarget(r,'1.0.0.0'));
 }
});
test('a forged target X or Y is forbidden regardless of impact and intent',()=>{
 const r=analyzeReleaseVersion(one('feature'),live);
 for(const desired of ['1.0.0.0','0.10.0.0','0.9.87.0','0.9.86.1'])
  assert.throws(()=>verifyProposedTarget(r,desired));
});
test('stale source or version blocks, even when candidate evidence says maintenance',()=>{
 for(const changed of [{stableSha:c},{mainSha:c},{version:'0.9.85.455'},null]){
  const r=analyzeReleaseVersion(one(),changed?{...live,...changed}:null);
  assert.equal(r.readyForIntegrationReview,false);
  assert.equal(r.proposedVersion,null);
 }
});
test('malformed evidence and duplicate candidate entries fail closed',()=>{
 const base=one();
 for(const update of [{baseVersion:'0.9.85'}, {stableSha:c},{candidates:[]},{candidates:[null]},
  {candidates:[{...base.candidates[0],changedPaths:['../AGENTS.md']}]},
  {candidates:[{...base.candidates[0],reason:''}]},
  {candidates:[base.candidates[0],base.candidates[0]]}])
  assert.throws(()=>analyzeReleaseVersion({...base,...update},live));
});
test('no automatic major bump even from a future major base',()=>{
 const m=one();m.baseVersion='1.1.1.7';
 const r=analyzeReleaseVersion(m,{...live,version:m.baseVersion});
 assert.equal(r.proposedVersion,'1.1.1.8');
 assert.throws(()=>verifyProposedTarget(r,'2.0.0.0'));
});
test('overflow is never silently wrapped',()=>{
 assert.throws(()=>makeProposedVersion('0.9.85.9007199254740991','maintenance'),/automatic version/);
 assert.throws(()=>makeProposedVersion('0.9.9007199254740991.5','feature'),/automatic version/);
});
}

test('canonical Source gate identity and Draft guard are preserved by QA cleanup',async()=>{
 const canonical=await readRepositoryFile(new URL('../ci/github/workflows/chatgpt-pr-gate.yml',import.meta.url),'utf8');
 const active=await readRepositoryFile(new URL('../.github/workflows/chatgpt-pr-gate.yml',import.meta.url),'utf8');
 assert.equal(active,canonical,'Official Source workflow mirrors must remain byte-identical');
 assert.match(canonical,/name: MID ChatGPT\/Codex Source-PR Gate/);
 assert.match(canonical,/run-name: MID-Agent-Quellstand prüfen/);
 assert.match(canonical,/github\.event\.pull_request\.draft == false/);
 assert.match(canonical,/ready_for_review/);
});

test('retired PR-only historical Draft workflows cannot reappear as generic skipped run noise',async()=>{
 for(const leaf of ['mid-446-bundle-full-readonly-qa.yml','mid-683-draft-full-readonly-qa.yml']){
  for(const prefix of ['../.github/workflows/','../ci/github/workflows/']){
   await assert.rejects(access(new URL(prefix+leaf,import.meta.url)),{code:'ENOENT'},'Obsolete historical workflow must be retired together with its canonical mirror: '+prefix+leaf);
  }
 }
});

// Guard against the exact Actions noise pattern from retired #701/#685 workflows.
// A generic pull_request subscription must not spawn an entirely PR-number-pinned job.
// Path-scoped original-data QA and step-only optional probes remain supported.
function unscopedPrNumberPinnedJobs(source) {
 const lines=source.split(/\r?\n/);
 const on=lines.findIndex(line=>/^(?:on|'on'|"on"):\s*$/.test(line));
 if(on<0)return false;
 const rootEnd=lines.findIndex((line,i)=>i>on && /^[A-Za-z_][\w-]*:\s*(?:#.*)?$/.test(line));
 const events=lines.slice(on+1,rootEnd<0?lines.length:rootEnd);
 const pr=events.findIndex(line=>/^  pull_request(?:_target)?:/.test(line));
 if(pr<0)return false;
 let until=events.findIndex((line,i)=>i>pr && /^  [A-Za-z_][\w-]*:/.test(line));
 if(until<0)until=events.length;
 // Only positive paths are an appropriate trigger scope, not paths-ignore.
 if(events.slice(pr+1,until).some(line=>/^    paths:\s*(?:#.*)?$/.test(line)||/^    paths:\s*\[/.test(line)))return false;
 const jobs=lines.findIndex(line=>/^jobs:\s*$/.test(line));
 if(jobs<0)return false;
 let insideJob=false;
 for(let i=jobs+1;i<lines.length;i++){
  const line=lines[i];
  if(/^\S[^#]*:\s*$/.test(line))break; // End of top-level jobs block.
  if(/^  [\w-]+:\s*(?:#.*)?$/.test(line)){insideJob=true;continue;}
  if(!insideJob || !/^    if:\s*/.test(line))continue; // Job-level condition only.
  const condition=[line];
  for(let j=i+1;j<lines.length && /^ {6,}\S/.test(lines[j]);j++)condition.push(lines[j]);
  if(/\bgithub\.event\.pull_request\.number\s*==\s*[1-9]\d*\b/.test(condition.join('\n')))
   return true;
 }
 return false;
}

test('workflow-noise policy detects unscoped PR-number-only jobs without rejecting real Source or path-scoped QA',()=>{
 const sample=[
  'name: MID .455 Draft only',
  'on:',
  '  pull_request:',
  '    branches: [main]',
  'jobs:',
  '  check:',
  '    if: >-',
  '      github.event.pull_request.number == 745 &&',
  "      github.event.pull_request.draft == true",
  '    runs-on: ubuntu-latest',
  '    steps:',
  '      - run: echo preflight'
 ].join('\n');
 assert.equal(unscopedPrNumberPinnedJobs(sample),true,'Unrestricted PR run events with #745-only job must be rejected');
 assert.equal(unscopedPrNumberPinnedJobs(sample.replace('    branches: [main]',
  "    branches: [main]\n    paths:\n      - 'tools/ruc/**'")),false,'Explicit positive paths scope is allowed');
 assert.equal(unscopedPrNumberPinnedJobs(sample.replace('    if: >-','    if: >-')
  .replace('github.event.pull_request.number == 745','github.event.pull_request.draft == false')),false,'Unpinned central Source gate is allowed');
 const stepOnly=sample.replace('    if: >-','    name: Main CI\n    runs-on: ubuntu-latest\n    steps:\n      - name: Optional original-data QA\n        if: >-')
  .replace('    runs-on: ubuntu-latest\n    steps:\n      - run: echo preflight','        run: echo optional');
 assert.equal(unscopedPrNumberPinnedJobs(stepOnly),false,'Step-only optional checks are not workflow-level restriction');
});

test('current workflow registry does not use globally triggered per-PR-only jobs',async()=>{
 const dir=new URL('../.github/workflows/',import.meta.url);
 const names=(await readdir(dir)).filter(name=>/\.ya?ml$/.test(name));
 const offenders=[];
 for(const name of names){
  const source=await readRepositoryFile(new URL(name,dir),'utf8');
  if(unscopedPrNumberPinnedJobs(source))offenders.push(name);
 }
 assert.deepEqual(offenders,[],'Unscoped per-PR workflow noise must be removed or positively path-scoped');
});
