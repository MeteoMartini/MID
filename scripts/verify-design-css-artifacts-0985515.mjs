#!/usr/bin/env node
/**
 * Verify that MID build-budget CSS evidence describes the actual dist files.
 * No source modification, network access, new dependencies or release action.
 * Source/lockfile/toolchain SHA and real browser parity are external gates.
 */
import {readFileSync,readdirSync,realpathSync,lstatSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
import {resolve,relative,join,posix,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {initialCssAssetStats} from './lib/initialCssBudget.mjs';
import {compareCssNetZero,cssBuildEvidence} from './compare-design-css-netzero-0985515.mjs';

function cssFileName(file){
 if(typeof file!=='string'||!file.endsWith('.css')||file.startsWith('/')||file.includes('\\')||
  file.split('/').some(part=>!part||part==='.'||part==='..')||posix.normalize(file)!==file){
  throw Error('Unsafe CSS asset path in build report: '+String(file));
 }
 return file;
}
function scanCss(root,dir=root,files=[]){
 for(const item of readdirSync(dir,{withFileTypes:true})){
  const full=join(dir,item.name);
  if(item.isSymbolicLink())throw Error('Symlink is not allowed in CSS artifact tree: '+full);
  if(item.isDirectory())scanCss(root,full,files);
  else if(item.isFile()&&item.name.endsWith('.css'))files.push(relative(root,full).split(sep).join('/'));
 }
 return files;
}
/** Read-only integrity check; report content cannot substitute for actual dist artifacts. */
export function verifyCssArtifacts(report,distDir){
 cssBuildEvidence(report);
 if(typeof distDir!=='string'||!distDir.trim())throw Error('Missing dist directory');
 if(lstatSync(resolve(distDir)).isSymbolicLink())throw Error('Symlink is not allowed as dist root');
 const root=realpathSync(resolve(distDir));
 if(!lstatSync(root).isDirectory())throw Error('dist path is not a directory');
 const declared=report.assets.filter(a=>a.extension==='.css');
 const actualFiles=scanCss(root).sort();
 const expectedFiles=declared.map(a=>cssFileName(a.file)).sort();
 if(JSON.stringify(actualFiles)!==JSON.stringify(expectedFiles)){
  throw Error('CSS file inventory drift: dist contains missing, extra or unreported CSS files');
 }
 const checked=[];
 for(const asset of declared){
  const file=cssFileName(asset.file);
  const full=join(root,...file.split('/'));
  const real=realpathSync(full);
  const info=lstatSync(real);
  if(!real.startsWith(root+sep)||!info.isFile())throw Error('CSS asset outside of dist: '+file);
  if(info.nlink!==1)throw Error('Hardlinked CSS artifact is not independent: '+file);
  const data=readFileSync(real);
  const metrics={
   bytes:data.length,
   gzipBytes:gzipSync(data,{level:9}).length,
   brotliBytes:brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:6}}).length,
   sha256:createHash('sha256').update(data).digest('hex'),
  };
  if(!/^[0-9a-f]{64}$/i.test(asset.sha256??''))throw Error('Missing or invalid CSS sha256: '+file);
  for(const [key,value] of Object.entries(metrics)){
   if(asset[key]!==value)throw Error('CSS artifact mismatch '+file+' / '+key);
  }
  checked.push({...metrics,file,extension:'.css'});
 }
 const indexPath=join(root,'index.html'),indexInfo=lstatSync(indexPath);
 if(!indexInfo.isFile())throw Error('Index HTML artifact must be a regular file');
 if(indexInfo.nlink!==1)throw Error('Hardlinked index HTML artifact is not independent');
 const indexHtml=readFileSync(indexPath,'utf8');
 const initial=initialCssAssetStats(indexHtml,checked);
 const fromReport=report.initialCssAssets;
 if(initial.entries.length!==fromReport.length)throw Error('Initial CSS reference count drift in built HTML');
 const byFile=new Map(fromReport.map(a=>[a.file,a]));
 for(const a of initial.entries){
  const expected=byFile.get(a.file);
  if(!expected||['bytes','gzipBytes','brotliBytes'].some(k=>expected[k]!==a[k])){
   throw Error('Initial CSS reference drift between built HTML and budget report: '+a.file);
  }
 }
 return {cssFiles:checked.length,initialCssFiles:initial.entries.length,
  sha256Verified:true,gzip9Verified:true,brotli6Verified:true,htmlCssReferencesVerified:true};
}

/** Reject reuse of one physical output tree; distinct trees alone do not prove source lineage. */
export function verifyCssArtifactPair(stable,stableDir,candidate,candidateDir){
 const a=realpathSync(resolve(stableDir)),b=realpathSync(resolve(candidateDir));
 if(a===b||a.startsWith(b+sep)||b.startsWith(a+sep))throw Error('Stable and candidate dist trees must be distinct and non-nested');
 return {base:verifyCssArtifacts(stable,stableDir),head:verifyCssArtifacts(candidate,candidateDir),result:compareCssNetZero(stable,candidate)};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  if(process.argv.length!==6)throw Error('Usage: node scripts/verify-design-css-artifacts-0985515.mjs <stable-budget.json> <stable-dist> <candidate-budget.json> <candidate-dist>');
  const a=statSync(process.argv[2]),b=statSync(process.argv[4]);
  if(!a.isFile()||!b.isFile()||(a.dev===b.dev&&a.ino===b.ino))throw Error('Stable and candidate budget reports must be distinct regular files');
  const stable=JSON.parse(readFileSync(process.argv[2],'utf8'));
  const candidate=JSON.parse(readFileSync(process.argv[4],'utf8'));
  const {base,head,result}=verifyCssArtifactPair(stable,process.argv[3],candidate,process.argv[5]);
  for(const row of result.rows)console.log(`${row.ok?'PASS':'FAIL'} ${row.label}: ${row.stable} -> ${row.candidate} (${row.delta>=0?'+':''}${row.delta})`);
  console.log(JSON.stringify({stable:base,candidate:head,cssSizeStatus:result.status},null,2));
  console.log('NOT VERIFIED: GitHub ref provenance, identical build toolchain, browser CSS parity, native iOS/VoiceOver, actual network or runtime memory.');
  if(result.status!=='PASS_CSS_NET_ZERO_ARTIFACTS')process.exitCode=1;
 }catch(error){console.error('FAIL_CSS_ARTIFACT_EVIDENCE: '+(error instanceof Error?error.message:String(error)));process.exitCode=1}
}
