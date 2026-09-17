import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
assert.equal(pkg.version,'0.9.85.34','C14 muss als v0.9.85.34 in das Source-Gate gehen.');
for(const [name,target] of Object.entries({
 'test:weather-pictograms-country-codes':'node scripts/test-weather-pictograms-country-codes-08230.mjs',
 'test:short-term-anchor-buildfix':'node scripts/test-short-term-anchor-narrowing-buildfix-082615.mjs',
 'test:regressions':'node scripts/run-regressions.mjs',
 'prebuild':'npm run prepare:release-repository && npm run sync-version'
}))assert.equal(pkg.scripts?.[name],target,`C14 darf bestehenden Paket-/Regressionseintrag nicht verändern: ${name}`);
console.log('MID-C14: Paketversion und kritische bestehende Scriptpfade sind unverändert abgesichert.');
