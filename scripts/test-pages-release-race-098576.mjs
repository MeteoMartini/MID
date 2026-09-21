import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [ruc,manual,pkgRaw,baselineRaw]=await Promise.all([
  '.github/workflows/mid-ruc-preprocess.yml',
  '.github/workflows/deploy.yml',
  'package.json',
  'MID_BASELINE.json'
].map(read));
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-pages-release-race-098576.mjs';

for(const token of [
  'RUC-Basis und laufendes Release gegen aktuellen MID-Stable-Stand prüfen',
  '+refs/heads/main:refs/remotes/origin/main',
  'stable_version="$(python3 -c',
  'main_version="$(git show refs/remotes/origin/main:package.json',
  'Ein neuer MID-Release ist noch nicht nach mid-stable promotet',
  'MID-Stable und Releasefenster unmittelbar vor dem Pages-Publish erneut prüfen',
  "id: publish_guard",
  "steps.publish_guard.outputs.allowed == 'true'"
])assert.ok(ruc.includes(token),`RUC/Pages release-race guard fehlt: ${token}`);

assert.ok(ruc.includes('Kein älterer App-Shell-Stand wird auf Pages veröffentlicht.'),'Der zweite RUC-Publish-Guard muss einen veralteten App-Shell-Overwrite fail-closed verhindern.');
assert.ok(manual.includes('Laufendes MID-Release vor manuellem Stable-Deploy ausschließen'),'Auch der manuelle Stable-Deploy muss ein offenes Releasefenster erkennen.');
assert.ok(manual.includes('Manueller Stable-Deploy blockiert'),'Der manuelle Deploy muss eine ältere Stable-Version während eines laufenden Releases blockieren.');

assert.equal(pkg.version,'0.9.85.76');
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredTests','regressionTests'])assert.ok(baseline[key]?.includes(self),`${self} fehlt in ${key}`);

console.log('MID v0.9.85.76: RUC- und manuelle Pages-Publisher können eine neuere laufende MID-App-Shell nicht mehr mit älterem mid-stable überschreiben.');
