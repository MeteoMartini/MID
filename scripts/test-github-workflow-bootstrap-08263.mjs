import {cp,mkdir,mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {managedFiles,syncGithubConfiguration} from './sync-github-workflows.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const baseline=JSON.parse(await readFile(path.join(root,'MID_BASELINE.json'),'utf8'));
const failures=[];
const prGate=await readFile(path.join(root,'ci/github/workflows/chatgpt-pr-gate.yml'),'utf8');
function sourceTimeBudgetValid(text){
 const from=text.indexOf('\n  source_core:'),to=text.indexOf('\n  core_regressions:');
 if(from<0||to<=from)return false;
 const core=text.slice(from,to),matrix=text.slice(to,text.indexOf('\n  heavy_regressions:',to));
 const outer=Number(core.match(/^    timeout-minutes: (\d+)/m)?.[1]);
 const stepLimit=name=>Number(core.slice(core.indexOf('- name: '+name)).split(/\n      - name:/)[0].match(/timeout-minutes: (\d+)/)?.[1]);
 const ruc=stepLimit('Drei native RUC-Läufe und Kartenaufnahme bis +27 h prüfen');
 const sourceBuild=stepLimit('Produktionsbuild und Runtime-Prüfungen durchführen');
 const coreTestStep=Number(matrix.slice(matrix.indexOf('- name: Disjunkten Core-Regressionsteil vollständig ausführen')).match(/timeout-minutes: (\d+)/)?.[1]);
 const shards=(matrix.match(/- shard: core-[1-4]\/4/g)||[]);
 return ruc===20&&sourceBuild===15&&outer>=ruc+sourceBuild+8&&outer<=45&&coreTestStep===13&&shards.length===4&&new Set(shards).size===4&&matrix.includes('fail-fast: false')&&!matrix.includes('continue-on-error');
}
if(!sourceTimeBudgetValid(prGate))failures.push('Source-Job muss beide unveränderten Einzelgrenzen plus Setup/iOS/Paketierung innerhalb eines festen 45-Minuten-Rahmens ermöglichen.');
if(sourceTimeBudgetValid(prGate.replace('    timeout-minutes: 45','    timeout-minutes: 30')))failures.push('Der reproduzierte 30-Minuten-Abbruch darf nicht erneut als gültiges Zeitbudget gelten.');
if(sourceTimeBudgetValid(prGate.replace('        timeout-minutes: 20','        timeout-minutes: 21')))failures.push('RUC-Einzelgrenze darf nicht stillschweigend verlängert werden.');
if(sourceTimeBudgetValid(prGate.replace('      - name: Produktionsbuild und Runtime-Prüfungen durchführen\n        shell: bash\n        timeout-minutes: 15','      - name: Produktionsbuild und Runtime-Prüfungen durchführen\n        shell: bash\n        timeout-minutes: 16')))failures.push('Source-Build-Einzelgrenze darf nicht erhöht werden.');
if(sourceTimeBudgetValid(prGate.replace('      - name: Disjunkten Core-Regressionsteil vollständig ausführen\n        shell: bash\n        timeout-minutes: 13','      - name: Disjunkten Core-Regressionsteil vollständig ausführen\n        shell: bash\n        timeout-minutes: 14')))failures.push('Core-Matrix-Einzelgrenze darf nicht erhöht werden.');
if(sourceTimeBudgetValid(prGate.replace('          - shard: core-4/4\n            map_group: \'\'\n','')))failures.push('Ein fehlender Core-Matrixjob darf nicht durch den Rest freigegeben werden.');
if('preverify' in (pkg.scripts??{}))failures.push('Der reguläre Installationslauf darf aktive Workflowdateien nicht automatisch verändern.');
if(pkg.scripts?.['sync:github-workflows']!=='node scripts/sync-github-workflows.mjs')failures.push('Explizites Synchronisationsskript fehlt in package.json.');
if(!baseline.regressionTests?.includes('scripts/test-github-workflow-bootstrap-08263.mjs'))failures.push('Workflow-Paket-Regression fehlt in MID_BASELINE.json.');

const managed=managedFiles.map(([sourceRelative])=>sourceRelative);
for(const relative of managed)await readFile(path.join(root,'ci','github',relative),'utf8');
const sourceRelease=await readFile(path.join(root,'ci','github','workflows','agent-source-release.yml'),'utf8');
for(const token of [
  '-f state=all',
  '.state == "open" or .merged_at != null',
  'already_merged=true',
  "steps.pr.outputs.already_merged != 'true'",
  'steps.merge.outputs.merge_sha || steps.pr.outputs.merge_sha'
])if(!sourceRelease.includes(token))failures.push(`Agent-Release-Recovery für bereits geschützte Merges fehlt: ${token}`);

// Every existing job that runs the full inventory also runs Python-backed RUC
// tests. Check each job, not just the first setup occurrence in a workflow.
for(const name of await readdir(path.join(root,'.github','workflows'))){
 if(!/\.ya?ml$/.test(name))continue;
 const text=await readFile(path.join(root,'.github','workflows',name),'utf8'),jobs=[...text.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gm)];
 for(let i=0;i<jobs.length;i++){
  const body=text.slice(jobs[i].index,jobs[i+1]?.index??text.length);
  const command=/^\s*(?:run:\s*)?(?:MID_REGRESSION_SHARD=core\s+)?npm run (?:verify|test:regressions)\b/m.exec(body);
  if(!command)continue;
  if(/MID_REGRESSION_SHARD:\s*\$\{\{ matrix\.shard \}\}/.test(body)&&body.includes('heavy-'))continue;
  const setup=body.indexOf('uses: actions/setup-python@'),deps=body.indexOf('python -m pip install --disable-pip-version-check -r tools/ruc/requirements-pages.txt');
  if(setup<0||deps<setup||command.index<deps)failures.push(`RUC-Python-Testumgebung fehlt vor vollständigem Core-Gate: ${name}/${jobs[i][1]}`);
 }
}

const temp=await mkdtemp(path.join(tmpdir(),'mid-workflow-package-'));
try{
 await cp(path.join(root,'ci'),path.join(temp,'ci'),{recursive:true});
 await mkdir(path.join(temp,'.github','workflows'),{recursive:true});
 await writeFile(path.join(temp,'.github','workflows','install-mid.yml'),'name: veraltet\n');
 await writeFile(path.join(temp,'.github','workflows','custom.yml'),'name: benutzerdefiniert\n');
 await mkdir(path.join(temp,'workflow-patches'),{recursive:true});
 for(const name of ['install-mid.yml','deploy.yml'])await writeFile(path.join(temp,'workflow-patches',name),'name: veralteter Transport\n');
 const first=await syncGithubConfiguration({root:temp});
 if(first.length!==managed.length+2)failures.push(`Explizite Synchronisierung aktualisierte ${first.length} statt ${managed.length+2} verwalteter Dateien/Transportspiegel.`);
 for(const relative of managed){
  const canonical=await readFile(path.join(temp,'ci','github',relative),'utf8');
  const installed=await readFile(path.join(temp,'.github',relative),'utf8');
  if(canonical!==installed)failures.push(`Explizite Synchronisierung hat ${relative} nicht korrekt übernommen.`);
 }
 const custom=await readFile(path.join(temp,'.github','workflows','custom.yml'),'utf8').catch(()=>null);
 if(custom!=='name: benutzerdefiniert\n')failures.push('Explizite Synchronisierung hat einen nicht von MID verwalteten Workflow verändert oder entfernt.');
 for(const name of ['install-mid.yml','deploy.yml']){
  const canonical=await readFile(path.join(temp,'ci','github','workflows',name),'utf8');
  const transport=await readFile(path.join(temp,'workflow-patches',name),'utf8');
  if(canonical!==transport)failures.push(`Transportspiegel ${name} nicht synchronisiert.`);
 }
 const second=await syncGithubConfiguration({root:temp});
 if(second.length!==0)failures.push('Explizite Synchronisierung ist nicht idempotent.');
}finally{await rm(temp,{recursive:true,force:true})}

if(failures.length){console.error('GitHub-Workflow-Paket-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kanonisches GitHub-Workflow-Paket geprüft: Alt-Installer-kompatibel, explizit synchronisierbar, idempotent und ohne Veränderung fremder Workflows.');
