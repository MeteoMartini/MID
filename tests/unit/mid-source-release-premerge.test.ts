import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {describe,expect,it} from 'vitest';

const canonical='ci/github/workflows/agent-source-release.yml';
const mirrored='.github/workflows/agent-source-release.yml';
const workflow=readFileSync(canonical,'utf8');

describe('MID #740 trusted workflow review premerge and #697 branch boundary',()=>{
 it('keeps mirrored source release workflows byte-identical and preserves original gates',()=>{
  expect(readFileSync(mirrored,'utf8')).toBe(workflow);
  expect(workflow).toContain("branches:\n      - 'chatgpt/**'\n      - 'codex/**'");
  expect(workflow).toContain("startsWith(github.event.workflow_run.head_branch, 'chatgpt/')");
  expect(workflow).toContain("startsWith(github.event.workflow_run.head_branch, 'codex/')");
  const identify=workflow.indexOf('- name: Geprüften PR robust identifizieren');
  const review=workflow.indexOf('- name: Unabhängigen Reviewstand vor SHA-Merge fail-closed prüfen');
  const merge=workflow.indexOf('- name: Geprüften Agent-PR automatisch zusammenführen');
  const checkout=workflow.indexOf('- name: Zusammengeführten main-Stand laden');
  expect(identify).toBeGreaterThan(0);
  expect(review).toBeGreaterThan(identify);
  expect(merge).toBeGreaterThan(review);
  expect(checkout).toBeGreaterThan(merge);
  expect(workflow).toContain("steps.pr.outputs.already_merged != 'true'");
  expect(workflow).toContain('merge_method=squash');
  expect(workflow).toContain('gh workflow run install-mid.yml --ref main');
  expect(workflow).toContain('permission-actions: write');
  expect(workflow).toContain('permission-pull-requests: write');
  expect(workflow).not.toContain('pull_request_target:');
  expect(workflow).not.toContain('persist-credentials: true');
  expect(workflow).toContain("python3 - <<'PY'");
 });
 it('executes the embedded Python using 19 independent mock GitHub scenarios',()=>{
  const result=spawnSync('python3',['tests/fixtures/mid-source-release-premerge-qa.py'],{
   encoding:'utf8',timeout:25000,
   env:{...process.env,GH_TOKEN:'',MID_RELEASE_APP_PRIVATE_KEY:''}
  });
  expect(result.status,[result.stdout,result.stderr,result.error?.message].filter(Boolean).join('\n')).toBe(0);
  expect(result.stdout).toContain('19 mocked allow/deny/TOCTOU tests PASS');
  expect(result.stdout).toContain('ZERO network requests');
 });
});
