import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const canonical=resolve(root,'ci/github/workflows');
const active=resolve(root,'.github/workflows');
const authorized={'deploy.yml':3,'install-mid.yml':3,'mid-ruc-preprocess.yml':2};
const actionInventory={'deploy.yml':3,'install-mid.yml':3,'mid-ruc-preprocess.yml':4};
function jobsOf(text){
 const starts=[...text.matchAll(/^  ([A-Za-z_][A-Za-z0-9_-]*):\s*$/gm)];
 const jobs=[];
 for(let i=0;i<starts.length;i++){
  const match=starts[i],end=i+1<starts.length?starts[i+1].index:text.length;
  // The verified canonical workflow job indentation is exactly two spaces.
  const body=text.slice(match.index,end);
  if(body.includes('uses: actions/deploy-pages@'))jobs.push({id:match[1],body});
 }
 return jobs;
}
test('RUC Fast overlay changes trigger the existing mirrored P2–P5 QA workflow',()=>{
 for(const file of ['tools/ruc/ruc_fast_pages_overlay.py','tools/ruc/test_ruc_fast_pages_overlay.py']){
  const entry="      - '"+file+"'";
  for(const folder of [canonical,active]){
   const yaml=readFileSync(resolve(folder,'mid-ruc-fast-p2345-shadow-qa.yml'),'utf8');
   assert.ok(yaml.includes(entry),'overlay-only change must trigger P2–P5 QA: '+folder+'/'+file);
  }
 }
});
test('all GitHub Pages publishers are enumerated, SHA mirrored and share global mid-pages lease',()=>{
 const observed={};
 for(const name of readdirSync(canonical).filter(x=>x.endsWith('.yml'))){
  const workflow=readFileSync(resolve(canonical,name),'utf8');
  const mirrored=readFileSync(resolve(active,name),'utf8');
  const jobs=jobsOf(workflow);
  assert.equal(mirrored,workflow,'canonical/active writer workflow mirror drift: '+name);
  assert.doesNotMatch(workflow,/wrangler\s+pages\s+deploy|cloudflare\/pages-action@/i,'hidden Pages publisher: '+name);
  if(!jobs.length)continue;
  assert.ok(Object.hasOwn(authorized,name),'unknown Pages writer: '+name);
  assert.equal(jobs.length,authorized[name],'unreviewed Pages publisher job count: '+name);
  if(name==='mid-ruc-preprocess.yml'){
   assert.deepEqual(jobs.map(job=>job.id).sort(),['publish','publish_fast'],
     'expected exactly the full and independent Fast Pages publishers');
  }
  assert.equal((workflow.match(/uses: actions\/deploy-pages@/g)||[]).length,actionInventory[name],
    'unreviewed Normal- or Rollback Pages publish action: '+name);
  for(const job of jobs){
   assert.match(job.body,/group:\s*mid-pages(?:\s|$)/,'publisher must join shared mid-pages: '+name+'/'+job.id);
   assert.match(job.body,/queue:\s*max/,'must not drop earlier RUC publisher: '+name+'/'+job.id);
   assert.match(job.body,/cancel-in-progress:\s*false/,'must not cancel upload or rollback: '+name+'/'+job.id);
   if(name==='deploy.yml'){
    assert.match(job.body,/id:\s*ruc_guard/,'manual dist-only publish lacks RUC-loss guard');
    assert.match(job.body,/ruc_manual_pages_guard\.py --ruc-enabled/,'manual publish has no live RUC check');
    assert.ok(job.body.indexOf('id: ruc_guard')<job.body.indexOf('uses: actions/deploy-pages@'),'manual check not before publish');
    assert.match(job.body,/steps\.ruc_guard\.outcome == 'success'/,'unchecked manual Pages deploy path');
   }
   if(name==='install-mid.yml'){
    assert.match(job.body,/check_ruc_snapshot_current\.py/,'release Pages lacks immutable original RUC current proof');
    assert.match(job.body,/steps\.ruc_guard\.outputs\.current == 'true'/,'release can bypass RUC source freshness');
   }
   if(name==='mid-ruc-preprocess.yml'){
    if(job.id==='publish_fast'){
     assert.match(job.body,/needs\.prepare_fast\.result == 'success'/);
     assert.match(job.body,/MID_RUC_FAST_PAGES_ENABLED == 'true'/);
     assert.match(job.body,/verify_fast_pages_publish\.py/);
     assert.match(job.body,/steps\.fast_publish_guard\.outcome == 'success'/);
     assert.match(job.body,/id:\s*fast_trust/,'independent trusted R2 SHA relay absent');
     assert.match(job.body,/id:\s*fast_rollback_readback/,'rollback readback is unobserved');
     assert.match(job.body,/id:\s*fast_trust_restore/,'independent R2 trust restore is missing');
     assert.match(job.body,/steps\.fast_trust\.outputs\.attempted == 'true' && steps\.fast_rollback_readback\.outcome == 'success'/,'trust restore must follow verified rollback');
     assert.match(job.body,/echo 'attempted=true' >> "\$GITHUB_OUTPUT"/,'R2 attempt marker must precede remote PUT');
     assert.ok(job.body.indexOf("echo 'attempted=true'")<job.body.indexOf('r2 object put "$object" --remote'),
       'ambiguous R2 PUT failure must still be reconciled after Pages rollback');
     assert.match(job.body,/fast-trust-previous\.json/,'valid prior R2 trust proof was not preserved');
     assert.match(job.body,/r2 object delete "\$object" --remote/,'first-time rollback must revoke stale trust');
     assert.match(job.body,/cmp -s "\$RUNNER_TEMP\/fast-trust\.json" "\$current"/,'unsafe R2 overwrite after another publisher');
     assert.match(job.body,/if:\s*steps\.fast_readback\.outcome == 'success'/,'trust receipt before public Pages verification');
     assert.match(job.body,/steps\.fast_deployment\.outcome == 'success' && \(steps\.fast_readback\.outcome == 'failure' \|\| steps\.fast_trust\.outcome == 'failure'\)/,
       'Pages rollback must also protect failed independent R2 SHA transport');
     assert.ok(job.body.indexOf('id: fast_readback')<job.body.indexOf('id: fast_trust')&&job.body.indexOf('id: fast_trust')<job.body.indexOf('id: fast_rollback'),
       'Trust receipt may only follow public SHA readback, with rollback after both');
    }else{
     assert.match(job.body,/needs\.prepare/,'publisher must depend on sealed RUC producer snapshot');
    }
   }
  }
  observed[name]=jobs.length;
 }
 assert.deepEqual(observed,authorized,'unexpected global Pages writer owner inventory');
});
