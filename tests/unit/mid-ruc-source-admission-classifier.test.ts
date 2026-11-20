import {execFileSync} from 'node:child_process';
import {test,expect} from 'vitest';

// Existing unprivileged Draft Vitest track pre-qualifies classifier negatives.
test('RUC Source-Gate rejects admission bypasses and preserves exact restore scope',()=>{
 const out=execFileSync(process.execPath,['--test','tools/ci/test-ruc-source-admission-classifier.mjs'],{
  cwd:process.cwd(),encoding:'utf8',timeout:30000,maxBuffer:2*1024*1024,
  env:{...process.env,GITHUB_TOKEN:'',GH_TOKEN:''}
 });
 expect(out).toMatch(/# fail 0\b/);
 expect(Number(out.match(/# pass (\d+)\b/)?.[1]||0)).toBeGreaterThanOrEqual(30);
},45000);
