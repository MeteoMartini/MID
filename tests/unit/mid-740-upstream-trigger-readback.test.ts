import {describe,it,expect} from 'vitest';
import {assessMid740UpstreamTrigger as assess} from '../../tools/ci/mid-740-upstream-trigger-readback.mjs';
const R='MeteoMartini/MID',P='repos/'+R+'/',RID=1305110795,WID=358449552;
const SHA='a'.repeat(40),BASE='b'.repeat(40),BR='chatgpt/v0.9.85.487-source';
const core=['Source-Kern vollständig prüfen','Determine whether complete original RUC admission is required',
 'Agent-Quellstand vollständig prüfen',...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
 'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-mountain-visual ·',
 'Heavy-Regression · heavy-native-map ·',
 ...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3')];
const optional=['Extremwetterpolygone · echte Browserpixel','RUC +27h Kern, EPS und Gesamtpaket',
 'Admit three genuine DWD 27h original runs, codec and contour (read-only)'];
function fixture(){
 const gate={id:111,workflow_id:WID,path:'.github/workflows/chatgpt-pr-gate.yml',
  name:'MID ChatGPT/Codex Source-PR Gate',event:'pull_request',status:'completed',
  conclusion:'success',run_attempt:1,head_sha:SHA,head_branch:BR,
  repository:{id:RID},head_repository:{id:RID},pull_requests:[]};
 const pr={number:999,state:'open',draft:false,merged_at:null,
  base:{ref:'main',sha:BASE},head:{ref:BR,sha:SHA,repo:{id:RID,full_name:R}}};
 const jobs=[...core.map(name=>({name,conclusion:'success'})),
  ...optional.map(name=>({name,conclusion:'skipped'}))].map((x,i)=>({...x,id:i+1,status:'completed'}));
 const d:Record<string,any>={
  ['actions/runs/111']:gate,
  ['actions/workflows/'+WID]:{id:WID,path:gate.path,name:gate.name,state:'active'},
  'git/ref/heads/main':{ref:'refs/heads/main',object:{type:'commit',sha:BASE}},
  'git/ref/heads/mid-stable':{ref:'refs/heads/mid-stable',object:{type:'commit',sha:BASE}},
  'actions/runs/111/jobs?per_page=100&page=1':{total_count:jobs.length,jobs},
  'pulls?state=open&base=main&per_page=100&page=1':[pr],
  'pulls/999':pr
 };
 const event={action:'completed',repository:{id:RID,full_name:R},workflow_run:structuredClone(gate)};
 const get=async(path:string)=>{
  if(!path.startsWith(P))throw Error('WRONG_REPO');
  const key=path.slice(P.length);
  if(!(key in d))throw Error('NOT_FOUND '+key);
  return structuredClone(d[key]);
 };
 return {d,event,args:{event,repository:R,expectedGateRunId:111},get};
}
const outcome=async(fn:(x:ReturnType<typeof fixture>)=>void)=>{
 const x=fixture();fn(x);return assess(x.args,x.get);
};
describe('MID #740 source-gate webhook / GitHub REST independent binding, QA-only',()=>{
 it('accepts coherent synthetic upstream, never claims trusted trigger or installer authorization',async()=>{
  const x=await outcome(()=>{});
  expect(x.status).toBe('UPSTREAM_GATE_METADATA_COHERENT_QA_ONLY');
  expect(x).toMatchObject({sourceGateRunId:111,sourceGateAttempt:1,prNumber:999,
   sourceGateRosterVerified:true,trustedProductionTriggerAuthenticated:false,
   sourceBotProducerVerified:false,nativeReviewEnforced:false,installerAuthorized:false,releaseAuthorized:false});
 });
 it.each([
  ['wrong action',x=>{x.event.action='requested'}],
  ['wrong repository',x=>{x.event.repository.id=2}],
  ['event does not match run ID',x=>{x.event.workflow_run.id=112}],
  ['fork event',x=>{x.event.workflow_run.head_repository.id=2}],
  ['workflow swapped',x=>{x.event.workflow_run.workflow_id=9}],
  ['workflow source revision mismatched',x=>{x.d['actions/runs/111'].head_sha=BASE}],
  ['rerun attempt 2',x=>{x.event.workflow_run.run_attempt=2}],
  ['incomplete run',x=>{x.event.workflow_run.status='in_progress'}],
  ['gate failure',x=>{x.event.workflow_run.conclusion='failure'}],
  ['wrong source branch',x=>{x.event.workflow_run.head_branch='untrusted/branch'}],
  ['registry disabled',x=>{x.d['actions/workflows/'+WID].state='disabled_manually'}],
  ['registry wrong path',x=>{x.d['actions/workflows/'+WID].path='other.yml'}],
  ['source core skipped',x=>{x.d['actions/runs/111/jobs?per_page=100&page=1'].jobs[0].conclusion='skipped'}],
  ['heavy shard missing',x=>{x.d['actions/runs/111/jobs?per_page=100&page=1'].jobs.pop()}],
  ['duplicate jobs',x=>{x.d['actions/runs/111/jobs?per_page=100&page=1'].jobs[1].name='Source-Kern vollständig prüfen'}],
  ['unexpected skipped job',x=>{x.d['actions/runs/111/jobs?per_page=100&page=1'].jobs.push({id:999,name:'New required',status:'completed',conclusion:'skipped'});
    x.d['actions/runs/111/jobs?per_page=100&page=1'].total_count++}],
  ['main drift',x=>{x.d['git/ref/heads/main'].object.sha=SHA}],
  ['stable drift',x=>{x.d['git/ref/heads/mid-stable'].object.sha=SHA}],
  ['draft PR',x=>{x.d['pulls?state=open&base=main&per_page=100&page=1'][0].draft=true}],
  ['foreign PR',x=>{x.d['pulls?state=open&base=main&per_page=100&page=1'][0].head.repo.id=2}],
  ['no candidate',x=>{x.d['pulls?state=open&base=main&per_page=100&page=1']=[]}],
  ['duplicate candidate',x=>{x.d['pulls?state=open&base=main&per_page=100&page=1'].push({
    ...structuredClone(x.d['pulls?state=open&base=main&per_page=100&page=1'][0]),number:998})}],
  ['missing REST response',x=>{delete x.d['actions/runs/111']}],
  ['final head drift',x=>{x.d['pulls/999'].head.sha=BASE}],
  ['final PR identity swapped',x=>{x.d['pulls/999'].number=998}],
  ['final source drift',x=>{x.d['pulls/999'].base.sha=SHA}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s fails closed',async(_,mutate)=>{
  expect((await outcome(mutate)).status).toBe('BLOCKED');
 });
 it('rejects a race changing the final main SHA',async()=>{
  const x=fixture();let count=0;
  const get=async(p:string)=>{
   const r=await x.get(p);
   if(p===P+'git/ref/heads/main'&&++count===2)r.object.sha=SHA;
   return r;
  };
  expect((await assess(x.args,get)).reason).toBe('FINAL_SOURCE_GATE_RACE');
 });
 it('fails input validation without contacting GitHub',async()=>{
  let called=false;
  const result=await assess({...fixture().args,expectedGateRunId:0},async()=>{called=true;return null});
  expect(result.reason).toBe('UNTRUSTED_WORKFLOW_RUN_EVENT');
  expect(called).toBe(false);
 });
});