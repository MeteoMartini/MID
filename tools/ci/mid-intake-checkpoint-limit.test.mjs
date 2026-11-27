import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectIntakeCheckpoint as inspect} from './mid-intake-checkpoint-evidence.mjs';

test('first-parent scan accepts distance 1000 and holds at distance 1001',t=>{
 const cwd=mkdtempSync(join(tmpdir(),'mid-intake-boundary-'));
 t.after(()=>rmSync(cwd,{recursive:true,force:true}));
 const g=(...a)=>execFileSync('git',a,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const put=(p,s)=>writeFileSync(join(cwd,p),s);
 const commit=m=>{g('add','-A');g('commit','-qm',m);return g('rev-parse','HEAD');};
 g('init','-q','-b','main');g('config','user.email','fixture@example.invalid');g('config','user.name','Fixture');
 put('weather','old');const sourceBase=commit('base');
 g('checkout','-qb','candidate');put('weather','new');const sourceHead=commit('candidate');
 g('checkout','-q','main');put('base-note','unrelated');const leadBase=commit('lead base');
 g('checkout','-qb','lead');put('weather','new');const checkpoint=commit('intake');
 put('review','review');const leadHead=commit('review');
 g('checkout','-q','main');g('merge','--squash','lead');const merge=commit('squash');
 let stream='';
 for(let i=1;i<=1001;i++){
  const msg=`promotion ${i}`;
  stream+=`commit refs/heads/promotion\nmark :${i}\ncommitter Fixture <fixture@example.invalid> ${1700000000+i} +0000\ndata ${Buffer.byteLength(msg)}\n${msg}\n`+(i===1?`from ${merge}\n`:'')+'\n';
 }
 execFileSync('git',['fast-import','--quiet'],{cwd,input:stream,stdio:['pipe','pipe','pipe']});
 const within=g('rev-parse','promotion~1'),outside=g('rev-parse','promotion');
 assert.equal(g('rev-list','--first-parent','--count',`${merge}..${within}`),'1000');
 assert.equal(g('rev-list','--first-parent','--count',`${merge}..${outside}`),'1001');
 const input={repository:'MeteoMartini/MID',sourcePr:1,leadPr:2,sourceBase,sourceHead,leadBase,checkpoint,leadHead,merge};
 const allowed=inspect({...input,stable:within},{cwd});
 assert.equal(allowed.state,'EXACT_TREE_CANDIDATE');
 const held=inspect({...input,stable:outside},{cwd});
 assert.equal(held.state,'HOLD');assert.equal(held.reason,'LINEAGE_UNVERIFIED');
 for(const r of [allowed,held])for(const flag of ['closureAuthorized','mergeAuthorized','releaseAuthorized'])assert.equal(r[flag],false);
});
