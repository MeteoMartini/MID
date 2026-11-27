import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const lock=JSON.parse(fs.readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
assert.equal(lock.lockfileVersion,3);assert.equal(lock.version,pkg.version);assert.equal(lock.packages?.['']?.version,pkg.version);assert.deepEqual(lock.packages?.['']?.dependencies??{},pkg.dependencies??{});assert.deepEqual(lock.packages?.['']?.devDependencies??{},pkg.devDependencies??{});
assert.ok(!lock.packages?.['node_modules/@types/prop-types'],'@types/prop-types darf nach der React-19-Typmigration nicht künstlich im Lockfile festgehalten werden.');
for(const name of ['node_modules/@types/react','node_modules/csstype']){const entry=lock.packages?.[name];assert.ok(entry,`Lockfile-Eintrag fehlt: ${name}`);assert.equal(entry.devOptional,true,`${name} muss im npm-10-Lockfile der React-19-Migration als devOptional klassifiziert sein.`)}
for(const [name,version] of [['react','19.2.8'],['react-dom','19.2.8'],['react-is','19.2.8'],['lucide-react','1.40.0'],['vite','8.3.5'],['@vitejs/plugin-react','6.1.2']])assert.equal(lock.packages?.[`node_modules/${name}`]?.version,version,`${name} ist nicht lockfile-genau.`);
console.log(`MID v${pkg.version}: npm-10-Audit-Lockfile-Baum ist für React 19/Vite 8 konsistent.`);

// GHSA-fc5q-39xc-vjpf / CVE-2026-112366: verify the exact patched
// transitive dependency and execute bounded adversarial cases.
const expectedAlias='npm:@ryotsu/picomatch@4.0.7-a';
const expectedIntegrity='sha512-JroBFEmaejC7szGSfqOhF1QZHLKvX2wTA1+fWyfkpy3BjzdQKNPLKa2FtgeKVUDy5/UPUNkXEeCHJ5ZRBMLTVA==';
assert.equal(pkg.overrides?.picomatch,expectedAlias,'CVE-2026-112366: required alias missing');
const picomatchEntries=Object.keys(lock.packages??{}).filter(name=>/(^|\/)node_modules\/picomatch$/.test(name));
assert.deepEqual(picomatchEntries,['node_modules/picomatch'],'Unexpected second picomatch installation');
const patchedEntry=lock.packages['node_modules/picomatch'];
assert.equal(patchedEntry?.name,'@ryotsu/picomatch');
assert.equal(patchedEntry?.version,'4.0.7-a');
assert.equal(patchedEntry?.integrity,expectedIntegrity,'Patch tarball integrity drift');
assert.equal(patchedEntry?.resolved,'https://registry.npmjs.org/@ryotsu/picomatch/-/picomatch-4.0.7-a.tgz');
for(const packageName of ['vite','tinyglobby']){
 assert.ok(lock.packages?.['node_modules/'+packageName]?.dependencies?.picomatch,packageName+': picomatch dependency missing');
}
const load=createRequire(import.meta.url);
const actual=load('picomatch/package.json');
assert.equal(actual.name,'@ryotsu/picomatch','Runtime alias was not actually installed');
assert.equal(actual.version,'4.0.7-a');
const attackProgram=[
 "const assert=require('node:assert/strict');",
 "const pm=require('picomatch');",
 "const a='a'.repeat(80),b='ab'.repeat(40);",
 "const samples=[",
 " ['+(*a)',a+'!'],['*(*a)',a+'!'],",
 " ['+(a*)',a+'/'],['*(a*)',a+'/'],",
 " ['+(*)',a+'/'],['*(*)',a+'/'],",
 " ['+(*)b',a+'!'],['*(*)b',a+'!'],",
 " ['+(*a)c',a+'!'],['+(a*b)',b+'!'],",
 " ['+(**)',a+'/.'],['+(**a)',a+'!'],",
 " ['+(@(*a))',a+'!'],['+(?(*a))',a+'!']",
 "];",
 "for(const opts of [{},{windows:true},{capture:true}]){",
 " for(const [pattern,input] of samples){",
 "  assert.equal(pm.isMatch(input,pattern,opts),false,pattern);",
 " }",
 "}"
].join('\n');
const run=spawnSync(process.execPath,['-e',attackProgram],{
 cwd:process.cwd(),encoding:'utf8',timeout:10000,maxBuffer:131072
});
assert.equal(run.error,undefined,String(run.error??''));
assert.equal(run.status,0,run.stderr||run.stdout);
console.log('MID #903 picomatch security: exact lock, runtime alias and 42 bounded ReDoS probes PASS.');
