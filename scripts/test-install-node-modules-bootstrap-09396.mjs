import {mkdtemp,mkdir,readFile,rm,writeFile,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const workflow=await readFile(path.join(root,'ci/github/workflows/install-mid.yml'),'utf8');
const gitignore=await readFile(path.join(root,'.gitignore'),'utf8');
const prepare=await readFile(path.join(root,'scripts/prepare-release-repository.mjs'),'utf8');

for(const token of ["rm -rf node_modules","--exclude='node_modules'"]){
 if(!workflow.includes(token))throw new Error(`Installer schützt node_modules nicht: ${token}`);
}
if(!/^node_modules\/$/m.test(gitignore))throw new Error('.gitignore schützt node_modules/ nicht.');
if(!prepare.includes("git',['rm','-r','-q','--cached','--ignore-unmatch','node_modules']"))throw new Error('CI-Vorbereitung entfernt versioniertes node_modules nicht aus dem Git-Index.');

// Reproduziert den v0.9.39.5-Fehler: Ziel enthält ein altes node_modules, Release nicht.
const temp=await mkdtemp(path.join(tmpdir(),'mid-09396-'));
const source=path.join(temp,'source');
const target=path.join(temp,'target');
await mkdir(source,{recursive:true});
await mkdir(path.join(target,'node_modules','legacy'),{recursive:true});
await writeFile(path.join(source,'package.json'),'{}\n');
await writeFile(path.join(target,'package.json'),'old\n');
await writeFile(path.join(target,'node_modules','legacy','tracked.txt'),'legacy\n');

await rm(path.join(target,'node_modules'),{recursive:true,force:true});
const rsync=spawnSync('rsync',['-a','--delete','--checksum',"--exclude=node_modules",source+'/',target+'/'],{encoding:'utf8'});
if(rsync.status!==0)throw new Error(`rsync-Simulation fehlgeschlagen: ${rsync.stderr}`);
const diff=spawnSync('diff',['-qr','--exclude=node_modules',source+'/',target+'/'],{encoding:'utf8'});
if(diff.status!==0)throw new Error(`Releasevergleich meldet weiterhin lokale node_modules-Artefakte: ${diff.stdout}${diff.stderr}`);
await rm(temp,{recursive:true,force:true});
console.log('v0.9.39.6 Installer-Bootstrap: node_modules-Altlast wird sicher ignoriert/entfernt.');
