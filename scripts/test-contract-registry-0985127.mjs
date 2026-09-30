import assert from 'node:assert/strict';
import {access,readdir,readFile} from 'node:fs/promises';
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const registry=JSON.parse(await readFile(new URL('../contracts/index.json',import.meta.url),'utf8'));
assert.equal(registry.schema,'mid.contract-registry.v1');
assert.equal(registry.releaseVersion,pkg.version);
assert.equal(registry.normativeFormat,'markdown');
const rows=registry.contracts||[],paths=rows.map(row=>row.path);
assert.equal(new Set(paths).size,paths.length);
assert.equal(new Set(rows.map(row=>row.id)).size,rows.length);
for(const row of rows){assert.match(row.path,/^MID_.*CONTRACT.*\.md$/);assert.ok(['active','historical'].includes(row.status));await access(new URL('../'+row.path,import.meta.url));}
const actual=(await readdir(new URL('../',import.meta.url))).filter(name=>/^MID_.*CONTRACT.*\.md$/i.test(name)).sort();
assert.deepEqual([...paths].sort(),actual,'contracts/index.json muss jeden normativen Root-Vertrag exakt einmal registrieren.');
console.log('MID v0.9.85.127: Vertragsregistry vollständig.');
