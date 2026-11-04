#!/usr/bin/env node
// Fake gh binary for isolated MID handoff tests; NEVER contacts GitHub.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const args=process.argv.slice(2), api=args[args.indexOf('--method')+2]||'', method=args[args.indexOf('--method')+1];
if(process.env.FAKE_GH_DENY==='1'){console.error('mock: Forbidden');process.exit(1)}
const prefix='repos/MeteoMartini/MID/';
if(!api.startsWith(prefix)){process.exit(2)}
const path=api.slice(prefix.length), input=method==='POST'?JSON.parse(readFileSync(0,'utf8')):null;
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
let out;
try{
 if(path.startsWith('git/commits/')&&method==='GET'){
  const sha=path.slice('git/commits/'.length),lines=git('cat-file','-p',sha).split('\n');
  out={sha,tree:{sha:lines.find(x=>x.startsWith('tree '))?.slice(5)},parents:lines.filter(x=>x.startsWith('parent ')).map(x=>({sha:x.slice(7)}))};
 }else if(path==='git/blobs'&&method==='POST'){
  out={sha:execFileSync('git',['hash-object','-w','--stdin'],{input:Buffer.from(input.content,'base64'),encoding:'utf8'}).trim()};
 }else if(path==='git/trees'&&method==='POST'){
  for(const entry of input.tree){
   const atHead=git('ls-tree','HEAD','--',entry.path);
   if(entry.sha? !atHead.includes(entry.sha): Boolean(atHead))throw Error('tree mismatch');
  }
  out={sha:git('rev-parse','HEAD^{tree}')};
 }else if(path==='git/commits'&&method==='POST'){
  out={sha:git('commit-tree',input.tree,'-p',input.parents[0])};
 }else if(path==='issues'&&method==='POST'){
  if(!input.title.startsWith('[MID-KILO-HANDOFF] ')||!input.body.includes('DRAFT_ONLY'))throw Error('bad issue');
  out={number:999,html_url:'https://github.com/MeteoMartini/MID/issues/999'};
 }else throw Error('unexpected endpoint '+path);
 process.stdout.write(JSON.stringify(out));
}catch(e){console.error(e.message);process.exit(1)}
