import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const canonical=resolve(root,'ci/github/workflows');
const active=resolve(root,'.github/workflows');
const authorized={'deploy.yml':3,'install-mid.yml':3,'mid-ruc-preprocess.yml':1};
const actionInventory={'deploy.yml':3,'install-mid.yml':3,'mid-ruc-preprocess.yml':2};
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
    assert.match(job.body,/needs\.prepare/,'publisher must depend on sealed RUC producer snapshot');
   }
  }
  observed[name]=jobs.length;
 }
 assert.deepEqual(observed,authorized,'unexpected global Pages writer owner inventory');
});

/* P4 shadow-only writer-ownership regression. The historical R2 shell helper
 * uses an unconditional latest.json write. This test prevents a workflow from
 * silently making it an additional competing production pointer owner.
 * It does NOT claim transactional CAS across GitHub Pages and Cloudflare R2.
 */
function assertNoUnfencedR2WorkflowWrite(source, name) {
  assert.doesNotMatch(
    source,
    /\bpublish_ruc_r2\.sh\b/,
    'unfenced historical R2 shell publisher must not be workflow-dispatched: '+name,
  );
  assert.doesNotMatch(
    source,
    /\baws\s+s3(?:api)?\s+(?:cp|put-object)\b/,
    'workflow must not introduce a raw S3/R2 pointer writer: '+name,
  );
}

test('active and canonical workflow mirrors cannot activate the unfenced R2 pointer',()=>{
  for(const name of readdirSync(canonical).filter(x=>x.endsWith('.yml'))){
    const source=readFileSync(resolve(canonical,name),'utf8');
    assert.equal(readFileSync(resolve(active,name),'utf8'),source,'workflow mirror drift: '+name);
    assertNoUnfencedR2WorkflowWrite(source,name);
  }
});

test('R2 ownership guard rejects explicit competing publisher injection',()=>{
  for(const injected of [
    'run: bash tools/ruc/publish_ruc_r2.sh',
    'run: aws s3 cp latest.json s3://bucket/latest.json',
    'run: aws s3api put-object --bucket bucket --key ruc/latest.json',
  ]){
    assert.throws(()=>assertNoUnfencedR2WorkflowWrite(injected,'injected-workflow'),
      /unfenced historical R2|raw S3\/R2 pointer writer/);
  }
});
