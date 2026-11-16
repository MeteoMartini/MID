/** Diagnostic only: exact production dist -> static module dependency report. */
import {createHash} from 'node:crypto';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {startupAssetEvidence} from './lib/startupAssetEvidence.mjs';
import {startupTransitiveGraph} from './lib/startupTransitiveGraph.mjs';
import {verifyStartupBuildIdentity} from './lib/verifyStartupBuildIdentity.mjs';

const root=resolve(process.argv[2]??'dist');
const identity=JSON.parse(await readFile(join(root,'mid-build-identity.json'),'utf8'));
const version=JSON.parse(await readFile(join(root,'version.json'),'utf8'));
if(!version.version||identity.version!==version.version)throw Error('Built version and SHA identity mismatch');
await verifyStartupBuildIdentity(root,identity);
const files=[];
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=join(dir,entry.name);
  if(entry.isDirectory())await walk(file);
  else if(entry.isFile())files.push(file);
  else throw Error('Unsupported dist file type: '+file);
 }
}
await walk(root);
const assets=[];
for(const file of files){
 const extension=extname(file).toLowerCase();
 if(extension!=='.js'&&extension!=='.css')continue;
 const data=await readFile(file);
 const item={file:relative(root,file).replaceAll('\\','/'),extension,bytes:data.length,
  gzipBytes:gzipSync(data,{level:9}).length,
  brotliBytes:extension==='.css'?brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length:undefined};
 if(extension==='.js'){item.source=data.toString('utf8');item.sha256=createHash('sha256').update(data).digest('hex');}
 assets.push(item);
}
const html=await readFile(join(root,'index.html'),'utf8');
const bootstrap=startupAssetEvidence(html,assets);
const graph=startupTransitiveGraph(bootstrap,assets.filter(a=>a.extension==='.js'));
const report={...graph,provenance:{version:identity.version,sourceGitSha:identity.sourceGitSha,
 buildAssetsSha256:identity.assetsSha256,buildAssetCount:identity.assetCount},
 htmlReferencedJsBytes:bootstrap.js.bytes,htmlReferencedJsGzipBytes:bootstrap.js.gzipBytes};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/startup-transitive-js-0985486.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({schema:report.schema,sourceGitSha:report.provenance.sourceGitSha,
 htmlReferenced:report.htmlReferencedFiles,staticClosure:report.staticClosureFiles,
 additionalStatic:report.additionalStaticFiles,rawBytes:report.staticClosureBytes,
 gzipBytes:report.staticClosureGzipBytes,dynamicExcluded:report.dynamicImportCount},null,2));
