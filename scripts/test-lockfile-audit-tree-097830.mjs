import assert from 'node:assert/strict';
import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const lock=JSON.parse(fs.readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
assert.equal(lock.lockfileVersion,3);assert.equal(lock.version,pkg.version);assert.equal(lock.packages?.['']?.version,pkg.version);assert.deepEqual(lock.packages?.['']?.dependencies??{},pkg.dependencies??{});assert.deepEqual(lock.packages?.['']?.devDependencies??{},pkg.devDependencies??{});
assert.ok(!lock.packages?.['node_modules/@types/prop-types'],'@types/prop-types darf nach der React-19-Typmigration nicht künstlich im Lockfile festgehalten werden.');
for(const name of ['node_modules/@types/react','node_modules/csstype']){const entry=lock.packages?.[name];assert.ok(entry,`Lockfile-Eintrag fehlt: ${name}`);assert.equal(entry.devOptional,true,`${name} muss im npm-10-Lockfile der React-19-Migration als devOptional klassifiziert sein.`)}
for(const [name,version] of [['react','19.2.8'],['react-dom','19.2.8'],['react-is','19.2.8'],['lucide-react','1.40.0'],['vite','8.2.2'],['@vitejs/plugin-react','6.1.1']])assert.equal(lock.packages?.[`node_modules/${name}`]?.version,version,`${name} ist nicht lockfile-genau.`);
console.log(`MID v${pkg.version}: npm-10-Audit-Lockfile-Baum ist für React 19/Vite 8 konsistent.`);
