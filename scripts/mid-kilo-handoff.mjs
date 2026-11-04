#!/usr/bin/env node
/**
 * MID Kilo handoff: publish verified, unreferenced Git objects and an intake issue.
 * Never creates or updates a branch or tag; never opens a PR or merges.
 * The trusted ChatGPT intake separately validates and creates a Draft PR.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const REPO='MeteoMartini/MID';
const HEX=/^[a-f0-9]{40}$/;
const MAX_FILES=40,MAX_FILE_BYTES=512*1024,MAX_TOTAL_BYTES=2*1024*1024;
const args=process.argv.slice(2);
const dryRun=args.includes('--dry-run');
const titleIndex=args.indexOf('--title');
const title=titleIndex>=0?args[titleIndex+1]:'';
if(!title||title.startsWith('--')||title.length>90||/[\r\n]/.test(title)){
  console.error('Usage: node scripts/mid-kilo-handoff.mjs --title "Brief task name" [--dry-run]');
  process.exit(2);
}
function git(...a){return execFileSync('git',a,{encoding:'utf8',maxBuffer:5*1024*1024}).trim()}
function rawGit(...a){return execFileSync('git',a,{maxBuffer:5*1024*1024})}
function gh(path,body){
 const a=['api','--method',body?'POST':'GET','repos/'+REPO+'/'+path];
 if(body)a.push('--input','-');
 const stdout=execFileSync('gh',a,{input:body?JSON.stringify(body):undefined,encoding:'utf8',maxBuffer:10*1024*1024});
 return JSON.parse(stdout);
}
function abort(message){throw new Error('MID Kilo handoff failed closed: '+message)}
function allowed(path){
 return /^[\x20-\x7e]+$/.test(path) && !path.includes('..') && !path.includes('\\') &&
  !/(^|\/)(?:\.git|\.github|\.kilo|node_modules)(?:\/|$)/.test(path) &&
  (/^src\/[a-zA-Z0-9_./-]+$/.test(path)|| /^public\/[a-zA-Z0-9_./-]+$/.test(path)||
   /^tests\/[a-zA-Z0-9_./-]+$/.test(path)|| /^scripts\/test-[a-zA-Z0-9_.-]+\.(?:mjs|ts)$/.test(path)||
   /^docs\/implementation\/[a-zA-Z0-9_.-]+\.md$/.test(path));
}
function parseDiff(base){
 const buf=rawGit('diff','--no-renames','--name-status','-z',base,'HEAD');
 const fields=buf.toString('utf8').split('\0').filter(Boolean);
 if(fields.length%2!==0)abort('invalid name-status records');
 const changes=[];
 for(let i=0;i<fields.length;i+=2){
  const status=fields[i],path=fields[i+1];
  if(!['A','M','D'].includes(status)||!allowed(path))abort('forbidden file/status: '+status+' '+path);
  if(changes.some(c=>c.path===path))abort('duplicate path');
  changes.push({status,path});
 }
 if(!changes.length||changes.length>MAX_FILES)abort('invalid changed-file count');
 return changes;
}
async function main(){
 if(git('status','--porcelain'))abort('working tree is not clean: commit or safely preserve changes first');
 const branch=git('branch','--show-current');
 if(!branch||['main','mid-stable'].includes(branch))abort('work on a separate local worktree branch, never main/mid-stable');
 const refs=git('ls-remote','origin','refs/heads/main','refs/heads/mid-stable').split('\n').map(l=>l.split(/\s+/));
 const main=refs.find(x=>x[1]==='refs/heads/main')?.[0];
 const stable=refs.find(x=>x[1]==='refs/heads/mid-stable')?.[0];
 if(!HEX.test(stable??'')||main!==stable)abort('main/mid-stable diverge or remote refs cannot be verified');
 const base=git('merge-base','HEAD',stable);
 if(base!==stable||git('rev-list','--count',stable+'..HEAD')==='0')abort('changes are not a forward-only descendant of current stable');
 const changes=parseDiff(stable);
 let total=0;
 const files=changes.map(c=>{
  if(c.status==='D')return {...c,mode:'100644',size:0};
  const entry=git('ls-tree','HEAD','--',c.path).split(/\s+/);
  const mode=entry[0];
  if(!['100644','100755'].includes(mode))abort('unsupported file mode: '+c.path);
  const bytes=rawGit('show','HEAD:'+c.path);
  if(!bytes.length||bytes.length>MAX_FILE_BYTES)abort('empty/oversize file: '+c.path);
  total+=bytes.length;
  if(total>MAX_TOTAL_BYTES)abort('overall handoff > 2 MB');
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9_]{30,}/.test(bytes.toString('utf8')))abort('possible secret in '+c.path);
  return {...c,mode,size:bytes.length,bytes};
 });
 const localTree=git('rev-parse','HEAD^{tree}');
 const manifest=files.map(({path,status,size})=>({path,status,size}));
 const report={repo:REPO,base_sha:stable,local_head:git('rev-parse','HEAD'),tree_sha:localTree,branch,files:manifest,draft_only:true};
 if(dryRun){console.log(JSON.stringify({dry_run:true,...report},null,2));return;}
 const remoteBase=gh('git/commits/'+stable);
 if(remoteBase.sha!==stable||!HEX.test(remoteBase.tree?.sha??''))abort('remote stable git tree lookup mismatch');
 const tree=[];
 for(const file of files){
  if(file.status==='D')tree.push({path:file.path,mode:file.mode,type:'blob',sha:null});
  else{
   const result=gh('git/blobs',{content:file.bytes.toString('base64'),encoding:'base64'});
   if(!HEX.test(result.sha??''))abort('remote blob write did not return verifiable sha for '+file.path);
   tree.push({path:file.path,mode:file.mode,type:'blob',sha:result.sha});
  }
 }
 const uploadedTree=gh('git/trees',{base_tree:remoteBase.tree.sha,tree});
 if(uploadedTree.sha!==localTree)abort('remote tree does not match exact local HEAD tree');
 const remoteCommit=gh('git/commits',{message:'MID Kilo handoff: '+title,tree:uploadedTree.sha,parents:[stable]});
 if(!HEX.test(remoteCommit.sha??''))abort('no verifiable uploaded commit SHA');
 const verified=gh('git/commits/'+remoteCommit.sha);
 if(verified.sha!==remoteCommit.sha||verified.tree?.sha!==localTree||verified.parents?.length!==1||verified.parents[0].sha!==stable)abort('uploaded commit verification failed');
 const issueTitle='[MID-KILO-HANDOFF] '+title;
 const issueBody=[
  'DRAFT_ONLY','', 'Repository: '+REPO,
  'Stable-SHA: '+stable, 'Parent-SHA: '+stable,
  'Candidate-SHA: '+remoteCommit.sha, 'Tree-SHA: '+localTree,
  'Local-HEAD: '+report.local_head, '',
  'Files (SHA-verified tree):',...manifest.map(f=>'- '+f.status+' '+f.path+' ('+f.size+' bytes)'), '',
  'Independent CI/QA: NOT VERIFIED. Only authorized ChatGPT/Codex integration may create the production-repo branch and Draft PR. Never merge/release from this issue.'
 ].join('\n');
 const issue=gh('issues',{title:issueTitle,body:issueBody});
 if(!issue.html_url||typeof issue.number!=='number')abort('commit uploaded, but intake issue failed; retain candidate SHA '+remoteCommit.sha);
 console.log(JSON.stringify({status:'HANDOFF_SUBMITTED',candidate_sha:remoteCommit.sha,stable_sha:stable,issue:issue.html_url,files:manifest.length},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
