import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [pkgText,lockText,policy,deploy,install,audit,patchDeploy,patchInstall,baselineText,vite]=await Promise.all([
 read('package.json'),read('package-lock.json'),read('MID_DEPENDENCY_UPGRADE_POLICY.md'),read('ci/github/workflows/deploy.yml'),read('ci/github/workflows/install-mid.yml'),read('ci/github/workflows/dependency-audit.yml'),read('workflow-patches/deploy.yml'),read('workflow-patches/install-mid.yml'),read('MID_BASELINE.json'),read('vite.config.ts')
]);
const pkg=JSON.parse(pkgText),lock=JSON.parse(lockText),baseline=JSON.parse(baselineText);
for(const [name,value] of [['react','19.2.8'],['react-dom','19.2.8'],['react-is','19.2.8'],['recharts','3.10.1']]){assert.equal(pkg.dependencies?.[name],value);assert.equal(lock.packages?.[`node_modules/${name}`]?.version,value)}
assert.equal(pkg.dependencies?.['lucide-react'],'^1.40.0');assert.equal(lock.packages?.['node_modules/lucide-react']?.version,'1.40.0');
assert.equal(pkg.devDependencies?.typescript,'7.0.2');assert.equal(pkg.devDependencies?.['typescript-strada'],'npm:typescript@6.0.3');assert.equal(lock.packages?.['node_modules/typescript-strada']?.version,'6.0.3');
assert.equal(pkg.devDependencies?.vite,'8.2.2');assert.equal(pkg.devDependencies?.['@vitejs/plugin-react'],'6.1.1');
assert.equal(pkg.devDependencies?.esbuild,'0.28.2');assert.equal(lock.packages?.['node_modules/esbuild']?.version,'0.28.2');
assert.equal(pkg.devDependencies?.['@types/react'],'^19.2.18');assert.equal(pkg.devDependencies?.['@types/react-dom'],'^19.2.5');
for(const token of ["minify:'oxc'","cssMinify:'lightningcss'",'rolldownOptions','codeSplitting'])assert.ok(vite.includes(token),`Vite-8-Konfiguration fehlt: ${token}`);
for(const token of ['manualChunks',"minify:'esbuild'","cssMinify:'esbuild'",'rollupOptions'])assert.ok(!vite.includes(token),`Veralteter Vite-Vertrag aktiv: ${token}`);
const checkout='actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',setup='actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',deployPages='actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1';
for(const [label,text] of [['deploy',deploy],['install',install],['dependency-audit',audit],['patch-deploy',patchDeploy],['patch-install',patchInstall]]){
 assert.ok(text.includes(checkout),`${label}: checkout v7 SHA fehlt.`);if(label!=='patch-install'||text.includes('setup-node'))assert.ok(text.includes(setup),`${label}: setup-node v7 SHA fehlt.`);
 if(label==='deploy'||label==='install'||label==='patch-deploy'||label==='patch-install')assert.ok(text.includes(deployPages),`${label}: deploy-pages 5.0.1 fehlt.`);
}
for(const token of ['React / React DOM / react-is: 19.2.8','Lucide React: 1.40.0','TypeScript: 7.0.2','Vite: 8.2.2','`@vitejs/plugin-react`: 6.1.1','esbuild: 0.28.2'])assert.ok(policy.includes(token),`Policy fehlt: ${token}`);
const test='scripts/test-approved-dependency-upgrades-09570.mjs';assert.equal(pkg.scripts?.['test:approved-dependency-upgrades'],`node ${test}`);assert.ok(baseline.requiredRegressionTests?.includes(test));assert.ok(baseline.regressionTests?.includes(test));
console.log('Freigegebene Dependency-/Action-Migration geprüft: React 19.2.8, Lucide 1.40.0, Vite 8.2.2/plugin-react 6.1.1, TypeScript 7.0.2 und aktuelle Actions-Pins.');
