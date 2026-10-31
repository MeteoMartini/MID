// MID read-only cross-gate release observation. This is NOT a signing, reuse or deployment gate.
// Inputs MUST be fetched independently from GitHub; no release authorization can be inferred.
const SHA=/^[a-f0-9]{40}$/;
const sourceRequired=['Source-Kern vollständig prüfen',...[1,2,3,4].map(n=>'Core-Regression · core-'+n+'/4'),'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-native-map ·','Heavy-Regression · heavy-mountain-visual ·',...[1,2,3].map(n=>'Heavy-Regression · heavy-unified-map · '+n+'/3'),'Agent-Quellstand vollständig prüfen'];
const installerRequired=['Release-ZIP prüfen und immutable Snapshot vorbereiten','Release-Core, Build, Audit und iOS prüfen',...[1,2,3,4].map(n=>'Release-Core-Regression · core-'+n+'/4'),...[1,2,3].map(n=>'Release-Heavy · heavy-unified-map · '+n+'/3'),'Release-Heavy · heavy-mountain-visual ·','Release-Heavy · heavy-native-map ·','Release-Heavy · heavy-browser-state ·','Vollständig geprüften Release sammeln und committen','GitHub-Pages-Artefakt parallel vorbereiten','Geprüften MID-Worker sicher automatisch veröffentlichen','Erfolgreichen Pages-/Worker-Release finalisieren'];
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const fail=s=>{throw Error('MID read-only release chain rejected: '+s)};
const sha=(x,s)=>{if(typeof x!=='string'||!SHA.test(x))fail('Invalid '+s+' SHA');return x};
const stamp=(s,name)=>{if(typeof s!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s)||!Number.isFinite(Date.parse(s)))fail('Unknown '+name+' UTC time');return Date.parse(s)};
function checkRun(r,name,path,event,head){
 if(!isObj(r)||!positive(r.id)||r.name!==name||r.path!==path||r.event!==event||r.head_sha!==head||r.status!=='completed'||r.conclusion!=='success'||!positive(r.run_attempt))fail('Untrusted '+name+' workflow status/identity');
 const first=stamp(r.created_at,name),last=stamp(r.updated_at,name);
 if(last<first)fail('Negative duration '+name);
 return {first,last};
}
function requiredJobs(jobs,required,run,scope){
 if(!Array.isArray(jobs)||jobs.length<required.length)fail(scope+' inventory too short');
 const names=new Map(),ids=new Set();
 for(const j of jobs){
  if(!isObj(j)||!positive(j.id)||ids.has(j.id)||j.run_id!==run.id||j.run_attempt!==run.run_attempt||j.head_sha!==run.head_sha||typeof j.name!=='string'||names.has(j.name))fail(scope+' duplicate/foreign/mixed-attempt job');
  names.set(j.name,j);ids.add(j.id);
 }
 for(const name of required){
  const j=names.get(name);
  if(!j||j.status!=='completed'||j.conclusion!=='success')fail(scope+' required gate '+name);
 }
 return names;
}
export function inspectPublishedChain(e){
 if(!isObj(e)||e.schema!=='mid.readonly-release-chain.v1'||e.repository!=='MeteoMartini/MID'||!/^\d+\.\d+\.\d+\.\d+$/.test(e.version))fail('Unknown provenance/schema/version');
 const {pr,sourceRun,sourceJobs,botRun,mergeCommit,packageCommit,packageFiles,installerRun,installerJobs,stableCommit,mainSha,stableSha}=e;
 sha(mainSha,'main');sha(stableSha,'Stable');sha(stableCommit?.sha,'Stable commit');
 if(mainSha!==stableSha||stableCommit.sha!==mainSha)fail('main and Stable diverged');
 if(!isObj(pr)||!positive(pr.number)||pr.state!=='closed'||pr.merged!==true||pr.draft!==false||pr.base!=='main'||!/^(chatgpt|codex)\/v\d+\.\d+\.\d+\.\d+-[a-z0-9._-]+$/.test(pr.head)||sha(pr.headSha,'PR HEAD')!==sourceRun?.head_sha||sha(pr.baseSha,'PR base')!==botRun?.head_sha||sha(pr.mergeSha,'PR merge')!==mergeCommit?.sha)fail('PR merge/head policy');
 const source=checkRun(sourceRun,'MID-Agent-Quellstand prüfen','.github/workflows/chatgpt-pr-gate.yml','pull_request',pr.headSha);
 const sourceMap=requiredJobs(sourceJobs,sourceRequired,sourceRun,'Source');
 const allowed=new Set([...sourceRequired,'RUC +27h Kern, EPS und Gesamtpaket','Extremwetterpolygone · echte Browserpixel']);
 for(const [name,j] of sourceMap)if(!allowed.has(name)||!['success','skipped'].includes(j.conclusion))fail('Unknown Source job '+name);
 const bot=checkRun(botRun,'Geprüften Agent-PR automatisch veröffentlichen','.github/workflows/agent-source-release.yml','workflow_run',pr.baseSha);
 if(bot.first<source.first||bot.last<source.last)fail('Source/Bot impossible ordering');
 sha(mergeCommit?.sha,'merge commit');sha(packageCommit?.sha,'package commit');
 if(!Array.isArray(mergeCommit.parents)||mergeCommit.parents.length!==1||mergeCommit.parents[0]?.sha!==pr.baseSha)fail('Merged Source parent is not the verified PR base');
 if(!Array.isArray(packageCommit?.parents)||packageCommit.parents.length!==1||packageCommit.parents[0]?.sha!==mergeCommit.sha)fail('Package parent is not Source merge');
 if(!Array.isArray(packageFiles)||packageFiles.length!==1||packageFiles[0]?.filename!=='MID-professional-replacement.zip'||packageFiles[0]?.status!=='added')fail('Package not ZIP-only');
 if(!Array.isArray(stableCommit.parents)||stableCommit.parents.length!==1||stableCommit.parents[0]?.sha!==packageCommit.sha)fail('Stable parent not package');
 if(installerRun?.head_sha!==packageCommit.sha)fail('Installer did not use package SHA');
 const installer=checkRun(installerRun,'MID-Release aus ZIP installieren und veröffentlichen','.github/workflows/install-mid.yml','workflow_dispatch',packageCommit.sha);
 const installMap=requiredJobs(installerJobs,installerRequired,installerRun,'Installer');
 const pages=[...installMap].filter(([name])=>/^MID auf GitHub Pages veröffentlichen · Versuch [1-9]\d*$/.test(name));
 if(!pages.length||pages.filter(([,j])=>j.status==='completed'&&j.conclusion==='success').length!==1||pages.some(([,j])=>!['success','skipped'].includes(j.conclusion)))fail('Exactly one successful Pages deploy required');
 if(installer.first<source.first||installer.first<bot.first||installer.last<bot.last)fail('Impossible installer order');
 return Object.freeze({schema:'mid.readonly-release-chain-result.v1',version:e.version,prNumber:pr.number,sourceHeadSha:pr.headSha,packageSha:packageCommit.sha,stableSha:mainSha,sourceSeconds:Math.round((source.last-source.first)/1000),botSeconds:Math.round((bot.last-bot.first)/1000),installerSeconds:Math.round((installer.last-installer.first)/1000),sourceToInstallerEndSeconds:Math.round((installer.last-source.first)/1000),releaseAuthorized:false,reuseAuthorized:false,signatureVerified:false,interpretation:'Descriptive read-only job and SHA lineage. Independently validated signature, A/B artifact parity and release authorization NOT provided.'});
}
