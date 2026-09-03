import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const lock=JSON.parse(fs.readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));

assert.equal(lock.lockfileVersion,3,'Der MID-Lockfile muss Lockfile-Version 3 verwenden.');
assert.equal(lock.version,pkg.version,'package-lock.json muss die MID-Paketversion spiegeln.');
assert.equal(lock.packages?.['']?.version,pkg.version,'Der Root-Eintrag des Lockfiles muss die MID-Paketversion spiegeln.');
assert.deepEqual(lock.packages?.['']?.dependencies??{},pkg.dependencies??{},'Produktionsabhängigkeiten im Lockfile-Root müssen package.json entsprechen.');
assert.deepEqual(lock.packages?.['']?.devDependencies??{},pkg.devDependencies??{},'Dev-Abhängigkeiten im Lockfile-Root müssen package.json entsprechen.');

for(const name of ['node_modules/@types/prop-types','node_modules/@types/react','node_modules/csstype']){
 const entry=lock.packages?.[name];
 assert.ok(entry,`Lockfile-Eintrag fehlt: ${name}`);
 assert.equal(entry.dev,true,`${name} muss im npm-10-Lockfile als dev klassifiziert sein.`);
 assert.notEqual(entry.devOptional,true,`${name} darf nicht als devOptional klassifiziert sein; das erzeugte im npm-Audit einen ungültigen Paketbaum.`);
}

console.log(`MID v${pkg.version}: npm-10-Audit-Lockfile-Baum ist konsistent.`);
