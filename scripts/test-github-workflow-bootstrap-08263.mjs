import {cp,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncGithubConfiguration} from './sync-github-workflows.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(await readFile(path.join(root,'MID_BASELINE.json'),'utf8'));
const failures=[];
if('preverify' in (pkg.scripts??{}))failures.push('Der reguläre Installationslauf darf aktive Workflowdateien nicht automatisch verändern.');
if(pkg.scripts?.['sync:github-workflows']!=='node scripts/sync-github-workflows.mjs')failures.push('Explizites Synchronisationsskript fehlt in package.json.');
if(!baseline.regressionTests?.includes('scripts/test-github-workflow-bootstrap-08263.mjs'))failures.push('Workflow-Paket-Regression fehlt in MID_BASELINE.json.');

const managed=['workflows/install-mid.yml','workflows/deploy.yml','workflows/dependency-audit.yml','dependabot.yml'];
for(const relative of managed)await readFile(path.join(root,'ci','github',relative),'utf8');

const temp=await mkdtemp(path.join(tmpdir(),'mid-workflow-package-'));
try{
 await cp(path.join(root,'ci'),path.join(temp,'ci'),{recursive:true});
 await mkdir(path.join(temp,'.github','workflows'),{recursive:true});
 await writeFile(path.join(temp,'.github','workflows','install-mid.yml'),'name: veraltet\n');
 await writeFile(path.join(temp,'.github','workflows','custom.yml'),'name: benutzerdefiniert\n');
 const first=await syncGithubConfiguration({root:temp});
 if(first.length!==managed.length)failures.push(`Explizite Synchronisierung aktualisierte ${first.length} statt ${managed.length} verwalteter Dateien.`);
 for(const relative of managed){
  const canonical=await readFile(path.join(temp,'ci','github',relative),'utf8');
  const installed=await readFile(path.join(temp,'.github',relative),'utf8');
  if(canonical!==installed)failures.push(`Explizite Synchronisierung hat ${relative} nicht korrekt übernommen.`);
 }
 const custom=await readFile(path.join(temp,'.github','workflows','custom.yml'),'utf8').catch(()=>null);
 if(custom!=='name: benutzerdefiniert\n')failures.push('Explizite Synchronisierung hat einen nicht von MID verwalteten Workflow verändert oder entfernt.');
 const second=await syncGithubConfiguration({root:temp});
 if(second.length!==0)failures.push('Explizite Synchronisierung ist nicht idempotent.');
}finally{await rm(temp,{recursive:true,force:true})}

if(failures.length){console.error('GitHub-Workflow-Paket-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kanonisches GitHub-Workflow-Paket geprüft: Alt-Installer-kompatibel, explizit synchronisierbar, idempotent und ohne Veränderung fremder Workflows.');
