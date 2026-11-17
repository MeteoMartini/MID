import {describe,it,expect} from 'vitest';
import {SPEC,inspectMid740LegacyProducerGap as inspect} from
 '../../tools/ci/mid-740-legacy-producer-gap-qa.mjs';

const root='repos/MeteoMartini/MID/';
const read=(fixture:ReturnType<typeof setup>)=>async(path:string)=>{
 const value=fixture.data[path];
 if(value===undefined)throw Error('FORBIDDEN_GITHUB_FIXTURE_'+path);
 fixture.calls.push(path);
 return structuredClone(value);
};
function setup(){
 const R=SPEC.repoId;
 const run=(id:number,w:number,path:string,event:string,head:string,start:string,end:string)=>({
  id,workflow_id:w,run_attempt:1,path,event,head_sha:head,
  head_branch:'main',status:'completed',conclusion:'success',
  run_started_at:start,updated_at:end,
  repository:{id:R},head_repository:{id:R}
 });
 const pr=run(SPEC.producer,SPEC.producerWorkflow,
  '.github/workflows/agent-source-release.yml','workflow_run',
  SPEC.trustedWorkflowSha,'2026-11-17T16:03:50Z','2026-11-17T16:04:34Z');
 const inst=run(SPEC.installer,SPEC.installerWorkflow,
  '.github/workflows/install-mid.yml','workflow_dispatch',
  SPEC.package,'2026-11-17T16:04:28Z','2026-11-17T16:17:32Z');
 const commit=(sha:string,parent:string)=>({sha,parents:[{sha:parent}]});
 const jobs={total_count:1,jobs:[{
  id:SPEC.producerJob,run_id:SPEC.producer,
  name:'PR mergen, Release-ZIP erzeugen und Installer starten',
  status:'completed',conclusion:'success',steps:[
   {number:6,name:'Geprüften Agent-PR automatisch zusammenführen',status:'completed',conclusion:'success'},
   {number:8,name:'Release-ZIP aus dem aktuellen main-Quellstand erzeugen und committen',
    status:'completed',conclusion:'success'},
   {number:9,name:'Bewährten MID-Installer explizit starten',status:'completed',conclusion:'success'}
  ]
 }]};
 const data:Record<string,any>={
  [root+'actions/runs/'+SPEC.producer]:pr,
  [root+'actions/runs/'+SPEC.installer]:inst,
  [root+'actions/runs/'+SPEC.producer+'/artifacts?per_page=100&page=1']:
   {total_count:0,artifacts:[]},
  [root+'actions/runs/'+SPEC.producer+'/attempts/1/jobs?per_page=100']:jobs,
  [root+'git/commits/'+SPEC.source]:commit(SPEC.source,SPEC.trustedWorkflowSha),
  [root+'git/commits/'+SPEC.package]:commit(SPEC.package,SPEC.source),
  [root+'git/commits/'+SPEC.installed]:commit(SPEC.installed,SPEC.package),
  [root+'actions/workflows/'+SPEC.producerWorkflow]:{
   id:SPEC.producerWorkflow,path:'.github/workflows/agent-source-release.yml',state:'active'},
  [root+'actions/workflows/'+SPEC.installerWorkflow]:{
   id:SPEC.installerWorkflow,path:'.github/workflows/install-mid.yml',state:'active'}
 };
 return {data,calls:[] as string[]};
}
describe('#740 actual .488 legacy release gap - negative evidence, no release rights',()=>{
 it('accepts genuine-looking old sequence only as missing ORIGINAL producer attestation',async()=>{
  const f=setup();
  const result=await inspect(read(f));
  expect(result).toMatchObject({
   status:'ORIGINAL_488_PRODUCER_ARTIFACT_GAP_QA_ONLY',
   producerRunId:44121439604,installerRunId:44121560818,
   originalProducerArtifactCount:0,
   originalProducerJobAndGitLineageVerified:true,
   installerStartedBeforeProducerCompleted:true,
   originalProducerArtifactAttested:false,independentPreInstallerVerified:false,
   nativeReviewEnforced:false,installerAuthorized:false,releaseAuthorized:false
  });
  expect(f.calls.length).toBe(18);
 });
 it.each([
  ['wrong repository',f=>{f.data[root+'actions/runs/'+SPEC.producer].repository.id=1}],
  ['producer wrong SHA',f=>{f.data[root+'actions/runs/'+SPEC.producer].head_sha='f'.repeat(40)}],
  ['producer retry attempt',f=>{f.data[root+'actions/runs/'+SPEC.producer].run_attempt=2}],
  ['producer failed',f=>{f.data[root+'actions/runs/'+SPEC.producer].conclusion='failure'}],
  ['installer failed',f=>{f.data[root+'actions/runs/'+SPEC.installer].conclusion='failure'}],
  ['installer foreign SHA',f=>{f.data[root+'actions/runs/'+SPEC.installer].head_sha='f'.repeat(40)}],
  ['a producer artifact now exists',f=>{
    f.data[root+'actions/runs/'+SPEC.producer+'/artifacts?per_page=100&page=1']=
     {total_count:1,artifacts:[{id:1}]};
  }],
  ['inconsistent artifact inventory',f=>{
    f.data[root+'actions/runs/'+SPEC.producer+'/artifacts?per_page=100&page=1'].total_count=1;
  }],
  ['not original Git parent',f=>{f.data[root+'git/commits/'+SPEC.package].parents[0].sha='f'.repeat(40)}],
  ['wrong package source',f=>{f.data[root+'git/commits/'+SPEC.source].parents=[]}],
  ['multiple jobs',f=>{f.data[root+'actions/runs/'+SPEC.producer+'/attempts/1/jobs?per_page=100'].total_count=2}],
  ['dispatch skipped',f=>{
    f.data[root+'actions/runs/'+SPEC.producer+'/attempts/1/jobs?per_page=100'].jobs[0].steps[2].conclusion='skipped';
  }],
  ['positive original upload needs independent assessment',f=>{
    f.data[root+'actions/runs/'+SPEC.producer+'/attempts/1/jobs?per_page=100'].jobs[0].steps.push(
     {number:10,name:'Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen',
      status:'completed',conclusion:'success'});
  }],
  ['installer starts after producer completes',f=>{
    f.data[root+'actions/runs/'+SPEC.installer].run_started_at='2026-11-17T16:04:35Z';
  }],
  ['installer starts before producer',f=>{
    f.data[root+'actions/runs/'+SPEC.installer].run_started_at='2026-11-17T16:00:00Z';
  }],
  ['wrong workflow registry',f=>{
    f.data[root+'actions/workflows/'+SPEC.producerWorkflow].state='disabled_manually';
  }]
 ] as [string,(f:ReturnType<typeof setup>)=>void][])('rejects %s',async(_,change)=>{
  const f=setup();change(f);
  const result=await inspect(read(f));
  expect(result.status).toBe('BLOCKED');
  expect(result.installerAuthorized).toBe(false);
  expect(result.releaseAuthorized).toBe(false);
 });
 it('rejects mutation of original producer artifact readback after first snapshot',async()=>{
  const f=setup();let n=0;
  const get=async(p:string)=>{
   const r=await read(f)(p);
   if(p===root+'actions/runs/'+SPEC.producer+'/artifacts?per_page=100&page=1'&&++n===2)
    r.total_count=1;
   return r;
  };
  expect((await inspect(get)).reason).toBe('ORIGINAL_RELEASE_CHAIN_RACE');
 });
 it('rejects missing API data without ever returning authorization',async()=>{
  const f=setup();delete f.data[root+'git/commits/'+SPEC.installed];
  const result=await inspect(read(f));
  expect(result).toMatchObject({
   status:'BLOCKED',reason:'ORIGINAL_GITHUB_SNAPSHOT_UNAVAILABLE',
   installerAuthorized:false,releaseAuthorized:false
  });
 });
});
