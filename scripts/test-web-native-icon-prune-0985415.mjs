import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pruneUnusedWebNativeIcons,WEB_UNUSED_NATIVE_ICONS} from './prune-unused-web-native-icons-0985415.mjs';

const png=()=>{const buffer=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(buffer);buffer.writeUInt32BE(13,8);buffer.write('IHDR',12);buffer.writeUInt32BE(1024,16);buffer.writeUInt32BE(1024,20);return buffer};
const dir=await mkdtemp(path.join(tmpdir(),'mid-web-native-assets-'));
async function reset(){
 await rm(path.join(dir,'dist'),{recursive:true,force:true});await mkdir(path.join(dir,'dist','assets'),{recursive:true});
 for(const name of WEB_UNUSED_NATIVE_ICONS)await writeFile(path.join(dir,'dist',name),png());
 await writeFile(path.join(dir,'dist','index.html'),'<link rel="manifest" href="./manifest.webmanifest">');
 await writeFile(path.join(dir,'dist','manifest.webmanifest'),JSON.stringify({icons:[{src:'./mid-icon-dark-512.png',sizes:'512x512'}]}));
 await writeFile(path.join(dir,'dist','assets','main.js'),"console.log('MID offline assets')");
 await writeFile(path.join(dir,'dist','mid-icon-dark-512.png'),png());
}
try{
 await reset();
 const ok=await pruneUnusedWebNativeIcons(path.join(dir,'dist'));
 assert.equal(ok.removed,2);assert.equal(ok.omittedBytes,66);
 for(const name of WEB_UNUSED_NATIVE_ICONS)await assert.rejects(stat(path.join(dir,'dist',name)),{code:'ENOENT'});
 assert.ok((await stat(path.join(dir,'dist','mid-icon-dark-512.png'))).isFile(),'PWA manifest icon must remain');
 for(const extension of ['.js','.html','.webmanifest']){
  await reset();
  const relative=extension==='.js'?'assets/main.js':extension==='.html'?'index.html':'manifest.webmanifest';
  await writeFile(path.join(dir,'dist',relative),'./mid-app-icon-light-1024.png');
  await assert.rejects(pruneUnusedWebNativeIcons(path.join(dir,'dist')),/still references native-only icon/);
  for(const name of WEB_UNUSED_NATIVE_ICONS)assert.ok((await stat(path.join(dir,'dist',name))).isFile(),'Must fail closed and leave ALL copies');
 }
 await reset();
 await writeFile(path.join(dir,'dist',WEB_UNUSED_NATIVE_ICONS[1]),'wrong data');
 await assert.rejects(pruneUnusedWebNativeIcons(path.join(dir,'dist')),/1024px PNG header/);
 const [manifest,html,sw,legacy,app,sourceLight,sourceDark]=await Promise.all([
  readFile('public/manifest.webmanifest','utf8'),readFile('index.html','utf8'),
  readFile('public/service-worker.js','utf8'),readFile('public/sw.js','utf8'),
  readFile('src/App.tsx','utf8'),stat('public/mid-app-icon-light-1024.png'),stat('public/mid-app-icon-dark-1024.png')
 ]);
 for(const content of [manifest,html,sw,legacy,app])for(const name of WEB_UNUSED_NATIVE_ICONS)assert.ok(!content.includes(name),'Live PWA/boot must not use excluded web copies');
 assert.ok(sourceLight.size>100000&&sourceDark.size>100000,'Original 1024px brand images remain in repository/native source');
 const pkg=JSON.parse(await readFile('package.json','utf8')),base=JSON.parse(await readFile('MID_BASELINE.json','utf8'));
 const self='scripts/test-web-native-icon-prune-0985415.mjs';
 for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(base[key].includes(self),self+' missing in '+key);
 assert.ok(pkg.scripts['verify:vite'].includes('prune-unused-web-native-icons-0985415.mjs && node scripts/write-build-identity.mjs'),'Prune must precede SHA-bound build identity, not skip the latter');
 console.log('MID web/native brand boundary: 1024 originals retained, unused web-only copies omitted, referenced/malformed copies fail closed.');
}finally{await rm(dir,{recursive:true,force:true});}
