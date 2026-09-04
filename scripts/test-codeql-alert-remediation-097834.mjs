import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sourceUsesExactHttpsUrl,sourceUsesHttpsHost} from './source-url-contract.mjs';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const urlTests=['scripts/test-widgetkit-xcode-structure-09710.mjs','scripts/test-keyless-basemap-contract-09743.mjs','scripts/test-extreme-outlook-mitteleuropa-recovery-096697.mjs','scripts/test-extreme-outlook-labels-layout-persistence-09668.mjs','scripts/test-extreme-outlook-dwd-scale-dashboard-persistence-09669.mjs','scripts/test-extreme-outlook-compact-legend-096610.mjs'];
const[navigation,settings,prepare,workflow,mirror,pkgRaw,baselineRaw,implementation,matrix,...urlSources]=await Promise.all([
 read('src/externalNavigation.ts'),read('src/ConnectedStationSettings.tsx'),read('tools/cloudflare/prepare_worker_deploy.mjs'),read('ci/github/workflows/install-mid.yml'),read('workflow-patches/install-mid.yml'),read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.78.34.md'),read('MID_PR_SECURITY_MATRIX_0.9.78.34.md'),...urlTests.map(read)
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-codeql-alert-remediation-097834.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.78.34'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:codeql-alert-remediation'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of [test,'scripts/source-url-contract.mjs','MID_IMPLEMENTATION_0.9.78.34.md','MID_PR_SECURITY_MATRIX_0.9.78.34.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);

assert.equal(sourceUsesHttpsHost("const tile='https://basemaps.cartocdn.com/a.png'",'basemaps.cartocdn.com'),true);
assert.equal(sourceUsesHttpsHost("const tile='https://basemaps.cartocdn.com.evil.example/a.png'",'basemaps.cartocdn.com'),false,'Hostähnliche Angreiferdomain darf nicht als exakter Host gelten.');
assert.equal(sourceUsesExactHttpsUrl("URL(string: \"https://mid-data-proxy.midwx.workers.dev/\")",'https://mid-data-proxy.midwx.workers.dev/'),true);
assert.equal(sourceUsesExactHttpsUrl("URL(string: \"https://mid-data-proxy.midwx.workers.dev.evil.example/\")",'https://mid-data-proxy.midwx.workers.dev/'),false);
for(const source of urlSources)assert.ok(!/\.includes\(['"](?:https?:\/\/|[A-Za-z0-9.-]+\.(?:com|dev|org))/.test(source),'URL-/Host-Substringprüfung ist noch aktiv.');

assert.ok(navigation.includes('let pendingNetatmoCallback:MidNetatmoOAuthCallback|null=null')&&navigation.includes('takePendingMidNetatmoOAuthCallback'));
assert.ok(settings.includes('takePendingMidNetatmoOAuthCallback()'));
for(const source of [navigation,settings])assert.ok(!source.includes("'mid:netatmo:callback'")&&!source.includes('sessionStorage.setItem')&&!source.includes('localStorage.setItem'),'OAuth-Callback wird noch persistent im Browser gespeichert.');

for(const token of ["mkdtemp(path.join(os.tmpdir(),'mid-worker-deploy-'))",'chmod(tempDir,0o700)',"mode:0o600,flag:'wx'",'config_path=${out}','meta_path=${metaOut}'])assert.ok(prepare.includes(token),`Sicherer Tempdateivertrag fehlt: ${token}`);
assert.ok(!prepare.includes("process.argv[2]||'/tmp/")&&!prepare.includes("process.argv[3]||'/tmp/"));
assert.equal(workflow,mirror,'Kanonischer Installer und Transportspiegel müssen bytegleich sein.');
for(const token of ['steps.remote_worker.outputs.config_path','steps.remote_worker.outputs.meta_path'])assert.ok(workflow.includes(token),`Sicherer Workflow-Ausgabepfad fehlt: ${token}`);
assert.ok(!workflow.includes('/tmp/mid-wrangler-worker.json')&&!workflow.includes('/tmp/mid-worker-deploy-meta.json'));

for(const token of ['#6','#18','#21','nicht übernehmen','CodeQL #81–#90'])assert.ok(matrix.includes(token),`PR-/Security-Matrix unvollständig: ${token}`);
assert.ok(implementation.includes('flüchtigen In-Memory-Handoff')&&implementation.includes('zufälligen privaten Temp-Verzeichnis'));
console.log(`MID v${pkg.version}: CodeQL #81–#90 behoben; exakte URL-Hosts, flüchtiger OAuth-Handoff und exklusive Tempdateien geprüft.`);
