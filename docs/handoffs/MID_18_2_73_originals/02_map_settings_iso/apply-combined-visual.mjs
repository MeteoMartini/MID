/** Atomically transform 6 unchanged .427 source files in an authorized .428 branch.
 * Does NOT push, commit, version-bump, merge, or deploy. CI/manual acceptance required.
 */
import {pseudoOnly} from './apply-pseudo-only.mjs';
import {updateSources} from './apply-cloud-iso-fix.mjs';
import {addSynopWiring} from '../03_synop_symbols/synopWiring.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const BASE='4d3051f80a17a180c3952c83bf5afa51623b1eb3';
const SELF=dirname(fileURLToPath(import.meta.url));
const SYNOP_FILES={
 'synopModelPlot.ts':'255eab97837664545b45dc0db93050fedb4743ae0b8ef85dc33a9f44bdb286d4',
 'CloudWwMarkers.tsx':'8b47b2fd2c7006d0386d0cca805acec6b8daa20338f688801d0ac145843993e2',
 'midSynopMarkers.css':'536b8c22dc5adbd3cb608f7cacc64be9043420ea25f036f4feedfc635d49a753'
};
const BLOBS={
 'src/cloudWeatherData.ts':'013a2382efcea883c8f101317621e07f4f46616d',
 'src/cloudWeatherIsobars.ts':'b7703fe38f6d184fbc589fb8d38afd5717607817',
 'src/CloudSignificantWeather.tsx':'6954fbec11967576677050304c3f53c8b58531ef',
 'src/UnifiedWeatherMap.tsx':'fc560fe37c63f0847eb66553affcbccc778bf98e',
 'src/NativeModelMap.tsx':'d03c2dca5d15ac234da501797188e49bafda76c2',
 'src/cloudWeatherExport.ts':'f93ab078db7057a80977acea166ec74f3341cfa8'
};
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
const hash=data=>createHash('sha1').update(`blob ${Buffer.byteLength(data)}\0`).update(data).digest('hex');
const [arg,repo]=process.argv.slice(2);if(arg!=='--apply'||!repo){console.error('Usage: node apply-combined-visual.mjs --apply /path/to/fresh-MID-branch');process.exit(2)}
try{
 const branch=git(repo,'branch','--show-current');if(!/^(chatgpt|codex)\/v0\.9\.85\.428-[a-z0-9-]+$/.test(branch))throw Error('Unauthorized branch');
 for(const ref of ['main','mid-stable','HEAD'])if(git(repo,'rev-parse',ref)!==BASE)throw Error(ref+' SHA drift');
 if(git(repo,'status','--porcelain'))throw Error('Uncommitted or unrelated changes present; fail closed');
 const originals={};for(const [path,want] of Object.entries(BLOBS)){const data=readFileSync(join(repo,path),'utf8');if(hash(data)!==want)throw Error('Original blob drift '+path);originals[path]=data}
 const updated=addSynopWiring(updateSources(pseudoOnly(originals)));
 const additions={};
 for(const [file,wantSha] of Object.entries(SYNOP_FILES)){
  const dest=join(repo,'src',file),src=join(SELF,'../03_synop_symbols',file);
  if(git(repo,'ls-files','--',`src/${file}`))throw Error(`Overlapping source path: src/${file}`);
  const data=readFileSync(src);
  if(createHash('sha256').update(data).digest('hex')!==wantSha)throw Error(`Supplied SYNOP kit drift: ${file}`);
  additions[dest]=data;
 }
 for(const [path,content] of Object.entries(updated))writeFileSync(join(repo,path),content);
 for(const [dest,data] of Object.entries(additions))writeFileSync(dest,data);
 console.log('6 changed originals and 3 new SYNOP symbol sources prepared. No commit, version bump or release. Full MID TS/build/Browser/Heavy gates REQUIRED.');
}catch(e){console.error('FAIL CLOSED: '+e.message);process.exit(2)}
