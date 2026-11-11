import {spawnSync} from 'node:child_process';
import {access,readdir,readFile as readRepositoryFile} from 'node:fs/promises';
import {classifyReleaseFailure} from '../tools/ci/release-self-heal-classify.mjs';
import {parseMidVersion,makeProposedVersion,analyzeReleaseVersion,analyzeVerifiedReleaseVersion,verifyProposedTarget} from '../tools/ci/mid-release-version-proposal.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {validateManifest,analyzeCandidates,inspectRemote,inspectRemoteSnapshot,inspectStableVersion} from '../tools/ci/release-train-plan.mjs';
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
  if(/\bgithub\.event\.pull_request\.number\s*==\s*(?:[1-9]\d*\b|'[1-9]\d*'|"[1-9]\d*")/.test(condition.join('\n')))
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
 for(const quoted of ["'745'",'"745"']){
  const unscoped=sample.replace('github.event.pull_request.number == 745',
   'github.event.pull_request.number == '+quoted);
  assert.equal(unscopedPrNumberPinnedJobs(unscoped),true,
   'Quoted PR-number pin without a positive path scope must also be rejected');
  const pathScoped=unscoped.replace('    branches: [main]',
   "    branches: [main]\n    paths:\n      - 'tools/ruc/**'");
  assert.equal(unscopedPrNumberPinnedJobs(pathScoped),false,
   'An explicitly path-scoped quoted PR number is not a global workflow trigger');
 }
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

const versionEvidence=()=>({schema:1,mainSha:a,stableSha:a,baseVersion:'0.9.85.454',
 candidates:[{pr:501,headSha:b,impact:'maintenance',reason:'Independent maintenance diff review required',changedPaths:['src/foo.ts','docs/a.md']}]});
const evidenceSnapshot=()=>({
 current:{mainSha:a,stableSha:a,repository:'MeteoMartini/MID'},
 plan:{validForIntegrationReview:true,releaseAuthorized:false},
 verifiedCandidates:[{pr:501,headSha:b,files:['src/foo.ts','docs/a.md']}],
});
const pinnedLive={mainSha:a,stableSha:a,version:'0.9.85.454'};
test('verified GitHub files are required before proposing any MID version',()=>{
 const result=analyzeVerifiedReleaseVersion(versionEvidence(),pinnedLive,evidenceSnapshot());
 assert.equal(result.verifiedDiffInventory,true);
 assert.equal(result.proposedVersion,'0.9.85.455');
 assert.equal(result.releaseAuthorized,false);
 assert.match(result.notice,/no semantic-impact proof/);
});
test('remote inventory can be verified while update impact remains unapproved',()=>{
 const unknown=versionEvidence();
 unknown.candidates[0].impact='unknown';
 const x=analyzeVerifiedReleaseVersion(unknown,pinnedLive,evidenceSnapshot());
 assert.equal(x.verifiedDiffInventory,true,'Exact immutable GitHub files remain established');
 assert.equal(x.readyForIntegrationReview,false,'Unknown impact still blocks integration');
 assert.equal(x.proposedVersion,null,'No proposal without substantive classification');
 assert.equal(x.releaseAuthorized,false);
 assert.ok(x.blockers.some(t=>t.includes('unknown impact')));
});
test('unrelated remote plan blockers do not erase matching file evidence',()=>{
 const snapshot=evidenceSnapshot();
 snapshot.plan.validForIntegrationReview=false;
 const x=analyzeVerifiedReleaseVersion(versionEvidence(),pinnedLive,snapshot);
 assert.equal(x.verifiedDiffInventory,true,'Independent file identities remain matched');
 assert.equal(x.readyForIntegrationReview,false);
 assert.equal(x.proposedVersion,null);
 assert.equal(x.releaseAuthorized,false);
});
test('no false verified inventory when impact and remote files both fail',()=>{
 const unknown=versionEvidence();
 unknown.candidates[0].impact='unknown';
 const snapshot=evidenceSnapshot();
 snapshot.verifiedCandidates[0].files=['src/foo.ts','docs/missing.md'];
 const x=analyzeVerifiedReleaseVersion(unknown,pinnedLive,snapshot);
 assert.equal(x.verifiedDiffInventory,false);
 assert.equal(x.readyForIntegrationReview,false);
 assert.equal(x.proposedVersion,null);
 assert.equal(x.releaseAuthorized,false);
});
test('version verification fails closed on omitted, added, renamed or duplicated actual paths',()=>{
 const badVariants=[
  ['src/foo.ts'],
  ['src/foo.ts','docs/a.md','extra/path.txt'],
  ['src/foo.ts','docs/new.md'],
  ['src/foo.ts','src/foo.ts'],
 ];
 for(const files of badVariants){
  const snapshot=evidenceSnapshot();
  snapshot.verifiedCandidates[0].files=files;
  const result=analyzeVerifiedReleaseVersion(versionEvidence(),pinnedLive,snapshot);
  assert.equal(result.proposedVersion,null,JSON.stringify(files));
  assert.equal(result.readyForIntegrationReview,false);
  assert.equal(result.releaseAuthorized,false);
 }
});
test('version verification cannot trust forged PR HEAD, missing preflight or fresh Stable drift',()=>{
 for(const change of [
  {verifiedCandidates:[{pr:501,headSha:c,files:['src/foo.ts','docs/a.md']}]},
  {verifiedCandidates:[]},
  {plan:{validForIntegrationReview:false,releaseAuthorized:false}},
  {plan:{validForIntegrationReview:true,releaseAuthorized:true}},
  {current:{mainSha:a,stableSha:c}},
  {verifiedCandidates:[{pr:777,headSha:b,files:['src/foo.ts','docs/a.md']}]},
 ]){
  const r=analyzeVerifiedReleaseVersion(versionEvidence(),pinnedLive,{...evidenceSnapshot(),...change});
  assert.equal(r.proposedVersion,null,JSON.stringify(change));
  assert.equal(r.readyForIntegrationReview,false);
 }
 assert.equal(analyzeVerifiedReleaseVersion(versionEvidence(),pinnedLive,null).proposedVersion,null);
 assert.equal(analyzeVerifiedReleaseVersion(versionEvidence(),{...pinnedLive,version:'0.9.85.455'},evidenceSnapshot()).proposedVersion,null);
});
test('actual remote integration inventory is returned without changing the existing API result',async()=>{
 const fixture=remoteFixture();
 const snapshot=await withRemote(fixture,()=>inspectRemoteSnapshot(one(),current.repository,''));
 assert.equal(snapshot.plan.validForIntegrationReview,true);
 assert.equal(snapshot.plan.releaseAuthorized,false);
 assert.equal(snapshot.current.mainSha,a);
 assert.deepEqual(snapshot.verifiedCandidates,[{pr:501,headSha:b,files:['src/foo.ts','docs/a.md']}]);
});
test('Stable version comes from immutable GitHub SHA-pinned package/baseline/contract mirrors',async()=>{
 const original=globalThis.fetch;
 const observed=[];
 const docs={
  'package.json':{version:'0.9.85.454'},
  'MID_BASELINE.json':{version:'0.9.85.454',releaseVersion:'0.9.85.454'},
  'contracts/index.json':{releaseVersion:'0.9.85.454'},
 };
 try{
  globalThis.fetch=async url=>{
   const u=new URL(String(url));
   assert.equal(u.searchParams.get('ref'),a);
   const path=u.pathname.split('/contents/')[1];
   assert.ok(Object.hasOwn(docs,path),'Only three pinned version mirrors may be read');
   observed.push(path);
   return {ok:true,json:async()=>({type:'file',encoding:'base64',sha:b,
     content:Buffer.from(JSON.stringify(docs[path])).toString('base64')})};
  };
  assert.equal(await inspectStableVersion(current.repository,a,''),'0.9.85.454');
  assert.deepEqual(observed.sort(),Object.keys(docs).sort());
  docs['contracts/index.json'].releaseVersion='0.9.85.455';
  await assert.rejects(inspectStableVersion(current.repository,a,''),/version mirrors disagree/);
  await assert.rejects(inspectStableVersion('evil/../repository',a,''),/Invalid immutable/);
 }finally{globalThis.fetch=original}
});

test('trusted bot never repackages another SHA after approved merge or stale Source replay',async()=>{
 const canonical=await readRepositoryFile(new URL('../ci/github/workflows/agent-source-release.yml',import.meta.url),'utf8');
 const active=await readRepositoryFile(new URL('../.github/workflows/agent-source-release.yml',import.meta.url),'utf8');
 assert.equal(active,canonical);
 assert.match(canonical,/if \[ "\$actual_main_sha" != "\$EXPECTED_MERGE_SHA" \]/);
 assert.match(canonical,/git reset --hard "\$EXPECTED_MERGE_SHA"/);
 assert.match(canonical,/if \[ "\$remote_main" != "\$EXPECTED_MERGE_SHA" \]/);
 assert.match(canonical,/if \[ "\$current_main" != "\$merge_sha" \]/);
 assert.ok(canonical.includes('if [[ ! "$EXPECTED_PACKAGE_SHA" =~ ^[0-9a-f]{40}$ ]] || [ "$current_main" != "$EXPECTED_PACKAGE_SHA" ]'),'Installer dispatch must validate both the full SHA format and the current main SHA');
 assert.doesNotMatch(canonical,/Release-Paket wird aus dem neuesten main-Stand neu erzeugt/);
});
test('installer dispatch must pin expected release ZIP SHA while manual workflow stays optional',async()=>{
 const bot=await readRepositoryFile(new URL('../ci/github/workflows/agent-source-release.yml',import.meta.url),'utf8');
 const installer=await readRepositoryFile(new URL('../ci/github/workflows/install-mid.yml',import.meta.url),'utf8');
 const installerActive=await readRepositoryFile(new URL('../.github/workflows/install-mid.yml',import.meta.url),'utf8');
 assert.equal(installer,installerActive,'Installer mirrors must remain byte-identical');
 assert.match(bot,/-f expected_package_sha="\$EXPECTED_PACKAGE_SHA"/);
 assert.match(installer,/expected_package_sha:/);
 assert.match(installer,/required: false/);
 assert.match(installer,/if: github\.event_name == 'workflow_dispatch' && inputs\.expected_package_sha != ''/);
 assert.match(installer,/\[ "\$EXPECTED_PACKAGE_SHA" != "\$EVENT_SHA" \]/);
});
test('failed Installer dispatch can recover only on exact ZIP SHA with independent proof',async()=>{
 const active=await readRepositoryFile(new URL('../.github/workflows/agent-source-release.yml',import.meta.url),'utf8');
 const canonical=await readRepositoryFile(new URL('../ci/github/workflows/agent-source-release.yml',import.meta.url),'utf8');
 assert.equal(active,canonical);
 for(const marker of ['GITHUB_RUN_ATTEMPT','MID_INSTALL_RECOVERY_PREVIOUS_JOB','MID_INSTALL_RECOVERY_ZIP_PROVENANCE','MID_INSTALL_RECOVERY_NO_DUPLICATE','package_recovered != \'true\'','steps.package.outputs.package_sha || steps.pr.outputs.package_sha'])
  assert.ok(active.includes(marker),'Exact recovery protection missing: '+marker);
 const match=(label,re)=>{const x=active.match(re);assert.ok(x,label+' predicate not found');return x[1];};
 const prior=match('prior job',/if ! jq -e --arg name "[^"]+" '([\s\S]*?)' <<<"\$previous_jobs" >\/dev\/null; then/);
 const commitRule=match('package lineage',/if ! jq -e --arg sha "[^"]+" --arg merge "[^"]+" --arg bot "[^"]+" --arg title "[^"]+" '([\s\S]*?)' <<<"\$live_package" >\/dev\/null; then/);
 const inventory=match('no duplicate',/if ! jq -e '([^']+)' <<<"\$installer_runs" >\/dev\/null; then/);
 const jq=(f,input,...args)=>spawnSync('jq',['-e',...args,f],{input:JSON.stringify(input),encoding:'utf8'}).status;
 const title='PR mergen, Release-ZIP erzeugen und Installer starten';
 const good={total_count:1,jobs:[{name:title,conclusion:'failure',steps:[
  {name:'Release-ZIP aus dem aktuellen main-Quellstand erzeugen und committen',conclusion:'success'},
  {name:'Bewährten MID-Installer explizit starten',conclusion:'failure'}]}]};
 const args=['--arg','name',title];
 assert.equal(jq(prior,good,...args),0);
 for(const bad of [{...good,total_count:2},{...good,jobs:[good.jobs[0],good.jobs[0]]},{...good,jobs:[{...good.jobs[0],conclusion:'success'}]},{...good,jobs:[{...good.jobs[0],steps:good.jobs[0].steps.slice(0,1)}]}])
  assert.notEqual(jq(prior,bad,...args),0);
 const merge='a'.repeat(40),zip='b'.repeat(40),bot='mid-release-bot-meteomartini[bot]',msg='Prepare MID agent release from PR #754';
 const zipArgs=['--arg','sha',zip,'--arg','merge',merge,'--arg','bot',bot,'--arg','title',msg];
 const valid={sha:zip,parents:[{sha:merge}],author:{login:bot},committer:{login:bot},commit:{message:msg},files:[{filename:'MID-professional-replacement.zip',status:'modified'}]};
 assert.equal(jq(commitRule,valid,...zipArgs),0);
 assert.equal(jq(commitRule,{...valid,files:[{filename:'MID-professional-replacement.zip',status:'added'}]},...zipArgs),0);
 assert.notEqual(jq(commitRule,{...valid,files:[{filename:'MID-professional-replacement.zip',status:'removed'}]},...zipArgs),0);
 for(const bad of [{...valid,parents:[{sha:zip}]},{...valid,author:{login:'other'}},{...valid,committer:{login:'other'}},{...valid,files:[...valid.files,{filename:'src/main.ts'}]},{...valid,commit:{message:'wrong'}},{...valid,sha:merge}])
  assert.notEqual(jq(commitRule,bad,...zipArgs),0);
 assert.equal(jq(inventory,{total_count:0,workflow_runs:[]}),0);
 for(const bad of [{total_count:1,workflow_runs:[{id:1}]},{total_count:0,workflow_runs:[{id:1}]},{workflow_runs:[]}])
  assert.notEqual(jq(inventory,bad),0);
});
test('established trusted SHA-bound bot release workflow mirrors and source-to-installer handoff remain intact',async()=>{
 const canonical=await readRepositoryFile(new URL('../ci/github/workflows/agent-source-release.yml',import.meta.url),'utf8');
 const active=await readRepositoryFile(new URL('../.github/workflows/agent-source-release.yml',import.meta.url),'utf8');
 assert.equal(active,canonical,'The trusted release bot must use byte-identical checked-in workflow mirrors');
 assert.match(canonical,/name: MID Agent Source Release/);
 assert.match(canonical,/MID ChatGPT\/Codex Source-PR Gate/);
 assert.match(canonical,/github\.event\.workflow_run\.conclusion == 'success'/);
 assert.match(canonical,/github\.event\.workflow_run\.event == 'pull_request'/);
 assert.match(canonical,/case "\$RUN_HEAD_BRANCH" in/);
 assert.match(canonical,/chatgpt\/\*\|codex\/\*/);
 assert.match(canonical,/gh api --method PUT "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{PR_NUMBER\}\/merge"/);
 assert.match(canonical,/-f sha="\$\{EXPECTED_HEAD_SHA\}"/);
 assert.match(canonical,/gh workflow run install-mid\.yml --ref main/);
 assert.doesNotMatch(canonical,/pull_request_target:/);
});

const selfHealBrowserJobs=()=>({total_count:2,jobs:[
 {name:'Release-Heavy · heavy-unified-map · 2/3',conclusion:'failure'},
 {name:'Release-Core',conclusion:'success'},
]});
const selfHealTimeoutLog=[
 'page.waitForFunction: Timeout 30000ms exceeded.',
 '  at verifyCase (/home/runner/work/MID/MID/scripts/verify-unified-map-browser-0985167.mjs:283:70)',
 '1 von 1 Regressionstests fehlgeschlagen: test-unified-map-layers-0985167.mjs',
].join('\n');
const selfHealClassify=(overrides={})=>classifyReleaseFailure({
 failedLog:selfHealTimeoutLog,jobs:selfHealBrowserJobs(),attempt:1,...overrides,
});
test('release retry classifier permits only one exact known installer map-browser timeout',()=>{
 assert.deepEqual(selfHealClassify(),{retry:true,reason:'one-time-map-browser-timeout'});
 for(const attempt of [2,3,0]){
  assert.equal(selfHealClassify({attempt}).retry,false,'No repeated or invalid browser-timeout retry');
 }
 for(const altered of [
  selfHealTimeoutLog+' AssertionError',
  selfHealTimeoutLog+'\nTest unrelated deterministic check failed',
  selfHealTimeoutLog.replace('verify-unified-map-browser','other-browser'),
  selfHealTimeoutLog.replace('Timeout 30000ms','Timeout 40000ms'),
  selfHealTimeoutLog.replace('1 von 1','2 von 2'),
  selfHealTimeoutLog.replace('test-unified-map-layers-0985167.mjs','other-test.mjs'),
 ]){
  assert.equal(selfHealClassify({failedLog:altered}).retry,false,'Nonmatching/explicit deterministic evidence blocks');
 }
});
test('release self-heal refuses multiple failed jobs, altered job identity or truncated run inventory',()=>{
 assert.equal(selfHealClassify({jobs:{total_count:2,jobs:[
  {name:'Release-Heavy · heavy-unified-map · 2/3',conclusion:'failure'},
  {name:'Another',conclusion:'failure'},
 ]}}).retry,false);
 assert.equal(selfHealClassify({jobs:{total_count:2,jobs:[
  {name:'Another',conclusion:'failure'},{name:'Release-Core',conclusion:'success'},
 ]}}).retry,false);
 assert.equal(selfHealClassify({jobs:{total_count:3,jobs:selfHealBrowserJobs().jobs}}).retry,false);
 assert.equal(selfHealClassify({failedLog:''}).retry,false);
});
test('browser attempt two never retries via a stray HTTP status',()=>{
 assert.equal(selfHealClassify({attempt:2,failedLog:selfHealTimeoutLog+'\nHTTP 503 upstream'}).retry,false);
});
test('a routine codeload URL is not an outage classification',()=>{
 assert.equal(selfHealClassify({failedLog:'Downloaded source from https://codeload.github.com/org/repo/archive.zip'}).retry,false);
 assert.equal(selfHealClassify({failedLog:'codeload.github.com HTTP 503 upstream'}).retry,true);
});
test('release retry preserves existing deterministic-before-network precedence',()=>{
 assert.deepEqual(selfHealClassify({failedLog:'HTTP 503 upstream',attempt:2}),
  {retry:true,reason:'transient'});
 assert.equal(selfHealClassify({failedLog:'TypeError: HTTP 503',attempt:1}).retry,false);
 assert.equal(selfHealClassify({failedLog:'unknown failure'}).retry,false);
});
test('trusted release classifier cannot inherit a write-capable GitHub token',async()=>{
 const active=await readRepositoryFile(new URL('../.github/workflows/release-self-heal.yml',import.meta.url),'utf8');
 const canonical=await readRepositoryFile(new URL('../ci/github/workflows/release-self-heal.yml',import.meta.url),'utf8');
 assert.equal(active,canonical);
 assert.match(active,/env -u GH_TOKEN node tools\/ci\/release-self-heal-classify\.mjs/);
});
test('release self-heal bootstrap rejects pre-promotion untrusted fallback',async()=>{
 const active=await readRepositoryFile(new URL('../.github/workflows/release-self-heal.yml',import.meta.url),'utf8');
 const mirror=await readRepositoryFile(new URL('../ci/github/workflows/release-self-heal.yml',import.meta.url),'utf8');
 assert.equal(active,mirror);
 assert.ok(active.includes('if [ ! -f tools/ci/release-self-heal-classify.mjs ]; then'));
 assert.match(active,/reason=trusted-classifier-not-yet-promoted/);
 assert.match(active,/retry=false/);
 assert.match(active,/ref: mid-stable/);
});
test('release self-heal continues through its existing workflow only and retains immutable Stable-sourced helper',async()=>{
 const canonical=await readRepositoryFile(new URL('../ci/github/workflows/release-self-heal.yml',import.meta.url),'utf8');
 const active=await readRepositoryFile(new URL('../.github/workflows/release-self-heal.yml',import.meta.url),'utf8');
 assert.equal(active,canonical,'Self-Heal active/canonical mirrors must be identical');
 assert.match(canonical,/name: MID Release Self-Heal/);
 assert.match(canonical,/ref: mid-stable/);
 assert.match(canonical,/persist-credentials: false/);
 assert.match(canonical,/github\.event\.workflow_run\.conclusion == 'failure'/);
 assert.match(canonical,/github\.event\.workflow_run\.run_attempt < 3/);
 assert.match(canonical,/release-self-heal-classify\.mjs/);
 assert.match(canonical,/rerun-failed-jobs/);
 assert.doesNotMatch(canonical,/force-push|pull_request_target|--force/);
});
