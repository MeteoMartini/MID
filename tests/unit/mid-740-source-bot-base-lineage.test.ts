import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const workflow=readFileSync('.github/workflows/agent-source-release.yml','utf8');
const mirror=readFileSync('ci/github/workflows/agent-source-release.yml','utf8');
const good='a'.repeat(40);
function shellSourceBase(){
 const start=workflow.indexOf('            source_base_sha="$(jq');
 const endMarker='            echo "source_base_sha=${source_base_sha}" >> "$GITHUB_OUTPUT"';
 const finish=workflow.indexOf(endMarker,start);
 if(start<0||finish<start)throw Error('NO_EXACT_EXTRACTOR');
 const code=workflow.slice(start,workflow.indexOf('\n',finish)+1)
  .split('\n').filter(Boolean).map(line=>line.slice(12)).join('\n');
 if(/gh api|git push|workflow_run\.pull_requests/.test(code))throw Error('UNTRUSTED_EXTRACTOR');
 return code;
}
function exercise(matches:any[]){
 const dir=mkdtempSync(join(tmpdir(),'mid740-sourcebase-'));
 try{
  const output=join(dir,'gh-output');
  const r=spawnSync('bash',['-c','set -euo pipefail\nmatches="$MID_MATCHES"\n'+shellSourceBase()],{
   encoding:'utf8',env:{...process.env,GITHUB_OUTPUT:output,MID_MATCHES:JSON.stringify(matches)}
  });
  return {status:r.status,output:existsSync(output)?readFileSync(output,'utf8'):'',
   stderr:r.stderr};
 }finally{rmSync(dir,{recursive:true,force:true})}
}
describe('#740 exact PR REST base used by source-bot SHA-bound merge guard',()=>{
 it('retains identical workflow mirrors and ALL preexisting privileged release gates',()=>{
  expect(workflow).toBe(mirror);
  expect(workflow).toContain('EXPECTED_SOURCE_BASE_SHA: ${{ steps.pr.outputs.source_base_sha }}');
  expect(workflow).not.toContain('EXPECTED_SOURCE_BASE_SHA: ${{ github.event.workflow_run.pull_requests[0].base.sha }}');
  expect(workflow).toContain('if [ "$count" != "1" ]; then');
  expect(workflow).toContain('node tools/ci/mid-review-premerge-guard.mjs');
  expect(workflow).toContain('gh api --method PUT "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/merge"');
  expect(workflow.indexOf('node tools/ci/mid-review-premerge-guard.mjs'))
   .toBeLessThan(workflow.indexOf('gh api --method PUT "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/merge"'));
  expect(workflow).toContain('ref: ${{ github.workflow_sha }}');
  expect(workflow).toContain('git push origin HEAD:main');
  expect(workflow).toContain('gh workflow run install-mid.yml --repo "$GITHUB_REPOSITORY" --ref main');
 });
 it('extracts verified REST source PR base without consulting webhook PR array',()=>{
  const x=exercise([{number:847,head:{sha:'b'.repeat(40)},base:{sha:good}}]);
  expect(x.status).toBe(0);
  expect(x.output).toBe('source_base_sha='+good+'\n');
 });
 it.each([
  ['empty REST response',[]],
  ['missing base',[{number:847,base:{}}]],
  ['null base',[{number:847,base:null}]],
  ['empty SHA',[{number:847,base:{sha:''}}]],
  ['bad SHA',[{number:847,base:{sha:'bad'}}]],
  ['uppercase SHA',[{number:847,base:{sha:'A'.repeat(40)}}]]
 ] as [string,any[]][])('%s fails closed',(_label,data)=>{
  const x=exercise(data);
  expect(x.status).not.toBe(0);
  expect(x.output).toBe('');
 });
});