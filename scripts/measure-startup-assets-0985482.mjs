/** Read-only SHA-bound build inventory. Run only against a COMPLETE production dist. */
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,extname,join} from 'node:path';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {startupAssetEvidence} from './lib/startupAssetEvidence.mjs';
import {offlineShellAssetEvidence} from './lib/offlineShellAssetEvidence.mjs';
import {verifyStartupBuildIdentity} from './lib/verifyStartupBuildIdentity.mjs';

const root=resolve(process.argv[2]??'dist');
const index=await readFile(join(root,'index.html'),'utf8');
const files=[];
async function walk(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
 const full=join(directory,entry.name);if(entry.isDirectory())await walk(full);else if(entry.isFile())files.push(full);else throw Error('Unsupported production asset file type: '+full);
}}
await walk(root);
const assets=[];
for(const file of files){
 const extension=extname(file).toLowerCase();if(extension!=='.js'&&extension!=='.css')continue;
 const data=await readFile(file);
 assets.push({file:relative(root,file),extension,bytes:data.length,gzipBytes:gzipSync(data,{level:9}).length,
  brotliBytes:extension==='.css'?brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length:undefined});
}
const report=startupAssetEvidence(index,assets);
const offlineShell=offlineShellAssetEvidence(index,assets,report);
const version=JSON.parse(await readFile(join(root,'version.json'),'utf8'));
const buildIdentity=JSON.parse(await readFile(join(root,'mid-build-identity.json'),'utf8'));
const provenance={version:version.version??null,buildIdentity};
// Reject unbound reporting: a measurement without provenance cannot be
// attributed to a Stable build or compared against future releases.
if(!provenance.version||provenance.version!==buildIdentity.version||!buildIdentity?.sourceGitSha||!/^[0-9a-f]{40}$/.test(buildIdentity.sourceGitSha)){
 throw Error('Missing version or full Git SHA in built identity');
}
// Reject incomplete/corrupted built assets, not only a plausible source SHA.
await verifyStartupBuildIdentity(root,buildIdentity);
const result={...report,offlineShell,provenance};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/startup-assets-0985482.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({schema:result.schema,version:result.provenance.version,sourceGitSha:buildIdentity.sourceGitSha,
 initialCssRaw:result.css.bytes,initialCssGzip:result.css.gzipBytes,initialCssBrotli:result.css.brotliBytes,
 htmlReferencedJsRaw:result.js.bytes,htmlReferencedJsGzip:result.js.gzipBytes,jsFiles:result.js.entries.length,
 offlineShellRaw:result.offlineShell.total.bytes,offlineShellGzip:result.offlineShell.total.gzipBytes,
 offlineShellOnlyGzip:result.offlineShell.offlineOnly.gzipBytes},null,2));
