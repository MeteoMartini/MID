#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {git,gh,repo,requireThat,validateTask,validateBytes,liveBase,verifyIssue,blobHash,listIssues} from '../tools/handoff/copilot.mjs';
const t=validateTask(JSON.parse(readFileSync(new URL('../tools/handoff/ap1b.json',import.meta.url),'utf8')));
const args=process.argv.slice(2),submit=args.includes('--submit');
try{
 requireThat(args.length===(submit?1:0),'usage: node scripts/mid-copilot-handoff.mjs [--submit]');
 const stable=liveBase();
 requireThat(git('rev-parse','HEAD').toString().trim()===t.base,'local base differs from authorized recovery base');
 requireThat(git('diff','--name-only').length===0,'unstaged tracked changes; preserve work');
 const tree=git('write-tree').toString().trim();
 requireThat(tree===t.expectedTree,'staged tree differs from secured AP1b result');
 const names=git('diff','--cached','--name-only','-z').toString().split('\0').filter(Boolean).sort();
 requireThat(JSON.stringify(names)===JSON.stringify([...t.paths].sort()),'unexpected staged paths');
 const files=names.map(path=>{
  requireThat(/^100644 blob /.test(git('ls-tree',tree,'--',path).toString()),'nonregular file');
  const bytes=git('show',':'+path);validateBytes(bytes);return {path,bytes,sha:blobHash(bytes)};
 });
 // Always search before writes. An interrupted attempt requires inspection, not retry.
 const issues=listIssues('all');
 const prior=issues.filter(i=>i.title==='[MID-COPILOT-HANDOFF] '+t.task);
 if(prior.length){requireThat(prior.length===1,'duplicate handoffs');console.log(JSON.stringify(verifyIssue(prior[0],t),null,2));process.exit(0);}
 if(!submit){console.log(JSON.stringify({status:'DRY_RUN_ONLY',task:t.task,base:t.base,tree,stable,files:names,releaseAuthorized:false}));process.exit(0);}
 const actor=JSON.parse(execFileSync('gh',['api','user'],{encoding:'utf8'}));
 requireThat(t.submitters.some(a=>a.id===actor.id&&a.login===actor.login),'authenticated submitter not authorized');
 requireThat(liveBase()===stable,'stable moved');
 const base=gh('git/commits/'+t.base);
 const elements=files.map(f=>{const b=gh('git/blobs',{content:f.bytes.toString('base64'),encoding:'base64'});requireThat(b.sha===f.sha,'uploaded blob mismatch');return {path:f.path,mode:'100644',type:'blob',sha:b.sha};});
 const remoteTree=gh('git/trees',{base_tree:base.tree.sha,tree:elements});requireThat(remoteTree.sha===tree,'uploaded tree mismatch');
 const commit=gh('git/commits',{message:'MID Copilot candidate: '+t.task,tree,parents:[t.base]});requireThat(/^[a-f0-9]{40}$/.test(commit.sha),'invalid candidate');
 console.error('IMMUTABLE_CANDIDATE_CREATED '+commit.sha+'; do not blindly retry after any subsequent error.');
 requireThat(liveBase()===stable,'stable moved after object upload');
 const title='[MID-COPILOT-HANDOFF] '+t.task;
 const body=JSON.stringify({schema:1,repository:repo,task:t.task,base:t.base,tree,candidate:commit.sha});
 const issue=gh('issues',{title,body});requireThat(Number.isSafeInteger(issue.number),'issue creation not verified');
 const readback=gh('issues/'+issue.number);requireThat(readback.body===body&&readback.title===title,'issue readback mismatch');
 console.log(JSON.stringify({...verifyIssue(readback,t),issue:readback.html_url},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
