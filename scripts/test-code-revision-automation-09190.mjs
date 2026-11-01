import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=file=>readFile(new URL(file,root),'utf8');
const requiredFiles=['CODE_REVISION_README.md','MID_DEPENDABOT_TEMPLATE.yml','playwright.config.mjs','tests/smoke/mid-production.spec.mjs','lighthouserc.cjs','MID_PERFORMANCE_BASELINE.json','scripts/check-deployed-mid.mjs','scripts/check-api-contracts.mjs','scripts/check-build-budget.mjs','scripts/create-revision-report.mjs','tools/release/create_professional_zip.py'];
const failures=[];
for(const file of requiredFiles){try{await read(file)}catch{failures.push(`Pflichtdatei fehlt: ${file}`)}}

let workflow=null;
try{workflow=await read('.github/workflows/mid-code-revision.yml')}catch(error){if(error?.code!=='ENOENT')throw error}
if(workflow){
 for(const token of ['MID CI verify',"cron: '17 3 * * *'","cron: '23 */6 * * *'","cron: '23 2 * * 0'","cron: '41 1 * * 3'",'scripts/check-deployed-mid.mjs','scripts/check-api-contracts.mjs','scripts/check-build-budget.mjs','playwright test','lhci autorun','github/codeql-action/init@','gh issue create','npm install --no-save --no-package-lock',])if(!workflow.includes(token))failures.push(`Workflow-Vertrag fehlt: ${token}`);
 const canonicalRevision=await read('ci/github/workflows/mid-code-revision.yml');
 assert.equal(workflow,canonicalRevision,'Aktiver und kanonischer Revisionsworkflow müssen byteidentisch bleiben');
 for(const token of ['# SHA-bound read-only revision matrix; production installation is exclusively install-mid.yml.','name: Exakten Revisions-SHA binden','name: Main/Stable-Drift und Event-SHA fail-closed prüfen','MID_REGRESSION_SHARD:','MID_MAP_QA_SHARD:','run: npm run test:regressions','run: npm run audit:dependencies','node scripts/test-regression-sharding-0985171.mjs'])if(!workflow.includes(token))failures.push(`Neuer schreibgeschützter Revisionsvertrag fehlt: ${token}`);
 for(const [pattern,label] of [[/^  install:\s*$/m,'Veralteter Installationsjob'],[/^          - install\s*$/m,'Veraltete task=install-Option'],[/git push origin HEAD:(?:main|mid-stable)/,'Direkte Hauptbranch-Schreiboperation'],[/^permissions:\s*\n\s+contents: write/m,'Breite Schreibrechte'],[/MID-code-revision-v0\.9\.19\.0\.zip/,'Altes Installationsarchiv']])if(pattern.test(workflow))failures.push(`Entfernter unsicherer Revisionspfad wieder aktiv: ${label}`);
 if((workflow.match(/run: node scripts\/prepare-browser-runtimes\.mjs/g)||[]).length!==2)failures.push('CI- und Nightly-Revision müssen Chromium und WebKit vor der vollständigen Prüfung separat vorbereiten');
 if(!workflow.includes("if: steps.install.outcome == 'success' && steps.browser_install.outcome == 'success'"))failures.push('Nightly-Regression darf nicht ohne beide vorbereiteten Browser laufen');
 for(const line of workflow.match(/^\s*uses:\s*[^\s#]+/gm)||[]){const revision=line.match(/@([^\s#]+)/)?.[1];if(!revision||!/[0-9a-f]{40}/i.test(revision))failures.push(`Action nicht auf vollständigen SHA fixiert: ${line.trim()}`)}
}else{
 const packer=await read('tools/release/create_professional_zip.py');
 if(!packer.includes('".github"'))failures.push('Professional-Transport muss den geschützten aktiven Workflow ausdrücklich ausschließen.');
}

const dependabot=await read('MID_DEPENDABOT_TEMPLATE.yml');
if((dependabot.match(/target-branch:\s*mid-stable/g)||[]).length<2)failures.push('Dependabot-Ziel fehlt');
for(const file of ['scripts/test-cockpit-meteogram-overlay-scale-09186.mjs','scripts/test-cockpit-meteogram-pro-09180.mjs','scripts/test-cockpit-shortterm-insight-09171.mjs','scripts/test-cockpit-shortterm-interaction-09173.mjs','scripts/test-cockpit-shortterm-premium-09172.mjs','scripts/test-cockpit-windbarb-buildfix-09185.mjs']){
 const source=await read(file);if(!source.includes('packageVersion!==baselineVersion'))failures.push(`Synchroner Versionsvertrag fehlt: ${file}`);
}
const packageJson=JSON.parse(await read('package.json'));
if(packageJson.devDependencies?.['@playwright/test']||packageJson.devDependencies?.['@lhci/cli'])failures.push('Browserwerkzeuge dürfen das Lockfile nicht verändern');
const baseline=JSON.parse(await read('MID_PERFORMANCE_BASELINE.json'));
for(const key of ['assetCount','totalBytes','totalGzipBytes','compressibleGzipBytes','staticMediaBytes','jsGzipBytes','cssGzipBytes','largestJsGzipBytes'])if(!Number.isFinite(baseline.limits?.[key]))failures.push(`Performance-Limit fehlt: ${key}`);
if(failures.length){console.error(`Code-Revisionsautomation unvollständig:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`Code-Revisionsautomation vollständig (${workflow?'Repository-Workflow':'geschützter Professional-Transportvertrag'}).`);
