import assert from 'node:assert/strict';
import {readFile,readdir,lstat,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const modulePath=fileURLToPath(import.meta.url);
export const WEB_UNUSED_NATIVE_ICONS=Object.freeze(['mid-app-icon-light-1024.png','mid-app-icon-dark-1024.png']);
const RUNTIME_EXTENSIONS=new Set(['.js','.css','.html','.json','.webmanifest','.xml','.svg','.txt','.map']);
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
async function runtimeFiles(root,relative=''){
 const items=await readdir(path.join(root,relative),{withFileTypes:true}),files=[];
 for(const item of items){
  const local=path.join(relative,item.name);
  if(item.isSymbolicLink())throw new Error('Symlink im MID-Web-Build verboten: '+local);
  if(item.isDirectory())files.push(...await runtimeFiles(root,local));
  else if(item.isFile()&&RUNTIME_EXTENSIONS.has(path.extname(item.name).toLowerCase()))files.push(local);
 }
 return files;
}
/** Stage-only: native 1024px PNGs stay byte-identical in public/ and iOS catalogs.
 * The Web/PWA manifest uses 192/512px icons. Removing a referenced copy is forbidden.
 */
export async function pruneUnusedWebNativeIcons(distRoot){
 const root=path.resolve(distRoot),targets=WEB_UNUSED_NATIVE_ICONS.map(name=>path.join(root,name));
 const originals=await Promise.all(targets.map(file=>readFile(file)));
 for(let index=0;index<originals.length;index++){
  const data=originals[index],file=targets[index];
  if(data.length<33||!data.subarray(0,8).equals(SIGNATURE)||data.toString('ascii',12,16)!=='IHDR'||data.readUInt32BE(16)!==1024||data.readUInt32BE(20)!==1024)
   throw new Error('High-resolution native source icon lacks valid 1024px PNG header: '+path.basename(file));
  if(!(await lstat(file)).isFile())throw new Error('Expected regular web-icon copy: '+path.basename(file));
 }
 const paths=await runtimeFiles(root);
 // No deletion happens before ALL runtime references are checked.
 for(const relative of paths){
  const data=await readFile(path.join(root,relative),'utf8');
  for(const name of WEB_UNUSED_NATIVE_ICONS)if(data.includes(name)||data.includes(encodeURIComponent(name)))
   throw new Error('Web/runtime still references native-only icon '+name+' in '+relative);
 }
 for(const file of targets)await unlink(file);
 const omittedBytes=originals.reduce((sum,data)=>sum+data.length,0);
 console.log('MID Web-only native icon exclusion: '+targets.length+' unreferenced web copies; '+omittedBytes+' raw bytes avoided. Native/branding originals unchanged.');
 return {removed:targets.length,omittedBytes};
}
if(process.argv[1]&&path.resolve(process.argv[1])===modulePath){
 await pruneUnusedWebNativeIcons(path.resolve(path.dirname(modulePath),'../dist'));
}
