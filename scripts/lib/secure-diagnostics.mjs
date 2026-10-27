import {mkdtemp,open,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

export async function writeRegressionTimings(report,base=process.env.RUNNER_TEMP||tmpdir()){
 const directory=await mkdtemp(path.join(base,'mid-regression-'));
 const filename=path.join(directory,'timings.json');
 await writeFile(filename,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
 return filename;
}

// Reserve the first report before collecting its screenshot. Later retries never
// overwrite it, including after an interrupted collection or a symlink collision.
export async function writeFirstDiagnostic(report,collect){
 let handle;
 try{handle=await open(report,'wx',0o600)}catch(error){if(error.code==='EEXIST')return false;throw error}
 try{await handle.writeFile(JSON.stringify(await collect(),null,2)+'\n');return true}
 finally{await handle.close()}
}
