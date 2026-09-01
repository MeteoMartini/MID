import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgRaw,policy,audit,ruc,sync,baselineRaw]=await Promise.all([
 read('package.json'),read('MID_DEPENDENCY_UPGRADE_POLICY.md'),read('ci/github/workflows/dependency-audit.yml'),
 read('ci/github/workflows/mid-ruc-preprocess.yml'),read('scripts/sync-github-workflows.mjs'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-github-pr-maintenance-09773.mjs';
const upload='043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',codeql='cdf488f595d80d6e07e03d4674febd5ab45fa938',python='5fda3b95a4ea91299a34e894583c3862153e4b97';
assert.ok(audit.includes(`actions/upload-artifact@${upload} # v7.0.1`),'PR #25 muss in der kanonischen Audit-Quelle liegen.');
assert.ok(ruc.includes(`actions/setup-python@${python} # v7.0.0`),'PR #26 muss in der kanonischen RUC-Quelle liegen.');
assert.ok(sync.includes(`UPLOAD_ARTIFACT_V7_SHA='${upload}'`));
assert.ok(sync.includes(`SETUP_PYTHON_V7_SHA='${python}'`));
assert.ok(sync.includes(`CODEQL_V4_SHA='${codeql}'`));
assert.ok(sync.includes('github/codeql-action/${action}@${CODEQL_V4_SHA} # v4.37.9'),'PR #24 muss init/analyze gemeinsam pinnen.');
assert.equal(pkg.dependencies?.react,'18.3.1','React 19 bleibt zurückgestellt.');
assert.equal(pkg.dependencies?.['react-dom'],'18.3.1','React DOM 19 bleibt zurückgestellt.');
assert.equal(pkg.dependencies?.['react-is'],'18.3.1','react-is 19 bleibt zurückgestellt.');
assert.equal(pkg.devDependencies?.['@vitejs/plugin-react'],'4.7.0','plugin-react 6 bleibt zurückgestellt.');
for(const token of ['setup-python 7.0.0','upload-artifact 7.0.1','CodeQL: 4.37.9'])assert.ok(policy.includes(token),`Policy fehlt: ${token}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: PR #25/#24/#26 MID-konform übernommen; React 19 und plugin-react 6 bleiben zurückgestellt.`);
