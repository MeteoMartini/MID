// MID read-only cross-gate release observation. This is NOT a signing, reuse or deployment gate.
// Inputs MUST be fetched independently from GitHub; no release authorization can be inferred.
const SHA=/^[a-f0-9]{40}$/;
const sourceRequired=['Source-Kern vollständig prüfen',...[1,2,3,4].map(n=>'Core-Regression · core-'+n+'/4'),'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-native-map ·','Heavy-Regression · heavy-mountain-visual ·',...[1,2,3].map(n=>'Heavy-Regression · heavy-unified-map · '+n+'/3'),'Agent-Quellstand vollständig prüfen'];
const installerRequired=['Release-ZIP prüfen und immutable Snapshot vorbereiten','Release-Core, Build, Audit und iOS prüfen',...[1,2,3,4].map(n=>'Release-Core-Regression · core-'+n+'/4'),...[1,2,3].map(n=>'Release-Heavy · heavy-unified-map · '+n+'/3'),'Release-Heavy · heavy-mountain-visual ·','Release-Heavy · heavy-native-map ·','Release-Heavy · heavy-browser-state ·','Vollständig geprüften Release sammeln und committen','GitHub-Pages-Artefakt parallel vorbereiten','Geprüften MID-Worker sicher automatisch veröffentlichen','Erfolgreichen Pages-/Worker-Release finalisieren'];
// The current .527 topology is an explicit observation profile, not a workflow gate.
const sourceDetection='Determine whether complete original RUC admission is required';
const nativeAdmission='Admit three genuine DWD 27h original runs, codec and contour (read-only)';
const sourceConditional=['RUC +27h Kern, EPS und Gesamtpaket','Extremwetterpolygone · echte Browserpixel'];
const prep='GitHub-Pages-Artefakt parallel vorbereiten';
const catalog='SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren';
const botJob='PR mergen, Release-ZIP erzeugen und Installer starten';
const pageName=n=>'MID auf GitHub Pages veröffentlichen · Versuch '+n;
const cooldownName=n=>'Pages-Retry abkühlen · '+n;
const pagesNames=[1,2,3].map(pageName),cooldowns=[1,2].map(cooldownName);
const versionParts=v=>typeof v==='string'&&/^0(?:\.(?:0|[1-9]\d*)){3}$/.test(v)&&v.split('.').map(Number).every(Number.isSafeInteger)?v.split('.').map(Number):null;
const atLeast527=v=>{const p=versionParts(v);return p&&(p[1]>9||(p[1]===9&&(p[2]>85||(p[2]===85&&p[3]>=527))));};
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const fail=s=>{throw Error('MID read-only release chain rejected: '+s)};
const sha=(x,s)=>{if(typeof x!=='string'||!SHA.test(x))fail('Invalid '+s+' SHA');return x};
const stamp=(s,name)=>{
 if(typeof s!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s))fail('Unknown '+name+' UTC time');
 const epoch=Date.parse(s);
 // Date.parse may normalize impossible calendar dates and 24:00. Preserve legitimate fractional UTC timestamps.
 if(!Number.isFinite(epoch)||new Date(epoch).toISOString().slice(0,19)!==s.slice(0,19))fail('Unknown '+name+' UTC time');
 return epoch;
};
function checkRun(r,name,path,event,head){
 if(!isObj(r)||!positive(r.id)||r.name!==name||r.path!==path||r.event!==event||r.head_sha!==head||r.status!=='completed'||r.conclusion!=='success'||!positive(r.run_attempt))fail('Untrusted '+name+' workflow status/identity');
 const first=stamp(r.created_at,name),last=stamp(r.updated_at,name);
 if(last<first)fail('Negative duration '+name);
 return {first,last};
}
function requiredJobs(jobs,required,run,scope){
 if(!Array.isArray(jobs)||jobs.length<required.length||jobs.length>=100)fail(scope+' inventory length unverified');
 const names=new Map(),ids=new Set();
 for(const j of jobs){
  if(!isObj(j)||!positive(j.id)||ids.has(j.id)||j.run_id!==run.id||j.run_attempt!==run.run_attempt||j.head_sha!==run.head_sha||typeof j.name!=='string'||j.status!=='completed'||names.has(j.name))fail(scope+' duplicate/foreign/mixed-attempt job');
  names.set(j.name,j);ids.add(j.id);
 }
 for(const name of required){
  const j=names.get(name);
  if(!j||j.status!=='completed'||j.conclusion!=='success')fail(scope+' required gate '+name);
 }
 return names;
}
function completeInventory(jobs,count,scope){
 if(!Array.isArray(jobs)||!positive(count)||count>=100||jobs.length!==count)fail(scope+' incomplete original job inventory');
}
function observeCurrentInstaller(installMap){
 const expected=new Set([...installerRequired,catalog,...pagesNames,...cooldowns]);
 if(installMap.size!==expected.size||[...installMap.keys()].some(n=>!expected.has(n)))fail('Unknown or incomplete Installer topology');
 const pages=pagesNames.map(n=>installMap.get(n));
 const successes=pages.map((j,i)=>j.conclusion==='success'?i+1:0).filter(Boolean);
 if(successes.length!==1)fail('Exactly one successful Pages deploy required');
 const attempt=successes[0];
 for(let i=1;i<=3;i++){
  const conclusion=pages[i-1].conclusion;
  if((i<attempt&&!['failure','skipped'].includes(conclusion))||(i>attempt&&conclusion!=='skipped'))fail('Pages attempt order unverified');
 }
 for(let i=1;i<=2;i++)if(installMap.get(cooldownName(i)).conclusion!==(i<attempt?'success':'skipped'))fail('Pages cooldown order unverified');
 if(!['success','skipped'].includes(installMap.get(prep).conclusion))fail('Pages preparation unverified');
 return attempt;
}
export function inspectPublishedChain(e){
 if(!isObj(e)||!['mid.readonly-release-chain.v1','mid.readonly-release-chain.v2'].includes(e.schema)||e.repository!=='MeteoMartini/MID'||!versionParts(e.version))fail('Unknown provenance/schema/version');
 const current=e.schema==='mid.readonly-release-chain.v2';
 // Historical v1 remains a descriptive legacy report only. Do not silently downgrade modern releases.
 if(!current&&atLeast527(e.version))fail('Current release requires v2 job inventory');
 if(current){
  completeInventory(e.sourceJobs,e.sourceJobCount,'Source');
  completeInventory(e.botJobs,e.botJobCount,'Bot');
  completeInventory(e.installerJobs,e.installerJobCount,'Installer');
  const runs=[e.sourceRun,e.botRun,e.installerRun];
  if(runs.some(r=>r?.repository?.full_name!==e.repository||r?.head_repository?.full_name!==e.repository)||new Set(runs.map(r=>r.id)).size!==3||e.pr?.headRepo!==e.repository||e.pr?.baseRepo!==e.repository)fail('Current repository/run identity unverified');
 }

 const {pr,sourceRun,sourceJobs,botRun,mergeCommit,packageCommit,packageFiles,installerRun,installerJobs,stableCommit,mainSha,stableSha}=e;
 sha(mainSha,'main');sha(stableSha,'Stable');sha(stableCommit?.sha,'Stable commit');
 if(mainSha!==stableSha||stableCommit.sha!==mainSha)fail('main and Stable diverged');
 if(!isObj(pr)||!positive(pr.number)||pr.state!=='closed'||pr.merged!==true||pr.draft!==false||pr.base!=='main'||!/^(chatgpt|codex)\/v\d+\.\d+\.\d+\.\d+-[a-z0-9._-]+$/.test(pr.head)||sha(pr.headSha,'PR HEAD')!==sourceRun?.head_sha||sha(pr.baseSha,'PR base')!==botRun?.head_sha||sha(pr.mergeSha,'PR merge')!==mergeCommit?.sha)fail('PR merge/head policy');
 // Bind the version to the original branch for BOTH evidence schemas; a relabel must not select legacy validation.
 if(!pr.head.startsWith('chatgpt/v'+e.version+'-')&&!pr.head.startsWith('codex/v'+e.version+'-'))fail('PR version mismatch');
 const source=checkRun(sourceRun,'MID-Agent-Quellstand prüfen','.github/workflows/chatgpt-pr-gate.yml','pull_request',pr.headSha);
 const requiredSource=current?[...sourceRequired,sourceDetection]:sourceRequired;
 const sourceMap=requiredJobs(sourceJobs,requiredSource,sourceRun,'Source');
 const allowed=new Set([...requiredSource,...sourceConditional,...(current?[nativeAdmission]:[])]);
 if(current&&sourceMap.size!==allowed.size)fail('Incomplete current Source topology');
 for(const [name,j] of sourceMap)if(!allowed.has(name)||!['success','skipped'].includes(j.conclusion))fail('Unknown Source job '+name);
 const bot=checkRun(botRun,'Geprüften Agent-PR automatisch veröffentlichen','.github/workflows/agent-source-release.yml','workflow_run',pr.baseSha);
 if(current&&requiredJobs(e.botJobs,[botJob],botRun,'Bot').size!==1)fail('Unknown Bot job');
 // A workflow_run bot follows terminal Source evidence. Bot/Installer overlap is separately permitted.
 if(bot.first<source.last||bot.last<source.last)fail('Source/Bot impossible ordering');
 sha(mergeCommit?.sha,'merge commit');sha(packageCommit?.sha,'package commit');
 if(!Array.isArray(mergeCommit.parents)||mergeCommit.parents.length!==1||mergeCommit.parents[0]?.sha!==pr.baseSha)fail('Merged Source parent is not the verified PR base');
 if(!Array.isArray(packageCommit?.parents)||packageCommit.parents.length!==1||packageCommit.parents[0]?.sha!==mergeCommit.sha)fail('Package parent is not Source merge');
 if(!Array.isArray(packageFiles)||packageFiles.length!==1||packageFiles[0]?.filename!=='MID-professional-replacement.zip'||packageFiles[0]?.status!=='added')fail('Package not ZIP-only');
 if(!Array.isArray(stableCommit.parents)||stableCommit.parents.length!==1||stableCommit.parents[0]?.sha!==packageCommit.sha)fail('Stable parent not package');
 if(installerRun?.head_sha!==packageCommit.sha)fail('Installer did not use package SHA');
 const installer=checkRun(installerRun,'MID-Release aus ZIP installieren und veröffentlichen','.github/workflows/install-mid.yml','workflow_dispatch',packageCommit.sha);
 const mandatoryInstall=current?[...installerRequired.filter(n=>n!==prep),catalog]:installerRequired;
 const installMap=requiredJobs(installerJobs,mandatoryInstall,installerRun,'Installer');
 let pagesAttempt;
 if(current)pagesAttempt=observeCurrentInstaller(installMap);
 else {
  const pages=pagesNames.filter(n=>installMap.has(n)).map(n=>installMap.get(n));
  if(!pages.length||pages.filter(j=>j.conclusion==='success').length!==1||pages.some(j=>!['success','skipped'].includes(j.conclusion)))fail('Exactly one successful Pages deploy required');
  const allowedLegacy=new Set([...installerRequired,...pagesNames,...cooldowns,catalog]);
  for(const [name,j] of installMap)if(!allowedLegacy.has(name)||!['success','skipped'].includes(j.conclusion))fail('Unknown legacy Installer job '+name);
 }
 if(installer.first<source.first||installer.first<bot.first||installer.last<bot.last)fail('Impossible installer order');
 return Object.freeze({schema:current?'mid.readonly-release-chain-result.v2':'mid.readonly-release-chain-result.v1',...(current?{pagesAttempt,jobProfile:'mid-527',sourceJobCount:sourceMap.size,botJobCount:e.botJobCount,installerJobCount:installMap.size}:{}),version:e.version,prNumber:pr.number,sourceHeadSha:pr.headSha,packageSha:packageCommit.sha,stableSha:mainSha,sourceSeconds:Math.round((source.last-source.first)/1000),botSeconds:Math.round((bot.last-bot.first)/1000),installerSeconds:Math.round((installer.last-installer.first)/1000),sourceToInstallerEndSeconds:Math.round((installer.last-source.first)/1000),releaseAuthorized:false,reuseAuthorized:false,signatureVerified:false,interpretation:'Descriptive read-only job and SHA lineage. Independently validated signature, A/B artifact parity and release authorization NOT provided.'});
}
