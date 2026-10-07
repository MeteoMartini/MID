import {readdir,lstat,readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const [operation,directory]=process.argv.slice(2),root=process.cwd(),out=path.resolve(directory||'');
if(!['pack','restore'].includes(operation)||!directory||out===root||out.startsWith(root+path.sep))throw Error('Snapshot directory must be outside the checkout');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const excluded=name=>name==='.git'||name==='node_modules'||name==='MID-professional-replacement.zip';
async function files(dir=root,prefix=''){const result=[];for(const name of (await readdir(dir)).sort()){if(!prefix&&excluded(name))continue;const relative=prefix+name,full=path.join(dir,name),stat=await lstat(full);if(stat.isSymbolicLink())throw Error('Snapshot links forbidden: '+relative);if(stat.isDirectory())result.push(...await files(full,relative+'/'));else if(stat.isFile())result.push(relative);else throw Error('Unsupported snapshot entry: '+relative)}return result}
function safeName(name){return typeof name==='string'&&name!==''&&!path.isAbsolute(name)&&!name.split('/').some(p=>p==='..'||p===''||p==='.git'||p==='node_modules')&&name!=='MID-professional-replacement.zip'}
const archive=path.join(out,'release.tar.gz'),manifest=path.join(out,'manifest.json'),event=process.env.GITHUB_SHA;
if(!/^[a-f0-9]{40}$/.test(event||''))throw Error('Missing immutable event SHA');
if(operation==='pack'){
 await mkdir(out,{recursive:true});const inventory={};for(const file of await files())inventory[file]=hash(await readFile(path.join(root,file)));
 execFileSync('tar',['--exclude=./.git','--exclude=./node_modules','--exclude=./MID-professional-replacement.zip','-czf',archive,'-C',root,'.']);
 const bytes=Buffer.from(JSON.stringify({schema:1,event,archiveSha256:hash(await readFile(archive)),files:inventory})+'\n');await writeFile(manifest,bytes);
 const digest=hash(bytes);if(process.env.GITHUB_OUTPUT)await import('node:fs/promises').then(({appendFile})=>appendFile(process.env.GITHUB_OUTPUT,`snapshot_sha=${digest}\n`));console.log(`Release snapshot: ${Object.keys(inventory).length} files, event ${event}, manifest SHA-256 ${digest}`);
}else{
 const bytes=await readFile(manifest),expected=process.env.MID_SNAPSHOT_SHA;if(!/^[a-f0-9]{64}$/.test(expected||'')||hash(bytes)!==expected)throw Error('Snapshot manifest hash mismatch');
 const meta=JSON.parse(bytes);if(meta.schema!==1||meta.event!==event||hash(await readFile(archive))!==meta.archiveSha256)throw Error('Snapshot event/archive mismatch');
 const names=Object.keys(meta.files);if(!names.length||names.some(name=>!safeName(name)))throw Error('Unsafe snapshot manifest');
 // Delete only exact stale checkout files; Git metadata is never part of the snapshot.
 for(const file of await files())if(!Object.hasOwn(meta.files,file))await unlink(path.join(root,file));
 const zip=path.join(root,'MID-professional-replacement.zip');try{await unlink(zip)}catch(e){if(e.code!=='ENOENT')throw e}
 execFileSync('tar',['-xzf',archive,'--no-same-owner','-C',root]);
 const actual=await files();if(actual.length!==names.length||actual.some(name=>!Object.hasOwn(meta.files,name)))throw Error('Snapshot inventory mismatch');
 for(const name of names)if(hash(await readFile(path.join(root,name)))!==meta.files[name])throw Error('Snapshot file mismatch: '+name);
 console.log(`Verified release snapshot: ${names.length} files, exact event ${event}`);
}
