import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..');
const canonical=resolve(root,'ci/github/workflows');
const active=resolve(root,'.github/workflows');
const authorized={'deploy.yml':3,'install-mid.yml':3,'mid-ruc-preprocess.yml':2};
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
  assert.equal(jobs.length,authorized[name],'unreviewed Pages deployment count: '+name);
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
