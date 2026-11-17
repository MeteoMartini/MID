import {describe,it,expect} from 'vitest';
import {assessMid740PostProducerCausality as assess} from '../../tools/ci/mid-740-postproducer-causality-qa.mjs';

const R='MeteoMartini/MID',P='repos/'+R+'/',RID=1305110795;
const BASE='a'.repeat(40),HEAD='b'.repeat(40),MERGE='c'.repeat(40);
const DIGEST='d'.repeat(64),TREE='e'.repeat(40);
const PATH='.github/workflows/agent-source-release.yml';
const GATEPATH='.github/workflows/chatgpt-pr-gate.yml';
const ARTURL='https://api.github.com/repos/'+R+'/actions/artifacts/333';
const core=['Source-Kern vollständig prüfen','Determine whether complete original RUC admission is required',
 'Agent-Quellstand vollständig prüfen',...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
 'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-mountain-visual ·',
 'Heavy-Regression · heavy-native-map ·',
 ...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3')];
const optional=['Extremwetterpolygone · echte Browserpixel','RUC +27h Kern, EPS und Gesamtpaket',
 'Admit three genuine DWD 27h original runs, codec and contour (read-only)'];
function fixture(){
 const gate={id:111,workflow_id:358449552,path:GATEPATH,
  name:'MID-Agent-Quellstand prüfen',event:'pull_request',
  run_attempt:1,head_sha:HEAD,head_branch:'chatgpt/v0.9.85.487-qa',
  repository:{id:RID},head_repository:{id:RID},
  status:'completed',conclusion:'success',
  run_started_at:'2026-11-16T10:00:00Z',updated_at:'2026-11-16T10:04:00Z'};
 const producer={id:222,workflow_id:358777143,path:PATH,
  name:'Geprüften Agent-PR automatisch veröffentlichen',
  event:'workflow_run',run_attempt:1,head_sha:BASE,head_branch:'main',
  repository:{id:RID},head_repository:{id:RID},
  status:'completed',conclusion:'success',
  created_at:'2026-11-16T10:05:00Z',
  run_started_at:'2026-11-16T10:05:01Z',
  updated_at:'2026-11-16T10:09:00Z'};
 const pr={number:999,state:'closed',draft:false,merged:true,
  merged_at:'2026-11-16T10:06:00Z',merge_commit_sha:MERGE,
  base:{ref:'main',sha:BASE},
  head:{ref:gate.head_branch,sha:HEAD,repo:{id:RID}},
  merged_by:{id:333327823,type:'Bot',login:'mid-release-bot-meteomartini[bot]'}};
 const art={id:333,name:'mid-release-'+MERGE,
  expired:false,digest:'sha256:'+DIGEST,size_in_bytes:4096,
  url:ARTURL,archive_download_url:ARTURL+'/zip',
  workflow_run:{id:222,repository_id:RID,head_repository_id:RID,
   head_branch:'main',head_sha:BASE},
  created_at:'2026-11-16T10:07:00Z',
  updated_at:'2026-11-16T10:08:00Z'};
 const commit={sha:MERGE,tree:{sha:TREE},parents:[{sha:BASE}]};
 const headCommit={sha:HEAD,tree:{sha:TREE},parents:[{sha:BASE}]};
 const jobs=[...core.map(name=>({name,conclusion:'success'})),
  ...optional.map(name=>({name,conclusion:'skipped'}))].map((job,i)=>({
   ...job,id:i+1,run_id:111,run_attempt:1,head_sha:HEAD,
   status:'completed',started_at:'2026-11-16T10:01:00Z',
   completed_at:job.conclusion==='skipped'?
    '2026-11-16T10:00:59Z':'2026-11-16T10:03:00Z'
  }));
 const data:Record<string,any>={
  'actions/runs/111':gate,
  'actions/runs/111/attempts/1/jobs?per_page=100&page=1':{total_count:jobs.length,jobs},
  'actions/workflows/358449552':{id:358449552,path:GATEPATH,
   name:'MID ChatGPT/Codex Source-PR Gate',state:'active'},
  'actions/runs/222':producer,
  'actions/workflows/358777143':{id:358777143,path:PATH,
   name:producer.name,state:'active'},
  'actions/artifacts/333':art,
  'actions/runs/222/artifacts?per_page=100&page=1':{total_count:1,artifacts:[art]},
  'git/ref/heads/main':{ref:'refs/heads/main',object:{type:'commit',sha:MERGE}},
  'git/ref/heads/mid-stable':{ref:'refs/heads/mid-stable',object:{type:'commit',sha:BASE}},
  ['git/commits/'+MERGE]:commit,
  ['git/commits/'+HEAD]:headCommit,
  'pulls/999':pr
 };
 const receipt={schema:'mid.740.premerge-producer-receipt.v1',
  status:'PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY',
  sourceGateRunId:111,sourceGateAttempt:1,sourceHeadSha:HEAD,sourceBaseSha:BASE,
  prNumber:999,producerRunId:222,producerAttempt:1,
  producerWorkflowSha:BASE,upstreamGateMetadataCoherent:true,
  producerRunMetadataCoherent:true,originalArtifactVerified:false,
  trustedProductionReceiptAttested:false,
  installerAuthorized:false,releaseAuthorized:false};
 const intake={schema:'mid.740.end-to-end-intake-qa.v1',
  mainSha:MERGE,producerRunId:222,artifactId:333,
  artifactSha256:DIGEST,downloadAndGitTreeVerified:true,
  metadataVerified:true,producerJobVerified:true,
  producerIdentityReread:true,nativeGitHubReviewVerified:false,
  installerAuthorized:false,releaseAuthorized:false};
 const get=async(path:string)=>{
  if(!path.startsWith(P)||!(path.slice(P.length) in data))
   throw Error('UNEXPECTED_REST_PATH_'+path);
  return structuredClone(data[path.slice(P.length)]);
 };
 return {data,receipt,intake,get};
}

describe('#740 producer completion -> source PR squash -> actual source artifact causal QA',()=>{
 it('links exact source gate, native bot squash, commit parent, producer and envelope without authorizing release',async()=>{
  const x=fixture(),o=await assess({premergeReceipt:x.receipt,
   verifiedIntake:x.intake,sourceMergeSha:MERGE},x.get);
  expect(o).toMatchObject({
   status:'POST_PRODUCER_CAUSALITY_METADATA_COHERENT_QA_ONLY',
   sourceHeadSha:HEAD,sourceBaseSha:BASE,sourceMergeSha:MERGE,
   sourceGateRunId:111,sourcePrNumber:999,producerRunId:222,artifactId:333,
   sourcePrBotMergeAndParentReadbackVerified:true,
   originalSourceGateAttemptJobsVerified:true,
   sourceGitTreeSha:TREE,sourceDiffEquivalenceVerified:true,
   producerArtifactInventoryAndCausalityReadbackVerified:true,
   postVerificationRaceReadbackVerified:true,
   originalProducerReceiptAttested:false,
   nativeGitHubReviewVerified:false,installerAuthorized:false,
   recoveryAuthorized:false,releaseAuthorized:false
  });
 });
 it.each([
  ['unverified receipt',x=>{x.receipt.status='TRUSTED'}],
  ['registry name must not equal source run display',x=>{x.data['actions/workflows/358449552'].name='MID-Agent-Quellstand prüfen'}],
  ['original source run name must not equal workflow registry',x=>{x.data['actions/runs/111'].name='MID ChatGPT/Codex Source-PR Gate'}],
  ['self-authorized receipt',x=>{x.receipt.releaseAuthorized=true}],
  ['producer workflow SHA not source base',x=>{x.receipt.producerWorkflowSha=HEAD}],
  ['unverified original byte/tree intake',x=>{x.intake.downloadAndGitTreeVerified=false}],
  ['forged installer permission',x=>{x.intake.installerAuthorized=true}],
  ['unverified original artifact',x=>{x.intake.artifactSha256='0'.repeat(64)}],
  ['untrusted gate outcome',x=>{x.data['actions/runs/111'].conclusion='skipped'}],
  ['source required core job skipped',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].jobs[0].conclusion='skipped'}],
  ['source required heavy shard removed',x=>{const y=x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'];y.jobs.splice(9,1);y.total_count--;}],
  ['source job wrong attempt',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].jobs[0].run_attempt=2}],
  ['source job wrong head SHA',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].jobs[0].head_sha=BASE}],
  ['source job belongs to foreign run',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].jobs[0].run_id=222}],
  ['source duplicate job ID',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].jobs[1].id=1}],
  ['source unexpected skipped job',x=>{const y=x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'];y.jobs.push({...y.jobs[0],id:99,name:'unknown required',conclusion:'skipped'});y.total_count++;}],
  ['source incomplete job inventory',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].total_count=100}],
  ['source success job has reversed chronology',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].jobs[0].completed_at='2026-11-16T10:00:58Z'}],
  ['source job finishes after gate completed',x=>{x.data['actions/runs/111/attempts/1/jobs?per_page=100&page=1'].jobs[0].completed_at='2026-11-16T10:06:00Z'}],
  ['wrong gate workflow registry',x=>{x.data['actions/workflows/358449552'].path='other'}],
  ['wrong gate HEAD',x=>{x.data['actions/runs/111'].head_sha=BASE}],
  ['source branch switch',x=>{x.data['pulls/999'].head.ref='replit/fake'}],
  ['wrong source PR',x=>{x.data['pulls/999'].number=998}],
  ['PR still open',x=>{x.data['pulls/999'].state='open'}],
  ['bot not actual merger',x=>{x.data['pulls/999'].merged_by.id=1}],
  ['wrong PR merger actor',x=>{x.data['pulls/999'].merged_by.type='User'}],
  ['PR merge SHA not original source',x=>{x.data['pulls/999'].merge_commit_sha=HEAD}],
  ['PR base has drifted',x=>{x.data['pulls/999'].base.sha=HEAD}],
  ['source merge commit wrong parent',x=>{x.data['git/commits/'+MERGE].parents[0].sha=HEAD}],
  ['unexpected merge topology',x=>{x.data['git/commits/'+MERGE].parents.push({sha:HEAD})}],
  ['source merge invalid Git tree',x=>{x.data['git/commits/'+MERGE].tree.sha='none'}],
  ['source PR head commit identity mismatch',x=>{x.data['git/commits/'+HEAD].sha=MERGE}],
  ['source PR head Git tree not byte/mode-identical',x=>{x.data['git/commits/'+HEAD].tree.sha='f'.repeat(40)}],
  ['source PR head Git tree missing',x=>{x.data['git/commits/'+HEAD].tree.sha='invalid'}],
  ['source PR head commit unavailable',x=>{delete x.data['git/commits/'+HEAD]}],
  ['stable changed before installer',x=>{x.data['git/ref/heads/mid-stable'].object.sha=MERGE}],
  ['artifact prior to merge',x=>{x.data['actions/artifacts/333'].created_at='2026-11-16T10:05:30Z'}],
  ['producer created before source gate completed',x=>{x.data['actions/runs/222'].created_at='2026-11-16T10:03:00Z'}],
  ['producer already rerun',x=>{x.data['actions/runs/222'].run_attempt=2}],
  ['artifact not published by this run',x=>{x.data['actions/artifacts/333'].workflow_run.id=666}],
  ['duplicate named artifacts',x=>{x.data['actions/runs/222/artifacts?per_page=100&page=1'].artifacts.push({...x.data['actions/artifacts/333'],id:334});x.data['actions/runs/222/artifacts?per_page=100&page=1'].total_count=2}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s blocks',async(_,change)=>{
  const x=fixture();change(x);
  const out=await assess({premergeReceipt:x.receipt,
   verifiedIntake:x.intake,sourceMergeSha:MERGE},x.get);
  expect(out.status).toBe('BLOCKED');
  expect(out.installerAuthorized).toBe(false);
  expect(out.releaseAuthorized).toBe(false);
 });
 it('blocks a late bot-merge PR swap after the initial verification',async()=>{
  const x=fixture();let reads=0;
  const get=async(path:string)=>{
   const result=await x.get(path);
   if(path===P+'pulls/999'&&++reads===2)result.merged_by.id=1;
   return result;
  };
  expect((await assess({premergeReceipt:x.receipt,
   verifiedIntake:x.intake,sourceMergeSha:MERGE},get)).reason)
   .toBe('FINAL_UPSTREAM_MERGE_OR_PRODUCER_RACE');
 });
 it('blocks a late source-head Git tree swap between GitHub REST readbacks',async()=>{
  const x=fixture();let reads=0;
  const get=async(path:string)=>{
   const result=await x.get(path);
   if(path===P+'git/commits/'+HEAD&&++reads===2)
    result.tree.sha='f'.repeat(40);
   return result;
  };
  expect((await assess({premergeReceipt:x.receipt,
   verifiedIntake:x.intake,sourceMergeSha:MERGE},get)).reason)
   .toBe('FINAL_UPSTREAM_MERGE_OR_PRODUCER_RACE');
 });
 it('blocks an original-source-gate job identity change after artifact verification',async()=>{
  const x=fixture();let count=0;
  const get=async(path:string)=>{
   const value=await x.get(path);
   if(path===P+'actions/runs/111/attempts/1/jobs?per_page=100&page=1'&&++count===2)
    value.jobs[0].head_sha=BASE;
   return value;
  };
  expect((await assess({premergeReceipt:x.receipt,
   verifiedIntake:x.intake,sourceMergeSha:MERGE},get)).reason)
   .toBe('FINAL_UPSTREAM_MERGE_OR_PRODUCER_RACE');
 });
 it('blocks an artifact digest race after first inventory verification',async()=>{
  const x=fixture();let reads=0;
  const get=async(path:string)=>{
   const result=await x.get(path);
   if(path===P+'actions/artifacts/333'&&++reads===2)
    result.digest='sha256:'+'f'.repeat(64);
   return result;
  };
  expect((await assess({premergeReceipt:x.receipt,
   verifiedIntake:x.intake,sourceMergeSha:MERGE},get)).status)
   .toBe('BLOCKED');
 });
});


describe('#740 actual legacy producer -> verified original ZIP shadow -> completed installer causality QA',()=>{
 const pkg='f'.repeat(40),installId=444;
 const legacy={packageCommitSha:pkg,producerRunAttempt:1,installerRunId:installId};
 function oldFixture(){
  const x=fixture();
  const art=x.data['actions/artifacts/333'];
  art.name='mid-740-legacy-shadow-222-1-'+pkg;
  x.data['actions/runs/222/artifacts?per_page=100&page=1'].artifacts[0].name=art.name;
  x.data['git/commits/'+pkg]={sha:pkg,parents:[{sha:MERGE}]};
  x.intake={...x.intake,
   schema:'mid.740.legacy-original-postinstaller-intake-qa.v1',
   sourceMergeSha:MERGE,packageCommitSha:pkg,
   packageGitBlobAndAncestryVerified:true,
   originalPremergeReceiptBytesVerified:true,
   originalPremergeReceiptSha256:'f'.repeat(64),
   originalLegacyInstallerReadbackVerified:true,
   downloadAndGitTreeVerified:false};
  x.data['actions/runs/'+installId]={
   id:installId,path:'.github/workflows/install-mid.yml',
   event:'workflow_dispatch',head_branch:'main',head_sha:pkg,
   status:'completed',conclusion:'success',
   repository:{id:RID},head_repository:{id:RID}
  };
  x.data['actions/runs/222/attempts/1/jobs?per_page=100']={
   total_count:1,
   jobs:[{
    id:555,run_id:222,run_attempt:1,head_sha:BASE,
    status:'completed',conclusion:'success',
    steps:[
     {number:1,name:'SHA-gebundenes Original-ZIP für #740 bereitstellen',
      status:'completed',conclusion:'success',
      started_at:'2026-11-16T10:06:30Z',completed_at:'2026-11-16T10:06:55Z'},
     {number:2,name:'Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen',
      status:'completed',conclusion:'success',
      started_at:'2026-11-16T10:06:56Z',completed_at:'2026-11-16T10:08:00Z'},
     {number:3,name:'Bewährten MID-Installer explizit starten',
      status:'completed',conclusion:'success',
      started_at:'2026-11-16T10:08:01Z',completed_at:'2026-11-16T10:08:35Z'}
    ]
   }]
  };
  return x;
 }
 it('admits a completed original legacy installer chain as QA metadata, never a release',async()=>{
  const x=oldFixture();
  const result=await assess({premergeReceipt:x.receipt,verifiedIntake:x.intake,
   sourceMergeSha:MERGE,legacy},x.get);
  expect(result).toMatchObject({
   status:'POST_PRODUCER_CAUSALITY_METADATA_COHERENT_QA_ONLY',
   originalLegacyInstallerReadbackVerified:true,
   producerArtifactInventoryAndCausalityReadbackVerified:true,
   originalProducerReceiptAttested:false,nativeGitHubReviewVerified:false,
   installerAuthorized:false,recoveryAuthorized:false,releaseAuthorized:false
  });
 });
 it.each([
  ['missing installer',x=>{delete x.data['actions/runs/'+installId]}],
  ['installer failure',x=>{x.data['actions/runs/'+installId].conclusion='failure'}],
  ['installer points to untrusted package',x=>{x.data['actions/runs/'+installId].head_sha=BASE}],
  ['ZIP commit wrong source parent',x=>{x.data['git/commits/'+pkg].parents=[{sha:BASE}]}],
  ['legacy artifact wrong producer name',x=>{x.data['actions/artifacts/333'].name='mid-release-'+MERGE}],
  ['original upload step failure',x=>{x.data['actions/runs/222/attempts/1/jobs?per_page=100'].jobs[0].steps[1].conclusion='failure'}],
  ['invalid original producer attempt',x=>{x.data['actions/runs/222'].run_attempt=2}],
 ] as [string,(x:ReturnType<typeof oldFixture>)=>void][])('%s is BLOCKED',async(_,mutate)=>{
  const x=oldFixture();mutate(x);
  const result=await assess({premergeReceipt:x.receipt,verifiedIntake:x.intake,
   sourceMergeSha:MERGE,legacy},x.get);
  expect(result.status).toBe('BLOCKED');
  expect(result.installerAuthorized).toBe(false);
  expect(result.releaseAuthorized).toBe(false);
 });
 it('rejects a caller that invents different installer identities',async()=>{
  const x=oldFixture();
  expect((await assess({premergeReceipt:x.receipt,verifiedIntake:x.intake,
   sourceMergeSha:MERGE,legacy:{...legacy,installerRunId:0}},x.get)).status)
   .toBe('BLOCKED');
  expect((await assess({premergeReceipt:x.receipt,verifiedIntake:x.intake,
   sourceMergeSha:MERGE,legacy:{...legacy,producerRunAttempt:2}},x.get)).status)
   .toBe('BLOCKED');
 });
});
