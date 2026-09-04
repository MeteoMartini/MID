import {rm,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.hazard-hour-direction-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['--ignoreConfig','src/dwdWarnings.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir','.hazard-hour-direction-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {summarizeDwdWarnings,formatDwdWarningDetailWithDirection}=await import(`${pathToFileURL(path.join(outDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
const [warnings,weather,pkg,baseline]=await Promise.all([
 readFile(path.join(root,'src','dwdWarnings.ts'),'utf8'),
 readFile(path.join(root,'src','weather.ts'),'utf8'),
 readFile(path.join(root,'package.json'),'utf8'),
 readFile(path.join(root,'MID_BASELINE.json'),'utf8')
]);
const failures=[];
const hour=(clock,direction,gust=54/1.852)=>({time:`2026-07-30T${clock}:00`,epoch:Date.parse(`2026-07-30T${clock}:00:00Z`),temperature:18,apparent:18,precipitation:0,rain:0,showers:0,snowfall:0,gust,direction,code:0,visibility:10000});
const steady=summarizeDwdWarnings([hour('15',270),hour('16',275),hour('17',280)]).find(signal=>signal.kind==='wind');
if(!steady)failures.push('Windwarnung aus echten Hour.direction-Daten fehlt.');
else if(formatDwdWarningDetailWithDirection(steady)!=='Windböen bis 29 kt (54 km/h) aus westlicher Richtung.')failures.push(`Hour.direction wird nicht in den Text übernommen: ${formatDwdWarningDetailWithDirection(steady)}`);
const turning=summarizeDwdWarnings([hour('14',225,70/1.852),hour('15',230,70/1.852),hour('16',315,70/1.852),hour('17',320,70/1.852)]).find(signal=>signal.kind==='wind');
if(!turning)failures.push('Windwarnung mit Richtungswechsel aus Hour.direction fehlt.');
else if(formatDwdWarningDetailWithDirection(turning)!=='Sturmböen bis 38 kt (70 km/h); anfangs aus südwestlicher, später aus nordwestlicher Richtung.')failures.push(`Hour.direction-Richtungswechsel falsch: ${formatDwdWarningDetailWithDirection(turning)}`);
for(const token of ['direction?:number;','rawWindDirection=Number.isFinite(Number(sample.windDirection))?Number(sample.windDirection):Number.isFinite(Number(sample.direction))?Number(sample.direction):Number.NaN'])if(!warnings.includes(token))failures.push(`Richtungskompatibilität fehlt: ${token}`);
if(!weather.includes('text:formatDwdWarningDetailWithDirection(signal,unit)'))failures.push('Warnkarte verwendet nicht den Inline-Richtungstext.');
if(!pkg.includes('test:hazard-hour-direction'))failures.push('Package-Testeintrag fehlt.');
if(!baseline.includes('scripts/test-hazard-hour-direction-08189.mjs'))failures.push('Baseline-Testeintrag fehlt.');
await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Hour-Windrichtungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Hour-Windrichtungsprüfung bestanden: reale Hour.direction-Werte erscheinen direkt im Warntext, einschließlich markanter Drehung.');
