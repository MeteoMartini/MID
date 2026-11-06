import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const canonical=readFileSync(new URL('../ci/github/workflows/mid-code-revision.yml',import.meta.url),'utf8');
const mirrored=readFileSync(new URL('../.github/workflows/mid-code-revision.yml',import.meta.url),'utf8');
const browserJobs=['revision_regressions','ci','nightly','performance'];
function jobSection(document,name){
 const marker=`  ${name}:\n`,start=document.indexOf(marker);
 assert.ok(start>=0,`Revisionsjob fehlt: ${name}`);
 const after=start+marker.length,next=document.slice(after).search(/^  [a-z_]+:\s*$/m);
 return document.slice(after,next<0?undefined:after+next);
}
function requireCompatibleRunners(document){
 for(const name of browserJobs){
  const section=jobSection(document,name);
  assert.match(section,/^    runs-on: ubuntu-24\.04$/m,`Ungeprüfter Browser-Runner in ${name}`);
  assert.doesNotMatch(section,/^    runs-on: ubuntu-latest$/m,`Ungeprüftes ubuntu-latest in ${name}`);
 }
}
assert.equal(mirrored,canonical,'GitHub-Workflow-Mirror muss mit kanonischer Quelle übereinstimmen');
requireCompatibleRunners(canonical);
assert.equal((canonical.match(/^    runs-on: ubuntu-24\.04$/gm)||[]).length,4,'Genau vier browserabhängige Jobs gepinnt');
assert.match(jobSection(canonical,'revision_regressions'),/node scripts\/prepare-browser-runtimes\.mjs/);
assert.match(jobSection(canonical,'revision_regressions'),/npm run test:regressions/);
assert.match(jobSection(canonical,'ci'),/node scripts\/prepare-browser-runtimes\.mjs/);
assert.match(jobSection(canonical,'nightly'),/node scripts\/prepare-browser-runtimes\.mjs/);
assert.match(jobSection(canonical,'performance'),/playwright install --with-deps chromium/);
const unsafe=canonical.replace('  revision_regressions:\n','  revision_regressions:\n');
const broken=unsafe.replace(/(  revision_regressions:\n[\s\S]*?)    runs-on: ubuntu-24\.04/,'$1    runs-on: ubuntu-latest');
assert.notEqual(broken,canonical,'Negativprobe muss den Runner wirklich verändern');
assert.throws(()=>requireCompatibleRunners(broken),/Ungeprüfter Browser-Runner/,'Ein ubuntu-latest-Rückfall muss entdeckt werden');
console.log('MID-Revision: vier Browserjobs auf Ubuntu 24.04, Mirror, Testmatrix und negative Runner-Probe geprüft.');
