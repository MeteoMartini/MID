import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,writeFile,readFile,rm,access,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {NATIVE_ICON_COPIES,omitNativeOnlyAppIconCopies} from './lib/nativeOnlyWebAssets.mjs';
const directory=await mkdtemp(join(tmpdir(),'mid-native-icon-'));
let cases=0;
async function fixture(name){const root=join(directory,name),out=join(root,'dist');await mkdir(join(root,'public'),{recursive:true});await mkdir(out,{recursive:true});await writeFile(join(out,'index.html'),'<link rel="manifest" href="manifest.webmanifest">');await writeFile(join(out,'manifest.webmanifest'),JSON.stringify({icons:[{src:'mid-icon-dark-512.png',sizes:'512x512'}]}));for(const entry of NATIVE_ICON_COPIES){await mkdir(join(root,entry.native,'..'),{recursive:true});for(const target of [join(root,'public',entry.web),join(root,entry.native),join(out,entry.web)])await cp(join('public',entry.web),target)}return{root,out}}
async function preserved(out){for(const {web} of NATIVE_ICON_COPIES)await access(join(out,web))}
try{
 const {root,out}=await fixture('valid');const before=await Promise.all(NATIVE_ICON_COPIES.map(e=>readFile(join(root,'public',e.web))));const report=await omitNativeOnlyAppIconCopies(root,out);assert.equal(report.length,2);assert.equal(report.reduce((n,x)=>n+x.bytes,0),1831340);for(const [i,e] of NATIVE_ICON_COPIES.entries()){assert.deepEqual(await readFile(join(root,'public',e.web)),before[i]);assert.deepEqual(await readFile(join(root,e.native)),before[i]);await assert.rejects(access(join(out,e.web)))}cases++;
 for(const extension of ['html','js','css','json','webmanifest','svg','md']){const {root,out}=await fixture(extension);await writeFile(join(out,'reference.'+extension),'./mid-app-icon-light-1024.png');await assert.rejects(omitNativeOnlyAppIconCopies(root,out),/referenced/);await preserved(out);cases++}
 {const {root,out}=await fixture('dynamic');await writeFile(join(out,'app.js'),'`mid-app-icon-${theme}-1024.png`');await assert.rejects(omitNativeOnlyAppIconCopies(root,out),/referenced/);await preserved(out);cases++}
 {const {root,out}=await fixture('native-diverged');await writeFile(join(root,NATIVE_ICON_COPIES[1].native),'wrong');await assert.rejects(omitNativeOnlyAppIconCopies(root,out),/mismatch/);await preserved(out);cases++}
 {const {root,out}=await fixture('dist-diverged');await writeFile(join(out,NATIVE_ICON_COPIES[1].web),'wrong');await assert.rejects(omitNativeOnlyAppIconCopies(root,out),/mismatch/);await preserved(out);cases++}
 {const {root,out}=await fixture('incomplete');await rm(join(out,'manifest.webmanifest'));await assert.rejects(omitNativeOnlyAppIconCopies(root,out),/complete web/);await preserved(out);cases++}
 {const {root,out}=await fixture('symlink');await symlink(join(root,'public'),join(out,'unsafe'));await assert.rejects(omitNativeOnlyAppIconCopies(root,out),/Symlink/);await preserved(out);cases++}
 {const {root,out}=await fixture('source-target');await assert.rejects(omitNativeOnlyAppIconCopies(root,join(root,'public')),/overlaps/);await preserved(out);cases++}
 const config=await readFile('vite.config.ts','utf8');assert.match(config,/apply:'build'/);assert.match(config,/async writeBundle\(\)/);assert.match(config,/omitNativeOnlyAppIconCopies\(nativeIconRoot,nativeIconOutput\)/);cases++;
 console.log(`PASS ${cases} native-master packaging cases: references, divergence, incomplete output, symlinks and source overlap fail closed; public and iOS bytes preserved.`);
}finally{await rm(directory,{recursive:true,force:true})}
