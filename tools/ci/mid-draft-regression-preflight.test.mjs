import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {inspectDraftRegression,planDraftRegression} from './mid-draft-regression-preflight.mjs';

test('maps select the pre-build and the actual narrow browser regressions',()=>{
 const plan=planDraftRegression(['src/ModelMapProbe.tsx','src/styles-src/28-maps.css']);
 assert.ok(plan.selected.includes('scripts/test-adaptive-native-maps-0985141.mjs'));
 assert.ok(plan.selected.includes('scripts/test-unified-map-layers-0985167.mjs'));
 assert.ok(plan.browserPilot.cases.includes('320/light/classic'));
 assert.match(plan.browserPilot.native,/verify-native-model-browser/);
 assert.equal(plan.releaseAuthorized,false);
});
test('workflow pins select the real synchronization regression without a browser run',()=>{
 const plan=planDraftRegression(['ci/github/workflows/mid-code-revision.yml']);
 assert.ok(plan.selected.includes('scripts/test-github-workflow-bootstrap-08263.mjs'));
 assert.equal(plan.browserPilot,null);
});
test('unknown scope is explicitly unresolved and direct matches are unique',()=>{
 assert.equal(planDraftRegression(['src/unknown.ts']).coverage,'MANUAL_SELECTION_REQUIRED');
 assert.deepEqual(planDraftRegression(['src/unknown.ts'],['scripts/test-x.mjs','scripts/test-x.mjs']).selected,['scripts/test-x.mjs']);
});
test('selection reads immutable candidate blobs and follows removed file references',()=>{
 const repo=mkdtempSync(join(tmpdir(),'mid-draft-qa-'));
 const git=(...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
 try{
  git('init','-q');git('config','user.name','MID QA');git('config','user.email','qa@example.invalid');
  mkdirSync(join(repo,'scripts'));mkdirSync(join(repo,'src'));
  const file=join(repo,'src','status.ts');
  writeFileSync(file,'export const ok = true;\n');
  writeFileSync(join(repo,'scripts','test-status.mjs'),"const source = 'src/status.ts';\n");
  writeFileSync(join(repo,'MID_BASELINE.json'),JSON.stringify({requiredRegressionTests:['scripts/test-status.mjs']}));
  git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
  rmSync(file);git('add','-u');git('commit','-qm','head');const head=git('rev-parse','HEAD');
  writeFileSync(join(repo,'scripts','test-status.mjs'),"const source = 'unrelated';\n");
  const plan=inspectDraftRegression(repo,base,head);
  assert.deepEqual(plan.selected,['scripts/test-status.mjs']);
  assert.deepEqual(plan.unavailable,[]);
  assert.throws(()=>inspectDraftRegression(repo,'HEAD',head),/full base and head/);
 }finally{rmSync(repo,{force:true,recursive:true})}
});
