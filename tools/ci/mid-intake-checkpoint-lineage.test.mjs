import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inspectIntakeCheckpoint as inspect} from './mid-intake-checkpoint-evidence.mjs';
function fixture(t,sideCheckpoint,sidePromotion){
 const cwd=mkdtempSync(join(tmpdir(),'mid-intake-lineage-'));t.after(()=>rmSync(cwd,{recursive:true,force:true}));
 const g=(...a)=>execFileSync('git',a,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 const put=(p,s)=>writeFileSync(join(cwd,p),s);const commit=m=>{g('add','-A');g('commit','-qm',m);return g('rev-parse','HEAD');};
 g('init','-q','-b','main');g('config','user.email','fixture@example.invalid');g('config','user.name','Fixture');
 put('weather','old');const sourceBase=commit('base');g('checkout','-qb','candidate');put('weather','new');const sourceHead=commit('candidate');
 g('checkout','-q','main');put('base-note','unrelated');const leadBase=commit('lead base');
 g('checkout','-qb','lead');put('lead-note','note');commit('lead work');
 if(sideCheckpoint)g('checkout','-qb','side-intake',leadBase);
 put('weather','new');const checkpoint=commit('intake');
 if(sideCheckpoint){g('checkout','-q','lead');g('merge','--no-ff','-m','merge side intake','side-intake');}
 put('review','review');const leadHead=commit('review');
 g('checkout','-q','main');if(sidePromotion)g('checkout','-qb','side-promotion');
 g('merge','--squash','lead');const merge=commit('squash');
 if(sidePromotion){g('checkout','-q','main');put('main-note','unrelated');commit('not release path');g('merge','--no-ff','-m','merge side promotion','side-promotion');}
 put('version','published');const stable=commit('promotion');
 return {cwd,g,input:{repository:'MeteoMartini/MID',sourcePr:1,leadPr:2,sourceBase,sourceHead,leadBase,checkpoint,leadHead,merge,stable}};
}
for(const [name,sideCheckpoint,sidePromotion] of [['normal linear path',false,false],['checkpoint only on secondary parent',true,false],['squash only on secondary parent of Stable',false,true]])test(name,t=>{const {cwd,g,input}=fixture(t,sideCheckpoint,sidePromotion);const leadChain=g('rev-list','--first-parent',input.leadHead).split('\n');const stableChain=g('rev-list','--first-parent',input.stable).split('\n');assert.equal(leadChain.includes(input.checkpoint),!sideCheckpoint);assert.equal(stableChain.includes(input.merge),!sidePromotion);const r=inspect(input,{cwd});assert.equal(r.closureAuthorized,false);assert.equal(r.mergeAuthorized,false);assert.equal(r.releaseAuthorized,false);console.log(JSON.stringify({name,state:r.state,reason:r.reason,checkpointFirstParent:leadChain.includes(input.checkpoint),mergeFirstParent:stableChain.includes(input.merge)}));assert.equal(r.state,sideCheckpoint||sidePromotion?'HOLD':'EXACT_TREE_CANDIDATE');});
