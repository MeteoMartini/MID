import {spawnSync} from 'node:child_process';

const PREFIX='repos/MeteoMartini/MID/';
const OPTIONAL=/^repos\/MeteoMartini\/MID\/(?:git\/ref\/tags|releases\/tags)\/v0\.\d+\.\d+\.\d+$/;
const transient=new Set([502,503,504]);
const pause=()=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,500);

// gh --include writes the response status line and headers before the body,
// including on HTTP errors. Never infer absence from stderr or a process error.
export function githubApi(path,method='GET',payload,optional404=false,{spawn=spawnSync,wait=pause}={}){
 if(typeof path!=='string'||!path.startsWith(PREFIX)||!/^[A-Za-z0-9/_.?=&-]+$/.test(path)||
    path.includes('..')&&!/^repos\/MeteoMartini\/MID\/compare\/[a-f0-9]{40}\.\.\.[a-f0-9]{40}$/.test(path)||
    !['GET','POST'].includes(method)||(method==='GET'&&payload!==undefined)||optional404&&(method!=='GET'||!OPTIONAL.test(path)))
  throw Error('Invalid catalog API request');
 const args=['api','--hostname','github.com','--include','-H','X-GitHub-Api-Version: 2022-11-28'];
 args.push('--method',method);
 args.push(path);
 if(payload!==undefined)args.push('--input','-');
 for(let attempt=1;attempt<=2;attempt++){
  const x=spawn('gh',args,{input:payload===undefined?undefined:JSON.stringify(payload),
   encoding:'utf8',timeout:12000,maxBuffer:20*1024*1024,
   env:{...process.env,GH_HOST:'github.com',GH_PAGER:'cat',GH_PROMPT_DISABLED:'1',GH_DEBUG:'',GH_FORCE_TTY:'',NO_COLOR:'1'}});
  if(x.error||x.signal||!Number.isInteger(x.status))throw Error('GitHub API transport error '+method+' '+path);
  const match=/^HTTP\/(?:1\.[01]|2(?:\.0)?|3(?:\.0)?) ([1-5][0-9]{2})(?: [^\r\n]*)?\r?\n/.exec(x.stdout||'');
  const split=/\r?\n\r?\n/.exec(x.stdout||'');
  if(!match||!split||split.index<match[0].length-2)throw Error('GitHub API HTTP status unavailable '+method+' '+path+' (exit '+x.status+')');
  const http=Number(match[1]);
  const headers=x.stdout.slice(match[0].length,split.index);
  const body=x.stdout.slice(split.index+split[0].length);
  const error=()=>Error('GitHub API rejected '+method+' '+path+' (HTTP '+http+', exit '+x.status+', attempt '+attempt+')');
  if(http===404&&x.status===1&&optional404){
   let parsed;try{parsed=JSON.parse(body)}catch{throw error()}
   if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)&&typeof parsed.message==='string')return null;
   throw error();
  }
  if(http>=200&&http<300&&x.status===0){
   try{return JSON.parse(body)}catch{throw Error('Invalid GitHub JSON response '+path)}
  }
  if(method==='GET'&&attempt===1&&x.status===1&&transient.has(http)&&!/^retry-after\s*:/im.test(headers)){
   wait();continue;
  }
  throw error();
 }
 throw Error('Unreachable catalog API state');
}
