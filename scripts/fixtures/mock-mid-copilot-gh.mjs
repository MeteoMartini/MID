#!/usr/bin/env node
// Test-only Git-backed API fixture. No network and no real credentials.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const args=process.argv.slice(2),method=args[args.indexOf('--method')+1],path=args[args.indexOf('--method')+2];
const task=JSON.parse(readFileSync(process.env.MID_TEST_TASK,'utf8'));
const statePath=process.env.MID_TEST_STATE;
let state;try{state=JSON.parse(readFileSync(statePath,'utf8'));}catch{state={issues:[],writes:0};}
const g=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
const p=path?.replace('repos/MeteoMartini/MID/','');
let out;
if(args[1]==='user')out=task.submitters[0];
else if(method==='GET'){
 if(p.startsWith('branches/'))out={commit:{sha:task.base}};
 else if(p.startsWith('issues?'))out=state.issues;
 else if(p.startsWith('issues/'))out=state.issues.find(i=>i.number===Number(p.split('/')[1]));
 else if(p.startsWith('git/commits/')){const sha=p.split('/')[2],v=g('show','-s','--format=%T%n%P',sha).split('\n');out={sha,tree:{sha:v[0]},parents:(v[1]||'').split(' ').filter(Boolean).map(sha=>({sha}))};}
 else if(p.startsWith('git/trees/')){const sha=p.split('/')[2].split('?')[0];out={truncated:false,tree:g('ls-tree','-r','-t',sha).split('\n').filter(Boolean).map(l=>{const [left,path]=l.split('\t'),[mode,type,sha]=left.split(' ');return {mode,type,sha,path};})};}
 else if(p.startsWith('git/blobs/')){const sha=p.split('/')[2],b=execFileSync('git',['cat-file','blob',sha]);out={sha,size:b.length,encoding:'base64',content:b.toString('base64')};}
}else if(method==='POST'){
 const body=JSON.parse(readFileSync(0,'utf8'));state.writes++;
 if(p==='git/blobs'){const b=Buffer.from(body.content,'base64');out={sha:execFileSync('git',['hash-object','-w','--stdin'],{input:b,encoding:'utf8'}).trim()};}
 else if(p==='git/trees')out={sha:g('write-tree')};
 else if(p==='git/commits')out={sha:execFileSync('git',['commit-tree',body.tree,'-p',body.parents[0]],{input:body.message,encoding:'utf8'}).trim()};
 else if(p==='issues'){out={...body,number:77,state:'open',user:task.submitters[0],html_url:'https://github.com/MeteoMartini/MID/issues/77'};state.issues.push(out);}
}
if(!out)throw new Error('Unexpected mocked API call '+args.join(' '));
writeFileSync(statePath,JSON.stringify(state));console.log(JSON.stringify(out));
