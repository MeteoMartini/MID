import assert from 'node:assert/strict';
import {startupAssetEvidence} from './lib/startupAssetEvidence.mjs';
const inventory=[
 {file:'assets/index-abc.js',extension:'.js',bytes:100,gzipBytes:50},
 {file:'assets/vendor-def.js',extension:'.js',bytes:300,gzipBytes:120},
 {file:'assets/index-xyz.css',extension:'.css',bytes:200,gzipBytes:70,brotliBytes:60},
];
const sample='<link rel="stylesheet" href="./assets/index-xyz.css"><link rel="modulepreload" href="./assets/vendor-def.js">'+
 '<link rel="mid-offline" href="./assets/later.js"><script type="module" src="./assets/index-abc.js"></script>';
const evidence=startupAssetEvidence(sample,inventory);
assert.equal(evidence.js.bytes,400);
assert.equal(evidence.js.gzipBytes,170);
assert.equal(evidence.css.bytes,200);
assert.equal(evidence.css.brotliBytes,60);
assert.equal(evidence.js.entries.length,2);
assert.ok(evidence.scope.includes('no transitive import graph'));
assert.equal(startupAssetEvidence(sample.replace('<link rel="modulepreload" href="./assets/vendor-def.js">','<link rel="modulepreload" href="./assets/index-abc.js">'),inventory).js.entries.length,1);
for(const mutation of [
 sample.replace('index-abc.js','missing.js'),
 sample.replace('./assets/index-abc.js','https://tracker.example/abc.js'),
 sample.replace('./assets/index-abc.js','../assets/index-abc.js'),
 sample.replace('href="./assets/vendor-def.js"','href=""'),
 sample.replace('type="module"','type="text/javascript"'),
 sample.replace('rel="stylesheet"','rel="alternate"'),
])assert.throws(()=>startupAssetEvidence(mutation,inventory));
assert.equal(startupAssetEvidence(sample.replace('./assets/index-abc.js','./assets/index-abc.js?x=1'),inventory).js.bytes,400);
console.log('Static startup inventory: file reference, duplication, malformed URLs, CSS and NoData/absent entry checks pass');
