import {describe,it,expect} from 'vitest';
import {prepareMid740ProducerGateReceipt as receipt} from '../../tools/ci/mid-740-producer-gate-receipt-qa.mjs';
const R='MeteoMartini/MID',P='repos/'+R+'/',RID=1305110795,WID=358449552;
const SHA='a'.repeat(40),BASE='b'.repeat(40),BR='chatgpt/v0.9.85.487-gate';
const core=['Source-Kern vollständig prüfen','Determine whether complete original RUC admission is required',
 'Agent-Quellstand vollständig prüfen',...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
 'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-mountain-visual ·',
 'Heavy-Regression · heavy-native-map ·',
 ...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3')];
const optional=['Extremwetterpolygone · echte Browserpixel','RUC +27h Kern, EPS und Gesamtpaket',
 'Admit three genuine DWD 27h original runs, codec and contour (read-only)'];
function fixture(){
 const gate={id:111,workflow_id:WID,path:'.github/workflows/chatgpt-pr-gate.yml',
  name:'MID-Agent-Quellstand prüfen',event:'pull_request',status:'completed',
  conclusion:'success',run_attempt:1,head_sha:SHA,head_branch:BR,
  repository:{id:RID},head_repository:{id:RID},
  updated_at:'2026-11-16T10:05:00Z'};
 const pr={number:999,state:'open',draft:false,merged_at:null,
  base:{ref:'main',sha:BASE},head:{ref:BR,sha:SHA,repo:{id:RID,full_name:R}}};
 const jobs=[...core.map(name=>({name,conclusion:'success'})),
  ...optional.map(name=>({name,conclusion:'skipped'}))]
  .map((x,i)=>({...x,id:i+1,status:'completed'}));
 const producer={id:222,workflow_id:358777143,
  path:'.github/workflows/agent-source-release.yml',
  name:'Geprüften Agent-PR automatisch veröffentlichen',
  event:'workflow_run',run_attempt:1,head_sha:BASE,head_branch:'main',
  repository:{id:RID},head_repository:{id:RID},
  status:'in_progress',conclusion:null,
  created_at:'2026-11-16T10:05:10Z',
  run_started_at:'2026-11-16T10:05:11Z'};
 const d:Record<string,any>={
  'actions/runs/111':gate,
  ['actions/workflows/'+WID]:{id:WID,path:gate.path,name:'MID ChatGPT/Codex Source-PR Gate',state:'active'},
  'git/ref/heads/main':{ref:'refs/heads/main',object:{type:'commit',sha:BASE}},
  'git/ref/heads/mid-stable':{ref:'refs/heads/mid-stable',object:{type:'commit',sha:BASE}},
  'actions/runs/111/jobs?per_page=100&page=1':{total_count:jobs.length,jobs},
  'pulls?state=open&base=main&per_page=100&page=1':[pr],
  'pulls/999':pr,
  'actions/runs/222':producer,
  'actions/workflows/358777143':{id:358777143,path:producer.path,name:producer.name,state:'active'}
 };
 const event={action:'completed',repository:{id:RID,full_name:R},
  workflow_run:structuredClone(gate)};
 const args={event,repository:R,gateRunId:111,producerRunId:222,
  producerAttempt:1,producerWorkflowSha:BASE};
 const get=async(path:string)=>{
  if(!path.startsWith(P))throw Error('WRONG_REPOSITORY');
  const key=path.slice(P.length);
  if(!(key in d))throw Error('NO_FIXTURE_'+key);
  return structuredClone(d[key]);
 };
 return {d,args,event,get,producer};
}
describe('#740 producer-side original workflow_run gate receipt (QA only)',()=>{
 it('coherent source gate and in-progress producer emits non-authorizing premerge receipt',async()=>{
  const x=fixture(),r=await receipt(x.args,x.get);
  expect(r).toMatchObject({
   status:'PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY',
   sourceGateRunId:111,sourceGateAttempt:1,prNumber:999,
   producerRunId:222,producerAttempt:1,producerWorkflowSha:BASE,
   upstreamGateMetadataCoherent:true,producerRunMetadataCoherent:true,
   originalArtifactVerified:false,trustedProductionReceiptAttested:false,
   installerAuthorized:false,releaseAuthorized:false
  });
 });
 it.each([
  ['bad producer ID',x=>{x.args.producerRunId=0}],
  ['wrong attempt',x=>{x.args.producerAttempt=2}],
  ['producer workflow SHA unknown',x=>{x.args.producerWorkflowSha='main'}],
  ['untrusted event action',x=>{x.event.action='requested'}],
  ['source run name must differ from workflow registry',x=>{x.event.workflow_run.name='MID ChatGPT/Codex Source-PR Gate'}],
  ['source registry name must remain authentic',x=>{x.d['actions/workflows/'+WID].name='MID-Agent-Quellstand prüfen'}],
  ['wrong gate ID',x=>{x.args.gateRunId=112}],
  ['source required job skipped',x=>{x.d['actions/runs/111/jobs?per_page=100&page=1'].jobs[0].conclusion='skipped'}],
  ['duplicate source PR',x=>{x.d['pulls?state=open&base=main&per_page=100&page=1'].push({...x.d['pulls/999'],number:998})}],
  ['producer workflow swap',x=>{x.producer.workflow_id=12}],
  ['producer registry disabled',x=>{x.d['actions/workflows/358777143'].state='disabled_manually'}],
  ['producer run rerun',x=>{x.producer.run_attempt=2}],
  ['producer run already completed',x=>{x.producer.status='completed';x.producer.conclusion='success'}],
  ['producer wrong event',x=>{x.producer.event='pull_request'}],
  ['producer wrong source revision',x=>{x.producer.head_sha=SHA}],
  ['producer foreign repository',x=>{x.producer.repository.id=1}],
  ['producer started before gate completed',x=>{x.producer.created_at='2026-11-16T10:04:00Z'}],
  ['producer invalid timestamps',x=>{x.producer.run_started_at='not-a-date'}],
  ['PR swapped after gate check',x=>{x.d['pulls/999'].number=998}],
  ['original PR head changed',x=>{x.d['pulls/999'].head.sha='f'.repeat(40)}],
  ['missing producer REST',x=>{delete x.d['actions/runs/222']}],
  ['wrong registry path',x=>{x.d['actions/workflows/358777143'].path='other.yml'}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s fails closed',async(_,mutate)=>{
  const x=fixture();mutate(x);
  expect((await receipt(x.args,x.get)).status).toBe('BLOCKED');
 });
 it('rejects an in-flight producer-run identity swap at final readback',async()=>{
  const x=fixture();let n=0;
  const get=async(p:string)=>{
   const val=await x.get(p);
   if(p===P+'actions/runs/222'&&++n===2)
    val.run_started_at='2026-11-16T10:05:20Z';
   return val;
  };
  expect((await receipt(x.args,get)).reason).toBe('FINAL_PRODUCER_OR_SOURCE_RACE');
 });
 it('rejects an in-flight protected base SHA race',async()=>{
  const x=fixture();let n=0;
  const get=async(p:string)=>{
   const val=await x.get(p);
   if(p===P+'git/ref/heads/main'&&++n===3)
    val.object.sha=SHA;
   return val;
  };
  // Upstream itself queries protected main twice; final receipt read is #3.
  expect((await receipt(x.args,get)).reason).toBe('FINAL_PRODUCER_OR_SOURCE_RACE');
 });
});