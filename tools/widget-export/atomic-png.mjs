import {mkdir,mkdtemp,rename,rm,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';

/**
 * Atomically publish already validated screenshot bytes without removing the
 * previous successful capture. The staging directory is on the same filesystem.
 * A failed replacement (also on Windows) preserves the old file and propagates.
 */
export async function publishAtomicPng(output,bytes,renameFile=rename){
 const parent=path.dirname(output);
 await mkdir(parent,{recursive:true});
 const staging=await mkdtemp(path.join(parent,'.mid-widget-png-'));
 const staged=path.join(staging,'complete.png');
 try{
  await writeFile(staged,bytes,{flag:'wx',mode:0o600});
  await renameFile(staged,output);
  return await stat(output);
 }finally{
  await rm(staging,{recursive:true,force:true,maxRetries:5,retryDelay:40});
 }
}
