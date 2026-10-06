#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,readFile,rm,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {widgetUrlExportVariants} from '../../src/widgetUrlExports.ts';

function argument(name,fallback=''){const index=process.argv.indexOf(`--${name}`);return index>=0?String(process.argv[index+1]??''):fallback}

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.resolve(argument('output',path.join(process.cwd(),'MID-Widgets')));
const capture=path.join(root,'tools','widget-export','capture-widget.mjs');
const sourceStableSha=String(process.env.MID_STABLE_SHA||'').trim();
const publicVersion=String(process.env.MID_PUBLIC_VERSION||'').trim();
const packageJson=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const version=String(packageJson.version||'').trim();

if(!version)throw new Error('MID-Version fehlt in package.json.');
if(!sourceStableSha)throw new Error('MID_STABLE_SHA fehlt; automatischer Export muss an einen verifizierten Stable-SHA gebunden sein.');
if(!publicVersion||publicVersion!==version)throw new Error(`Öffentliche MID-Version (${publicVersion||'unbekannt'}) stimmt nicht mit v${version} überein.`);

const variants=widgetUrlExportVariants('https://www.midwx.app/');
if(variants.length!==12)throw new Error(`Kanonische Widget-Matrix muss genau 12 Varianten enthalten, gefunden: ${variants.length}.`);

const preferredLocationOrder=new Map([['malatya',0],['kuerecik',1],['amari',2]]);
variants.sort((a,b)=>{
 const location=(preferredLocationOrder.get(a.location.slug)??99)-(preferredLocationOrder.get(b.location.slug)??99);
 if(location)return location;
 const view=(a.view==='curve'?0:1)-(b.view==='curve'?0:1);
 if(view)return view;
 return a.theme.localeCompare(b.theme);
});

function filenameFor(item){const view=item.view==='curve'?'kurve':'kompakt';return `${item.location.slug}-${view}-${item.days}d-${item.theme}.png`}
function pngMetadata(bytes){
 if(bytes.length<20000||bytes[0]!==0x89||bytes[1]!==0x50||bytes[2]!==0x4e||bytes[3]!==0x47||bytes[4]!==0x0d||bytes[5]!==0x0a||bytes[6]!==0x1a||bytes[7]!==0x0a)throw new Error(`Ungültige PNG-Datei (${bytes.length} Byte).`);
 if(bytes.subarray(12,16).toString('ascii')!=='IHDR')throw new Error('PNG-IHDR fehlt.');
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(width<100||height<100||width>10000||height>10000)throw new Error(`Unplausible PNG-Abmessungen ${width}×${height}.`);
 return{width,height};
}
const captureAttempts=3;
const captureTimeoutSeconds=180;
const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
function runCaptureOnce(url,target){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[capture,'--url',url,'--output',target,'--width','1500','--height','1200','--timeout',String(captureTimeoutSeconds)],{stdio:'inherit'});
  child.once('error',reject);
  child.once('exit',code=>code===0?resolve():reject(new Error(`capture-widget.mjs endete mit Exit-Code ${code}.`)));
 });
}
async function runCapture(url,target){
 let lastError;
 for(let attempt=1;attempt<=captureAttempts;attempt++){
  await rm(target,{force:true});
  await rm(`${target}.part.png`,{force:true});
  if(attempt>1)await sleep(Math.min(5000,attempt*1500));
  console.log(`Widget-Render ${path.basename(target)}: Versuch ${attempt}/${captureAttempts} …`);
  try{
   await runCaptureOnce(url,target);
   return;
  }catch(error){
   lastError=error;
   if(attempt<captureAttempts)console.warn(`Widget-Render ${path.basename(target)} fehlgeschlagen; erneuter Versuch folgt: ${error?.message||error}`);
  }
 }
 throw new Error(`Widget-Rendering endgültig fehlgeschlagen nach ${captureAttempts} Versuchen: ${path.basename(target)} (${lastError?.message||lastError||'unbekannter Fehler'})`,{cause:lastError});
}

await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const files=[];
for(const item of variants){
 const filename=filenameFor(item),target=path.join(output,filename);
 console.log(`Rendere ${filename} …`);
 await runCapture(item.url,target);
 const bytes=await readFile(target),{width,height}=pngMetadata(bytes),info=await stat(target);
 const sha256=createHash('sha256').update(bytes).digest('hex');
 files.push({
  filename,
  location:{slug:item.location.slug,name:item.location.name,latitude:item.location.latitude,longitude:item.location.longitude},
  view:item.view,days:item.days,theme:item.theme,temperatureColors:item.temperatureColors,
  showWind:item.showWind,showRain:item.showRain,showSunshine:item.showSunshine,showHazards:item.showHazards,
  sourceUrl:item.url,bytes:info.size,width,height,sha256
 });
}

const expectedNames=new Set([
 'malatya-kurve-7d-light.png','malatya-kurve-7d-dark.png','malatya-kompakt-5d-light.png','malatya-kompakt-5d-dark.png',
 'kuerecik-kurve-7d-light.png','kuerecik-kurve-7d-dark.png','kuerecik-kompakt-5d-light.png','kuerecik-kompakt-5d-dark.png',
 'amari-kurve-7d-light.png','amari-kurve-7d-dark.png','amari-kompakt-5d-light.png','amari-kompakt-5d-dark.png'
]);
for(const file of files)expectedNames.delete(file.filename);
if(expectedNames.size)throw new Error(`Widget-Dateien fehlen: ${[...expectedNames].join(', ')}`);

const manifest={schema:1,generatedAt:new Date().toISOString(),midVersion:version,stableSha:sourceStableSha,publicVersion,sourceHost:'https://www.midwx.app/',count:files.length,files};
await writeFile(path.join(output,'manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);
await writeFile(path.join(output,'SHA256SUMS.txt'),files.map(file=>`${file.sha256}  ${file.filename}`).join('\n')+'\n');
console.log(`MID v${version}: ${files.length} Widget-PNGs vollständig validiert und manifestiert.`);
