#!/usr/bin/env node
/** SHA-fenced source transform; intended for Codex/Work authorized branch only. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const BASE='4d3051f80a17a180c3952c83bf5afa51623b1eb3';
const EXPECT={
 'src/cloudWeatherData.ts':'013a2382efcea883c8f101317621e07f4f46616d',
 'src/cloudWeatherIsobars.ts':'b7703fe38f6d184fbc589fb8d38afd5717607817',
 'src/UnifiedWeatherMap.tsx':'fc560fe37c63f0847eb66553affcbccc778bf98e',
 'src/NativeModelMap.tsx':'d03c2dca5d15ac234da501797188e49bafda76c2'
};
const git=(repo,...args)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
const sha=s=>createHash('sha1').update(`blob ${Buffer.byteLength(s)}\0`).update(s).digest('hex');
function exact(original,oldText,newText,desc){
 const count=original.split(oldText).length-1;
 if(count!==1)throw new Error(`Stop ${desc}: expected exactly one unchanged source anchor, found ${count}`);
 return original.replace(oldText,newText);
}
export function updateSources(source){
 const results={...source};let s=results['src/cloudWeatherData.ts'];
 s=exact(s,"import type {NativeField,NativeIndex", "import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety';\nimport type {NativeField,NativeIndex",'durable import');
 for(const key of ['CLOUD_WEATHER_ISOBARS_KEY','CLOUD_WEATHER_ISOHEIGHTS_KEY']){
  s=exact(s,`localStorage.getItem(${key})`,`readDurableStorageValue(${key})`,`${key} read`);
  s=exact(s,`localStorage.setItem(${key},String(enabled))`,`writeDurableStorageValue(${key},String(enabled))`,`${key} write`);
 }
 results['src/cloudWeatherData.ts']=s;
 s=results['src/cloudWeatherIsobars.ts'];
 s=exact(s,"field.modelId!==undefined||field.run!==data.run", "(field.modelId!==undefined&&field.modelId!=='icon-d2')||field.run!==data.run", 'native-v2 model id');
 results['src/cloudWeatherIsobars.ts']=s;
 s=results['src/UnifiedWeatherMap.tsx'];
 const old="const needsSynopticCloud=cloudIsoheights||(showIsobars&&(!cloudPressureTime||!catalog?.index.products.pressure?.frames.some(f=>f.time===cloudPressureTime)));";
 const next="const nativePressureFrameListed=Boolean(cloudPressureTime&&catalog?.index.products.pressure?.frames.some(f=>f.time===cloudPressureTime));\n const nativePressureMissing=Boolean(!nativePressureFrameListed||pressureError||(pressureField?.run===cloudData?.run&&pressureField?.time===cloudData?.time&&!pressureField.isobars.length));\n const needsSynopticCloud=cloudIsoheights||(showIsobars&&nativePressureMissing);";
 s=exact(s,old,next,'run-matched synoptic fallback');
 const hook="{isCloudWeather&&eligibleCloudIsobarModel(modelId)&&<><label className=\"unified-check\"><input type=\"checkbox\" checked={cloudIsobars} onChange={e=>chooseCloudIsobars(e.target.checked)}/>Isobaren · {modelLabel} · gleicher Lauf und Termin</label><label className=\"unified-check\"><input type=\"checkbox\" checked={cloudIsoheights} onChange={e=>chooseCloudIsoheights(e.target.checked)}/>Isohypsen · gleicher Lauf und Termin</label></>}";
 const adjusted=hook.replace('</>}',"{isCloudWeather&&cloudWeather.ready&&cloudIsobars&&!linesActive&&<p role=\"status\">Isobaren eingeschaltet; für diesen Modelltermin noch kein geprüfter, laufgleicher Druckkontursatz verfügbar.</p>}{isCloudWeather&&cloudWeather.ready&&cloudIsoheights&&!heightsActive&&<p role=\"status\">Isohypsen eingeschaltet; für diesen Modelltermin noch keine geprüfte 500-hPa-Höhenlinie verfügbar.</p>}</>}");
 s=exact(s,hook,adjusted,'user-visible per-timestep contour status');
 results['src/UnifiedWeatherMap.tsx']=s;
 s=results['src/NativeModelMap.tsx'];
 s=exact(s,'data={isobars} layers={adaptiveContourLayers',"data={kind==='sigwx'?nativeIsobarFeatures(cloudContours):isobars} layers={adaptiveContourLayers",'native sigwx contours');
 results['src/NativeModelMap.tsx']=s;
 return results;
}
if(process.argv[1]?.endsWith('apply-cloud-iso-fix.mjs')){
 const [mode,dir]=process.argv.slice(2);
 if(mode!=='--apply'||!dir){console.error('Usage: node apply-cloud-iso-fix.mjs --apply /path/to/authorized/MID');process.exit(2)}
 try{
  const branch=git(dir,'branch','--show-current');
  if(!/^(chatgpt|codex)\/v0\.9\.85\.428-[a-z0-9-]+$/.test(branch))throw new Error('Only authorized .428 integration branch');
  for(const ref of ['HEAD','main','mid-stable'])if(git(dir,'rev-parse',ref)!==BASE)throw new Error(`${ref} drift; rebase through authorized workflow, never force`);
  if(git(dir,'status','--porcelain'))throw new Error('Worktree is not clean: preserve concurrent changes');
  const originals={};for(const [path,want] of Object.entries(EXPECT)){
   const old=readFileSync(join(dir,path),'utf8');if(sha(old)!==want)throw new Error(`Git blob drift ${path}`);originals[path]=old;
  }
  const rewritten=updateSources(originals);
  for(const [path,code] of Object.entries(rewritten))writeFileSync(join(dir,path),code);
  console.log('Applied only 4 source files. No commit, release, version, CI, or protected branch updated.');
 }catch(e){console.error('FAIL CLOSED:',e.message);process.exit(2)}
}
