import {describe,it,expect} from 'vitest';
import {chmodSync,mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyNativeReviewPolicy} from '../../tools/ci/mid-native-review-policy.mjs';

const pilotRef='refs/heads/codex/mid-native-review-pilot';
const validRuleset=()=>({
 source_type:'Repository',source:'MeteoMartini/MID',target:'branch',enforcement:'active',
 conditions:{ref_name:{include:[pilotRef],exclude:[]}},
 bypass_actors:[],
 rules:[{type:'pull_request',parameters:{
  required_approving_review_count:1,dismiss_stale_reviews_on_push:true,
  required_review_thread_resolution:true,allowed_merge_methods:['squash']
 }}]
});

describe('MID #740: GitHub-native review policy readback is fail-closed',()=>{
 it('accepts only the exact approved isolated branch with no bypass',()=>{
  expect(verifyNativeReviewPolicy(validRuleset(),pilotRef)).toEqual([]);
  expect(verifyNativeReviewPolicy(validRuleset())).not.toEqual([]);
 });
 it('rejects missing or broadened native policy attributes',()=>{
  const changes:[string,(policy:any)=>void][]=[
   ['foreign repository',p=>{p.source='other/repo'}],
   ['evaluation mode',p=>{p.enforcement='evaluate'}],
   ['foreign branch',p=>{p.conditions.ref_name.include=['refs/heads/main']}],
   ['broader branch pattern',p=>{p.conditions.ref_name.include=['refs/heads/*']}],
   ['multiple branches',p=>{p.conditions.ref_name.include.push('refs/heads/main')}],
   ['excluded branch',p=>{p.conditions.ref_name.exclude=['refs/heads/a']}],
   ['hidden bypass data',p=>{delete p.bypass_actors}],
   ['app always bypass',p=>{p.bypass_actors=[{actor_type:'Integration',actor_id:5059236,bypass_mode:'always'}]}],
   ['missing reviewer',p=>{p.rules[0].parameters.required_approving_review_count=0}],
   ['stale reviews survive',p=>{p.rules[0].parameters.dismiss_stale_reviews_on_push=false}],
   ['unresolved threads',p=>{p.rules[0].parameters.required_review_thread_resolution=false}],
   ['merge methods broadened',p=>{p.rules[0].parameters.allowed_merge_methods=['squash','merge']}],
   ['rebase instead of squash',p=>{p.rules[0].parameters.allowed_merge_methods=['rebase']}],
   ['duplicate pull-request rules',p=>{p.rules.push(p.rules[0])}],
   ['pull request rule absent',p=>{p.rules=[]}],
  ];
  for(const [reason,alter] of changes){
   const p=validRuleset();
   alter(p);
   expect(verifyNativeReviewPolicy(p,pilotRef),reason).not.toEqual([]);
  }
 });
});

const archiveGenerator=String.raw`import sys,stat
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
variant=sys.argv[1]
items=[('alpha.txt',b'alpha\n',0o644),('beta.sh',b'#!/bin/sh\nexit 0\n',0o755)]
if variant=='tamper': items[0]=('alpha.txt',b'not-alpha\n',0o644)
if variant=='missing': items.pop()
if variant=='extra': items.append(('unexpected.txt',b'unexpected',0o644))
if variant=='mode': items[1]=('beta.sh',b'#!/bin/sh\nexit 0\n',0o644)
if variant=='traversal': items[0]=('../alpha.txt',b'alpha\n',0o644)
if variant=='duplicate': items.append(items[0])
with ZipFile(variant+'.zip','w',ZIP_DEFLATED) as output:
 for filename,body,perms in items:
  entry=ZipInfo(filename)
  entry.create_system=3
  entry.external_attr=(stat.S_IFREG|perms)<<16
  output.writestr(entry,body,compress_type=ZIP_DEFLATED)
`;
function execute(cwd:string,command:string,args:string[]){
 const result=spawnSync(command,args,{cwd,encoding:'utf8',timeout:10000});
 if(result.error)throw result.error;
 return result;
}
describe('MID #740: immutable source ZIP verifier with a real local Git tree',()=>{
 it('accepts only a byte/mode-exact ZIP at a full trusted commit SHA',()=>{
  const dir=mkdtempSync(join(tmpdir(),'mid-native-review-zip-'));
  try{
   mkdirSync(join(dir,'dist'),{recursive:true});
   mkdirSync(join(dir,'.github','workflows'),{recursive:true});
   writeFileSync(join(dir,'alpha.txt'),'alpha\n');
   writeFileSync(join(dir,'beta.sh'),'#!/bin/sh\nexit 0\n');
   chmodSync(join(dir,'beta.sh'),0o755);
   writeFileSync(join(dir,'dist','generated.js'),'excluded');
   writeFileSync(join(dir,'.github','workflows','trusted.yml'),'excluded');
   for(const args of [['init','--object-format=sha1','-q'],['add','.'],['-c','user.name=MID QA','-c','user.email=qa@example.invalid','-c','commit.gpgsign=false','commit','-qm','fixture']]){
    const cmd=execute(dir,'git',args);
    expect(cmd.status,cmd.stderr).toBe(0);
   }
   const sha=execute(dir,'git',['rev-parse','HEAD']).stdout.trim();
   expect(sha).toMatch(/^[0-9a-f]{40}$/);
   const verifier=resolve('tools/ci/verify-source-release-zip.py');
   for(const variant of ['clean','tamper','missing','extra','mode','traversal','duplicate']){
    const created=execute(dir,'python3',['-c',archiveGenerator,variant]);
    expect(created.status,created.stderr).toBe(0);
    const checked=execute(dir,'python3',[verifier,variant+'.zip',sha]);
    if(variant==='clean'){
     expect(checked.status,checked.stderr).toBe(0);
     expect(checked.stdout).toContain('Verified 2 ZIP files');
    }else expect(checked.status,variant+' must fail closed').not.toBe(0);
   }
   expect(execute(dir,'python3',[verifier,'clean.zip','0'.repeat(40)]).status).not.toBe(0);
  }finally{rmSync(dir,{recursive:true,force:true})}
 },15000);
});