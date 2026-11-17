/**
 * Independent, read-only compare: TWO exact production dist directories plus
 * the corresponding SHA-bound startup and module-only Chrome probe artifacts.
 * Descriptive only, never a real full-app A/B pass or source/release gate.
 *
 * Usage:
 * node scripts/compare-design16-ab-evidence.mjs \
 *   <stable-dist> <stable-40-sha> <stable-startup-json> <stable-map-json> \
 *   <candidate-dist> <candidate-40-sha> <candidate-startup-json> <candidate-map-json>
 */
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {join,resolve,relative,extname} from 'node:path';
import {verifyStartupBuildIdentity} from './lib/verifyStartupBuildIdentity.mjs';
import {startupAssetEvidence} from './lib/startupAssetEvidence.mjs';
import {compareDesign16Evidence} from './lib/design16AbEvidence.mjs';

if(process.argv.length!==10){
 console.error('Usage: node scripts/compare-design16-ab-evidence.mjs <stable-dist> <stable-40-sha> <stable-startup-json> <stable-map-json> <candidate-dist> <candidate-40-sha> <candidate-startup-json> <candidate-map-json>');
 process.exit(2);
}
const fields=process.argv.slice(2);
const parse=async filename=>JSON.parse(await readFile(resolve(filename),'utf8'));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const goodAssetName=name=>typeof name==='string'&&/^[A-Za-z0-9._-]+\.(?:js|css)$/.test(name);
async function verifyReportAssetContents(root,startup,map,label){
 // A correct build SHA does not prove that an independent JSON report has not
 // been manually edited. Reconstruct startup claims from actual dist bytes.
 const paths=[];
 async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){
  const file=join(dir,item.name);
  if(item.isDirectory())await walk(file);
  else if(item.isFile()&&['.js','.css'].includes(extname(item.name)))paths.push(file);
 }}
 await walk(root);
 const assets=[];
 for(const file of paths){
  const data=await readFile(file),extension=extname(file);
  assets.push({file:relative(root,file).split('\\').join('/'),extension,bytes:data.length,
   gzipBytes:gzipSync(data,{level:9}).length,
   brotliBytes:extension==='.css'?brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length:undefined});
 }
 const expected=startupAssetEvidence(await readFile(join(root,'index.html'),'utf8'),assets);
 for(const type of ['css','js']){
  if(!same(startup[type]?.entries,expected[type].entries)||
    startup[type]?.bytes!==expected[type].bytes||startup[type]?.gzipBytes!==expected[type].gzipBytes)
   throw Error(label+' startup '+type+' inventory is not derived from exact dist assets/HTML');
 }
 for(const listKey of ['files','cssFiles']){
  for(const item of map.warmImport?.[listKey]??[]){
   if(!goodAssetName(item?.name)||item.name.endsWith(listKey==='files'?'.css':'.js'))
    throw Error(label+' invalid or unsafe map module '+listKey+' asset name');
   const data=await readFile(join(root,'assets',item.name));
   if(item.rawBytes!==data.length||item.gzipBodyBytes!==gzipSync(data,{level:9}).length)
    throw Error(label+' map module '+listKey+' data differs from exact dist bytes');
  }
 }
}
async function loadSide(index,label){
 const dist=resolve(fields[index]);
 const expectedSha=fields[index+1];
 if(!/^[a-f0-9]{40}$/.test(expectedSha))throw Error(label+' requires an exact 40-character Git SHA');
 const identity=await parse(join(dist,'mid-build-identity.json'));
 if(identity.sourceGitSha!==expectedSha)throw Error(label+' dist source SHA is not the requested Git commit');
 await verifyStartupBuildIdentity(dist,identity);
 const version=await parse(join(dist,'version.json'));
 if(version.version!==identity.version)throw Error(label+' production version differs from build identity');
 const startup=await parse(fields[index+2]),mapModule=await parse(fields[index+3]);
 // Fail before comparison even if the reports contain matching *claimed* hashes.
 await verifyReportAssetContents(dist,startup,mapModule,label);
 return {buildIdentity:identity,startup,mapModule};
}
const stable=await loadSide(0,'stable');
const candidate=await loadSide(4,'candidate');
const result=compareDesign16Evidence({stable,candidate,expectedStableSha:fields[1],expectedCandidateSha:fields[5]});
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/design16-ab-evidence.json',JSON.stringify(result,null,2)+'\n');
console.log('MID_DESIGN16_AB_EVIDENCE '+JSON.stringify({
 stableSha:result.stable.sourceGitSha,candidateSha:result.candidate.sourceGitSha,
 status:result.status,releaseAuthorized:false,
 initialCssGzipDelta:result.metrics.initialCssGzip.delta,
 initialJsGzipDelta:result.metrics.initialJsGzip.delta,
 moduleOnlyGzipDelta:result.metrics.mapJsGzip.delta,
 warnings:result.reasons.length,
}));
