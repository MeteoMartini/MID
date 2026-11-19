import test from 'node:test';
import assert from 'node:assert/strict';
import {assessMidCleanerIntake,inspectMidCleanerRemote,pages} from './mid-pr-intake.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),d='d'.repeat(40);
const core=()=>({mainSha:a,stableSha:a,checkoutSha:a,
  versionMirrors:['0.9.85.495','0.9.85.495','0.9.85.495'],
  target:{number:999,headSha:b,baseSha:a,baseRef:'main',state:'open',draft:true,merged:false,
    headRepo:'MeteoMartini/MID',changedFiles:2,files:[
      {filename:'src/foo.ts',status:'modified',sha:c},
      {filename:'tests/foo.test.ts',status:'added',sha:d}]},
  stableBlobs:{'src/foo.ts':c,'tests/foo.test.ts':d},peers:[],leadPrNumber:0});
test('full exact stable blobs are only historical candidates, not closures',()=>{
  const p=assessMidCleanerIntake(core());
  assert.equal(p.historicalIntegrationCandidate,true);
  assert.equal(p.exactStableBlobMatches,2);
  assert.equal(p.closureAuthorized,false);
  assert.equal(p.mergeAuthorized,false);
  assert.equal(p.releaseAuthorized,false);
  assert.deepEqual(p.checksRequired,['DRAFT_NO_SOURCE_RELEASE','LEAD_NOT_EXPLICITLY_BOUND']);
});
test('one mismatching blob prevents historical-integration conclusion',()=>{
  const x=core();x.stableBlobs['src/foo.ts']=a;
  const p=assessMidCleanerIntake(x);
  assert.equal(p.historicalIntegrationCandidate,false);
  assert.equal(p.exactStableBlobMatches,1);
});
test('missing Stable blob can be verified absent but not treated as integrated',()=>{
  const x=core();x.stableBlobs['tests/foo.test.ts']=null;
  assert.equal(assessMidCleanerIntake(x).historicalIntegrationCandidate,false);
  delete x.stableBlobs['tests/foo.test.ts'];
  assert.throws(()=>assessMidCleanerIntake(x),/STABLE_BLOB_INCOMPLETE/);
});
test('old PR base blocks source integration while allowing fully published closure evidence',()=>{
  const x=core();x.target.baseSha=d;
  const p=assessMidCleanerIntake(x);
  assert.equal(p.historicalIntegrationCandidate,true);
  assert.ok(p.checksRequired.includes('STALE_PR_BASE'));
});
test('same SHA overlap differs from conflicting SHA and reports both',()=>{
  const x=core();x.leadPrNumber=920;
  x.peers=[{number:920,headSha:c,changedFiles:2,files:[
    {filename:'src/foo.ts',sha:c,status:'modified'},
    {filename:'tests/foo.test.ts',sha:a,status:'modified'}]}];
  const p=assessMidCleanerIntake(x);
  assert.equal(p.leadStatus,'IN_VERIFIED_PEER_INVENTORY');
  assert.deepEqual(p.overlaps[0].paths.map(v=>v.relation),['EXACT_SAME_GIT_BLOB','CONFLICT_OR_RENAME_REVIEW']);
  assert.equal(p.releaseAuthorized,false);
});
test('all validated non-overlap peer HEADs remain in the verifiable evidence',()=>{
 const x=core();x.peers=[{number:35,headSha:b,changedFiles:1,files:[{filename:'unrelated',status:'added',sha:c}]},
  {number:12,headSha:a,changedFiles:1,files:[{filename:'second',status:'modified',sha:d}]}];
 const evidence=assessMidCleanerIntake(x);
 assert.equal(evidence.verifiedPeerCount,2);
 assert.deepEqual(evidence.verifiedPeers,[{number:12,headSha:a},{number:35,headSha:b}]);
 assert.equal(evidence.mergeAuthorized,false);
});
test('exact full final pagination page succeeds, real overflow is blocked',async()=>{
 const original=globalThis.fetch;
 let overflow=false;const calls=[];
 globalThis.fetch=async(url,opts)=>{
  const u=new URL(url);calls.push([u.searchParams.get('per_page'),u.searchParams.get('page'),opts?.method||'GET']);
  const values=u.searchParams.get('per_page')==='100'?Array.from({length:100},(_,i)=>({number:i+1})):(overflow?[{number:101}]:[]);
  return {ok:true,status:200,json:async()=>values};
 };
 try{
  assert.equal((await pages('pulls?state=open',undefined,1)).length,100);
  overflow=true;
  await assert.rejects(pages('pulls?state=open',undefined,1),/PAGINATION_TRUNCATED/);
  assert.ok(calls.every(c=>c[2]==='GET'));
 }finally{globalThis.fetch=original}
});
test('no explicit Lead never masquerades as a verified Lead',()=>{
  const p=assessMidCleanerIntake(core());
  assert.equal(p.leadStatus,'UNPINNED');
  assert.ok(p.checksRequired.includes('LEAD_NOT_EXPLICITLY_BOUND'));
});
test('unexpected Lead id is independently blocked',()=>{
  const x=core();x.leadPrNumber=500;
  assert.ok(assessMidCleanerIntake(x).checksRequired.includes('LEAD_NOT_VERIFIED'));
});
test('rename or removal needs manual diff/parent-chain analysis',()=>{
  for(const change of [{status:'renamed',previous_filename:'src/old.ts'},
    {status:'removed'}]){
    const x=core();x.target.files[0]={...x.target.files[0],...change};
    if(change.status==='renamed')x.stableBlobs['src/old.ts']=null;
    assert.equal(assessMidCleanerIntake(x).historicalIntegrationCandidate,false);
  }
});
test('path traversal, duplicate changed path, missing SHA and false count block',()=>{
  for(const patch of [
    [{filename:'../esc',sha:c,status:'modified'},{filename:'tests/foo.test.ts',sha:d,status:'added'}],
    [{filename:'src/foo.ts',sha:c,status:'modified'},{filename:'src/foo.ts',sha:d,status:'modified'}],
    [{filename:'src/foo.ts',status:'modified'},{filename:'tests/foo.test.ts',sha:d,status:'added'}]
  ]){const x=core();x.target.files=patch;assert.throws(()=>assessMidCleanerIntake(x),/TARGET_INVALID/)}
  const x=core();x.target.changedFiles=3;assert.throws(()=>assessMidCleanerIntake(x),/TARGET_INVALID/);
});
test('repo identity, native review state and full SHA fail closed',()=>{
  for(const patch of [{headRepo:'untrusted/repo'},{state:'closed'},{merged:true},{headSha:'short'},{baseRef:'dev'}]){
    const x=core();Object.assign(x.target,patch);
    assert.throws(()=>assessMidCleanerIntake(x),/TARGET_INVALID/);
  }
});
test('non-identical main/stable/checkout and version mirrors block',()=>{
  for(const patch of [{mainSha:d},{stableSha:d},{checkoutSha:d},{versionMirrors:['0.9.85.495','0.9.85.494','0.9.85.495']}]){
    const x={...core(),...patch};assert.throws(()=>assessMidCleanerIntake(x),/STABLE_DRIFT|VERSION_DRIFT/);
  }
});
test('incomplete or duplicate peer inventory never grants clear path',()=>{
  const x=core();x.peers=[{number:10,headSha:b,changedFiles:3,files:[{filename:'x',sha:c,status:'added'}]}];
  assert.throws(()=>assessMidCleanerIntake(x),/PEER_INVENTORY_INCOMPLETE/);
  const y=core();const valid={number:10,headSha:b,changedFiles:1,files:[{filename:'x',sha:c,status:'added'}]};
  y.peers=[valid,{...valid}];assert.throws(()=>assessMidCleanerIntake(y),/PEER_DUPLICATE/);
});
test('remote API is never called with malformed parameters',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=()=>{throw Error('Fetch called for invalid input')};
  try{
    await assert.rejects(inspectMidCleanerRemote({number:-1,checkoutSha:a}),/ARGUMENT_INVALID/);
    await assert.rejects(inspectMidCleanerRemote({number:1,checkoutSha:'short'}),/ARGUMENT_INVALID/);
  }finally{globalThis.fetch=original}
});
test('verified remote PR and Stable fetch stay read-only and SHA-bound',async()=>{
  const original=globalThis.fetch,calls=[];
  const pr={number:999,state:'open',draft:true,merged:false,changed_files:2,
    head:{sha:b,repo:{full_name:'MeteoMartini/MID'}},base:{sha:a,ref:'main'}};
  const list=[pr];const files=core().target.files;
  const b64=val=>Buffer.from(JSON.stringify(val)).toString('base64');
  const contents={
    'package.json':{type:'file',sha:c,encoding:'base64',content:b64({version:'0.9.85.495'})},
    'MID_BASELINE.json':{type:'file',sha:c,encoding:'base64',content:b64({releaseVersion:'0.9.85.495'})},
    'contracts/index.json':{type:'file',sha:c,encoding:'base64',content:b64({releaseVersion:'0.9.85.495'})},
    'src/foo.ts':{type:'file',sha:c},'tests/foo.test.ts':{type:'file',sha:d}};
  globalThis.fetch=async(url,opts)=>{
    calls.push([String(url),opts?.method||'GET']);
    const u=new URL(url),p=u.pathname.split('/repos/MeteoMartini/MID/')[1];let data;
    if(p.startsWith('git/ref/heads/'))data={object:{sha:a}};
    else if(p==='pulls/999')data=pr;
    else if(p==='pulls')data=list;
    else if(p==='pulls/999/files')data=files;
    else if(p.startsWith('contents/'))data=contents[decodeURIComponent(p.split('/')[1])]?contents[decodeURIComponent(p.split('/')[1])]:contents[decodeURIComponent(p.slice('contents/'.length))];
    if(!data)throw Error('Unexpected route '+p);
    return {ok:true,status:200,json:async()=>structuredClone(data)};
  };
  try{
    const result=await inspectMidCleanerRemote({number:999,token:'test',checkoutSha:a,expectedHeadSha:b});
    assert.equal(result.historicalIntegrationCandidate,true);
    assert.equal(result.releaseAuthorized,false);
    assert.equal(result.verifiedPeerCount,0);
    assert.ok(calls.every(([url,method])=>url.startsWith('https://api.github.com/repos/MeteoMartini/MID/')&&method==='GET'));
  }finally{globalThis.fetch=original}
});

test('workflow mirrors match exactly and never execute the triggering PR', async()=>{
  const {readFile}=await import('node:fs/promises');
  const {fileURLToPath}=await import('node:url');
  const {dirname,join}=await import('node:path');
  const root=join(dirname(fileURLToPath(import.meta.url)),'../..');
  const active=await readFile(join(root,'.github/workflows/mid-pr-intake.yml'),'utf8');
  const canonical=await readFile(join(root,'ci/github/workflows/mid-pr-intake.yml'),'utf8');
  assert.equal(active,canonical);
  for(const required of [
    'pull_request:\n    branches: [main]',
    'group: mid-readonly-pr-cleaner-${{ github.event_name }}-',
    "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    'permissions:\n  contents: read\n  pull-requests: read',
    'ref: mid-stable',
    'persist-credentials: false',
    'package-manager-cache: false',
    'MID_CLEANER_EVENT_HEAD_SHA:',
    'node --test tools/ci/test-mid-pr-intake.mjs',
    'node tools/ci/mid-pr-intake.mjs',
  ])assert.ok(canonical.includes(required),required);
  assert.ok(!canonical.includes('pull_request_target:'));
  assert.ok(!/^\s+(?:contents|pull-requests|issues): write\s*$/m.test(canonical));
  assert.ok(!/\bgh pr (merge|close)\b|git push|workflow_dispatch.*install-mid/.test(canonical));
  const checkout=canonical.slice(canonical.indexOf('uses: actions/checkout@'),canonical.indexOf('- name: Node.js'));
  assert.ok(!checkout.includes('github.event.pull_request.head.sha'));
  assert.ok(!checkout.includes('github.head_ref'));
});
