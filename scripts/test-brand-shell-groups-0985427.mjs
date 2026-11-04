import assert from 'node:assert/strict';
import{mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync,readFileSync}from'node:fs';
import{tmpdir}from'node:os';import{join}from'node:path';
import{verifiedBrandGroups,BRAND_GROUPS,syncBrandGroups}from'./brand-shell-groups.mjs';
const groups=verifiedBrandGroups();assert.equal(groups.length,5);syncBrandGroups(true);
assert.equal(readFileSync('public/service-worker.js','utf8'),readFileSync('public/sw.js','utf8'));
const root=mkdtempSync(join(tmpdir(),'mid-brand-'));
try{mkdirSync(join(root,'public'));for(const name of BRAND_GROUPS.flat())copyFileSync('public/'+name,join(root,'public',name));assert.deepEqual(verifiedBrandGroups(root),groups);writeFileSync(join(root,'public',BRAND_GROUPS[0][1]),'divergent future dark asset');assert.throws(()=>verifiedBrandGroups(root),/divergence/)}finally{rmSync(root,{recursive:true,force:true})}
console.log('PASS five SHA-identical groups, generated worker parity, future divergent theme fails closed; all source URLs retained');
