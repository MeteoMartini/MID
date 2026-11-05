#!/usr/bin/env node
// Fake gh binary for isolated MID handoff tests; NEVER contacts GitHub.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const args=process.argv.slice(2), api=args[args.indexOf('--method')+2]||'', method=args[args.indexOf('--method')+1];
if(process.env.FAKE_GH_DENY==='1'){console.error('mock: Forbidden');process.exit(1)}
const prefix='repos/MeteoMartini/MID/';
if(!api.startsWith(prefix)){process.exit(2)}
const path=api.slice(prefix.length), input=method==='POST'?JSON.parse(readFileSync(0,'utf8')):null;
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
let out;
const scenario=process.env.FAKE_GH_SCENARIO,statePath=process.env.FAKE_GH_STATE;
const state=()=>statePath&&existsSync(statePath)?JSON.parse(readFileSync(statePath,'utf8')):{};
const save=value=>{if(!statePath)throw Error('missing isolated mock state');writeFileSync(statePath,JSON.stringify(value))};
try{
 if(path.startsWith('branches/')&&method==='GET'){
  const branch=path.slice('branches/'.length),sha=git('ls-remote','origin','refs/heads/'+branch).split(/\s+/)[0];
  out={commit:{sha:scenario==='api-stale-base'||scenario==='api-drift-after-objects'&&state().candidate_created?'0'.repeat(40):sha}};
 }else if(path.startsWith('git/commits/')&&method==='GET'){
  const sha=path.slice('git/commits/'.length),lines=git('cat-file','-p',sha).split('\n');
  out={sha,tree:{sha:lines.find(x=>x.startsWith('tree '))?.slice(5)},parents:lines.filter(x=>x.startsWith('parent ')).map(x=>({sha:x.slice(7)}))};
  if(scenario==='candidate-mismatch'&&state().candidate_created)out.parents=[];
 }else if(path==='git/blobs'&&method==='POST'){
  out={sha:execFileSync('git',['hash-object','-w','--stdin'],{input:Buffer.from(input.content,'base64'),encoding:'utf8'}).trim()};
  if(scenario==='blob-mismatch')out.sha='0'.repeat(40);
 }else if(path==='git/trees'&&method==='POST'){
  for(const entry of input.tree){
   const atHead=git('ls-tree','HEAD','--',entry.path);
   if(entry.sha? !atHead.includes(entry.sha): Boolean(atHead))throw Error('tree mismatch');
  }
  out={sha:git('rev-parse','HEAD^{tree}')};
  if(scenario==='tree-mismatch')out.sha='0'.repeat(40);
 }else if(path==='git/commits'&&method==='POST'){
  out={sha:git('commit-tree',input.tree,'-p',input.parents[0])};
  save({...state(),candidate_created:true});
 }else if(path==='issues'&&method==='POST'){
  if(!input.title.startsWith('[MID-KILO-HANDOFF] ')||!input.body.includes('DRAFT_ONLY'))throw Error('bad issue');
  out={number:999,html_url:'https://github.com/MeteoMartini/MID/issues/999'};
  save({...state(),issue:{...out,...input,repository_url:'https://api.github.com/repos/MeteoMartini/MID',state:'open',user:{login:'kilo-code-bot[bot]',id:240665456}}});
 }else if(path==='issues/999'&&method==='GET'){
  out=state().issue;
  if(scenario==='issue-mismatch')out.body+='tampered';
  if(scenario==='wrong-author')out.user={login:'other-bot[bot]',id:1};
 }else throw Error('unexpected endpoint '+path);
 process.stdout.write(JSON.stringify(out));
}catch(e){console.error(e.message);process.exit(1)}
