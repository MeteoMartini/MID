import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const modulePath=fileURLToPath(import.meta.url);
const defaultRoot=path.resolve(path.dirname(modulePath),'..');

const CHECKOUT_V7_SHA='3d3c42e5aac5ba805825da76410c181273ba90b1';
const SETUP_NODE_V7_SHA='949feb2413d6458794dcd2491c4babbbce0c15c1';
const UPLOAD_ARTIFACT_V7_SHA='cf430e030ddbb5b0abf93d22962f4752f3646cd9';
const DOWNLOAD_ARTIFACT_V8_SHA='3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c';
const SETUP_PYTHON_V7_SHA='5fda3b95a4ea91299a34e894583c3862153e4b97';
const CODEQL_V4_SHA='2892aa5e19bbd11bc0cff5427e3b750a04d9e3c2';
const DEPLOY_PAGES_V5_SHA='368f82528645a54fb793d4d04e342629a3f51346';
function pinApprovedActions(source){
 return source
  .replace(/actions\/checkout@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/checkout@${CHECKOUT_V7_SHA} # v7.0.1`)
  .replace(/actions\/setup-node@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/setup-node@${SETUP_NODE_V7_SHA} # v7.1.0`)
  .replace(/actions\/upload-artifact@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/upload-artifact@${UPLOAD_ARTIFACT_V7_SHA} # v7.0.2`)
  .replace(/actions\/download-artifact@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/download-artifact@${DOWNLOAD_ARTIFACT_V8_SHA} # v8.0.1`)
  .replace(/actions\/setup-python@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/setup-python@${SETUP_PYTHON_V7_SHA} # v7.0.0`)
  .replace(/github\/codeql-action\/(init|analyze)@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,(_match,action)=>`github/codeql-action/${action}@${CODEQL_V4_SHA} # v4.38.2`)
  .replace(/actions\/deploy-pages@[^\s#]+(?:\s*#\s*v[^\n]*)?/g,`actions/deploy-pages@${DEPLOY_PAGES_V5_SHA} # v5.0.1`);
}


export const managedFiles=[
 ['workflows/mid-d2-native-eight-field-qa.yml','workflows/mid-d2-native-eight-field-qa.yml'],
 ['workflows/mid-d2-native-original-audit.yml','workflows/mid-d2-native-original-audit.yml'],
 ['workflows/mid-d2-ruc-three-run-qa.yml','workflows/mid-d2-ruc-three-run-qa.yml'],
 ['workflows/mid-d2-ruc-full-admission-qa.yml','workflows/mid-d2-ruc-full-admission-qa.yml'],
 ['workflows/mid-d2-ruc-archive-qa.yml','workflows/mid-d2-ruc-archive-qa.yml'],
 ['workflows/build-parity-qualification.yml','workflows/build-parity-qualification.yml'],
 ['workflows/mid-ecmwf-ifs-0p1-readonly.yml','workflows/mid-ecmwf-ifs-0p1-readonly.yml'],
 ['workflows/install-mid.yml','workflows/install-mid.yml'],
 ['workflows/release-timing-audit.yml','workflows/release-timing-audit.yml'],
 ['workflows/release-train-preflight.yml','workflows/release-train-preflight.yml'],
 ['workflows/chatgpt-pr-gate.yml','workflows/chatgpt-pr-gate.yml'],
 ['workflows/replit-handoff-gate.yml','workflows/replit-handoff-gate.yml'],
 ['workflows/agent-source-release.yml','workflows/agent-source-release.yml'],
 ['workflows/release-self-heal.yml','workflows/release-self-heal.yml'],
 ['workflows/deploy.yml','workflows/deploy.yml'],
 ['workflows/dependency-audit.yml','workflows/dependency-audit.yml'],
 ['workflows/mid-code-revision.yml','workflows/mid-code-revision.yml'],
 ['workflows/branch-cleanup.yml','workflows/branch-cleanup.yml'],
 ['workflows/unit-coverage.yml','workflows/unit-coverage.yml'],
 ['workflows/widget-export.yml','workflows/widget-export.yml'],
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
 // Nicht kanonisch gespiegelte Zusatzworkflows erhalten beim ausdrücklich
 // administrativ gestarteten Sync weiterhin nur eng begrenzte Wartung.
 // mid-code-revision behält seine manuellen Recovery-Funktionen, der historische
 // v0.9.19.0-Installer wird aber nicht mehr auf jedem normalen main-Push gestartet.
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
 // Existing legacy transport copies are mirrors, never independent sources.
 for(const name of ['install-mid.yml','deploy.yml']){
  const targetPath=path.join(root,'workflow-patches',name);
  let current;
  try{current=await readFile(targetPath,'utf8')}catch(error){if(error.code==='ENOENT')continue;throw error}
  const source=pinApprovedActions(await readFile(path.join(sourceRoot,'workflows',name),'utf8'));
  if(current===source)continue;
  await writeFile(targetPath,source);
  updated.push(`../workflow-patches/${name}`);
 }
 return updated;
}

if(process.argv[1]&&path.resolve(process.argv[1])===modulePath){
 const updated=await syncGithubConfiguration();
 console.log(updated.length?`MID-GitHub-Konfiguration aktualisiert: ${updated.join(', ')}`:'MID-GitHub-Konfiguration ist bereits aktuell.');
}
