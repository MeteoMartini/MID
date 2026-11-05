import {readFile,readdir,lstat,unlink,realpath} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {createHash} from 'node:crypto';

// Only the unreferenced 1024px native masters; all existing web/PWA sizes stay.
export const NATIVE_ICON_COPIES=Object.freeze(['light','dark'].map(theme=>Object.freeze({
 web:`mid-app-icon-${theme}-1024.png`,
 native:`ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-${theme[0].toUpperCase()+theme.slice(1)}-1024.png`,
})));
const textFile=/\.(?:html|css|[cm]?js|json|webmanifest|svg|txt|md|map)$/i;
const referenced=/mid-app-icon|AppIcon-(?:Light|Dark)-1024/i;
const hash=data=>createHash('sha256').update(data).digest('hex');
const inside=(file,directory)=>file===directory||file.startsWith(directory+sep);

/** Vite writeBundle only: source/native bytes are read, never modified. */
export async function omitNativeOnlyAppIconCopies(sourceRoot,outputDirectory){
 const root=await realpath(sourceRoot),out=await realpath(resolve(outputDirectory));
 if(inside(root,out)||inside(out,join(root,'public'))||inside(out,join(root,'ios')))throw Error('Native-icon output directory overlaps protected source directories');
 const files=[];
 async function walk(directory){for(const item of await readdir(directory,{withFileTypes:true})){
  if(item.isSymbolicLink())throw Error('Symlink in native-icon build output: '+item.name);
  const file=join(directory,item.name);if(item.isDirectory())await walk(file);else if(item.isFile())files.push(file);
 }}
 await walk(out);
 if(!files.includes(join(out,'index.html'))||!files.includes(join(out,'manifest.webmanifest')))throw Error('Native-icon pruning requires a complete web entry and manifest');
 for(const file of files)if(textFile.test(file)&&referenced.test(await readFile(file,'utf8')))throw Error('Native master is referenced by web output: '+file);
 const verified=[];
 // Validate BOTH copies before removing either one. Any future reference or
 // native/public divergence must stop the build, rather than remove a feature.
 for(const entry of NATIVE_ICON_COPIES){
  const source=join(root,'public',entry.web),native=join(root,entry.native),target=join(out,entry.web);
  for(const path of [source,native,target]){const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Native-icon copy is not a regular file: '+path)}
  const [a,b,c]=await Promise.all([readFile(source),readFile(native),readFile(target)]);
  if(!a.equals(b)||!a.equals(c))throw Error('Native/public/build master mismatch: '+entry.web);
  if(a.length<33||a.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||a.readUInt32BE(16)!==1024||a.readUInt32BE(20)!==1024)throw Error('Unexpected native master dimensions: '+entry.web);
  verified.push({file:entry.web,bytes:a.length,sha256:hash(a),target});
 }
 for(const item of verified)await unlink(item.target);
 return verified.map(({target,...item})=>item);
}
