import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {existsSync,mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const agents=readFileSync(new URL('../AGENTS.md',import.meta.url),'utf8');
const contract=readFileSync(new URL('../MID_CHATGPT_GITHUB_CONTRACT.md',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../ci/github/workflows/chatgpt-pr-gate.yml',import.meta.url),'utf8');
const sync=readFileSync(new URL('./sync-github-workflows.mjs',import.meta.url),'utf8');

for(const token of ['mid-stable','chatgpt/v<version>-<topic>','codex/v<version>-<topic>','MID-professional-replacement.zip','install-mid.yml'])assert.ok(agents.includes(token),`AGENTS.md muss ${token} absichern.`);
assert.ok(contract.includes('Never write directly to `main` or `mid-stable`'),'Contract muss direkte Main-/Stable-Schreibzugriffe ausschließen.');
assert.ok(contract.includes('source pull request against `main`'),'Contract muss den Source-PR-Weg festschreiben.');
assert.ok(contract.includes('Do **not** commit or transport `MID-professional-replacement.zip`'),'Contract muss ZIP-im-PR im normalen Agentweg verbieten.');
assert.ok(contract.includes('server-side from the merged `main` source'),'Contract muss das Release-ZIP serverseitig nach dem Merge erzeugen.');
assert.ok(contract.includes('MID ChatGPT/Codex Source-PR Gate'),'Contract muss das aktuelle Source-PR-Gate benennen.');
assert.ok(!contract.includes('Open a pull request to `main` containing the release ZIP'),'Veralteter ZIP-im-PR-Vertrag darf nicht fortbestehen.');
assert.ok(!contract.includes('Build the canonical unversioned `MID-professional-replacement.zip`'),'Agent darf das Release-ZIP nicht vor dem Source-PR bauen müssen.');
assert.ok(workflow.includes('permissions:\n  contents: read'),'PR-Gate muss global read-only bleiben.');
assert.ok(workflow.includes("startsWith(github.head_ref, 'chatgpt/')")&&workflow.includes("startsWith(github.head_ref, 'codex/')"),'PR-Gate muss auf Agent-Branches begrenzt sein.');
for(const token of ['source_core:','core_regressions:','heavy_regressions:','validate_source:','MID_REGRESSION_SHARD: ${{ matrix.shard }}','CORE_MATRIX_RESULT: ${{ needs.core_regressions.result }}','heavy-native-map','heavy-unified-map','heavy-mountain-visual','needs.source_core.result','needs.heavy_regressions.result'])assert.ok(workflow.includes(token),'PR-Gate muss den vollständigen geshardeten MID-Verifikationspfad enthalten: '+token);
assert.ok(workflow.includes('      - core_regressions')&&workflow.includes('      - heavy_regressions')&&!workflow.includes('MID_REGRESSION_SHARD=core npm run test:regressions'),'Source-Gate muss alle disjunkten Core-Tests vor dem Release zwingend freigeben.');
assert.ok(workflow.includes('fetch-depth: 1'),'PR-Gate muss ohne unnötige Vollhistorie prüfen.');
assert.ok(workflow.includes('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1'),'Checkout muss auf vollständige SHA gepinnt sein.');
assert.ok(workflow.includes('actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1'),'Setup-Node muss auf vollständige SHA gepinnt sein.');
assert.ok(sync.includes("['workflows/chatgpt-pr-gate.yml','workflows/chatgpt-pr-gate.yml']"),'Workflow muss Teil der kanonischen GitHub-Synchronisierung sein.');

const guardStart=workflow.indexOf('      - name: MID-Quellstruktur und PR-ZIP-Provenienz prüfen');
const guardRun=workflow.indexOf('        run: |',guardStart);
const guardEnd=workflow.indexOf('\n      - name:',guardRun);
assert.ok(guardStart>0&&guardRun>guardStart&&guardEnd>guardRun,'SHA-gebundene Source-ZIP-Provenienzprüfung muss in der Release-CI existieren.');
const zipGuard=workflow.slice(guardRun+'        run: |'.length,guardEnd).trimEnd().split('\n').map(line=>line.replace(/^          /,'')).join('\n').trimStart();
for(const token of ["git rev-parse 'HEAD^2'","HEAD^2:MID-professional-replacement.zip","HEAD^1:MID-professional-replacement.zip","git diff --quiet 'HEAD^1' HEAD","rm -f -- MID-professional-replacement.zip"])
 assert.ok(zipGuard.includes(token),'Verbindliche sichere ZIP-Herkunftsprüfung fehlt: '+token);
function zipFixture({baseZip=false,headZip=false,tamperMerge=false}={}){
 const dir=mkdtempSync(join(tmpdir(),'mid-pr-source-zip-'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
 git('init','-q','-b','stable');git('config','user.name','MID Contract Test');git('config','user.email','mid-contract@example.invalid');
 for(const p of ['src','worker','public','ios'])mkdirSync(join(dir,p));
 for(const p of ['package.json','package-lock.json','MID_BASELINE.json','MID_SOURCE_OF_TRUTH.md'])writeFileSync(join(dir,p),'{}\n');
 git('add','.');git('commit','-qm','stable');
 git('switch','-q','-c','main');
 if(baseZip){writeFileSync(join(dir,'MID-professional-replacement.zip'),'trusted-base-archive');git('add','.');git('commit','-qm','base release archive');}
 git('switch','-q','-c','chatgpt/recovery','stable');
 writeFileSync(join(dir,'package.json'),'{ "version": "recovery" }\n');
 if(headZip)writeFileSync(join(dir,'MID-professional-replacement.zip'),'agent-contributed-archive');
 git('add','.');git('commit','-qm','agent source');const head=git('rev-parse','HEAD');
 git('switch','-q','main');git('merge','-q','--no-ff','-m','synthetic source merge','chatgpt/recovery');
 if(tamperMerge){writeFileSync(join(dir,'MID-professional-replacement.zip'),'modified-merge-archive');git('add','MID-professional-replacement.zip');git('commit','-q','--amend','--no-edit');}
 return{dir,head};
}
for(const scenario of [
 {name:'no ZIP at either side',baseZip:false,headZip:false,success:true},
 {name:'old main-only ZIP',baseZip:true,headZip:false,success:true},
 {name:'agent ZIP forbidden',baseZip:false,headZip:true,success:false},
 {name:'modified synthetic merge ZIP forbidden',baseZip:true,headZip:false,tamperMerge:true,success:false},
 {name:'wrong PR SHA forbidden',baseZip:true,headZip:false,wrongSha:true,success:false}
]){
 const fixture=zipFixture(scenario);
 try{
  const run=spawnSync('bash',['-c',zipGuard],{cwd:fixture.dir,encoding:'utf8',env:{...process.env,EXPECTED_PR_HEAD_SHA:scenario.wrongSha?'0000000000000000000000000000000000000000':fixture.head}});
  assert.equal(run.status===0,scenario.success,`${scenario.name}: PR-ZIP-Gate ${run.status}, stderr=${run.stderr}, stdout=${run.stdout}`);
  if(scenario.success)assert.equal(existsSync(join(fixture.dir,'MID-professional-replacement.zip')),false,`${scenario.name}: keine ZIP-Datei darf im CI-Testarbeitsbaum bleiben`);
 }finally{rmSync(fixture.dir,{recursive:true,force:true,maxRetries:5,retryDelay:30});}
}

console.log('MID ChatGPT/Codex GitHub-Schreibvertrag: OK');
