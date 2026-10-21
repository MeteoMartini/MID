import {build} from 'esbuild';
import {readFile,readdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=resolve(process.argv[2]||'ruc-horizon-evidence'),temp=await mkdtemp(resolve(tmpdir(),'mid-ruc-composites-'));
try{
 const bundle=await build({stdin:{contents:"export * from './src/rucSynopticFields';export * from './src/nativeSynopticFields';export * from './src/cloudWeatherData';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
 const module=resolve(temp,'validate.mjs');await writeFile(module,bundle.outputFiles[0].text);const m=await import(module);
 const report=JSON.parse(await readFile(resolve(root,'report.json'),'utf8'));if(!report.pilotVerified||report.runs.length!==3)throw Error('Three real RUC runs required');
 let frames=0,cells=0;
 for(const run of report.runs){
  const folder=resolve(root,run.run.replace(/[^A-Za-z0-9_-]/g,''),'composites'),index=JSON.parse(await readFile(resolve(folder,'index.json'),'utf8')),model=m.validateRucSynopticIndex(index);
  if(run.rucCompositeFrames!==28||![252,280].includes(run.rucCompositeSources))throw Error('Incomplete native composite proof');
  for(const ref of model.frames){
   const wire=await readFile(resolve(folder,ref.file));if(wire.length!==ref.bytes||createHash('sha256').update(wire).digest('hex')!==ref.sha256)throw Error('RUC composite SHA/size mismatch');
   const decoded=gunzipSync(wire);if(decoded.length!==ref.decodedBytes)throw Error('RUC composite decoded size');
   const field=m.validateSynopticField(JSON.parse(decoded),'icon-d2-ruc',model,ref),cloud=m.synopticCloudWeather(field);
   if(cloud.model!=='icon-d2-ruc'||cloud.time!==field.time||cloud.run!==field.run)throw Error('RUC model/run/time drift');
   frames++;cells+=field.thetae.length;
  }
 }
 const proof={schema:'mid.ruc.composites-browser-proof.v1',runs:3,frames,cells,realGribSources:report.runs.reduce((sum,r)=>sum+r.rucCompositeSources,0),hashesAndBrowserDecoderVerified:true};
 await writeFile(resolve(root,'composites-browser-proof.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
}finally{await rm(temp,{recursive:true,force:true})}
