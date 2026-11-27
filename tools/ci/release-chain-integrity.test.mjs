import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectPublishedChain} from './release-chain-integrity.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),d='d'.repeat(40),e='e'.repeat(40);
const source=['Source-Kern vollständig prüfen',...[1,2,3,4].map(n=>'Core-Regression · core-'+n+'/4'),'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-native-map ·','Heavy-Regression · heavy-mountain-visual ·',...[1,2,3].map(n=>'Heavy-Regression · heavy-unified-map · '+n+'/3'),'Agent-Quellstand vollständig prüfen'];
const install=['Release-ZIP prüfen und immutable Snapshot vorbereiten','Release-Core, Build, Audit und iOS prüfen',...[1,2,3,4].map(n=>'Release-Core-Regression · core-'+n+'/4'),...[1,2,3].map(n=>'Release-Heavy · heavy-unified-map · '+n+'/3'),'Release-Heavy · heavy-mountain-visual ·','Release-Heavy · heavy-native-map ·','Release-Heavy · heavy-browser-state ·','Vollständig geprüften Release sammeln und committen','GitHub-Pages-Artefakt parallel vorbereiten','Geprüften MID-Worker sicher automatisch veröffentlichen','Erfolgreichen Pages-/Worker-Release finalisieren','MID auf GitHub Pages veröffentlichen · Versuch 1','MID auf GitHub Pages veröffentlichen · Versuch 2'];
const run=(id,name,path,event,head,start,end)=>({id,name,path,event,head_sha:head,run_attempt:1,status:'completed',conclusion:'success',created_at:start,updated_at:end});
const jobs=(names,id,head)=>names.map((name,i)=>({id:id*100+i+1,run_id:id,run_attempt:1,head_sha:head,name,status:'completed',conclusion:'success'}));
const fixture=()=>{
 const s=run(101,'MID-Agent-Quellstand prüfen','.github/workflows/chatgpt-pr-gate.yml','pull_request',a,'2026-10-31T07:26:02Z','2026-10-31T07:38:08Z');
 const bot=run(102,'Geprüften Agent-PR automatisch veröffentlichen','.github/workflows/agent-source-release.yml','workflow_run',e,'2026-10-31T07:38:10Z','2026-10-31T07:38:30Z');
 const i=run(103,'MID-Release aus ZIP installieren und veröffentlichen','.github/workflows/install-mid.yml','workflow_dispatch',c,'2026-10-31T07:38:28Z','2026-10-31T07:53:10Z');
 const ij=jobs(install,103,c);ij.at(-1).conclusion='skipped';
 return {schema:'mid.readonly-release-chain.v1',repository:'MeteoMartini/MID',version:'0.9.85.383',mainSha:b,stableSha:b,
  pr:{number:536,state:'closed',merged:true,draft:false,base:'main',head:'chatgpt/v0.9.85.383-ruc-health',headSha:a,baseSha:e,mergeSha:d},
  sourceRun:s,sourceJobs:jobs(source,101,a),botRun:bot,mergeCommit:{sha:d,parents:[{sha:e}]},
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
negative('unrelated successful Bot run',f=>{f.botRun.head_sha=d});
negative('merge commit not derived from PR base',f=>{f.mergeCommit.parents[0].sha=a});

// Normalized original GitHub evidence for .527 (2026-11-27, attempt 1).
// Exact original job IDs, names, conclusions, run IDs and HEADs; not a new CI run.
const original527=()=>{
 const repo='MeteoMartini/MID',stable='7e5e2385b0092e40c268ed1f0c7203325c8d18e4',base='cc275420d602ae6313f8c6e5f81f28d50f57a122',head='480ed7b1aca88788d8c2acea4975cc791159e333',merge='94633575128064344031130f1bc36d23a4d5d368',zip='88fe3c721c881dec6bad23bdf339bcfee8548883';
 const bind=r=>({...r,repository:{full_name:repo},head_repository:{full_name:repo}});
 const s=bind(run(45972480959,'MID-Agent-Quellstand prüfen','.github/workflows/chatgpt-pr-gate.yml','pull_request',head,'2026-11-27T09:17:31Z','2026-11-27T09:27:20Z'));
 const bot=bind(run(45973854257,'Geprüften Agent-PR automatisch veröffentlichen','.github/workflows/agent-source-release.yml','workflow_run',base,'2026-11-27T09:27:23Z','2026-11-27T09:27:58Z'));
 const i=bind(run(45973926187,'MID-Release aus ZIP installieren und veröffentlichen','.github/workflows/install-mid.yml','workflow_dispatch',zip,'2026-11-27T09:27:54Z','2026-11-27T09:43:18Z'));
 const actual=(r,rows)=>rows.map(([id,name,conclusion='success'])=>({id,name,conclusion,status:'completed',run_id:r.id,run_attempt:r.run_attempt,head_sha:r.head_sha}));
 const sj=actual(s,[
  [140416014625,'Determine whether complete original RUC admission is required'],[140416015037,'Source-Kern vollständig prüfen'],
  [140416015065,'Core-Regression · core-1/4'],[140416015093,'Core-Regression · core-4/4'],[140416015103,'Heavy-Regression · heavy-unified-map · 2/3'],[140416015114,'Core-Regression · core-3/4'],[140416015159,'Core-Regression · core-2/4'],[140416015177,'Heavy-Regression · heavy-browser-state ·'],[140416015191,'Heavy-Regression · heavy-native-map ·'],[140416015250,'Heavy-Regression · heavy-mountain-visual ·'],[140416015255,'Heavy-Regression · heavy-unified-map · 3/3'],[140416015265,'Heavy-Regression · heavy-unified-map · 1/3'],[140416017457,'RUC +27h Kern, EPS und Gesamtpaket','skipped'],[140416017558,'Extremwetterpolygone · echte Browserpixel','skipped'],[140416109792,'Admit three genuine DWD 27h original runs, codec and contour (read-only)','skipped'],[140420504698,'Agent-Quellstand vollständig prüfen']]);
 const bj=actual(bot,[[140420597227,'PR mergen, Release-ZIP erzeugen und Installer starten']]);
 const ij=actual(i,[
  [140420844974,'Release-ZIP prüfen und immutable Snapshot vorbereiten'],[140420956697,'Release-Core, Build, Audit und iOS prüfen'],[140420956698,'Release-Core-Regression · core-3/4'],[140420956705,'Release-Core-Regression · core-2/4'],[140420956720,'Release-Heavy · heavy-unified-map · 2/3'],[140420956724,'Release-Heavy · heavy-unified-map · 1/3'],[140420956726,'Release-Core-Regression · core-4/4'],[140420956762,'Release-Heavy · heavy-native-map ·'],[140420956770,'Release-Heavy · heavy-browser-state ·'],[140420956772,'Release-Core-Regression · core-1/4'],[140420956778,'Release-Heavy · heavy-unified-map · 3/3'],[140420956781,'Release-Heavy · heavy-mountain-visual ·'],[140425485966,'Vollständig geprüften Release sammeln und committen'],[140425801540,'Geprüften MID-Worker sicher automatisch veröffentlichen'],[140425804014,'GitHub-Pages-Artefakt parallel vorbereiten','skipped'],[140425933873,'Pages-Retry abkühlen · 1'],[140425935957,'MID auf GitHub Pages veröffentlichen · Versuch 1','skipped'],[140425979458,'MID auf GitHub Pages veröffentlichen · Versuch 2'],[140427653279,'Erfolgreichen Pages-/Worker-Release finalisieren'],[140427654221,'Pages-Retry abkühlen · 2','skipped'],[140427654326,'MID auf GitHub Pages veröffentlichen · Versuch 3','skipped'],[140427766467,'SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren']]);
 return {schema:'mid.readonly-release-chain.v2',repository:repo,version:'0.9.85.527',mainSha:stable,stableSha:stable,
  pr:{number:1033,state:'closed',merged:true,draft:false,base:'main',head:'chatgpt/v0.9.85.527-lead-evidence-integrity',headRepo:repo,baseRepo:repo,headSha:head,baseSha:base,mergeSha:merge},
  sourceRun:s,sourceJobs:sj,sourceJobCount:16,botRun:bot,botJobs:bj,botJobCount:1,mergeCommit:{sha:merge,parents:[{sha:base}]},packageCommit:{sha:zip,parents:[{sha:merge}]},packageFiles:[{filename:'MID-professional-replacement.zip',status:'added'}],installerRun:i,installerJobs:ij,installerJobCount:22,stableCommit:{sha:stable,parents:[{sha:zip}]}};
};
const setJob=(f,part,name,value)=>{const j=f[part].find(j=>j.name===name);assert.ok(j);j.conclusion=value;};
const setPage=(f,n,value)=>setJob(f,'installerJobs','MID auf GitHub Pages veröffentlichen · Versuch '+n,value);
const setCooldown=(f,n,value)=>setJob(f,'installerJobs','Pages-Retry abkühlen · '+n,value);
test('original .527: complete 16/1/22 job inventories, skipped optional prep and Pages attempt 2',()=>{
 const r=inspectPublishedChain(original527());
 assert.equal(r.pagesAttempt,2);assert.equal(r.sourceJobCount,16);assert.equal(r.botJobCount,1);assert.equal(r.installerJobCount,22);assert.equal(r.sourceSeconds,589);assert.equal(r.botSeconds,35);assert.equal(r.installerSeconds,924);assert.equal(r.sourceToInstallerEndSeconds,1547);
 assert.equal(r.releaseAuthorized,false);assert.equal(r.reuseAuthorized,false);assert.equal(r.signatureVerified,false);
});
test('current: attempt 1 with prep and no cooldown',()=>{const f=original527();setPage(f,1,'success');setPage(f,2,'skipped');setCooldown(f,1,'skipped');setJob(f,'installerJobs','GitHub-Pages-Artefakt parallel vorbereiten','success');assert.equal(inspectPublishedChain(f).pagesAttempt,1);});
test('current: earlier failed Pages attempt superseded by later success',()=>{const f=original527();setPage(f,1,'failure');assert.equal(inspectPublishedChain(f).pagesAttempt,2);});
test('current: attempt 3 after two earlier failed/skipped attempts',()=>{const f=original527();setPage(f,2,'failure');setPage(f,3,'success');setCooldown(f,2,'success');assert.equal(inspectPublishedChain(f).pagesAttempt,3);});
const neg527=(name,mutate)=>test('current fail-closed '+name,()=>{const f=original527();mutate(f);assert.throws(()=>inspectPublishedChain(f),/MID read-only release chain rejected/);});
neg527('legacy schema downgrade',f=>{f.schema='mid.readonly-release-chain.v1'});
neg527('source count mismatch',f=>{f.sourceJobCount--});
neg527('bot count missing',f=>{delete f.botJobCount});
neg527('installer count mismatch',f=>{f.installerJobCount++});
neg527('foreign source repository',f=>{f.sourceRun.repository.full_name='other/repo'});
neg527('foreign installer head repository',f=>{f.installerRun.head_repository.full_name='other/repo'});
neg527('foreign PR',f=>{f.pr.headRepo='other/repo'});
neg527('branch version mismatch',f=>{f.version='0.9.85.528'});
neg527('native decision skipped',f=>setJob(f,'sourceJobs','Determine whether complete original RUC admission is required','skipped'));
neg527('native admission omitted even with adjusted count',f=>{f.sourceJobs=f.sourceJobs.filter(j=>!j.name.startsWith('Admit three genuine'));f.sourceJobCount--});
neg527('native admission failure',f=>setJob(f,'sourceJobs','Admit three genuine DWD 27h original runs, codec and contour (read-only)','failure'));
neg527('conditional Source job not completed',f=>{f.sourceJobs.find(j=>j.conclusion==='skipped').status='in_progress'});
neg527('bot job not successful',f=>{f.botJobs[0].conclusion='failure'});
neg527('bot job wrong SHA',f=>{f.botJobs[0].head_sha=f.pr.headSha});
neg527('missing prep even with adjusted count',f=>{f.installerJobs=f.installerJobs.filter(j=>!j.name.startsWith('GitHub-Pages-Artefakt'));f.installerJobCount--});
neg527('prep failed',f=>setJob(f,'installerJobs','GitHub-Pages-Artefakt parallel vorbereiten','failure'));
neg527('cancelled earlier Pages',f=>setPage(f,1,'cancelled'));
neg527('later Pages failure',f=>setPage(f,3,'failure'));
neg527('duplicate successful Pages',f=>setPage(f,3,'success'));
neg527('missing required cooldown',f=>setCooldown(f,1,'skipped'));
neg527('later cooldown failed',f=>setCooldown(f,2,'failure'));
neg527('catalog not completed successfully',f=>setJob(f,'installerJobs','SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren','skipped'));
neg527('finalizer failed',f=>setJob(f,'installerJobs','Erfolgreichen Pages-/Worker-Release finalisieren','failure'));
neg527('unknown extra job even if successful',f=>{f.installerJobs.push({...f.installerJobs[0],id:99,name:'Unrecognized step'});f.installerJobCount++});
neg527('mixed Installer run attempt',f=>{f.installerJobs[0].run_attempt=2});
neg527('duplicate job ID',f=>{f.installerJobs[1].id=f.installerJobs[0].id});

negative('legacy branch version mismatch',f=>{f.version='0.9.85.382'});
negative('legacy bot starts before terminal Source',f=>{f.botRun.created_at='2026-10-31T07:27:00Z'});
neg527('legacy relabel downgrade with legacy topology',f=>{
 f.schema='mid.readonly-release-chain.v1';f.version='0.9.85.526';
 f.sourceJobs=f.sourceJobs.filter(j=>!j.name.startsWith('Determine whether')&&!j.name.startsWith('Admit three genuine'));
 setJob(f,'installerJobs','GitHub-Pages-Artefakt parallel vorbereiten','success');
});
neg527('bot starts before terminal Source',f=>{f.botRun.created_at='2026-11-27T09:18:00Z'});
