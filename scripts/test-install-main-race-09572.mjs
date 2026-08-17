import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [canonical,patch,pkgText,baselineText]=await Promise.all([
  readFile(new URL('ci/github/workflows/install-mid.yml',root),'utf8'),
  readFile(new URL('workflow-patches/install-mid.yml',root),'utf8'),
  readFile(new URL('package.json',root),'utf8'),
  readFile(new URL('MID_BASELINE.json',root),'utf8')
]);
for(const [name,workflow] of [['kanonisch',canonical],['patch',patch]]){
  for(const token of [
    'ref: ${{ github.sha }}',
    'install_base_sha="$GITHUB_SHA"',
    'git fetch --no-tags origin main',
    'git merge-base --is-ancestor "$remote_sha" HEAD',
    "grep -Ev '^\\.github/'",
    'git rebase origin/main',
    'for attempt in 1 2 3; do',
    'if git push origin HEAD:main; then',
    'Dieser Lauf überschreibt den neueren Stand nicht.'
  ]) assert.ok(workflow.includes(token),`${name}: Race-Schutz fehlt: ${token}`);
  assert.ok(!workflow.includes('git push --force origin HEAD:main'),`${name}: Force-Push auf main ist unzulässig.`);
}
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-install-main-race-09572.mjs';
assert.equal(pkg.scripts?.['test:install-main-race'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test),'Required Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regression fehlt.');
console.log('Installer-main-Race geprüft: eventgebundener Checkout, sichere .github-Rebase-Ausnahme, fachliche Änderungen brechen ab, kein Force-Push auf main.');
