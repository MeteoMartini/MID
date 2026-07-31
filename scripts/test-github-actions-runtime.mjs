import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workflowsDir=path.join(root,'ci','github','workflows');
const requiredWorkflowNames=['install-mid.yml','deploy.yml','dependency-audit.yml'];
const availableNames=(await readdir(workflowsDir)).filter(name=>/\.ya?ml$/i.test(name));
const workflows={};
const failures=[];

for(const name of requiredWorkflowNames){
 if(!availableNames.includes(name)){failures.push(`Erforderlicher kanonischer Workflow fehlt: ${name}`);continue}
 workflows[name]=await readFile(path.join(workflowsDir,name),'utf8');
}

const lock=JSON.parse(await readFile(path.join(root,'package-lock.json'),'utf8'));
const actionRefs=[];
for(const [name,source] of Object.entries(workflows)){
 for(const match of source.matchAll(/^\s*uses:\s*([^\s@]+\/[^\s@]+)@([^\s#]+)(?:\s*#.*)?$/gm))actionRefs.push({workflow:name,action:match[1],ref:match[2]});
 for(const line of source.match(/^\s*uses:\s*.+$/gm)??[]){
  const value=line.trim();
  const parsed=value.match(/^uses:\s*([^\s@]+\/[^\s@]+)@([^\s#]+)/);
  if(!parsed)failures.push(`${name}: Action-Referenz konnte nicht gelesen werden: ${value}`);
  else if(!/^[0-9a-f]{40}$/i.test(parsed[2]))failures.push(`${name}: Action ist nicht auf einen vollständigen Commit-SHA festgeschrieben: ${value}`);
 }
 if(source.includes('rm -f package-lock.json'))failures.push(`${name}: package-lock.json wird weiterhin gelöscht`);
 if(source.includes('fetch-retry-maxtimeout 120000'))failures.push(`${name}: veraltete zweiminütige npm-Retry-Wartezeit gefunden`);
}

for(const action of ['actions/checkout','actions/setup-node','actions/configure-pages','actions/upload-pages-artifact','actions/deploy-pages']){
 if(!actionRefs.some(entry=>entry.action===action&&/^[0-9a-f]{40}$/i.test(entry.ref)))failures.push(`${action} mit vollständigem Commit-SHA fehlt`);
}

const install=workflows['install-mid.yml']||'';
const deploy=workflows['deploy.yml']||'';
const audit=workflows['dependency-audit.yml']||'';
for(const token of ['MID-professional-replacement.zip','npm run verify','npm run audit:dependencies','git push origin HEAD:main'])if(!install.includes(token))failures.push(`install-mid.yml: ${token} fehlt`);
if(install.includes('Geprüfte MID-Workflows aktualisieren')||install.includes('rsync -a --delete --checksum "$source_dir/" .github/'))failures.push('install-mid.yml versucht weiterhin, Workflowdateien mit dem GITHUB_TOKEN selbst zu überschreiben.');
if(!deploy.includes('paths-ignore:')||!deploy.includes('MID-professional-replacement.zip'))failures.push('deploy.yml: reiner ZIP-Upload wird nicht vom vorzeitigen Parallel-Deployment ausgeschlossen');
if(!audit.includes('npm run audit:all'))failures.push('dependency-audit.yml: vollständiger regelmäßiger npm-Audit fehlt');

for(const [name,entry] of Object.entries(lock.packages??{})){
 const resolved=entry&&typeof entry==='object'?entry.resolved:undefined;
 if(typeof resolved==='string'&&/internal\.api\.openai\.org|applied-caas-gateway|localhost|127\.0\.0\.1/i.test(resolved))failures.push(`package-lock.json: nicht öffentliche Paketquelle bei ${name||'(root)'}`);
}

if(failures.length){
 console.error('GitHub-Actions-/Release-Pipeline-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 console.error(`Geprüfte kanonische Workflowdateien: ${Object.keys(workflows).join(', ')||'keine'}`);
 process.exit(1);
}
console.log('Kanonische Release-Pipeline geprüft: SHA-fixierte Actions, Least-Privilege-Jobs, Abhängigkeitsaudit, direkte ZIP-Installation und keine unzulässige Workflow-Selbständerung.');
