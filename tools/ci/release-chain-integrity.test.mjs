import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPublishedChain} from './release-chain-integrity.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),d='d'.repeat(40);
const source=['Source-Kern vollständig prüfen',...[1,2,3,4].map(n=>'Core-Regression · core-'+n+'/4'),'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-native-map ·','Heavy-Regression · heavy-mountain-visual ·',...[1,2,3].map(n=>'Heavy-Regression · heavy-unified-map · '+n+'/3'),'Agent-Quellstand vollständig prüfen'];
const install=['Release-ZIP prüfen und immutable Snapshot vorbereiten','Release-Core, Build, Audit und iOS prüfen',...[1,2,3,4].map(n=>'Release-Core-Regression · core-'+n+'/4'),...[1,2,3].map(n=>'Release-Heavy · heavy-unified-map · '+n+'/3'),'Release-Heavy · heavy-mountain-visual ·','Release-Heavy · heavy-native-map ·','Release-Heavy · heavy-browser-state ·','Vollständig geprüften Release sammeln und committen','GitHub-Pages-Artefakt parallel vorbereiten','Geprüften MID-Worker sicher automatisch veröffentlichen','Erfolgreichen Pages-/Worker-Release finalisieren','MID auf GitHub Pages veröffentlichen · Versuch 1','MID auf GitHub Pages veröffentlichen · Versuch 2'];
const run=(id,name,path,event,head,start,end)=>({id,name,path,event,head_sha:head,run_attempt:1,status:'completed',conclusion:'success',created_at:start,updated_at:end});
const jobs=(names,id,head)=>names.map((name,i)=>({id:id*100+i+1,run_id:id,run_attempt:1,head_sha:head,name,status:'completed',conclusion:'success'}));
const fixture=()=>{
 const s=run(101,'MID-Agent-Quellstand prüfen','.github/workflows/chatgpt-pr-gate.yml','pull_request',a,'2026-10-31T07:26:02Z','2026-10-31T07:38:08Z');
 const bot=run(102,'Geprüften Agent-PR automatisch veröffentlichen','.github/workflows/agent-source-release.yml','workflow_run',d,'2026-10-31T07:38:10Z','2026-10-31T07:38:30Z');
 const i=run(103,'MID-Release aus ZIP installieren und veröffentlichen','.github/workflows/install-mid.yml','workflow_dispatch',c,'2026-10-31T07:38:28Z','2026-10-31T07:53:10Z');
 const ij=jobs(install,103,c);ij.at(-1).conclusion='skipped';
 return {schema:'mid.readonly-release-chain.v1',repository:'MeteoMartini/MID',version:'0.9.85.383',mainSha:b,stableSha:b,
  pr:{number:536,state:'closed',merged:true,draft:false,base:'main',head:'chatgpt/v0.9.85.383-ruc-health',headSha:a,mergeSha:d},
  sourceRun:s,sourceJobs:jobs(source,101,a),botRun:bot,mergeCommit:{sha:d},
  packageCommit:{sha:c,parents:[{sha:d}]},packageFiles:[{filename:'MID-professional-replacement.zip',status:'added'}],
  installerRun:i,installerJobs:ij,stableCommit:{sha:b,parents:[{sha:c}]}};
};
test('positive: Source/Bot/Installer overlap measured as wall clock, no reuse authority',()=>{
 const r=inspectPublishedChain(fixture());
 assert.equal(r.sourceSeconds,726);assert.equal(r.botSeconds,20);assert.equal(r.installerSeconds,882);
 assert.equal(r.sourceToInstallerEndSeconds,1628);
 assert.equal(r.releaseAuthorized,false);assert.equal(r.reuseAuthorized,false);assert.equal(r.signatureVerified,false);
});
const negative=(name,mutator)=>test('fail-closed '+name,()=>{
 const f=fixture();mutator(f);assert.throws(()=>inspectPublishedChain(f),/MID read-only release chain rejected/);
});
negative('source head drift',f=>{f.sourceRun.head_sha='f'.repeat(40)});
negative('main/stable drift',f=>{f.stableSha='f'.repeat(40)});
negative('invalid package version',f=>{f.version='0.9.85.383-pre'});
negative('still-draft PR',f=>{f.pr.draft=true});
negative('untrusted source branch',f=>{f.pr.head='dependabot/pkg'});
negative('missing Source shard',f=>{f.sourceJobs.pop()});
negative('Source skipped Heavy shard',f=>{f.sourceJobs.find(j=>j.name.startsWith('Heavy-Regression')).conclusion='skipped'});
negative('Source duplicate names',f=>{f.sourceJobs.push({...f.sourceJobs[0],id:999})});
negative('Source stale attempt',f=>{f.sourceJobs[0].run_attempt=2});
negative('Source foreign run',f=>{f.sourceJobs[1].run_id=999});
negative('Source/Bot time drift',f=>{f.sourceRun.updated_at='2026-10-31T08:00:00Z'});
negative('Bot failed',f=>{f.botRun.conclusion='failure'});
negative('ZIP wrong merge parent',f=>{f.packageCommit.parents[0].sha=a});
negative('ZIP extra file',f=>{f.packageFiles.push({filename:'.env',status:'added'})});
negative('Stable wrong parent',f=>{f.stableCommit.parents[0].sha=d});
negative('Installer wrong archive SHA',f=>{f.installerRun.head_sha=a});
negative('Installer missing Worker',f=>{f.installerJobs=f.installerJobs.filter(j=>!j.name.startsWith('Geprüften MID-Worker'))});
negative('Installer skipped core',f=>{f.installerJobs.find(j=>j.name.startsWith('Release-Core-Regression')).conclusion='skipped'});
negative('Pages all skipped',f=>{f.installerJobs.filter(j=>j.name.startsWith('MID auf GitHub Pages')).forEach(j=>j.conclusion='skipped')});
negative('two successful Pages attempts',f=>{f.installerJobs.at(-1).conclusion='success'});
negative('bad UTC offset',f=>{f.sourceRun.created_at='2026-10-31T07:26:02+01:00'});
negative('Installer not completed',f=>{f.installerRun.status='in_progress'});
