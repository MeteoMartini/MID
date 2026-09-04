import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [canonical,patch,baseline]=await Promise.all([
  readFile(new URL('../ci/github/workflows/install-mid.yml',import.meta.url),'utf8'),
  readFile(new URL('../workflow-patches/install-mid.yml',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8').then(JSON.parse),
]);

for(const [label,workflow] of [['kanonisch',canonical],['Patch',patch]]){
  assert.ok(workflow.includes('installed=false'),'npm-ci-Retry-Guard fehlt: installed=false');
  assert.ok(workflow.includes('for attempt in 1 2 3; do'),'Retry-Schleife fehlt.');
  assert.ok(workflow.includes('if npm ci \\'),'npm ci muss weiterhin der installierende Befehl bleiben.');
  assert.ok(workflow.includes('--no-audit \\'),'npm ci muss weiterhin ohne Inline-Audit laufen.');
  assert.ok(workflow.includes('rm -rf node_modules'),'Fehlgeschlagene Installationsreste müssen bereinigt werden.');
  assert.ok(workflow.includes('npm cache verify || true'),'npm-Cache-Prüfung nach Fehlschlag fehlt.');
  assert.ok(workflow.includes('audit:dependencies'),'Dependency-Audit muss erhalten bleiben.');
  assert.ok(workflow.includes('audited=false'),'Audit-Retry-Guard fehlt.');
  assert.ok(workflow.includes('::error::npm ci konnte nach drei Versuchen nicht erfolgreich abgeschlossen werden.'),`${label}: harte Fehlermeldung für npm ci fehlt.`);
  assert.ok(workflow.includes('::error::Dependency-Audit konnte nach drei Versuchen nicht erfolgreich abgeschlossen werden.'),`${label}: harte Fehlermeldung für das Audit fehlt.`);
}
const test='scripts/test-install-workflow-registry-retries-097840.mjs';
assert.ok(baseline.regressionTests?.includes(test),'Regressionstest fehlt in MID_BASELINE.json (regressionTests).');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Regressionstest fehlt in MID_BASELINE.json (requiredRegressionTests).');
console.log('Install-Workflow geprüft: npm-ci-/Audit-Retries sind kanonisch und im Patchstand hinterlegt.');
