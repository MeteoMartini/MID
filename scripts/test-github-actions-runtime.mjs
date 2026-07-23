import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workflowsDir=path.join(root,'.github','workflows');
const workflowNames=(await readdir(workflowsDir)).filter(name=>/\.ya?ml$/i.test(name));
const workflows=Object.fromEntries(await Promise.all(workflowNames.map(async name=>[name,await readFile(path.join(workflowsDir,name),'utf8')])));
const all=Object.values(workflows).join('\n');
const lock=JSON.parse(await readFile(path.join(root,'package-lock.json'),'utf8'));
const failures=[];

for(const [name,source] of Object.entries(workflows)){
  if(/actions\/(?:checkout|setup-node)@v[1-5]\b/.test(source))failures.push(`${name}: veraltete Checkout-/Setup-Node-Action gefunden`);
  if(/actions\/configure-pages@v[1-5]\b/.test(source))failures.push(`${name}: veraltete configure-pages-Action gefunden`);
  if(/actions\/upload-pages-artifact@v[1-4]\b/.test(source))failures.push(`${name}: veraltete upload-pages-artifact-Action gefunden`);
  if(/actions\/deploy-pages@v[1-4]\b/.test(source))failures.push(`${name}: veraltete deploy-pages-Action gefunden`);
  if(source.includes('rm -f package-lock.json'))failures.push(`${name}: package-lock.json wird weiterhin gelöscht`);
  if(source.includes('fetch-retry-maxtimeout 120000'))failures.push(`${name}: veraltete zweiminütige npm-Retry-Wartezeit gefunden`);
}

for(const required of [
  'actions/checkout@v6',
  'actions/setup-node@v6',
  'actions/configure-pages@v6',
  'actions/upload-pages-artifact@v5',
  'actions/deploy-pages@v5'
]){
  if(!all.includes(required))failures.push(`${required} fehlt`);
}

const install=workflows['install-mid.yml']||'';
const deploy=workflows['deploy.yml']||'';
for(const token of [
  'MID-professional-replacement.zip',
  'npm run verify',
  'git push origin HEAD:main',
  'actions/upload-pages-artifact@v5',
  'actions/deploy-pages@v5'
])if(!install.includes(token))failures.push(`install-mid.yml: ${token} fehlt`);
if(!deploy.includes('paths-ignore:')||!deploy.includes('MID-professional-replacement.zip'))failures.push('deploy.yml: reiner ZIP-Upload wird nicht vom vorzeitigen Parallel-Deployment ausgeschlossen');

for(const [name,entry] of Object.entries(lock.packages??{})){
  const resolved=entry&&typeof entry==='object'?entry.resolved:undefined;
  if(typeof resolved==='string'&&/internal\.api\.openai\.org|applied-caas-gateway|localhost|127\.0\.0\.1/i.test(resolved)){
    failures.push(`package-lock.json: nicht öffentliche Paketquelle bei ${name||'(root)'}`);
  }
}

if(failures.length){
  console.error('GitHub-Actions-/Release-Pipeline-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Release-Pipeline geprüft: öffentliche npm-URLs, direkte ZIP-Installation mit Pages-Deployment und aktuelle Node-24-kompatible Actions.');
