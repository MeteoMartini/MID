import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [pkgText,lockText,policy,baselineText]=await Promise.all([
  read('package.json'),read('package-lock.json'),read('MID_DEPENDENCY_UPGRADE_POLICY.md'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),lock=JSON.parse(lockText),baseline=JSON.parse(baselineText);
const test='scripts/test-lucide-135-maintenance-097616.mjs';
assert.equal(pkg.dependencies?.['lucide-react'],'^1.35.0');
assert.equal(lock.packages?.['']?.dependencies?.['lucide-react'],'^1.35.0');
assert.equal(lock.packages?.['node_modules/lucide-react']?.version,'1.35.0');
assert.equal(lock.packages?.['node_modules/lucide-react']?.integrity,'sha512-yXCCWxGFYT6bLIPYC4SY6fPQPRs/d797rRIue+J9XP2Td6vQvD53gaQRBCnIVT1kTQRHtAtxlfOQNWAuIF8ELg==');
for(const [name,value] of [['react','18.3.1'],['react-dom','18.3.1'],['react-is','18.3.1']])assert.equal(pkg.dependencies?.[name],value,`${name} darf durch den Lucide-Wartungsschritt nicht angehoben werden.`);
assert.equal(pkg.devDependencies?.vite,'6.4.3');
assert.equal(pkg.devDependencies?.['@vitejs/plugin-react'],'4.7.0');
assert.ok(policy.includes('Lucide React: 1.35.0'));
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
console.log('MID Lucide-Wartung geprüft: 1.35.0 reproduzierbar, React 18/Vite 6 unverändert.');
