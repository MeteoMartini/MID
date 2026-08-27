import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {syncGithubConfiguration} from './sync-github-workflows.mjs';

const root=new URL('../',import.meta.url),sourceRoot=path.join(new URL('../ci/github/',import.meta.url).pathname),tmp=await mkdtemp(path.join(tmpdir(),'mid-actions-v7-'));
const checkout='3d3c42e5aac5ba805825da76410c181273ba90b1',setup='820762786026740c76f36085b0efc47a31fe5020',codeql='ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd';
try{
 const workflows=path.join(tmp,'.github','workflows');await mkdir(workflows,{recursive:true});
 await writeFile(path.join(workflows,'apply-private-analytics.yml'),`name: extra\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v6\n      - uses: actions/setup-node@2951748f4c016b747952f8ca7e75fc64f2f62b53 # v6.2.0\n`);
 await writeFile(path.join(workflows,'mid-code-revision.yml'),`name: revision\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2\n      - uses: actions/setup-node@v6\n      - uses: github/codeql-action/init@b374143c1149a9112b0c294e1934b07dc108205d # v4.37.6\n      - uses: github/codeql-action/analyze@b374143c1149a9112b0c294e1934b07dc108205d # v4.37.6\n`);
 const updated=await syncGithubConfiguration({root:tmp,sourceRoot});
 assert.ok(updated.includes(path.join('workflows','apply-private-analytics.yml')),'Zusatzworkflow wurde nicht aktualisiert.');
 assert.ok(updated.includes(path.join('workflows','mid-code-revision.yml')),'Revisionsworkflow wurde nicht aktualisiert.');
 for(const file of ['apply-private-analytics.yml','mid-code-revision.yml','install-mid.yml','deploy.yml','dependency-audit.yml']){
  const text=await readFile(path.join(workflows,file),'utf8');
  if(/actions\/checkout@/.test(text))assert.ok(text.includes(`actions/checkout@${checkout} # v7.0.1`),`${file}: checkout v7 fehlt.`);
  if(/actions\/setup-node@/.test(text))assert.ok(text.includes(`actions/setup-node@${setup} # v7.0.0`),`${file}: setup-node v7 fehlt.`);
  assert.ok(!/actions\/(?:checkout|setup-node)@v6\b/.test(text),`${file}: v6-Action blieb zurück.`);
  if(/github\/codeql-action\/(?:init|analyze)@/.test(text)){
   assert.ok(text.includes(`github/codeql-action/init@${codeql} # v4.37.7`),`${file}: CodeQL init 4.37.7 fehlt.`);
   assert.ok(text.includes(`github/codeql-action/analyze@${codeql} # v4.37.7`),`${file}: CodeQL analyze 4.37.7 fehlt.`);
  }
 }
}finally{await rm(tmp,{recursive:true,force:true})}
const [pkgText,baselineText]=await Promise.all([readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-github-actions-v7-sync-09570.mjs';
assert.equal(pkg.scripts?.['test:github-actions-v7-sync'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test));
assert.ok(baseline.regressionTests?.includes(test));
console.log('Explizite GitHub-Workflow-Synchronisierung geprüft: checkout v7.0.1, setup-node v7.0.0 und CodeQL 4.37.7 werden SHA-gepinnt in kanonischen und zusätzlichen MID-Workflows angewendet.');
