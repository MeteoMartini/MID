import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const modulePath=fileURLToPath(import.meta.url);
const defaultRoot=path.resolve(path.dirname(modulePath),'..');
const managedFiles=[
 ['workflows/install-mid.yml','workflows/install-mid.yml'],
 ['workflows/deploy.yml','workflows/deploy.yml'],
 ['workflows/dependency-audit.yml','workflows/dependency-audit.yml'],
 ['dependabot.yml','dependabot.yml']
];

function validateWorkflow(relative,source){
 if(!relative.startsWith('workflows/'))return;
 const uses=source.match(/^\s*uses:\s*[^\s#]+/gm)??[];
 for(const line of uses){
  const match=line.match(/@([^\s#]+)/);
  if(!match||!/[0-9a-f]{40}/i.test(match[1]))throw new Error(`${relative}: Action ist nicht auf einen vollständigen Commit-SHA festgeschrieben: ${line.trim()}`);
 }
}

export async function syncGithubConfiguration({root=defaultRoot,sourceRoot=path.join(root,'ci','github')}={}){
 const githubRoot=path.join(root,'.github');
 const updated=[];
 for(const [sourceRelative,targetRelative] of managedFiles){
  const sourcePath=path.join(sourceRoot,sourceRelative);
  const targetPath=path.join(githubRoot,targetRelative);
  const source=await readFile(sourcePath,'utf8');
  validateWorkflow(sourceRelative,source);
  let current='';
  try{current=await readFile(targetPath,'utf8')}catch{}
  if(current===source)continue;
  await mkdir(path.dirname(targetPath),{recursive:true});
  await writeFile(targetPath,source);
  updated.push(targetRelative);
 }
 return updated;
}

if(process.argv[1]&&path.resolve(process.argv[1])===modulePath){
 const updated=await syncGithubConfiguration();
 console.log(updated.length?`MID-GitHub-Konfiguration aktualisiert: ${updated.join(', ')}`:'MID-GitHub-Konfiguration ist bereits aktuell.');
}
