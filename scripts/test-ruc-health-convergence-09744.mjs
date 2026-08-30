import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const health=await readFile(path.join(root,'tools/ruc/check_ruc_health.py'),'utf8');
for(const token of [
  "attempts: int = 7",
  "retry_delay: float = 8",
  "max_retry_delay: float = 30",
  "('mid_ruc_expected', run)",
  "('mid_ruc_probe', str(attempt))",
  "'Cache-Control': 'no-cache'",
  "'Pragma': 'no-cache'",
  "if str(payload.get('run','')) != run",
  "worker RUC health did not converge after"
]) assert.ok(health.includes(token),`RUC convergence contract missing: ${token}`);
const py=process.env.PYTHON || process.env.PYTHON3 || 'python3';
const result=spawnSync(py,[path.join(root,'tools/ruc/test_ruc_health_check.py')],{cwd:root,encoding:'utf8'});
if(result.stdout)process.stdout.write(result.stdout);
if(result.stderr)process.stderr.write(result.stderr);
assert.equal(result.status,0,'Python RUC health convergence regression failed');
console.log('RUC post-Pages health convergence regression OK');
