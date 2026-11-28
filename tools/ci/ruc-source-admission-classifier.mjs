/**
 * MID Source-Gate RUC admission classifier. Only the two existing
 * Pages restore paths may avoid live native-DWD original-run admission.
 * SHA-exact synthetic merge HEAD vs HEAD^1; no network or PR code execution.
 */
import {appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const RESTORE_ONLY = new Set([
  'tools/ruc/restore_ruc_pages_snapshot.py',
  'tools/ruc/test_restore_ruc_pages_snapshot.py',
]);
export const NATIVE_ADMISSION_SURFACES = new Set([
  'scripts/verify-ruc-composites.mjs',
  'scripts/test-github-workflow-bootstrap-08263.mjs',
  'src/rucSynopticFields.ts',
  'src/nativeSynopticFields.ts',
  'src/cloudWeatherData.ts',
  'ci/github/workflows/chatgpt-pr-gate.yml',
  '.github/workflows/chatgpt-pr-gate.yml',
  'tools/ci/ruc-source-admission-classifier.mjs',
  'tools/ci/test-ruc-source-admission-classifier.mjs',
  'tests/unit/mid-ruc-source-admission-classifier.test.ts',
]);

export function classifyRucSourceChanges(paths) {
  if (!Array.isArray(paths) || paths.some(p => typeof p !== 'string' || !p || p.includes('\0'))) {
    throw new TypeError('Unverifiable git diff path list');
  }
  const relevant = [...new Set(paths)].filter(p => p.startsWith('tools/ruc/') || NATIVE_ADMISSION_SURFACES.has(p));
  const full = relevant.filter(p => !RESTORE_ONLY.has(p));
  return Object.freeze({
    enabled: full.length > 0,
    restoreOnly: relevant.length > 0 && full.length === 0,
    relevantPaths: relevant.length,
    fullAdmissionPaths: full.length,
  });
}
export function readExactMergeChangedPaths() {
  // --no-renames surfaces both sides of renames; -z avoids newline ambiguity.
  // Missing parents, failed git and malformed output always fail the gate.
  const bytes = execFileSync('git', [
    'diff','--no-ext-diff','--no-textconv','--no-renames','--name-only','-z','HEAD^1','HEAD','--'
  ], {maxBuffer: 16 * 1024 * 1024});
  if (!Buffer.isBuffer(bytes) || (bytes.length && bytes[bytes.length-1] !== 0)) {
    throw new Error('Unterminated Git NUL path list');
  }
  return bytes.length ? bytes.toString('utf8').split('\0').slice(0,-1) : [];
}
function runAsWorkflow() {
  if (!process.env.GITHUB_OUTPUT) throw new Error('Missing GitHub output sink');
  const result = classifyRucSourceChanges(readExactMergeChangedPaths());
  appendFileSync(process.env.GITHUB_OUTPUT, 'enabled=' + String(result.enabled) + '\n');
  console.log('MID RUC SHA-exact source admission: ' + JSON.stringify(result));
  if (result.restoreOnly) {
    console.log('Restore-only: mandatory SHA/manifest/rollback security regression is not exempt.');
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAsWorkflow();
}
