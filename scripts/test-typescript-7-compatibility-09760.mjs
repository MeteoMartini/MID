import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [pkgText,lockText,appConfigText,nodeConfigText,policy,contract,implementation,baselineText]=await Promise.all([
 read('package.json'),read('package-lock.json'),read('tsconfig.app.json'),read('tsconfig.node.json'),
 read('MID_DEPENDENCY_UPGRADE_POLICY.md'),read('MID_TYPESCRIPT_7_COMPATIBILITY_CONTRACT.md'),
 read('MID_IMPLEMENTATION_0.9.76.0.md'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),lock=JSON.parse(lockText),appConfig=JSON.parse(appConfigText),nodeConfig=JSON.parse(nodeConfigText),baseline=JSON.parse(baselineText);
const require=createRequire(import.meta.url),ts=require('typescript'),stradaTs=require('typescript-strada'),test='scripts/test-typescript-7-compatibility-09760.mjs';

assert.match(pkg.version,/^\d+\.\d+\.\d+(?:\.\d+)?$/);
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.devDependencies?.typescript,'7.0.2');
assert.equal(lock.packages?.['']?.devDependencies?.typescript,'7.0.2');
assert.equal(lock.packages?.['node_modules/typescript']?.version,'7.0.2');
assert.equal(ts.version,'7.0.2');
assert.match(String(lock.packages?.['node_modules/typescript']?.resolved??''),/typescript-7\.0\.2\.tgz$/);
assert.equal(pkg.devDependencies?.['typescript-strada'],'npm:typescript@6.0.3');
assert.equal(lock.packages?.['']?.devDependencies?.['typescript-strada'],'npm:typescript@6.0.3');
assert.equal(lock.packages?.['node_modules/typescript-strada']?.version,'6.0.3');
assert.equal(stradaTs.version,'6.0.3');
assert.equal(typeof stradaTs.transpileModule,'function');
assert.equal(typeof stradaTs.createSourceFile,'function');
assert.equal(typeof ts.transpileModule,'undefined','TypeScript 7 darf nicht versehentlich als alte Strada-API behandelt werden.');

for(const [name,value] of Object.entries({react:'18.3.1','react-dom':'18.3.1','react-is':'18.3.1'}))assert.equal(pkg.dependencies?.[name],value,`${name} wurde unzulässig mitmigriert.`);
assert.equal(pkg.devDependencies?.vite,'6.4.3');
assert.equal(pkg.devDependencies?.['@vitejs/plugin-react'],'4.7.0');

assert.equal(appConfig.compilerOptions?.strict,true);
assert.equal(appConfig.compilerOptions?.isolatedModules,true);
assert.equal(appConfig.compilerOptions?.noEmit,true);
assert.equal(appConfig.compilerOptions?.moduleResolution,'Bundler');
assert.equal(nodeConfig.compilerOptions?.noEmit,true);
assert.equal(nodeConfig.compilerOptions?.moduleResolution,'Bundler');
assert.ok(pkg.scripts?.['verify:types']?.includes('tsc --noEmit -p tsconfig.app.json'));
assert.ok(pkg.scripts?.['verify:types']?.includes('tsc --noEmit -p tsconfig.node.json'));
assert.equal(pkg.scripts?.['test:typescript-7-compatibility'],`node ${test}`);

for(const token of ['TypeScript: 7.0.2','typescript-strada','6.0.3','React 19','Vite 8','@vitejs/plugin-react 6'])assert.ok(policy.includes(token),`Dependency-Policy fehlt: ${token}`);
for(const token of ['tsc --noEmit','Browser, PWA und Capacitor-iOS','vollständige MID-Regressionssuite'])assert.ok(contract.includes(token),`Kompatibilitätsvertrag fehlt: ${token}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['MID_TYPESCRIPT_7_COMPATIBILITY_CONTRACT.md','MID_IMPLEMENTATION_0.9.76.0.md'])assert.ok(baseline.requiredFiles?.includes(file)&&baseline.protectedFiles?.includes(file),`${file} ist nicht geschützt.`);
assert.ok(baseline.implementationProof?.includes('MID_IMPLEMENTATION_0.9.76.0.md'));
assert.ok(implementation.includes('TypeScript 7.0.2')&&implementation.includes('kein iOS-Fork'));

const scriptNames=(await readdir(new URL('scripts/',root))).filter(name=>name.endsWith('.mjs')&&name!==test.slice('scripts/'.length));
const scriptSources=await Promise.all(scriptNames.map(async name=>[name,await read(`scripts/${name}`)]));
const directRootApiImports=scriptSources.filter(([,source])=>/from\s+['"]typescript['"]|require\(['"]typescript['"]\)|createRequire\([^\n]+\)\(['"]typescript['"]\)/.test(source)).map(([name])=>name);
assert.deepEqual(directRootApiImports,[],`Regressionen importieren die entfernte TypeScript-7-Strada-API direkt: ${directRootApiImports.join(', ')}`);

console.log(`MID v${pkg.version}: TypeScript 7.0.2 ist lockfile-genau und ohne React-/Vite-Major-Kopplung qualifiziert.`);
