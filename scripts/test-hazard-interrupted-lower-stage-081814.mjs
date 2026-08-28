import {rm,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.hazard-interrupted-lower-stage-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['src/dwdWarnings.ts','--target','ES2022','--module','ES2022','--moduleResolution','Bundler','--strict','--noUnusedLocals','--noUnusedParameters','--skipLibCheck','--outDir','.hazard-interrupted-lower-stage-test'],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {summarizeDwdWarnings,formatDwdWarningValue}=await import(`${pathToFileURL(path.join(outDir,'dwdWarnings.js')).href}?v=${Date.now()}`);
const [warnings,pkg,baseline]=await Promise.all([
 readFile(path.join(root,'src','dwdWarnings.ts'),'utf8'),
 readFile(path.join(root,'package.json'),'utf8'),
 readFile(path.join(root,'MID_BASELINE.json'),'utf8')
]);
const failures=[];
const start=Date.parse('2026-07-30T00:00:00Z');
const heatSamples=Array.from({length:40},(_,index)=>({
 time:new Date(start+index*3600000).toISOString(),epoch:start+index*3600000,temperature:24,
 apparent:(index>=11&&index<15)||(index>=17&&index<21)?38:index>=15&&index<17?39:25,
 precipitation:0,rain:0,showers:0,snowfall:0,gust:0,direction:270,code:0,visibility:10000
}));
const heat=summarizeDwdWarnings(heatSamples,0,24).filter(signal=>signal.kind==='heat');
const strong=heat.find(signal=>signal.title==='Starke Wärmebelastung');
const extreme=heat.find(signal=>signal.title==='Extreme Wärmebelastung');
if(heat.length!==2)failures.push(`Erwartet wurden zwei Wärmewarnkarten, erhalten: ${heat.map(signal=>`${signal.title} ${signal.validFrom}–${signal.validTo}`).join(', ')}`);
if(!strong)failures.push('Einrahmende niedrigere Wärmewarnung fehlt.');
else{
 if(strong.validFrom!=='2026-07-30T11:00:00.000Z'||strong.validTo!=='2026-07-30T21:00:00.000Z')failures.push(`Niedrigere Wärmewarnung wurde nicht zu 11:00–21:00 zusammengeführt: ${strong.validFrom}–${strong.validTo}`);
 if(!strong.lowerIntensity)failures.push('Einrahmende Wärmewarnung ist nicht als niedrigere Stufe gekennzeichnet.');
 if(formatDwdWarningValue(strong)!=='32 °C')failures.push(`Pille der niedrigeren Wärmewarnstufe ist nicht an deren Schwelle gebunden: ${formatDwdWarningValue(strong)}`);
}
if(!extreme||extreme.validFrom!=='2026-07-30T15:00:00.000Z'||extreme.validTo!=='2026-07-30T17:00:00.000Z')failures.push(`Höhere Wärmewarnung hat falschen Zeitraum: ${extreme?.validFrom}–${extreme?.validTo}`);
else if(formatDwdWarningValue(extreme)!=='39 °C')failures.push(`Pille der höchsten Wärmewarnstufe darf den tatsächlichen Spitzenwert behalten: ${formatDwdWarningValue(extreme)}`);

const changedSamples=Array.from({length:40},(_,index)=>({
 time:new Date(start+index*3600000).toISOString(),epoch:start+index*3600000,temperature:24,
 apparent:index>=11&&index<15?37:index>=15&&index<17?39:index>=17&&index<21?38:25,
 precipitation:0,rain:0,showers:0,snowfall:0,gust:0,direction:270,code:0,visibility:10000
}));
const changedLow=summarizeDwdWarnings(changedSamples,0,24).filter(signal=>signal.kind==='heat'&&signal.title==='Starke Wärmebelastung');
if(changedLow.length!==2)failures.push(`Inhaltlich unterschiedliche niedrigere Warnphasen wurden fälschlich zusammengeführt: ${changedLow.map(signal=>`${signal.value} °C ${signal.validFrom}–${signal.validTo}`).join(', ')}`);

for(const token of ['function warningContentMatches(a:DwdWarningSignal,b:DwdWarningSignal)','function higherWarningCoversGap(','function mergeInterruptedLowerWarnings(signals:DwdWarningSignal[])','const consolidated=mergeInterruptedLowerWarnings(summarized);'])if(!warnings.includes(token))failures.push(`Zusammenführungslogik fehlt: ${token}`);
if(!pkg.includes('test:hazard-interrupted-lower-stage'))failures.push('Package-Testeintrag fehlt.');
if(!baseline.includes('scripts/test-hazard-interrupted-lower-stage-081814.mjs'))failures.push('Baseline-Testeintrag fehlt.');
await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Unterbrochene Warnstufenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Unterbrochene Warnstufen geprüft: identische niedrigere Warnphasen werden über die eingebettete höhere Stufe zu einem einrahmenden Zeitraum verbunden; inhaltlich unterschiedliche Phasen bleiben getrennt.');
