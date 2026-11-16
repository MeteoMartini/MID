import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';

const read=(path:string)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const sha='c9fadfcd0969e949a92f414b321627dd3d4fb0cc';
const repo='MeteoMartini/MID';
const bot=read('.github/workflows/agent-source-release.yml');
const heal=read('.github/workflows/release-self-heal.yml');
const valid=()=>({id:43737955517,path:'.github/workflows/install-mid.yml',
 event:'workflow_dispatch',head_branch:'main',head_repository:{full_name:repo},
 head_sha:sha,status:'completed',conclusion:'failure',run_attempt:1});
const filter=heal.match(/'(\(\.id == \$runId[\s\S]*?\.run_attempt == \$attempt\))' <<<"\$installer_run"/)?.[1];
function checkRun(metadata:unknown){
 expect(filter,'Extract exact jq filter from workflow').toBeTruthy();
 const r=spawnSync('jq',['-e','--arg','repo',repo,'--arg','main',sha,
  '--argjson','runId','43737955517','--argjson','attempt','1',filter!],
  {input:JSON.stringify(metadata),encoding:'utf8',timeout:4000});
 if(r.error)throw r.error;
 return r.status;
}
describe('MID #740: privileged workflow_run provenance',()=>{
 it('restricts bot triggers before obtaining privileged token',()=>{
  expect(bot).toBe(read('ci/github/workflows/agent-source-release.yml'));
  const job=bot.slice(bot.indexOf('  merge_package_dispatch:'),bot.indexOf('    steps:',bot.indexOf('  merge_package_dispatch:')));
  for(const term of ["github.event.workflow_run.conclusion == 'success'",
   "github.event.workflow_run.event == 'pull_request'",
   'github.event.workflow_run.head_repository.full_name == github.repository',
   "startsWith(github.event.workflow_run.head_branch, 'chatgpt/')",
   "startsWith(github.event.workflow_run.head_branch, 'codex/')"])
   expect(job).toContain(term);
  expect(bot).toContain('ref: \x24{{ github.workflow_sha }}');
  expect(bot).toContain('node tools/ci/mid-review-premerge-guard.mjs');
  expect(bot).toContain('sha="\x24{EXPECTED_HEAD_SHA}"');
 });
 it('restricts self-heal triggers and preserves trusted classifier',()=>{
  expect(heal).toBe(read('ci/github/workflows/release-self-heal.yml'));
  const job=heal.slice(heal.indexOf('  classify_and_retry:'),heal.indexOf('    steps:',heal.indexOf('  classify_and_retry:')));
  for(const term of ["github.event.workflow_run.conclusion == 'failure'",
   "github.event.workflow_run.event == 'workflow_dispatch'",
   "github.event.workflow_run.head_branch == 'main'",
   'github.event.workflow_run.head_repository.full_name == github.repository',
   'github.event.workflow_run.run_attempt < 3'])
   expect(job).toContain(term);
  expect(heal).toContain('ref: \x24{{ steps.trusted_stable.outputs.sha }}');
  expect(heal).toContain('persist-credentials: false');
  expect(heal).toContain('env -u GH_TOKEN node tools/ci/release-self-heal-classify.mjs');
 });
 it('executes actual jq workflow filter and rejects foreign and stale events',()=>{
  expect(checkRun(valid())).toBe(0);
  const cases=[
   {...valid(),id:1},{...valid(),path:'.github/workflows/other.yml'},
   {...valid(),event:'push'},{...valid(),event:'pull_request'},
   {...valid(),head_branch:'codex/other'},
   {...valid(),head_repository:{full_name:'other/MID'}},
   {...valid(),head_repository:null},
   {...valid(),head_sha:'f'.repeat(40)},
   {...valid(),status:'in_progress'},
   {...valid(),conclusion:'success'},
   {...valid(),run_attempt:2},
   {...valid(),id:null},{...valid(),head_sha:null},{}
  ];
  for(const c of cases)expect(checkRun(c),JSON.stringify(c)).not.toBe(0);
 });
 it('isolates retry diagnostics and cleans temp files',()=>{
  expect(heal).toContain('umask 077');
  expect(heal).toContain('scratch="$(mktemp -d "\x24{RUNNER_TEMP:-/tmp}/mid-self-heal.XXXXXXXX")"');
  expect(heal).toContain("trap 'rm -rf -- \"$scratch\"' EXIT");
  expect(heal).toContain('"$scratch/failed.log"');
  expect(heal).toContain('"$scratch/jobs.json"');
  expect(heal).not.toContain('/tmp/mid-failed.log');
  expect(heal).not.toContain('/tmp/mid-failed-jobs.json');
 });
});
