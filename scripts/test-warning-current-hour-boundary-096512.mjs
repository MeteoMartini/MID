import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [weather,warningSource]=await Promise.all([readFile('src/weather.ts','utf8'),readFile('src/dwdWarnings.ts','utf8')]);
const failures=[];
if(!weather.includes('const start=warningCurrentStartIndex(h)'))failures.push('hazards() verwendet nicht den laufenden Stundenintervall-Start.');
if(!warningSource.includes('export function warningCurrentStartIndex'))failures.push('warningCurrentStartIndex fehlt.');

const compileDir=await mkdtemp(path.join(tmpdir(),'mid-warning-hour-boundary-'));
try{
 const compile=spawnSync('tsc',['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/dwdWarnings.ts')],{encoding:'utf8'});
 if(compile.status!==0)failures.push(`TypeScript: ${compile.stdout||compile.stderr}`);
 else{
  const module=await import(`${pathToFileURL(path.join(compileDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
  const base=Date.parse('2026-08-24T20:00:00Z'); // 22:00 Europe/Athens/CEST example independent of display zone
  const samples=Array.from({length:14},(_,index)=>({epoch:base+index*3600000,temperature:25,apparent:index===0?34:30,gust:0,precipitation:0,rain:0,showers:0,snowfall:0,code:0,visibility:20000}));
  const at2231=base+31*60000;
  const startIndex=module.warningCurrentStartIndex(samples,at2231);
  if(startIndex!==0)failures.push(`22:31 muss weiterhin den 22:00-Stundenwert verwenden, erhalten: ${startIndex}`);
  if(module.warningCurrentStartIndex(samples,base+59*60000)!==0)failures.push('22:59 darf nicht vorzeitig auf 23:00 springen.');
  if(module.warningCurrentStartIndex(samples,base+60*60000)!==1)failures.push('Ab 23:00 muss der 23:00-Stundenwert aktiv sein.');
  const currentSummary=module.summarizeDwdWarnings(samples.slice(startIndex),0,24);
  const heat=currentSummary.find(item=>item.kind==='heat');
  if(!heat)failures.push('Die um 22:31 noch aktive Wärmebelastung wurde aus dem Warnhorizont verloren.');
  else{
   const from=Date.parse(String(heat.validFrom??'')),to=Date.parse(String(heat.validTo??''));
   if(!(from<=at2231&&to>at2231))failures.push(`Aktives Warnintervall deckt 22:31 nicht ab: ${heat.validFrom} – ${heat.validTo}`);
  }
 }
}finally{await rm(compileDir,{recursive:true,force:true})}

if(failures.length){console.error('Warnstunden-Grenzregression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Warnstunden geprüft: Eine laufende Stundenwarnung bleibt bis zum tatsächlichen Stundenende aktuell; kein Umschalten auf die nächste Prognosestunde nach :30.');
