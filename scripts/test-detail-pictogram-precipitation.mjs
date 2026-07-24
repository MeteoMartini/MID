import {rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.detail-pictogram-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',[
 'src/precipitation.ts',
 'src/detailPictograms.ts',
 '--target','ES2022',
 '--module','ES2022',
 '--moduleResolution','Bundler',
 '--strict',
 '--skipLibCheck',
 '--outDir','.detail-pictogram-test'
],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const precipitationModule=await import(`${pathToFileURL(path.join(outDir,'precipitation.js')).href}?v=${Date.now()}`);
const pictogramModule=await import(`${pathToFileURL(path.join(outDir,'detailPictograms.js')).href}?v=${Date.now()}`);
const {precipitationParts}=precipitationModule;
const {representativeDetailPictograms}=pictogramModule;

const sample=(overrides={})=>({precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0,humidity:70,cloud:20,lowCloud:10,...overrides});
const failures=[];

const fallbackRain=precipitationParts(sample({code:3,precipitation:.8,rain:.8,probability:80}));
if(fallbackRain.type!=='rain')failures.push(`Fallback-Regen nicht erkannt: ${fallbackRain.type}`);
if(fallbackRain.displayCode!==61)failures.push(`Fallback-Regen erhält keinen Regensymbolcode: ${fallbackRain.displayCode}`);

const hours=Array.from({length:7},(_,index)=>({code:index===3?3:0,probability:index===3?85:0,isDay:true}));
const parts=hours.map((_,index)=>precipitationParts(sample(index===3?{code:3,precipitation:1.2,rain:1.2,probability:85}:{code:0})));
const points=representativeDetailPictograms([0,2,4,6],hours,parts);
if(!points.some(point=>point.sourceIndex===3&&[61,63,65].includes(point.displayCode)))failures.push(`Kurzes Regenereignis wird von den ausgedünnten Piktogrammen übersprungen: ${JSON.stringify(points)}`);

const dryHours=Array.from({length:5},(_,index)=>({code:index===2?3:0,probability:0,isDay:true}));
const dryParts=dryHours.map(hour=>precipitationParts(sample({code:hour.code})));
const dryPoints=representativeDetailPictograms([0,2,4],dryHours,dryParts);
if(!dryPoints.some(point=>point.sourceIndex===2&&point.displayCode===3))failures.push('Trockene bedeckte Wetterlage wird nicht beibehalten.');

await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Detailpiktogramm-/Niederschlagsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Detailpiktogramme geprüft: Stundenmengen des vorangegangenen Intervalls erzeugen passende Niederschlagssymbole; kurze Niederschlagsereignisse werden beim responsiven Ausdünnen nicht übersprungen.');
