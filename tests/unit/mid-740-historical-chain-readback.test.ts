import {describe,it,expect} from 'vitest';
import {inspectMid740HistoricChain as verify,SPEC} from '../../tools/ci/mid-740-historical-chain-readback.mjs';
const s=SPEC,p='repos/MeteoMartini/MID/',rid=1305110795;
const tested='b88729f66aeae1abb42e923a52663361d05e7b52',tree='3'.repeat(40);
const sourcePath='.github/workflows/chatgpt-pr-gate.yml';
const attemptJobs='actions/runs/'+s.gate+'/attempts/1/jobs?per_page=100&page=1';
const jobId=133325443561;
function fixture(){
 const run=(id:number,w:number,path:string,event:string,head_sha:string,head_branch:string,created_at:string,updated_at:string)=>
 ({id,workflow_id:w,path,event,head_sha,head_branch,created_at,updated_at,
 repository:{id:rid},head_repository:{id:rid},run_attempt:1,status:'completed',conclusion:'success',pull_requests:[]});
 const names=['Source-Kern vollständig prüfen','Determine whether complete original RUC admission is required',
 'Agent-Quellstand vollständig prüfen',...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
 'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-mountain-visual ·',
 'Heavy-Regression · heavy-native-map ·',...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3')];
 const optional=['Extremwetterpolygone · echte Browserpixel','RUC +27h Kern, EPS und Gesamtpaket',
 'Admit three genuine DWD 27h original runs, codec and contour (read-only)'];
 const roster=(a:string[],b:string[]=[])=>{const jobs=[...a.map(name=>({name,conclusion:'success'})),
 ...b.map(name=>({name,conclusion:'skipped'}))].map((x,i)=>({...x,id:i+1,status:'completed'}));
 return {jobs,total_count:jobs.length}};
 const d:Record<string,any>={
 ['pulls/'+s.pr]:{number:s.pr,merged:true,merge_commit_sha:s.merge,merged_at:'2026-11-16T13:30:49Z',
 head:{sha:s.head,ref:s.branch,repo:{id:rid}},base:{sha:s.base}},
 ['actions/runs/'+s.gate]:run(s.gate,s.gateWorkflow,'.github/workflows/chatgpt-pr-gate.yml','pull_request',s.head,s.branch,'2026-11-16T13:21:16Z','2026-11-16T13:30:28Z'),
 ['actions/runs/'+s.bot]:run(s.bot,s.botWorkflow,'.github/workflows/agent-source-release.yml','workflow_run',s.base,'main','2026-11-16T13:30:32Z','2026-11-16T13:31:07Z'),
 ['actions/runs/'+s.installer]:run(s.installer,s.installerWorkflow,'.github/workflows/install-mid.yml','workflow_dispatch',s.package,'main','2026-11-16T13:31:03Z','2026-11-16T13:44:10Z'),
 ['git/commits/'+s.merge]:{sha:s.merge,parents:[{sha:s.base}],tree:{sha:tree}},
 ['git/commits/'+tested]:{sha:tested,parents:[{sha:s.base},{sha:s.head}],tree:{sha:tree},
  committer:{name:'GitHub'},verification:{verified:true,reason:'valid'}},
 ['git/commits/'+s.package]:{sha:s.package,parents:[{sha:s.merge}]},
 ['git/commits/'+s.installed]:{sha:s.installed,parents:[{sha:s.package}]},
 [attemptJobs]:roster(names,optional),
 ['actions/runs/'+s.bot+'/jobs?per_page=100&page=1']:roster(['PR mergen, Release-ZIP erzeugen und Installer starten']),
 ['actions/runs/'+s.bot+'/artifacts?per_page=100&page=1']:{total_count:0,artifacts:[]},
 ['actions/workflows/'+s.gateWorkflow]:{id:s.gateWorkflow,path:'.github/workflows/chatgpt-pr-gate.yml',state:'active'},
 ['actions/workflows/'+s.botWorkflow]:{id:s.botWorkflow,path:'.github/workflows/agent-source-release.yml',state:'active'},
 ['actions/workflows/'+s.installerWorkflow]:{id:s.installerWorkflow,path:'.github/workflows/install-mid.yml',state:'active'}
 };
 const workflow={path:sourcePath,type:'file',sha:'4'.repeat(40)};
 d['contents/'+sourcePath+'?ref='+tested]={...workflow};
 d['contents/'+sourcePath+'?ref='+s.base]={...workflow};
 Object.assign(d[attemptJobs].jobs[0],{id:jobId,run_id:s.gate,run_attempt:1,head_sha:s.head,steps:[
  {number:2,name:'PR-Mergezustand laden',status:'completed',conclusion:'success',
   started_at:'2026-11-16T13:21:20Z',completed_at:'2026-11-16T13:21:22Z'},
  {number:3,name:'MID-Quellstruktur und PR-ZIP-Provenienz prüfen',status:'completed',conclusion:'success',
   started_at:'2026-11-16T13:21:22Z',completed_at:'2026-11-16T13:21:22Z'}
 ]});
 const logPath='actions/jobs/'+jobId+'/logs';
 d[logPath]=[
  '2026-11-16T13:21:20.9012244Z [command]/usr/bin/git -c protocol.version=2 fetch --no-tags --prune --no-recurse-submodules --depth=2 origin +'+tested+':refs/remotes/pull/847/merge',
  '2026-11-16T13:21:22.5584802Z [command]/usr/bin/git log -1 --format=%H',
  '2026-11-16T13:21:22.5627437Z '+tested,
  '2026-11-16T13:21:22.7252836Z   EXPECTED_PR_HEAD_SHA: '+s.head,
  '2026-11-16T13:21:22.7253326Z   EXPECTED_PR_BASE_SHA: '+s.base
 ].join('\n');
 const get=async(x:string)=>{if(!x.startsWith(p)||!(x.slice(p.length) in d))throw Error('NO_API');return structuredClone(d[x.slice(p.length)])};
 return {d,get,logPath};
}
describe('historical .486 original Source-Gate -> Bot -> Installer QA',()=>{
 it('proves ancestry and full required job roster, but not artifact/causal identity',async()=>{
  const {get}=fixture();
  const v=await verify(s,get,get);
  expect(v.status).toBe('HISTORIC_LEGACY_LINEAGE_QA_ONLY');
  expect(v).toMatchObject({sourceGateVerified:true,testedSourceBaseVerified:true,
    testedMergeSha:tested,testedSourceTreeSha:tree,gitParentChainVerified:true,
    originalGatePrCount:0,originalBotPrCount:0,producerArtifactCount:0,
    installerStartedBeforeBotFinished:true,upstreamEventLinkVerified:false,
    producerArtifactVerified:false,installerAuthorized:false,releaseAuthorized:false});
 });
 it.each([
 ['wrong source gate sha',x=>{x.d['actions/runs/'+s.gate].head_sha=s.base}],
 ['foreign bot',x=>{x.d['actions/runs/'+s.bot].repository.id=1}],
 ['replayed bot attempt',x=>{x.d['actions/runs/'+s.bot].run_attempt=2}],
 ['incorrect merge',x=>{x.d['pulls/'+s.pr].merge_commit_sha=s.package}],
 ['wrong ZIP commit parent',x=>{x.d['git/commits/'+s.package].parents[0].sha=s.base}],
 ['wrong stable commit parent',x=>{x.d['git/commits/'+s.installed].parents[0].sha=s.merge}],
 ['required core skipped',x=>{x.d[attemptJobs].jobs[3].conclusion='skipped'}],
 ['lost heavy shard',x=>{x.d[attemptJobs].jobs.pop()}],
 ['bot job failure',x=>{x.d['actions/runs/'+s.bot+'/jobs?per_page=100&page=1'].jobs[0].conclusion='failure'}],
 ['source bot suddenly has artifacts',x=>{x.d['actions/runs/'+s.bot+'/artifacts?per_page=100&page=1'].total_count=1}],
 ['bot before gate',x=>{x.d['actions/runs/'+s.bot].created_at='2026-11-16T13:29:00Z'}],
 ['installer after bot',x=>{x.d['actions/runs/'+s.installer].created_at='2026-11-16T13:32:00Z'}],
 ['workflow disabled',x=>{x.d['actions/workflows/'+s.botWorkflow].state='disabled_manually'}],
 ['registry inaccessible',x=>{delete x.d['actions/workflows/'+s.botWorkflow]}],
 ['source-core rerun',x=>{x.d[attemptJobs].jobs[0].run_attempt=2}],
 ['source provenance step failed',x=>{x.d[attemptJobs].jobs[0].steps[1].conclusion='failure'}],
 ['checkout from another PR',x=>{x.d[x.logPath]=x.d[x.logPath].replace('/847/merge','/848/merge')}],
 ['live base substituted for original event base',x=>{x.d[x.logPath]=x.d[x.logPath].replace(s.base,s.installed)}],
 ['checkout log unavailable',x=>{delete x.d[x.logPath]}],
 ['late duplicate event field',x=>{x.d[x.logPath]+='\n2026-11-16T13:21:45Z   EXPECTED_PR_BASE_SHA: '+s.base}],
 ['checkout after provenance step',x=>{x.d[x.logPath]=x.d[x.logPath].replace('13:21:22.5584802Z','13:21:35.5584802Z')}],
 ['checkout has unexpected Git parents',x=>{x.d['git/commits/'+tested].parents.reverse()}],
 ['synthetic merge signature invalid',x=>{x.d['git/commits/'+tested].verification.verified=false}],
 ['squash tree differs from tested merge',x=>{x.d['git/commits/'+s.merge].tree.sha='5'.repeat(40)}],
 ['PR modified source-gate workflow',x=>{x.d['contents/'+sourcePath+'?ref='+tested].sha='5'.repeat(40)}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s blocked',async(_,mutate)=>{
  const f=fixture();mutate(f);expect(await verify(s,f.get,f.get)).toMatchObject({
   status:'BLOCKED',testedSourceBaseVerified:false,releaseAuthorized:false
  });
 });
});
