import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const targets=[['chatgpt-pr-gate.yml',7],['install-mid.yml',7],['mid-code-revision.yml',6],['mid-ruc-preprocess.yml',4]] as const;
function checkoutConfigs(yaml:string){
 const lines=yaml.split('\n'),out:{sha:string,with:boolean,credentials:string[]}[]=[];
 for(let i=0;i<lines.length;i++){
  const m=lines[i].match(/^(\s+)(?:-\s+)?uses:\s+actions\/checkout@([0-9a-f]{40})/);
  if(!m)continue;
  const depth=m[1].length+(lines[i].trim().startsWith('- uses:')?2:0);
  let withBlock=false;const credentials:string[]=[];
  for(let j=i+1;j<lines.length;j++){
   const txt=lines[j].trim(),width=lines[j].match(/^\s*/)?.[0].length??0;
   if(txt&&!txt.startsWith('#')&&width<depth)break;
   if(txt==='with:'&&width===depth)withBlock=true;
   if(withBlock&&width===depth+2&&txt.startsWith('persist-credentials:'))credentials.push(txt);
  }
  out.push({sha:m[2],with:withBlock,credentials});
 }
 return out;
}
const secure=(yaml:string,n:number)=>{
 const arr=checkoutConfigs(yaml);
 return arr.length===n&&arr.every(x=>x.with&&x.credentials.length===1&&x.credentials[0]==='persist-credentials: false');
};
describe('MID P1 artipacked: prevent persistent checkout access tokens',()=>{
 for(const [name,count] of targets){
  it(name+' has '+count+' identical, immutable and nonpersistent checkouts',()=>{
   const active=readFileSync(new URL('../../.github/workflows/'+name,import.meta.url),'utf8');
   const mirror=readFileSync(new URL('../../ci/github/workflows/'+name,import.meta.url),'utf8');
   expect(active).toBe(mirror);
   if(name==='install-mid.yml')expect(active).toBe(readFileSync(new URL('../../workflow-patches/install-mid.yml',import.meta.url),'utf8'));
   expect(secure(active,count)).toBe(true);
   expect(checkoutConfigs(active).every(x=>/^[0-9a-f]{40}$/.test(x.sha))).toBe(true);
   expect(secure(active.replace('persist-credentials: false','persist-credentials: true'),count)).toBe(false);
   expect(secure(active.replace('persist-credentials: false',''),count)).toBe(false);
  });
 }
 it('preserves Source, Installer, CodeQL and RUC pre-existing invariants',()=>{
  const read=(name:string)=>readFileSync(new URL('../../.github/workflows/'+name,import.meta.url),'utf8');
  expect(read('chatgpt-pr-gate.yml')).toContain('github.event.pull_request.head.repo.full_name == github.repository');
  expect(read('install-mid.yml')).toContain('MID-professional-replacement.zip');
  expect(read('mid-code-revision.yml')).toContain('github/codeql-action/analyze@');
  expect(read('mid-ruc-preprocess.yml')).toContain('ref: mid-stable');
 });
});
