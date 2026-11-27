// Read-only evidence for selective intake in a squash release. No closure or release authority.
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const SHA=/^[a-f0-9]{40}$/;
const MODE=/^100(644|755)$/;
const keys=['sourceBase','sourceHead','leadBase','checkpoint','leadHead','merge','stable'];
const safePath=p=>typeof p==='string'&&p.length>0&&p.length<400&&!/[\x00-\x1f\x7f\\]/.test(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..'&&s.toLowerCase()!=='.git');
const flags={closureAuthorized:false,mergeAuthorized:false,releaseAuthorized:false};
const hold=reason=>({schema:1,state:'HOLD',reason,...flags});
const fail=()=>{throw Error('INVALID_OR_UNAVAILABLE_GIT_EVIDENCE');};
// Only use in an independently verified, trusted Git checkout with the pinned objects present.
export function inspectIntakeCheckpoint(input,{cwd=process.cwd()}={}){
 try{
  if(!input||input.repository!=='MeteoMartini/MID'||!Number.isSafeInteger(input.sourcePr)||input.sourcePr<1||!Number.isSafeInteger(input.leadPr)||input.leadPr<1||input.sourcePr===input.leadPr||!keys.every(k=>typeof input[k]==='string'&&SHA.test(input[k])))return hold('IDENTITY_INVALID');
  const {sourceBase,sourceHead,leadBase,checkpoint,leadHead,merge,stable}=input;
  const opts={cwd,encoding:'buffer',timeout:15000,maxBuffer:4*1024*1024,env:{...process.env,GIT_NO_REPLACE_OBJECTS:'1',GIT_OPTIONAL_LOCKS:'0',GIT_NO_LAZY_FETCH:'1',GIT_TERMINAL_PROMPT:'0'},stdio:['ignore','pipe','pipe']};
  const args=a=>['--no-replace-objects','--literal-pathspecs','-c','core.fsmonitor=false',...a];
  const run=a=>{const b=execFileSync('git',args(a),opts);const s=b.toString('utf8');if(!Buffer.from(s,'utf8').equals(b))fail();return s;};
  const ancestor=(a,b)=>{const r=spawnSync('git',args(['merge-base','--is-ancestor',a,b]),opts);if(r.error||r.signal||![0,1].includes(r.status))fail();return r.status===0;};
  for(const k of keys)if(run(['cat-file','-t',input[k]]).trim()!=='commit')fail();
  const parents=s=>run(['rev-list','--parents','-n','1',s]).trim().split(' ');
  const firstParentAncestor=(a,b)=>a===b||run(['rev-list','--first-parent','--max-count=1001',b]).trim().split('\n').includes(a);
  const cp=parents(checkpoint),mp=parents(merge);
  if(cp.length!==2||cp[0]!==checkpoint||mp.length!==2||mp[0]!==merge||mp[1]!==leadBase||sourceBase===sourceHead||checkpoint===leadBase||merge===stable||!ancestor(sourceBase,sourceHead)||!ancestor(sourceBase,leadBase)||!firstParentAncestor(leadBase,cp[1])||!firstParentAncestor(checkpoint,leadHead)||!firstParentAncestor(merge,stable))return hold('LINEAGE_UNVERIFIED');
  if(run(['rev-parse',leadHead+'^{tree}']).trim()!==run(['rev-parse',merge+'^{tree}']).trim())return hold('SQUASH_TREE_MISMATCH');
  const raw=run(['diff','--raw','-z','--no-abbrev','--no-renames','--no-ext-diff','--no-textconv',sourceBase,sourceHead,'--']);
  const parts=raw.split('\0');if(parts.pop()!==''||parts.length%2||parts.length<2||parts.length>600)return hold('DELTA_EMPTY_OR_LIMIT');
  const entries=new Map();
  const item=(mode,sha)=>{if(mode==='000000'&&/^0{40}$/.test(sha))return null;if(!MODE.test(mode)||!SHA.test(sha)||/^0{40}$/.test(sha))fail();return mode+':'+sha;};
  for(let i=0;i<parts.length;i+=2){
   const m=/^:(\d{6}) (\d{6}) ([a-f0-9]{40}) ([a-f0-9]{40}) ([AMD])$/.exec(parts[i]),path=parts[i+1];
   if(!m||!safePath(path)||entries.has(path))return hold('UNSUPPORTED_DELTA');
   const before=item(m[1],m[3]),after=item(m[2],m[4]);
   if(before===after||(m[5]==='A'&&before!==null)||(m[5]==='D'&&after!==null)||(m[5]==='M'&&(before===null||after===null)))fail();
   entries.set(path,{before,after});
  }
  const paths=[...entries.keys()].sort();
  const snapshot=s=>{
   const out=new Map(paths.map(p=>[p,null]));const seen=new Set();
   const rows=run(['ls-tree','-z','--full-tree',s,'--',...paths]).split('\0');if(rows.pop()!=='')fail();
   for(const row of rows){const m=/^(\d{6}) blob ([a-f0-9]{40})\t([^\n]+)$/.exec(row);if(!m||!out.has(m[3])||seen.has(m[3]))fail();seen.add(m[3]);out.set(m[3],item(m[1],m[2]));}
   return out;
  };
  const before=snapshot(cp[1]),at=snapshot(checkpoint),final=snapshot(leadHead),published=snapshot(stable);
  const files=paths.map(path=>{const e=entries.get(path);return {path,baseMatches:before.get(path)===e.before,intakeMatches:at.get(path)===e.after,leadMatches:final.get(path)===e.after,stableMatches:published.get(path)===e.after};});
  const fullAtIntake=files.every(f=>f.baseMatches&&f.intakeMatches);
  const state=!fullAtIntake?'INTAKE_NOT_EXACT':files.every(f=>f.leadMatches&&f.stableMatches)?'EXACT_TREE_CANDIDATE':'CHANGED_AFTER_INTAKE';
  return {schema:1,state,sourcePr:input.sourcePr,leadPr:input.leadPr,...Object.fromEntries(keys.map(k=>[k,input[k]])),files,fullAtIntake,...flags,note:'Tree evidence only. Independently verify PR identity, complete release gates, review dispositions and fresh refs before any separate closure decision.'};
 }catch{return hold('INVALID_OR_UNAVAILABLE_GIT_EVIDENCE');}
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 let result;try{result=inspectIntakeCheckpoint(JSON.parse(readFileSync(0,'utf8')));}catch{result=hold('INPUT_INVALID');}
 console.log(JSON.stringify(result,null,2));if(result.state==='HOLD')process.exitCode=1;
}
