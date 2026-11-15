import assert from 'node:assert/strict';
import {startupAssetEvidence} from './lib/startupAssetEvidence.mjs';
import {verifyStartupBuildIdentity} from './lib/verifyStartupBuildIdentity.mjs';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
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

// Exact fingerprint contract: missing, modified, extra or symlinked output
// may not be reported as a verified MID production build.
const temporary=await mkdtemp(join(tmpdir(),'mid-startup-identity-'));
try {
 await mkdir(join(temporary,'assets'));
 await writeFile(join(temporary,'index.html'),'<html></html>');
 await writeFile(join(temporary,'assets','index.js'),'export default 1;');
 const paths=['assets/index.js','index.html'];
 const hash=createHash('sha256');
 for(const name of paths){
  hash.update(name+'\u0000'+createHash('sha256').update(await readFile(join(temporary,name))).digest('hex')+'\n');
 }
 const identity={schema:'mid.web-build-identity.v1',version:'0.9.85.481',sourceGitSha:'a'.repeat(40),assetsSha256:hash.digest('hex'),assetCount:2};
 assert.equal((await verifyStartupBuildIdentity(temporary,identity)).assetCount,2);
 await assert.rejects(verifyStartupBuildIdentity(temporary,{...identity,sourceGitSha:null}),/malformed/);
 await assert.rejects(verifyStartupBuildIdentity(temporary,{...identity,assetCount:3}),/count mismatch/);
 await writeFile(join(temporary,'assets','index.js'),'export default 2;');
 await assert.rejects(verifyStartupBuildIdentity(temporary,identity),/fingerprint mismatch/);
 await writeFile(join(temporary,'extra.js'),'extra');
 await assert.rejects(verifyStartupBuildIdentity(temporary,identity),/count mismatch/);
}finally{await rm(temporary,{recursive:true,force:true});}
console.log('MID static startup fingerprint: verified good and rejected malformed/corrupted/extra build assets');
