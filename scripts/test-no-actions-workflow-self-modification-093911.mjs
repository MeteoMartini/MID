import {mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareReleaseRepository} from './prepare-release-repository.mjs';
import {syncGithubConfiguration} from './sync-github-workflows.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const failures=[];
const prepareSource=await readFile(path.join(root,'scripts','prepare-release-repository.mjs'),'utf8');
const canonicalWorkflow=await readFile(path.join(root,'ci','github','workflows','install-mid.yml'),'utf8');
const patchWorkflow=await readFile(path.join(root,'workflow-patches','install-mid.yml'),'utf8');

if(/syncGithubConfiguration/.test(prepareSource))failures.push('prepare-release-repository.mjs darf die GitHub-Konfiguration nicht automatisch synchronisieren.');
if(!/sync:github-workflows/.test(await readFile(path.join(root,'package.json'),'utf8')))failures.push('Expliziter Workflow-Synchronisationsbefehl fehlt.');
for(const [label,workflow] of [['ci/github',canonicalWorkflow],['workflow-patches',patchWorkflow]]){
 if(!workflow.includes("git add -A -- . ':(exclude).github/**'"))failures.push(`${label}: automatischer Release-Commit schließt .github nicht explizit aus.`);
 if(!workflow.includes('git reset -- .github'))failures.push(`${label}: eventuell vorgemerkte .github-Änderungen werden vor dem Commit nicht aus dem Index entfernt.`);
}

const temp=await mkdtemp(path.join(tmpdir(),'mid-no-workflow-selfmod-'));
try{
 await mkdir(path.join(temp,'.github','workflows'),{recursive:true});
 await mkdir(path.join(temp,'ci','github','workflows'),{recursive:true});
 await writeFile(path.join(temp,'.github','workflows','dependency-audit.yml'),'name: aktiv-und-unveraendert\n');
 await writeFile(path.join(temp,'ci','github','workflows','dependency-audit.yml'),'name: kanonisch-neu\n');
 await writeFile(path.join(temp,'ci','github','workflows','install-mid.yml'),'name: install\n');
 await writeFile(path.join(temp,'ci','github','workflows','deploy.yml'),'name: deploy\n');
 for(const name of ['mid-ruc-preprocess.yml','mid-ruc-schedule-watchdog.yml','mid-ruc-cloudflare-bootstrap.yml']){
  await writeFile(path.join(temp,'ci','github','workflows',name),await readFile(path.join(root,'ci','github','workflows',name),'utf8'));
 }
 await writeFile(path.join(temp,'ci','github','dependabot.yml'),'version: 2\n');

 let cleanupCalls=0;
 await prepareReleaseRepository({
  root:temp,
  githubActions:true,
  runGitCleanup:(receivedRoot)=>{
   cleanupCalls++;
   if(receivedRoot!==temp)failures.push('Repository-Hygiene erhielt nicht den isolierten Test-Root.');
   return {status:0};
  }
 });
 if(cleanupCalls!==1)failures.push(`Repository-Hygiene wurde ${cleanupCalls} statt einmal ausgeführt.`);
 const afterPrepare=await readFile(path.join(temp,'.github','workflows','dependency-audit.yml'),'utf8');
 if(afterPrepare!=='name: aktiv-und-unveraendert\n')failures.push('Automatisches Release-Prebuild hat .github/workflows verändert.');

 // Die explizite Admin-/Maintainer-Aktion muss weiterhin funktionieren.
 const updated=await syncGithubConfiguration({root:temp});
 if(!updated.includes('workflows/dependency-audit.yml'))failures.push('Explizite Workflow-Synchronisierung aktualisiert dependency-audit.yml nicht mehr.');
 const afterExplicit=await readFile(path.join(temp,'.github','workflows','dependency-audit.yml'),'utf8');
 if(afterExplicit!=='name: kanonisch-neu\n')failures.push('Explizite Workflow-Synchronisierung hat die kanonische Datei nicht übernommen.');
}finally{
 await rm(temp,{recursive:true,force:true});
}

if(failures.length){
 console.error('Actions-Workflow-Selbstmodifikationsschutz fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Actions-Workflow-Selbstmodifikationsschutz geprüft: Prebuild ändert .github nicht; explizite Synchronisierung bleibt verfügbar; Release-Commit schließt .github aus.');
