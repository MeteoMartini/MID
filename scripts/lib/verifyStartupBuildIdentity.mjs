/** Verify the entire immutable dist fingerprint before measuring startup assets.
 * Matches scripts/write-build-identity.mjs; no network or release write.
 */
import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';

export async function verifyStartupBuildIdentity(root,identity){
 if(identity?.schema!=='mid.web-build-identity.v1'||
   !/^\d+\.\d+\.\d+\.\d+$/.test(identity.version??'')||
   !/^[a-f0-9]{40}$/.test(identity.sourceGitSha??'')||
   !/^[a-f0-9]{64}$/.test(identity.assetsSha256??'')||
   !Number.isSafeInteger(identity.assetCount)||identity.assetCount<1){
  throw Error('Missing or malformed SHA-bound MID build identity');
 }
 const names=[];
 async function walk(directory,relative=''){
  for(const entry of await readdir(path.join(directory,relative),{withFileTypes:true})){
   const name=path.posix.join(relative.split(path.sep).join('/'),entry.name);
   if(entry.isSymbolicLink())throw Error('Symlink in production dist: '+name);
   if(entry.isDirectory())await walk(directory,name);
   else if(entry.isFile()&&name!=='mid-build-identity.json')names.push(name);
   else if(!entry.isFile())throw Error('Unsupported production asset: '+name);
  }
 }
 await walk(root);
 names.sort();
 if(names.length!==identity.assetCount)throw Error(`MID build asset count mismatch: ${names.length} != ${identity.assetCount}`);
 const fingerprint=createHash('sha256');
 for(const filename of names){
  const data=await readFile(path.join(root,filename));
  fingerprint.update(filename+'\u0000'+createHash('sha256').update(data).digest('hex')+'\n');
 }
 const observed=fingerprint.digest('hex');
 if(observed!==identity.assetsSha256)throw Error('MID build asset fingerprint mismatch');
 return {sha256:observed,assetCount:names.length};
}
