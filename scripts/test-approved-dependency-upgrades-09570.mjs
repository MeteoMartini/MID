import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [pkgText,lockText,policy,deploy,install,audit,patchDeploy,patchInstall,baselineText]=await Promise.all([
 read('package.json'),read('package-lock.json'),read('MID_DEPENDENCY_UPGRADE_POLICY.md'),read('ci/github/workflows/deploy.yml'),read('ci/github/workflows/install-mid.yml'),read('ci/github/workflows/dependency-audit.yml'),read('workflow-patches/deploy.yml'),read('workflow-patches/install-mid.yml'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),lock=JSON.parse(lockText),baseline=JSON.parse(baselineText);
assert.equal(pkg.dependencies?.['lucide-react'],'^1.35.0');
assert.equal(lock.packages?.['node_modules/lucide-react']?.version,'1.35.0');
assert.equal(pkg.dependencies?.recharts,'3.10.1');
assert.equal(lock.packages?.['node_modules/recharts']?.version,'3.10.1');
assert.equal(lock.packages?.['node_modules/immer']?.version,'11.1.17');
assert.equal(lock.packages?.['node_modules/reselect']?.version,'5.2.0');
assert.ok(!lock.packages?.['node_modules/@reduxjs/toolkit/node_modules/immer'],'Doppeltes altes Immer 11.1.8 ist noch im Lockfile verschachtelt.');
for(const [name,value] of [['react','18.3.1'],['react-dom','18.3.1'],['react-is','18.3.1']])assert.equal(pkg.dependencies?.[name],value,`${name} darf mit diesem Wartungsschritt nicht angehoben werden.`);
assert.equal(pkg.devDependencies?.typescript,'7.0.2','TypeScript 7.0.2 muss nach dem isolierten Kompatibilitätslauf exakt festgeschrieben bleiben.');
assert.equal(pkg.devDependencies?.['typescript-strada'],'npm:typescript@6.0.3','Strada-Test-API muss getrennt und exakt festgeschrieben bleiben.');
assert.equal(lock.packages?.['node_modules/typescript-strada']?.version,'6.0.3');
assert.equal(pkg.devDependencies?.vite,'6.4.3','Vite bleibt unverändert.');
assert.equal(pkg.devDependencies?.['@vitejs/plugin-react'],'4.7.0','plugin-react 6 bleibt zurückgestellt.');
const checkout='actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1';
const setup='actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0';
for(const [label,text] of [['deploy',deploy],['install',install],['dependency-audit',audit],['patch-deploy',patchDeploy],['patch-install',patchInstall]]){
 assert.ok(text.includes(checkout),`${label}: checkout v7 SHA fehlt.`);
 if(label!=='patch-install'||text.includes('setup-node'))assert.ok(text.includes(setup),`${label}: setup-node v7 SHA fehlt.`);
 assert.ok(!/actions\/(?:checkout|setup-node)@v6\b/.test(text),`${label}: ungepinnter v6-Verweis ist zurückgekehrt.`);
}
assert.ok(policy.includes('Recharts: 3.10.1'));
assert.ok(policy.includes('Lucide React: 1.35.0'));
assert.ok(policy.includes('TypeScript: 7.0.2')&&policy.includes('Vite 8'));
const test='scripts/test-approved-dependency-upgrades-09570.mjs';
assert.equal(pkg.scripts?.['test:approved-dependency-upgrades'],`node ${test}`);
assert.ok(baseline.requiredRegressionTests?.includes(test));
assert.ok(baseline.regressionTests?.includes(test));
console.log('Freigegebene Dependency-/Action-Upgrades geprüft: TypeScript 7.0.2, checkout 7.0.1, setup-node 7.0.0, Lucide React 1.35.0 und Recharts 3.10.1; React 19 sowie plugin-react 6/Vite 8 bleiben zurückgestellt.');
