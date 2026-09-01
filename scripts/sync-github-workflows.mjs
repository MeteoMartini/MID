import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const modulePath=fileURLToPath(import.meta.url);
const defaultRoot=path.resolve(path.dirname(modulePath),'..');

const CHECKOUT_V7_SHA='3d3c42e5aac5ba805825da76410c181273ba90b1';
const SETUP_NODE_V7_SHA='820762786026740c76f36085b0efc47a31fe5020';
const UPLOAD_ARTIFACT_V7_SHA='043fb46d1a93c77aae656e7c1c64a875d1fc6a0a';
const SETUP_PYTHON_V7_SHA='5fda3b95a4ea91299a34e894583c3862153e4b97';
const CODEQL_V4_SHA='cdf488f595d80d6e07e03d4674febd5ab45fa938';
function pinApprovedActions(source){
 return source
  .replace(/actions\/checkout@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/checkout@${CHECKOUT_V7_SHA} # v7.0.1`)
  .replace(/actions\/setup-node@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/setup-node@${SETUP_NODE_V7_SHA} # v7.0.0`)
  .replace(/actions\/upload-artifact@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/upload-artifact@${UPLOAD_ARTIFACT_V7_SHA} # v7.0.1`)
  .replace(/actions\/setup-python@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/setup-python@${SETUP_PYTHON_V7_SHA} # v7.0.0`)
  .replace(/github\/codeql-action\/(init|analyze)@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,(_match,action)=>`github/codeql-action/${action}@${CODEQL_V4_SHA} # v4.37.9`);
}

const managedFiles=[
 ['workflows/install-mid.yml','workflows/install-mid.yml'],
 ['workflows/deploy.yml','workflows/deploy.yml'],
 ['workflows/dependency-audit.yml','workflows/dependency-audit.yml'],
 ['workflows/mid-ruc-preprocess.yml','workflows/mid-ruc-preprocess.yml'],
 ['workflows/mid-ruc-schedule-watchdog.yml','workflows/mid-ruc-schedule-watchdog.yml'],
 ['workflows/mid-ruc-cloudflare-bootstrap.yml','workflows/mid-ruc-cloudflare-bootstrap.yml'],
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
  const source=pinApprovedActions(await readFile(sourcePath,'utf8'));
  validateWorkflow(sourceRelative,source);
  let current='';
  try{current=await readFile(targetPath,'utf8')}catch{}
  if(current===source)continue;
  await mkdir(path.dirname(targetPath),{recursive:true});
  await writeFile(targetPath,source);
  updated.push(targetRelative);
 }
 // Die zwei historischen, nicht kanonisch gespiegelten Workflows (u. a.
 // apply-private-analytics und mid-code-revision) bleiben inhaltlich unverändert.
 // Beim ausdrücklich administrativ gestarteten Sync werden dort ausschließlich
 // die freigegebenen checkout/setup-node/setup-python-Action-Refs sowie CodeQL init/analyze
 // auf die kanonischen SHA-Pins angehoben.
 const workflowsRoot=path.join(githubRoot,'workflows');
 let workflowNames=[];
 try{workflowNames=(await readdir(workflowsRoot)).filter(name=>/\.ya?ml$/i.test(name))}catch{}
 for(const name of workflowNames){
  const targetRelative=path.join('workflows',name),targetPath=path.join(githubRoot,targetRelative);
  const current=await readFile(targetPath,'utf8'),next=pinApprovedActions(current);
  validateWorkflow(targetRelative,next);
  if(current===next)continue;
  await writeFile(targetPath,next);
  if(!updated.includes(targetRelative))updated.push(targetRelative);
 }
 return updated;
}

if(process.argv[1]&&path.resolve(process.argv[1])===modulePath){
 const updated=await syncGithubConfiguration();
 console.log(updated.length?`MID-GitHub-Konfiguration aktualisiert: ${updated.join(', ')}`:'MID-GitHub-Konfiguration ist bereits aktuell.');
}
