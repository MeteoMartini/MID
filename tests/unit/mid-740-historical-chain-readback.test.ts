import {describe,it,expect} from 'vitest';
import {inspectMid740HistoricChain as verify,SPEC} from '../../tools/ci/mid-740-historical-chain-readback.mjs';
const s=SPEC,p='repos/MeteoMartini/MID/',rid=1305110795;
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
 ['git/commits/'+s.merge]:{sha:s.merge,parents:[{sha:s.base}]},
 ['git/commits/'+s.package]:{sha:s.package,parents:[{sha:s.merge}]},
 ['git/commits/'+s.installed]:{sha:s.installed,parents:[{sha:s.package}]},
 ['actions/runs/'+s.gate+'/jobs?per_page=100&page=1']:roster(names,optional),
 ['actions/runs/'+s.bot+'/jobs?per_page=100&page=1']:roster(['PR mergen, Release-ZIP erzeugen und Installer starten']),
 ['actions/runs/'+s.bot+'/artifacts?per_page=100&page=1']:{total_count:0,artifacts:[]},
 ['actions/workflows/'+s.gateWorkflow]:{id:s.gateWorkflow,path:'.github/workflows/chatgpt-pr-gate.yml',state:'active'},
 ['actions/workflows/'+s.botWorkflow]:{id:s.botWorkflow,path:'.github/workflows/agent-source-release.yml',state:'active'},
 ['actions/workflows/'+s.installerWorkflow]:{id:s.installerWorkflow,path:'.github/workflows/install-mid.yml',state:'active'}
 };
 const get=async(x:string)=>{if(!x.startsWith(p)||!(x.slice(p.length) in d))throw Error('NO_API');return structuredClone(d[x.slice(p.length)])};
 return {d,get};
}
describe('historical .486 original Source-Gate -> Bot -> Installer QA',()=>{
 it('proves ancestry and full required job roster, but not artifact/causal identity',async()=>{
  const v=await verify(s,fixture().get);
  expect(v.status).toBe('HISTORIC_LEGACY_LINEAGE_QA_ONLY');
  expect(v).toMatchObject({sourceGateVerified:true,gitParentChainVerified:true,
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
 ['required core skipped',x=>{x.d['actions/runs/'+s.gate+'/jobs?per_page=100&page=1'].jobs[3].conclusion='skipped'}],
 ['lost heavy shard',x=>{x.d['actions/runs/'+s.gate+'/jobs?per_page=100&page=1'].jobs.pop()}],
 ['bot job failure',x=>{x.d['actions/runs/'+s.bot+'/jobs?per_page=100&page=1'].jobs[0].conclusion='failure'}],
 ['source bot suddenly has artifacts',x=>{x.d['actions/runs/'+s.bot+'/artifacts?per_page=100&page=1'].total_count=1}],
 ['bot before gate',x=>{x.d['actions/runs/'+s.bot].created_at='2026-11-16T13:29:00Z'}],
 ['installer after bot',x=>{x.d['actions/runs/'+s.installer].created_at='2026-11-16T13:32:00Z'}],
 ['workflow disabled',x=>{x.d['actions/workflows/'+s.botWorkflow].state='disabled_manually'}],
 ['registry inaccessible',x=>{delete x.d['actions/workflows/'+s.botWorkflow]}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s blocked',async(_,mutate)=>{
  const f=fixture();mutate(f);expect((await verify(s,f.get)).status).toBe('BLOCKED');
 });
});