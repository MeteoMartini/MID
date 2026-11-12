import {describe,it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,rmSync,writeFileSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';

const workflow=readFileSync('ci/github/workflows/agent-source-release.yml','utf8');
const mirror=readFileSync('.github/workflows/agent-source-release.yml','utf8');
// Test the same Bash pre-push predicate used by the real release bot.
const marker='            package_parent="$(git rev-parse HEAD^)"';
const start=workflow.indexOf(marker),end=workflow.indexOf('            if git push origin HEAD:main; then',start);
const guard=start>=0&&end>start?workflow.slice(start,end):'';
function verifyCase({extraSource=false,wrongParent=false,missingZipBlob=false}={}){
 const dir=mkdtempSync(path.join(tmpdir(),'mid-zip-scope-'));
 const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8',timeout:10000}).trim();
 try{
  git('init','-q');
  git('config','user.email','mid-qa@example.invalid');
  git('config','user.name','MID QA');
  writeFileSync(path.join(dir,'source.txt'),'approved source');
  git('add','source.txt');
  git('commit','-qm','approved source merge');
  writeFileSync(path.join(dir,'MID-professional-replacement.zip'),'test archive');
  git('add','MID-professional-replacement.zip');
  git('commit','-qm','bootstrap ZIP for removal probe');
  const approvedMerge=git('rev-parse','HEAD');
  // A legitimate transport replaces the existing tracked ZIP artifact;
  // the deletion probe deletes it instead and must be rejected.
  if(missingZipBlob)unlinkSync(path.join(dir,'MID-professional-replacement.zip'));
  else writeFileSync(path.join(dir,'MID-professional-replacement.zip'),'new release archive');
  if(extraSource)writeFileSync(path.join(dir,'source.txt'),'unauthorized change');
  git('add','-A');
  git('commit','-qm','candidate ZIP transport');
  const expectedParent=wrongParent?'f'.repeat(40):approvedMerge;
  const command='set -euo pipefail\n'+guard+'\nprintf "GUARD_PASS\\n"';
  const result=spawnSync('bash',['-c',command],{cwd:dir,encoding:'utf8',timeout:10000,
   env:{PATH:process.env.PATH||'/usr/bin:/bin',HOME:dir,EXPECTED_MERGE_SHA:expectedParent}});
  return {result,approvedMerge};
 }finally{rmSync(dir,{force:true,recursive:true});}
}
describe('MID release-bot ZIP-only direct update scope',()=>{
 it('runs the exact mirrored pre-push guard, never a disconnected model',()=>{
  expect(workflow).toBe(mirror);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  expect(guard).toContain('changed_paths="$(git diff-tree --no-commit-id --name-only -r HEAD)"');
  expect(guard).toContain('! git cat-file -e "HEAD:MID-professional-replacement.zip"');
 });
 it('allows unchanged parent and only a newly produced release ZIP',()=>{
  const {result}=verifyCase();
  expect(result.error?.message??'').toBe('');
  expect(result.status,result.stderr).toBe(0);
  expect(result.stdout).toContain('GUARD_PASS');
 });
 it('denies a source-code change hidden next to the ZIP',()=>{
  const {result}=verifyCase({extraSource:true});
  expect(result.status).not.toBe(0);
  expect((result.stdout||'')+(result.stderr||'')).toContain('ZIP transport rejected');
 });
 it('denies a foreign merge parent',()=>{
  const {result}=verifyCase({wrongParent:true});
  expect(result.status).not.toBe(0);
  expect((result.stdout||'')+(result.stderr||'')).toContain('ZIP transport rejected');
 });
 it('denies a changed ZIP path when the archive was deleted',()=>{
  const {result}=verifyCase({missingZipBlob:true});
  expect(result.status).not.toBe(0);
  expect((result.stdout||'')+(result.stderr||'')).toContain('ZIP transport rejected');
 });
});
