import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgRaw,lockRaw,baselineRaw,policy,codeRevision,syncSource,changelog,implementation]=await Promise.all([
  read('package.json'),read('package-lock.json'),read('MID_BASELINE.json'),read('MID_DEPENDENCY_UPGRADE_POLICY.md'),
  read('ci/github/workflows/install-mid.yml'),read('scripts/sync-github-workflows.mjs'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.67.3.md')
]);
const pkg=JSON.parse(pkgRaw),lock=JSON.parse(lockRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-dependency-actions-maintenance-096673.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.67.3'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.dependencies?.['lucide-react'],'^1.34.0');
assert.equal(lock.packages?.['node_modules/lucide-react']?.version,'1.34.0');
assert.equal(pkg.dependencies?.['maplibre-gl'],'6.5.0');
assert.equal(lock.packages?.['node_modules/maplibre-gl']?.version,'6.5.0');
assert.equal(lock.packages?.['node_modules/@mapbox/jsonlint-lines-primitives']?.version,'2.0.3');
assert.equal(lock.packages?.['node_modules/@maplibre/maplibre-gl-style-spec']?.version,'26.2.1');
assert.equal(lock.packages?.['node_modules/@maplibre/mlt']?.version,'1.2.0');
assert.equal(lock.packages?.['node_modules/pbf']?.version,'5.1.2');
for(const old of ['node_modules/@mapbox/whoots-js','node_modules/@types/supercluster','node_modules/supercluster','node_modules/rw'])assert.ok(!lock.packages?.[old],`Veralteter MapLibre-Transitvpfad verblieben: ${old}`);
assert.equal(pkg.dependencies?.react,'18.3.1');
assert.equal(pkg.devDependencies?.typescript,'7.0.2');
assert.equal(pkg.devDependencies?.['typescript-strada'],'npm:typescript@6.0.3');
assert.equal(pkg.devDependencies?.vite,'6.4.3');
assert.equal(pkg.devDependencies?.['@vitejs/plugin-react'],'4.7.0');
const codeql='ff2f1c621b7f889edc0d3c761ac2e6a3f8cdb0dd';
const checkout='3d3c42e5aac5ba805825da76410c181273ba90b1',setup='820762786026740c76f36085b0efc47a31fe5020';
assert.ok(syncSource.includes(`CHECKOUT_V7_SHA='${checkout}'`)&&syncSource.includes(`SETUP_NODE_V7_SHA='${setup}'`));
assert.ok(syncSource.includes(`CODEQL_V4_SHA='${codeql}'`));
assert.ok(syncSource.includes('github/codeql-action/${action}@${CODEQL_V4_SHA} # v4.37.7'));
// Der automatische ZIP-Installer schützt aktive Workflows bewusst vor Selbstmodifikation.
// Deshalb wird hier der auslieferbare Sync-Vertrag geprüft und nicht verlangt, dass .github
// bereits im selben Installationslauf auf CodeQL 4.37.7 umgeschrieben wurde.
assert.ok(codeRevision.includes("--exclude='.github/'"));
assert.ok(codeRevision.includes("git add -A -- . ':(exclude).github/**'"));
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const token of ['Lucide React: 1.34.0','MapLibre GL JS: 6.5.0','CodeQL: 4.37.7'])assert.ok(policy.includes(token),`Dependency-Policy fehlt: ${token}`);
assert.ok(changelog.includes('## 0.9.67.3'));
assert.ok(implementation.includes('PR #16')&&implementation.includes('PR #17')&&implementation.includes('PR #15')&&implementation.includes('PR #1/#2'));
console.log(`MID v${pkg.version}: Lucide, MapLibre, CodeQL und Actions sind auf dem freigegebenen Wartungsstand synchron.`);
