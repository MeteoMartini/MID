#!/usr/bin/env node
/**
 * MID Kilo SHA handoff: upload Git objects + GitHub issue, never refs/branches/PRs.
 * GitHub objects and the intake issue are untrusted until independently checked.
 */
import {execFileSync} from 'node:child_process';

const REPO = 'MeteoMartini/MID';
const HEX = /^[0-9a-f]{40}$/;
const MAX_FILES = 40, MAX_FILE_BYTES = 512 * 1024, MAX_TOTAL_BYTES = 2 * 1024 * 1024;
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const titleIndex = args.indexOf('--title');
const title = titleIndex >= 0 ? args[titleIndex + 1] : '';
if (!title || title.length > 90 || !/^[\p{L}\p{N} ._-]+$/u.test(title)) {
  console.error('Usage: node scripts/mid-kilo-handoff.mjs --title "Short descriptive task" [--dry-run]');
  process.exit(2);
}
function git(...argv) { return execFileSync('git', argv, {encoding:'utf8',maxBuffer:5*1024*1024}).trim(); }
function gitBytes(...argv) { return execFileSync('git', argv, {maxBuffer:5*1024*1024}); }
function gh(path,body) {
  const argv=['api','--method',body===undefined?'GET':'POST','repos/'+REPO+'/'+path];
  if(body!==undefined) argv.push('--input','-');
  return JSON.parse(execFileSync('gh',argv,{input:body===undefined?undefined:JSON.stringify(body),encoding:'utf8',maxBuffer:10*1024*1024}));
}
function stop(message) { throw new Error('MID Kilo handoff fails closed: '+message); }
function allowedPath(path) {
  return /^[\x20-\x7e]+$/.test(path) && !/(^|\/)\.\.?($|\/)/.test(path) &&
    !path.includes('\\') && !/(^|\/)(?:\.git|\.github|\.kilo|node_modules)(?:\/|$)/.test(path) &&
    (/^src\/[a-zA-Z0-9_./-]+\.(?:ts|tsx|css|json|svg)$/.test(path) ||
     /^tests\/[a-zA-Z0-9_./-]+\.(?:ts|tsx|mjs|json)$/.test(path) ||
     /^scripts\/test-[a-zA-Z0-9_.-]+\.mjs$/.test(path) ||
     /^docs\/implementation\/[a-zA-Z0-9_.-]+\.md$/.test(path));
}
function treeEntry(commit,path) {
  const line=git('ls-tree',commit,'--',path);
  if(!line) stop('missing tree path '+path);
  const match=/^(100644|100755|120000|160000) (blob|commit) ([a-f0-9]{40})\t(.+)$/.exec(line);
  if(!match || match[4]!==path) stop('tree entry mismatch '+path);
  return {mode:match[1],type:match[2],sha:match[3]};
}
function changesFrom(base) {
  const pieces=gitBytes('diff','--no-renames','--name-status','-z',base,'HEAD').toString('utf8').split('\0').filter(Boolean);
  if(pieces.length%2!==0) stop('malformed diff name/status records');
  const items=[];
  for(let i=0;i<pieces.length;i+=2){
    const [status,path]=[pieces[i],pieces[i+1]];
    if(!['A','M','D'].includes(status) || !allowedPath(path)) stop('disallowed change '+status+' '+path);
    if(items.some(item=>item.path===path)) stop('duplicate change '+path);
    items.push({status,path});
  }
  if(!items.length||items.length>MAX_FILES)stop('empty/oversized change set');
  return items;
}
function validateSourceBytes(bytes,path){
  if(!bytes.length||bytes.length>MAX_FILE_BYTES)stop('empty or oversized text '+path);
  if(bytes.includes(0))stop('binary NUL byte '+path);
  let str;
  try{str=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{stop('non-UTF-8 source '+path);}
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9_]{30,}/.test(str))stop('potential secret '+path);
  return bytes;
}
async function main(){
  if(git('status','--porcelain'))stop('dirty worktree; preserve/commit changes before handoff');
  const branch=git('branch','--show-current');
  if(!branch||branch==='main'||branch==='mid-stable')stop('must use isolated local development branch');
  const remote=git('ls-remote','origin','refs/heads/main','refs/heads/mid-stable').split('\n').map(x=>x.split(/\s+/));
  const main=remote.find(x=>x[1]==='refs/heads/main')?.[0];
  const stable=remote.find(x=>x[1]==='refs/heads/mid-stable')?.[0];
  if(!HEX.test(stable??'')||main!==stable)stop('main/stable divergence or unverified remote refs');
  // Fetch current Stable as a read. Do not checkout, reset, rebase or update a branch.
  if(!HEX.test(git('rev-parse','--verify','HEAD')))stop('invalid local HEAD');
  git('fetch','--no-tags','origin','refs/heads/mid-stable');
  if(git('rev-parse','FETCH_HEAD')!==stable)stop('stable moved during read-only fetch');
  const root=git('merge-base','HEAD',stable);
  if(root!==stable)stop('HEAD not based on current stable; never reset/rebase automatically');
  if(git('rev-list','--count',stable+'..HEAD')==='0')stop('no new commits');
  if(git('rev-list','--min-parents=2',stable+'..HEAD'))stop('merge commits not accepted');
  const items=changesFrom(stable);
  let total=0;
  const files=items.map(({status,path})=>{
    const entry=treeEntry(status==='D'?stable:'HEAD',path);
    if(entry.type!=='blob'||entry.mode!=='100644')stop('only regular text blobs accepted: '+path);
    if(status==='D')return {status,path,mode:entry.mode,size:0};
    const bytes=validateSourceBytes(gitBytes('show','HEAD:'+path),path);
    total+=bytes.length;
    if(total>MAX_TOTAL_BYTES)stop('total >2 MiB');
    return {status,path,mode:entry.mode,size:bytes.length,bytes};
  });
  const treeSHA=git('rev-parse','HEAD^{tree}');
  const localHead=git('rev-parse','HEAD');
  const manifest=files.map(({status,path,size})=>({status,path,size}));
  if(dryRun){console.log(JSON.stringify({status:'DRY_RUN_ONLY',repo:REPO,stable_sha:stable,local_head:localHead,tree_sha:treeSHA,files:manifest},null,2));return;}
  // Double-check remote stability before beginning irreversible object writes.
  const remote2=git('ls-remote','origin','refs/heads/main','refs/heads/mid-stable').split('\n').map(x=>x.split(/\s+/));
  if(remote2.find(x=>x[1]==='refs/heads/main')?.[0]!==stable||remote2.find(x=>x[1]==='refs/heads/mid-stable')?.[0]!==stable)stop('remote drift');
  const baseObj=gh('git/commits/'+stable);
  if(baseObj.sha!==stable||!HEX.test(baseObj.tree?.sha??''))stop('base Git object not verified');
  const tree=files.map(f=>{
    if(f.status==='D')return {path:f.path,mode:f.mode,type:'blob',sha:null};
    const b=gh('git/blobs',{content:f.bytes.toString('base64'),encoding:'base64'});
    if(!HEX.test(b.sha??''))stop('blob creation unverified: '+f.path);
    return {path:f.path,mode:f.mode,type:'blob',sha:b.sha};
  });
  const newTree=gh('git/trees',{base_tree:baseObj.tree.sha,tree});
  if(newTree.sha!==treeSHA)stop('reconstructed tree differs from local HEAD');
  const candidate=gh('git/commits',{message:'MID Kilo handoff: '+title,tree:treeSHA,parents:[stable]});
  if(!HEX.test(candidate.sha??''))stop('unverified immutable candidate');
  const check=gh('git/commits/'+candidate.sha);
  if(check.sha!==candidate.sha||check.tree?.sha!==treeSHA||check.parents?.length!==1||check.parents[0].sha!==stable)stop('immutable candidate mismatch');
  const issueText=['DRAFT_ONLY','','Repository: '+REPO,'Stable-SHA: '+stable,'Parent-SHA: '+stable,'Candidate-SHA: '+candidate.sha,'Tree-SHA: '+treeSHA,'Local-HEAD: '+localHead,'','Files:',...manifest.map(f=>'- '+f.status+' '+f.path+' ('+f.size+' bytes)'),'','Independent QA: NOT VERIFIED. No merge or release authorized.'].join('\n');
  const issue=gh('issues',{title:'[MID-KILO-HANDOFF] '+title,body:issueText});
  if(!issue.html_url||!Number.isInteger(issue.number))stop('candidate uploaded, but intake issue missing: '+candidate.sha);
  console.log(JSON.stringify({status:'HANDOFF_SUBMITTED',candidate_sha:candidate.sha,stable_sha:stable,issue:issue.html_url,files:manifest.length},null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
