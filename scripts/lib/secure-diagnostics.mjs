import {mkdtemp,open,rename,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

export async function writeRegressionTimings(report,base=process.env.RUNNER_TEMP||tmpdir()){
 const directory=await mkdtemp(path.join(base,'mid-regression-'));
 const filename=path.join(directory,'timings.json');
 await writeFile(filename,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 return filename;
}

// Reserve the FIRST error with an exclusive, private file. An immediately
// valid placeholder survives an interrupted collector. The fully staged JSON
// replaces it atomically, rather than exposing partially written diagnostics.
export async function writeFirstDiagnostic(report,collect){
 let handle,stagingDirectory;
 try{handle=await open(report,'wx',0o600)}
 catch(error){if(error.code==='EEXIST')return false;throw error}
 try{
  await handle.writeFile('{"schema":1,"collectionState":"capturing","screenshotAvailable":false}\n');
  await handle.sync();
  let result;
  try{
   const diagnostic=await collect();
   if(!diagnostic||typeof diagnostic!=='object'||Array.isArray(diagnostic))throw new TypeError('Invalid diagnostic payload');
   result=JSON.stringify(diagnostic,null,2);
   if(typeof result!=='string'||!result.startsWith('{'))throw new TypeError('Invalid serialized diagnostic');
  }catch{
   // No raw exception message, provider URL or token may enter the fallback.
   result=JSON.stringify({schema:1,collectionFailed:true,screenshotAvailable:false});
  }
  stagingDirectory=await mkdtemp(path.join(path.dirname(report),'.mid-diagnostic-stage-'));
  const staged=path.join(stagingDirectory,'report.json');
  await writeFile(staged,result+'\n',{flag:'wx',mode:0o600});
  await handle.close();handle=null;
  await rename(staged,report);
  return true;
 }finally{
  if(handle)await handle.close().catch(()=>undefined);
  if(stagingDirectory)await rm(stagingDirectory,{recursive:true,force:true,maxRetries:5,retryDelay:40});
 }
}
