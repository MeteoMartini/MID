import assert from 'node:assert/strict';
import {build,loadConfigFromFile} from 'vite';
import {mkdtemp,readFile,readdir,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {NATIVE_ICON_COPIES} from './lib/nativeOnlyWebAssets.mjs';

// Diagnostic A/B build only. The production config has no bypass flag.
const control=await mkdtemp(join(tmpdir(),'mid-native-master-control-'));
try{
 const loaded=await loadConfigFromFile({command:'build',mode:'production'},'vite.config.ts',process.cwd());
 assert.ok(loaded,'Vite config required');
 const config=loaded.config,plugins=config.plugins.filter(p=>p?.name!=='mid-native-only-icon-copies');
 assert.equal(plugins.length,config.plugins.length-1,'Exactly one packaging plugin must be omitted from the control build');
 await build({...config,configFile:false,plugins,build:{...config.build,outDir:control,emptyOutDir:true}});
 async function inventory(root){const files=new Map();async function walk(directory){for(const e of await readdir(directory,{withFileTypes:true})){const file=join(directory,e.name);if(e.isDirectory())await walk(file);else{const bytes=await readFile(file);files.set(relative(root,file),{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')})}}}await walk(root);return files}
 const before=await inventory(control),after=await inventory('dist');let bytesRemoved=0;
 for(const {web} of NATIVE_ICON_COPIES){assert.ok(before.has(web));assert.ok(!after.has(web));bytesRemoved+=before.get(web).bytes;before.delete(web)}
 assert.ok(after.delete('mid-build-identity.json'),'Production build identity must be present; Vite API control does not emit post-build commit metadata');
 assert.equal(before.size,after.size,'No other output may disappear');
 for(const [file,value]of before)assert.deepEqual(after.get(file),value,'Retained web output differs: '+file);
 const report={schema:1,version:JSON.parse(await readFile('package.json','utf8')).version,control:'Same current source/config; precisely native-master packaging plugin disabled inside diagnostic control build only',result:'byte-identical retained web output',filesCompared:before.size,removed:NATIVE_ICON_COPIES.map(x=>x.web),bytesRemoved,excludedFromComparison:['mid-build-identity.json (post-build commit metadata, not emitted by Vite API)'],assets:[...after].map(([file,value])=>({file,...value}))};
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/native-only-web-assets-equivalence.json',JSON.stringify(report,null,2)+'\n');
 console.log(`PASS native-master control build: ${report.filesCompared} retained files byte-identical; ${bytesRemoved} native master bytes omitted.`);
}finally{await rm(control,{recursive:true,force:true})}
