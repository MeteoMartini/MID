import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [canonical,active,sync]=await Promise.all([readFile(new URL('../ci/github/workflows/branch-cleanup.yml',import.meta.url),'utf8'),readFile(new URL('../.github/workflows/branch-cleanup.yml',import.meta.url),'utf8'),readFile(new URL('../scripts/sync-github-workflows.mjs',import.meta.url),'utf8')]);
assert.equal(active,canonical);
for(const token of ['.protected','merge-base --is-ancestor','gh api --method DELETE','einzigartige Commits bleiben erhalten','DRY_RUN','contents: write'])assert.ok(canonical.includes(token),'Branch-Cleanup-Sicherheitsvertrag fehlt: '+token);
assert.ok(!canonical.includes('git push --force'));
assert.ok(sync.includes("['workflows/branch-cleanup.yml','workflows/branch-cleanup.yml']"));
console.log('MID v0.9.85.127: sicherer Branch-Cleanup geschützt.');
